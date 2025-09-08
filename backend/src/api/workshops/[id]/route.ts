// backend/src/api/workshops/[id]/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const workshopService = req.scope.resolve("appointments") as any
  
  const workshop = await workshopService.updateWorkshops(
    req.params.id,
    req.body,
    req.scope
  )
  res.json({ workshop })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const workshopService = req.scope.resolve("appointments") as any
  
  await workshopService.deleteWorkshops(req.params.id, req.scope)
  res.json({ success: true })
}
