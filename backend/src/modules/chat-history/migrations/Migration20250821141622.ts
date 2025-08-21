import { Migration } from '@mikro-orm/migrations';

export class Migration20250821141622 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "chat_history" add column if not exists "profile_name" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "chat_history" drop column if exists "profile_name";`);
  }

}
