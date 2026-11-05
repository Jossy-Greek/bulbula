import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { dailyVisitor } from "@/lib/visitor";
import { type Award, findPlayer, googleAccount, hashCode, hashGoogle, newCode, sealCode, unsealCode } from "@/lib/players";

/**
 * The apps' progress, saved for players who signed in with Google.
 *
 *   { action: "google",  idToken, name, progress, code?, restoreOnly? } (below)
 *   { action: "sync",    code, name, progress, ack } → { ok, awards }
 *   { action: "delete",  code }                     → { ok }
 *
 * `code` is the player's key: the site makes it at the first Google sign-in and hands it
 * back on every later one; the app keeps it and never shows it.
 *   { action: "google",  idToken, name, progress, code?, restoreOnly? }
 *        → { ok, code, existing, name?, progress? }
 *
 * "google" finds the player linked to that Google account (existing: true, with their
 * saved progress); otherwise links the player named by `code`, or starts a new one.
 * With restoreOnly it never creates one (error "none").
 * `progress` is the app's own JSON (level, badges, streak…); the server stores it
 * as sent. `awards` are points for reviews and places an admin has published since;
 * the app sends their ids back in `ack` once it has added them.
 */
const NEW_PER_DAY = 5;
const MAX_PROGRESS = 50_000;

type Body = { action?: string; code?: string; name?: string; progress?: unknown; ack?: unknown; idToken?: unknown; restoreOnly?: boolean };

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_PROGRESS) return fail("too_large", 413);
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return fail("failed");
  }
  const payload = await getPayload({ config });
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : undefined;
  const progress = body.progress && typeof body.progress === "object" ? body.progress : undefined;
  const xp = progress && typeof (progress as { xp?: unknown }).xp === "number" ? Math.max(0, Math.round((progress as { xp: number }).xp)) : undefined;

  // A handful of new players a day from one phone/network, so nobody fills the table.
  const create = async (google: string) => {
    const visitor = dailyVisitor(await headers());
    const today = await payload.count({
      collection: "players",
      overrideAccess: true,
      where: { and: [{ visitor: { equals: visitor } }, { createdAt: { greater_than: new Date(Date.now() - 86_400_000).toISOString() } }] },
    });
    if (today.totalDocs >= NEW_PER_DAY) return null;
    const code = newCode();
    await payload.create({
      collection: "players",
      overrideAccess: true,
      data: {
        codeHash: hashCode(code)!,
        codeSealed: sealCode(code),
        googleHash: google,
        name,
        progress: progress as Record<string, unknown>,
        xp: xp ?? 0,
        visitor,
        lastSyncAt: new Date().toISOString(),
        awards: [],
        given: [],
      },
    });
    return code;
  };

  try {
    if (body.action === "google") {
      const sub = await googleAccount(body.idToken);
      if (!sub) return fail("google", 401);
      const google = hashGoogle(sub);
      const found = await payload.find({ collection: "players", where: { googleHash: { equals: google } }, limit: 1, depth: 0, overrideAccess: true });
      const linked = found.docs[0];
      if (linked) {
        const code = unsealCode(linked.codeSealed);
        if (!code) return fail("failed", 500);
        return Response.json({ ok: true, existing: true, code, name: linked.name ?? "", progress: linked.progress ?? null });
      }
      if (body.restoreOnly) return fail("none", 404);
      // Backup already on with a code: link this Google account to it.
      const current = body.code ? await findPlayer(payload, body.code) : null;
      if (body.code && !current) return fail("unknown", 404);
      if (current) {
        await payload.update({ collection: "players", id: current.id, overrideAccess: true, data: { googleHash: google } });
        return Response.json({ ok: true, existing: false, code: body.code });
      }
      const code = await create(google);
      return code ? Response.json({ ok: true, existing: false, code }) : fail("limit", 429);
    }

    const player = await findPlayer(payload, body.code);
    if (!player) return fail("unknown", 404);

    if (body.action === "delete") {
      // Reviews and places they sent stay; only the link to the player goes (on delete set null).
      await payload.delete({ collection: "players", id: player.id, overrideAccess: true });
      return Response.json({ ok: true });
    }

    if (body.action === "sync") {
      const ack = new Set(Array.isArray(body.ack) ? body.ack.filter((a): a is string => typeof a === "string") : []);
      const waiting = ((Array.isArray(player.awards) ? player.awards : []) as Award[]).filter((a) => !ack.has(a.id));
      await payload.update({
        collection: "players",
        id: player.id,
        overrideAccess: true,
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(progress ? { progress: progress as Record<string, unknown> } : {}),
          ...(xp !== undefined ? { xp } : {}),
          awards: waiting,
          lastSyncAt: new Date().toISOString(),
        },
      });
      return Response.json({ ok: true, awards: waiting, google: Boolean(player.googleHash) });
    }
    return fail("failed");
  } catch (e) {
    console.error("player", body.action, e);
    return fail("failed", 500);
  }
}
