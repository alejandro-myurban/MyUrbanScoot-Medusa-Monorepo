import { model } from "@medusajs/framework/utils";
import Supplier from "./supplier";
import SupplierOrderLine from "./supplier-order-line";

const SupplierOrder = model.define("supplier_order", {
  id: model.id().primaryKey(),
  
  // Información básica del pedido
  display_id: model.text().unique(),     // Número de pedido visible (PO-001, TO-001, etc)
  supplier: model.belongsTo(() => Supplier, { mappedBy: "supplier_orders" }),
  
  // Tipo de pedido - NUEVO CAMPO
  order_type: model.text().default("supplier"), // "supplier" | "transfer"
  
  // Estado del pedido - cambiar a text como financing_data
  status: model.text().default("draft"),
  
  // Fechas importantes
  order_date: model.dateTime(),
  expected_delivery_date: model.dateTime().nullable(),
  confirmed_at: model.dateTime().nullable(),
  shipped_at: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  
  // Información financiera
  currency_code: model.text().default("EUR"),
  subtotal: model.number().default(0),      // Subtotal sin impuestos
  tax_total: model.number().default(0),     // Total de impuestos
  discount_total: model.number().default(0), // Total de descuentos
  total: model.number().default(0),         // Total final
  
  // Ubicación de destino (almacén)
  destination_location_id: model.text().nullable(), // ID del stock_location de MedusaJS
  destination_location_name: model.text().nullable(), // Nombre para referencia
  
  // NUEVO CAMPO - Ubicación de origen (para transferencias)
  source_location_id: model.text().nullable(), // ID del stock_location origen
  source_location_name: model.text().nullable(), // Nombre para referencia
  
  // Información adicional
  reference: model.text().nullable(),       // Referencia del proveedor
  notes: model.text().nullable(),
  internal_notes: model.text().nullable(), // Notas internas no visibles al proveedor
  
  // Auditoría
  created_by: model.text().nullable(),     // ID del usuario que creó
  received_by: model.text().nullable(),    // ID del usuario que recepcionó
  
  // Relaciones
  order_lines: model.hasMany(() => SupplierOrderLine, { mappedBy: "supplier_order" }),
  
  // Metadata para extensibilidad
  metadata: model.json().nullable(),
});

export default SupplierOrder;