import { Text, Badge, Button } from "@medusajs/ui";
import { AlertTriangle, ChevronLeft, ChevronRight, User, Plus, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ChatMessage, Department } from "../types/chat";
import { cleanUserId } from "../utils/chat-helpers";
import { departmentColors } from "../utils/department";

type Props = {
  paginatedChats: { latestMessage: ChatMessage; departments: Department[] }[];
  grouped: Record<string, ChatMessage[]>;
  handleRowClick: (userId: string) => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onAssignDepartment: (userId: string, dept: Department) => void;
  onRemoveDepartment: (userId: string, dept: Department) => void;
};

const ChatTable = ({
  paginatedChats,
  grouped,
  handleRowClick,
  page,
  totalPages,
  setPage,
  onAssignDepartment,
  onRemoveDepartment,
}: Props) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [readChats, setReadChats] = useState<string[]>([]);
  const [unreadChats, setUnreadChats] = useState<string[]>([]);
  const allDepartments = Object.keys(departmentColors) as Department[];

  // ✅ cargar desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("readChats");
    if (saved) {
      const parsedSaved = JSON.parse(saved);
      setReadChats(parsedSaved);
      console.log("✅ useEffect: Chats leídos cargados desde localStorage:", parsedSaved);
    } else {
      console.log("⚠️ useEffect: No se encontraron chats leídos en localStorage.");
    }
  }, []);

  // ✅ guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("readChats", JSON.stringify(readChats));
    console.log("💾 useEffect: Guardando chats leídos en localStorage:", readChats);
  }, [readChats]);

  const getUnreadChats = () => {
    const unread = paginatedChats
      .filter(({ latestMessage }) => {
        if (latestMessage.status !== "AGENTE") return false;

        const messages = grouped[latestMessage.user_id] || [];
        const lastAgentMessage = [...messages]
          .filter((msg) => msg.role === "assistant" && msg.status === "AGENTE")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        const pendingMessages = messages.filter(
          (msg) =>
            msg.role === "user" &&
            (!lastAgentMessage || new Date(msg.created_at) > new Date(lastAgentMessage.created_at))
        );
        
        const isUnread = pendingMessages.length > 0;
        if(isUnread) {
          console.log(`🔍 getUnreadChats: El chat ${latestMessage.user_id} tiene ${pendingMessages.length} mensajes pendientes.`);
        }
        return isUnread;
      })
      .map(({ latestMessage }) => latestMessage.user_id);
    
    console.log("📊 getUnreadChats: Lista total de chats no leídos (sin filtrar por `readChats`):", unread);
    return unread;
  };

  // ✅ recalcular no leídos
  useEffect(() => {
    const currentUnread = getUnreadChats();
    const activeUnread = currentUnread.filter((id) => !readChats.includes(id));
    setUnreadChats(activeUnread);
    console.log("🔄 useEffect: Chats no leídos (después de filtrar `readChats`):", activeUnread);
  }, [paginatedChats, grouped, readChats]);

  const handleAssignClick = (e: React.MouseEvent, userId: string, dept: Department) => {
    e.stopPropagation();
    onAssignDepartment(userId, dept);
    setDropdownOpen(null);
  };

  const handleRemoveClick = (e: React.MouseEvent, userId: string, dept: Department) => {
    e.stopPropagation();
    onRemoveDepartment(userId, dept);
  };

  // ✅ marcar como leído al clickear el badge
  const handleBadgeClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    console.log("🔵 handleBadgeClick: Marcando el chat como leído al clickear la badge:", userId);
    setReadChats((prev) => [...new Set([...prev, userId])]);
  };

  // ✅ marcar como leído al abrir el chat
  const handleOpenChat = (userId: string) => {
    console.log("🟢 handleOpenChat: Marcando el chat como leído al abrirlo:", userId);
    setReadChats((prev) => [...new Set([...prev, userId])]);
    handleRowClick(userId);
  };

  return (
    <div className="w-full">
      <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {paginatedChats.length > 0 ? (
          paginatedChats.map(({ latestMessage, departments }) => {
            const messages = grouped[latestMessage.user_id] || [];
            const lastAgentMessage = [...messages]
              .filter((msg) => msg.role === "assistant" && msg.status === "AGENTE")
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            const pendingMessages = messages.filter(
              (msg) =>
                msg.role === "user" &&
                (!lastAgentMessage || new Date(msg.created_at) > new Date(lastAgentMessage.created_at))
            );

            const unreadCount = pendingMessages.length;
            const isUnread = unreadChats.includes(latestMessage.user_id);
            console.log(`🔄 Renderizado: Chat ${latestMessage.user_id} - ¿Es no leído? ${isUnread} (Conteo de mensajes pendientes: ${unreadCount})`);

            const lastUserMessage = messages
              .filter((msg) => msg.role === "user")
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            const needsAgentAttentionInConversation =
              lastUserMessage &&
              lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") &&
              latestMessage.status !== "AGENTE";

            const formattedDate = new Date(latestMessage.created_at).toLocaleString("es-ES", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            const userDisplay = latestMessage.profile_name
              ? `${latestMessage.profile_name} - ${cleanUserId(latestMessage.user_id)}`
              : cleanUserId(latestMessage.user_id);

            const uniqueDepartments = [...new Set(departments)];

            return (
              <div
                key={latestMessage.user_id}
                className={`relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  needsAgentAttentionInConversation ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                }`}
                onClick={() => handleOpenChat(latestMessage.user_id)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                    <User className="w-6 h-6" />
                  </div>
                  {isUnread && unreadCount > 0 && (
                    <span
                      onClick={(e) => handleBadgeClick(e, latestMessage.user_id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110"
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <Text className="font-semibold truncate pr-2">{userDisplay}</Text>
                    <Text size="small" className="text-gray-400 flex-shrink-0">
                      {formattedDate}
                    </Text>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <Text className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {latestMessage.message}
                    </Text>
                    {needsAgentAttentionInConversation && (
                      <AlertTriangle className="w-4 h-4 text-orange-500 ml-2 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex gap-2 mt-1 flex-wrap items-center">
                    <Badge size="small" color={latestMessage.status === "IA" ? "blue" : "purple"}>
                      {latestMessage.status}
                    </Badge>

                    {uniqueDepartments.map((dept) => (
                      <Badge
                        key={dept}
                        size="small"
                        color={departmentColors[dept]}
                        className="flex items-center gap-1"
                      >
                        {dept}
                        <button
                          onClick={(e) => handleRemoveClick(e, latestMessage.user_id, dept)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === latestMessage.user_id ? null : latestMessage.user_id);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {dropdownOpen === latestMessage.user_id && (
                        <div
                          className="absolute mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 w-max origin-top-right animate-in fade-in-0 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {allDepartments
                            .filter((d) => !uniqueDepartments.includes(d))
                            .map((dept) => (
                              <div
                                key={dept}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                onClick={(e) => handleAssignClick(e, latestMessage.user_id, dept)}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    departmentColors[dept] === "blue"
                                      ? "bg-blue-500"
                                      : departmentColors[dept] === "green"
                                      ? "bg-green-500"
                                      : departmentColors[dept] === "purple"
                                      ? "bg-purple-500"
                                      : departmentColors[dept] === "orange"
                                      ? "bg-orange-500"
                                      : "bg-gray-500"
                                  }`}
                                ></span>
                                <span>{dept}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            size="small"
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
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatTable;