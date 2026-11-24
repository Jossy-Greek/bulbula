import type { CollectionConfig } from "payload";
import { canEdit } from "@/lib/access";

/** Photos for listings. Stored in Cloudflare R2 in production (payload.config.ts). */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Directory" },
  access: { read: () => true, create: canEdit, update: canEdit, delete: canEdit },
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumb", width: 160, height: 160, position: "centre" },
      { name: "card", width: 800, height: 1000, position: "centre" },
    ],
    adminThumbnail: "thumb",
  },
  fields: [{ name: "alt", type: "text", localized: true, label: "Description (for screen readers)" }],
};
