import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Site settings → Android app: the latest APK, so older copies offer an update.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "android_app_latest_version_code" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "android_app_latest_version_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "android_app_download_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "android_app_latest_version_code";
  ALTER TABLE "site_settings" DROP COLUMN "android_app_latest_version_name";
  ALTER TABLE "site_settings" DROP COLUMN "android_app_download_url";`)
}
