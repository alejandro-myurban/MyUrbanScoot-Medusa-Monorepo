// src/api/admin/send-message/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatHistoryService from "modules/chat-history/service"
import { sendWhatsApp } from "api/whatsapp/route"

export const config = {
  api: {
    bodyParser: true,
  },
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("➡️ [BACKEND: POST /admin/send-message] Solicitud recibida.");
  
  const body = req.body as { userId?: string, message?: string, fileUrl?: string };
  const userId = body.userId;
  const message = body.message;
  const fileUrl = body.fileUrl;
  
  console.log("📩 Datos recibidos:", { userId, message, fileUrl });

  if (!userId || (!message && !fileUrl)) {
    console.error("❌ [BACKEND] Validación fallida. userId o (message o fileUrl) faltantes.");
    return res.status(400).send({ message: "userId o (message o fileUrl) son requeridos." });
  }

  try {
    // 1. Enviar a través de WhatsApp (texto + URL del archivo)
    // ✅ CORRECCIÓN: Se pasan ambos valores, incluso si uno es null/undefined
    await sendWhatsApp(userId, message, fileUrl);

    // 2. Guardar en historial de chat
    const chatService = req.scope.resolve("chat_history") as ChatHistoryService;

    let messageToSave = message || "";

    if (fileUrl) {
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
      const isImage = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(fileExtension || '');
      const fileMarker = isImage ? "[Imagen] - " : "[Archivo] - ";
      
      if (messageToSave.length > 0) {
        messageToSave += " ";
      }
      messageToSave += `${fileMarker}${fileUrl}`;
    }

    await chatService.saveMessage({
      user_id: userId,
      message: messageToSave,
      role: "assistant",
      status: "AGENTE",
    });

    console.log("✅ [BACKEND] Mensaje enviado y guardado correctamente.");
    return res.status(200).send({ success: true, message: "Mensaje procesado." });

  } catch (err) {
    console.error("❌ [BACKEND] Error al enviar el mensaje desde el dashboard:", err);
    return res.status(500).send({ success: false, message: "Error interno del servidor." });
  }
};