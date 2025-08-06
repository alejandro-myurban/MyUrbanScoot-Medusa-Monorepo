import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FINANCING_MODULE } from "modules/financing_data";
import FinancingModuleService from "modules/financing_data/service";

type UpdateContactedRequest = {
  contacted: boolean;
};

export const PUT = async (
  req: MedusaRequest<UpdateContactedRequest>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const { contacted } = req.body;

  console.log("🔍 Debug - req.params:", req.params);
  console.log("🔍 Debug - id value:", JSON.stringify(id));
  console.log("🔍 Debug - contacted:", contacted);

  // Validar que el ID esté presente
  if (!id || id.trim() === "") {
    console.log("❌ ID validation failed - returning 400");
    return res.status(400).json({
      message: "ID de solicitud requerido",
    });
  }

  // Validar que el valor contacted sea boolean
  if (typeof contacted !== "boolean") {
    return res.status(400).json({
      message: "El valor de contacted debe ser true o false",
    });
  }

  const financingDataModule: FinancingModuleService =
    req.scope.resolve(FINANCING_MODULE);

  try {
    // Actualizar el estado de contacto de la solicitud
    //@ts-ignore
    const updatedData = await financingDataModule.updateFinancingData({
      id,
      contacted,
    });

    console.log(`✅ Estado de contacto actualizado para solicitud ${id}: ${contacted}`);

    res.status(200).json({
      message: "Estado de contacto actualizado correctamente",
      data: updatedData,
    });
  } catch (error) {
    console.error("❌ Error actualizando estado de contacto:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(500).json({
      message: "Error al actualizar el estado de contacto",
      error: errorMessage,
    });
  }
};