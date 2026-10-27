import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";
import { buildConfig } from "payload";

import { AnalyticsEvents } from "./collections/AnalyticsEvents";
import { Businesses } from "./collections/Businesses";
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Reviews } from "./collections/Reviews";
import { Users } from "./collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * BULBULA_LOCAL_DB=1 runs against a throwaway SQLite file (./bulbula-local.db)
 * with uploads on disk, for trying the admin without touching the Neon database
 * the live site uses. Everything else, local `npm run dev` included, uses Neon.
 */
const localDb = process.env.BULBULA_LOCAL_DB === "1";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: Users.slug,
    theme: "light",
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " · Bulbula Directory admin", icons: [{ rel: "icon", url: "/favicon.svg" }] },
    components: {
      graphics: { Logo: "/components/admin/Logo", Icon: "/components/admin/Icon" },
      beforeDashboard: ["/components/admin/DirectoryDashboard"],
      afterNavLinks: ["/components/admin/AnalyticsNavLink"],
      views: {
        analytics: { Component: "/components/admin/AnalyticsView", path: "/analytics" },
      },
    },
  },
  collections: [Businesses, Reviews, Categories, Media, Users, AnalyticsEvents],
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
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) && !localDb,
      clientUploads: true,
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  sharp,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
});
