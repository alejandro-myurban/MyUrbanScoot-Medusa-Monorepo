import { Container, Heading, Table, Text, Badge, Button, Input } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BotMessageSquare, ChevronLeft, CalendarDays, Search, ChevronRight, Send, MessageSquarePlus, User, Bot, Crown, AlertTriangle, Info, Trash } from "lucide-react";
import { sdk } from "../../lib/sdk";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
  status: "IA" | "AGENTE";
  conversation_id?: string;
};

const groupChatsByUser = (messages: ChatMessage[]) => {
  const grouped: Record<string, ChatMessage[]> = {};
  messages.forEach((msg) => {
    if (!grouped[msg.user_id]) grouped[msg.user_id] = [];
    grouped[msg.user_id].push(msg);
  });
  return grouped;
};

const cleanUserId = (userId: string) => {
  return userId.replace("whatsapp:", "");
};

// Componente para manejar las burbujas de chat
const ChatBubble = ({ message, role, status, created_at }: ChatMessage) => {
  const isAssistant = role === "assistant";
  const isAgent = isAssistant && status === "AGENTE";
  const isAI = isAssistant && status === "IA";
  
  let senderLabel = "Usuario";
  let icon = <User className="w-4 h-4 text-white" />;
  
  if (isAgent) {
    senderLabel = "Agente";
    icon = <Crown className="w-4 h-4 text-white" />;
  } else if (isAI) {
    senderLabel = "Asistente";
    icon = <Bot className="w-4 h-4 text-white" />;
  }

  const optionsRegex = /^\d+\.\s.*$/gm;
  const isOptionsMessage = isAssistant && message.match(optionsRegex);
  const messageLines = message.split('\n');

  const formattedDate = useMemo(() => {
    const date = new Date(created_at);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString("es-ES");
  }, [created_at]);

  return (
    <div
      className={`flex items-start gap-3 ${
        isAssistant ? "justify-end" : "justify-start"
      }`}
    >
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg p-3 shadow-md transition-all duration-300 ${
          isAssistant
            ? "bg-gray-100 dark:bg-gray-700"
            : "bg-blue-500 text-white dark:bg-blue-600"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {isAssistant && (
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full ${isAgent ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center shadow-sm`}
            >
              {icon}
            </div>
          )}
          <Text size="small" className={`font-bold ${isAssistant ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`}>
            {senderLabel}
          </Text>
        </div>
        
        {isOptionsMessage ? (
          <>
            <Text className="mb-2 whitespace-pre-wrap">{messageLines[0]}</Text>
            <div className="flex flex-col gap-2 mt-2">
              {messageLines.slice(1).map((line, index) => {
                const optionText = line.trim();
                if (!optionText) return null;
                return (
                  <Button key={index} variant="secondary" className="justify-start text-left w-full">
                    {optionText}
                  </Button>
                );
              })}
            </div>
          </>
        ) : (
          <Text className="whitespace-pre-wrap">{message}</Text>
        )}
        
        <Text
          size="xsmall"
          className={`mt-1 text-right ${
            isAssistant ? "text-gray-400" : "text-white/70"
          }`}
        >
          {formattedDate}
        </Text>
      </div>
    </div>
  );
};

const GuideItem = ({ icon, title, description }: { icon: JSX.Element, title: string, description: string }) => (
  <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <Text className="font-semibold text-gray-700 dark:text-gray-200">{title}</Text>
    </div>
    <Text size="small" className="text-gray-600 dark:text-gray-400">{description}</Text>
  </div>
);

const ChatHistoryDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchUserId, setSearchUserId] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [agentMessage, setAgentMessage] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "IA" | "AGENTE">("TODOS");
  const [page, setPage] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["chat-history", filterStatus],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ history: ChatMessage[] }>(
        `/admin/chat-history?status=${filterStatus}`,
        { method: "GET" }
      );
      if (Array.isArray(res.history)) {
        return res.history;
      }
      return [];
    },
    refetchInterval: 4000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: "IA" | "AGENTE") => {
      if (!selectedUser) {
        throw new Error("No user selected");
      }
      const url = `/admin/chat-status/${encodeURIComponent(selectedUser)}`;
      console.log("Llamando al endpoint de estado:", url, "con el estado:", newStatus);
      return sdk.client.fetch(url, {
        method: "POST",
        body: { status: newStatus },
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      if (!selectedUser) throw new Error("No user selected");
      const url = `/admin/send-message/${encodeURIComponent(selectedUser)}`;
      console.log("Llamando al endpoint de mensaje:", url, "con el mensaje:", message);
      return sdk.client.fetch(url, {
        method: "POST",
        body: { message },
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      console.log("Mensaje enviado con éxito según el frontend. Invalidando queries...");
      setAgentMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error) => {
      console.error("Error en la mutación sendMessage:", error);
    }
  });

  // NUEVA MUTACIÓN PARA ELIMINAR LA CONVERSACIÓN
  const deleteConversationMutation = useMutation({
    mutationFn: (userId: string) => {
      const url = `/admin/delete-conversation/${encodeURIComponent(userId)}`;
      console.log("🗑️ Llamando al endpoint de eliminación:", url);
      return sdk.client.fetch(url, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      console.log("✅ Conversación eliminada con éxito.");
      setSelectedUser(null); // Vuelve a la vista de lista
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error) => {
      console.error("❌ Error en la mutación deleteConversation:", error);
    }
  });

  const history = data || [];

  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (searchUserId) {
      filtered = filtered.filter((msg) =>
        cleanUserId(msg.user_id).includes(searchUserId)
      );
    }
    if (searchDate) {
      const filterDate = new Date(searchDate).toISOString().split("T")[0];
      filtered = filtered.filter((msg) =>
        msg.created_at.startsWith(filterDate)
      );
    }
    if (searchKeyword) {
      filtered = filtered.filter((msg) =>
        msg.message.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    return filtered;
  }, [history, searchUserId, searchDate, searchKeyword]);

  const grouped = groupChatsByUser(filteredHistory);
  const userChats = useMemo(() => {
    const latestMessages: Record<string, ChatMessage> = {};
    Object.values(grouped).forEach((messages) => {
      const latest = messages.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      if (latest) {
        latestMessages[latest.user_id] = latest;
      }
    });
    const chatsArray = Object.values(latestMessages).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (filterStatus === "AGENTE") {
      return chatsArray.filter((chat) => chat.status === "AGENTE");
    }
    return chatsArray;
  }, [grouped, filterStatus]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(userChats.length / itemsPerPage);
  const paginatedChats = useMemo(() => {
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    return userChats.slice(start, end);
  }, [userChats, page, itemsPerPage]);

  const handleStatusChange = (newStatus: "IA" | "AGENTE") => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleSendMessage = () => {
    if (agentMessage.trim() && selectedUser) {
      sendMessageMutation.mutate(agentMessage);
    }
  };

  const handleDeleteConversation = () => {
    if (selectedUser) {
      if (window.confirm(`¿Estás seguro de que quieres eliminar esta conversación con ${cleanUserId(selectedUser)}? Esta acción es irreversible.`)) {
        deleteConversationMutation.mutate(selectedUser);
      }
    }
  };
  
  // Función para auto-expandir el textarea
  const handleTextareaChange = (e) => {
    setAgentMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser, data]);

  if (isLoading) {
    return (
      <Container>
        <Heading level="h2">Historial de Chats</Heading>
        <Text>Cargando...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Heading level="h2">Historial de Chats</Heading>
        <Text className="text-red-500">Error al cargar los chats</Text>
      </Container>
    );
  }

  if (selectedUser) {
    const userMessages = grouped[selectedUser] || [];
    const currentStatus =
      userMessages.length > 0
        ? userMessages.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )[0].status
        : "IA";
    
    const lastUserMessage = userMessages.filter(msg => msg.role === 'user').sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const needsAgentAttention = lastUserMessage && lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") && currentStatus !== "AGENTE";

    const chatContainerBg = currentStatus === "AGENTE" 
      ? "bg-purple-50 dark:bg-purple-950/30" 
      : "bg-blue-50 dark:bg-blue-950/30";

    return (
      <Container className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSelectedUser(null)}
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </Button>
            <Heading level="h2">Chat con {cleanUserId(selectedUser)}</Heading>
          </div>
          <div className="flex items-center gap-2">
            {/* BOTÓN DE ELIMINAR */}
            <Button
              variant="danger"
              size="small"
              onClick={handleDeleteConversation}
              isLoading={deleteConversationMutation.isPending}
              className="flex items-center gap-1"
            >
              <Trash className="w-4 h-4" /> Eliminar
            </Button>
            <Badge
              color={currentStatus === "IA" ? "blue" : "purple"}
            >
              {currentStatus}
            </Badge>
            <select
              value={currentStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as "IA" | "AGENTE")
              }
              className="px-2 py-1 rounded-lg border-2 border-gray-200 text-sm transition-all duration-200"
            >
              <option value="IA">Modo IA</option>
              <option value="AGENTE">Modo AGENTE</option>
            </select>
          </div>
        </div>

        {needsAgentAttention && (
          <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 mb-4 rounded-lg border border-yellow-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <Text className="font-semibold text-sm">
              El usuario ha solicitado **ASISTENCIA PERSONAL**.
            </Text>
          </div>
        )}

        <div className={`h-[70vh] overflow-y-auto space-y-4 p-4 border rounded-lg shadow-inner ${chatContainerBg}`}>
          {userMessages
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
            .map((msg) => (
              <ChatBubble key={msg.id} {...msg} />
            ))}
          <div ref={chatEndRef} />
        </div>

        {currentStatus === "AGENTE" ? (
          <>
            <div className="p-3 mt-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-300">
                <Text>El bot ha pausado su respuesta. Responde como agente.</Text>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  placeholder="Escribe tu mensaje..."
                  value={agentMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full p-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 resize-none overflow-hidden pl-8 transition-all duration-200 focus:border-blue-500"
                  rows={1}
                />
                <MessageSquarePlus className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <Button
                onClick={handleSendMessage}
                variant="primary"
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Enviar <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="p-3 mt-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            En modo IA, no se pueden enviar mensajes manuales.
          </div>
        )}
      </Container>
    );
  }

  return (
    <Container className="p-4">
      <Heading level="h2" className="mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
        <BotMessageSquare className="w-8 h-8 text-blue-500" /> Historial de Chats
      </Heading>
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Filtrar por número de usuario..."
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative flex-1 w-full md:w-auto">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <CalendarDays className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative flex-1 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Filtrar por palabra clave en el mensaje..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "TODOS" | "IA" | "AGENTE")
          }
          className="w-full md:w-auto px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODOS">Todos los chats</option>
          <option value="AGENTE">Chats en AGENTE</option>
          <option value="IA">Chats en IA</option>
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Heading level="h3" className="text-gray-700 dark:text-gray-200">Guía Rápida</Heading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <GuideItem 
            icon={<BotMessageSquare className="w-5 h-5 text-blue-500" />}
            title="Modo IA"
            description="El chat está siendo gestionado por el asistente de inteligencia artificial."
          />
          <GuideItem 
            icon={<Crown className="w-5 h-5 text-purple-500" />}
            title="Modo AGENTE"
            description="El chat está en modo manual. Un agente puede responder directamente."
          />
          <GuideItem 
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            title="Atención Urgente"
            description="Este ícono indica que el último mensaje del usuario ha solicitado asistencia personal."
          />
          <GuideItem
            icon={<Search className="w-5 h-5 text-gray-500" />}
            title="Búsqueda Avanzada"
            description="Puedes encontrar chats específicos usando palabras clave, ID de usuario o fecha."
          />
          <div className="flex-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800">
               <div className="flex items-center gap-2 mb-2">
               <Info className="w-5 h-5 text-yellow-500" />
               <Text className="font-semibold text-gray-700 dark:text-gray-200">Fila Destacada</Text>
            </div>
            <Text size="small" className="text-gray-600 dark:text-gray-400">Una fila con este fondo resalta chats que necesitan ser revisados por un agente.</Text>
          </div>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Usuario</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell>Último Mensaje</Table.HeaderCell>
            <Table.HeaderCell>Fecha</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedChats.length > 0 ? (
            paginatedChats.map((lastMsg) => {
              const lastUserMessage = grouped[lastMsg.user_id]?.filter(msg => msg.role === 'user').sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];
              const needsAgentAttentionInConversation = lastUserMessage && lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") && lastMsg.status !== 'AGENTE';

              const lastMessageDate = new Date(lastMsg.created_at);
              const formattedDate = isNaN(lastMessageDate.getTime()) ? 'Invalid Date' : lastMessageDate.toLocaleString("es-ES");

              return (
                <Table.Row 
                  key={lastMsg.user_id} 
                  className={`transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${needsAgentAttentionInConversation ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                >
                  <Table.Cell>
                    <Text className="font-mono flex items-center gap-2">
                      {cleanUserId(lastMsg.user_id)}
                      {needsAgentAttentionInConversation && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={lastMsg.status === "IA" ? "blue" : "purple"}
                    >
                      {lastMsg.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="truncate max-w-xs">{lastMsg.message}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-400">
                      {formattedDate}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => setSelectedUser(lastMsg.user_id)}
                    >
                      Ver chat
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell>
                <div className="flex items-center justify-center h-20">
                  <Text className="text-center text-gray-500">
                    No se encontraron chats con esos filtros.
                  </Text>
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            size="small"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <Text size="small">
            Página {page + 1} de {totalPages}
          </Text>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            size="small"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Historial de Chats",
  icon: BotMessageSquare,
});

export default ChatHistoryDashboard;