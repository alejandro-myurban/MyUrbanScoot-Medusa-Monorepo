import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import ChatHistoryService from "modules/chat-history/service";
import { TwilioService } from "./services/twilio.service";
import { OpenAIService } from "./services/openai.service";
import { WhatsAppService } from "./services/whatsapp.service";
import { TwilioWebhookBody } from "./types";
import { TWILIO_TEMPLATES } from "./config/templates";

// Instancias de servicios para manejar las comunicaciones
const twilioService = new TwilioService();
const openaiService = new OpenAIService();
const whatsappService = new WhatsAppService(twilioService, openaiService);

// Funciones exportadas para enviar mensajes de WhatsApp
export const sendWhatsApp = (to: string, body: string, mediaUrl?: string) => 
    whatsappService.sendMessage(to, body, mediaUrl);

export const sendWhatsAppTemplate = (to: string, templateSid: string, fallbackMessage: string, variables?: any) => 
    whatsappService.sendTemplate(to, templateSid, fallbackMessage, variables);

// Handler principal para el webhook de Twilio
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        console.log("Incoming Twilio Webhook Body:", req.body);
        
        // Validación inicial del cuerpo del webhook
        if (!req.body || typeof req.body !== "object" || !("From" in req.body) || typeof req.body.From !== "string") {
            console.warn("⚠️ [VALIDACIÓN] Cuerpo inválido o faltan campos obligatorios");
            return res.status(200).send("<Response></Response>");
        }

        // Extracción de datos del mensaje
        const { Body, From, NumMedia, MediaUrl0, ProfileName, ButtonPayload } = req.body as TwilioWebhookBody & { ButtonPayload?: string };
        const userId = From;
        const incomingMsg = Body ? Body.trim() : "";
        const numMedia = parseInt(NumMedia || "0", 10);
        const mediaUrl = numMedia > 0 ? MediaUrl0 : null;
        
        // Obtención de servicios y preparación de datos
        const chatService = req.scope.resolve("chat_history") as ChatHistoryService;
        const appointmentsService = req.scope.resolve("appointments") as any;
        const profileNameReceived = ProfileName || null;
        const profileName = profileNameReceived || userId.replace("whatsapp:", "");

        let messageToSave;
        if (incomingMsg.length > 0 && numMedia > 0) messageToSave = `${incomingMsg} [Imagen] - ${mediaUrl}`;
        else if (numMedia > 0) messageToSave = `[Imagen] - ${mediaUrl}`;
        else if (incomingMsg.length > 0) messageToSave = incomingMsg;

        if (messageToSave) {
            await chatService.saveMessage({
                user_id: userId,
                message: messageToSave,
                role: "user",
                status: await chatService.getConversationStatus(userId),
                profile_name: profileName,
            });
        }

        const isPersonalAssistanceRequest = incomingMsg.toUpperCase().includes("ASISTENCIA PERSONAL");
        if (numMedia > 0 || isPersonalAssistanceRequest) {
            console.log(`💬 Mensaje de ${profileName} (${userId}) contiene una imagen o solicitud de AGENTE. Cambiando a modo AGENTE.`);
            const confirmationMessage = "Gracias por tu mensaje. Un miembro de nuestro equipo de soporte se pondrá en contacto contigo en breve para ayudarte.";
            await sendWhatsApp(userId, confirmationMessage);
            await chatService.saveMessage({
                user_id: userId,
                message: confirmationMessage,
                role: "assistant",
                status: "AGENTE",
                profile_name: "MyUrbanScoot Bot",
            });
            await chatService.updateConversationStatus(userId, "AGENTE");
            return res.status(200).send("<Response></Response>");
        }

        if (await chatService.getConversationStatus(userId) === "IA" || !await chatService.getConversationStatus(userId)) {
            console.log(`💬 Mensaje de ${profileName} (${userId}) en modo IA. Procesando con el asistente de OpenAI.`);
            await whatsappService.processMessage(userId, incomingMsg, chatService, mediaUrl);
        } else {
            console.log(`💬 Mensaje de ${profileName} (${userId}) en modo ${await chatService.getConversationStatus(userId)}. No se procesa con IA.`);
        }

        return res.status(200).send("<Response></Response>");
    } catch (err: any) {
        console.error("❌ [ERROR] Ocurrió un error en el webhook:", err.message || err);
        return res.status(500).send("<Response></Response>");
    }
};