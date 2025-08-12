import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../modules/supplier-management";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: supplier_id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const orderData = {
      ...req.body,
      supplier_id,
      created_by: req.auth?.actor_id || req.auth?.user?.id
    };
    
    const order = await supplierService.createSupplierOrder(orderData);
    
    res.status(201).json({
      order,
      message: "Supplier order created successfully"
    });
  } catch (error) {
    console.error("Error creating supplier order:", error);
    res.status(500).json({
      message: "Error creating supplier order",
      error: error.message
    });
  }
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: supplier_id } = req.params;
    const { limit = 20, offset = 0, status } = req.query;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const filters: any = { supplier_id };
    if (status) {
      filters.status = status;
    }
    
    const orders = await supplierService.listSupplierOrders(filters, {
      skip: Number(offset),
      take: Number(limit),
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