import { model } from "@medusajs/framework/utils";
import Supplier from "./supplier";

const ProductSupplier = model.define("product_supplier", {
  id: model.id().primaryKey(),
  
  // Referencias a producto de MedusaJS
  product_id: model.text(),                // ID del producto en MedusaJS
  product_variant_id: model.text().nullable(), // ID de la variante si aplica
  
  // Relación con proveedor
  supplier: model.belongsTo(() => Supplier, { mappedBy: "product_suppliers" }),
  
  // Información del proveedor sobre el producto
  supplier_sku: model.text().nullable(),   // SKU/código del proveedor
  supplier_product_name: model.text().nullable(), // Nombre en catálogo del proveedor
  supplier_description: model.text().nullable(), // Descripción del proveedor
  supplier_product_url: model.text().nullable(), // URL del producto en el sitio del proveedor
  
  // Precios y condiciones
  cost_price: model.number().nullable(),   // Precio de costo actual
  currency_code: model.text().default("EUR"),
  minimum_order_quantity: model.number().default(1), // Cantidad mínima de pedido
  lead_time_days: model.number().nullable(), // Tiempo de entrega en días
  
  // Historial de precios (JSON para flexibilidad)
  price_history: model.json().nullable(), // Array de {date, price, currency}
  
  // Configuración
  is_preferred_supplier: model.boolean().default(false), // Proveedor preferente
  is_active: model.boolean().default(true),
  
  // Producto específico para taller (no visible online)
  is_workshop_consumable: model.boolean().default(false),
  exclude_from_storefront: model.boolean().default(false),
  workshop_category: model.text().nullable(), // Categoría específica de taller
  
  // Fechas importantes
  last_purchase_date: model.dateTime().nullable(),
  last_price_update: model.dateTime().nullable(),
  
  // Información adicional
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default ProductSupplier;