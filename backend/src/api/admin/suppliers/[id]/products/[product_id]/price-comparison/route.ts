import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import SupplierManagementModuleService from "../../../../../../../modules/supplier-management/service";
import { SUPPLIER_MODULE } from "../../../../../../../modules/supplier-management";

type PriceComparisonParams = {
  id: string; // supplier_id
  product_id: string;
};

export const GET = async (
  req: AuthenticatedMedusaRequest<never, PriceComparisonParams>,
  res: MedusaResponse
) => {
  try {
    const { id: supplierId, product_id: productId } = req.params;

    if (!productId || !supplierId) {
      return res.status(400).json({
        success: false,
        error: "supplier_id y product_id son requeridos"
      });
    }

    console.log(`🔍 API: Comparando precios para producto ${productId} con proveedor actual ${supplierId}`);
    
    // Usar exactamente el mismo patrón que last-price
    const supplierService: SupplierManagementModuleService = req.scope.resolve(SUPPLIER_MODULE);
    console.log(`✅ Servicio resuelto exitosamente`);
    
    const comparison = await supplierService.compareProductPricesAcrossSuppliers(
      productId as string,
      supplierId as string
    );

    console.log(`✅ API: Resultado de comparación:`, comparison);

    return res.status(200).json({
      success: true,
      data: comparison
    });

  } catch (error: any) {
    console.error("❌ API Error comparing prices:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor"
    });
  }
};