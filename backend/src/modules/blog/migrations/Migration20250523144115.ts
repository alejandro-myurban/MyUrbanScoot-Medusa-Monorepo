import { Migration } from "@mikro-orm/migrations";

export class Migration20250523144115 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "post" drop constraint if exists "post_slug_unique";`
    );

    this.addSql(
      `create table if not exists "blog_category" ("id" text not null, "name" text not null, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_category_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_blog_category_deleted_at" ON "blog_category" (deleted_at) WHERE deleted_at IS NULL;`
    );

    // CAMBIO AQUÍ: category_id sigue siendo text para coincidir con blog_category.id
    this.addSql(
      `create table if not exists "post" ("id" text not null, "author_name" text not null, "title" text not null, "slug" text not null, "published_at" timestamptz not null, "content" text not null, "status" text check ("status" in ('draft', 'private', 'published')) not null, "category_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "post_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_post_slug_unique" ON "post" (slug) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_post_category_id" ON "post" (category_id) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_post_deleted_at" ON "post" (deleted_at) WHERE deleted_at IS NULL;`
    );

    this.addSql(
      `create table if not exists "comment" ("id" text not null, "post_id" text not null, "author_name" text not null, "content" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comment_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_comment_post_id" ON "comment" (post_id) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_comment_deleted_at" ON "comment" (deleted_at) WHERE deleted_at IS NULL;`
    );

    // Ahora estas claves foráneas funcionarán correctamente
    this.addSql(
      `alter table if exists "post" add constraint "post_category_id_foreign" foreign key ("category_id") references "blog_category" ("id") on update cascade;`
    );

    this.addSql(
      `alter table if exists "comment" add constraint "comment_post_id_foreign" foreign key ("post_id") references "post" ("id") on update cascade;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "post" drop constraint if exists "post_category_id_foreign";`
    );

    this.addSql(
      `alter table if exists "comment" drop constraint if exists "comment_post_id_foreign";`
    );

    this.addSql(`drop table if exists "blog_category" cascade;`);

    this.addSql(`drop table if exists "post" cascade;`);

    this.addSql(`drop table if exists "comment" cascade;`);
  }
}
