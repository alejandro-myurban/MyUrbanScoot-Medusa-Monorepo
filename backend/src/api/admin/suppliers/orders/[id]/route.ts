import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../modules/supplier-management";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const order = await supplierService.getSupplierOrderById(id);
    
    if (!order) {
      return res.status(404).json({
        message: "Supplier order not found"
      });
    }
    
    res.status(200).json({
      order
    });
  } catch (error) {
    console.error("Error fetching supplier order:", error);
    res.status(500).json({
      message: "Error fetching supplier order",
      error: error.message
    });
  }
};

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
        //@ts-ignore
    const order = await supplierService.updateSupplierOrder(id, req.body);
    
    res.status(200).json({
      order,
      message: "Supplier order updated successfully"
    });
  } catch (error) {
    console.error("Error updating supplier order:", error);
    res.status(500).json({
      message: "Error updating supplier order",
      error: error.message
    });
  }
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    await supplierService.updateSupplierOrderStatus(id, 'cancelled');
    
    res.status(200).json({
      message: "Supplier order cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling supplier order:", error);
    res.status(500).json({
      message: "Error cancelling supplier order",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;