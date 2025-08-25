import { Button, Text } from "@medusajs/ui";
import { Send, Paperclip, X, Clock } from "lucide-react";
import React, { useRef } from "react";

// ✅ La firma de la prop es correcta. El problema está en el componente padre.
type ChatControlsProps = {
  agentMessage: string;
  setAgentMessage: (message: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleSendMessage: () => void;
  sendMessageMutation: { isPending: boolean };
  userId: string;
  sendWhatsAppTemplate: (userId: string, templateId: string) => Promise<void>;
};

export const ChatControls = ({
  agentMessage,
  setAgentMessage,
  selectedFile,
  setSelectedFile,
  handleSendMessage,
  sendMessageMutation,
  userId,
  sendWhatsAppTemplate,
}: ChatControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAgentMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const isMessageEmpty = !agentMessage.trim() && !selectedFile;

  const handleSendTemplateClick = async () => {
    try {
      // ✅ La llamada a la prop es correcta, ya que coincide con la firma esperada.
      await sendWhatsAppTemplate(userId, 'HXf8c3a0533779893f37cbdc48b11e84a4');
      console.log('Template enviada');
    } catch (error) {
      console.error('Error enviando template:', error);
    }
  };

  return (
    <div className="flex items-end mt-4 gap-2">
      {/* Contenedor de la barra de entrada */}
      <div className="relative flex-1 bg-gray-100 dark:bg-gray-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center">
          <textarea
            ref={textareaRef}
            placeholder="Escribe un mensaje"
            value={agentMessage}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 w-full pl-4 py-3 bg-transparent rounded-3xl resize-none outline-none overflow-hidden transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
            rows={1}
            style={{ maxHeight: '150px', paddingRight: selectedFile ? '6rem' : '4rem' }}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
            <Button
              variant="transparent"
              onClick={() => fileInputRef.current?.click()}
              className="p-0"
              disabled={sendMessageMutation.isPending}
            >
              <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Button>
            <Button
              variant="transparent"
              onClick={handleSendTemplateClick}
              className="p-0"
              disabled={sendMessageMutation.isPending}
            >
              <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </Button>
          </div>
        </div>
        {selectedFile && (
          <div className="absolute top-0 left-0 right-0 p-2 bg-gray-200 dark:bg-gray-600 flex items-center justify-between gap-1 rounded-t-3xl">
            <div className="flex items-center gap-1 overflow-hidden">
              <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
              <Text size="xsmall" className="text-gray-800 dark:text-gray-200 font-semibold truncate">{selectedFile.name}</Text>
            </div>
            <Button
              variant="transparent"
              size="small"
              onClick={() => setSelectedFile(null)}
              className="p-0.5 w-5 h-5 flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        )}
      </div>

      {/* Botón de enviar */}
      <Button
        onClick={handleSendMessage}
        variant="primary"
        className="w-11 h-11 rounded-full p-0 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        disabled={sendMessageMutation.isPending || isMessageEmpty}
        isLoading={sendMessageMutation.isPending}
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
};