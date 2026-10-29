/**
 * Adds two things read from Google Maps on 2026-10-29:
 *
 * - From each place's Reviews tab: the reviews per star (1★–5★) and the
 *   topics Google says reviews mention ("hospitality 7"). Review text is not
 *   copied — it belongs to its authors. Always refreshed (a snapshot).
 *   Raw read: scripts/data/google-maps-reviews-2026-10-29.json.
 * - From each place's Menu tab: the menu, typed by hand from the menu photos
 *   (dish names and prices are facts; the photos themselves are not copied).
 *   Only listings without a menu get one, so an owner's menu is never
 *   replaced. scripts/data/google-maps-menus-2026-10-29.json.
 *
 *   DRY_RUN=1 npx payload run scripts/import-google-menus-reviews.ts
 *   npx payload run scripts/import-google-menus-reviews.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Business } from "@/payload-types";

type ReviewRead = { name?: string; stars?: Record<string, number>; topics?: [string, number][]; menuPhotos?: number; error?: string };
type MenuRead = { source: string; sections: { title: string; items: { name: string; nameAm: string | null; price: number | null }[] }[] };

const REVIEWS = "scripts/data/google-maps-reviews-2026-10-29.json";
const MENUS = "scripts/data/google-maps-menus-2026-10-29.json";
const TOPICS = 10;

const read = <T,>(f: string): Record<string, T> => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {});
const reviews = read<ReviewRead>(REVIEWS);
const menus = read<MenuRead>(MENUS);
const only = process.env.ONLY?.split(",").filter(Boolean); // e.g. ONLY=173 for a single listing

const DRY = process.env.DRY_RUN === "1";
const payload = await getPayload({ config });
let changed = 0;

for (const id of new Set([...Object.keys(reviews), ...Object.keys(menus)])) {
  if (only && !only.includes(id)) continue;
  const b = await payload.findByID({ collection: "businesses", id: Number(id), locale: "en", depth: 0 }).catch(() => null);
  if (!b) continue;
  const data: Partial<Business> = {};
  const r = reviews[id];
  if (r?.stars) data.googleStars = [1, 2, 3, 4, 5].map((n) => r.stars![String(n)] ?? 0);
  if (r?.topics?.length) {
    data.googleTopics = [...r.topics]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOPICS)
      .map(([label, count]) => ({ label, count }));
  }
  const m = menus[id];
  if (m && !b.menu?.length) {
    data.menu = m.sections.map((s) => ({ title: s.title, items: s.items.map((i) => ({ name: i.name, nameAm: i.nameAm, price: i.price })) }));
    data.menuSource = m.source;
  }
  if (!Object.keys(data).length) continue;
  changed++;
  const items = data.menu?.reduce((n, s) => n + (s.items?.length ?? 0), 0);
  console.log(`~ ${b.name}:${data.googleStars ? ` stars=${(data.googleStars as number[]).join("/")}` : ""}${data.googleTopics ? ` topics=${(data.googleTopics as unknown[]).length}` : ""}${items ? ` menu=${items} items` : ""}`);
  if (!DRY) await payload.update({ collection: "businesses", id: b.id, locale: "en", data, overrideAccess: true });
}
payload.logger.info(`Google menus and reviews${DRY ? " (dry run)" : ""}: ${changed} listings updated.`);
process.exit(0);
