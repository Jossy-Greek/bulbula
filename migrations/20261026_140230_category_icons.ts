import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_categories_icon" ADD VALUE 'stethoscope';
  ALTER TYPE "public"."enum_categories_icon" ADD VALUE 'dumbbell';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "categories" ALTER COLUMN "icon" SET DEFAULT 'store'::text;
  DROP TYPE "public"."enum_categories_icon";
  CREATE TYPE "public"."enum_categories_icon" AS ENUM('coffee', 'croissant', 'shopping-cart', 'pill', 'heart-pulse', 'landmark', 'bed', 'home', 'graduation-cap', 'wrench', 'scissors', 'church', 'shield', 'hand-heart', 'store');
  ALTER TABLE "categories" ALTER COLUMN "icon" SET DEFAULT 'store'::"public"."enum_categories_icon";
  ALTER TABLE "categories" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_categories_icon" USING "icon"::"public"."enum_categories_icon";`)
}
