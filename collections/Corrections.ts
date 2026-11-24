import type { CollectionConfig } from "payload";

const signedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

/**
 * "Suggest a correction" from a place page: a visitor's note for the admin, who edits the
 * listing and marks it done. Not public; only the server action writes (with overrideAccess).
 */
export const Corrections: CollectionConfig = {
  slug: "corrections",
  admin: { group: "Directory", useAsTitle: "message", defaultColumns: ["message", "business", "status", "createdAt"] },
  defaultSort: "-createdAt",
  access: { read: signedIn, create: () => false, update: signedIn, delete: signedIn },
  fields: [
    { name: "business", type: "relationship", relationTo: "businesses", required: true, index: true },
    { name: "message", type: "textarea", required: true, maxLength: 1000 },
    { name: "contact", type: "text", maxLength: 120, admin: { description: "Phone or Telegram the visitor gave, if any." } },
    {
      name: "status",
      type: "select",
      defaultValue: "open",
      options: [
        { label: "Open", value: "open" },
        { label: "Done", value: "done" },
        { label: "Ignored", value: "ignored" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "visitor", type: "text", index: true, admin: { readOnly: true, position: "sidebar", description: "Daily-rotating hash, for the 5-a-day limit; not a person's identity." } },
  ],
};
