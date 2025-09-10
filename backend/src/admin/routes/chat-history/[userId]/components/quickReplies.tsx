// src/admin/widgets/chat-panel/pages/components/QuickReplies.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button, Text, Container } from "@medusajs/ui";
import { Plus, X, SearchIcon, Trash, CheckCircle } from "lucide-react";

// Definimos el tipo de una respuesta rápida
type QuickReply = {
    id: string;
    content: string;
    isUserCreated: boolean; // Indica si fue creada por el usuario
};

// Props que recibe el componente
interface QuickRepliesProps {
    onSelectReply: (reply: string) => void;
    // Opcionalmente, puedes pasar las respuestas iniciales como prop desde el componente padre
    // initialReplies?: QuickReply[]; 
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelectReply }) => {
    // Estado para almacenar las respuestas rápidas (inicialmente vacío)
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [newReply, setNewReply] = useState<string>("");
    const [showInput, setShowInput] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // En un escenario real, aquí harías una llamada a la API
        // const fetchReplies = async () => { ... }

        // Simulación de carga desde una API (ejemplo)
        // Puedes reemplazar esto con tu llamada a `sdk.client.fetch`
        const fetchAndLoadReplies = async () => {
            setIsLoading(true);
            
            // Simulación de respuestas "predefinidas" que vendrían de la API
            const apiPredefined: QuickReply[] = [
            ];
            
            // Cargar las respuestas guardadas del localStorage
            const storedReplies = localStorage.getItem("userQuickReplies");
            let userReplies: QuickReply[] = [];
            if (storedReplies) {
                try {
                    userReplies = JSON.parse(storedReplies) as QuickReply[];
                } catch (e) {
                    console.error("Error parsing user quick replies from localStorage", e);
                }
            }
            
            setQuickReplies([...apiPredefined, ...userReplies]);
            setIsLoading(false);
        };

        fetchAndLoadReplies();
    }, []);

    // Función para guardar solo las respuestas del usuario en localStorage
    const saveUserReplies = (updatedReplies: QuickReply[]) => {
        const userReplies = updatedReplies.filter(reply => reply.isUserCreated);
        localStorage.setItem("userQuickReplies", JSON.stringify(userReplies));
    };

    const handleAddReply = () => {
        if (newReply.trim()) {
            const newQuickReply: QuickReply = {
                id: `user-${Date.now()}`,
                content: newReply.trim(),
                isUserCreated: true,
            };
            const updatedReplies = [...quickReplies, newQuickReply];
            setQuickReplies(updatedReplies);
            saveUserReplies(updatedReplies);
            setNewReply("");
            setShowInput(false);
        }
    };

    const handleDeleteReply = (idToDelete: string) => {
        const updatedReplies = quickReplies.filter(reply => reply.id !== idToDelete);
        setQuickReplies(updatedReplies);
        saveUserReplies(updatedReplies);
    };

    const filteredReplies = quickReplies.filter(reply =>
        reply.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <Text className="p-4 text-center">Cargando respuestas rápidas...</Text>;
    }

    return (
        <Container className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <Text className="font-semibold text-lg">Respuestas Rápidas ⚡</Text>
                <div className="flex gap-2">
                    <Button
                        variant="transparent"
                        size="small"
                        onClick={() => setShowInput(!showInput)}
                    >
                        {showInput ? <X size={16} /> : <Plus size={16} />}
                    </Button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-1 pl-7 text-sm rounded-md border dark:bg-gray-700 dark:text-white"
                        />
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </div>
                </div>
            </div>

            {showInput && (
                <div className="flex gap-2 mb-4 animate-fade-in-up">
                    <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Escribe una nueva respuesta rápida..."
                        onKeyDown={(e) => e.key === "Enter" && handleAddReply()}
                    />
                    <Button onClick={handleAddReply}>
                        <CheckCircle size={16} />
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {filteredReplies.map((reply) => (
                    <div
                        key={reply.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm relative group"
                    >
                        <Text
                            className="text-sm line-clamp-2"
                            onClick={() => onSelectReply(reply.content)}
                        >
                            {reply.content}
                        </Text>
                        {reply.isUserCreated && (
                            <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-500 hover:text-red-700"
                                title="Eliminar"
                            >
                                <Trash size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {filteredReplies.length === 0 && (
                    <Text className="text-gray-500 text-sm italic">No se encontraron respuestas.</Text>
                )}
            </div>
        </Container>
    );
};

export default QuickReplies;