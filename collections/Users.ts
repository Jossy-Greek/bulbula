import type { CollectionConfig } from "payload";

/** Admin accounts. Anyone signed in can manage the menu; only admins manage accounts. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
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
