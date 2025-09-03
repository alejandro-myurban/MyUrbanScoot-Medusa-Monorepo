export type Supplier = {
  id: string;
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  website?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  province: string;
  country_code: string;
  payment_terms: string;
  currency_code: string;
  discount_percentage: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
};

export type SupplierOrder = {
  id: string;
  display_id: string;
  supplier_id: string;
  supplier: Supplier;
  status: string;
  total: number;
  currency_code: string;
  expected_delivery_date?: string;
  created_at: string;
};