// ** LÍNEA DE DEPURACIÓN AÑADIDA PARA VERIFICAR QUE EL ARCHIVO SE CARGA **
console.log("✅ El archivo src/api/whatsapp/route.ts se está cargando.");

import OpenAI from "openai";
import twilio from "twilio";
import rawProducts from "./data/productos.json";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assistantPrompt } from "./prompts/assistant-prompt";

// Tipo de producto
type Product = {
  name: string;
  price: number;
  description: string;
};

// Mapeo del JSON
const products: Product[] = (rawProducts as any[]).map((rawProduct) => ({
  name: rawProduct.Nombre,
  price: parseFloat(rawProduct.PrecioNormal),
  description: rawProduct.Descripcion,
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TwilioRequestBody = {
  Body: string;
  From: string;
};

// Historial en memoria (usá una base de datos en producción)
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

    let responseText = "";

    const foundProduct = products.find((p) =>
      p.name && incomingMsg.includes(p.name.toLowerCase())
    );

    if (foundProduct) {
      responseText = `📦 Producto: ${foundProduct.name}\n💵 Precio: $${foundProduct.price}\n📄 Descripción: ${foundProduct.description}`;
    } else {
      console.log("🤖 Consultando OpenAI...");

      // Inicializa historial si no existe
      if (!conversations[userId]) {
        conversations[userId] = [
          { role: "system", content: assistantPrompt },
        ];
      }

      // Agrega el mensaje del usuario
      conversations[userId].push({
        role: "user",
        content: incomingMsg,
      });

      // Limita historial (por ejemplo, los últimos 10 mensajes)
      if (conversations[userId].length > 20) {
        conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-19)];
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: conversations[userId],
      });

      const aiMessage = completion.choices[0].message.content || "No entendí tu mensaje.";

      // Guarda la respuesta de la IA en el historial
      conversations[userId].push({
        role: "assistant",
        content: aiMessage,
      });

      responseText = aiMessage;
    }

    twiml.message(responseText);
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
