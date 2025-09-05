// src/admin/routes/chat-history/types/chat.ts

export type Department = "Consultas generales sobre productos" | "Consultas pedidos web" | "Financiacion" | "Modificacion / recogida + entrega" | "Otros";

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string; // ✅ Mantenemos 'string' para que coincida con la API y ChatBubble
  status: "IA" | "AGENTE";
  conversation_id?: string;
  profile_name?: string;
  department_string?: string;
};
