// src/admin/routes/chat-history/utils/chat-helpers.ts
type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
  status: "IA" | "AGENTE";
  conversation_id?: string;
};

export const groupChatsByUser = (messages: ChatMessage[]) => {
  const grouped: Record<string, ChatMessage[]> = {};
  messages.forEach((msg) => {
    if (!grouped[msg.user_id]) grouped[msg.user_id] = [];
    grouped[msg.user_id].push(msg);
  });
  return grouped;
};

export const cleanUserId = (userId: string) => {
  return userId.replace("whatsapp:", "");
};