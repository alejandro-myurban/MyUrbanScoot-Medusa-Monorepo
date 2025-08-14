import { ChatHistory } from "../modules/chat-history/models/chat-history"
import ChatHistoryService from "../modules/chat-history/service"

export default async function seed({ container }) {
  const chatHistoryService: ChatHistoryService = container.resolve("chat_history")

  // Crea mensajes de ejemplo
  await chatHistoryService.saveMessage({
    user_id: "user_1",
    message: "¡Hola! ¿En qué puedo ayudarte?",
    role: "assistant",
    conversation_id: "conv_1"
  })

  await chatHistoryService.saveMessage({
    user_id: "user_1",
    message: "Quiero saber el estado de mi pedido.",
    role: "user",
    conversation_id: "conv_1"
  })
}