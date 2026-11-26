import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payments_product" AS ENUM('featured', 'offer', 'shoutout', 'sponsor', 'other');
  CREATE TYPE "public"."enum_payments_method" AS ENUM('telebirr', 'cbe', 'cash', 'other');
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_id" integer NOT NULL,
  	"product" "enum_payments_product" DEFAULT 'featured' NOT NULL,
  	"amount" numeric NOT NULL,
  	"method" "enum_payments_method" DEFAULT 'telebirr' NOT NULL,
  	"reference" varchar,
  	"from" timestamp(3) with time zone,
  	"until" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "featured_until" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "offer_until" timestamp(3) with time zone;
  ALTER TABLE "businesses_locales" ADD COLUMN "offer" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payments_id" integer;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payments_business_idx" ON "payments" USING btree ("business_id");
  CREATE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payments_fk";
  
  DROP INDEX "payload_locked_documents_rels_payments_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "featured_until";
  ALTER TABLE "businesses" DROP COLUMN "offer_until";
  ALTER TABLE "businesses_locales" DROP COLUMN "offer";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payments_id";
  DROP TYPE "public"."enum_payments_product";
  DROP TYPE "public"."enum_payments_method";`)
}
