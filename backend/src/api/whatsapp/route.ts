import OpenAI from "openai";
import twilio, { Twilio } from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import ChatHistoryService from "modules/chat-history/service";

const userThreads: Record<string, string> = {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ✅ CORRECCIÓN: Se declara TwilioWebhookBody como un tipo.
type TwilioWebhookBody = {
  Body: string;
  From: string;
  NumMedia?: string;
  MediaUrl0?: string;
};

const assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioNumber = process.env.TWILIO_NUMBER!;

const twilioClient = twilio(accountSid, authToken);

const orderStatusMessages: Record<string, string> = {
  processing: `🛠️ ¡Estamos trabajando en tu pedido!
Tu pedido ya está en nuestras manos y nos encontramos preparando todo para que esté listo lo antes posible. 🚀

Todavía no ha salido de nuestras instalaciones, pero en cuanto lo haga, recibirás un correo con toda la información de seguimiento del paquete por parte de GLS.

Si necesitas cualquier detalle adicional o tienes alguna consulta, no dudes en contactarnos. ¡Gracias por confiar en MyUrbanScoot! 😊`,

  completed: `📦 ¡Tu pedido ya ha salido de nuestras instalaciones! 🚀
Te llegará en un plazo de 24/48 horas laborales desde que salió de nuestra nave.
Deberías haber recibido un correo electrónico con el seguimiento del paquete enviado por GLS.

Si tienes cualquier duda sobre tu pedido o necesitas más información, no dudes en contactarnos. 😊`,

  "espera-stock": `⚠️ Tu pedido está en espera de stock.
Estamos esperando recibir uno o más productos necesarios para completar tu pedido. Sentimos mucho las molestias y la demora ocasionadas.

Si necesitas más información sobre los plazos estimados, por favor contacta con Valeria (de 10 a 16 los días laborales), quien podrá ayudarte:
📞 Teléfono: +34 620 92 99 44

Gracias por tu paciencia y comprensión. `,

  "espera-baterias": `🔋 Tu pedido incluye baterías en producción.
Como somos los fabricantes de las baterías, estas requieren un tiempo de preparación y producción personalizado. Esto puede ocasionar un plazo adicional.

Estamos trabajando al máximo para que tu pedido esté listo lo antes posible. Agradecemos tu paciencia y confianza en MyUrbanScoot.

Si necesitas más detalles o tienes alguna consulta sobre el estado de tu pedido, contacta con Valeria (10:00 a 16:00 los días laborales): +34 620 92 99 44.
Recomendamos mandar un WhatsApp si está fuera de su horario. 📞 Teléfono: +34 620 92 99 44`,

  "565produccionvi": `🎨 Tu pedido incluye vinilos en producción.
Actualmente estamos a tope con los pedidos de vinilos, lo que está provocando algunos retrasos. Sentimos mucho las molestias ocasionadas.

Si necesitas más información, deseas realizar cambios o incluso cancelar el pedido, contacta con Valeria, quien estará encantada de ayudarte:
📞 Teléfono: +34 620 92 99 44

Gracias por tu paciencia mientras trabajamos en que todo quede perfecto para ti. 😊`
};

// 🔹 Descargar media de Twilio con autenticación básica
const downloadTwilioMedia = async (mediaUrl: string): Promise<string> => {
  try {
    const res = await fetch(mediaUrl, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });

    if (!res.ok) {
      throw new Error(`Error descargando media: ${res.status}`);
    }

    // Puedes devolver directamente la URL de Twilio firmada,
    // o subir la imagen a otro storage si OpenAI necesita acceso público.
    return mediaUrl;
  } catch (err: any) {
    console.error("❌ Error descargando media Twilio:", err.message || err);
    throw err;
  }
};

