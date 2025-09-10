// components/ConversationSummaryModal.tsx
import React from "react";
import { X, FileText, Clock, AlertCircle, Copy, CheckCircle } from "lucide-react";
import { Button, Container, Heading, Text } from "@medusajs/ui";

interface ConversationSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string;
    isLoading: boolean;
    userId: string;
    error?: string | null;
}

const ConversationSummaryModal: React.FC<ConversationSummaryModalProps> = ({
    isOpen,
    onClose,
    summary,
    isLoading,
    userId,
    error
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copiando al portapapeles:', err);
            // Fallback para navegadores que no soporten clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = summary;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getErrorMessage = (errorCode: string): string => {
        const errorMessages: Record<string, string> = {
            'INVALID_MESSAGES': 'Los mensajes proporcionados no son válidos.',
            'EMPTY_MESSAGES': 'No hay mensajes suficientes para generar un resumen.',
            'INVALID_USER_ID': 'ID de usuario no válido.',
            'AI_SERVICE_NOT_CONFIGURED': 'El servicio de IA no está configurado correctamente.',
            'AI_AUTH_ERROR': 'Error de autenticación con el servicio de IA.',
            'AI_RATE_LIMIT': 'Límite de uso alcanzado. Intente más tarde.',
            'AI_TIMEOUT': 'El servicio tardó demasiado en responder.',
            'INTERNAL_ERROR': 'Error interno del servidor.'
        };
        return errorMessages[errorCode] || error || 'Error desconocido al generar el resumen.';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
            <Container className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[80vh] overflow-hidden animate-slide-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-500" />
                        <Heading level="h3">Resumen de Conversación</Heading>
                    </div>
                    <Button
                        variant="transparent"
                        size="small"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-all duration-300"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                            Usuario: {userId}
                        </Text>
                        <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <Text className="text-sm text-gray-500">
                                Generado: {new Date().toLocaleString()}
                            </Text>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <Text className="ml-3 text-gray-600">Generando resumen...</Text>
                            </div>
                        ) : error ? (
                            <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                                <div>
                                    <Text className="text-red-700 dark:text-red-300 font-medium">
                                        Error al generar resumen
                                    </Text>
                                    <Text className="text-red-600 dark:text-red-400 text-sm mt-1">
                                        {getErrorMessage(error)}
                                    </Text>
                                </div>
                            </div>
                        ) : summary ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {summary}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 text-gray-500">
                                <Text>No hay resumen disponible</Text>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        {!isLoading && summary && !error && (
                            <Button
                                variant="secondary"
                                onClick={copyToClipboard}
                                className="flex-1 flex items-center justify-center gap-2"
                                disabled={copied}
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        ¡Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copiar Resumen
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            onClick={onClose}
                            className={summary && !error ? "flex-1" : "w-full"}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default ConversationSummaryModal;