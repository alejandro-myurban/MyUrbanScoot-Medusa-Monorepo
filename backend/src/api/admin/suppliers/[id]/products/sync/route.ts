import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../modules/supplier-management";

type SyncProductSupplierParams = {
  id: string; // supplier_id
};

type SyncProductSupplierRequest = {
  product_id: string;
  supplier_sku: string;
  unit_price?: number;
};

export const POST = async (
  req: AuthenticatedMedusaRequest<SyncProductSupplierRequest, SyncProductSupplierParams>,
  res: MedusaResponse
) => {
  try {
    const { id: supplierId } = req.params;
    const { product_id, supplier_sku, unit_price } = req.body;
    
    if (!supplierId || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID y Product ID son requeridos"
      });
    }

    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    
    const productSupplier = await supplierService.syncProductSupplier({
      product_id,
      supplier_id: supplierId,
      supplier_sku,
      unit_price
    });
    
    res.status(200).json({
      success: true,
      message: "ProductSupplier sincronizado correctamente",
      data: productSupplier
    });

  } catch (error: any) {
    console.error("Error sincronizando ProductSupplier:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const AUTHENTICATE = true;