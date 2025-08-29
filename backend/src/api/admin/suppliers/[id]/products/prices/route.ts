import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../modules/supplier-management";

type PricesParams = {
  id: string; // supplier_id
};

export const GET = async (
  req: AuthenticatedMedusaRequest<never, PricesParams>,
  res: MedusaResponse
) => {
  try {
    const { id: supplierId } = req.params;
    
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID es requerido"
      });
    }

    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    // Obtener todos los precios de productos para este proveedor
    const productsWithPrices = await supplierService.getAllProductPricesForSupplier(supplierId);
    
    res.status(200).json({
      success: true,
      message: "Precios obtenidos correctamente",
      data: productsWithPrices
    });

  } catch (error: any) {
    console.error("Error obteniendo precios masivos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;