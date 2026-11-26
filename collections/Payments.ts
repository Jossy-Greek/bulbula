import type { CollectionConfig } from "payload";

import { canEdit, canSeePersonal } from "@/lib/access";

/**
 * Money owners paid (Telebirr / CBE transfers checked by hand; see docs/revenue-plan.md).
 * A record is the receipt and the income log. Saving a Featured or Offer payment with an end
 * date switches it on for that place until then (never shortening a longer paid period).
 */
export const Payments: CollectionConfig = {
  slug: "payments",
  admin: {
    group: "Directory",
    useAsTitle: "reference",
    defaultColumns: ["business", "product", "amount", "until", "method", "createdAt"],
    description: "Every payment from an owner. Featured and Offer payments switch the place on until the end date.",
  },
  defaultSort: "-createdAt",
  access: { read: canSeePersonal, create: canEdit, update: canEdit, delete: canEdit },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const field = doc.product === "featured" ? "featuredUntil" : doc.product === "offer" ? "offerUntil" : null;
        if (!field || !doc.until) return;
        const id = typeof doc.business === "object" ? doc.business?.id : doc.business;
        if (!id) return;
        const place = await req.payload.findByID({ collection: "businesses", id, depth: 0, req });
        // Keep the later end date: a second payment never shortens a period already paid for.
        const current = place[field] as string | null | undefined;
        const until = current && new Date(current) > new Date(doc.until) ? current : doc.until;
        if (until === current && (field === "offerUntil" || place.featured)) return;
        await req.payload.update({
          collection: "businesses",
          id,
          req,
          data: field === "featuredUntil" ? { featured: true, featuredUntil: until } : { offerUntil: until },
        });
      },
    ],
  },
  fields: [
    { name: "business", type: "relationship", relationTo: "businesses", required: true, index: true },
    {
      type: "row",
      fields: [
        {
          name: "product",
          type: "select",
          required: true,
          defaultValue: "featured",
          options: [
            { label: "Featured place", value: "featured" },
            { label: "Weekly offer", value: "offer" },
            { label: "Telegram shout-out", value: "shoutout" },
            { label: "Category sponsor", value: "sponsor" },
            { label: "Other", value: "other" },
          ],
          admin: { width: "50%" },
        },
        { name: "amount", type: "number", required: true, min: 0, admin: { width: "50%", description: "Birr." } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "method",
          type: "select",
          required: true,
          defaultValue: "telebirr",
          options: [
            { label: "Telebirr", value: "telebirr" },
            { label: "CBE transfer", value: "cbe" },
            { label: "Cash", value: "cash" },
            { label: "Other", value: "other" },
          ],
          admin: { width: "50%" },
        },
        { name: "reference", type: "text", index: true, admin: { width: "50%", description: "Transaction reference from the SMS or receipt." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "from", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" }, description: "First day it covers." } },
        { name: "until", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" }, description: "Last day it covers." } },
      ],
    },
    { name: "note", type: "textarea", maxLength: 500 },
  ],
};
