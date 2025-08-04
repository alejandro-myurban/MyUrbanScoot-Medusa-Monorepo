import OpenAI from "openai";
import twilio from "twilio";
import rawProducts from "./data/productos.json";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { systemPrompt } from "./prompts/assistant-prompt";

type Product = {
  ID: number;
  Nombre: string;
  TotalSales: number;
  PrecioNormal: string;
  PrecioRebajado: string;
  Descripcion: string;
  DescripcionCorta: string;
  URL: string;
  Categorias?: string[];
  Variaciones?: {
    ID: number;
    Nombre: string;
    PrecioNormal: string;
    PrecioRebajado: string;
  }[];
};

const products: Product[] = (rawProducts as any[]).map((rawProduct) => ({
  ID: rawProduct.ID,
  Nombre: rawProduct.Nombre,
  TotalSales: rawProduct.TotalSales,
  PrecioNormal: rawProduct.PrecioNormal,
  PrecioRebajado: rawProduct.PrecioRebajado,
  Descripcion: rawProduct.Descripcion,
  DescripcionCorta: rawProduct.DescripcionCorta,
  URL: rawProduct.URL,
  Categorias: rawProduct.Categorias,
  Variaciones: rawProduct.Variaciones,
}));

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
    const incomingMsg = body.Body?.trim().toLowerCase();
    const userId = body.From;

    if (!incomingMsg || !userId) {
      return res.status(400).send({ code: "invalid_request", message: "Faltan campos obligatorios." });
    }

    console.log("🔍 Mensaje entrante:", incomingMsg);

    const opcionesMenu: Record<string, string> = {
      "1": "Estoy buscando un producto.",
      "2": "Tengo dudas sobre un pedido.",
      "3": "Quiero contratar el servicio de Recogida+Entrega.",
      "4": "Necesito información sobre talleres físicos.",
      "5": "Necesito ayuda técnica para reparar mi patinete en casa.",
    };

    if (opcionesMenu[incomingMsg]) {
      const responseText = `📋 Has seleccionado: ${opcionesMenu[incomingMsg]}\nCuéntame más para ayudarte mejor.`;
      twiml.message(responseText);
      return res.type("text/xml").send(twiml.toString());
    }

    if (!conversations[userId]) {
      conversations[userId] = [{ role: "system", content: systemPrompt }];
    }

    const keywords = incomingMsg.split(/\s+/).filter(word => word.length > 2);
    let filteredProducts = products;

    if (incomingMsg.includes("vinilo") || incomingMsg.includes("vinilos")) {
      filteredProducts = filteredProducts.filter(product =>
        product.Categorias?.some(category => category.toLowerCase().includes("vinilos"))
      );
    }
    // Add more category-specific filtering logic here as needed

    filteredProducts = filteredProducts.filter(product =>
      keywords.some(keyword => product.Nombre.toLowerCase().includes(keyword))
    );

    const topProducts = filteredProducts.sort((a, b) => b.TotalSales - a.TotalSales).slice(0, 5);

    if (topProducts.length > 0) {
      let productResponse = "🚀 ¡Claro, aquí tienes nuestras mejores opciones!\n\n";

      topProducts.forEach(product => {
        const price = product.PrecioRebajado ? `~${product.PrecioNormal}€~ **${product.PrecioRebajado}€**` : `${product.PrecioNormal}€`;
        productResponse += `**${product.Nombre}**\n - Precio: ${price}\n - [Ver producto](${product.URL})\n\n`;
      });
      
      productResponse += `💡 ¿Necesitas algo más específico? Dime la marca o el modelo de tu patinete.`;

      twiml.message(productResponse);
      conversations[userId].push({ role: "assistant", content: productResponse });
      return res.type("text/xml").send(twiml.toString());
    }

    conversations[userId].push({ role: "user", content: incomingMsg });

    if (conversations[userId].length > 7) {
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-6)];
    }

    console.log("🤖 Consultando OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversations[userId],
      max_tokens: 400,
      temperature: 0.4,
      top_p: 0.9,
      presence_penalty: 0.2,
      frequency_penalty: 0.1,
    });

    const aiMessage = completion.choices[0]?.message?.content || "Lo siento, no entendí tu mensaje. Por favor, elige una de las opciones o visita nuestra web myurbanscoot.com";

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