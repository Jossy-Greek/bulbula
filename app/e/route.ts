import { createHash } from "crypto";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * The analytics beacon. Public pages POST small JSON events here
 * (navigator.sendBeacon, so the body arrives as text/plain).
 * Short path, so content blockers that match "analytics"/"collect" leave it alone.
 */

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|telegram|whatsapp|headless|lighthouse|vercel|curl|wget|python|node-fetch|go-http/i;
const TYPES = new Set(["pageview", "action", "search", "filter"]);
const ACTIONS = new Set(["call", "directions", "maps", "website", "social", "share", "telegram", "copy", "claim", "add"]);

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);

function device(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

const SOURCES: [RegExp, string][] = [
  [/(^|\.)t\.me$|telegram/i, "Telegram"],
  [/google\./i, "Google"],
  [/facebook\.|fb\.|messenger/i, "Facebook"],
  [/instagram/i, "Instagram"],
  [/tiktok/i, "TikTok"],
  [/(^|\.)x\.com$|twitter|t\.co$/i, "X"],
  [/linkedin|lnkd/i, "LinkedIn"],
  [/whatsapp|wa\.me/i, "WhatsApp"],
  [/bing\.|duckduckgo|yahoo|yandex/i, "Other search"],
];

function source(utm: string | undefined, ref: string | undefined, ownHost: string) {
  if (utm) {
    const hit = SOURCES.find(([re]) => re.test(utm));
    return hit ? hit[1] : utm.slice(0, 40);
  }
  if (!ref) return "Direct";
  let host = "";
  try {
    host = new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
  if (!host || host === ownHost) return "Direct";
  return SOURCES.find(([re]) => re.test(host))?.[1] ?? host;
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const type = clip(body.type, 20);
  if (!type || !TYPES.has(type)) return new Response(null, { status: 400 });
  const action = clip(body.action, 20);
  if (type === "action" && (!action || !ACTIONS.has(action))) return new Response(null, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "0";
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256")
    .update(`${day}|${process.env.PAYLOAD_SECRET ?? ""}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);
  const ownHost = new URL(req.url).hostname.replace(/^www\./, "");

  const payload = await getPayload({ config });
  await payload.create({
    collection: "analytics-events",
    overrideAccess: true,
    data: {
      type: type as "pageview" | "action" | "search" | "filter",
      path: clip(body.path, 200),
      slug: clip(body.slug, 120),
      action,
      query: clip(body.query, 100)?.trim().toLowerCase(),
      results: typeof body.results === "number" ? Math.max(0, Math.min(10_000, Math.round(body.results))) : undefined,
      locale: clip(body.locale, 5),
      source: source(clip(body.utm, 60), clip(body.ref, 500), ownHost),
      device: device(ua),
      country: req.headers.get("x-vercel-ip-country") ?? undefined,
      visitor,
    },
  });
  return new Response(null, { status: 204 });
}
