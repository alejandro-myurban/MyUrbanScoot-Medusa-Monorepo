import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import ChatHistoryService from "modules/chat-history/service";
import { sendWhatsApp, sendWhatsAppTemplate } from "api/whatsapp/route";

interface SendMessageBody {
  message: string;
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("➡️ [BACKEND: POST /admin/send-message] Solicitud recibida.");

  try {
    const userId = req.params.userId;
    const { message } = req.body as SendMessageBody;

    if (!userId || !message) {
      console.error("❌ [BACKEND] Validación fallida. userId o message faltantes.");
      return res.status(400).send({
        message: "user_id y message son requeridos."
      });
    }

    // 2. Resuelve el servicio de historial de chat de Medusa
    const chatService = req.scope.resolve("chat_history") as ChatHistoryService;

    // // Lógica para enviar mensaje según la ventana de 24 horas - COMENTADA
    // // Obtener la fecha del último mensaje del usuario
    // const lastUserMessageDate = await chatService.getLastMessageDate(userId);
    // const now = new Date();
    // const hoursElapsed = (now.getTime() - lastUserMessageDate.getTime()) / (1000 * 60 * 60);

    // // Si han pasado más de 24 horas, intenta enviar la plantilla
    // if (hoursElapsed > 24) {
    //   // El segundo parámetro es el ID de la plantilla.
    //   // El tercer parámetro es el mensaje de "fallback" si la plantilla falla.
    //   await sendWhatsAppTemplate(userId, 'HXf8c3a0533779893f37cbdc48b11e84a4', message);
    // } else {
    //   // Si no han pasado 24 horas, envía un mensaje normal
    //   await sendWhatsApp(userId, message);
    // }

    await sendWhatsApp(userId, message);


    await chatService.saveMessage({
      user_id: userId,
      message: message,
      role: "assistant", 
      status: "AGENTE", 
    });

    return res.status(200).send({ success: true, message: "Mensaje procesado." });

  } catch (err) {
    console.error("❌ [BACKEND] Error al enviar el mensaje desde el dashboard:", err);
    return res.status(500).send({ success: false, message: "Error interno del servidor." });
  }
};
