import { Migration } from '@mikro-orm/migrations';

export class Migration20250826140158 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order_line" add column if not exists "product_thumbnail" text null, add column if not exists "discount_rate" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order_line" drop column if exists "product_thumbnail", drop column if exists "discount_rate";`);
  }

}
