// src/api/appointments/cleanup/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("🧹 Cleanup endpoint called via MedusaRequest");

  try {
    const appointmentsModuleService = req.scope.resolve("appointments") as any;

    // Ejecutar limpieza de citas pendientes vencidas
    const result = await appointmentsModuleService.cleanupExpiredPendingAppointments() ;

    console.log("✅ Cleanup completed successfully:", result);

    res.json({
      success: true,
      message: `Limpieza completada: ${result.cleaned} citas eliminadas, ${result.pending} pendientes restantes`,
      cleaned: result.cleaned,
      pending: result.pending
    });

  } catch (error) {
    console.error("❌ Error in cleanup endpoint:", error);
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to cleanup appointments",
      cleaned: 0,
      pending: 0
    });
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  console.log("📊 Cleanup stats endpoint called via MedusaRequest");

  try {
    const appointmentsModuleService = req.scope.resolve("appointments") as any

    // Obtener citas pendientes con info de expiración
    const pendingWithExpiration = await appointmentsModuleService.getPendingAppointmentsWithExpiration();
    
    const expired = pendingWithExpiration.filter(apt => apt.isExpired);
    const aboutToExpire = pendingWithExpiration.filter(apt => 
      !apt.isExpired && apt.hoursFromCreation > 10
    );

    const stats = {
      total_pending: pendingWithExpiration.length,
      expired: expired.length,
      about_to_expire: aboutToExpire.length,
      appointments: pendingWithExpiration
    };

    console.log("📊 Cleanup stats:", stats);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error("❌ Error in cleanup stats endpoint:", error);
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get cleanup stats"
    });
  }
}