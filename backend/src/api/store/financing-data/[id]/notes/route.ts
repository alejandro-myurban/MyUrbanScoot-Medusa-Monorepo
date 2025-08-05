import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

type UpdateNotesRequest = {
  admin_notes: string;
};

export const PUT = async (
  req: MedusaRequest<UpdateNotesRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  console.log("🔍 Debug - req.params:", req.params);
  console.log("🔍 Debug - id value:", JSON.stringify(id));
  console.log("🔍 Debug - admin_notes:", admin_notes);

  // Validar que el ID esté presente
  if (!id || id.trim() === "") {
    console.log("❌ ID validation failed - returning 400");
    return res.status(400).json({
      message: "ID de solicitud requerido",
    });
  }

  const financingDataModule: FinancingModuleService =
    req.scope.resolve(FINANCING_MODULE);

  try {
    // Actualizar las notas de la solicitud
    //@ts-ignore
    const updatedData = await financingDataModule.updateFinancingData({
      id,
      admin_notes,
    });

    console.log(`✅ Notas actualizadas para solicitud ${id}`);

    res.status(200).json({
      message: "Notas actualizadas correctamente",
      data: updatedData,
    });
  } catch (error) {
    console.error("❌ Error actualizando notas:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al actualizar las notas",
      error: errorMessage,
    });
  }
};