// backend/src/api/appointments/[id]/route.ts

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const appointmentsModuleService = req.scope.resolve("appointments") as any
  const { id } = req.params

  if (typeof id !== 'string') {
    return res.status(400).json({ message: "ID parameter is required" })
  }
  
  try {
    const updatedAppointment = await appointmentsModuleService.updateAppointment(
      id,
      req.body,
      req.scope
    )
    res.status(200).json({ appointment: updatedAppointment })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    res.status(400).json({ message: errorMessage })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const appointmentsModuleService = req.scope.resolve("appointments") as any
  const { id } = req.params
  
  if (typeof id !== 'string') {
    return res.status(400).json({ message: "ID parameter is required" })
  }

  try {
    await appointmentsModuleService.deleteAppointment(id, req.scope)
    res.status(204).send() // 204 No Content es la respuesta estándar para eliminaciones exitosas
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    res.status(400).json({ message: errorMessage })
  }
}