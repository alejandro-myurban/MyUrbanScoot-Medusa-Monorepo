import { Migration } from '@mikro-orm/migrations';

export class Migration20250731095715 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" add column if not exists "identity_back_file_id" text not null;`);
    this.addSql(`alter table if exists "financing_data" rename column "identity" to "identity_front_file_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "financing_data" drop column if exists "identity_back_file_id";`);

    this.addSql(`alter table if exists "financing_data" rename column "identity_front_file_id" to "identity";`);
  }

}
