import OpenAI from "openai";
import twilio from "twilio";
import rawProducts from "./data/productos.json";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assistantPrompt } from "./prompts/assistant-prompt";

type Product = {
  name: string;
  price: number;
  description: string;
};

const products: Product[] = rawProducts as Product[];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TwilioRequestBody = {
  Body: string;
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");
  
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const body = req.body as TwilioRequestBody;
    
    // Validamos que el campo `Body` exista en el cuerpo de la solicitud
    if (!body.Body) {
      console.error("❌ Error: 'Body' no encontrado en el cuerpo de la solicitud.");
      return res.status(400).send({
        code: "invalid_request",
        message: "Cuerpo de solicitud inválido. Falta el campo 'Body'.",
      });
    }

    console.log("📨 Body recibido:", body);

    const incomingMsg = body.Body.toLowerCase();
    console.log("🔍 Mensaje entrante:", incomingMsg);

    let responseText = "";
    
    // **CORRECCIÓN:** Añadimos una verificación para `p.name`
    // antes de llamar a `.toLowerCase()` para evitar el error.
    const foundProduct = products.find((p) =>
      p.name && incomingMsg.includes(p.name.toLowerCase())
    );

    if (foundProduct) {
      responseText = `📦 Producto: ${foundProduct.name}\n💵 Precio: $${foundProduct.price}\n📄 Descripción: ${foundProduct.description}`;
    } else {
      console.log("🤖 Consultando OpenAI...");

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: assistantPrompt,
          },
          {
            role: "user",
            content: incomingMsg,
          },
        ],
      });

      console.log("✅ OpenAI respondió");

      responseText = completion.choices[0].message.content || "No entendí tu mensaje.";
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