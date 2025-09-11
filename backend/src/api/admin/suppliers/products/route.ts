import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../modules/supplier-management";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    const productSupplier = await supplierService.linkProductToSupplier(req.body);
    
    res.status(201).json({
      product_supplier: productSupplier,
      message: "Product linked to supplier successfully"
    });
  } catch (error) {
    console.error("Error linking product to supplier:", error);
    res.status(500).json({
      message: "Error linking product to supplier",
      error: error.message
    });
  }
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { limit = 50, offset = 0, supplier_id, product_id } = req.query;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const filters: any = {};
    if (supplier_id) filters.supplier_id = supplier_id;
    if (product_id) filters.product_id = product_id;
    
    const productSuppliers = await supplierService.listProductSuppliers(filters, {
      skip: Number(offset),
      take: Number(limit),
      relations: ["supplier"], // Include supplier data
    });
    
    res.status(200).json({
      product_suppliers: productSuppliers,
      count: productSuppliers.length,
      offset: Number(offset),
      limit: Number(limit)
    });
  } catch (error) {
    console.error("Error fetching product suppliers:", error);
    res.status(500).json({
      message: "Error fetching product suppliers",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;