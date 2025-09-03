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
    const { limit = 20, offset = 0, status, supplier_id, include_lines } = req.query;
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const filters: any = {};
    if (status) filters.status = status;
    if (supplier_id) filters.supplier_id = supplier_id;
    
    // Determine relations to include
    const relations = ["supplier"];
    if (include_lines === 'true') {
      relations.push("order_lines");
    }
    
    const orders = await supplierService.listSupplierOrders(filters, {
      skip: Number(offset),
      take: Number(limit),
      relations
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

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("🔍 Creating supplier order with data:", req.body);
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    // Extract order data from request body
    const {
      supplier_id,
      expected_delivery_date,
      destination_location_id,
      reference,
      notes,
      created_by,
      order_lines
    } = req.body;

    // Create the supplier order
    const order = await supplierService.createSupplierOrder({
      supplier_id,
      expected_delivery_date,
      destination_location_id,
      reference,
      notes,
      created_by,
      order_lines: order_lines || []
    });

    console.log("✅ Supplier order created successfully:", order);
    
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Error creating supplier order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating supplier order",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;