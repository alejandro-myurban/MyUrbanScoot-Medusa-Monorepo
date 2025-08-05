import { Migration } from '@mikro-orm/migrations';

export class Migration20250804142310 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "dni_front_verification" jsonb null, add column if not exists "dni_back_verification" jsonb null, add column if not exists "payroll_verification" jsonb null, add column if not exists "bank_verification" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "dni_front_verification", drop column if exists "dni_back_verification", drop column if exists "payroll_verification", drop column if exists "bank_verification";`);
  }

}
