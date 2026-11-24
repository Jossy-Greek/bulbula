import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_corrections_status" AS ENUM('open', 'done', 'ignored');
  CREATE TABLE "corrections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_id" integer NOT NULL,
  	"message" varchar NOT NULL,
  	"contact" varchar,
  	"status" "enum_corrections_status" DEFAULT 'open',
  	"visitor" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "visitor" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "corrections_id" integer;
  ALTER TABLE "corrections" ADD CONSTRAINT "corrections_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "corrections_business_idx" ON "corrections" USING btree ("business_id");
  CREATE INDEX "corrections_visitor_idx" ON "corrections" USING btree ("visitor");
  CREATE INDEX "corrections_updated_at_idx" ON "corrections" USING btree ("updated_at");
  CREATE INDEX "corrections_created_at_idx" ON "corrections" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_corrections_fk" FOREIGN KEY ("corrections_id") REFERENCES "public"."corrections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_visitor_idx" ON "businesses" USING btree ("visitor");
  CREATE INDEX "payload_locked_documents_rels_corrections_id_idx" ON "payload_locked_documents_rels" USING btree ("corrections_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "corrections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "corrections" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_corrections_fk";
  
  DROP INDEX "businesses_visitor_idx";
  DROP INDEX "payload_locked_documents_rels_corrections_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "visitor";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "corrections_id";
  DROP TYPE "public"."enum_corrections_status";`)
}
