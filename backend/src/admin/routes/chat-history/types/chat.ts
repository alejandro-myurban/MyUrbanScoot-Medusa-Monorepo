// src/admin/routes/chat-history/types/chat.ts

export type Department = "General" | "Ventas" | "Soporte" | "Devoluciones" | "Pedidos Web";

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string; // ✅ Mantenemos 'string' para que coincida con la API y ChatBubble
  status: "IA" | "AGENTE";
  conversation_id?: string;
  profile_name?: string;
};