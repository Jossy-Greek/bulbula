import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "businesses_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"name_am" varchar,
  	"price" numeric
  );
  
  CREATE TABLE "businesses_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "menu_source" varchar;
  ALTER TABLE "businesses" ADD COLUMN "google_stars" jsonb;
  ALTER TABLE "businesses" ADD COLUMN "google_topics" jsonb;
  ALTER TABLE "businesses_menu_items" ADD CONSTRAINT "businesses_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_menu" ADD CONSTRAINT "businesses_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_menu_items_order_idx" ON "businesses_menu_items" USING btree ("_order");
  CREATE INDEX "businesses_menu_items_parent_id_idx" ON "businesses_menu_items" USING btree ("_parent_id");
  CREATE INDEX "businesses_menu_order_idx" ON "businesses_menu" USING btree ("_order");
  CREATE INDEX "businesses_menu_parent_id_idx" ON "businesses_menu" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "businesses_menu_items" CASCADE;
  DROP TABLE "businesses_menu" CASCADE;
  ALTER TABLE "businesses" DROP COLUMN "menu_source";
  ALTER TABLE "businesses" DROP COLUMN "google_stars";
  ALTER TABLE "businesses" DROP COLUMN "google_topics";`)
}
