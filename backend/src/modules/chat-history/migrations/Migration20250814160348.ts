import { Migration } from '@mikro-orm/migrations';

export class Migration20250814160348 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "chat_history" add column if not exists "status" text check ("status" in ('IA', 'AGENTE')) not null default 'IA';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "chat_history" drop column if exists "status";`);
  }

}
