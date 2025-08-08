import OpenAI from "openai";
import twilio from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

// Este mapa guarda los IDs de los 'threads' de OpenAI para cada usuario,
// manteniendo el contexto de la conversación.
const userThreads: Record<string, string> = {};

// Inicializa el cliente de OpenAI.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ID de tu asistente de OpenAI.
const assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";

// Configura el cliente de Twilio para enviar respuestas asíncronas.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const twilioClient = twilio(accountSid, authToken);

// Define el tipo de datos esperado del cuerpo de la solicitud de Twilio.
type TwilioRequestBody = {
  Body: string;
  From: string;
};

const processWhatsAppMessage = async (
  req: MedusaRequest,
  userId: string,
  incomingMsg: string
) => {
  try {
    console.log(`🔍 Procesando mensaje de ${userId}: "${incomingMsg}"`);
    
    // Resuelve el servicio de productos de Medusa.
    const productService = req.scope.resolve("productService") as any;

    // Busca productos en la base de datos de Medusa usando el mensaje como consulta.
    const [products] = await productService.listAndCount(
      { q: incomingMsg, status: ["published"] },
      { take: 5, relations: ["variants.prices"] }
    );

    // Si se encontraron productos, los envía directamente al usuario.
    if (products.length > 0) {
      let productMsg = "✨ ¡Aquí tienes algunos productos que pueden interesarte!\n\n";

      for (const p of products) {
        const price = p.variants?.[0]?.prices?.[0]?.amount;
        const currency = p.variants?.[0]?.prices?.[0]?.currency_code;
        const formattedPrice = price
          ? `${(price / 100).toFixed(2)} ${currency?.toUpperCase()}`
          : "Precio no disponible";
        
        // Asume que la URL de tu tienda es fija y el handle es la parte final del URL del producto.
        const productUrl = `https://tutienda.com/productos/${p.handle}`;

        productMsg += `*${p.title}*\n- Precio: ${formattedPrice}\n- Ver: ${productUrl}\n\n`;
      }

      productMsg += "💡 ¿Buscas algo más específico? Dime el nombre del producto, la marca o el modelo.";

      console.log("📦 Productos encontrados en Medusa, enviando respuesta.");
      await twilioClient.messages.create({
        to: userId,
        from: 'whatsapp:' + twilioNumber,
        body: productMsg,
      });

      return; // Finaliza la ejecución si se encuentra un producto.
    }

    // Si no se encuentran productos en Medusa, se recurre al asistente de OpenAI.
    console.log("🤖 No se encontraron productos, consultando a OpenAI...");
    
    let threadId = userThreads[userId];

    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      userThreads[userId] = threadId;
      console.log(`➕ Creando nuevo thread para ${userId}: ${threadId}`);
    } else {
      console.log(`🔗 Usando thread existente para ${userId}: ${threadId}`);
    }

    // Añade el mensaje del usuario al thread de OpenAI.
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: incomingMsg,
    });
    console.log(`💬 Mensaje añadido al thread: "${incomingMsg}"`);

    // Crea y ejecuta el asistente.
    let run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });
    console.log("🤖 Ejecutando asistente...");

    // Espera a que el asistente complete la ejecución.
    while (run.status !== "completed") {
      if (run.status === "failed") {
        const errorMessage = run.last_error?.message || "Error desconocido";
        throw new Error(`❌ Run fallido: ${errorMessage}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    }

    console.log("✅ Run completado.");

    // Recupera la respuesta del asistente.
    const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 1 });
    let aiMessage = "Lo siento, no pude encontrar una respuesta.";
    const lastMessage = messages.data[0];

    if (lastMessage && lastMessage.content?.[0]?.type === "text") {
      aiMessage = lastMessage.content[0].text.value;
    }

    console.log("➡️ Enviando respuesta de OpenAI a Twilio REST API.");

    // Envía la respuesta generada por OpenAI al usuario.
    await twilioClient.messages.create({
      to: userId,
      from: 'whatsapp:' + twilioNumber,
      body: aiMessage,
    });
  } catch (err) {
    console.error("❌ ERROR en proceso asíncrono:", err);
    // En caso de error, notifica al usuario.
    await twilioClient.messages.create({
      to: userId,
      from: 'whatsapp:' + twilioNumber,
      body: "Lo siento, ha ocurrido un error inesperado al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
    });
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp-new");

  try {
    const { Body, From } = req.body as { Body?: string; From?: string };

    if (!Body || !From) {
      return res.status(400).send({
        code: "invalid_request",
        message: "Cuerpo de la solicitud no válido o faltan campos obligatorios.",
      });
    }

    // Se llama a la función de procesamiento sin esperar su resultado (`await` es omitido).
    processWhatsAppMessage(req, From, Body.trim());

    // Se envía una respuesta inmediata a Twilio para evitar el timeout (200 OK).
    return res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    // En caso de error, devuelve un 500 para indicar que el webhook falló
    return res.status(500).send('<Response></Response>');
  }
};