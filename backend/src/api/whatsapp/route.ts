import OpenAI from "openai";
import twilio from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

// Mapa simple para asociar usuarios con sus threads de conversación
const userThreads: Record<string, string> = {};

// Estado conversacional por usuario (en memoria). En prod usar Redis/DB.
type UserState = {
  expectingModel?: boolean;
  lastCategory?: string;
  brand?: string;
  // guardamos el timestamp para expirar estados viejos
  updatedAt: number;
};
const userState: Record<string, UserState> = {};

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

// Categorías principales que nos interesan
const CATEGORIES = {
  VINILOS: "vinilos",
  ZONA_CIRCUITO: "zona circuito",
  BATERIAS: "baterias",
  RUEDAS: "ruedas",
  REPUESTOS: "repuestos",
  MEJORAS: "mejoras",
};

// Palabras clave
const VINILO_KEYWORDS = ["vinilo", "vinilos", "sticker", "pegatina"];
const MEJORA_KEYWORDS = ["mejorar", "mejora", "modificar", "tunear", "empepinar", "upgrade"];
const PRODUCT_KEYWORDS = ["repuesto", "batería", "bateria", "recambio", "producto", "rueda", "ruedas", "carga", "cargador"];

// Tiempo (ms) hasta expirar estado de usuario (10 minutos)
const STATE_TTL = 10 * 60 * 1000;

const now = () => Date.now();

const expireOldStates = () => {
  const cutoff = now() - STATE_TTL;
  for (const key of Object.keys(userState)) {
    if (userState[key].updatedAt < cutoff) {
      delete userState[key];
    }
  }
};

// Detecta brand y model simples en el texto. Devuelve {brand, model} o null
const detectBrandAndModel = (text: string): { brand?: string; model?: string } | null => {
  // buscar marca
  for (const brand of BRANDS) {
    const brandIdx = text.indexOf(brand);
    if (brandIdx !== -1) {
      // intentar extraer modelo que siga a la marca: ej "smartgyro k2", "xiaomi m365 pro"
      // capturamos hasta 4 palabras después de la marca como posible modelo
      const after = text.slice(brandIdx + brand.length).trim();
      if (after.length === 0) {
        return { brand };
      }
      // tomar los primeros 4 tokens como posible modelo (luego el assistant será el juez)
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

  // Split message if it's too long
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
        to,
        from: "whatsapp:" + twilioNumber,
        body: msg,
      });
    } catch (err) {
      console.error("Error enviando WhatsApp:", err);
      // Opcional: break the loop if an error occurs to prevent sending more messages
    }
  }
};

