import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const userModuleService = req.scope.resolve(Modules.USER)
  const user = await userModuleService.retrieveUser(req.auth_context.actor_id)
  console.log("EL USER EN API", user)
  res.json({ user })
}