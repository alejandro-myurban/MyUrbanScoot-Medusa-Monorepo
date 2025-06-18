import { Migration } from '@mikro-orm/migrations';

export class Migration20250618144655 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "financing_data" ("id" text not null, "name" text not null, "email" text not null, "phone" text not null, "month" text not null, "requested_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "financing_data_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_financing_data_deleted_at" ON "financing_data" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "financing_data" cascade;`);
  }

}