// Envia mensaje via Twilio WhatsApp
export const sendWhatsApp = async (to: string, body: string) => {
  console.log(`➡️ [TWILIO] Mensaje de entrada completo: ${body}`);
  const MAX_TWILIO_MESSAGE_LENGTH = 1600;
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  console.log("➡️ [TWILIO] Invocando la función sendWhatsApp.");
  console.log(`➡️ [TWILIO] Destinatario: ${to}, Mensaje (truncado): ${body.substring(0, 50)}...`);

  if (body.length > MAX_TWILIO_MESSAGE_LENGTH) {
    const messagesToSend = [];
    let currentMessage = "";
    const words = body.split(" ");
    for (const word of words) {
      if ((currentMessage + " " + word).length <= MAX_TWILIO_MESSAGE_LENGTH) {
        currentMessage += (currentMessage.length > 0 ? " " : "") + word;
      } else {
        messagesToSend.push(currentMessage);
        currentMessage = word;
      }
    }
    if (currentMessage.length > 0) messagesToSend.push(currentMessage);

    for (const msg of messagesToSend) {
      try {
        const message = await twilioClient.messages.create({
          to: whatsappTo,
          from: "whatsapp:" + twilioNumber,
          body: msg,
        });
        console.log(`✅ Mensaje Twilio enviado (SID: ${message.sid})`);
      } catch (err: any) {
        console.error("Error enviando WhatsApp:", err.message || err);
      }
    }
  } else {
    try {
      await twilioClient.messages.create({
        to: whatsappTo,
        from: "whatsapp:" + twilioNumber,
        body: body,
      });
    } catch (err: any) {
      console.error("Error enviando WhatsApp:", err.message || err);
    }
  }
};

// Se agregó un parámetro `fallbackMessage` y una lógica de `try...catch` para manejar errores.
export const sendWhatsAppTemplate = async (to: string, templateName: string, fallbackMessage: string) => {
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    await twilioClient.messages.create({
      to: whatsappTo,
      from: "whatsapp:" + twilioNumber,
      contentSid: templateName,
    });
    console.log(`✅ Plantilla de mensaje '${templateName}' enviada a ${to}`);
  } catch (err: any) {
    console.error(`❌ Error enviando plantilla de WhatsApp (${templateName}):`, err.message || err);
    await sendWhatsApp(to, fallbackMessage);
  }
};

const processWhatsAppMessage = async (
  userId: string,
  incomingMsgRaw: string,
  chatService: ChatHistoryService,
  mediaUrl: string | null
) => {
  const incomingMsg = incomingMsgRaw.trim();
  let threadId = userThreads[userId];

  try {
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      userThreads[userId] = threadId;
    }

    const content: any[] = [];

    if (mediaUrl) {
      try {
        const signedUrl = await downloadTwilioMedia(mediaUrl);
        content.push({
          type: "image_url",
          image_url: { url: signedUrl },
        });
      } catch {
        await sendWhatsApp(userId, "No se pudo procesar la imagen. Intenta enviarla de nuevo.");
      }
    }

    if (incomingMsg.length > 0) {
      content.push({
        type: "text",
        text: incomingMsg,
      });
    }

    if (content.length === 0) return;

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content,
    });

    const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
      tools: [
        {
          type: "function",
          function: {
            name: "track_order",
            description: "consulta el estado del pedido(orden) del cliente",
            parameters: {
              type: "object",
              properties: {
                orderid: {
                  type: "string",
                  description: "el numero de identificacion(ID) de la orden",
                },
              },
              required: ["orderid"],
            },
          },
        },
        { type: "file_search" },
      ],
    };

    await runAssistantRunAndReply(threadId, runOptions, userId, chatService);
  } catch (err: any) {
    console.error("❌ ERROR en proceso asíncrono:", err.message || err);
    await sendWhatsApp(userId, "Lo siento, ha ocurrido un error al procesar tu solicitud. Inténtalo de nuevo más tarde.");
  }
};

