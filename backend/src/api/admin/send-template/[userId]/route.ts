// src/api/admin/send-template/[user_id]/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatHistoryService from "modules/chat-history/service"
import { sendWhatsAppTemplate } from "api/whatsapp/route"

export const config = {
  api: {
    bodyParser: true,
  },
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("➡️ [BACKEND: POST /admin/send-template] Solicitud recibida.");

  const { userId } = req.params;
  const { templateId } = req.body as { templateId: string };

  console.log("📩 Datos recibidos:", { userId, templateId });

  if (!userId || !templateId) {
    console.error("❌ [BACKEND] Validación fallida. userId o templateId faltantes.");
    return res.status(400).send({ message: "userId y templateId son requeridos." });
  }

  // ✅ Añade el tercer argumento, 'fallbackMessage'.
  // Puedes usar una cadena vacía o un mensaje genérico.
  const fallbackMessage = "No se pudo enviar la plantilla.";

  try {
    await sendWhatsAppTemplate(userId, templateId, fallbackMessage);

    const chatService = req.scope.resolve("chat_history") as any;

    await chatService.saveMessage({
      user_id: userId,
      message: `[Template] - ${templateId}`,
      role: "assistant",
      status: "AGENTE",
    });

    console.log(`✅ Template '${templateId}' enviada a ${userId} y guardada en el historial.`);
    return res.status(200).send({ success: true, message: "Template enviada." });

  } catch (err) {
    console.error("❌ Error al enviar la plantilla de WhatsApp:", err);
    return res.status(500).send({ success: false, message: "Error interno del servidor." });
  }
};