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
  ],
};
