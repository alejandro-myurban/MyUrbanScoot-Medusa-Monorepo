import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_NUMBER!;

const twilioClient = twilio(accountSid, authToken);

// Descargar media Twilio
export const downloadTwilioMedia = async (mediaUrl: string): Promise<string> => {
  const res = await fetch(mediaUrl, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    },
  });

  if (!res.ok) {
    throw new Error(`Error descargando media: ${res.status}`);
  }

  return mediaUrl;
};

// Enviar mensaje
export const sendWhatsApp = async (to: string, body: string, mediaUrl?: string) => {
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const MAX_TWILIO_MESSAGE_LENGTH = 1600;

  if (mediaUrl) {
    return twilioClient.messages.create({
      to: whatsappTo,
      from: "whatsapp:" + twilioNumber,
      body: body || "",
      mediaUrl: [mediaUrl],
    });
  }

  if (body.length > MAX_TWILIO_MESSAGE_LENGTH) {
    const parts = [];
    let current = "";
    for (const word of body.split(" ")) {
      if ((current + " " + word).length <= MAX_TWILIO_MESSAGE_LENGTH) {
        current += (current ? " " : "") + word;
      } else {
        parts.push(current);
        current = word;
      }
    }
    if (current) parts.push(current);

    for (const msg of parts) {
      await twilioClient.messages.create({
        to: whatsappTo,
        from: "whatsapp:" + twilioNumber,
        body: msg,
      });
    }
  } else {
    await twilioClient.messages.create({
      to: whatsappTo,
      from: "whatsapp:" + twilioNumber,
      body,
    });
  }
};

// Plantillas
export const sendWhatsAppTemplate = async (to: string, templateName: string, fallbackMessage: string) => {
  try {
    await twilioClient.messages.create({
      to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
      from: "whatsapp:" + twilioNumber,
      contentSid: templateName,
    });
  } catch {
    await sendWhatsApp(to, fallbackMessage);
  }
};
