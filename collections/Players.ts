import type { CollectionConfig } from "payload";

const signedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user);

/**
 * App players who signed in with Google to save their progress (Profile). Written
 * only by app/m/player; nothing here is public. No phone number, email or
 * location: a first name, the app's progress, and points waiting for the app.
 * The app's key and the Google account id are stored only as hashes.
 */
export const Players: CollectionConfig = {
  slug: "players",
  admin: {
    useAsTitle: "name",
    group: "Directory",
    defaultColumns: ["name", "xp", "lastSyncAt", "createdAt"],
    description: "App users who signed in with Google to save their XP and badges. Reviews and places they send earn points when you publish them.",
  },
  defaultSort: "-xp",
  access: {
    read: signedIn,
    create: () => false, // only app/m/player, with overrideAccess
    update: signedIn,
    delete: signedIn,
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", maxLength: 40, admin: { width: "50%" } },
        { name: "xp", type: "number", defaultValue: 0, admin: { width: "25%", readOnly: true } },
        { name: "lastSyncAt", type: "date", admin: { width: "25%", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
      ],
    },
    // sha256 of the app's key; the key itself is only on the player's phone.
    { name: "codeHash", type: "text", required: true, unique: true, index: true, admin: { hidden: true } },
    // The code sealed with the server secret, so Google sign-in can return it (lib/players.ts).
    { name: "codeSealed", type: "text", admin: { hidden: true } },
    // sha256 of the Google account id when the player signed in with Google; never the email.
    { name: "googleHash", type: "text", unique: true, index: true, admin: { hidden: true } },
    { name: "progress", type: "json", admin: { readOnly: true, description: "The app's saved progress (level, badges, streak), as the phone last sent it." } },
    { name: "awards", type: "json", admin: { readOnly: true, description: "Points for published reviews and places, waiting for the app to pick up." } },
    { name: "given", type: "json", admin: { hidden: true } },
    { name: "visitor", type: "text", index: true, admin: { hidden: true } },
  ],
};
