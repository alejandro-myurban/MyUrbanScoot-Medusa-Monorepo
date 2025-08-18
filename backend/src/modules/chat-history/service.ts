import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils"
import { EntityManager } from "@mikro-orm/knex"
import { ChatHistory } from "./models/chat-history"
import { DAL, InferTypeOf } from "@medusajs/framework/types"

type ChatHistoryType = InferTypeOf<typeof ChatHistory>

type InjectedDependencies = {
  chatHistoryRepository: DAL.RepositoryService<ChatHistoryType>
}


export default class ChatHistoryService extends MedusaService({
  ChatHistory,
}) {
  protected chatHistoryRepository_: DAL.RepositoryService<ChatHistoryType>

  constructor({ chatHistoryRepository }: InjectedDependencies) {
    super(...arguments)
    this.chatHistoryRepository_ = chatHistoryRepository
  }

  @InjectManager()
  async list(
    filter = {},
    options = {},
    @MedusaContext() context?: { manager: EntityManager }
  ) {
    // console.log("📜 [SERVICE:list] Filtro recibido:", filter, "Opciones:", options)

    const records = await this.chatHistoryRepository_.find(
      { where: filter, ...options },
      context
    )

    // console.log(`📊 [SERVICE:list] Registros encontrados: ${records.length}`)
    return records
  }

  @InjectManager()
  async saveMessage(
    data: { 
      user_id: string; 
      message?: string; 
      role: "user" | "assistant" ;
      status?: "IA" | "AGENTE";
      conversation_id?: string 
    },
    @MedusaContext() context?: { manager: EntityManager }
  ) {
    console.log("💾 [SERVICE:saveMessage] Intentando guardar:", data)

    const [chat] = await this.chatHistoryRepository_.create([data], context)

    console.log("✅ [SERVICE:saveMessage] Registro creado:", chat)

    const [fresh] = await this.chatHistoryRepository_.find(
      { where: { id: chat.id } },
      context
    )

    console.log("🔍 [SERVICE:saveMessage] Registro verificado en BD:", fresh)

    return fresh
  }

  @InjectManager()
  async getConversationStatus(userId: string, context?: { manager: EntityManager }) {
    const filter = { user_id: userId };
    const options = { orderBy: { created_at: "DESC" }, limit: 20 }; // últimos 20 mensajes

    const messages = await this.chatHistoryRepository_.find(
      { where: filter, ...options },
      context
    );

    const latestAssistantMsg = messages
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .find(msg => (msg.role === "assistant" || msg.role === "agent") && msg.status);

    return latestAssistantMsg?.status || "IA";
  }
  @InjectManager()
  async updateConversationStatus(
    userId: string,
    newStatus: "IA" | "AGENTE",
    @MedusaContext() context?: { manager: EntityManager }
  ) {
    let messageData: { user_id: string; message?: string; role: "assistant"; status: "IA" | "AGENTE" };

    if (newStatus === "AGENTE") {
      messageData = {
        user_id: userId,
        message: "Un asistente se ha tomado su consulta",
        role: "assistant",
        status: newStatus,
      };
    } else {
      // Para IA, guardamos solo el estado sin mensaje
      messageData = {
        user_id: userId,
        role: "assistant",
        status: newStatus,
        message: "El agente ha vuelto a IA",
      };
    }

    return this.saveMessage(messageData, context);
  }

  @InjectManager()
  async getLastMessageDate(
    userId: string,
    @MedusaContext() context?: { manager: EntityManager }
  ): Promise<Date> {
    const filter = { user_id: userId };
    const options = { 
      take: 1, 
      order: { created_at: "DESC" },
    };
    
    const [latestMessage] = await this.chatHistoryRepository_.find(
      { where: filter, ...options },
      context
    );
    return latestMessage?.created_at || new Date(0);
  }

}
