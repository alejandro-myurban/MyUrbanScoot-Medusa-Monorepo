import { Container, Heading, Table, Text, Badge, Button, Input } from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BotMessageSquare, ChevronLeft, CalendarDays, Search, ChevronRight, Send, MessageSquarePlus, User, Bot, Crown } from "lucide-react";
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

const ChatHistoryDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchUserId, setSearchUserId] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [agentMessage, setAgentMessage] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "IA" | "AGENTE">("TODOS");
  const [page, setPage] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    return filtered;
  }, [history, searchUserId, searchDate]);

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

        <div className="h-[70vh] overflow-y-auto space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          {userMessages
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
            .map((msg) => {
              const isAssistant = msg.role === "assistant";
              const isAgent = isAssistant && msg.status === "AGENTE";
              const isAI = isAssistant && msg.status === "IA";
              const isUser = msg.role === "user";

              let senderLabel = "Usuario";
              let icon = <User className="w-4 h-4 text-white" />;
              
              if (isAgent) {
                senderLabel = "Agente";
                icon = <Crown className="w-4 h-4 text-white" />;
              } else if (isAI) {
                senderLabel = "Asistente";
                icon = <Bot className="w-4 h-4 text-white" />;
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 animate-fade-in ${
                    isAssistant ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isAssistant && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
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
                          className={`flex-shrink-0 w-6 h-6 rounded-full ${isAgent ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center`}
                        >
                          {icon}
                        </div>
                      )}
                      <Text size="small" className={`font-bold ${isAssistant ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`}>
                        {senderLabel}
                      </Text>
                    </div>
                    <Text className="whitespace-pre-wrap">{msg.message}</Text>
                    <Text
                      size="xsmall"
                      className={`mt-1 text-right ${
                        isAssistant ? "text-gray-400" : "text-white/70"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleString("es-ES")}
                    </Text>
                  </div>
                  {isAssistant && (
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full ${isAgent ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center`}
                    >
                      {isAgent ? (
                        <Crown className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          <div ref={chatEndRef} />
        </div>

        {currentStatus === "AGENTE" ? (
          <div className="flex items-center mt-4 gap-2">
            <div className="relative flex-1">
              <textarea
                placeholder="Escribe tu mensaje..."
                value={agentMessage}
                onChange={(e) => setAgentMessage(e.target.value)}
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
        ) : (
          <div className="p-3 mt-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            En modo IA, no se pueden enviar mensajes manuales.
          </div>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <Heading level="h2" className="mb-4 flex items-center gap-2">
        <BotMessageSquare className="w-6 h-6" /> Historial de Chats
      </Heading>
      <div className="flex gap-4 mb-4 items-center">
        <div className="relative">
          <Input
            type="text"
            placeholder="Filtrar por número de usuario..."
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            className="pl-8"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="pl-8"
          />
          <CalendarDays className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "TODOS" | "IA" | "AGENTE")
          }
          className="px-2 py-1 rounded-lg border-2 border-gray-200 text-sm"
        >
          <option value="TODOS">Todos los chats</option>
          <option value="AGENTE">Chats en AGENTE</option>
          <option value="IA">Chats en IA</option>
        </select>
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
              return (
                <Table.Row key={lastMsg.user_id} className="transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Table.Cell>
                    <Text className="font-mono">
                      {cleanUserId(lastMsg.user_id)}
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
                      {new Date(lastMsg.created_at).toLocaleString("es-ES")}
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