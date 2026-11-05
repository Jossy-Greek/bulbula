import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Payload, PayloadRequest } from "payload";

/**
 * App players who signed in with Google to save their progress. Each has a key
 * (like BUL-7KQ2X-9P4MD) that the app keeps and sends with every sync, never shown to
 * the player. The server keeps a hash of it to look it up, and the key sealed with the
 * server secret so that signing in with Google on another phone hands the same one back.
 */

// No 0/O, 1/I/L: the code is read off a screen and typed on another phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newCode() {
  const part = () => Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `BUL-${part()}-${part()}`;
}

/** "bul-7kq2x 9p4md" and "BUL-7KQ2X-9P4MD" are the same code. */
export function hashCode(code: string) {
  const plain = code.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^BUL/, "");
  if (plain.length !== 10) return null;
  return createHash("sha256").update(`player|${process.env.PAYLOAD_SECRET ?? ""}|${plain}`).digest("hex");
}

export async function findPlayer(payload: Payload, code: unknown, req?: PayloadRequest) {
  const hash = typeof code === "string" ? hashCode(code) : null;
  if (!hash) return null;
  const found = await payload.find({ collection: "players", where: { codeHash: { equals: hash } }, limit: 1, depth: 0, overrideAccess: true, req });
  return found.docs[0] ?? null;
}

/** Points the app picks up on its next sync. [id] makes the same approval count once. */
export type Award = { id: string; kind: "review" | "place"; xp: number; place?: string };

export const AWARD_XP = { review: 30, place: 50 } as const;

/** Called when an admin publishes a review or place that a backed-up player sent. */
export async function grant(req: PayloadRequest, player: number | { id: number } | null | undefined, award: Award) {
  const id = typeof player === "object" && player ? player.id : player;
  if (!id) return;
  const doc = await req.payload.findByID({ collection: "players", id, depth: 0, overrideAccess: true, req, disableErrors: true });
  if (!doc) return;
  const awards = (Array.isArray(doc.awards) ? doc.awards : []) as Award[];
  const given = (Array.isArray(doc.given) ? doc.given : []) as string[];
  if (given.includes(award.id)) return;
  await req.payload.update({
    collection: "players",
    id,
    overrideAccess: true,
    req,
    data: { awards: [...awards, award], given: [...given, award.id].slice(-500) },
  });
}

// The code, encrypted with a key derived from PAYLOAD_SECRET (AES-256-GCM).
const sealKey = () => createHash("sha256").update(`player-seal|${process.env.PAYLOAD_SECRET ?? ""}`).digest();

export function sealCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(), iv);
  const data = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function unsealCode(sealed: unknown) {
  if (typeof sealed !== "string") return null;
  try {
    const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", sealKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * The Firebase project's Web client ID (project bulbula-89af3). Not a secret: it names the
 * app the Google sign-in is for, and is also built into the Android app.
 */
export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? "1078066225776-o3tlngthodb34h2uhis4r4ep6j5qf33k.apps.googleusercontent.com";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** The Google account id ("sub") in a sign-in token from the app, or null if the token isn't valid for us. */
export async function googleAccount(idToken: unknown) {
  if (typeof idToken !== "string" || idToken.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: GOOGLE_CLIENT_ID,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Only a hash of the Google id is kept: no email, name or photo. */
export const hashGoogle = (sub: string) => createHash("sha256").update(`google|${process.env.PAYLOAD_SECRET ?? ""}|${sub}`).digest("hex");
