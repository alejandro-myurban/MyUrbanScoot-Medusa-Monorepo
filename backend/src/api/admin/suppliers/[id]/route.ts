import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../modules/supplier-management";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const supplier = await supplierService.getSupplierById(id);
    
    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }
    
    res.status(200).json({
      supplier
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({
      message: "Error fetching supplier",
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
    const supplier = await supplierService.updateSupplier(id, req.body);
    
    res.status(200).json({
      supplier,
      message: "Supplier updated successfully"
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({
      message: "Error updating supplier",
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
    
    await supplierService.deactivateSupplier(id);
    
    res.status(200).json({
      message: "Supplier deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating supplier:", error);
    res.status(500).json({
      message: "Error deactivating supplier",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;