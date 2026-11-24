import { serviceKeys, services } from "@/data/services";
import { canEdit, canSeePersonal } from "@/lib/access";
import type { CollectionConfig, FieldAccess } from "payload";
import { AWARD_XP, grant } from "@/lib/players";
import { revalidateDirectory } from "@/lib/revalidate";

/** Personal details (who sent a place, from where): not for the read-only reviewer role. */
const personal: FieldAccess = ({ req }) => canSeePersonal({ req });

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60);
}

/**
 * A business or community place. Visitors only ever see `published` entries;
 * submissions from the public form arrive as `pending` (see app/(frontend)/[locale]/add/actions.ts).
 * The submitter's details are readable only by signed-in admins.
 */
export const Businesses: CollectionConfig = {
  slug: "businesses",
  admin: {
    useAsTitle: "name",
    group: "Directory",
    defaultColumns: ["name", "category", "status", "source", "claimed", "updatedAt"],
    listSearchableFields: ["name", "slug", "phone"],
  },
  defaultSort: "-updatedAt",
  access: {
    // The site reads published ones through the local API; anonymous REST and GraphQL get
    // nothing (the apps use directory.json; their admin screens sign in).
    read: ({ req }) => (req.user ? true : req.payloadAPI === "local" ? { status: { equals: "published" } } : false),
    create: canEdit,
    update: canEdit,
    delete: canEdit,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (!data) return data;
        // A stable slug from the English name, made once.
        if (!data.slug && !originalDoc?.slug && typeof data.name === "string" && data.name) {
          data.slug = `${slugify(data.name) || "place"}-${Math.random().toString(36).slice(2, 6)}`;
        }
        return data;
      },
    ],
    afterChange: [
      () => revalidateDirectory(),
      // A backed-up app player who added this place gets their points when it's published.
      async ({ doc, previousDoc, req }) => {
        if (doc.status !== "published" || previousDoc?.status === "published" || !doc.player) return;
        await grant(req, doc.player, { id: `place-${doc.id}`, kind: "place", xp: AWARD_XP.place, place: doc.name ?? undefined });
      },
    ],
    afterDelete: [() => revalidateDirectory()],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, localized: true, admin: { width: "60%" } },
        { name: "category", type: "relationship", relationTo: "categories", required: true, admin: { width: "40%" } },
      ],
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "The owner's own words. Leave empty to show a summary built from the details below." },
    },
    {
      type: "collapsible",
      label: "Where",
      fields: [
        {
          name: "landmark",
          type: "text",
          localized: true,
          admin: { description: "How locals describe it, e.g. “near 93 Mazoriya”." },
        },
        { name: "address", type: "text", localized: true },
        {
          type: "row",
          fields: [
            { name: "lat", type: "number", admin: { width: "50%", step: 0.000001 } },
            { name: "lng", type: "number", admin: { width: "50%", step: 0.000001 } },
          ],
        },
        { name: "mapsLink", type: "text", admin: { description: "Google Maps link sent by the owner, if any." } },
      ],
    },
    {
      type: "collapsible",
      label: "Contact",
      fields: [
        {
          type: "row",
          fields: [
            { name: "phone", type: "text", admin: { width: "50%" } },
            { name: "phone2", type: "text", admin: { width: "50%" } },
          ],
        },
        { name: "website", type: "text" },
        {
          type: "row",
          fields: [
            { name: "facebook", type: "text", admin: { width: "33%" } },
            { name: "instagram", type: "text", admin: { width: "33%" } },
            { name: "telegram", type: "text", admin: { width: "33%" } },
          ],
        },
        { name: "hours", type: "text", localized: true, admin: { description: "e.g. Mon–Sat 08:00–18:00" } },
      ],
    },
    {
      type: "collapsible",
      label: "Services, prices and menu",
      fields: [
        {
          name: "services",
          type: "select",
          hasMany: true,
          options: serviceKeys.map((k) => ({ label: services[k].en, value: k })),
        },
        {
          type: "row",
          fields: [
            { name: "priceRange", type: "text", admin: { width: "50%", description: "Per person, e.g. ETB 200–400" } },
            { name: "menuLink", type: "text", admin: { width: "50%", description: "The business's own online menu, if any." } },
          ],
        },
        {
          name: "showMenu",
          type: "checkbox",
          defaultValue: true,
          label: "Show menu on the site",
          admin: { description: "Untick to hide the menu from the business page without deleting it." },
        },
        {
          name: "menu",
          type: "array",
          labels: { singular: "Menu section", plural: "Menu sections" },
          admin: { description: "Typed from the menu (a photo on Google Maps, or from the owner). Prices in birr.", initCollapsed: true },
          fields: [
            { name: "title", type: "text", required: true, admin: { description: "e.g. Breakfast / ቁርስ" } },
            {
              name: "items",
              type: "array",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "name", type: "text", required: true, admin: { width: "40%" } },
                    { name: "nameAm", type: "text", admin: { width: "40%" } },
                    { name: "price", type: "number", min: 0, admin: { width: "20%" } },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "menuSource",
          type: "text",
          admin: { description: "Where and when the menu is from, e.g. “Google Maps photo, Dec 2023”. Shown under the menu." },
        },
      ],
    },
    {
      // "Add your business" from one visitor is capped per day (actions.ts).
      name: "visitor",
      type: "text",
      index: true,
      access: { read: personal },
      admin: { readOnly: true, position: "sidebar", description: "Daily-rotating hash of who sent it; not a person's identity." },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      admin: { description: "The main photo: the place itself, its front or inside, so people know it when they arrive." },
    },
    {
      // Shown below the main photo, on the website and in the apps.
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      maxRows: 12,
      label: "More photos",
      admin: { description: "Food, drinks, rooms, products: shown in a row below the main photo." },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending review", value: "pending" },
        { label: "Published", value: "published" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: { position: "sidebar", components: { Cell: "/components/admin/cells/StatusCell" } },
    },
    {
      name: "claimed",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "The business has confirmed this listing.",
        components: { Cell: "/components/admin/cells/ClaimedCell" },
      },
    },
    {
      name: "unconfirmed",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Published from research (Google Maps etc.) without a call or visit. The site shows “Not yet confirmed”. Untick once checked.",
      },
    },
    { name: "featured", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    // A copy of the Google Maps rating, refreshed by scripts/import-google-details.ts.
    { name: "googleRating", type: "number", min: 1, max: 5, admin: { position: "sidebar", step: 0.1 } },
    { name: "googleReviewCount", type: "number", min: 0, admin: { position: "sidebar" } },
    // Machine-read from Google Maps' Reviews tab: [1★ … 5★] counts and the topics Google lists.
    { name: "googleStars", type: "json", admin: { position: "sidebar", readOnly: true } },
    { name: "googleTopics", type: "json", admin: { position: "sidebar", readOnly: true } },
    { name: "googleCheckedAt", type: "date", admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" }, description: "When phone, hours, services and rating were last copied from Google Maps." } },
    {
      name: "source",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "OpenStreetMap", value: "osm" },
        { label: "Owner submission", value: "owner" },
        { label: "Added by admin", value: "admin" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "osmId", type: "text", admin: { position: "sidebar", description: "e.g. n12345 / w678" } },
    {
      name: "player",
      type: "relationship",
      relationTo: "players",
      index: true,
      access: { read: personal },
      admin: { readOnly: true, position: "sidebar", description: "Added from the app by a player with cloud backup; publishing gives them points." },
    },
    {
      name: "claims",
      type: "relationship",
      relationTo: "businesses",
      admin: { position: "sidebar", description: "This submission claims an existing listing — merge it, then reject this one." },
    },
    { name: "slug", type: "text", unique: true, index: true, admin: { position: "sidebar" } },
    {
      type: "collapsible",
      label: "Submitted by (private)",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "submitter",
          type: "group",
          access: { read: personal, update: personal },
          fields: [
            { name: "name", type: "text" },
            { name: "phone", type: "text" },
            {
              name: "relationship",
              type: "select",
              options: [
                { label: "Owner", value: "owner" },
                { label: "Manager / staff", value: "manager" },
                { label: "Customer", value: "customer" },
              ],
            },
          ],
        },
        { name: "adminNotes", type: "textarea", access: { read: personal, update: personal } },
      ],
    },
  ],
};
