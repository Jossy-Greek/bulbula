/**
 * Fills the LOCAL SQLite copy with 30 days of made-up analytics events, to see
 * /admin/analytics with some shape. Refuses to run against Neon.
 *
 *   BULBULA_LOCAL_DB=1 npx payload run scripts/demo-analytics.ts
 */
import { getPayload } from "payload";
import config from "@payload-config";

if (process.env.BULBULA_LOCAL_DB !== "1") throw new Error("Demo data is for the local SQLite copy only: set BULBULA_LOCAL_DB=1.");

const payload = await getPayload({ config });
const biz = (await payload.find({ collection: "businesses", where: { status: { equals: "published" } }, limit: 40, depth: 0, select: { slug: true } })).docs;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const SOURCES = ["Telegram", "Telegram", "Telegram", "Direct", "Direct", "Google", "Facebook"];
const SEARCHES: [string, number][] = [["pharmacy", 13], ["cafe", 25], ["bank", 11], ["bakery", 14], ["car wash", 0], ["tukiya", 2], ["gym", 8], ["hotel", 1], ["printing", 0], ["dentist", 2]];

let n = 0;
for (let d = 29; d >= 0; d--) {
  const visitors = Math.round(8 + (29 - d) * 1.4 + Math.random() * 10 + (d < 5 ? 25 : 0));
  for (let v = 0; v < visitors; v++) {
    const visitor = `demo${d}-${v}`;
    const source = pick(SOURCES);
    const device = Math.random() < 0.82 ? "mobile" : "desktop";
    const locale = Math.random() < 0.7 ? "en" : "am";
    const at = (m: number) => new Date(Date.now() - d * 864e5 - m * 60_000).toISOString();
    const ev = async (data: Record<string, unknown>, m: number) => {
      await payload.create({ collection: "analytics-events", overrideAccess: true, data: { visitor, source, device, locale, ...data, createdAt: at(m) } as never });
      n++;
    };
    await ev({ type: "pageview", path: `/${locale}` }, 30);
    if (Math.random() < 0.6) await ev({ type: "pageview", path: `/${locale}/businesses` }, 28);
    if (Math.random() < 0.35) {
      const [q, r] = pick(SEARCHES);
      await ev({ type: "search", query: q, results: r, path: `/${locale}/businesses` }, 27);
    }
    if (Math.random() < 0.55) {
      const slug = pick(biz).slug!;
      await ev({ type: "pageview", path: `/${locale}/b/${slug}`, slug }, 25);
      if (Math.random() < 0.5) await ev({ type: "action", action: pick(["call", "directions", "maps", "maps", "share"]), slug, path: `/${locale}/b/${slug}` }, 24);
    }
  }
}
payload.logger.info(`Demo analytics: ${n} events.`);
process.exit(0);
