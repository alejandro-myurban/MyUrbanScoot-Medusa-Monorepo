import { Module } from "@medusajs/framework/utils"
import ChatHistoryService from "./service"
import { ChatHistory } from "./models/chat-history"

export const CHAT_HISTORY_MODULE = "chat_history"

export default Module(CHAT_HISTORY_MODULE, {
  service: ChatHistoryService,
})