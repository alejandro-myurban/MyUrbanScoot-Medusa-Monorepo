import { Container, Heading, Text, Badge, Button, Input } from "@medusajs/ui";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { BotMessageSquare, ChevronLeft, Send, MessageSquarePlus, User, Bot, Crown, AlertTriangle, Trash, Image as ImageIcon } from "lucide-react";
import { sdk } from "../../../lib/sdk";
import { cleanUserId, groupChatsByUser } from "../utils/chat-helpers";

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

  // ✅ Lógica corregida para la detección de mensajes de imagen.
  const imageMarker = "[Imagen] - ";
  const imageMarkerIndex = message.indexOf(imageMarker);
  const isImageMessage = imageMarkerIndex !== -1;
  const imageUrl = isImageMessage ? message.substring(imageMarkerIndex + imageMarker.length) : null;
  const textMessage = isImageMessage ? message.substring(0, imageMarkerIndex).trim() : message;

  // Lógica para detectar mensajes con opciones (de la versión vieja)
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
        
        {/* Lógica fusionada: si es mensaje de opciones, lo muestra como botones. Si es de imagen, la muestra. Si no, es texto normal. */}
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
          <>
            {textMessage && <Text className="whitespace-pre-wrap">{textMessage}</Text>}
            {isImageMessage && (
              <div className="flex flex-col items-start gap-2 mt-2">
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={imageUrl} 
                    alt="Imagen compartida en el chat" 
                    className="max-w-full h-auto rounded-md shadow-md"
                    style={{ maxHeight: '250px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400?text=Imagen+no+disponible';
                    }}
                  />
                </a>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-4 h-4" />
                  <Text size="small">Imagen enviada</Text>
                </div>
              </div>
            )}
          </>
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


const ChatDetailsPage = () => {
  const pathname = window.location.pathname;
  const parts = pathname.split('/');
  const encodedUserId = parts[parts.length - 1];
  
  const userid = encodedUserId ? decodeURIComponent(encodedUserId) : undefined;
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [agentMessage, setAgentMessage] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ["chat-history", userid],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ history: ChatMessage[] }>(
        `/admin/chat-history?userId=${userid}`,
        { method: "GET" }
      );
      return res.history || [];
    },
    enabled: !!userid,
    refetchInterval: 4000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: "IA" | "AGENTE") => {
      if (!userid) throw new Error("No user ID found");
      return sdk.client.fetch(`/admin/chat-status/${encodeURIComponent(userid)}`, {
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
      if (!userid) throw new Error("No user ID found");
      return sdk.client.fetch(`/admin/send-message/${encodeURIComponent(userid)}`, {
        method: "POST",
        body: { message },
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      setAgentMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error) => {
      console.error("Error en la mutación sendMessage:", error);
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (userId: string) => {
      return sdk.client.fetch(`/admin/delete-conversation/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      navigate(-1);
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error) => {
      console.error("Error en la mutación deleteConversation:", error);
    }
  });

  const userMessages = useMemo(() => {
    const grouped = groupChatsByUser(data || []);
    return grouped[userid] || [];
  }, [data, userid]);

  const currentStatus =
    userMessages.length > 0
      ? userMessages.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].status
      : "IA";
  
  const lastUserMessage = userMessages.filter(msg => msg.role === 'user').sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const needsAgentAttention = lastUserMessage && lastUserMessage.message.toUpperCase().includes("ASISTENCIA PERSONAL") && currentStatus !== "AGENTE";

  const handleTextareaChange = (e) => {
    setAgentMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSendMessage = () => {
    if (agentMessage.trim() && userid) {
      sendMessageMutation.mutate(agentMessage);
    }
  };

  const handleDeleteConversation = () => {
    if (userid) {
      if (window.confirm(`¿Estás seguro de que quieres eliminar esta conversación con ${cleanUserId(userid)}? Esta acción es irreversible.`)) {
        deleteConversationMutation.mutate(userid);
      }
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userMessages]);

  if (!userid) {
    return (
      <Container><Text>No se encontró un ID de chat.</Text></Container>
    );
  }

  if (isLoading) {
    return (
      <Container><Heading level="h2">Cargando Chat...</Heading></Container>
    );
  }

  if (error) {
    return (
      <Container><Text className="text-red-500">Error al cargar el chat.</Text></Container>
    );
  }
  
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
            onClick={() => navigate(-1)}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </Button>
          <Heading level="h2">Chat con {cleanUserId(userid)}</Heading>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="small"
            onClick={handleDeleteConversation}
            isLoading={deleteConversationMutation.isPending}
            className="flex items-center gap-1"
          >
            <Trash className="w-4 h-4" /> Eliminar
          </Button>
          <Badge color={currentStatus === "IA" ? "blue" : "purple"}>
            {currentStatus}
          </Badge>
          <select
            value={currentStatus}
            onChange={(e) => updateStatusMutation.mutate(e.target.value as "IA" | "AGENTE")}
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
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
};

export default ChatDetailsPage;