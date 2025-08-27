import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../../modules/supplier-management";

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: line_id } = req.params;
    //@ts-ignore
    const { quantity_received, reception_notes, received_by } = req.body;
    const supplierService: SupplierManagementModuleService =
      req.scope.resolve(SUPPLIER_MODULE);

    if (!quantity_received || quantity_received <= 0) {
      return res.status(400).json({
        message: "Valid quantity_received is required",
      });
    }

    const receivedData = {
      quantity_received: Number(quantity_received),
      // Usar el nombre del usuario del frontend, o ID como fallback
      //@ts-ignore
      received_by: received_by || req.auth?.actor_id || req.auth?.user?.id,
      reception_notes: reception_notes || null,
    };

    const line = await supplierService.receiveOrderLine(line_id, receivedData);

    res.status(200).json({
      line,
      message: "Order line received successfully",
    });
  } catch (error) {
    console.error("Error receiving order line:", error);
    res.status(500).json({
      message: "Error receiving order line",
      error: error.message,
    });
  }
};

export const AUTHENTICATE = true;
