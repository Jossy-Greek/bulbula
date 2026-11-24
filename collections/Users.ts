import type { CollectionConfig } from "payload";
import { canEdit } from "@/lib/access";

/** Admin accounts. Anyone signed in can manage the menu; only admins manage accounts. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "Settings" },
  access: {
    // A reviewer sees only their own account (not staff emails).
    read: ({ req }) => (req.user?.role === "reviewer" ? { id: { equals: req.user.id } } : Boolean(req.user)),
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req, id }) => req.user?.role === "admin" || (canEdit({ req }) && req.user?.id === id),
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
        { label: "Reviewer — read-only, no personal data (for app-store review)", value: "reviewer" },
      ],
      // Staff cannot promote themselves.
      access: { update: ({ req }) => req.user?.role === "admin" },
    },
  ],
};
