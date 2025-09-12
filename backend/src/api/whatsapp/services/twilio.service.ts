// src/api/whatsapp/services/twilio.service.ts
import twilio, { Twilio } from 'twilio';

export class TwilioService {
    private client: Twilio;
    private twilioNumber: string;
    private accountSid: string;
    private authToken: string;

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
        this.authToken = process.env.TWILIO_AUTH_TOKEN!;
        this.twilioNumber = process.env.TWILIO_NUMBER!;
        this.client = twilio(this.accountSid, this.authToken);
    }

    async sendMessage(to: string, body: string, mediaUrl?: string) {
        console.log(`➡️ [TWILIO] Mensaje de entrada completo: ${body}`);
        const MAX_TWILIO_MESSAGE_LENGTH = 1600;
        const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

        if (mediaUrl) {
            return this.sendMediaMessage(whatsappTo, body, mediaUrl);
        }

        if (body.length > MAX_TWILIO_MESSAGE_LENGTH) {
            return this.sendLongMessage(whatsappTo, body, MAX_TWILIO_MESSAGE_LENGTH);
        }

        return this.sendSimpleMessage(whatsappTo, body);
    }

    async sendTemplate(to: string, templateSid: string, fallbackMessage: string, variables?: any, buttonOptions?: { appointmentId: string }) {
        const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
        
        try {
            const messagePayload: any = {
                to: whatsappTo,
                from: `whatsapp:${this.twilioNumber}`,
                contentSid: templateSid,
            };

            // Solo manejar variables simples por ahora (sin botones)
            if (variables) {
                messagePayload.contentVariables = JSON.stringify(variables);
            }

            console.log("➡️ [DEBUG] Payload FINAL a Twilio:", JSON.stringify(messagePayload, null, 2));
            
            const message = await this.client.messages.create(messagePayload);
            
            console.log(`✅ Plantilla de mensaje '${templateSid}' enviada a ${to} (SID: ${message.sid})`);
            
            return message;
        } catch (err: any) {
            console.error(`❌ [ERROR] Ocurrió un error al enviar la plantilla de WhatsApp (${templateSid}):`, err.message || err);
            console.error(`❌ [ERROR CODE]: ${err.code}`);
            
            if (err.code === 63016) {
                console.error("🚫 Error 63016: Fuera de ventana de 24h - Solo se pueden usar templates aprobados");
            } else if (err.code === 21656) {
                console.error("🚫 Error 21656: Variables del template inválidas o template no aprobado");
            }
            
            // Solo intentar fallback si NO es error de ventana 24h
            if (err.code !== 63016) {
                console.warn(`⚠️ Enviando mensaje de respaldo (fallback) a ${to} debido a un fallo en la plantilla.`);
                await this.sendMessage(to, fallbackMessage);
            }
            
            throw err;
        }
    }
    async downloadMedia(mediaUrl: string): Promise<string> {
        try {
            const res = await fetch(mediaUrl, {
                headers: {
                    Authorization: "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
                },
            });

            if (!res.ok) {
                throw new Error(`Error descargando media: ${res.status}`);
            }

            return mediaUrl;
        } catch (err: any) {
            console.error("❌ Error descargando media Twilio:", err.message || err);
            throw err;
        }
    }

    private async sendMediaMessage(to: string, body: string, mediaUrl: string) {
        try {
            const message = await this.client.messages.create({
                to,
                from: `whatsapp:${this.twilioNumber}`,
                body: body || "",
                mediaUrl: [mediaUrl],
            });
            console.log(`✅ WhatsApp con archivo enviado (SID: ${message.sid})`);
        } catch (err: any) {
            console.error("❌ Error enviando WhatsApp con archivo:", err.message || err);
        }
    }

    private async sendLongMessage(to: string, body: string, maxLength: number) {
        const messagesToSend = [];
        let currentMessage = "";
        const words = body.split(" ");

        for (const word of words) {
            if ((currentMessage + " " + word).length <= maxLength) {
                currentMessage += (currentMessage.length > 0 ? " " : "") + word;
            } else {
                messagesToSend.push(currentMessage);
                currentMessage = word;
            }
        }
        if (currentMessage.length > 0) messagesToSend.push(currentMessage);

        for (const msg of messagesToSend) {
            try {
                const message = await this.client.messages.create({
                    to,
                    from: `whatsapp:${this.twilioNumber}`,
                    body: msg,
                });
                console.log(`✅ Mensaje Twilio enviado (SID: ${message.sid})`);
            } catch (err: any) {
                console.error("❌ Error enviando WhatsApp:", err.message || err);
            }
        }
    }

    private async sendSimpleMessage(to: string, body: string) {
        try {
            const message = await this.client.messages.create({
                to,
                from: `whatsapp:${this.twilioNumber}`,
                body: body,
            });
            console.log(`✅ WhatsApp enviado (SID: ${message.sid})`);
        } catch (err: any) {
            console.error("❌ Error enviando WhatsApp:", err.message || err);
        }
    }
}