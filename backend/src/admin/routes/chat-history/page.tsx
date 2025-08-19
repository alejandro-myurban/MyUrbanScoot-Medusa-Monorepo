import { Container, Heading, Table, Text, Badge, Button, Input } from "@medusajs/ui";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BotMessageSquare, CalendarDays, Search, ChevronLeft, ChevronRight, AlertTriangle, Crown, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { groupChatsByUser, cleanUserId } from "./utils/chat-helpers";

// Definimos el tipo de mensaje para asegurar la consistencia de los datos
type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
  status: "IA" | "AGENTE";
  conversation_id?: string;
};

type Department = "Consultas generales sobre productos" | "Consultas pedidos web" | "Financiacion" | "Modificacion / recogida + entrega" | "Otros";

const departmentKeywords: Record<Department, string[]> = {
  "Consultas generales sobre productos": ["producto", "caracteristicas", "especificaciones", "modelo", "talla", "color"],
  "Consultas pedidos web": ["pedido", "orden", "compra", "rastreo", "envío", "web", "online"],
  "Financiacion": ["financiamiento", "pagos", "cuotas", "crédito", "tarjeta", "intereses", "financiación"],
  "Modificacion / recogida + entrega": ["modificar", "cambiar", "recojo", "recogida", "entrega", "dirección", "cita", "citar"],
  "Otros": [],
};

// 💡 Objeto corregido para asignar colores a los departamentos
const departmentColors: Record<Department, "grey" | "blue" | "green" | "orange" | "purple" | "red"> = {
  "Consultas generales sobre productos": "blue",
  "Consultas pedidos web": "green",
  "Financiacion": "purple",
  "Modificacion / recogida + entrega": "orange",
  "Otros": "grey",
};

// Función para asignar un departamento basado en palabras clave
const getDepartment = (messages: ChatMessage[]): Department => {
  for (const message of messages) {
    const text = message.message.toLowerCase();
    for (const department in departmentKeywords) {
      if (department === "Otros") continue;
      for (const keyword of departmentKeywords[department as Department]) {
        if (text.includes(keyword)) {
          return department as Department;
        }
      }
    }
  }
  return "Otros";
};

// Componente para una fila de la guía rápida
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
  const navigate = useNavigate();
  const [searchUserId, setSearchUserId] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "IA" | "AGENTE">("TODOS");
  const [filterDepartment, setFilterDepartment] = useState<"TODOS" | Department>("TODOS");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["chat-history", filterStatus],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ history: ChatMessage[] }>(
        `/admin/chat-history?status=${filterStatus}`,
        { method: "GET" }
      );
      return res.history || [];
    },
    refetchInterval: 4000,
  });

  const history = data || [];

  const grouped = useMemo(() => groupChatsByUser(history), [history]);

  const chatsByDepartment = useMemo(() => {
    const chatsWithDept: Record<string, { latestMessage: ChatMessage, department: Department }> = {};
    for (const userId in grouped) {
      if (grouped[userId].length > 0) {
        const latestMessage = grouped[userId].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const department = getDepartment(grouped[userId]);
        chatsWithDept[userId] = { latestMessage, department };
      }
    }
    return chatsWithDept;
  }, [grouped]);

  const filteredHistory = useMemo(() => {
    let chatsArray = Object.values(chatsByDepartment);
    
    if (searchUserId) {
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        cleanUserId(latestMessage.user_id).includes(searchUserId)
      );
    }
    if (searchDate) {
      const filterDate = new Date(searchDate).toISOString().split("T")[0];
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        latestMessage.created_at.startsWith(filterDate)
      );
    }
    if (searchKeyword) {
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        latestMessage.message.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    if (filterDepartment !== "TODOS") {
      chatsArray = chatsArray.filter(({ department }) => department === filterDepartment);
    }
    if (filterStatus === "AGENTE") {
      chatsArray = chatsArray.filter(({ latestMessage }) => latestMessage.status === "AGENTE");
    }

    return chatsArray.sort(
      (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
    );
  }, [chatsByDepartment, searchUserId, searchDate, searchKeyword, filterDepartment, filterStatus]);

  const itemsPerPage = 100;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedChats = useMemo(() => {
    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredHistory.slice(start, end);
  }, [filteredHistory, page, itemsPerPage]);

  const handleRowClick = (userId: string) => {
    navigate(`/chat-history/${encodeURIComponent(userId)}`);
  };

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
            placeholder="Filtrar por palabra clave..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value as "TODOS" | Department)}
          className="w-full md:w-auto px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODOS">Todos los departamentos</option>
          <option value="Consultas generales sobre productos">Consultas generales sobre productos</option>
          <option value="Consultas pedidos web">Consultas pedidos web</option>
          <option value="Financiacion">Financiación</option>
          <option value="Modificacion / recogida + entrega">Modificación / recogida + entrega</option>
          <option value="Otros">Otros</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "TODOS" | "IA" | "AGENTE")}
          className="w-full md:w-auto px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="AGENTE">Chats en AGENTE</option>
          <option value="IA">Chats en IA</option>
        </select>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <GuideItem 
            icon={<BotMessageSquare className="w-5 h-5 text-blue-500" />}
            title="Modo IA"
            description="El chat está siendo gestionado por el asistente de IA."
          />
          <GuideItem 
            icon={<Crown className="w-5 h-5 text-purple-500" />}
            title="Modo AGENTE"
            description="El chat está en modo manual. Un agente puede responder."
          />
          <GuideItem 
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            title="Atención Urgente"
            description="El último mensaje del usuario ha solicitado asistencia personal."
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
            <Table.HeaderCell>Departamento</Table.HeaderCell>
            <Table.HeaderCell>Último Mensaje</Table.HeaderCell>
            <Table.HeaderCell>Fecha</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paginatedChats.length > 0 ? (
            paginatedChats.map(({ latestMessage, department }) => {
              const lastUserMessage = grouped[latestMessage.user_id]?.filter(msg => msg.role === 'user').sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];
              const needsAgentAttentionInConversation = lastUserMessage && lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") && latestMessage.status !== 'AGENTE';
              const lastMessageDate = new Date(latestMessage.created_at);
              const formattedDate = isNaN(lastMessageDate.getTime()) ? 'Invalid Date' : lastMessageDate.toLocaleString("es-ES");

              return (
                <Table.Row 
                  key={latestMessage.user_id} 
                  className={`transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${needsAgentAttentionInConversation ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                  onClick={() => handleRowClick(latestMessage.user_id)}
                >
                  <Table.Cell>
                    <Text className="font-mono flex items-center gap-2">
                      {cleanUserId(latestMessage.user_id)}
                      {needsAgentAttentionInConversation && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={latestMessage.status === "IA" ? "blue" : "purple"}>
                      {latestMessage.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={departmentColors[department]}>{department}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="truncate max-w-xs">{latestMessage.message}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-gray-400">
                      {formattedDate}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button variant="primary" size="small">
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
                  </Text></div>
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