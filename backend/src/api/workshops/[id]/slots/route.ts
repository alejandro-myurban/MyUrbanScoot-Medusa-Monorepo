// backend/src/api/workshops/[id]/slots/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { date } = req.query

    if (!id || !date) {
      return res.status(400).json({
        error: "Workshop ID and date are required"
      })
    }

    // Resolver el servicio de appointments
    const appointmentsModuleService = req.scope.resolve("appointments") as any

    // Convertir la fecha string a Date object
    const dateObj = new Date(date as string)
    
    // Llamar al método para obtener slots disponibles
    const availableSlots = await appointmentsModuleService.getAvailableTimeSlots(
      id,
      dateObj,
      req.scope
    )

    res.json({
      availableSlots,
      workshop_id: id,
      date: date
    })

  } catch (error) {
    console.error("Error fetching available slots:", error)
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}

export async function OPTIONS(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Manejar preflight requests para CORS
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key")
  res.status(200).end()
}