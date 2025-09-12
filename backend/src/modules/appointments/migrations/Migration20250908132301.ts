import { Migration } from '@mikro-orm/migrations';

export class Migration20250908132301 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "appointment" add column if not exists "state" text check ("state" in ('pending', 'confirmed', 'canceled', 'completed')) not null default 'pending', add column if not exists "completed" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "appointment" drop column if exists "state", drop column if exists "completed";`);
  }

}
