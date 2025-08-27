import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../../modules/supplier-management";

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params; // ID de la línea
    //@ts-ignore
    const { hasIncident, incidentNotes, userId } = req.body;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    console.log(`🚨 Actualizando incidencia de línea ${id}: hasIncident=${hasIncident}`);
    
    if (hasIncident === undefined) {
      return res.status(400).json({
        message: "hasIncident is required"
      });
    }
    
    const updatedLine = await supplierService.updateOrderLineIncident(
      id, 
      hasIncident, 
      incidentNotes,
      // Usar el nombre del usuario del frontend, o ID como fallback
      //@ts-ignore
      userId || req.auth?.actor_id || req.auth?.user?.id
    );
    
    res.status(200).json({
      line: updatedLine,
      message: `Order line incident status updated`
    });
  } catch (error) {
    console.error("Error updating order line incident:", error);
    res.status(500).json({
      message: "Error updating order line incident",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;