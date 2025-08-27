import { model } from "@medusajs/framework/utils";
import SupplierOrder from "./supplier-order";

const Supplier = model.define("supplier", {
  id: model.id().primaryKey(),
  name: model.text(),                    // Nombre comercial
  legal_name: model.text(),              // Razón social
  code: model.text().unique().nullable(), // Código interno del proveedor (TRANSFER, SUP001, etc)
  tax_id: model.text().unique(),         // NIF/CIF/SIF
  email: model.text().nullable(),
  phone: model.text().nullable(),
  website: model.text().nullable(),
  
  // Dirección
  address_line_1: model.text().nullable(),
  address_line_2: model.text().nullable(),
  city: model.text().nullable(),
  postal_code: model.text().nullable(),
  province: model.text().nullable(),
  country_code: model.text().nullable(),
  
  // Información comercial
  supplier_type: model.text().default("standard"), // "standard" | "internal_transfer"
  payment_terms: model.text().nullable(),  // Ejemplo: "30 días", "Al contado"
  currency_code: model.text().default("EUR"),
  discount_percentage: model.number().nullable(), // Descuento general
  
  // Estado y metadata
  is_active: model.boolean().default(true),
  notes: model.text().nullable(),
  metadata: model.json().nullable(),
  
  // Relaciones
  supplier_orders: model.hasMany(() => SupplierOrder, { mappedBy: "supplier" }),
});

export default Supplier;