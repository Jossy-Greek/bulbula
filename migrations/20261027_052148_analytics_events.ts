import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_analytics_events_type" AS ENUM('pageview', 'action', 'search', 'filter');
  CREATE TABLE "analytics_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_analytics_events_type" NOT NULL,
  	"path" varchar,
  	"slug" varchar,
  	"action" varchar,
  	"query" varchar,
  	"results" numeric,
  	"locale" varchar,
  	"source" varchar,
  	"device" varchar,
  	"country" varchar,
  	"visitor" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_events_id" integer;
  CREATE INDEX "analytics_events_type_idx" ON "analytics_events" USING btree ("type");
  CREATE INDEX "analytics_events_path_idx" ON "analytics_events" USING btree ("path");
  CREATE INDEX "analytics_events_slug_idx" ON "analytics_events" USING btree ("slug");
  CREATE INDEX "analytics_events_visitor_idx" ON "analytics_events" USING btree ("visitor");
  CREATE INDEX "analytics_events_updated_at_idx" ON "analytics_events" USING btree ("updated_at");
  CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk" FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_events_id";
  DROP TYPE "public"."enum_analytics_events_type";`)
}