const processWhatsAppMessage = async (userId: string, incomingMsgRaw: string) => {
  expireOldStates();
  const incomingMsg = incomingMsgRaw.trim().toLowerCase();

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

    // Guardar mensaje en el thread (para contexto)
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: incomingMsg,
    });
    console.log(`💬 Mensaje añadido al thread: "${incomingMsg}"`);

    // Recuperar estado del usuario
    const state = userState[userId] || { updatedAt: now() };

    // Detecciones rápidas
    const hasVinilo = VINILO_KEYWORDS.some(k => incomingMsg.includes(k));
    const hasMejora = MEJORA_KEYWORDS.some(k => incomingMsg.includes(k));
    const hasProduct = PRODUCT_KEYWORDS.some(k => incomingMsg.includes(k));

    const brandModel = detectBrandAndModel(incomingMsg); // puede traer brand y model o solo brand o null

    // Si ya estamos esperando modelo para vinilos y el usuario responde algo -> interpretamos como modelo
    if (state.expectingModel && state.lastCategory === CATEGORIES.VINILOS) {
      const modelText = incomingMsg; // lo que respondió el usuario
      console.log(`🕒 Usuario ${userId} proporcionó modelo para vinilos: ${modelText}`);

      // Preparar run options para file_search filtrado por vinilos + marca (si existe) + modelo
      const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
        assistant_id: assistantId,
        tool_choice: { type: "file_search" },
        instructions: `Busca los 5 productos con mayor TotalSales de la categoría 'vinilos' para la marca "${state.brand ?? ""}" y el modelo "${modelText}". Devuelve la lista en el formato:
1) [Nombre] - PrecioNormal / PrecioRebajado (si aplica)
Incluye variaciones si las tiene y el enlace a la categoría completa.`,
      };

      // reset estado
      delete userState[userId];

      // Ejecutar run
      await runAssistantRunAndReply(threadId, runOptions, userId);
      return;
    }

    // Si ya estamos esperando modelo para mejoras y el usuario responde -> lanzar Zona Circuito
    if (state.expectingModel && state.lastCategory === CATEGORIES.ZONA_CIRCUITO) {
      const modelText = incomingMsg;
      console.log(`🕒 Usuario ${userId} proporcionó modelo para mejoras: ${modelText}`);

      const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
        assistant_id: assistantId,
        tool_choice: { type: "file_search" },
        instructions: `Busca los 5 productos top ventas en la categoría 'Zona Circuito' compatibles con la marca "${state.brand ?? ""}" y modelo "${modelText}". Devuelve nombre, precio normal y precio rebajado (si aplica), y link al producto.`,
      };

      delete userState[userId];
      await runAssistantRunAndReply(threadId, runOptions, userId);
      return;
    }

    // CASO 1: Mensaje contiene VINILO
    if (hasVinilo) {
      // Si el usuario ya puso marca+modelo explícitos (ej "vinilos smartgyro k2")
      if (brandModel && brandModel.brand && brandModel.model) {
        const brand = brandModel.brand;
        const model = brandModel.model;
        console.log(`🔎 Detectado vinilos para marca+modelo: ${brand} ${model}`);

        const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
          assistant_id: assistantId,
          tool_choice: { type: "file_search" },
          instructions: `Busca los 5 productos con mayor TotalSales dentro de 'vinilos' para marca "${brand}" y modelo "${model}". Formatea la respuesta en lista numerada con Nombre y Precio, muestra variaciones si existen e incluye enlace a la categoría.`,
        };

        await runAssistantRunAndReply(threadId, runOptions, userId);
        return;
      }

      // Si el usuario puso solo marca (ej "vinilos smartgyro") -> pedir modelo y mostrar submodelos
      if (brandModel && brandModel.brand && !brandModel.model) {
        const brand = brandModel.brand;
        console.log(`🟡 Detectado vinilos para marca (sin modelo): ${brand}. Pedimos modelo al usuario.`);

        // Guardamos estado esperando modelo
        userState[userId] = {
          expectingModel: true,
          lastCategory: CATEGORIES.VINILOS,
          brand,
          updatedAt: now(),
        };

        // Intentamos mostrar submodelos comunes para la marca (si la conoces). Si no, pedimos modelo libre.
        // Puedes enriquecer esto con una fuente real de submodelos.
        let submodelsList = "";
        if (brand === "smartgyro") {
          submodelsList = "Smartgyro Rockway / Speedway / Crossover / K2 / Ryder / Dual Max";
        } else if (brand === "xiaomi") {
          submodelsList = "Xiaomi M365 / Pro / 1S / Essential / Pro2 / Mi3 / Mi3 Lite / Mi4 / 4 Ultra";
        } else {
          submodelsList = "Por favor indica el modelo (ej. 'K2', 'Rockway EVO', 'M365').";
        }

        const askModelMsg = `Perfecto 👍. ¿Qué modelo de ${brand} tienes? Tenemos submodelos comunes: ${submodelsList}\n\nEscríbeme el modelo exacto para mostrarte los vinilos más vendidos.`;
        await sendWhatsApp(userId, askModelMsg);
        return;
      }

      // Si no hay marca reconocida, pedimos marca y modelo
      console.log("🟠 Usuario pidió vinilos sin marca clara. Pedimos marca y modelo.");
      userState[userId] = {
        expectingModel: true,
        lastCategory: CATEGORIES.VINILOS,
        updatedAt: now(),
      };
      await sendWhatsApp(userId, `¿De qué marca y modelo necesitas los vinilos? Por ejemplo: "Smartgyro K2" o "Xiaomi M365".`);
      return;
    }

    // CASO 2: Mensaje contiene MEJORAS / TUNING -> Zona Circuito
    if (hasMejora) {
      // Si trae brand+model
      if (brandModel && brandModel.brand && brandModel.model) {
        const brand = brandModel.brand;
        const model = brandModel.model;
        console.log(`🔧 Detectado mejoras para ${brand} ${model} -> Buscando Zona Circuito`);

        const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
          assistant_id: assistantId,
          tool_choice: { type: "file_search" },
          instructions: `Busca los 5 productos top ventas en la categoría 'Zona Circuito' compatibles con la marca "${brand}" y modelo "${model}". Presenta nombre y precios y sugiere el servicio de Recogida+Entrega.`,
        };

        await runAssistantRunAndReply(threadId, runOptions, userId);
        return;
      }

      // Si trae brand pero no modelo -> pedir modelo
      if (brandModel && brandModel.brand && !brandModel.model) {
        const brand = brandModel.brand;
        userState[userId] = {
          expectingModel: true,
          lastCategory: CATEGORIES.ZONA_CIRCUITO,
          brand,
          updatedAt: now(),
        };

        await sendWhatsApp(userId, `Genial — ¿qué modelo de ${brand} quieres tunear? Por ejemplo: "K2", "Rockway EVO", "Mi3". Si no sabes, dime la marca y te muestro opciones.`);
        return;
      }

      // Si no trae marca -> sugerir top ventas generales en Zona Circuito y ofrecer pedir modelo
      console.log("🔧 Mejora solicitada sin marca/modelo -> mostramos top ventas generales en Zona Circuito");
      const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
        assistant_id: assistantId,
        tool_choice: { type: "file_search" },
        instructions: `Busca los 5 productos top ventas en la categoría 'Zona Circuito' (general). Incluye nombre, precio normal y rebajado, y sugiere el servicio de Recogida+Entrega.`,
      };

      await runAssistantRunAndReply(threadId, runOptions, userId);
      return;
    }

    // CASO 3: Mensaje menciona repuestos / baterías / ruedas u otros productos
    if (hasProduct) {
      // Si detectamos brand+model -> búsqueda directa por compatibilidad
      if (brandModel && brandModel.brand && brandModel.model) {
        const brand = brandModel.brand;
        const model = brandModel.model;
        console.log(`🔎 Búsqueda de producto para ${brand} ${model}`);

        const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
          assistant_id: assistantId,
          tool_choice: { type: "file_search" },
          instructions: `Busca los 5 productos más vendidos que coincidan con la consulta "${incomingMsg}" y sean compatibles con marca "${brand}" y modelo "${model}". Devuelve nombre, precio y link.`,
        };

        await runAssistantRunAndReply(threadId, runOptions, userId);
        return;
      }

      // Si solo marca o solo categoría -> pedir aclaración
      if (brandModel && brandModel.brand && !brandModel.model) {
        const brand = brandModel.brand;
        userState[userId] = {
          expectingModel: true,
          lastCategory: CATEGORIES.REPUESTOS,
          brand,
          updatedAt: now(),
        };
        await sendWhatsApp(userId, `Perfecto, ¿para qué modelo de ${brand} necesitas ese repuesto? (Ej: K2, Rockway EVO, M365)`);
        return;
      }

      // Si no hay brand -> simple búsqueda genérica (dejar que assistant decida)
      console.log("🔎 Búsqueda genérica de producto (sin marca/modelo). Dejo que el assistant maneje el file_search.");
      // No forzamos file_search: delegamos al assistant
      const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
        assistant_id: assistantId,
        instructions: `El usuario preguntó: "${incomingMsg}". Decide si usar la herramienta 'file_search' para buscar productos relevantes en productos.json. Si usas file_search filtra por categoría y muestra los 5 más vendidos.`,
      };

      await runAssistantRunAndReply(threadId, runOptions, userId);
      return;
    }

    // CASO 4: Si no cae en ninguno de los anteriores, delegamos al assistant (flujo libre)
    console.log("ℹ️ Mensaje general: delegando al assistant sin forzar file_search.");
    const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
      instructions: `El usuario escribió: "${incomingMsg}". Responde según el prompt maestro de MyUrbanScoot: identifica intención, pregunta datos faltantes y sugiere redirección a myurbanscoot.com. Usa file_search sólo si realmente necesitas buscar productos.`,
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
    // Crea el run. Usamos 'as' para decirle a TypeScript que esperamos un Run.
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

    // Enviar por WhatsApp
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

    // Lanzamos procesamiento async (no await) para responder rápido a Twilio
    processWhatsAppMessage(userId, incomingMsg);

    // Respuesta inmediata a Twilio para evitar timeouts
    return res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    return res.status(500).send("<Response></Response>");
  }
};