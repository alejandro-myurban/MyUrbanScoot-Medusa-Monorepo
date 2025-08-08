// src/api/whatsapp.ts

import OpenAI from "openai";
import twilio from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

// Mapa simple para asociar usuarios con sus threads de conversación
const userThreads: Record<string, string> = {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";

// Inicializar el cliente de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const twilioClient = twilio(accountSid, authToken);

type TwilioRequestBody = {
  Body: string;
  From: string;
};

// Función para procesar mensajes
const processWhatsAppMessage = async (userId: string, incomingMsg: string) => {
  let threadId = userThreads[userId];

  try {
    // Crear thread si no existe
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      userThreads[userId] = threadId;
      console.log(`➕ Creando nuevo thread para ${userId}: ${threadId}`);
    } else {
      console.log(`🔗 Usando thread existente para ${userId}: ${threadId}`);
    }

    // Añadir mensaje del usuario al thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: incomingMsg,
    });
    console.log(`💬 Mensaje añadido al thread: "${incomingMsg}"`);

    // Palabras clave para detecciones especiales
    const viniloKeywords = ["vinilo", "vinilos"];
    const mejoraKeywords = ["mejorar", "mejora", "modificar", "tunear", "empepinar"];
    const productKeywords = ["repuesto", "batería", "recambio", "producto", "rueda"];

    // Opciones para ejecutar el asistente
    let runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
    };

    // Detectar VINILOS
    if (viniloKeywords.some(k => incomingMsg.includes(k))) {
      runOptions.tool_choice = { type: "file_search" };
      runOptions.instructions = "Busca productos de tipo 'vinilos' filtrando por la marca y modelo especificado por el usuario.";
      console.log("🔎 Forzando búsqueda de VINILOS con file_search.");
    }

    // Detectar MEJORAS
    if (mejoraKeywords.some(k => incomingMsg.includes(k))) {
      runOptions.tool_choice = { type: "file_search" };
      runOptions.instructions = "Busca productos top ventas en la categoría 'Zona Circuito' compatibles con la marca y modelo mencionados.";
      console.log("🔧 Forzando búsqueda de MEJORAS en 'Zona Circuito' con file_search.");
    }

    // Detectar búsqueda genérica de productos si no es vinilos ni mejoras
    if (productKeywords.some(keyword => incomingMsg.includes(keyword)) && !runOptions.tool_choice) {
      runOptions.tool_choice = { type: "file_search" };
      console.log("🛠 Forzando file_search para búsqueda genérica de productos.");
    }

    // Ejecutar el asistente
    let run = await openai.beta.threads.runs.create(threadId, runOptions);
    console.log("🤖 Ejecutando asistente...");

    // Esperar hasta que se complete el run
    while (run.status !== "completed") {
      if (run.status === "failed") {
        const errorMessage = run.last_error?.message || "Error desconocido";
        throw new Error(`❌ Run fallido: ${errorMessage}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    }

    console.log("✅ Run completado.");

    // Obtener último mensaje de OpenAI
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: "desc",
      limit: 1,
    });

    let aiMessage = "Lo siento, no pude encontrar una respuesta.";
    const lastMessage = messages.data[0];

    if (lastMessage && lastMessage.content?.[0]?.type === "text") {
      aiMessage = lastMessage.content[0].text.value;
    }

    console.log("➡️ Enviando respuesta de OpenAI a Twilio REST API.");

    // Enviar respuesta por WhatsApp
    await twilioClient.messages.create({
      to: userId,
      from: "whatsapp:" + twilioNumber,
      body: aiMessage,
    });
  } catch (err) {
    console.error("❌ ERROR en proceso asíncrono:", err);
    await twilioClient.messages.create({
      to: userId,
      from: "whatsapp:" + twilioNumber,
      body: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
    });
  }
};

// --- ENDPOINT PRINCIPAL ---
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");

  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      !("Body" in req.body) ||
      !("From" in req.body) ||
      typeof req.body.Body !== "string" ||
      typeof req.body.From !== "string"
    ) {
      return res.status(400).send({
        code: "invalid_request",
        message: "Cuerpo de la solicitud no válido o faltan campos obligatorios.",
      });
    }

    const { Body, From } = req.body as TwilioRequestBody;
    const userId = From;
    const incomingMsg = Body.trim().toLowerCase();

    // Procesar mensaje de forma asíncrona
    processWhatsAppMessage(userId, incomingMsg);

    // Respuesta inmediata a Twilio
    return res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    return res.status(500).send("<Response></Response>");
  }
};
