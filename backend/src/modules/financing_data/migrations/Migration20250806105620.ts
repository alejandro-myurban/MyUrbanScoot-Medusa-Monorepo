import { Migration } from '@mikro-orm/migrations';

export class Migration20250806105620 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "contacted" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "contacted";`);
  }

}
