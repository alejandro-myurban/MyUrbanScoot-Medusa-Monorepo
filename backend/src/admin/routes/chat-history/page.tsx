import { Container, Heading, Table, Text, Badge, Button, Input } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { MessageCircle, BotMessageSquare,ChevronLeft, CalendarDays, Search } from "lucide-react";
import { sdk } from "../../lib/sdk";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
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
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchUserId, setSearchUserId] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");

  const { data, isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["chat-history"],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ history: ChatMessage[] }>("/admin/chat-history", { method: "GET" });
      if (Array.isArray(res.history)) {
        return res.history;
      }
      return [];
    },
    refetchInterval: 4000, // Refresca cada 4 segundos
  });

  const history = data || [];

  const filteredHistory = useMemo(() => {
    let filtered = history;
    if (searchUserId) {
      filtered = filtered.filter(msg => cleanUserId(msg.user_id).includes(searchUserId));
    }

    if (searchDate) {
      const filterDate = new Date(searchDate).toISOString().split('T')[0];
      filtered = filtered.filter(msg => msg.created_at.startsWith(filterDate));
    }

    return filtered;
  }, [history, searchUserId, searchDate]);

  const grouped = groupChatsByUser(filteredHistory);

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
    return (
      <Container>
        <div className="flex items-center gap-4 mb-4">
          <Button variant="secondary" size="small" onClick={() => setSelectedUser(null)}>
            <ChevronLeft className="w-4 h-4" /> Volver
          </Button>
          <Heading level="h2">Chat con {cleanUserId(selectedUser)}</Heading>
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {userMessages
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col mb-2 ${
                  msg.role === "assistant" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 shadow-md ${
                    msg.role === "assistant"
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "bg-blue-500 text-white dark:bg-blue-600"
                  }`}
                >
                  <Text size="small" className="font-bold mb-1">
                    {msg.role === "assistant" ? "Asistente" : "Usuario"}
                  </Text>
                  <Text className="whitespace-pre-wrap">{msg.message}</Text>
                  <Text
                    size="xsmall"
                    className={`mt-1 ${
                      msg.role === "assistant" ? "text-gray-400" : "text-white/70"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleString("es-ES")}
                  </Text>
                </div>
              </div>
            ))}
        </div>
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
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Usuario</Table.HeaderCell>
            <Table.HeaderCell>Último Mensaje</Table.HeaderCell>
            <Table.HeaderCell>Fecha</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.entries(grouped).length > 0 ? (
            Object.entries(grouped).map(([user_id, msgs]) => {
              const lastMsg = msgs.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];
              return (
                <Table.Row key={user_id}>
                  <Table.Cell>
                    <Text className="font-mono">{cleanUserId(user_id)}</Text>
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
                    <Button variant="primary" size="small" onClick={() => setSelectedUser(user_id)}>
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
                  <Text className="text-center text-gray-500">No se encontraron chats con esos filtros.</Text>
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Historial de Chats",
  icon: BotMessageSquare,
});

export default ChatHistoryDashboard;