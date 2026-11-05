import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Opt-in cloud backup of app progress: players (code and Google account as hashes), and
// the player who sent a review or place. Adds a table and nullable columns only.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "players" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"xp" numeric DEFAULT 0,
  	"last_sync_at" timestamp(3) with time zone,
  	"code_hash" varchar NOT NULL,
  	"code_sealed" varchar,
  	"google_hash" varchar,
  	"progress" jsonb,
  	"awards" jsonb,
  	"given" jsonb,
  	"visitor" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "businesses" ADD COLUMN "player_id" integer;
  ALTER TABLE "reviews" ADD COLUMN "player_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "players_id" integer;
  CREATE UNIQUE INDEX "players_code_hash_idx" ON "players" USING btree ("code_hash");
  CREATE UNIQUE INDEX "players_google_hash_idx" ON "players" USING btree ("google_hash");
  CREATE INDEX "players_visitor_idx" ON "players" USING btree ("visitor");
  CREATE INDEX "players_updated_at_idx" ON "players" USING btree ("updated_at");
  CREATE INDEX "players_created_at_idx" ON "players" USING btree ("created_at");
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_players_fk" FOREIGN KEY ("players_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_player_idx" ON "businesses" USING btree ("player_id");
  CREATE INDEX "reviews_player_idx" ON "reviews" USING btree ("player_id");
  CREATE INDEX "payload_locked_documents_rels_players_id_idx" ON "payload_locked_documents_rels" USING btree ("players_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "players" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "players" CASCADE;
  ALTER TABLE "businesses" DROP CONSTRAINT "businesses_player_id_players_id_fk";
  
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_player_id_players_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_players_fk";
  
  DROP INDEX "businesses_player_idx";
  DROP INDEX "reviews_player_idx";
  DROP INDEX "payload_locked_documents_rels_players_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "player_id";
  ALTER TABLE "reviews" DROP COLUMN "player_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "players_id";`)
}
