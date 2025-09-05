import { Text, Badge, Button } from "@medusajs/ui";
import { AlertTriangle, ChevronLeft, ChevronRight, User, Plus, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Department } from "../types/chat";
import { cleanUserId } from "../utils/chat-helpers";
import { departmentColors } from "../utils/department";

type Props = {
  paginatedChats: { latestMessage: ChatMessage; departments: Department[]; autoDepartment: Department }[];
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
  const allDepartments = Object.keys(departmentColors) as Department[];
  const prevUnreadCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Cargar chats leídos del localStorage
    const saved = localStorage.getItem("readChats");
    if (saved) {
      setReadChats(JSON.parse(saved));
    }

    // 2. Deshabilitado: Solicitar permiso para notificaciones
    // if ("Notification" in window && Notification.permission !== "denied") {
    //   Notification.requestPermission();
    // }
  }, []);

  useEffect(() => {
    // Sincronizar chats leídos con localStorage
    localStorage.setItem("readChats", JSON.stringify(readChats));
  }, [readChats]);

  // Se mueve la lógica de unreadChats a un useMemo para optimizar
  const unreadChats = React.useMemo(() => {
    return paginatedChats
      .filter(({ latestMessage }) => {
        // Solo notifica chats en modo 'AGENTE'
        if (latestMessage.status !== "AGENTE") return false;

        const messages = grouped[latestMessage.user_id] || [];
        const lastAgentMessage = messages
          .filter((msg) => msg.role === "assistant" && msg.status === "AGENTE")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const pendingMessages = messages.filter(
          (msg) =>
            msg.role === "user" &&
            (!lastAgentMessage || new Date(msg.created_at) > new Date(lastAgentMessage.created_at))
        );
        return pendingMessages.length > 0;
      })
      .map(({ latestMessage }) => latestMessage.user_id)
      .filter((id) => !readChats.includes(id));
  }, [paginatedChats, grouped, readChats]);

  // Deshabilitado: useEffect para manejar las notificaciones y el sonido
  // useEffect(() => {
  //   if (unreadChats.length > prevUnreadCountRef.current && unreadChats.length > 0) {
  //     // Si hay chats nuevos sin leer, emite la notificación y el sonido
  //     const newChatId = unreadChats.find(id => !readChats.includes(id));
  //     if (newChatId) {
  //       const chat = paginatedChats.find(c => c.latestMessage.user_id === newChatId);
  //       if (chat) {
  //         showNotification(chat.latestMessage.profile_name || cleanUserId(chat.latestMessage.user_id), chat.latestMessage.message);
  //       }
  //     }
  //     playSound();
  //   }
  //   prevUnreadCountRef.current = unreadChats.length;
  // }, [unreadChats, paginatedChats, readChats]);

  // Deshabilitado: Inicializar el objeto de audio una sola vez
  // useEffect(() => {
  //   audioRef.current = new Audio("../../../../../public/notification.mp3");
  //   audioRef.current.preload = "auto";
  // }, []);

  // Deshabilitado: Funciones para manejar sonido y notificaciones
  // const playSound = () => {
  //   if (audioRef.current) {
  //     audioRef.current.play().catch((err) => {
  //       console.error("⚠️ Error al reproducir el sonido:", err);
  //     });
  //   }
  // };

  // const showNotification = (title: string, body: string) => {
  //   if ("Notification" in window && Notification.permission === "granted") {
  //     const notification = new Notification(`Nuevo mensaje de ${title}`, {
  //       body: body,
  //       icon: "/logo.png", // Asegúrate de tener una imagen de logo en la carpeta `public`
  //     });
  //     notification.onclick = () => {
  //       window.focus();
  //       handleRowClick(unreadChats[0]); // Abre el primer chat no leído
  //     };
  //   }
  // };

  const handleAssignClick = (e: React.MouseEvent, userId: string, dept: Department) => {
    e.stopPropagation();
    onAssignDepartment(userId, dept);
    setDropdownOpen(null);
  };

  const handleRemoveClick = (e: React.MouseEvent, userId: string, dept: Department) => {
    e.stopPropagation();
    onRemoveDepartment(userId, dept);
  };

  const handleBadgeClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setReadChats((prev) => [...new Set([...prev, userId])]);
  };

  const handleOpenChat = (userId: string) => {
    setReadChats((prev) => [...new Set([...prev, userId])]);
    handleRowClick(userId);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all duration-400 hover:shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {paginatedChats.length > 0 ? (
            paginatedChats.map(({ latestMessage, departments, autoDepartment }, index) => {
              const messages = grouped[latestMessage.user_id] || [];
              const lastAgentMessage = messages
                .filter((msg) => msg.role === "assistant" && msg.status === "AGENTE")
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              const pendingMessages = messages.filter(
                (msg) =>
                  msg.role === "user" &&
                  (!lastAgentMessage || new Date(msg.created_at) > new Date(lastAgentMessage.created_at))
              );
              const unreadCount = pendingMessages.length;
              const isUnread = unreadChats.includes(latestMessage.user_id);
              const lastUserMessage = messages
                .filter((msg) => msg.role === "user")
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              const needsAgentAttentionInConversation =
                lastUserMessage?.message.toUpperCase().includes("ASISTENCIA PERSONAL") &&
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

              const allAssignedDepartments = [...new Set([autoDepartment, ...departments])];
              const remainingDepartments = allDepartments.filter(d => !allAssignedDepartments.includes(d));

              return (
                <div
                  key={latestMessage.user_id}
                  className={`relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer transition-all duration-400 transform hover:scale-[1.005] z-10 ${
                    needsAgentAttentionInConversation ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                  } ${dropdownOpen === latestMessage.user_id ? "z-20" : ""}`}
                  style={{ animationDelay: `${index * 0.02}s` }}
                  onClick={() => handleOpenChat(latestMessage.user_id)}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold transition-all duration-400 hover:scale-105">
                      <User className="w-6 h-6" />
                    </div>
                    {isUnread && unreadCount > 0 && (
                      <span
                        onClick={(e) => handleBadgeClick(e, latestMessage.user_id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full cursor-pointer transition-all duration-400 hover:scale-105 animate-pulse-slow"
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <Text className="font-semibold truncate pr-2 transition-all duration-400 hover:text-blue-500">{userDisplay}</Text>
                      <Text size="small" className="text-gray-400 flex-shrink-0 transition-all duration-400 hover:text-gray-600">
                        {formattedDate}
                      </Text>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <Text className="text-sm text-gray-600 dark:text-gray-300 truncate transition-all duration-400 hover:text-gray-800 dark:hover:text-gray-100">
                        {latestMessage.message}
                      </Text>
                      {needsAgentAttentionInConversation && (
                        <AlertTriangle className="w-4 h-4 text-orange-500 ml-2 flex-shrink-0 animate-pulse-slow" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap items-center">
                      <Badge
                        size="small"
                        color={latestMessage.status === "IA" ? "blue" : "purple"}
                        className="transition-all duration-400 hover:scale-[1.03]"
                      >
                        {latestMessage.status}
                      </Badge>
                      {allAssignedDepartments
                        .filter((dept) => dept && dept.trim() !== "")
                        .map((dept) => {
                          const isAuto = dept === autoDepartment;
                          const isDeletable = !isAuto || allAssignedDepartments.length > 1;

                          return (
                            <Badge
                              key={dept}
                              size="small"
                              color={departmentColors[dept]}
                              className="flex items-center gap-1 transition-all duration-400 hover:scale-[1.03]"
                            >
                              {dept}
                              {isDeletable && (
                                <button
                                  onClick={(e) => handleRemoveClick(e, latestMessage.user_id, dept)}
                                  className="text-gray-400 hover:text-white transition-all duration-400 hover:rotate-90"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          );
                        })}
                      <div className="relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === latestMessage.user_id ? null : latestMessage.user_id);
                          }}
                          className="ml-1 text-gray-500 hover:text-gray-700 transition-all duration-400 hover:rotate-90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {dropdownOpen === latestMessage.user_id && remainingDepartments.length > 0 && (
                          <div
                            className="absolute mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 w-max origin-top-right animate-in fade-in-0 duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {remainingDepartments.map((dept) => (
                              <div
                                key={dept}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-all duration-400 hover:scale-[1.03]"
                                onClick={(e) => handleAssignClick(e, latestMessage.user_id, dept)}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full transition-all duration-400 hover:scale-110 ${
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
            <div className="flex items-center justify-center h-20 animate-fade-in">
              <Text className="text-center text-gray-500 transition-all duration-400 hover:text-gray-700">No se encontraron chats con esos filtros.</Text>
            </div>
          )}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 animate-fade-in-top">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            size="small"
            className="transition-all duration-400 hover:scale-[1.03] disabled:scale-100"
          >
            <ChevronLeft className="w-4 h-4 transition-transform duration-400 group-hover:-translate-x-1" /> Anterior
          </Button>
          <Text size="small" className="text-gray-500 transition-all duration-400 hover:text-gray-700">
            Página {page + 1} de {totalPages}
          </Text>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            size="small"
            className="transition-all duration-400 hover:scale-[1.03] disabled:scale-100"
          >
            Siguiente <ChevronRight className="w-4 h-4 transition-transform duration-400 group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatTable;