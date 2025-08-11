import { model } from "@medusajs/framework/utils";

const InventoryMovement = model.define("inventory_movement", {
  id: model.id().primaryKey(),
  
  // Tipo de movimiento
  movement_type: model.enum([
    "supplier_receipt",    // Recepción de proveedor
    "transfer_out",        // Salida por traspaso
    "transfer_in",         // Entrada por traspaso
    "adjustment",          // Ajuste manual
    "sale",               // Venta (para referencia)
    "return",             // Devolución
    "damage",             // Pérdida por daño
    "theft",              // Pérdida por robo
    "expired"             // Pérdida por caducidad
  ]),
  
  // Referencias
  reference_id: model.text().nullable(),   // ID del pedido, traspaso, etc. que originó el movimiento
  reference_type: model.text().nullable(), // "supplier_order", "transfer", "adjustment", etc.
  
  // Producto
  product_id: model.text(),                // ID del producto en MedusaJS
  product_variant_id: model.text().nullable(), // ID de la variante si aplica
  product_title: model.text(),             // Snapshot del título
  
  // Ubicaciones
  from_location_id: model.text().nullable(), // Ubicación origen (si aplica)
  from_location_name: model.text().nullable(),
  to_location_id: model.text().nullable(),   // Ubicación destino (si aplica)
  to_location_name: model.text().nullable(),
  
  // Cantidades
  quantity: model.number(),                // Cantidad del movimiento (positivo o negativo)
  unit_cost: model.number().nullable(),    // Costo unitario (si aplica)
  total_cost: model.number().nullable(),   // Costo total del movimiento
  
  // Información adicional
  reason: model.text().nullable(),         // Razón del movimiento
  notes: model.text().nullable(),
  
  // Auditoría
  performed_by: model.text().nullable(),   // Usuario que realizó el movimiento
  performed_at: model.dateTime(),          // Fecha/hora del movimiento
  
  // Metadata
  metadata: model.json().nullable(),
});

export default InventoryMovement;