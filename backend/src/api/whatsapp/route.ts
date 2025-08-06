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

const categoryKeywords: { [key: string]: string[] } = {
  "vinilos": ["vinilo", "vinilos", "pegatina", "pegatinas"],
  "patinetes-electricos": ["patinete", "patinetes", "scooter"],
  "recambios": ["recambio", "recambios", "repuesto", "repuestos"],
};

// Define common Spanish stop words to exclude from filtering
const stopWords = new Set([
  "necesito", "para", "mi", "un", "una", "unos", "unas", "el", "la", "los", "las", "y", "o", "pero", "de", "en", "con", "por", "que", "se", "es", "estoy", "buscando", "quiero", "tengo", "dudas", "sobre", "servicio", "informacion", "ayuda", "tecnica", "casa", "hola", "crack", "soy", "el", "asistente", "virtual", "de", "en", "que", "puedo", "ayudarte", "hoy", "gracias", "menu", "opciones", "si", "no", "especifica", "su", "necesidad", "muestra", "este", "escribe", "numero", "opcion", "mejor", "se", "adapte", "lo", "buscas", "aqui", "tienes", "nuestras", "mejores", "opciones", "necesitas", "algo", "mas", "especifico", "dime", "marca", "modelo", "tu", "patinete", "tal", "que", "como", "estas", "buenas", "dias", "tardes", "noches", "saludos" // Added more greetings
]);

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");

  const twiml = new twilio.twiml.MessagingResponse();

  try {
    if (!req.body) {
      return res.status(400).send({ code: "invalid_request", message: "Cuerpo vacío." });
    }

    const body = req.body as TwilioRequestBody;
    const userId = body.From;
    
    // --- NUEVO: Sanitizar el mensaje entrante ---
    let incomingMsg = body.Body?.trim().toLowerCase() || "";
    // Elimina signos de puntuación, exclamaciones, comas, etc.
    incomingMsg = incomingMsg.replace(/[.,!¡¿?]/g, '');

    if (!incomingMsg || !userId) {
      return res.status(400).send({ code: "invalid_request", message: "Faltan campos obligatorios." });
    }

    console.log("🔍 Mensaje entrante:", incomingMsg);

    if (!conversations[userId]) {
      conversations[userId] = [{ role: "system", content: systemPrompt }];
    }

    // --- FILTRADO DE PRODUCTOS POR PALABRAS CLAVE ---
    let filteredProducts = products;

    const keywords = incomingMsg
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // AÑADIDO PARA DEBUGGING
    console.log("🔎 Palabras clave extraídas:", keywords);

    if (keywords.length > 0) {
      filteredProducts = products.filter(product => {
        const hasMatch = (field: string) =>
          keywords.every(kw => field.toLowerCase().includes(kw));

        const name = product.Nombre || "";
        const description = product.Descripcion || "";
        const shortDescription = product.DescripcionCorta || "";
        const variations = product.Variaciones?.map(v => v.Nombre).join(" ") || "";

        const isMatch = (
          hasMatch(name) ||
          hasMatch(description) ||
          hasMatch(shortDescription) ||
          hasMatch(variations)
        );

        // AÑADIDO PARA DEBUGGING
        if (isMatch) {
          console.log(`✅ Producto "${product.Nombre}" coincide con las palabras clave.`);
        }

        return isMatch;
      });
    }

    // AÑADIDO PARA DEBUGGING
    console.log(`📊 Total de productos filtrados: ${filteredProducts.length}`);

    const topProducts = filteredProducts.sort((a, b) => b.TotalSales - a.TotalSales).slice(0, 5);

    console.log("🏆 Productos principales (top 5):", topProducts.map(p => p.Nombre));

    // ✨ SI HAY PRODUCTOS, SE PASAN COMO CONTEXTO A OPENAI (NO SE RESPONDE DIRECTAMENTE)
    if (topProducts.length > 0) {
      const productList = topProducts.map((p, i) => {
        let price: string;
        if (p.Variaciones && p.Variaciones.length > 0) {
          // Si el producto tiene variaciones, tomamos el precio de la primera variación
          const firstVariation = p.Variaciones[0];
          price = firstVariation.PrecioRebajado || firstVariation.PrecioNormal || "Precio no disponible";
        } else {
          // Si no hay variaciones, usamos el precio del producto principal
          price = p.PrecioRebajado || p.PrecioNormal || "Precio no disponible";
        }
        return `${i + 1}. ${p.Nombre} - ${price}€ - ${p.URL}`;
      }).join("\n");

      conversations[userId].push({
        role: "system",
        content: `Productos relevantes encontrados (puedes usarlos para recomendar al usuario si lo creés necesario):\n${productList}`
      });
    }

    // Mensaje del usuario
    conversations[userId].push({ role: "user", content: incomingMsg });

    // Limpiar si se hace muy largo
    if (conversations[userId].length > 7) {
      conversations[userId] = [conversations[userId][0], ...conversations[userId].slice(-6)];
    }

    console.log("🤖 Consultando OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversations[userId],
      max_tokens: 500,
      temperature: 0.4,
      top_p: 0.9,
      presence_penalty: 0.2,
      frequency_penalty: 0.1,
    });

    const aiMessage = completion.choices[0]?.message?.content || "Lo siento, no entendí tu mensaje.";

    conversations[userId].push({
      role: "assistant",
      content: aiMessage,
    });

    twiml.message(aiMessage);
    console.log("➡️ Enviando respuesta de OpenAI.");
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