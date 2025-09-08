// backend/src/api/workshops/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const workshopService = req.scope.resolve("appointments") as any
  
  const workshops = await workshopService.listWorkshops({}, {}, req.scope)
  res.json({ workshops })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const workshopService = req.scope.resolve("appointments") as any
  
  const workshop = await workshopService.createWorkshops(req.body, req.scope)
  res.json({ workshop })
}