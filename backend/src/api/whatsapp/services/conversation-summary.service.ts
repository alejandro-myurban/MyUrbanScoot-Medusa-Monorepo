// services/ConversationSummaryService.ts
import OpenAI from 'openai';

export class ConversationSummaryService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!
        });
    }

    // Genera un resumen de la conversación cuando se activa el modo agente
    async generateConversationSummary(messages: any[]): Promise<string> {
        try {
            // Filtrar solo mensajes del usuario para el resumen
            const userMessages = messages
                .filter(msg => msg.role === 'user')
                .map(msg => msg.message)
                .join('\n');

            // Obtener también las últimas respuestas del asistente para contexto
            const assistantMessages = messages
                .filter(msg => msg.role === 'assistant')
                .slice(-3) // Últimas 3 respuestas
                .map(msg => msg.message)
                .join('\n');

            const prompt = `
Actúa como un asistente de soporte técnico especializado en análisis de conversaciones.

Basándote en esta conversación entre un usuario y un chatbot de atención al cliente, genera un resumen estructurado que incluya:

**MENSAJES DEL USUARIO:**
${userMessages}

**ÚLTIMAS RESPUESTAS DEL SISTEMA:**
${assistantMessages}

Por favor, proporciona un resumen siguiendo este formato exacto:

## RESUMEN DE LA CONVERSACIÓN

**Problema Principal:**
[Descripción clara y concisa del problema principal del usuario]

**Detalles Adicionales:**
[Información relevante adicional, productos mencionados, números de pedido, etc.]

**Estado de la Consulta:**
[Si el problema fue resuelto parcialmente, requiere seguimiento, etc.]

**Urgencia:**
[Baja/Media/Alta basada en el tono y contenido de los mensajes]

**Acciones Recomendadas:**
[Pasos específicos que el agente debería considerar para resolver el problema]

Mantén el resumen conciso pero completo, enfocándote en información que sea útil para el agente de soporte.
`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system", 
                        content: "Eres un especialista en análisis de conversaciones de soporte técnico. Genera resúmenes claros y accionables."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });

            return completion.choices[0]?.message?.content || "No se pudo generar el resumen.";
        } catch (error) {
            console.error("Error generando resumen:", error);
            return "Error al generar el resumen de la conversación.";
        }
    }
}