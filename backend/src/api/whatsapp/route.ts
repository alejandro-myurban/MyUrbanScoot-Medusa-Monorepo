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

const BRANDS = [
  "xiaomi",
  "smartgyro",
  "cecotec",
  "dualtron",
  "ninbot",
  "kugoo",
  "kugookirin",
  "inokim",
  "mercane",
  "kaabo",
];

// Palabras clave
const VINILO_KEYWORDS = ["vinilo", "vinilos", "sticker", "pegatina"];
const MEJORA_KEYWORDS = ["mejorar", "mejora", "modificar", "tunear", "empepinar", "upgrade"];
const PRODUCT_KEYWORDS = ["repuesto", "batería", "bateria", "recambio", "producto", "rueda", "ruedas", "carga", "cargador"];

// Detecta brand y model simples en el texto. Devuelve {brand, model} o null
const detectBrandAndModel = (text: string): { brand?: string; model?: string } | null => {
  for (const brand of BRANDS) {
    const brandIdx = text.indexOf(brand);
    if (brandIdx !== -1) {
      const after = text.slice(brandIdx + brand.length).trim();
      if (after.length === 0) {
        return { brand };
      }
      const tokens = after.split(/\s+/).slice(0, 4);
      const possibleModel = tokens.join(" ").replace(/[?¡!,.]/g, "").trim();
      return { brand, model: possibleModel || undefined };
    }
  }
  return null;
};

// Envia mensaje via Twilio WhatsApp (wrapper)
const sendWhatsApp = async (to: string, body: string) => {
  const MAX_TWILIO_MESSAGE_LENGTH = 1600;
  const messagesToSend = [];

  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  if (body.length > MAX_TWILIO_MESSAGE_LENGTH) {
    let currentMessage = "";
    const words = body.split(' ');
    for (const word of words) {
      if ((currentMessage + ' ' + word).length <= MAX_TWILIO_MESSAGE_LENGTH) {
        currentMessage += (currentMessage.length > 0 ? ' ' : '') + word;
      } else {
        messagesToSend.push(currentMessage);
        currentMessage = word;
      }
    }
    if (currentMessage.length > 0) {
      messagesToSend.push(currentMessage);
    }
  } else {
    messagesToSend.push(body);
  }

  for (const msg of messagesToSend) {
    try {
      await twilioClient.messages.create({
        to: whatsappTo,
        from: "whatsapp:" + twilioNumber,
        body: msg,
      });
    } catch (err) {
      console.error("Error enviando WhatsApp:", err);
    }
  }
};

const processWhatsAppMessage = async (userId: string, incomingMsgRaw: string) => {
  const incomingMsg = incomingMsgRaw.trim().toLowerCase();
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

    // --- Lógica del "Disparador" ---
    // En base a la detección, creamos una instrucción específica para el asistente.
    let instructions: string | undefined = undefined;
    const hasVinilo = VINILO_KEYWORDS.some(k => incomingMsg.includes(k));
    const hasMejora = MEJORA_KEYWORDS.some(k => incomingMsg.includes(k));
    const hasProduct = PRODUCT_KEYWORDS.some(k => incomingMsg.includes(k));
    const brandModel = detectBrandAndModel(incomingMsg);

    // CASO 1: Vinilos
    if (hasVinilo) {
      const brand = brandModel?.brand ?? "sin marca";
      const model = brandModel?.model ?? "sin modelo";
      console.log(`🔎 Detectado vinilos para marca+modelo: ${brand} ${model}`);
      instructions = `El usuario ha solicitado "vinilos". Aplica la 'REGLA ESPECIAL VINILOS' del prompt. El input es: "${incomingMsg}". La marca detectada es "${brand}" y el modelo es "${model}". Si falta el modelo, pídelo siguiendo la regla.`;
    }

    // CASO 2: Mejoras
    else if (hasMejora) {
      const brand = brandModel?.brand ?? "sin marca";
      const model = brandModel?.model ?? "sin modelo";
      console.log(`🔧 Detectado mejoras para marca+modelo: ${brand} ${model}`);
      instructions = `El usuario ha solicitado "mejoras". Aplica la 'REGLA ESPECIAL MEJORAS' del prompt. El input es: "${incomingMsg}". La marca detectada es "${brand}" y el modelo es "${model}". Si no hay modelo, busca en 'Zona Circuito' general.`;
    }

    // CASO 3: Búsqueda de productos genérica
    else if (hasProduct) {
      const brand = brandModel?.brand ?? "sin marca";
      const model = brandModel?.model ?? "sin modelo";
      console.log(`🔎 Búsqueda de producto para ${brand} ${model}`);
      instructions = `El usuario ha solicitado un producto. Aplica la 'Opción 1: Estoy buscando un producto' del prompt. El input es: "${incomingMsg}". La marca detectada es "${brand}" y el modelo es "${model}". Usa la herramienta 'file_search' para buscar los productos más vendidos que se ajusten a la petición.`;
    }

    // CASO 4: Consulta general (sección de Opciones 1-5)
    else {
      console.log("ℹ️ Mensaje general: delegando al assistant sin forzar file_search.");
      instructions = `El usuario escribió: "${incomingMsg}". Identifica su intención según las opciones del prompt (1 a 5) o responde de forma general. Usa la herramienta 'file_search' solo si es necesario para una búsqueda de productos.`;
    }

    // Ejecutar el run con las instrucciones personalizadas
    const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
      instructions: instructions,
    };

    await runAssistantRunAndReply(threadId, runOptions, userId);
    return;

  } catch (err) {
    console.error("❌ ERROR en proceso asíncrono:", err);
    await sendWhatsApp(userId, "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.");
  }
};

// Helper: ejecuta el run en Threads y envía la respuesta por Twilio
const runAssistantRunAndReply = async (
  threadId: string,
  runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams,
  userId: string
) => {
  try {
    let run = await openai.beta.threads.runs.create(threadId, runOptions) as OpenAI.Beta.Threads.Runs.Run;
    console.log("🤖 Run creado, esperando finalización...");

    while (run.status !== "completed") {
      if (run.status === "failed") {
        const errorMessage = run.last_error?.message || "Error desconocido en run";
        throw new Error(errorMessage);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    }

    console.log("✅ Run completado. Obteniendo mensajes...");

    const messages = await openai.beta.threads.messages.list(threadId, {
      order: "desc",
      limit: 1,
    });

    let aiMessage = "Lo siento, no pude encontrar una respuesta.";
    const lastMessage = messages.data[0];

    if (lastMessage && lastMessage.content?.[0]?.type === "text") {
      aiMessage = lastMessage.content[0].text.value;
    }

    await sendWhatsApp(userId, aiMessage);
  } catch (err) {
    console.error("❌ Error ejecutando runAssistantRunAndReply:", err);
    await sendWhatsApp(userId, "Error buscando productos — inténtalo de nuevo o contacta con Alex: +34 620 92 99 44.");
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
    const incomingMsg = Body.trim();

    processWhatsAppMessage(userId, incomingMsg);

    return res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    return res.status(500).send("<Response></Response>");
  }
};