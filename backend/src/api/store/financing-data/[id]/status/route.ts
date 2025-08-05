import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

type UpdateStatusRequest = {
  status: string;
};

export const PUT = async (
  req: MedusaRequest<UpdateStatusRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("🔍 Debug - req.params:", req.params);
  console.log("🔍 Debug - id value:", JSON.stringify(id));
  console.log("🔍 Debug - id type:", typeof id);

  // Validar que el ID esté presente
  if (!id || id.trim() === "") {
    console.log("❌ ID validation failed - returning 400");
    return res.status(400).json({
      message: "ID de solicitud requerido",
    });
  }

  // Validar que el estado sea válido
  const validStatuses = ["pending", "accepted", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Estado inválido. Debe ser: pending, accepted, o rejected",
    });
  }

  const financingDataModule: FinancingModuleService =
    req.scope.resolve(FINANCING_MODULE);

  try {
    // Actualizar el estado de la solicitud 
    //@ts-ignore
    const updatedData = await financingDataModule.updateFinancingData({
      id,
      status,
    });

    console.log(`✅ Estado actualizado para solicitud ${id}: ${status}`);

    res.status(200).json({
      message: "Estado actualizado correctamente",
      data: updatedData,
    });
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al actualizar el estado",
      error: errorMessage,
    });
  }
};
