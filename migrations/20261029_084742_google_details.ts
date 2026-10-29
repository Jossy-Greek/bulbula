import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_services" AS ENUM('dineIn', 'takeaway', 'delivery', 'reservations', 'appointments', 'outdoorSeating', 'wifi', 'coffee', 'breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'alcohol', 'kids', 'groups', 'toilet', 'wheelchair', 'cards', 'mobilePay', 'freeParking', 'parking', 'womenOwned');
  CREATE TABLE "businesses_services" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_businesses_services",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "price_range" varchar;
  ALTER TABLE "businesses" ADD COLUMN "menu_link" varchar;
  ALTER TABLE "businesses" ADD COLUMN "google_rating" numeric;
  ALTER TABLE "businesses" ADD COLUMN "google_review_count" numeric;
  ALTER TABLE "businesses" ADD COLUMN "google_checked_at" timestamp(3) with time zone;
  ALTER TABLE "businesses_services" ADD CONSTRAINT "businesses_services_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_services_order_idx" ON "businesses_services" USING btree ("order");
  CREATE INDEX "businesses_services_parent_idx" ON "businesses_services" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "businesses_services" CASCADE;
  ALTER TABLE "businesses" DROP COLUMN "price_range";
  ALTER TABLE "businesses" DROP COLUMN "menu_link";
  ALTER TABLE "businesses" DROP COLUMN "google_rating";
  ALTER TABLE "businesses" DROP COLUMN "google_review_count";
  ALTER TABLE "businesses" DROP COLUMN "google_checked_at";
  DROP TYPE "public"."enum_businesses_services";`)
}
