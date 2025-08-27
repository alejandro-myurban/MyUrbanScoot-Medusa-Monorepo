import { Migration } from '@mikro-orm/migrations';

export class Migration20250825140405 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order_line" add column if not exists "tax_rate" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order_line" drop column if exists "tax_rate";`);
  }

}
