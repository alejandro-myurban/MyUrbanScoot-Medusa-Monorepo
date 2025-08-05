import { Migration } from '@mikro-orm/migrations';

export class Migration20250805105912 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "admin_notes" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "admin_notes";`);
  }

}
