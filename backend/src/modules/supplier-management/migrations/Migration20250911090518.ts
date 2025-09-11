import { Migration } from '@mikro-orm/migrations';

export class Migration20250911090518 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_supplier" add column if not exists "supplier_product_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_supplier" drop column if exists "supplier_product_url";`);
  }

}
