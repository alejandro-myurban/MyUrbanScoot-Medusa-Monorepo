import { Migration } from '@mikro-orm/migrations';

export class Migration20250904124958 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "appointment" drop constraint if exists "appointment_workshop_id_start_time_unique";`);
    this.addSql(`create table if not exists "workshop" ("id" text not null, "name" text not null, "address" text not null, "phone" text not null, "timezone" text null, "opening_hours" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "workshop_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_workshop_deleted_at" ON "workshop" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "appointment" ("id" text not null, "customer_name" text not null, "customer_phone" text not null, "description" text null, "start_time" timestamptz not null, "end_time" timestamptz not null, "workshop_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "appointment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_start_time" ON "appointment" (start_time) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_end_time" ON "appointment" (end_time) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_workshop_id" ON "appointment" (workshop_id) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_deleted_at" ON "appointment" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_appointment_workshop_id_start_time_unique" ON "appointment" (workshop_id, start_time) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "appointment" add constraint "appointment_workshop_id_foreign" foreign key ("workshop_id") references "workshop" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "appointment" drop constraint if exists "appointment_workshop_id_foreign";`);

    this.addSql(`drop table if exists "workshop" cascade;`);

    this.addSql(`drop table if exists "appointment" cascade;`);
  }

}
