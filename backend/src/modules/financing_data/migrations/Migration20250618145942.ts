import { Migration } from '@mikro-orm/migrations';

export class Migration20250618145942 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "months" integer not null, add column if not exists "price" integer not null;`);
    this.addSql(`alter table if exists "financing_data" rename column "month" to "product";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "months", drop column if exists "price";`);

    this.addSql(`alter table if exists "financing_data" rename column "product" to "month";`);
  }

}
