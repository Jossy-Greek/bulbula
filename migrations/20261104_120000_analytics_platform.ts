import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Which app an analytics event came from (web, android, ios). Existing rows stay
// empty and count as web.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics_events" ADD COLUMN "platform" varchar;
  CREATE INDEX "analytics_events_platform_idx" ON "analytics_events" USING btree ("platform");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "analytics_events_platform_idx";
  ALTER TABLE "analytics_events" DROP COLUMN "platform";`)
}
