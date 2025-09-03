export type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  is_active: boolean;
};

export type SupplierOrderLine = {
  id: string;
  product_id: string;
  product_variant_id?: string;
  product_title: string;
  product_thumbnail?: string;
  supplier_sku?: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_pending: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
  line_status: string;
  received_at?: string;
  received_by?: string;
  reception_notes?: string;
};

export type SupplierOrder = {
  id: string;
  display_id: string;
  supplier_id: string;
  supplier: Supplier;
  order_type: "supplier" | "transfer";
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  confirmed_at?: string;
  shipped_at?: string;
  received_at?: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  destination_location_id?: string;
  destination_location_name?: string;
  source_location_id?: string;
  source_location_name?: string;
  reference?: string;
  created_by?: string;
  received_by?: string;
  notes?: string;
  order_lines?: SupplierOrderLine[];
  created_at: string;
  updated_at: string;
};

export type StockLocation = {
  id: string;
  name: string;
};