import twilio, { Twilio } from 'twilio';

export class TwilioService {
    private client: Twilio;
    private twilioNumber: string;
    private accountSid: string;
    private authToken: string;

    constructor() {
        // Inicialización de credenciales y cliente de Twilio
        this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
        this.authToken = process.env.TWILIO_AUTH_TOKEN!;
        this.twilioNumber = process.env.TWILIO_NUMBER!;
        this.client = twilio(this.accountSid, this.authToken);
    }

    // Envía mensaje de WhatsApp (simple, largo o con media)
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

    // Envía plantilla predefinida de WhatsApp
    async sendTemplate(to: string, templateName: string, fallbackMessage: string) {
        const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
        try {
            await this.client.messages.create({
                to: whatsappTo,
                from: `whatsapp:${this.twilioNumber}`,
                contentSid: templateName,
            });
            console.log(`✅ Plantilla de mensaje '${templateName}' enviada a ${to}`);
        } catch (err: any) {
            console.error(`❌ Error enviando plantilla de WhatsApp (${templateName}):`, err.message || err);
            await this.sendMessage(to, fallbackMessage);
        }
    }

    // Descarga archivo multimedia de Twilio
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

    // Envía mensaje con archivo adjunto
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

    // Divide y envía mensajes largos
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

    // Envía mensaje simple de texto
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
