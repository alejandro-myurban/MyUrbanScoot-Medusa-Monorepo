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
    const {
      limit = 50,
      offset = 0,
      movement_type,
      product_id,
      location_id,
      from_date,
      to_date,
    } = req.query;

    const supplierService: SupplierManagementModuleService =
      req.scope.resolve(SUPPLIER_MODULE);

    const filters: any = {};
    if (movement_type) filters.movement_type = movement_type;
    if (product_id) filters.product_id = product_id;
    if (location_id) {
      filters.$or = [
        { from_location_id: location_id },
        { to_location_id: location_id },
      ];
    }

    // Filtros por fecha
    if (from_date || to_date) {
      filters.performed_at = {};
      if (from_date) filters.performed_at.$gte = new Date(from_date as string);
      if (to_date) filters.performed_at.$lte = new Date(to_date as string);
    }

    const movements = await supplierService.listInventoryMovements(filters, {
      skip: Number(offset),
      take: Number(limit),
      //@ts-ignore
      orderBy: { performed_at: "desc" },
    });

    res.status(200).json({
      movements,
      count: movements.length,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    res.status(500).json({
      message: "Error fetching inventory movements",
      error: error.message,
    });
  }
};

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const supplierService: SupplierManagementModuleService =
      req.scope.resolve(SUPPLIER_MODULE);

    const movementData = {
          //@ts-ignore
      ...req.body,
          //@ts-ignore
      performed_by: req.auth?.actor_id || req.auth?.user?.id,
      performed_at: new Date(),
    };

    const movement = await supplierService.createInventoryMovement(
      movementData
    );

    res.status(201).json({
      movement,
      message: "Inventory movement created successfully",
    });
  } catch (error) {
    console.error("Error creating inventory movement:", error);
    res.status(500).json({
      message: "Error creating inventory movement",
      error: error.message,
    });
  }
};

export const AUTHENTICATE = true;
