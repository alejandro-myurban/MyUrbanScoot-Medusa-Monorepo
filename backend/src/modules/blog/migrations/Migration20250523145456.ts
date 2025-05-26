import { Migration } from '@mikro-orm/migrations';

export class Migration20250523145456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "blog_category" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table if exists "blog_category" alter column "id" drop default;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "blog_category" alter column "id" type integer using ("id"::integer);`);
    this.addSql(`create sequence if not exists "blog_category_id_seq";`);
    this.addSql(`select setval('blog_category_id_seq', (select max("id") from "blog_category"));`);
    this.addSql(`alter table if exists "blog_category" alter column "id" set default nextval('blog_category_id_seq');`);
  }

}
