import { Migration } from '@mikro-orm/migrations';

export class Migration20250811110520 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" drop constraint if exists "supplier_order_display_id_unique";`);
    this.addSql(`alter table if exists "supplier" drop constraint if exists "supplier_tax_id_unique";`);
    this.addSql(`create table if not exists "inventory_movement" ("id" text not null, "movement_type" text check ("movement_type" in ('supplier_receipt', 'transfer_out', 'transfer_in', 'adjustment', 'sale', 'return', 'damage', 'theft', 'expired')) not null, "reference_id" text null, "reference_type" text null, "product_id" text not null, "product_variant_id" text null, "product_title" text not null, "from_location_id" text null, "from_location_name" text null, "to_location_id" text null, "to_location_name" text null, "quantity" integer not null, "unit_cost" integer null, "total_cost" integer null, "reason" text null, "notes" text null, "performed_by" text null, "performed_at" timestamptz not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "inventory_movement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_inventory_movement_deleted_at" ON "inventory_movement" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier" ("id" text not null, "name" text not null, "legal_name" text not null, "tax_id" text not null, "email" text null, "phone" text null, "website" text null, "address_line_1" text null, "address_line_2" text null, "city" text null, "postal_code" text null, "province" text null, "country_code" text null, "payment_terms" text null, "currency_code" text not null default 'EUR', "discount_percentage" integer null, "is_active" boolean not null default true, "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_tax_id_unique" ON "supplier" (tax_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_supplier" ("id" text not null, "product_id" text not null, "product_variant_id" text null, "supplier_id" text not null, "supplier_sku" text null, "supplier_product_name" text null, "supplier_description" text null, "cost_price" integer null, "currency_code" text not null default 'EUR', "minimum_order_quantity" integer not null default 1, "lead_time_days" integer null, "price_history" jsonb null, "is_preferred_supplier" boolean not null default false, "is_active" boolean not null default true, "is_workshop_consumable" boolean not null default false, "exclude_from_storefront" boolean not null default false, "workshop_category" text null, "last_purchase_date" timestamptz null, "last_price_update" timestamptz null, "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_supplier_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_supplier_supplier_id" ON "product_supplier" (supplier_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_supplier_deleted_at" ON "product_supplier" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_order" ("id" text not null, "display_id" text not null, "supplier_id" text not null, "status" text check ("status" in ('draft', 'pending', 'confirmed', 'shipped', 'partially_received', 'received', 'incident', 'cancelled')) not null default 'draft', "order_date" timestamptz not null, "expected_delivery_date" timestamptz null, "confirmed_at" timestamptz null, "shipped_at" timestamptz null, "received_at" timestamptz null, "currency_code" text not null default 'EUR', "subtotal" integer not null default 0, "tax_total" integer not null default 0, "discount_total" integer not null default 0, "total" integer not null default 0, "destination_location_id" text null, "destination_location_name" text null, "reference" text null, "notes" text null, "internal_notes" text null, "created_by" text null, "received_by" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_order_display_id_unique" ON "supplier_order" (display_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_supplier_id" ON "supplier_order" (supplier_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_deleted_at" ON "supplier_order" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_order_line" ("id" text not null, "supplier_order_id" text not null, "product_id" text null, "product_variant_id" text null, "product_title" text not null, "product_description" text null, "supplier_sku" text null, "supplier_product_name" text null, "quantity_ordered" integer not null, "quantity_received" integer not null default 0, "quantity_pending" integer not null default 0, "unit_price" integer not null, "total_price" integer not null, "received_at" timestamptz null, "received_by" text null, "reception_notes" text null, "line_status" text check ("line_status" in ('pending', 'partial', 'received', 'incident', 'cancelled')) not null default 'pending', "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_order_line_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_line_supplier_order_id" ON "supplier_order_line" (supplier_order_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_line_deleted_at" ON "supplier_order_line" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_supplier" add constraint "product_supplier_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);

    this.addSql(`alter table if exists "supplier_order" add constraint "supplier_order_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);

    this.addSql(`alter table if exists "supplier_order_line" add constraint "supplier_order_line_supplier_order_id_foreign" foreign key ("supplier_order_id") references "supplier_order" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_supplier" drop constraint if exists "product_supplier_supplier_id_foreign";`);

    this.addSql(`alter table if exists "supplier_order" drop constraint if exists "supplier_order_supplier_id_foreign";`);

    this.addSql(`alter table if exists "supplier_order_line" drop constraint if exists "supplier_order_line_supplier_order_id_foreign";`);

    this.addSql(`drop table if exists "inventory_movement" cascade;`);

    this.addSql(`drop table if exists "supplier" cascade;`);

    this.addSql(`drop table if exists "product_supplier" cascade;`);

    this.addSql(`drop table if exists "supplier_order" cascade;`);

    this.addSql(`drop table if exists "supplier_order_line" cascade;`);
  }

}
