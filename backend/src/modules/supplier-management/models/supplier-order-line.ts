import { model } from "@medusajs/framework/utils";
import SupplierOrder from "./supplier-order";

const SupplierOrderLine = model.define("supplier_order_line", {
  id: model.id().primaryKey(),
  
  // Relación con el pedido
  supplier_order: model.belongsTo(() => SupplierOrder, { mappedBy: "order_lines" }),
  
  // Producto (vinculación con productos de MedusaJS)
  product_id: model.text().nullable(),     // ID del producto en MedusaJS
  product_variant_id: model.text().nullable(), // ID de la variante específica
  product_title: model.text(),             // Título del producto (snapshot)
  product_description: model.text().nullable(), // Descripción del producto
  product_thumbnail: model.text().nullable(), // Imagen del producto (snapshot)
  
  // Información del proveedor sobre el producto
  supplier_sku: model.text().nullable(),   // SKU del proveedor
  supplier_product_name: model.text().nullable(), // Nombre en el catálogo del proveedor
  
  // Cantidades
  quantity_ordered: model.number(),        // Cantidad pedida
  quantity_received: model.number().default(0), // Cantidad recibida
  quantity_pending: model.number().default(0),  // Cantidad pendiente
  
  // Precios (en la moneda del pedido)
  unit_price: model.number(),              // Precio unitario
  tax_rate: model.number().default(0),     // Porcentaje de IVA (0, 21, etc.)
  discount_rate: model.number().default(0), // Porcentaje de descuento (0, 10, etc.)
  total_price: model.number(),             // Precio total de la línea (unit_price * quantity_ordered)
  
  // Información de recepción
  received_at: model.dateTime().nullable(),
  received_by: model.text().nullable(),    // Usuario que recepcionó
  reception_notes: model.text().nullable(), // Notas sobre la recepción
  
  // Estado de la línea
  line_status: model.enum([
    "pending",      // Pendiente
    "partial",      // Parcialmente recibido
    "received",     // Completamente recibido
    "incident",     // Con incidencia
    "cancelled"     // Cancelado
  ]).default("pending"),
  
  // Información adicional
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
});

export default SupplierOrderLine;