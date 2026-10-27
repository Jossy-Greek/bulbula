import "server-only";
import type { Payload } from "payload";
import type { AnalyticsEvent } from "@/payload-types";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

type Count = { key: string; count: number };
export type DayPoint = { date: string; visitors: number; pageviews: number };
export type BusinessRow = { slug: string; name: string; views: number; calls: number; directions: number; maps: number; other: number };
export type Kpi = { value: number; previous: number };

export type Report = {
  range: Range;
  kpis: { visitors: Kpi; pageviews: Kpi; leads: Kpi; searches: Kpi };
  live: number;
  days: DayPoint[];
  businesses: BusinessRow[];
  pages: Count[];
  sources: Count[];
  devices: Count[];
  locales: Count[];
  searches: Count[];
  emptySearches: Count[];
  filters: Count[];
  actions: Count[];
  total: number;
};

/** Days are counted in Addis Ababa time (UTC+3, no DST). */
const ADDIS_MS = 3 * 60 * 60 * 1000;
const dayKey = (iso: string) => new Date(new Date(iso).getTime() + ADDIS_MS).toISOString().slice(0, 10);

const tally = (items: (string | null | undefined)[], limit = 10): Count[] => {
  const m = new Map<string, number>();
  for (const k of items) if (k) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, limit);
};

/** Distinct visitors: the hash rotates daily, so a visitor is one per day (as Plausible-style counters do). */
const visitorDays = (rows: AnalyticsEvent[]) => new Set(rows.map((r) => `${dayKey(r.createdAt)}|${r.visitor}`)).size;

const LEAD_ACTIONS = new Set(["call", "directions", "maps", "website", "social"]);

export async function buildReport(payload: Payload, range: Range): Promise<Report> {
  const now = Date.now();
  const since = new Date(now - 2 * range * 864e5).toISOString(); // current + previous period, for deltas
  const res = await payload.find({
    collection: "analytics-events",
    where: { createdAt: { greater_than_equal: since } },
    pagination: false,
    limit: 200_000,
    depth: 0,
    sort: "createdAt",
  });
  const all = res.docs as AnalyticsEvent[];
  const cut = now - range * 864e5;
  const cur = all.filter((e) => new Date(e.createdAt).getTime() >= cut);
  const prev = all.filter((e) => new Date(e.createdAt).getTime() < cut);

  const kpis = (rows: AnalyticsEvent[]) => ({
    visitors: visitorDays(rows.filter((r) => r.type === "pageview")),
    pageviews: rows.filter((r) => r.type === "pageview").length,
    leads: rows.filter((r) => r.type === "action" && LEAD_ACTIONS.has(r.action ?? "")).length,
    searches: rows.filter((r) => r.type === "search").length,
  });
  const k = kpis(cur);
  const p = kpis(prev);

  // Daily series, every day present (zeros included) so the line doesn't skip.
  const days: DayPoint[] = [];
  for (let i = range - 1; i >= 0; i--) days.push({ date: dayKey(new Date(now - i * 864e5).toISOString()), visitors: 0, pageviews: 0 });
  const byDay = new Map(days.map((d) => [d.date, d]));
  const seen = new Set<string>();
  for (const e of cur) {
    if (e.type !== "pageview") continue;
    const d = byDay.get(dayKey(e.createdAt));
    if (!d) continue;
    d.pageviews++;
    const v = `${d.date}|${e.visitor}`;
    if (!seen.has(v)) {
      seen.add(v);
      d.visitors++;
    }
  }

  // Per business: page views and what people did.
  const biz = new Map<string, BusinessRow>();
  const row = (slug: string) => {
    let r = biz.get(slug);
    if (!r) biz.set(slug, (r = { slug, name: slug, views: 0, calls: 0, directions: 0, maps: 0, other: 0 }));
    return r;
  };
  for (const e of cur) {
    if (!e.slug) continue;
    if (e.type === "pageview") row(e.slug).views++;
    else if (e.type === "action") {
      const r = row(e.slug);
      if (e.action === "call") r.calls++;
      else if (e.action === "directions") r.directions++;
      else if (e.action === "maps") r.maps++;
      else r.other++;
    }
  }
  const slugs = [...biz.keys()];
  if (slugs.length) {
    const names = await payload.find({ collection: "businesses", where: { slug: { in: slugs } }, limit: slugs.length, depth: 0, locale: "en", select: { name: true, slug: true } });
    for (const b of names.docs) if (b.slug && biz.has(b.slug)) biz.get(b.slug)!.name = b.name;
  }
  const businesses = [...biz.values()]
    .sort((a, b) => b.calls + b.directions + b.maps - (a.calls + a.directions + a.maps) || b.views - a.views)
    .slice(0, 15);

  const pv = cur.filter((e) => e.type === "pageview");
  const searches = cur.filter((e) => e.type === "search");
  const halfHourAgo = now - 30 * 60 * 1000;

  return {
    range,
    kpis: {
      visitors: { value: k.visitors, previous: p.visitors },
      pageviews: { value: k.pageviews, previous: p.pageviews },
      leads: { value: k.leads, previous: p.leads },
      searches: { value: k.searches, previous: p.searches },
    },
    live: new Set(cur.filter((e) => new Date(e.createdAt).getTime() >= halfHourAgo).map((e) => e.visitor)).size,
    days,
    businesses,
    pages: tally(pv.map((e) => e.path?.replace(/^\/(en|am)(?=\/|$)/, "") || "/"), 10),
    sources: tally(pv.map((e) => e.source ?? "Direct"), 8),
    devices: tally(pv.map((e) => e.device), 3),
    locales: tally(pv.map((e) => (e.locale === "am" ? "Amharic" : "English")), 2),
    searches: tally(searches.map((e) => e.query), 10),
    emptySearches: tally(searches.filter((e) => e.results === 0).map((e) => e.query), 10),
    filters: tally(cur.filter((e) => e.type === "filter").map((e) => e.query), 8),
    actions: tally(cur.filter((e) => e.type === "action").map((e) => e.action), 10),
    total: cur.length,
  };
}
