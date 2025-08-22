import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../modules/supplier-management";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params; // ID del pedido
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    console.log(`📋 Obteniendo estados válidos para pedido ${id}`);
    
    // Obtener el pedido actual
    const order = await supplierService.getSupplierOrderById(id);
    if (!order) {
      return res.status(404).json({
        message: "Supplier order not found"
      });
    }
    
    // Obtener estados válidos siguientes
    const validStatuses = supplierService.getValidNextStatuses(order.status);
    
    res.status(200).json({
      currentStatus: order.status,
      validNextStatuses: validStatuses
    });
  } catch (error) {
    console.error("Error getting valid statuses:", error);
    res.status(500).json({
      message: "Error getting valid statuses",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;