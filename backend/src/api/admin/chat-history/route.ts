import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const chatHistoryService = req.scope.resolve("chat_history") as any
  const history = await chatHistoryService.list(
    {},
    { orderBy: { created_at: "DESC" } }
  )
  res.json({ history })
}