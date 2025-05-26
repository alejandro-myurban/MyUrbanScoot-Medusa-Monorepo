import { Migration } from '@mikro-orm/migrations';

export class Migration20250526100139 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "post" add column if not exists "image" text null, add column if not exists "extract" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "post" drop column if exists "image", drop column if exists "extract";`);
  }

}
