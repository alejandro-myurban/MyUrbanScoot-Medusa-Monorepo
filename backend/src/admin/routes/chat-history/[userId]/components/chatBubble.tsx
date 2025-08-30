// src/app/admin/chat-history/[user_id]/components/chatBubble.tsx
import { Text, Badge, Button } from "@medusajs/ui";
import { useMemo } from "react";
import { User, Bot, Crown, ImageIcon, FileText, Paperclip } from "lucide-react";

type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  role: "user" | "assistant";
  created_at: string;
  status: "IA" | "AGENTE";
  conversation_id?: string;
};

type ChatBubbleProps = ChatMessage & {
  user_profile_name?: string;
  agent_name?: string;
};

export const ChatBubble = ({ message, role, status, created_at, user_profile_name, agent_name }: ChatBubbleProps) => {
  const isAssistant = role === "assistant";
  const isAgent = isAssistant && status === "AGENTE";
  const isAI = isAssistant && status === "IA";
  
  let senderLabel = "Usuario";
  let icon = <User className="w-4 h-4 text-white" />;
  
  if (isAgent) {
    icon = <Crown className="w-4 h-4 text-white" />;
    senderLabel = "Agente";
    if (agent_name) {
      senderLabel = `Agente - ${agent_name}`;
    }
  } else if (isAI) {
    senderLabel = "Asistente";
    icon = <Bot className="w-4 h-4 text-white" />;
  }

  const imageMarker = "[Imagen] - ";
  const fileMarker = "[Archivo] - ";
  
  const isImageMessage = message.includes(imageMarker);
  const isFileMessage = message.includes(fileMarker);

  const imageUrl = isImageMessage ? message.substring(message.indexOf(imageMarker) + imageMarker.length) : null;
  const fileUrl = isFileMessage ? message.substring(message.indexOf(fileMarker) + fileMarker.length) : null;
  
  const textMessage = isImageMessage || isFileMessage
    ? message.substring(0, Math.min(
        isImageMessage ? message.indexOf(imageMarker) : message.length,
        isFileMessage ? message.indexOf(fileMarker) : message.length
      )).trim()
    : message;

  const optionsRegex = /^\d+\.\s.*$/gm;
  const isOptionsMessage = isAssistant && message.match(optionsRegex);
  const messageLines = message.split('\n');

  const formattedDate = useMemo(() => {
    const date = new Date(created_at);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString("es-ES");
  }, [created_at]);

  const fileType = fileUrl ? fileUrl.split('.').pop()?.toUpperCase() : null;

  return (
    <div
      className={`flex items-start gap-3 animate-fade-in-up ${
        isAssistant ? "justify-end" : "justify-start"
      }`}
    >
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm transition-all duration-400 hover:scale-105">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg p-3 shadow-md transition-all duration-400 hover:shadow-lg ${
          isAssistant
            ? "bg-gray-100 dark:bg-gray-700"
            : "bg-blue-500 text-white dark:bg-blue-600"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {isAssistant && (
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full ${isAgent ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center shadow-sm transition-all duration-400 hover:scale-105`}
            >
              {icon}
            </div>
          )}
          <Text size="small" className={`font-bold transition-all duration-400 hover:text-blue-500 ${isAssistant ? 'text-gray-900 dark:text-gray-100' : 'text-white'}`}>
            {senderLabel}
          </Text>
        </div>
        
        {isOptionsMessage ? (
          <>
            <Text className="mb-2 whitespace-pre-wrap transition-all duration-400 hover:text-gray-700 dark:hover:text-gray-300">{messageLines[0]}</Text>
            <div className="flex flex-col gap-2 mt-2">
              {messageLines.slice(1).map((line, index) => {
                const optionText = line.trim();
                if (!optionText) return null;
                return (
                  <Button 
                    key={index} 
                    variant="secondary" 
                    className="justify-start text-left w-full transition-all duration-400 hover:scale-102"
                  >
                    {optionText}
                  </Button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {textMessage && <Text className="whitespace-pre-wrap transition-all duration-400 hover:text-gray-700 dark:hover:text-gray-300">{textMessage}</Text>}
            {isImageMessage && (
              <div className="flex flex-col items-start gap-2 mt-2 animate-fade-in">
                <a 
                  href={imageUrl!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-all duration-400 hover:scale-105"
                >
                  <img 
                    src={imageUrl!} 
                    alt="Imagen compartida en el chat" 
                    className="max-w-full h-auto rounded-md shadow-md transition-all duration-400 hover:shadow-lg"
                    style={{ maxHeight: '250px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400?text=Imagen+no+disponible';
                    }}
                  />
                </a>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 transition-all duration-400 hover:text-gray-700 dark:hover:text-gray-300">
                  <ImageIcon className="w-4 h-4 transition-all duration-400 hover:scale-110" />
                  <Text size="small">Imagen enviada</Text>
                </div>
              </div>
            )}
            {isFileMessage && (
              <div className="flex flex-col items-start gap-2 mt-2 animate-fade-in">
                <a 
                  href={fileUrl!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-400 hover:scale-102"
                >
                  <FileText className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-all duration-400 hover:scale-110" />
                  <Text size="small" className="font-semibold transition-all duration-400 hover:text-gray-900 dark:hover:text-gray-100">{fileUrl!.split('/').pop()}</Text>
                  <Badge className="transition-all duration-400 hover:scale-105">{fileType}</Badge>
                </a>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 transition-all duration-400 hover:text-gray-700 dark:hover:text-gray-300">
                  <Paperclip className="w-4 h-4 transition-all duration-400 hover:rotate-45" />
                  <Text size="small">Archivo adjunto</Text>
                </div>
              </div>
            )}
          </>
        )}
        
        <Text
          size="xsmall"
          className={`mt-1 text-right transition-all duration-400 hover:text-gray-600 dark:hover:text-gray-400 ${
            isAssistant ? "text-gray-400" : "text-white/70"
          }`}
        >
          {formattedDate}
        </Text>
      </div>
    </div>
  );
};
