// api/whatsapp/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
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
        const { Body, From, NumMedia, MediaUrl0, ProfileName, ButtonPayload } = req.body as TwilioWebhookBody & { ButtonPayload?: string };
        const userId = From;
        const incomingMsg = Body ? Body.trim().toLowerCase() : "";
        const numMedia = parseInt(NumMedia || "0", 10);
        const mediaUrl = numMedia > 0 ? MediaUrl0 : null;

        // Obtención de servicios
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

        if (incomingMsg === "confirmar") {
            try {
                const customerPhone = userId.replace("whatsapp:", "");
                const latestPendingAppointment = await appointmentsService.list(
                    { customer_phone: customerPhone, state: "pending" },
                    { order: { created_at: "desc" } }
                );

                if (latestPendingAppointment && latestPendingAppointment.length > 0) {
                    const appointmentId = latestPendingAppointment[0].id;
                    await appointmentsService.updateAppointment(appointmentId, { state: "confirmed" });
                    
                    const confirmationMessage = "¡Cita confirmada! Te esperamos en la fecha y hora seleccionada.";
                    await sendWhatsApp(userId, confirmationMessage);
                    console.log(`✅ Cita ${appointmentId} confirmada por el cliente.`);
                } else {
                    await sendWhatsApp(userId, "No se encontró ninguna cita pendiente para confirmar.");
                }
            } catch (confirmError) {
                console.error("❌ Error al confirmar la cita:", confirmError);
                await sendWhatsApp(userId, "Lo siento, no pude confirmar tu cita. Por favor, contacta con el taller.");
            }
            return res.status(200).send("<Response></Response>");
        }

        if (incomingMsg === "cancelar") {
            try {
                const customerPhone = userId.replace("whatsapp:", "");
                const latestPendingAppointment = await appointmentsService.list(
                    { customer_phone: customerPhone, state: "pending" },
                    { order: { created_at: "desc" } }
                );

                if (latestPendingAppointment && latestPendingAppointment.length > 0) {
                    const appointmentId = latestPendingAppointment[0].id;
                    await appointmentsService.updateAppointment(appointmentId, { state: "canceled" });
                    
                    const cancellationMessage = "Cita cancelada correctamente.";
                    await sendWhatsApp(userId, cancellationMessage);
                    console.log(`❌ Cita ${appointmentId} cancelada por el cliente.`);
                } else {
                    await sendWhatsApp(userId, "No se encontró ninguna cita para cancelar.");
                }
            } catch (cancelError) {
                console.error("❌ Error al cancelar la cita:", cancelError);
                await sendWhatsApp(userId, "Lo siento, no pude cancelar tu cita. Por favor, contacta con el taller.");
            }
            return res.status(200).send("<Response></Response>");
        }
        
        // ... (Tu lógica existente para asistencia personal e IA)
        const isPersonalAssistanceRequest = incomingMsg.includes("asistencia personal");
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