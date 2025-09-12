import { TwilioService } from './twilio.service';
import { OpenAIService } from './openai.service';
import { ProcessingState } from '../types';
import ChatHistoryService from "modules/chat-history/service";

export class WhatsAppService {
    private processingStates: Map<string, ProcessingState> = new Map();

    constructor(
        private twilioService: TwilioService,
        private openaiService: OpenAIService
    ) {}

    // Procesa mensaje del usuario y envía respuesta
    async processMessage(userId: string, message: string, chatService: ChatHistoryService, mediaUrl: string | null = null) {
        // Verifica si ya hay un mensaje en procesamiento
        if (this.isProcessing(userId)) {
            await this.twilioService.sendMessage(
                userId,
                "Por favor, espera un momento. Estoy procesando tu solicitud anterior."
            );
            return;
        }

        this.setProcessing(userId, true);
        
        try {
            // Construye contenido del mensaje (texto y/o media)
            const content = await this.buildContent(message, mediaUrl);
            if (content.length === 0) return;

            // Procesa mensaje con OpenAI y guarda respuesta
            const response = await this.openaiService.processMessage(userId, content);
            
            await chatService.saveMessage({
                user_id: userId,
                message: response,
                role: "assistant",
                status: "IA"
            });

            // Envía respuesta al usuario
            await this.twilioService.sendMessage(userId, response);
        } catch (error) {
            // Manejo de errores
            const errorMessage = "Lo siento, ocurrió un error. Inténtalo más tarde.";
            await chatService.saveMessage({
                user_id: userId,
                message: errorMessage,
                role: "assistant",
                status: "IA"
            });
            await this.twilioService.sendMessage(userId, errorMessage);
        } finally {
            this.setProcessing(userId, false);
        }
    }

    // Envía mensaje simple de WhatsApp
    async sendMessage(to: string, body: string, mediaUrl?: string) {
        return this.twilioService.sendMessage(to, body, mediaUrl);
    }

    // 🛠️ CORRECCIÓN: Se añade el parámetro opcional para las opciones de los botones.
    async sendTemplate(to: string, templateSid: string, fallbackMessage: string, variables: any, buttonOptions?: { appointmentId: string }) {
        // Pasa el nuevo parámetro al servicio de Twilio.
        return this.twilioService.sendTemplate(to, templateSid, fallbackMessage, variables, buttonOptions);
    }

    // Verifica si hay un mensaje en procesamiento para el usuario
    private isProcessing(userId: string): boolean {
        return this.processingStates.get(userId)?.isProcessing || false;
    }

    // Actualiza estado de procesamiento del usuario
    private setProcessing(userId: string, processing: boolean) {
        const state = this.processingStates.get(userId) || {};
        this.processingStates.set(userId, {
            ...state,
            isProcessing: processing
        });
    }

    // Construye contenido del mensaje (texto y/o media)
    private async buildContent(message: string, mediaUrl: string | null) {
        const content: any[] = [];

        // Procesa imagen si existe
        if (mediaUrl) {
            try {
                const signedUrl = await this.twilioService.downloadMedia(mediaUrl);
                content.push({
                    type: "image_url",
                    image_url: { url: signedUrl }
                });
            } catch {
                await this.twilioService.sendMessage(
                    mediaUrl.split('/').pop() || "",
                    "No se pudo procesar la imagen. Intenta enviarla de nuevo."
                );
            }
        }

        // Agrega texto si existe
        if (message.trim().length > 0) {
            content.push({
                type: "text",
                text: message.trim()
            });
        }

        return content;
    }
}