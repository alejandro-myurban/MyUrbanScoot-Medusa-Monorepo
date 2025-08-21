import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log(`🔍 DEBUG ENDPOINT: Iniciando debug de inventory levels...`);
    
    const inventoryService = req.scope.resolve(Modules.INVENTORY);
    const productService = req.scope.resolve(Modules.PRODUCT);
    
    // Test con inventory item conocido
    const knownInventoryItemId = "iitem_01K2HTR2JH1NHDAFF7R3GZVF5F";
    
    console.log(`🧪 Consultando inventory item: ${knownInventoryItemId}`);
    
    // Obtener todos los levels sin filtro
    const allLevels = await inventoryService.listInventoryLevels({
      inventory_item_id: knownInventoryItemId
    });
    
    console.log(`📊 Levels encontrados:`, allLevels);
    
    // Obtener todas las ubicaciones
    const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION);
    const allLocations = await stockLocationService.listStockLocations({}, { take: 100 });
    
    console.log(`📍 Ubicaciones encontradas:`, allLocations);
    
    // Buscar productos que tengan este inventory item
    const allProducts = await productService.listProducts(
      {}, 
      { 
        relations: ["variants", "variants.inventory_items"],
        take: 100 
      }
    );
    
    console.log(`📦 Productos totales encontrados:`, allProducts.length);
    
    const productWithKnownItem = allProducts.find(product =>
      product.variants?.some(variant =>
        variant.inventory_items?.some(ii => ii.inventory_item_id === knownInventoryItemId)
      )
    );
    
    console.log(`🎯 Producto con inventory item conocido:`, productWithKnownItem?.title);
    
    // Crear respuesta estructurada
    const debugInfo = {
      timestamp: new Date().toISOString(),
      knownInventoryItemId,
      inventoryLevels: allLevels.map(level => ({
        id: level.id,
        inventory_item_id: level.inventory_item_id,
        location_id: level.location_id,
        stocked_quantity: level.stocked_quantity,
        available_quantity: level.available_quantity,
        incoming_quantity: level.incoming_quantity,
      })),
      locations: allLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        created_at: loc.created_at,
      })),
      productInfo: productWithKnownItem ? {
        id: productWithKnownItem.id,
        title: productWithKnownItem.title,
        status: productWithKnownItem.status,
        variants: productWithKnownItem.variants?.map(v => ({
          id: v.id,
          title: v.title,
          manage_inventory: v.manage_inventory,
          inventory_items: v.inventory_items?.map(ii => ({
            inventory_item_id: ii.inventory_item_id,
          }))
        }))
      } : null,
      summary: {
        totalLevels: allLevels.length,
        totalLocations: allLocations.length,
        productFound: !!productWithKnownItem,
        levelsWithStock: allLevels.filter(l => l.stocked_quantity > 0).length,
      }
    };
    
    console.log(`✅ DEBUG INFO generado:`, debugInfo);
    
    res.status(200).json({
      success: true,
      debug: debugInfo
    });

  } catch (error: any) {
    console.error(`❌ DEBUG ERROR:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export const AUTHENTICATE = true;