const runAssistantRunAndReply = async (
  threadId: string,
  runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams,
  userId: string,
  chatService: ChatHistoryService
) => {
  try {
    let run = (await openai.beta.threads.runs.create(threadId, runOptions)) as OpenAI.Beta.Threads.Runs.Run;

    const maxAttempts = 30;
    let attempts = 0;

    while (run.status !== "completed") {
      if (attempts > maxAttempts) {
        throw new Error("Tiempo de espera agotado para el run del asistente.");
      }
      if (run.status === "failed") {
        throw new Error(run.last_error?.message || "Error desconocido en run");
      }

      if (run.required_action?.type === "submit_tool_outputs") {
        for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
          if (toolCall.function.name === "track_order") {
            let output: string;
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const orderId = args.orderid;

              if (!orderId) {
                output = "No se ha proporcionado un ID de pedido válido.";
                await sendWhatsApp(userId, "Por favor, indícanos un número de pedido válido.");
              } else {
                const wooRes = await fetch(`${process.env.WC_URL}/orders/${orderId}`, {
                  headers: {
                    Authorization:
                      "Basic " +
                      Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`).toString("base64"),
                    "Content-Type": "application/json",
                  },
                });
                if (!wooRes.ok) {
                  const errorText = await wooRes.text();
                  console.error(`❌ WooCommerce API Error [${wooRes.status}]:`, errorText);
                  await sendWhatsApp(userId, "No pude encontrar tu pedido. Por favor revisa el número de orden.");
                  output = `Error consultando orden: ${wooRes.status}`;
                } else {
                  const orderData = await wooRes.json();
                  const status = orderData.status;
                  const reply = orderStatusMessages[status] || `Estado actual del pedido: ${status}`;
                  output = reply;
                }
              }
            } catch (err: any) {
              console.error("❌ Error ejecutando track_order:", err.message || err);
              output = "Ocurrió un error al consultar tu pedido.";
            }
            await openai.beta.threads.runs.submitToolOutputs(run.id, {
              thread_id: threadId,
              tool_outputs: [{ tool_call_id: toolCall.id, output }],
            });
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
      attempts++;
    }

    const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 1 });
    let aiMessage = "Lo siento, no pude encontrar una respuesta.";
    const lastMessage = messages.data[0];
    if (lastMessage && lastMessage.content?.[0]?.type === "text") {
      aiMessage = lastMessage.content[0].text.value;
    }

    await chatService.saveMessage({
      user_id: userId,
      message: aiMessage,
      role: "assistant",
      status: "IA",
    });

    await sendWhatsApp(userId, aiMessage);
  } catch (err: any) {
    console.error("❌ Error en runAssistantRunAndReply:", err.message || err);
    await sendWhatsApp(userId, "Error buscando productos — inténtalo de nuevo o contacta con Alex: +34 620 92 99 44.");
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    if (!req.body || typeof req.body !== "object" || !("From" in req.body) || typeof req.body.From !== "string") {
      console.warn("⚠️ [VALIDACIÓN] Cuerpo inválido o faltan campos obligatorios");
      return res.status(400).send("<Response></Response>");
    }

    const { Body, From, NumMedia, MediaUrl0 } = req.body as TwilioWebhookBody;
    const userId = From;
    const incomingMsg = Body ? Body.trim() : "";
    const numMedia = parseInt(NumMedia || "0", 10);
    const mediaUrl = numMedia > 0 ? MediaUrl0 : null;

    const chatService = req.scope.resolve("chat_history") as ChatHistoryService;
    const lastStatus = await chatService.getConversationStatus(userId);

    // ✅ Lógica corregida para guardar mensajes con imágenes
    let messageToSave;
    if (incomingMsg.length > 0 && mediaUrl) {
      // Caso 1: Hay texto y también imagen
      messageToSave = `${incomingMsg} [Imagen] - ${mediaUrl}`;
    } else if (mediaUrl) {
      // Caso 2: Solo hay imagen
      messageToSave = `[Imagen] - ${mediaUrl}`;
    } else {
      // Caso 3: Solo hay texto
      messageToSave = incomingMsg;
    }

    // Aseguramos que solo guardamos si hay un mensaje o una imagen
    if (messageToSave) {
      await chatService.saveMessage({
        user_id: userId,
        message: messageToSave,
        role: "user",
        status: lastStatus,
      });
    }

    if (incomingMsg.toUpperCase().includes("ASISTENCIA PERSONAL")) {
      console.log(`💬 Mensaje recibido de ${userId}. Solicitud de ASISTENCIA PERSONAL. Pausando el bot.`);
      const confirmationMessage =
        "Gracias por tu mensaje. Un miembro de nuestro equipo de soporte se pondrá en contacto contigo en breve para ayudarte.";
      await sendWhatsApp(userId, confirmationMessage);

      await chatService.saveMessage({
        user_id: userId,
        message: confirmationMessage,
        role: "assistant",
        status: "IA",
      });

      return res.status(200).send("<Response></Response>");
    }

    if (lastStatus === "AGENTE") {
      console.log(`💬 Mensaje recibido de ${userId} en modo AGENTE. No se procesa con IA.`);
      return res.status(200).send("<Response></Response>");
    }

    await processWhatsAppMessage(userId, incomingMsg, chatService, mediaUrl);

    return res.status(200).send("<Response></Response>");
  } catch (err: any) {
    console.error("❌ [ERROR] Ocurrió un error en el webhook:", err.message || err);
    return res.status(500).send("<Response></Response>");
  }
};