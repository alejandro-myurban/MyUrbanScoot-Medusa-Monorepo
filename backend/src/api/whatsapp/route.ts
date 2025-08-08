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

type TwilioRequestBody = {
  Body: string;
  From: string;
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");
  const twiml = new twilio.twiml.MessagingResponse();

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
    const incomingMsg = Body.trim().toLowerCase(); // Convertir a minúsculas para una mejor detección

    let threadId = userThreads[userId];

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

// --- MODIFICACIÓN CLAVE AQUÍ ---
    // Detectar palabras clave para decidir si forzar la herramienta
    const productKeywords = ['vinilo', 'repuesto', 'batería', 'recambio', 'producto', 'rueda'];
    const shouldForceFileSearch = productKeywords.some(keyword => incomingMsg.includes(keyword));

    let runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
        assistant_id: assistantId,
    };

    // Si detectamos una palabra clave, le decimos al asistente que use la herramienta de búsqueda de archivos
    if (shouldForceFileSearch) {
        // Corrección: Usar el tipo de herramienta directamente, en lugar del tipo 'tool' genérico
        runOptions.tool_choice = { type: 'file_search' };
        console.log("🔎 Forzando el uso de la herramienta 'file_search' para la búsqueda de productos.");
    }
    
    let run = await openai.beta.threads.runs.create(threadId, runOptions);    console.log("🤖 Ejecutando asistente...");

    // Esperar hasta que el run se complete
    while (run.status !== "completed") {
      if (run.status === "failed") {
        const errorMessage = run.last_error?.message || "Error desconocido";
        throw new Error(`❌ Run fallido: ${errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      run = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });

      console.log(`⏳ Estado actual del run: ${run.status}`);
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

    twiml.message(aiMessage);
    console.log("➡️ Enviando respuesta de OpenAI.");

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("❌ ERROR:", err);

    if (
      req.body &&
      typeof req.body === "object" &&
      "From" in req.body &&
      typeof (req.body as any).From === "string"
    ) {
      delete userThreads[(req.body as any).From];
    }

    res.status(500).send({
      code: "internal_error",
      message: "Error procesando el mensaje.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};