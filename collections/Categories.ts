import type { CollectionConfig } from "payload";
import { revalidateDirectory } from "@/lib/revalidate";

/** Directory sections. `group` splits businesses from community places (worship, public services). */
export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { useAsTitle: "name", group: "Directory", defaultColumns: ["name", "group", "order"] },
  defaultSort: "order",
  access: { read: () => true, create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  hooks: { afterChange: [() => revalidateDirectory()], afterDelete: [() => revalidateDirectory()] },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "group",
      type: "select",
      required: true,
      defaultValue: "business",
      options: [
        { label: "Business", value: "business" },
        { label: "Community", value: "community" },
      ],
    },
    {
      name: "icon",
      type: "select",
      required: true,
      defaultValue: "store",
      admin: { description: "Shown on cards and map pins." },
      options: ["coffee", "croissant", "shopping-cart", "pill", "heart-pulse", "landmark", "bed", "home", "graduation-cap", "wrench", "scissors", "church", "shield", "hand-heart", "store", "stethoscope", "dumbbell"].map((v) => ({ label: v, value: v })),
    },
    { name: "order", type: "number", defaultValue: 0, admin: { position: "sidebar" } },
  ],
};
