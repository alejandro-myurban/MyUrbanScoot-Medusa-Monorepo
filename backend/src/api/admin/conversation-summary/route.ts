// src/api/admin/generate-conversation-summary/route.ts
import { MedusaRequest, MedusaResponse } from '@medusajs/framework';
import OpenAI from 'openai';

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
});

interface ChatMessage {
    id: string;
    user_id: string;
    message: string;
    role: "user" | "assistant";
    created_at: string;
    status: "IA" | "AGENTE";
    conversation_id?: string;
}

interface SummaryRequestBody {
    messages: ChatMessage[];
    userId: string;
}

// Función para generar resumen usando OpenAI
async function generateConversationSummary(messages: ChatMessage[]): Promise<string> {
    try {
        // Filtrar mensajes del usuario
        const userMessages = messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.message)
            .join('\n\n');

        // Obtener respuestas del asistente para contexto
        const assistantMessages = messages
            .filter(msg => msg.role === 'assistant')
            .slice(-5) // Últimas 5 respuestas para contexto
            .map(msg => msg.message)
            .join('\n\n');

        // Detectar si hay productos o servicios mencionados
        const productMentions = messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.message)
            .join(' ')
            .match(/patinete|scooter|bateria|motor|rueda|freno|casco|repuesto|pieza|modelo|marca/gi) || [];

        // Detectar números de pedido
        const orderNumbers = messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.message)
            .join(' ')
            .match(/\d{5}/g) || [];

        const prompt = `
Eres un asistente especializado en análisis de conversaciones de soporte técnico para una empresa de patinetes eléctricos.

Analiza la siguiente conversación y genera un resumen estructurado:

**MENSAJES DEL USUARIO:**
${userMessages}

**RESPUESTAS DEL SISTEMA (para contexto):**
${assistantMessages}

**PRODUCTOS DETECTADOS:** ${productMentions.join(', ') || 'Ninguno específico'}
**NÚMEROS DE PEDIDO DETECTADOS:** ${orderNumbers.join(', ') || 'Ninguno'}

Genera un resumen siguiendo EXACTAMENTE este formato:

## 📋 RESUMEN DE CONVERSACIÓN

**🔍 Problema Principal:**
[Descripción clara y concisa del problema principal del usuario en 1-2 líneas]

**📝 Detalles Importantes:**
[Información relevante: productos mencionados, números de pedido, síntomas específicos, etc.]

**📊 Contexto de la Consulta:**
[Historial previo mencionado, intentos de solución realizados, estado actual]

**⚡ Nivel de Urgencia:**
[🟢 BAJA / 🟡 MEDIA / 🔴 ALTA] - [Justificación breve]

**🎯 Acciones Recomendadas:**
• [Acción específica 1]
• [Acción específica 2]
• [Acción específica 3 si es necesaria]

**💬 Tono del Usuario:**
[Calmado/Preocupado/Frustrado/Urgente] - [Observaciones sobre la actitud]

**🔄 Estado de Resolución:**
[Pendiente/Parcialmente resuelto/Requiere escalamiento/Información adicional necesaria]

Mantén cada sección concisa pero informativa. Si no hay información suficiente para una sección, indica "No especificado" o "No aplica".
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Eres un especialista en análisis de conversaciones de soporte técnico. Genera resúmenes estructurados, claros y accionables para agentes de soporte."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 800,
            temperature: 0.2, // Baja temperatura para respuestas más consistentes
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        return completion.choices[0]?.message?.content || "❌ No se pudo generar el resumen.";

    } catch (error) {
        console.error("Error generando resumen con OpenAI:", error);
        throw new Error(`Error del servicio de IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}

// Handler POST para generar resumen
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const startTime = Date.now();
    
    try {
        const { messages, userId } = req.body as SummaryRequestBody;

        // Validaciones de entrada
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({
                success: false,
                error: 'El campo "messages" es requerido y debe ser un array',
                code: 'INVALID_MESSAGES'
            });
            return;
        }

        if (messages.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Se requiere al menos un mensaje para generar el resumen',
                code: 'EMPTY_MESSAGES'
            });
            return;
        }

        if (!userId || typeof userId !== 'string') {
            res.status(400).json({
                success: false,
                error: 'El campo "userId" es requerido',
                code: 'INVALID_USER_ID'
            });
            return;
        }

        // Validar que el API key de OpenAI esté configurado
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY no está configurado en las variables de entorno');
            res.status(500).json({
                success: false,
                error: 'Servicio de IA no configurado',
                code: 'AI_SERVICE_NOT_CONFIGURED'
            });
            return;
        }

        console.log(`🔄 Iniciando generación de resumen para usuario: ${userId}`);
        console.log(`📊 Total de mensajes a analizar: ${messages.length}`);
        console.log(`👤 Mensajes de usuario: ${messages.filter(m => m.role === 'user').length}`);
        console.log(`🤖 Mensajes de asistente: ${messages.filter(m => m.role === 'assistant').length}`);

        // Generar el resumen
        const summary = await generateConversationSummary(messages);
        const processingTime = Date.now() - startTime;

        console.log(`✅ Resumen generado exitosamente en ${processingTime}ms para usuario: ${userId}`);

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            summary,
            metadata: {
                userId,
                generatedAt: new Date().toISOString(),
                messageCount: messages.length,
                userMessageCount: messages.filter(m => m.role === 'user').length,
                assistantMessageCount: messages.filter(m => m.role === 'assistant').length,
                processingTimeMs: processingTime
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error generando resumen de conversación (${processingTime}ms):`, error);

        // Determinar el tipo de error y respuesta apropiada
        if (error instanceof Error && error.message.includes('API key')) {
            res.status(401).json({
                success: false,
                error: 'Error de autenticación con el servicio de IA',
                code: 'AI_AUTH_ERROR'
            });
            return;
        }

        if (error instanceof Error && error.message.includes('rate limit')) {
            res.status(429).json({
                success: false,
                error: 'Límite de uso del servicio de IA alcanzado. Inténtelo más tarde.',
                code: 'AI_RATE_LIMIT'
            });
            return;
        }

        if (error instanceof Error && error.message.includes('timeout')) {
            res.status(408).json({
                success: false,
                error: 'El servicio de IA tardó demasiado en responder',
                code: 'AI_TIMEOUT'
            });
            return;
        }

        // Error genérico
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar el resumen',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? 
                (error instanceof Error ? error.message : 'Error desconocido') : undefined,
            processingTimeMs: processingTime
        });
    }
}

// Opcional: Handler GET para verificar que el endpoint está funcionando
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    res.status(200).json({
        message: "Endpoint de resumen de conversaciones activo",
        version: "1.0.0",
        methods: ["POST"],
        endpoint: "/admin/conversation-summary"
    });
}