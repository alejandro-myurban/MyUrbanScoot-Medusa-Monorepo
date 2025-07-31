import { Migration } from '@mikro-orm/migrations';

export class Migration20250730121453 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "name", drop column if exists "phone", drop column if exists "product", drop column if exists "months", drop column if exists "price";`);

    this.addSql(`alter table if exists "financing_data" add column if not exists "identity" text not null, add column if not exists "income" text not null, add column if not exists "paysheet_file_id" text null, add column if not exists "contract_type" text null, add column if not exists "company_position" text null, add column if not exists "company_start_date" timestamptz null, add column if not exists "freelance_rental_file_id" text null, add column if not exists "freelance_quote_file_id" text null, add column if not exists "pensioner_proof_file_id" text null, add column if not exists "bank_account_proof_file_id" text null, add column if not exists "financing_installment_count" text not null, add column if not exists "housing_type" text not null, add column if not exists "housing_type_details" text null, add column if not exists "civil_status" text not null, add column if not exists "marital_status_details" text null, add column if not exists "address" text not null, add column if not exists "postal_code" text not null, add column if not exists "city" text not null, add column if not exists "province" text not null, add column if not exists "phone_mumber" text not null, add column if not exists "doubts" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "identity", drop column if exists "income", drop column if exists "paysheet_file_id", drop column if exists "contract_type", drop column if exists "company_position", drop column if exists "company_start_date", drop column if exists "freelance_rental_file_id", drop column if exists "freelance_quote_file_id", drop column if exists "pensioner_proof_file_id", drop column if exists "bank_account_proof_file_id", drop column if exists "financing_installment_count", drop column if exists "housing_type", drop column if exists "housing_type_details", drop column if exists "civil_status", drop column if exists "marital_status_details", drop column if exists "address", drop column if exists "postal_code", drop column if exists "city", drop column if exists "province", drop column if exists "phone_mumber", drop column if exists "doubts";`);

    this.addSql(`alter table if exists "financing_data" add column if not exists "name" text not null, add column if not exists "phone" text not null, add column if not exists "product" text not null, add column if not exists "months" integer not null, add column if not exists "price" integer not null;`);
  }

}
