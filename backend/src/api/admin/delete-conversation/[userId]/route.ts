import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatHistoryService from "modules/chat-history/service";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { userId } = req.params;
  const chatHistoryService = req.scope.resolve("chat_history") as any;

  try {
    const result = await chatHistoryService.deleteConversation(userId);
    res.status(200).json({ message: `Conversación con ${userId} eliminada.`, ...result });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la conversación.", error: error.message });
  }
};