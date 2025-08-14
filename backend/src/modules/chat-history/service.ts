import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils"
import { EntityManager } from "@mikro-orm/knex"
import { ChatHistory } from "./models/chat-history"
import { DAL } from "@medusajs/framework/types"

type InjectedDependencies = {
  chatHistoryRepository: DAL.RepositoryService<typeof ChatHistory>
}

export default class ChatHistoryService extends MedusaService({
  ChatHistory,
}) {
  protected chatHistoryRepository_: DAL.RepositoryService<typeof ChatHistory>

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
  console.log("📜 [SERVICE:list] Filtro recibido:", filter, "Opciones:", options)

  const records = await this.chatHistoryRepository_.find(
    { where: filter, ...options },
    context
  )

  console.log(`📊 [SERVICE:list] Registros encontrados: ${records.length}`)
  return records
}

@InjectManager()
async saveMessage(
  data: { user_id: string; message: string; role: "user" | "assistant"; conversation_id?: string },
  @MedusaContext() context?: { manager: EntityManager }
) {
  console.log("💾 [SERVICE:saveMessage] Intentando guardar:", data)

  const [chat] = await this.chatHistoryRepository_.create([data], context)

  console.log("✅ [SERVICE:saveMessage] Registro creado:", chat)

  // Recuperamos el registro recién guardado para confirmar que está en BD
  const [fresh] = await this.chatHistoryRepository_.find(
    { where: { id: chat.id } },
    context
  )

  console.log("🔍 [SERVICE:saveMessage] Registro verificado en BD:", fresh)

  return fresh
}
}
