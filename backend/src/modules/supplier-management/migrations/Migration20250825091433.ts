import { Migration } from '@mikro-orm/migrations';

export class Migration20250825091433 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" add column if not exists "order_type" text not null default 'supplier', add column if not exists "source_location_id" text null, add column if not exists "source_location_name" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" drop column if exists "order_type", drop column if exists "source_location_id", drop column if exists "source_location_name";`);
  }

}
