import twilio from "twilio";
import OpenAI from "openai";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { systemPrompt } from "api/whatsapp/prompts/assistant-prompt";

// Historial en memoria por usuario
const conversations: Record<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]> = {};


// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("✅ POST /whatsapp-new");

  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const { Body, From } = req.body as { Body?: string; From?: string };

    if (!Body || !From) {
      twiml.message("Mensaje inválido. Por favor, intenta nuevamente.");
      return res.status(400).type("text/xml").send(twiml.toString());
    }

    const userId = From;
    const incomingMsg = Body.trim().toLowerCase();

    // Inicializar conversación si es nuevo
    if (!conversations[userId]) {
      conversations[userId] = [{ role: "system", content: systemPrompt }];
    }

    // Obtener el servicio de productos
    const productService = req.scope.resolve("productService") as any;

    const [products] = await productService.listAndCount(
      { q: incomingMsg, status: ["published"] },
      { take: 5, relations: ["variants.prices"] }
    );

    if (products.length > 0) {
      let productMsg = "✨ ¡Aquí tienes algunos productos que pueden interesarte!\n\n";

      for (const p of products) {
        const price = p.variants?.[0]?.prices?.[0]?.amount;
        const currency = p.variants?.[0]?.prices?.[0]?.currency_code;
        const formattedPrice = price
          ? `${(price / 100).toFixed(2)} ${currency?.toUpperCase()}`
          : "Precio no disponible";

        const productUrl = `https://tutienda.com/productos/${p.handle}`;

        productMsg += `*${p.title}*\n- Precio: ${formattedPrice}\n- Ver: ${productUrl}\n\n`;
      }

      productMsg += "💡 ¿Buscas algo más específico? Dime el nombre del producto, la marca o el modelo.";

      conversations[userId].push({ role: "assistant", content: productMsg });
      twiml.message(productMsg);

      return res.type("text/xml").send(twiml.toString());
    }

    // Si no hay productos, pasamos al asistente
    conversations[userId].push({ role: "user", content: incomingMsg });

    // Limitar historial para no exceder tokens
    if (conversations[userId].length > 10) {
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-9)];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversations[userId],
      max_tokens: 400,
      temperature: 0.2,
    });

    const aiMessage = completion.choices?.[0]?.message?.content?.trim() || 
      "Lo siento, no entendí tu mensaje.";

    conversations[userId].push({ role: "assistant", content: aiMessage });

    twiml.message(aiMessage);
    return res.type("text/xml").send(twiml.toString());

  } catch (error) {
    console.error("❌ ERROR /whatsapp-new:", error);
    twiml.message("Ha ocurrido un error inesperado. Por favor, intenta más tarde.");
    return res.status(500).type("text/xml").send(twiml.toString());
  }
};
