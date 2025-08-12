import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../modules/supplier-management";

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const { cost_price } = req.body;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    if (cost_price !== undefined) {
      const productSupplier = await supplierService.updateProductSupplierCost(id, {
        cost_price: Number(cost_price),
        updated_by: req.auth?.actor_id || req.auth?.user?.id
      });
      
      res.status(200).json({
        product_supplier: productSupplier,
        message: "Product supplier cost updated successfully"
      });
    } else {
      const productSupplier = await supplierService.updateProductSupplier(id, req.body);
      
      res.status(200).json({
        product_supplier: productSupplier,
        message: "Product supplier updated successfully"
      });
    }
  } catch (error) {
    console.error("Error updating product supplier:", error);
    res.status(500).json({
      message: "Error updating product supplier",
      error: error.message
    });
  }
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const productSupplier = await supplierService.getProductSupplierById(id);
    
    if (!productSupplier) {
      return res.status(404).json({
        message: "Product supplier relationship not found"
      });
    }
    
    res.status(200).json({
      product_supplier: productSupplier
    });
  } catch (error) {
    console.error("Error fetching product supplier:", error);
    res.status(500).json({
      message: "Error fetching product supplier",
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
    
    await supplierService.unlinkProductFromSupplier(id);
    
    res.status(200).json({
      message: "Product unlinked from supplier successfully"
    });
  } catch (error) {
    console.error("Error unlinking product from supplier:", error);
    res.status(500).json({
      message: "Error unlinking product from supplier",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;