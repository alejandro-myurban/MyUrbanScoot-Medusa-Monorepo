import { Migration } from '@mikro-orm/migrations';

export class Migration20250825100643 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier" drop constraint if exists "supplier_code_unique";`);
    this.addSql(`alter table if exists "supplier" add column if not exists "code" text null, add column if not exists "supplier_type" text not null default 'standard';`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_code_unique" ON "supplier" (code) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_supplier_code_unique";`);
    this.addSql(`alter table if exists "supplier" drop column if exists "code", drop column if exists "supplier_type";`);
  }

}
