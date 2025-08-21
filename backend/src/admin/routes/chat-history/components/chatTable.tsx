import { Text, Badge, Button, Avatar } from "@medusajs/ui";
import { AlertTriangle, ChevronLeft, ChevronRight, User } from "lucide-react";
import React from "react";
import { ChatMessage, Department } from "../types/chat";
import { cleanUserId } from "../utils/chat-helpers";
import { departmentColors } from "../utils/department";

type Props = {
  paginatedChats: { latestMessage: ChatMessage; department: Department }[];
  grouped: Record<string, ChatMessage[]>;
  handleRowClick: (userId: string) => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

const ChatTable = ({ paginatedChats, grouped, handleRowClick, page, totalPages, setPage }: Props) => {
  return (
    <div className="w-full">
      {/* Lista tipo WhatsApp (sirve para mobile y desktop) */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {paginatedChats.length > 0 ? (
          paginatedChats.map(({ latestMessage, department }) => {
            const lastUserMessage = grouped[latestMessage.user_id]
              ?.filter((msg) => msg.role === "user")
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            const needsAgentAttentionInConversation =
              lastUserMessage &&
              lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") &&
              latestMessage.status !== "AGENTE";

            const lastMessageDate = new Date(latestMessage.created_at);

            const formattedDate = isNaN(lastMessageDate.getTime())
              ? ""
              : lastMessageDate.toLocaleString("es-ES", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

            // Construcción del texto del perfil
            const userDisplay = latestMessage.profile_name 
              ? `${latestMessage.profile_name} - ${cleanUserId(latestMessage.user_id)}`
              : cleanUserId(latestMessage.user_id);

            return (
              <div
                key={latestMessage.user_id}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  needsAgentAttentionInConversation ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                }`}
                onClick={() => handleRowClick(latestMessage.user_id)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                    <User className="w-6 h-6" />
                  </div>
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    {/* Contenedor del nombre y la hora */}
                    <Text className="font-semibold truncate pr-2">
                      {userDisplay}
                    </Text>
                    <Text size="small" className="text-gray-400 flex-shrink-0">
                      {formattedDate}
                    </Text>
                  </div>
                  {/* Contenedor del último mensaje y el ícono de alerta */}
                  <div className="flex items-start justify-between">
                    <Text className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {latestMessage.message}
                    </Text>
                    {needsAgentAttentionInConversation && (
                      <AlertTriangle className="w-4 h-4 text-orange-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                  {/* Estado y departamento */}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge size="small" color={latestMessage.status === "IA" ? "blue" : "purple"}>
                      {latestMessage.status}
                    </Badge>
                    <Badge size="small" color={departmentColors[department]}>
                      {department}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-20">
            <Text className="text-center text-gray-500">No se encontraron chats con esos filtros.</Text>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            size="small"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <Text size="small" className="text-gray-500">
            Página {page + 1} de {totalPages}
          </Text>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            size="small"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatTable;
