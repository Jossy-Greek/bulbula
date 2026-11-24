/**
 * Who may do what in the admin and its REST API (the app's staff screens use the same rules).
 * Roles (Users.role): admin and staff manage the directory; reviewer is read-only and never sees
 * personal data. The reviewer exists for app-store reviewers, who must be able to open every screen.
 */
type Req = { req: { user?: { role?: string | null } | null } };

/** Signed in with any role: may read the directory's admin views. */
export const signedIn = ({ req }: Req) => Boolean(req.user);

/** May create, change or delete: any signed-in role except reviewer. */
export const canEdit = ({ req }: Req) => Boolean(req.user) && req.user?.role !== "reviewer";

/** May see people's details (submitters' names and phones, contacts, players): not a reviewer. */
export const canSeePersonal = canEdit;
