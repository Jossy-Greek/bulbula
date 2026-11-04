import type { GlobalConfig } from "payload";
import { revalidateDirectory } from "@/lib/revalidate";

/** Site-wide switches, edited in the admin under Settings. */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: { group: "Settings" },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  hooks: { afterChange: [() => revalidateDirectory()] },
  fields: [
    {
      name: "showMenus",
      type: "checkbox",
      defaultValue: true,
      label: "Show menus on the site",
      admin: {
        description: "Untick to hide every business's menu at once. Each business also has its own switch; a menu shows only when both are on.",
      },
    },
    {
      // The Android app is shared as an APK, so it can't update itself from a store: it reads
      // this from /{locale}/directory.json and offers "Update" when it's older.
      name: "androidApp",
      type: "group",
      label: "Android app",
      admin: { description: "After posting a new APK, set its version here. Phones on an older version see an Update button." },
      fields: [
        {
          name: "latestVersionCode",
          type: "number",
          min: 1,
          label: "Latest version code",
          admin: { description: "versionCode in android/app/build.gradle.kts, e.g. 2." },
        },
        { name: "latestVersionName", type: "text", label: "Latest version name", admin: { description: "What people see, e.g. 1.1." } },
        {
          name: "downloadUrl",
          type: "text",
          label: "Download link",
          admin: { description: "Where the APK is, e.g. the Telegram post: https://t.me/…" },
          validate: (v: unknown) => !v || /^https:\/\/\S+$/.test(String(v)) || "Use a full https:// link",
        },
      ],
    },
  ],
};
