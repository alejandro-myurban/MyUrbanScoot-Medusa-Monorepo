// src/admin/widgets/chat-panel/pages/ChatDetailsPage.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, AlertTriangle, Trash, SearchIcon, Phone, X, CheckCircle, UserPlus, FileText, Maximize2, Minimize2, Clock } from "lucide-react";
import { sdk } from "../../../lib/sdk";
import { cleanUserId, groupChatsByUser } from "../utils/chat-helpers";
import { ChatBubble } from "./components/chatBubble";
import { ChatControls } from "./components/chatControls";
import FinancingVisualization from "./components/financingVisualization";
import OrderPanel from "./components/orderPanel";
import QuickReplies from "./components/quickReplies";
import ConversationSummaryModal from "./components/conversationSummaryModal";

type ChatMessage = {
    id: string;
    user_id: string;
    message: string;
    role: "user" | "assistant";
    created_at: string;
    status: "IA" | "AGENTE";
    conversation_id?: string;
};

type ConversationSummaryResponse = {
    success: boolean;
    summary?: string;
    error?: string;
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
    const [isFullscreen, setIsFullscreen] = useState<boolean>(true); // ⚡ CAMBIO: Pantalla completa por defecto
    const [showQuickReplies, setShowQuickReplies] = useState<boolean>(false);
    
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [conversationSummary, setConversationSummary] = useState("");
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

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
        const userIdMatch = userId.match(/whatsapp:\+?(\d+)/);
        if (userIdMatch && userIdMatch[1]) {
            const fullNumber = userIdMatch[1];
            if (fullNumber.startsWith('34') && fullNumber.length > 9) {
                return fullNumber.substring(2);
            }
            return fullNumber;
        }
        const phoneRegex = /(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{0,4}/;
        for (const message of messages) {
            if (message.role === "user") {
                const match = message.message.match(phoneRegex);
                if (match) {
                    let phone = match[0].replace(/[\s\-\(\)]/g, '');
                    if (phone.startsWith('34') && phone.length > 9) {
                        phone = phone.substring(2);
                    }
                    return phone;
                }
            }
        }
        return null;
    };

    const phoneNumber = useMemo(() => getPhoneNumberFromChat(data || [], userid || ''), [data, userid]);

    const userMessages = useMemo(() => {
        const grouped = groupChatsByUser(data || []);
        let messages = grouped[userid] || [];
        if (searchTerm) {
            messages = messages.filter(msg => msg.message.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return messages;
    }, [data, userid, searchTerm]);

    // ⚡ NUEVA LÓGICA: Calcular si han pasado 24 horas desde el último mensaje del usuario
    const canSendAgentMessage = useMemo(() => {
        const lastUserMessage = userMessages.filter(msg => msg.role === 'user').sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        if (!lastUserMessage) {
            return true;
        }

        const now = new Date();
        const lastMessageTime = new Date(lastUserMessage.created_at);
        const hoursPassed = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

        return hoursPassed < 24;
    }, [userMessages]);

    const generateConversationSummary = async () => {
        if (!userid || !userMessages || userMessages.length === 0) {
            setSummaryError("No hay mensajes para generar un resumen");
            setIsSummaryModalOpen(true);
            return;
        }
        setIsSummaryLoading(true);
        setSummaryError(null);
        setConversationSummary("");
        setIsSummaryModalOpen(true);
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentMessages = userMessages.filter(msg => new Date(msg.created_at) > twentyFourHoursAgo);
            const messagesToAnalyze = recentMessages.length > 0 ? recentMessages : userMessages.slice(-20);
            const slimMessages = messagesToAnalyze.map(msg => ({
                message: msg.message,
                role: msg.role
            }));
            const response = await sdk.client.fetch<ConversationSummaryResponse>('/admin/conversation-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { messages: slimMessages, userId: userid }
            });
            if (response.success && response.summary) {
                setConversationSummary(response.summary);
            } else {
                throw new Error(response.error || "No se pudo generar el resumen.");
            }
        } catch (error: any) {
            console.error("Error generando resumen:", error);
            const errorMessage = error.message || "No se pudo conectar con el servicio de resumen.";
            setSummaryError(errorMessage);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: "IA" | "AGENTE") => {
            if (!userid) throw new Error("No user ID found");
            return sdk.client.fetch(`/admin/chat-status/${encodeURIComponent(userid)}`, {
                method: "POST",
                body: { status: newStatus },
                headers: { "Content-Type": "application/json" },
            });
        },
        onSuccess: (data, newStatus) => {
            queryClient.invalidateQueries({ queryKey: ["chat-history"] });
            if (newStatus === "AGENTE") {
                setTimeout(() => {
                    generateConversationSummary();
                }, 1000);
            }
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

    const handleDeleteConversation = () => {
        if (userid) {
            if (window.confirm(`¿Estás seguro de que quieres eliminar esta conversación con ${cleanUserId(userid)}? Esta acción es irreversible.`)) {
                deleteConversationMutation.mutate(userid);
            }
        }
    };

    const handleSelectQuickReply = (replyContent: string) => {
        setAgentMessage(replyContent);
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

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [userMessages]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (!userid) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 animate-fade-in">
                <div className="text-center p-8">
                    <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <Text className="text-lg">No se encontró un ID de chat válido.</Text>
                    <Button onClick={() => navigate(-1)} className="mt-4">
                        Volver al listado
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 animate-fade-in">
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <Heading level="h2" className="animate-slide-in">Cargando Chat...</Heading>
                    <Text className="text-gray-500 mt-2">Obteniendo historial de mensajes...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950 animate-fade-in">
                <div className="text-center p-8">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <Text className="text-lg text-red-500 mb-4">Error al cargar el chat</Text>
                    <Button onClick={() => window.location.reload()}>
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    const containerClasses = isFullscreen 
        ? "fixed inset-0 z-50 flex flex-col h-screen"
        : "flex flex-col h-screen w-full";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col lg:flex-row h-full w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                {isPanelOpen && (
                    <div className="hidden lg:block lg:w-96 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800">
                        <OrderPanel
                            phoneNumber={phoneNumber}
                            isOpen={isPanelOpen}
                            onClose={() => setIsPanelOpen(false)}
                            userId={userid!}
                        />
                    </div>
                )}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className={`p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 animate-slide-in flex-shrink-0 w-full`}>
                        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => navigate(-1)}
                                className="transition-all duration-400 hover:scale-102 active:scale-98 flex-shrink-0"
                            >
                                <ChevronLeft className="w-4 h-4 transition-transform duration-400 group-hover:-translate-x-1" />
                                <span className="hidden sm:inline ml-1">Volver</span>
                            </Button>
                            <div className="min-w-0 flex-1">
                                <Heading level="h2" className="truncate transition-all duration-400 hover:text-blue-500 text-sm sm:text-base lg:text-lg">
                                    Chat con {cleanUserId(userid)}
                                </Heading>
                                {phoneNumber && (
                                    <Text className="text-xs text-gray-500 truncate">
                                        Tel: {phoneNumber}
                                    </Text>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end flex-shrink-0">
                            {showSearch ? (
                                <div className="flex items-center gap-2 flex-grow lg:flex-grow-0 lg:min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 dark:bg-gray-700 dark:text-white"
                                        autoFocus
                                    />
                                    <Button
                                        variant="transparent"
                                        size="small"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setShowSearch(false);
                                        }}
                                        className="flex-shrink-0"
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
                                    <SearchIcon className="w-4 h-4" />
                                    <span className="hidden md:inline ml-1">Buscar</span>
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={toggleFullscreen}
                                className="transition-all duration-400 hover:scale-102 hidden lg:flex"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </Button>
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={generateConversationSummary}
                                className="transition-all duration-400 hover:scale-102"
                                disabled={!userMessages || userMessages.length === 0 || isSummaryLoading}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">
                                    {isSummaryLoading ? "Generando..." : "Resumen"}
                                </span>
                            </Button>
                            {phoneNumber && (
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => setIsPanelOpen(true)}
                                    className="transition-all duration-400 hover:scale-102"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden md:inline ml-1">Detalles</span>
                                </Button>
                            )}
                            <Button
                                variant="danger"
                                size="small"
                                onClick={handleDeleteConversation}
                                isLoading={deleteConversationMutation.isPending}
                                className="transition-all duration-400 hover:scale-102"
                            >
                                <Trash className="w-4 h-4 transition-transform duration-400 hover:rotate-12" />
                                <span className="hidden sm:inline ml-1">Eliminar</span>
                            </Button>
                            <div className="flex items-center gap-2">
                                <Badge 
                                    color={currentStatus === "IA" ? "blue" : "purple"}
                                    className="transition-all duration-400 hover:scale-102 text-xs"
                                >
                                    {currentStatus}
                                </Badge>
                                <select
                                    value={currentStatus}
                                    onChange={(e) => updateStatusMutation.mutate(e.target.value as "IA" | "AGENTE")}
                                    className="px-2 py-1 text-xs rounded-lg border-2 border-gray-200 transition-all duration-400 hover:border-blue-500 hover:shadow-md dark:bg-gray-700 dark:text-white"
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <option value="IA">Modo IA</option>
                                    <option value="AGENTE">Modo AGENTE</option>
                                </select>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 animate-fade-in chat-area">
                        {needsAgentAttention && (
                            <div className="mb-4">
                                <div className="flex items-start gap-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg border-l-4 border-yellow-500 animate-fade-in-up shadow-sm">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse-slow mt-0.5" />
                                    <div>
                                        <Text className="font-semibold text-sm">¡Atención requerida!</Text>
                                        <Text className="text-xs mt-1 opacity-90">
                                            El usuario ha solicitado <strong>ASISTENCIA PERSONAL</strong>
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={`space-y-3 p-4 transition-all duration-400`}>
                            {userMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <div className="text-center p-8">
                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <Text className="text-lg mb-2">No hay mensajes</Text>
                                        <Text className="text-sm opacity-75">
                                            {searchTerm ? "No se encontraron mensajes que coincidan con la búsqueda" : "La conversación comenzará cuando el usuario envíe un mensaje"}
                                        </Text>
                                    </div>
                                </div>
                            ) : (
                                userMessages
                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                    .map((msg, index) => (
                                        <ChatBubble 
                                            key={msg.id} 
                                            {...msg} 
                                            agent_name={loggedInAgentName}
                                        />
                                    ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </main>

                    <footer className={`p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-inner border-t border-gray-200 dark:border-gray-700 flex-shrink-0 w-full`}>
                        {currentStatus === "AGENTE" ? (
                            <div className="space-y-4">
                                {/* ⚡ ADVERTENCIA: Se muestra si han pasado más de 24h y está en modo AGENTE */}
                                {!canSendAgentMessage && (
                                    <div className="p-3 bg-gradient-to-r from-red-100 to-red-50 border border-red-200 rounded-lg text-center text-red-800 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-900 dark:text-red-300 animate-fade-in-up">
                                        <div className="flex items-center justify-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <Text className="text-sm font-medium">
                                                Han pasado más de 24h. Debes enviar una template para continuar.
                                            </Text>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg text-center text-purple-800 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-900 dark:text-purple-300 animate-fade-in-up">
                                    <Text className="text-sm font-medium">
                                        🤖 Bot pausado - Respondiendo como agente humano
                                    </Text>
                                </div>
                                {showQuickReplies && (
                                    <QuickReplies onSelectReply={handleSelectQuickReply} />
                                )}
                                <ChatControls
                                    agentMessage={agentMessage}
                                    setAgentMessage={setAgentMessage}
                                    selectedFile={selectedFile}
                                    setSelectedFile={setSelectedFile}
                                    handleSendMessage={handleSendMessage}
                                    sendMessageMutation={sendMessageMutation}
                                    userId={userid!}
                                    sendWhatsAppTemplate={handleSendTemplate}
                                    onToggleQuickReplies={() => setShowQuickReplies(!showQuickReplies)}
                                    canSendAgentMessage={canSendAgentMessage} // ⚡ PROP ENVIADO AL HIJO
                                />
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg text-center text-gray-500 dark:from-gray-800 dark:to-gray-700 dark:text-gray-400 animate-fade-in-up border border-gray-200 dark:border-gray-600">
                                <Text className="text-sm font-medium mb-2">
                                    🤖 Modo IA activo
                                </Text>
                                <Text className="text-xs opacity-75">
                                    El bot responderá automáticamente. Cambia a modo AGENTE para intervenir manualmente.
                                </Text>
                            </div>
                        )}
                    </footer>
                </div>

                {phoneNumber && (
                    <div className="lg:hidden">
                        <OrderPanel
                            phoneNumber={phoneNumber}
                            isOpen={isPanelOpen}
                            onClose={() => setIsPanelOpen(false)}
                            userId={userid!}
                        />
                    </div>
                )}
            </div>

            {isNotificationOpen && (
                <div className="fixed bottom-4 right-4 z-50 transition-all duration-500 ease-in-out transform translate-y-0 opacity-100 animate-slide-in-right">
                    <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white p-4 shadow-xl transition-all duration-400 hover:shadow-2xl max-w-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 animate-pulse-slow" />
                        <div className="flex-1">
                            <Text className="!text-white font-semibold text-sm">¡Éxito!</Text>
                            <Text className="!text-white/90 text-xs">Template enviado correctamente</Text>
                        </div>
                        <button 
                            onClick={() => setIsNotificationOpen(false)} 
                            className="text-white/80 hover:text-white transition-all duration-400 hover:rotate-90 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <ConversationSummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => {
                    setIsSummaryModalOpen(false);
                    setSummaryError(null);
                    setConversationSummary("");
                }}
                summary={conversationSummary}
                isLoading={isSummaryLoading}
                userId={cleanUserId(userid)}
                error={summaryError}
            />
        </div>
    );
};

export default ChatDetailsPage;