import type { CollectionConfig } from "payload";
import { revalidateDirectory } from "@/lib/revalidate";

const signedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

/**
 * A visitor's star rating and comment on one place. Written only by the
 * submitReview server action (app/(frontend)/[locale]/b/[slug]/actions.ts),
 * always as `pending`; an admin approves it on the dashboard before anyone
 * sees it. No accounts and no IP addresses: `visitor` is the same daily-rotating
 * hash the analytics use, kept only to stop repeat reviews from one person.
 */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    useAsTitle: "author",
    group: "Directory",
    defaultColumns: ["author", "business", "rating", "status", "createdAt"],
    listSearchableFields: ["author", "text"],
  },
  defaultSort: "-createdAt",
  access: {
    read: ({ req }) => (req.user ? true : { status: { equals: "published" } }),
    create: () => false, // only the server action writes, with overrideAccess
    update: signedIn,
    delete: signedIn,
  },
  hooks: {
    afterChange: [() => revalidateDirectory()],
    afterDelete: [() => revalidateDirectory()],
  },
  fields: [
    { name: "business", type: "relationship", relationTo: "businesses", required: true, index: true },
    {
      type: "row",
      fields: [
        { name: "rating", type: "number", required: true, min: 1, max: 5, admin: { width: "25%", components: { Cell: "/components/admin/cells/RatingCell" } } },
        { name: "author", type: "text", required: true, maxLength: 60, admin: { width: "45%", description: "First name, as the visitor typed it." } },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "pending",
          index: true,
          options: [
            { label: "Waiting for approval", value: "pending" },
            { label: "Published", value: "published" },
            { label: "Rejected", value: "rejected" },
          ],
          admin: { width: "30%", components: { Cell: "/components/admin/cells/StatusCell" } },
        },
      ],
    },
    { name: "text", type: "textarea", maxLength: 1000 },
    { name: "locale", type: "text", admin: { readOnly: true, position: "sidebar", description: "Site language the review was written from." } },
    { name: "visitor", type: "text", index: true, access: { read: signedIn }, admin: { readOnly: true, position: "sidebar", description: "Daily-rotating hash; not a person's identity." } },
  ],
};
