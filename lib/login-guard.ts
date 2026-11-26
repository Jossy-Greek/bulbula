import { APIError } from "payload";
import type { CollectionAfterLoginHook, CollectionBeforeOperationHook, PayloadRequest } from "payload";
import { notifyAdmin } from "./notify";

/**
 * Sign-in attempts per IP address, on top of Payload's own lock per account
 * (5 wrong passwords lock that account for 10 minutes). This stops one address
 * from trying many accounts, or from keeping the real admin locked out.
 *
 * Kept in memory, so it counts per server instance: a cheap first line, not a
 * guarantee. A successful sign-in clears the address.
 */
const WINDOW = 15 * 60_000;
const MAX_TRIES = 20;
const tries = new Map<string, { count: number; since: number; told: boolean }>();

function ipOf(req: PayloadRequest) {
  const h = req.headers;
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const limitLogins: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "login") return args;
  const ip = ipOf(req);
  const now = Date.now();
  // Forget old windows now and then, so the map can't grow without end.
  if (tries.size > 5000) for (const [k, v] of tries) if (now - v.since > WINDOW) tries.delete(k);
  let t = tries.get(ip);
  if (!t || now - t.since > WINDOW) t = { count: 0, since: now, told: false };
  t.count += 1;
  tries.set(ip, t);
  if (t.count > MAX_TRIES) {
    if (!t.told) {
      t.told = true;
      await notifyAdmin(`⚠️ Bulbula admin: ${t.count} sign-in attempts from one address in 15 minutes. It is blocked for now. If this wasn't you, check the staff accounts and their passwords.`);
    }
    throw new APIError("Too many sign-in attempts. Try again in 15 minutes.", 429, null, true);
  }
  return args;
};

export const clearLogins: CollectionAfterLoginHook = ({ req, user }) => {
  tries.delete(ipOf(req));
  return user;
};
