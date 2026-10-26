import type { CollectionConfig } from "payload";

/** Photos for listings. Stored in Vercel Blob in production. */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Directory" },
  access: { read: () => true, create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
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
