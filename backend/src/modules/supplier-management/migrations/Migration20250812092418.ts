import { Migration } from '@mikro-orm/migrations';

export class Migration20250812092418 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" drop constraint if exists "supplier_order_status_check";`);

    this.addSql(`alter table if exists "supplier_order" alter column "status" type text using ("status"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" add constraint "supplier_order_status_check" check("status" in ('draft', 'pending', 'confirmed', 'shipped', 'partially_received', 'received', 'incident', 'cancelled'));`);
  }

}
