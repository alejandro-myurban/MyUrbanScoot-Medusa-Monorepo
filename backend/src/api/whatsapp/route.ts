import OpenAI from "openai";
import twilio from "twilio";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

// Mapa simple para asociar usuarios con sus threads de conversación
const userThreads: Record<string, string> = {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";

// Inicializar el cliente de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const twilioClient = twilio(accountSid, authToken);

// 📦 Mensajes por estado del pedido
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

Gracias por tu paciencia y comprensión. 😊`,

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

type TwilioRequestBody = {
  Body: string;
  From: string;
};

// Envia mensaje via Twilio WhatsApp
const sendWhatsApp = async (to: string, body: string) => {
  const MAX_TWILIO_MESSAGE_LENGTH = 1600;
  const messagesToSend = [];
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  if (body.length > MAX_TWILIO_MESSAGE_LENGTH) {
    let currentMessage = "";
    const words = body.split(' ');
    for (const word of words) {
      if ((currentMessage + ' ' + word).length <= MAX_TWILIO_MESSAGE_LENGTH) {
        currentMessage += (currentMessage.length > 0 ? ' ' : '') + word;
      } else {
        messagesToSend.push(currentMessage);
        currentMessage = word;
      }
    }
    if (currentMessage.length > 0) messagesToSend.push(currentMessage);
  } else {
    messagesToSend.push(body);
  }

  for (const msg of messagesToSend) {
    try {
      await twilioClient.messages.create({
        to: whatsappTo,
        from: "whatsapp:" + twilioNumber,
        body: msg,
      });
    } catch (err) {
      console.error("Error enviando WhatsApp:", err);
    }
  }
};

const processWhatsAppMessage = async (userId: string, incomingMsgRaw: string) => {
  const incomingMsg = incomingMsgRaw.trim();
  let threadId = userThreads[userId];

  try {
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      userThreads[userId] = threadId;
      console.log(`➕ Creando nuevo thread para ${userId}: ${threadId}`);
    } else {
      console.log(`🔗 Usando thread existente para ${userId}: ${threadId}`);
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: incomingMsg,
    });
    console.log(`💬 Mensaje añadido al thread: "${incomingMsg}"`);

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
                  description: "el numero de identificacion(ID) de la orden"
                }
              },
              required: ["orderid"]
            }
          }
        }
      ]
    };

    await runAssistantRunAndReply(threadId, runOptions, userId);
  } catch (err) {
    console.error("❌ ERROR en proceso asíncrono:", err);
    await sendWhatsApp(userId, "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.");
  }
};

const runAssistantRunAndReply = async (
  threadId: string,
  runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams,
  userId: string
) => {
  try {
    console.log("🚀 Iniciando run con opciones:", JSON.stringify(runOptions, null, 2));
    let run = await openai.beta.threads.runs.create(threadId, runOptions) as OpenAI.Beta.Threads.Runs.Run;
    console.log("🤖 Run creado:", run.id, "Estado inicial:", run.status);

    let iteration = 0;
    while (run.status !== "completed") {
      iteration++;
      console.log(`⏳ Iteración ${iteration} - Estado actual del run:`, run.status);

      if (run.status === "failed") {
        console.error("❌ Run falló:", run.last_error);
        throw new Error(run.last_error?.message || "Error desconocido en run");
      }

      // 🚀 Si el asistente llama a track_order
      if (run.required_action?.type === "submit_tool_outputs") {
        console.log("📌 El asistente requiere acción: submit_tool_outputs");
        for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
          console.log("🔍 Tool call recibida:", toolCall.function.name, toolCall.function.arguments);

          if (toolCall.function.name === "track_order") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const orderId = args.orderid;
              console.log(`📦 Consultando estado de la orden: ${orderId}`);

              // Consulta a WooCommerce
              const wooRes = await fetch(`${process.env.WC_URL}/orders/${orderId}`, {
                headers: {
                  Authorization: `Basic ${Buffer.from(
                    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`
                  ).toString("base64")}`,
                  "Content-Type": "application/json"
                }
              });

              console.log(`🌐 WooCommerce respuesta HTTP: ${wooRes.status}`);
              if (!wooRes.ok) {
                const errorText = await wooRes.text();
                console.error(`❌ WooCommerce API Error [${wooRes.status}]:`, errorText);
                await sendWhatsApp(userId, "No pude encontrar tu pedido. Por favor revisa el número de orden.");
                await openai.beta.threads.runs.submitToolOutputs(run.id, {
                  thread_id: threadId,
                  tool_outputs: [
                    {
                      tool_call_id: toolCall.id,
                      output: `Error consultando orden: ${wooRes.status}`
                    }
                  ]
                });
                break;
              }

              const orderData = await wooRes.json();
              console.log("📦 Datos de la orden recibidos:", JSON.stringify(orderData, null, 2));

              const status = orderData.status;
              const reply = orderStatusMessages[status] || `Estado actual del pedido: ${status}`;

              console.log("📤 Enviando mensaje WhatsApp con estado del pedido...");
              await sendWhatsApp(userId, reply);
              console.log("✅ Mensaje de estado enviado");

              await openai.beta.threads.runs.submitToolOutputs(run.id, {
                thread_id: threadId,
                tool_outputs: [
                  {
                    tool_call_id: toolCall.id,
                    output: reply
                  }
                ]
              });
              console.log("📨 Tool outputs enviados al asistente");

            } catch (err) {
              console.error("❌ Error ejecutando track_order:", err);
              await sendWhatsApp(userId, "Ocurrió un error al consultar tu pedido.");
            }
          }
        }
      }

      console.log("⏱ Esperando 1 segundo antes de reintentar...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    }

    console.log("✅ Run completado. Obteniendo mensajes finales...");
    const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 1 });
    console.log("📝 Mensajes recibidos:", JSON.stringify(messages.data, null, 2));

    let aiMessage = "Lo siento, no pude encontrar una respuesta.";
    const lastMessage = messages.data[0];
    if (lastMessage && lastMessage.content?.[0]?.type === "text") {
      aiMessage = lastMessage.content[0].text.value;
    }

    console.log("📤 Enviando mensaje final por WhatsApp:", aiMessage);
    await sendWhatsApp(userId, aiMessage);
    console.log("✅ Mensaje final enviado");
  } catch (err) {
    console.error("❌ Error en runAssistantRunAndReply:", err);
    await sendWhatsApp(userId, "Error buscando productos — inténtalo de nuevo o contacta con Alex: +34 620 92 99 44.");
  }
};


export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📩 Llega POST a /whatsapp");
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      !("Body" in req.body) ||
      !("From" in req.body) ||
      typeof req.body.Body !== "string" ||
      typeof req.body.From !== "string"
    ) {
      return res.status(400).send({
        code: "invalid_request",
        message: "Cuerpo de la solicitud no válido o faltan campos obligatorios.",
      });
    }
    const { Body, From } = req.body as TwilioRequestBody;
    const userId = From;
    const incomingMsg = Body.trim();
    processWhatsAppMessage(userId, incomingMsg);
    return res.status(200).send("<Response></Response>");
  } catch (err) {
    console.error("❌ ERROR en el webhook:", err);
    return res.status(500).send("<Response></Response>");
  }
};
