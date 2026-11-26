import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses" ADD COLUMN "stats_key" varchar;
  CREATE UNIQUE INDEX "businesses_stats_key_idx" ON "businesses" USING btree ("stats_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "businesses_stats_key_idx";
  ALTER TABLE "businesses" DROP COLUMN "stats_key";`)
}
