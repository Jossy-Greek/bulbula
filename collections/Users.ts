import type { CollectionConfig } from "payload";
import { clearLogins, limitLogins } from "@/lib/login-guard";

/** Admin accounts. Anyone signed in can manage the menu; only admins manage accounts. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // Payload's defaults, written out: 5 wrong passwords lock the account for 10 minutes.
    maxLoginAttempts: 5,
    lockTime: 10 * 60_000,
    // The session cookie only travels over HTTPS on the live site (local dev is plain http).
    cookies: { secure: process.env.NODE_ENV === "production", sameSite: "Lax" },
  },
  hooks: { beforeOperation: [limitLogins], afterLogin: [clearLogins] },
  admin: { useAsTitle: "email", group: "Settings" },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req, id }) => req.user?.role === "admin" || req.user?.id === id,
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [
        { label: "Admin — menu and accounts", value: "admin" },
        { label: "Staff — menu only", value: "staff" },
      ],
      // Staff cannot promote themselves.
      access: { update: ({ req }) => req.user?.role === "admin" },
    },
  ],
};
