import { Container, Heading, Text } from "@medusajs/ui";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { cleanUserId, groupChatsByUser } from "./utils/chat-helpers";
import { getDepartment } from "./utils/department";
import { AlertTriangle, Crown, Search, Info, BotMessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Filters from "./components/filters";
import GuideItem from "./components/guideItem";
import ChatTable from "./components/chatTable";
import { ChatMessage, Department } from "./types/chat";

const getSavedDepartments = (): Record<string, Department[]> => {
  try {
    const saved = localStorage.getItem('chatDepartments');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("Error al cargar departamentos desde localStorage", e);
    return {};
  }
};

const saveDepartments = (departments: Record<string, Department[]>) => {
  try {
    localStorage.setItem('chatDepartments', JSON.stringify(departments));
  } catch (e) {
    console.error("Error al guardar departamentos en localStorage", e);
  }
};

const ChatHistoryDashboard = () => {
  const navigate = useNavigate();
  const [searchUserId, setSearchUserId] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "IA" | "AGENTE">("TODOS");
  const [filterDepartment, setFilterDepartment] = useState<"TODOS" | Department>("TODOS");
  const [page, setPage] = useState(0);
  const [manualDepartments, setManualDepartments] = useState<Record<string, Department[]>>(getSavedDepartments);

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
    const chatsWithDept: Record<string, { latestMessage: ChatMessage; departments: Department[] }> = {};
    for (const userId in grouped) {
      if (grouped[userId].length > 0) {
        const latestMessage = grouped[userId].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const autoDepartment = getDepartment(grouped[userId]);
        const manualDeptArray = manualDepartments[userId] || [];
        // ✅ Lógica corregida para combinar departamentos
        const combinedDepts = [...new Set([...manualDeptArray, autoDepartment])];
        chatsWithDept[userId] = { latestMessage, departments: combinedDepts };
      }
    }
    return chatsWithDept;
  }, [grouped, manualDepartments]);

  const filteredHistory = useMemo(() => {
    let chatsArray = Object.values(chatsByDepartment);

    if (searchUserId) {
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        cleanUserId(latestMessage.user_id).includes(searchUserId)
      );
    }
    if (searchDate) {
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        latestMessage.created_at.startsWith(searchDate)
      );
    }
    if (searchKeyword) {
      chatsArray = chatsArray.filter(({ latestMessage }) =>
        latestMessage.message.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    if (filterDepartment !== "TODOS") {
      chatsArray = chatsArray.filter(({ departments }) => departments.includes(filterDepartment));
    }
    if (filterStatus === "AGENTE") {
      chatsArray = chatsArray.filter(({ latestMessage }) => latestMessage.status === "AGENTE");
    }

    return chatsArray.sort(
      (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
    );
  }, [chatsByDepartment, searchUserId, searchDate, searchKeyword, filterDepartment, filterStatus]);

  const handleAssignDepartment = (userId: string, dept: Department) => {
    setManualDepartments(prev => {
      const newDepartments = {
        ...prev,
        [userId]: prev[userId] ? [...new Set([...prev[userId], dept])] : [dept]
      };
      saveDepartments(newDepartments);
      return newDepartments;
    });
  };

  const handleRemoveDepartment = (userId: string, deptToRemove: Department) => {
    setManualDepartments(prev => {
      const updatedDepts = prev[userId]?.filter(dept => dept !== deptToRemove);
      const newDepartments = {
        ...prev,
        [userId]: updatedDepts
      };
      saveDepartments(newDepartments);
      return newDepartments;
    });
  };

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

      <Filters
        searchUserId={searchUserId}
        setSearchUserId={setSearchUserId}
        searchDate={searchDate}
        setSearchDate={setSearchDate}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

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
          <GuideItem
            icon={<Info className="w-5 h-5 text-yellow-500" />}
            title="Fila Destacada"
            description="Una fila con este fondo resalta chats que necesitan ser revisados por un agente."
          />
        </div>
      </div>

      <ChatTable
        paginatedChats={paginatedChats}
        grouped={grouped}
        handleRowClick={handleRowClick}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        onAssignDepartment={handleAssignDepartment}
        onRemoveDepartment={handleRemoveDepartment}
      />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Historial de Chats",
  icon: BotMessageSquare,
});

export default ChatHistoryDashboard;