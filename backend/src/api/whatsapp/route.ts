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

// Inicializar el cliente de Twilio para enviar respuestas más tarde
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// CORRECCIÓN 1: Usar el nombre de la variable de entorno correcto que tenías
const twilioNumber = process.env.TWILIO_NUMBER;

const twilioClient = twilio(accountSid, authToken);

type TwilioRequestBody = {
  Body: string;
  From: string;
};

// Esta es la nueva función asíncrona que contendrá toda la lógica de OpenAI.
// La llamaremos después de responder a Twilio.
const processWhatsAppMessage = async (
  userId: string,
  incomingMsg: string
) => {
  let threadId = userThreads[userId];

  try {
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      userThreads[userId] = threadId;
      console.log(`➕ Creando nuevo thread para ${userId}: ${threadId}`);
    } else {
      console.log(`🔗 Usando thread existente para ${userId}: ${threadId}`);
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: incomingMsg,
    });
    console.log(`💬 Mensaje añadido al thread: "${incomingMsg}"`);

    const productKeywords = ['vinilo', 'repuesto', 'batería', 'recambio', 'producto', 'rueda'];
    const shouldForceFileSearch = productKeywords.some(keyword => incomingMsg.includes(keyword));

    let runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
    };

    if (shouldForceFileSearch) {
      runOptions.tool_choice = { type: 'file_search' };
      console.log("🔎 Forzando el uso de la herramienta 'file_search' para la búsqueda de productos.");
    }

    let run = await openai.beta.threads.runs.create(threadId, runOptions);
    console.log("🤖 Ejecutando asistente...");

    while (run.status !== "completed") {
      if (run.status === "failed") {
        const errorMessage = run.last_error?.message || "Error desconocido";
        throw new Error(`❌ Run fallido: ${errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      run = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });
    }

    console.log("✅ Run completado.");

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

    // CORRECCIÓN 2: Asegurarse de que el número de origen tenga el prefijo 'whatsapp:'
    await twilioClient.messages.create({
      to: userId,
      from: 'whatsapp:' + twilioNumber,
      body: aiMessage,
    });
  } catch (err) {
    console.error("❌ ERROR en proceso asíncrono:", err);
    // En caso de error, es buena práctica notificar al usuario.
    // También puedes borrar el thread si el error es grave.
    // El prefijo 'whatsapp:' también es necesario aquí.
    await twilioClient.messages.create({
      to: userId,
      from: 'whatsapp:' + twilioNumber,
      body: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
    });
  }
};

// --- EL ENDPOINT PRINCIPAL AHORA RESPONDE RÁPIDO ---
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");

  // Verificación de la solicitud, igual que antes.
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

    // Llama a la función de procesamiento, pero no la espera.
    processWhatsAppMessage(userId, incomingMsg);

    // Envía una respuesta inmediata a Twilio para evitar el timeout.
    return res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    // Devuelve un 500 para indicar que el webhook ha fallado
    return res.status(500).send('<Response></Response>');
  }
};