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
    const { limit = 20, offset = 0, status, supplier_id } = req.query;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const filters: any = {};
    if (status) filters.status = status;
    if (supplier_id) filters.supplier_id = supplier_id;
    
    const orders = await supplierService.listSupplierOrders(filters, {
      skip: Number(offset),
      take: Number(limit),
      relations: ["supplier"]
    });
    
    res.status(200).json({
      orders,
      count: orders.length,
      offset: Number(offset),
      limit: Number(limit)
    });
  } catch (error) {
    console.error("Error fetching supplier orders:", error);
    res.status(500).json({
      message: "Error fetching supplier orders",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;