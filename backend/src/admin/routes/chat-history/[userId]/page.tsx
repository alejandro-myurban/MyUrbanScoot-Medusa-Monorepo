// src/admin/widgets/chat-panel/pages/ChatDetailsPage.tsx

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, AlertTriangle, Trash, SearchIcon, Phone, X, CheckCircle, UserPlus } from "lucide-react";
import { sdk } from "../../../lib/sdk";
import { cleanUserId, groupChatsByUser } from "../utils/chat-helpers";
import { ChatBubble } from "./components/chatBubble";
import { ChatControls } from "./components/chatControls";
import FinancingVisualization from "./components/financingVisualization";
import OrderPanel from "./components/orderPanel";

type ChatMessage = {
    id: string;
    user_id: string;
    message: string;
    role: "user" | "assistant";
    created_at: string;
    status: "IA" | "AGENTE";
    conversation_id?: string;
};

const ChatDetailsPage = () => {
    const pathname = window.location.pathname;
    const parts = pathname.split("/");
    const encodedUserId = parts[parts.length - 1];
    const userid = encodedUserId ? decodeURIComponent(encodedUserId) : undefined;
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [agentMessage, setAgentMessage] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

    useEffect(() => {
        queryClient.resetQueries({ queryKey: ["chat-history", userid] });
    }, [userid, queryClient]);

    const { data: adminUserData } = useQuery({
        queryKey: ["admin-user-me"],
        queryFn: () => sdk.admin.user.me(),
    });

    const loggedInAgentName = useMemo(() => {
        const user = adminUserData?.user;
        if (!user) return "Agente";
        const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
        return fullName || user.email;
    }, [adminUserData]);

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

    const getPhoneNumberFromChat = (messages: ChatMessage[], userId: string) => {
        // PRIMERO: Intentar extraer del userid (whatsapp:+34633288168)
        const userIdMatch = userId.match(/whatsapp:\+?(\d+)/);
        if (userIdMatch && userIdMatch[1]) {
            const fullNumber = userIdMatch[1];
            // Quitar código de país (primeros 2 dígitos) si es español (+34)
            if (fullNumber.startsWith('34') && fullNumber.length > 9) {
                return fullNumber.substring(2); // Quita los primeros 2 dígitos (+34)
            }
            return fullNumber; // Si no es español, devolver completo
        }

        // SEGUNDO: Buscar en los mensajes como fallback
        const phoneRegex = /(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{0,4}/;
        
        for (const message of messages) {
            if (message.role === "user") {
                const match = message.message.match(phoneRegex);
                if (match) {
                    let phone = match[0].replace(/[\s\-\(\)]/g, '');
                    // Quitar código de país si es español
                    if (phone.startsWith('34') && phone.length > 9) {
                        phone = phone.substring(2);
                    }
                    return phone;
                }
            }
        }
        return null;
    };

    // Y actualiza su uso:
    const phoneNumber = useMemo(() => getPhoneNumberFromChat(data || [], userid || ''), [data, userid]);
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
        mutationFn: (data: { userId: string, message?: string, fileUrl?: string }) => {
            return sdk.client.fetch(`/admin/send-message/${data.userId}`, {
                method: "POST",
                body: data, 
                headers: { "Content-Type": "application/json" },
            });
        },
        onMutate: async (newChatMessage) => {
            await queryClient.cancelQueries({ queryKey: ["chat-history", newChatMessage.userId] });
            const previousChatHistory = queryClient.getQueryData<ChatMessage[]>(["chat-history", newChatMessage.userId]);
            let optimisticMessageContent = newChatMessage.message || '';
            if (newChatMessage.fileUrl) {
                const fileExtension = newChatMessage.fileUrl.split('.').pop()?.toLowerCase();
                const isImage = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                const fileMarker = isImage ? "[Imagen] - " : "[Archivo] - ";
                if (optimisticMessageContent.length > 0) {
                    optimisticMessageContent += " ";
                }
                optimisticMessageContent += `${fileMarker}${newChatMessage.fileUrl}`;
            }
            const optimisticMessage: ChatMessage = {
                id: "optimistic-" + Date.now(),
                user_id: newChatMessage.userId!,
                message: optimisticMessageContent,
                role: "assistant",
                status: "AGENTE",
                created_at: new Date().toISOString(),
            };
            queryClient.setQueryData<ChatMessage[]>(
                ["chat-history", newChatMessage.userId],
                (oldMessages) => {
                    return [...(oldMessages || []), optimisticMessage];
                }
            );
            return { previousChatHistory };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat-history", userid] });
            setAgentMessage("");
            setSelectedFile(null);
        },
        onError: (err, newChatMessage, context) => {
            console.error("Error al enviar el mensaje:", err);
            if (context?.previousChatHistory) {
                queryClient.setQueryData(["chat-history", newChatMessage.userId], context.previousChatHistory);
            }
            alert("Error al enviar el mensaje. Inténtalo de nuevo.");
        },
    });

    const sendTemplateMutation = useMutation({
        mutationFn: async (data: { userId: string, templateId: string }) => {
            return sdk.client.fetch(`/admin/send-template/${data.userId}`, {
                method: "POST",
                body: data,
                headers: { "Content-Type": "application/json" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat-history", userid] });
            setIsNotificationOpen(true);
            setTimeout(() => {
                setIsNotificationOpen(false);
            }, 3000);
        },
        onError: (err) => {
            console.error("Error al enviar el template:", err);
            alert("Error al enviar el template. Inténtalo de nuevo.");
        },
    });

    const handleSendTemplate = async (userId: string, templateId: string) => {
        sendTemplateMutation.mutate({ userId, templateId });
    };

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
        let messages = grouped[userid] || [];
        
        if (searchTerm) {
            messages = messages.filter(msg =>
                msg.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return messages;
    }, [data, userid, searchTerm]);

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

    const handleSendMessage = async () => {
        if ((agentMessage.trim() || selectedFile) && userid) {
            let fileUrl = null;
            if (selectedFile) {
                const cloudinaryFormData = new FormData();
                cloudinaryFormData.append("file", selectedFile);
                cloudinaryFormData.append("upload_preset", "MyUrbanScoot");
                let resourceType = "auto";
                if (selectedFile.type === 'application/pdf') {
                    resourceType = "raw";
                } else if (selectedFile.type.startsWith('image/')) {
                    resourceType = "image";
                } else {
                    resourceType = "raw"; 
                }
                const uploadUrl = `https://api.cloudinary.com/v1_1/${"dhxlcgvg9"}/${resourceType}/upload`;
                try {
                    const cloudinaryResponse = await fetch(uploadUrl, { method: "POST", body: cloudinaryFormData });
                    const cloudinaryData = await cloudinaryResponse.json();
                    if (cloudinaryResponse.ok) {
                        fileUrl = cloudinaryData.secure_url;
                    } else {
                        console.error("❌ Error al subir a Cloudinary:", cloudinaryData);
                        alert("Error al subir el archivo. Por favor, inténtalo de nuevo.");
                        return;
                    }
                } catch (error) {
                    console.error("❌ Error de red al subir a Cloudinary:", error);
                    alert("Error de red. Revisa tu conexión o las credenciales de Cloudinary.");
                    return;
                }
            }
            const dataToSend = {
                userId: userid,
                message: agentMessage.trim(),
                fileUrl: fileUrl,
            };
            sendMessageMutation.mutate(dataToSend);
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
            <Container className="animate-fade-in"><Text>No se encontró un ID de chat.</Text></Container>
        );
    }

    if (isLoading) {
        return (
            <Container className="animate-fade-in">
                <Heading level="h2" className="animate-slide-in">Cargando Chat...</Heading>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="animate-fade-in">
                <Text className="text-red-500 animate-pulse-slow">Error al cargar el chat.</Text>
            </Container>
        );
    }
    
    const chatContainerBg = currentStatus === "AGENTE" 
        ? "bg-purple-50 dark:bg-purple-950/30" 
        : "bg-blue-50 dark:bg-blue-950/30";

    return (
        <Container className="flex flex-col h-full animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-4 animate-slide-in">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => navigate(-1)}
                        className="transition-all duration-400 hover:scale-102 active:scale-98"
                    >
                        <ChevronLeft className="w-4 h-4 transition-transform duration-400 group-hover:-translate-x-1" /> Volver
                    </Button>
                    <Heading level="h2" className="truncate transition-all duration-400 hover:text-blue-500">Chat con {cleanUserId(userid)}</Heading>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 md:justify-end">
                    {showSearch ? (
                        <div className="flex items-center gap-2 flex-grow min-w-[150px] md:flex-grow-0">
                            <input
                                type="text"
                                placeholder="Filtrar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 dark:bg-gray-700 dark:text-white"
                                autoFocus
                            />
                            <Button
                                variant="transparent"
                                size="small"
                                onClick={() => {
                                    setSearchTerm("");
                                    setShowSearch(false);
                                }}
                            >
                                <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setShowSearch(true)}
                            className="transition-all duration-400 hover:scale-102"
                        >
                            <SearchIcon />
                        </Button>
                    )}
                    
                    {/* Botón para abrir el panel, se muestra solo si se encuentra un número de teléfono */}
                    {phoneNumber && (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setIsPanelOpen(true)}
                            className="transition-all duration-400 hover:scale-102"
                        >
                            <UserPlus className="w-4 h-4 mr-1" /> Ver detalles
                        </Button>
                    )}

                    <Button
                        variant="danger"
                        size="small"
                        onClick={handleDeleteConversation}
                        isLoading={deleteConversationMutation.isPending}
                        className="flex items-center gap-1 transition-all duration-400 hover:scale-102"
                    >
                        <Trash className="w-4 h-4 transition-transform duration-400 hover:rotate-12" /> Eliminar
                    </Button>
                    <Badge 
                        color={currentStatus === "IA" ? "blue" : "purple"}
                        className="transition-all duration-400 hover:scale-102"
                    >
                        {currentStatus}
                    </Badge>
                    <select
                        value={currentStatus}
                        onChange={(e) => updateStatusMutation.mutate(e.target.value as "IA" | "AGENTE")}
                        className="px-2 py-1 rounded-lg border-2 border-gray-200 text-sm transition-all duration-400 hover:border-blue-500 hover:shadow-md dark:bg-gray-700 dark:text-white"
                    >
                        <option value="IA">Modo IA</option>
                        <option value="AGENTE">Modo AGENTE</option>
                    </select>
                </div>
            </div>

            {needsAgentAttention && (
                <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 mb-4 rounded-lg border border-yellow-300 animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse-slow" />
                    <Text className="font-semibold text-sm transition-all duration-400 hover:text-yellow-900">
                        El usuario ha solicitado **ASISTENCIA PERSONAL**.
                    </Text>
                </div>
            )}

            <div className={`h-[70vh] overflow-y-auto space-y-4 p-4 border rounded-lg shadow-inner ${chatContainerBg} transition-all duration-400 hover:shadow-md`}>
                {userMessages
                    .sort(
                        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                    .map((msg, index) => (
                        <ChatBubble 
                            key={msg.id} 
                            {...msg} 
                            agent_name={loggedInAgentName}
                        />
                    ))}
                <div ref={chatEndRef} />
            </div>

            {currentStatus === "AGENTE" ? (
                <>
                    <div className="p-3 mt-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-300 animate-fade-in-up">
                        <Text className="transition-all duration-400 hover:text-yellow-900">El bot ha pausado su respuesta. Responde como agente.</Text>
                    </div>
                    <ChatControls
                        agentMessage={agentMessage}
                        setAgentMessage={setAgentMessage}
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                        handleSendMessage={handleSendMessage}
                        sendMessageMutation={sendMessageMutation}
                        userId={userid!}
                        sendWhatsAppTemplate={handleSendTemplate}
                    />
                </>
            ) : (
                <div className="p-3 mt-4 bg-gray-100 rounded-lg text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400 animate-fade-in-up">
                    <Text className="transition-all duration-400 hover:text-gray-700">En modo IA, no se pueden enviar mensajes manuales.</Text>
                </div>
            )}

            {isNotificationOpen && (
                <div className="fixed bottom-4 right-4 z-50 transition-all duration-500 ease-in-out transform translate-y-0 opacity-100 animate-slide-in-right">
                    <div className="flex items-center gap-3 rounded-lg bg-green-500 text-white p-4 shadow-xl transition-all duration-400 hover:shadow-2xl">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 animate-pulse-slow" />
                        <Text className="!text-white font-semibold transition-all duration-400">¡Template enviado con éxito!</Text>
                        <button 
                            onClick={() => setIsNotificationOpen(false)} 
                            className="text-white hover:text-gray-200 transition-all duration-400 hover:rotate-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Renderiza el panel lateral si un número de teléfono está disponible */}
            {phoneNumber && (
                <OrderPanel
                    phoneNumber={phoneNumber}
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                    userId={userid!}
                />
            )}
        </Container>
    );
};

export default ChatDetailsPage;