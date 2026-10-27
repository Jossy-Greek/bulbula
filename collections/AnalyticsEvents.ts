import type { CollectionConfig } from "payload";

const signedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

/**
 * One row per tracked event, written by /e (app/e/route.ts) with the local API.
 * No cookies and no IP addresses: `visitor` is a hash of IP + browser + a salt
 * that changes every day, so a person counts once per day and can't be followed
 * across days. Read in /admin/analytics; hidden from the admin navigation.
 */
export const AnalyticsEvents: CollectionConfig = {
  slug: "analytics-events",
  admin: { hidden: true, useAsTitle: "path" },
  access: {
    create: () => false, // only the /e route writes, with overrideAccess
    read: signedIn,
    update: () => false,
    delete: signedIn,
  },
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      index: true,
      options: ["pageview", "action", "search", "filter"].map((v) => ({ label: v, value: v })),
    },
    { name: "path", type: "text", index: true },
    { name: "slug", type: "text", index: true, admin: { description: "Business slug, for business pages and actions." } },
    { name: "action", type: "text", admin: { description: "call · directions · maps · website · social · share · telegram · copy · claim" } },
    { name: "query", type: "text", admin: { description: "Search text, or the category slug for a filter." } },
    { name: "results", type: "number" },
    { name: "locale", type: "text" },
    { name: "source", type: "text", admin: { description: "Telegram, Google, Facebook, Direct… (from utm_source or the referrer)." } },
    { name: "device", type: "text" },
    { name: "country", type: "text" },
    { name: "visitor", type: "text", index: true },
  ],
};
