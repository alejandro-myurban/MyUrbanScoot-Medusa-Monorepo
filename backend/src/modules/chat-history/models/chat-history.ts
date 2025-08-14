// src/modules/chat-history/models/chat-history.ts
import { model } from "@medusajs/framework/utils"

export const ChatHistory = model.define("chat_history", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  message: model.text(),
  role: model.enum(["user", "assistant"]),
  conversation_id: model.text().nullable(),
})