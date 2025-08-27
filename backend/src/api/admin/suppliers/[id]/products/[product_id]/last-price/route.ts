import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../../modules/supplier-management";

type LastPriceParams = {
  id: string; // supplier_id
  product_id: string;
};

export const GET = async (
  req: AuthenticatedMedusaRequest<never, LastPriceParams>,
  res: MedusaResponse
) => {
  try {
    const { id: supplierId, product_id: productId } = req.params;
    
    if (!supplierId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID y Product ID son requeridos"
      });
    }

    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const lastPriceInfo = await supplierService.getLastPriceForProduct(supplierId, productId);
    
    if (!lastPriceInfo) {
      return res.status(404).json({
        success: false,
        message: "No se encontró historial de precios para este producto con este proveedor",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Último precio encontrado",
      data: lastPriceInfo
    });

  } catch (error: any) {
    console.error("Error obteniendo último precio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;