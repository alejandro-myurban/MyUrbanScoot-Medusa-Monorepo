import { Migration } from '@mikro-orm/migrations';

export class Migration20250814032459 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "chat_history" ("id" text not null, "user_id" text not null, "message" text not null, "role" text check ("role" in ('user', 'assistant')) not null, "conversation_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_history_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_history_deleted_at" ON "chat_history" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "chat_history" cascade;`);
  }

}
