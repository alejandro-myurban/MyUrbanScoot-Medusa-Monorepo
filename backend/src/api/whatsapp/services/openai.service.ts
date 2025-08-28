import OpenAI from 'openai';
import { ORDER_STATUS_MESSAGES } from '../constants/messages';

export class OpenAIService {
    private openai: OpenAI;
    private assistantId: string;
    private userThreads: Map<string, string> = new Map();

    constructor() {
        // Inicialización del cliente OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!
        });
        this.assistantId = "asst_WHExxIFiHSzghOVeFvJmuON5";
    }

    // Procesa un mensaje del usuario y obtiene respuesta del asistente
    async processMessage(userId: string, content: any[]) {
        let threadId = this.userThreads.get(userId);
        
        // Crea nuevo thread si no existe para el usuario
        if (!threadId) {
            const thread = await this.openai.beta.threads.create();
            threadId = thread.id;
            this.userThreads.set(userId, threadId);
        }

        // Agrega mensaje del usuario al thread
        await this.openai.beta.threads.messages.create(threadId, {
            role: "user",
            content
        });

        return this.runAssistant(threadId);
    }

    // Inicia el asistente con las herramientas configuradas
    private async runAssistant(threadId: string) {
        const run = await this.openai.beta.threads.runs.create(threadId, {
            assistant_id: this.assistantId,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "track_order",
                        description: "consulta el estado del pedido del cliente",
                        parameters: {
                            type: "object",
                            properties: {
                                orderid: {
                                    type: "string",
                                    description: "el numero de ID de la orden"
                                }
                            },
                            required: ["orderid"]
                        }
                    }
                },
                { type: "file_search" }
            ]
        });

        return this.waitForCompletion(threadId, run);
    }

    // Espera la finalización del asistente
    private async waitForCompletion(threadId: string, run: any) {
        const maxAttempts = 30;
        let attempts = 0;

        while (run.status !== "completed" && attempts < maxAttempts) {
            if (run.status === "failed") {
                throw new Error(run.last_error?.message || "Error en run");
            }

            // Maneja las acciones requeridas del asistente
            if (run.required_action?.type === "submit_tool_outputs") {
                run = await this.handleToolOutputs(threadId, run);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            run = await this.openai.beta.threads.runs.retrieve(run.id, {
                thread_id: threadId
            });
            attempts++;
        }

        return this.getLastMessage(threadId);
    }

    // Maneja las salidas de las herramientas del asistente
    private async handleToolOutputs(threadId: string, run: any) {
        const toolOutputs = await Promise.all(
            run.required_action.submit_tool_outputs.tool_calls.map(
                async (toolCall: any) => {
                    if (toolCall.function.name === "track_order") {
                        return await this.handleTrackOrder(toolCall);
                    }
                    return {
                        tool_call_id: toolCall.id,
                        output: "Acción no soportada"
                    };
                }
            )
        );

        return this.openai.beta.threads.runs.submitToolOutputs(run.id, {
            thread_id: threadId,
            tool_outputs: toolOutputs
        });
    }

    // Maneja el seguimiento de pedidos
    private async handleTrackOrder(toolCall: any) {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const orderId = args.orderid;

            // Validación del formato del ID
            if (!/^\d{5}$/.test(orderId)) {
                return {
                    tool_call_id: toolCall.id,
                    output: "El número de pedido debe tener 5 dígitos"
                };
            }

            // Consulta del estado del pedido
            const response = await fetch(`${process.env.WC_URL}/orders/${orderId}`, {
                headers: {
                    Authorization: "Basic " + 
                        Buffer.from(
                            `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_KEY_S}`
                        ).toString("base64"),
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                return {
                    tool_call_id: toolCall.id,
                    output: "No se encontró el pedido"
                };
            }

            const orderData = await response.json();
            return {
                tool_call_id: toolCall.id,
                output: ORDER_STATUS_MESSAGES[orderData.status] || 
                    `Estado: ${orderData.status}`
            };
        } catch (error) {
            return {
                tool_call_id: toolCall.id,
                output: "Error consultando el pedido"
            };
        }
    }

    // Obtiene el último mensaje del thread
    private async getLastMessage(threadId: string) {
        const messages = await this.openai.beta.threads.messages.list(threadId, {
            order: "desc",
            limit: 1
        });

        const lastMessage = messages.data[0];
        return lastMessage?.content?.[0]?.type === "text" 
            ? lastMessage.content[0].text.value 
            : "Lo siento, no pude generar una respuesta";
    }
}
