import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../modules/supplier-management";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    const supplier = await supplierService.createSupplier(req.body);
    
    res.status(201).json({
      supplier,
      message: "Supplier created successfully"
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({
      message: "Error creating supplier",
      error: error.message
    });
  }
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    const { limit = 20, offset = 0, is_active } = req.query;
    
    // Filtros opcionales
    const filters: any = {};
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }
    
    const suppliers = await supplierService.listSuppliers(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    
    res.status(200).json({
      suppliers,
      count: suppliers.length,
      offset: Number(offset),
      limit: Number(limit)
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({
      message: "Error fetching suppliers",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;