import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const chatHistoryService = req.scope.resolve("chat_history") as any

  const { userId } = req.params
  const { status } = req.body as { status: "IA" | "AGENTE" }

  if (!status) {
    return res.status(400).json({ error: "status requerido" })
  }

  const updated = await chatHistoryService.updateConversationStatus(userId, status)

  res.json({ message: "Estado actualizado", updated })
}
