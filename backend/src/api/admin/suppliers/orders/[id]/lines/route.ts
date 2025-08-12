import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../modules/supplier-management";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: order_id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const lineData = {
      ...req.body,
      supplier_order_id: order_id
    };
    
    const line = await supplierService.addOrderLine(lineData);
    
    res.status(201).json({
      line,
      message: "Order line added successfully"
    });
  } catch (error) {
    console.error("Error adding order line:", error);
    res.status(500).json({
      message: "Error adding order line",
      error: error.message
    });
  }
};

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: order_id } = req.params;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const lines = await supplierService.getOrderLines(order_id);
    
    res.status(200).json({
      lines,
      count: lines.length
    });
  } catch (error) {
    console.error("Error fetching order lines:", error);
    res.status(500).json({
      message: "Error fetching order lines",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;