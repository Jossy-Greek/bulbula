import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";
import { buildConfig } from "payload";

import { AnalyticsEvents } from "./collections/AnalyticsEvents";
import { Businesses } from "./collections/Businesses";
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Players } from "./collections/Players";
import { Reviews } from "./collections/Reviews";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * BULBULA_LOCAL_DB=1 runs against a throwaway SQLite file (./bulbula-local.db)
 * with uploads on disk, for trying the admin without touching the Neon database
 * the live site uses. Everything else, local `npm run dev` included, uses Neon.
 */
const localDb = process.env.BULBULA_LOCAL_DB === "1";

/**
 * Photos live in Cloudflare R2 when its settings are present (free egress, served from
 * R2_PUBLIC_URL straight to browsers and the apps, not through Vercel). Otherwise they
 * fall back to Vercel Blob, where the first uploads went. R2_PUBLIC_URL is the bucket's
 * public address: its r2.dev URL or a custom domain, without a trailing slash.
 */
const r2 = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
};
const useR2 = !localDb && Object.values(r2).every(Boolean);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    dateFormat: "d MMM yyyy, HH:mm",
    user: Users.slug,
    theme: "light",
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " · Bulbula Directory admin", icons: [{ rel: "icon", url: "/favicon.svg" }] },
    components: {
      graphics: { Logo: "/components/admin/Logo", Icon: "/components/admin/Icon" },
      beforeDashboard: ["/components/admin/DirectoryDashboard"],
      beforeNavLinks: ["/components/admin/NavOverview"],
      afterNavLinks: ["/components/admin/NavFooter"],
      actions: ["/components/admin/WaitingBell"],
      views: {
        analytics: { Component: "/components/admin/AnalyticsView", path: "/analytics" },
      },
    },
  },
  collections: [Businesses, Reviews, Players, Categories, Media, Users, AnalyticsEvents],
  globals: [SiteSettings],
  localization: {
    locales: [
      { code: "en", label: "English" },
      { code: "am", label: "አማርኛ" },
    ],
    defaultLocale: "en",
    // A listing without Amharic text shows the English on /am.
    fallback: true,
  },
  editor: lexicalEditor(),
  db: localDb
    ? sqliteAdapter({ client: { url: "file:./bulbula-local.db" } })
    : postgresAdapter({
        pool: { connectionString: process.env.DATABASE_URL || "" },
        // Local dev shares this database with the live site, so never push schema
        // changes from dev: they go through migrations (`npm run build` runs them).
        push: false,
        migrationDir: path.resolve(dirname, "migrations"),
      }),
  plugins: [
    s3Storage({
      enabled: useR2,
      // The admin's browser sends files straight to R2 (past Vercel's 4.5 MB request limit);
      // the bucket's CORS must allow PUT from the site.
      clientUploads: true,
      bucket: r2.bucket ?? "",
      config: {
        endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
        region: "auto",
        forcePathStyle: true,
        credentials: { accessKeyId: r2.accessKeyId ?? "", secretAccessKey: r2.secretAccessKey ?? "" },
      },
      collections: {
        media: {
          prefix: "media",
          // Public photos: link the bucket directly instead of streaming them through the site.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => [r2.publicUrl, prefix, filename].filter(Boolean).join("/"),
        },
      },
    }),
    vercelBlobStorage({
      enabled: !useR2 && Boolean(process.env.BLOB_READ_WRITE_TOKEN) && !localDb,
      clientUploads: true,
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  sharp,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});
