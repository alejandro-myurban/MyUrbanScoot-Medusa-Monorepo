import OpenAI from "openai";
import ChatHistoryService from "modules/chat-history/service";
import { downloadTwilioMedia, sendWhatsApp } from "./twilio-service";
import { checkOrderStatus } from "./order-service";

const userThreads: Record<string, string> = {};
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";

export const processWhatsAppMessage = async (
  userId: string,
  incomingMsg: string,
  chatService: ChatHistoryService,
  mediaUrl: string | null
) => {
  let threadId = userThreads[userId];
  if (!threadId) {
    const thread = await openai.beta.threads.create();
    userThreads[userId] = thread.id;
    threadId = thread.id;
  }

  const content: any[] = [];
  if (mediaUrl) {
    try {
      const signedUrl = await downloadTwilioMedia(mediaUrl);
      content.push({ type: "image_url", image_url: { url: signedUrl } });
    } catch {
      await sendWhatsApp(userId, "No se pudo procesar la imagen. Intenta enviarla de nuevo.");
    }
  }

  if (incomingMsg) {
    content.push({ type: "text", text: incomingMsg });
  }

  if (content.length === 0) return;

  await openai.beta.threads.messages.create(threadId, { role: "user", content });

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    tools: [
      {
        type: "function",
        function: {
          name: "track_order",
          description: "Consulta el estado del pedido",
          parameters: {
            type: "object",
            properties: { orderid: { type: "string" } },
            required: ["orderid"],
          },
        },
      },
    ],
  });

  await handleRun(threadId, run.id, userId, chatService);
};

const handleRun = async (
  threadId: string,
  runId: string,
  userId: string,
  chatService: ChatHistoryService
) => {
  let run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
  let attempts = 0;

  while (run.status !== "completed" && attempts < 30) {
    if (run.required_action?.type === "submit_tool_outputs") {
      for (const toolCall of run.required_action.submit_tool_outputs.tool_calls) {
        if (toolCall.function.name === "track_order") {
          const args = JSON.parse(toolCall.function.arguments);
          const output = await checkOrderStatus(args.orderid, userId);
          await openai.beta.threads.runs.submitToolOutputs(run.id, {
            thread_id: threadId,
            tool_outputs: [{ tool_call_id: toolCall.id, output }],
          });
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
    attempts++;
  }

  const messages = await openai.beta.threads.messages.list(threadId, { order: "desc", limit: 1 });
  const aiMessage = messages.data[0]?.content?.[0]?.type === "text"
    ? messages.data[0].content[0].text.value
    : "Lo siento, no pude encontrar una respuesta.";

  await chatService.saveMessage({ user_id: userId, message: aiMessage, role: "assistant", status: "IA" });
  await sendWhatsApp(userId, aiMessage);
};
