import { Migration } from '@mikro-orm/migrations';

export class Migration20250805100819 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "status" text not null default 'pending';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "status";`);
  }

}
