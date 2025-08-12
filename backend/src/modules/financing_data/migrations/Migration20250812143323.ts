import { Migration } from '@mikro-orm/migrations';

export class Migration20250812143323 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "freelance_start_date" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "freelance_start_date";`);
  }

}
