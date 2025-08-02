import OpenAI from "openai";
import twilio from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assistantPrompt } from "./prompts/assistant-prompt";

type Product = {
  name: string;
  price: number;
  description: string;
};

// 📡 Función para obtener productos desde WooCommerce (este código está bien)
// 📡 Función para obtener productos desde WooCommerce (con más logs y timeout)
async function fetchProductsFromWoo(): Promise<Product[]> {
  console.log("📡 Llamando a la API de WooCommerce...");
  const url = process.env.WC_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY; 
  const consumerSecret = process.env.WC_CONSUMER_KEY_S;

  if (!url || !consumerKey || !consumerSecret) {
    console.error("❌ ERROR: Faltan variables de entorno para la API de WooCommerce.");
    throw new Error("Configuración de WooCommerce incompleta.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  // Añadimos un timeout de 10 segundos para evitar que se cuelgue
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); 

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      signal: controller.signal, // Agregamos el timeout
    });

    clearTimeout(timeoutId);

    console.log(`✅ Respuesta de la API recibida con estado: ${res.status}`);

    if (!res.ok) {
      // Si la respuesta no es 200, muestra el error específico de la API
      const errorText = await res.text();
      console.error(`❌ Error de la API de WooCommerce (Estado: ${res.status}): ${errorText}`);
      throw new Error(`Error al obtener productos: ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`📦 Productos obtenidos: ${data.length}`);

    return data.map((p: any) => ({
      name: p.name,
      price: parseFloat(p.price),
      description: p.description || "Sin descripción.",
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("❌ ERROR: La llamada a la API de WooCommerce ha excedido el tiempo de espera (10 segundos).");
    } else {
      console.error(`❌ ERROR al llamar a la API de WooCommerce: ${error}`);
    }
    throw error;
  }
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TwilioRequestBody = {
  Body: string;
  From: string;
};

const conversations: Record<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]> = {};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    if (!req.body) {
      return res.status(400).send({ code: "invalid_request", message: "Cuerpo vacío." });
    }

    const body = req.body as TwilioRequestBody;
    if (!body.Body || !body.From) {
      return res.status(400).send({ code: "invalid_request", message: "Faltan campos obligatorios." });
    }

    const incomingMsg = body.Body.toLowerCase();
    const userId = body.From;

    console.log("🔍 Mensaje entrante:", incomingMsg);

    // 🔄 Obtenemos los productos desde WooCommerce
    const products = await fetchProductsFromWoo();

    // 💡 SOLUCIÓN: Filtramos por palabras clave en lugar de la frase completa
    const keywords = incomingMsg.split(/\s+/).filter(Boolean); // Divide el mensaje en palabras clave

    const relevantProducts = products.filter(p => {
        const nameAndDescription = (p.name + " " + p.description).toLowerCase();
        return keywords.every(keyword => nameAndDescription.includes(keyword));
    });

    let productContext = "";
    if (relevantProducts.length > 0) {
      productContext = relevantProducts
        .slice(0, 5)
        .map(p => `Producto: ${p.name}, Precio: ${p.price}, Descripción: ${p.description}`)
        .join("\n");
    }

    // Inicializamos la conversación si no existe
    if (!conversations[userId]) {
      conversations[userId] = [
        { role: "system", content: assistantPrompt },
      ];
    }
    
    // Añadimos el contexto de los productos al inicio del mensaje del usuario
    const userMessageWithContext = `
    Información de productos relevantes de WooCommerce:
    ${productContext || 'No se encontraron productos relevantes en WooCommerce.'}

    Mensaje del cliente: "${incomingMsg}"
    `;

    conversations[userId].push({
      role: "user",
      content: userMessageWithContext,
    });

    if (conversations[userId].length > 20) {
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-19)];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversations[userId],
    });

    const aiMessage = completion.choices[0].message.content || "No entendí tu mensaje.";

    conversations[userId].push({
      role: "assistant",
      content: aiMessage,
    });

    twiml.message(aiMessage);
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send({
      code: "internal_error",
      message: "Error procesando el mensaje.",
      detail: err instanceof Error ? err.message : err,
    });
  }
};