import { Container, Heading, Text } from "@medusajs/ui";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { cleanUserId, groupChatsByUser } from "./utils/chat-helpers";
import { AlertTriangle, Crown, Search, Info, BotMessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Filters from "./components/filters";
import GuideItem from "./components/guideItem";
import ChatTable from "./components/chatTable";
import { ChatMessage, Department } from "./types/chat";
import { getDepartment } from "./utils/department";

const getSavedDepartments = (): Record<string, Department[]> => {
  try {
    const saved = localStorage.getItem("chatDepartments");
    if (!saved) return {};
    const parsedDepartments = JSON.parse(saved);
    const normalizedDepartments: Record<string, Department[]> = {};
    for (const userId in parsedDepartments) {
      const normalizedKey = cleanUserId(userId);
      normalizedDepartments[normalizedKey] = parsedDepartments[userId];
    }
    return normalizedDepartments;
  } catch (e) {
    console.error("❌ Error al cargar departamentos desde localStorage", e);
    return {};
  }
};

const saveDepartments = (departments: Record<string, Department[]>) => {
  try {
    localStorage.setItem("chatDepartments", JSON.stringify(departments));
  } catch (e) {
    console.error("❌ Error al guardar departamentos en localStorage", e);
  }
};

const getRemovedDepartments = (): Record<string, Department[]> => {
  try {
    const saved = localStorage.getItem("removedDepartments");
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const normalized: Record<string, Department[]> = {};
    for (const userId in parsed) {
      const normalizedKey = cleanUserId(userId);
      normalized[normalizedKey] = parsed[userId];
    }
    return normalized;
  } catch (e) {
    console.error("❌ Error al cargar removedDepartments", e);
    return {};
  }
};

const saveRemovedDepartments = (removed: Record<string, Department[]>) => {
  try {
    localStorage.setItem("removedDepartments", JSON.stringify(removed));
  } catch (e) {
    console.error("❌ Error al guardar removedDepartments", e);
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
  const [removedDepartments, setRemovedDepartments] = useState<Record<string, Department[]>>(getRemovedDepartments);

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
    const chatsWithDept: Record<
      string,
      { latestMessage: ChatMessage; departments: Department[]; autoDepartment: Department | null }
    > = {};
    for (const userId in grouped) {
      if (grouped[userId].length > 0) {
        const latestMessage = grouped[userId].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const autoDepartment = getDepartment(grouped[userId]);
        const normalizedUserId = cleanUserId(userId);

        const manualDeptArray = manualDepartments[normalizedUserId] || [];
        const removedDeptArray = removedDepartments[normalizedUserId] || [];

        const isAutoDeptRemoved = removedDeptArray.includes(autoDepartment);
        const visibleAutoDept = isAutoDeptRemoved ? null : autoDepartment;

        chatsWithDept[userId] = {
          latestMessage,
          departments: manualDeptArray,
          autoDepartment: visibleAutoDept,
        };
      }
    }
    return chatsWithDept;
  }, [grouped, manualDepartments, removedDepartments]);

  const filteredHistory = useMemo(() => {
    let chatsArray = Object.values(chatsByDepartment);
    
    // Filtro por palabra clave: busca en TODOS los mensajes del chat
    if (searchKeyword) {
      chatsArray = chatsArray.filter(({ latestMessage }) => {
        const messagesForUser = grouped[latestMessage.user_id] || [];
        return messagesForUser.some(msg =>
          msg.message.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      });
    }

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
    
    if (filterDepartment !== "TODOS") {
      chatsArray = chatsArray.filter(
        ({ departments, autoDepartment }) =>
          departments.includes(filterDepartment) || autoDepartment === filterDepartment
      );
    }
    if (filterStatus === "AGENTE") {
      chatsArray = chatsArray.filter(({ latestMessage }) => latestMessage.status === "AGENTE");
    }
    
    return chatsArray.sort(
      (a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime()
    );
  }, [chatsByDepartment, searchUserId, searchDate, searchKeyword, filterDepartment, filterStatus, grouped]);

  const handleAssignDepartment = (userId: string, dept: Department) => {
    const normalizedUserId = cleanUserId(userId);
    setManualDepartments(prev => {
      const newDepartments = {
        ...prev,
        [normalizedUserId]: prev[normalizedUserId] ? [...new Set([...prev[normalizedUserId], dept])] : [dept],
      };
      saveDepartments(newDepartments);
      return newDepartments;
    });

    // Si asignas un departamento manual, se desoculta el departamento automático si había sido eliminado
    setRemovedDepartments(prev => {
      if (prev[normalizedUserId] && prev[normalizedUserId].includes(dept)) {
        const updatedRemoved = prev[normalizedUserId].filter(d => d !== dept);
        const newState = { ...prev, [normalizedUserId]: updatedRemoved };
        saveRemovedDepartments(newState);
        return newState;
      }
      return prev;
    });
  };

  const handleRemoveDepartment = (userId: string, deptToRemove: Department) => {
    const normalizedUserId = cleanUserId(userId);
    const autoDept = getDepartment(grouped[userId] || []);

    if (deptToRemove === autoDept) {
      // Se elimina el departamento automático
      setRemovedDepartments(prev => {
        const updatedRemoved = {
          ...prev,
          [normalizedUserId]: [...new Set([...(prev[normalizedUserId] || []), deptToRemove])],
        };
        saveRemovedDepartments(updatedRemoved);
        return updatedRemoved;
      });
    } else {
      // Se elimina un departamento manual
      setManualDepartments(prev => {
        const userManualDepts = prev[normalizedUserId] || [];
        const updatedDepts = userManualDepts.filter(d => d !== deptToRemove);
        const newDepartments = { ...prev, [normalizedUserId]: updatedDepts };
        saveDepartments(newDepartments);
        return newDepartments;
      });
    }
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