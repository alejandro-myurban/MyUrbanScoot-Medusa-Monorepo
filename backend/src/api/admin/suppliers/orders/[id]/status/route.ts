import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../modules/supplier-management";

export const PATCH = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    console.log(`🔄 Actualizando estado del pedido ${id} a: ${status}`);
    
    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }
    
    // Obtener estado antes del cambio
    const orderBefore = await supplierService.getSupplierOrderById(id);
    console.log(`📋 Estado anterior: ${orderBefore?.status}`);
    
    const order = await supplierService.updateSupplierOrderStatus(id, status);
    console.log(`✅ Estado actualizado: ${order?.status}`);
    
    res.status(200).json({
      order,
      message: `Supplier order status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating supplier order status:", error);
    res.status(500).json({
      message: "Error updating supplier order status",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;