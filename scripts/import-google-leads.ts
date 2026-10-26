/**
 * Adds the places found on Google Maps on 2026-10-26 as *pending leads*.
 *
 *   DRY_RUN=1 npx payload run scripts/import-google-leads.ts   # print the plan
 *   npx payload run scripts/import-google-leads.ts             # apply it
 *
 * Only a place's name, its pin and a link to its Google listing (by place ID)
 * were recorded — Google's terms don't allow copying phones, hours, reviews or
 * photos into another directory. Each lead waits in the dashboard until someone
 * confirms it by phone or visit and adds those details.
 *
 * A place that is already in the directory (within 120 m and sharing a
 * distinctive word of its name) is not duplicated: it only gains the Google
 * link, and a pin if it had none. Safe to run again.
 */
import { readFileSync } from "fs";
import path from "path";
import { getPayload } from "payload";
import config from "@payload-config";

type Lead = {
  cat: string;
  en: string;
  am: string | null;
  lat: number;
  lng: number;
  placeId: string;
  mapsLink: string;
  landmarkEn: string | null;
  landmarkAm: string | null;
  googleName: string;
};

const DRY = process.env.DRY_RUN === "1";
const leads: Lead[] = JSON.parse(readFileSync(path.resolve(process.cwd(), "scripts/data/google-maps-leads-2026-10-26.json"), "utf8"));

const NEW_CATEGORIES = [
  { slug: "clinics", en: "Clinics & dental", am: "ክሊኒኮችና የጥርስ ሕክምና", group: "business", icon: "stethoscope", after: "pharmacies" },
  { slug: "fitness", en: "Gyms & fitness", am: "ጂምና የአካል ብቃት", group: "business", icon: "dumbbell", after: "beauty" },
] as const;

// The owners' own share links for the two Tukiya branches (given to us directly).
const TUKIYA_LINKS: Record<string, string> = {
  "Tukiya Coffee — Bole 17/19/20": "https://maps.app.goo.gl/8BktcYezrAVKfVB47",
  "Tukiya Coffee — 93 Mazoriya": "https://maps.app.goo.gl/Fc2F2E5tkp8BHYLr6",
};

const STOP = new Set(
  "the and bole bulbula bulbulla bank branch bakery pastry pharmacy pharma coffee cafe restaurant bar salon beauty spa center centre clinic medium shop supermarket market mart school academy health gym fitness addis ababa ethiopia mazoria mazoriya mazorya mariam medhanialem condominium".split(" "),
);
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9ሀ-፿ ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP.has(w)),
  );
const metres = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
};

const payload = await getPayload({ config });

// Categories
const cats = await payload.find({ collection: "categories", limit: 100, depth: 0, sort: "order" });
const catId = new Map(cats.docs.map((c) => [c.slug, c.id]));
for (const c of NEW_CATEGORIES) {
  if (catId.has(c.slug)) continue;
  const after = cats.docs.find((x) => x.slug === c.after);
  if (DRY) {
    console.log(`+ category ${c.slug}`);
    continue;
  }
  const doc = await payload.create({ collection: "categories", locale: "en", data: { name: c.en, slug: c.slug, group: c.group, icon: c.icon, order: (after?.order ?? 50) + 0.5 } });
  await payload.update({ collection: "categories", id: doc.id, locale: "am", data: { name: c.am } });
  catId.set(c.slug, doc.id);
}

const existing = (await payload.find({ collection: "businesses", locale: "en", limit: 5000, depth: 0 })).docs;

// Tukiya: the owners' links
for (const b of existing) {
  const link = TUKIYA_LINKS[b.name];
  if (link && !b.mapsLink) {
    console.log(`~ ${b.name}: Google link from the owner's share link`);
    if (!DRY) await payload.update({ collection: "businesses", id: b.id, data: { mapsLink: link } });
  }
}

let added = 0;
let matched = 0;
for (const l of leads) {
  const lw = words(l.en + " " + l.googleName);
  const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, "") === b.toLowerCase().replace(/[^a-z]/g, "");
  const match = existing.find((b) => {
    if (same(b.name, l.en)) return true;
    if (b.lat == null || b.lng == null) return [...words(b.name)].some((w) => lw.has(w)) && b.status === "pending" && [...words(b.name)].length > 0;
    return metres(l, { lat: b.lat, lng: b.lng }) < 120 && [...words(b.name)].some((w) => lw.has(w));
  });
  if (match) {
    matched++;
    const data: Record<string, unknown> = {};
    if (!match.mapsLink) data.mapsLink = l.mapsLink;
    if (match.lat == null || match.lng == null) Object.assign(data, { lat: l.lat, lng: l.lng });
    console.log(`= ${l.en}  →  existing "${match.name}" (${match.status})  ${Object.keys(data).join(", ") || "nothing to add"}`);
    if (!DRY && Object.keys(data).length) {
      await payload.update({
        collection: "businesses",
        id: match.id,
        data: { ...data, adminNotes: [match.adminNotes, `Google Maps listing linked 2026-10-26 ("${l.googleName}").`].filter(Boolean).join("\n") },
      });
    }
    continue;
  }
  const category = catId.get(l.cat);
  if (!category && !DRY) throw new Error(`No category ${l.cat}`);
  console.log(`+ ${l.cat.padEnd(18)} ${l.en}${l.am ? ` / ${l.am}` : ""}${l.landmarkEn ? `  (${l.landmarkEn})` : ""}`);
  added++;
  if (DRY) continue;
  const doc = await payload.create({
    collection: "businesses",
    locale: "en",
    data: {
      name: l.en,
      category: category!,
      lat: l.lat,
      lng: l.lng,
      landmark: l.landmarkEn ?? undefined,
      mapsLink: l.mapsLink,
      status: "pending",
      source: "admin",
      claimed: false,
      featured: false,
      adminNotes: `Found on Google Maps 2026-10-26 as "${l.googleName}". Only the name, pin and Google link were recorded. Call or visit to confirm it is open, add phone and hours, then publish.`,
    },
  });
  if (l.am || l.landmarkAm) {
    await payload.update({ collection: "businesses", id: doc.id, locale: "am", data: { name: l.am ?? l.en, ...(l.landmarkAm ? { landmark: l.landmarkAm } : {}) } });
  }
}

payload.logger.info(`Google leads${DRY ? " (dry run)" : ""}: ${added} new pending, ${matched} matched to existing listings.`);
process.exit(0);
