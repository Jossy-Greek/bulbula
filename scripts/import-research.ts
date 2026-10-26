/**
 * Adds the places found by desk research on 2026-10-26, after the OSM seed.
 * Skips any name already in the directory, so it is safe to run again.
 *
 *   npx payload run scripts/import-research.ts
 *
 * Two kinds of entries:
 * - published: bank branches from the banks' own branch lists.
 * - pending ("leads"): places seen in third-party directories, map apps or
 *   search snippets. They wait in the dashboard's review queue until someone
 *   confirms them on site or by phone. adminNotes says where each came from.
 */
import { getPayload } from "payload";
import config from "@payload-config";

type Entry = {
  cat: string;
  en: string;
  am?: string;
  status: "published" | "pending";
  phone?: string;
  phone2?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  note: string;
};

const DASHEN = "Dashen Bank branch list (Annex 2, PDF dated 2025-12-22, dashenbanksc.com), read 2026-10-26.";
const NIB = "Nib International Bank, nibbanksc.com/branch-atms-pos, read 2026-10-26.";
const ADDISMAP =
  "addismap.com (data partly from OSM; collection date not stated), read 2026-10-26. Likely years old — confirm it still exists before approving.";

const ENTRIES: Entry[] = [
  // Banks — official branch lists. Phone sits above its row in Dashen's PDF;
  // matching the 0114-71x Bulbula exchange is how the rows were paired.
  { cat: "banks", en: "Dashen Bank — Bole Bulbula Branch", am: "ዳሽን ባንክ — ቦሌ ቡልቡላ ቅርንጫፍ", status: "published", phone: "0114 71 7663", landmark: "Bole Bulbula", note: DASHEN },
  { cat: "banks", en: "Dashen Bank — Bulbula Mariam Branch", am: "ዳሽን ባንክ — ቡልቡላ ማርያም ቅርንጫፍ", status: "published", phone: "0114 71 9490", landmark: "Bulbula Mariam", note: DASHEN },
  { cat: "banks", en: "Dashen Bank — Bulbula Mariam Mazoria Branch", am: "ዳሽን ባንክ — ቡልቡላ ማርያም ማዞሪያ ቅርንጫፍ", status: "published", phone: "0113 80 2136", landmark: "Bulbula Mariam Mazoria", note: `${DASHEN} Phone is outside the 0114-71x exchange of the other Bulbula branches — check.` },
  { cat: "banks", en: "Dashen Bank — 93 Mazoriya Branch", am: "ዳሽን ባንክ — 93 ማዞሪያ ቅርንጫፍ", status: "published", phone: "0114 71 1034", landmark: "93 Mazoria, Bole Bulbula", note: DASHEN },
  { cat: "banks", en: "Nib International Bank — Bole Bulbula Branch", am: "ንብ ኢንተርናሽናል ባንክ — ቦሌ ቡልቡላ ቅርንጫፍ", status: "published", phone: "0114 71 4043", phone2: "0114 71 4734", landmark: "Bole Bulbula", note: NIB },
  { cat: "banks", en: "Nib International Bank — Bole Bulbula Mariam Mazoria Branch", am: "ንብ ኢንተርናሽናል ባንክ — ቦሌ ቡልቡላ ማርያም ማዞሪያ ቅርንጫፍ", status: "published", phone: "0114 71 4814", phone2: "0114 71 4780", landmark: "Bulbula Mariam Mazoria", note: NIB },
  { cat: "banks", en: "Nib International Bank — Bulbula 93 Mazoria Branch", am: "ንብ ኢንተርናሽናል ባንክ — ቡልቡላ 93 ማዞሪያ ቅርንጫፍ", status: "published", phone: "0114 71 4923", landmark: "93 Mazoria, Bole Bulbula", note: `${NIB} Listed as "Bulebula 93 Mazoria"; its second number (1141704269) is malformed and was left out.` },

  // Leads — pending until confirmed.
  { cat: "cafes-restaurants", en: "Gelatiamo Bole Bulbula", status: "pending", phone: "+251 93 595 5598", note: "Ice-cream shop. bekurguide.com/organization/gelatiamo-bole-bulbula (no address or hours), read 2026-10-26." },
  { cat: "bakeries", en: "Ayuk Bakery & Pastry", status: "pending", phone: "+251 91 125 2280", facebook: "https://www.facebook.com/ayukbakeryandpastry/", landmark: "Near Medhanialem church, opposite Dashen Bank, YT building", note: "Address and phone from a web-search snippet of the Facebook page (the page itself did not render), 2026-10-26. Confirm both." },
  { cat: "cafes-restaurants", en: "Ahadu Café", status: "pending", landmark: "Bulbula Medhanialem", lat: 8.948923, lng: 38.778101, note: ADDISMAP },
  { cat: "cafes-restaurants", en: "Grar Café", status: "pending", landmark: "Bulbula Medhanialem", lat: 8.94894, lng: 38.778264, note: ADDISMAP },
  { cat: "cafes-restaurants", en: "Rohbot Café", status: "pending", landmark: "Bulbula Medhanialem", lat: 8.948885, lng: 38.777697, note: ADDISMAP },
  { cat: "cafes-restaurants", en: "Beza Kurs Bet", am: "ቤዛ ቁርስ ቤት", status: "pending", landmark: "Bulbula Medhanialem", lat: 8.948849, lng: 38.777589, note: `Breakfast house. ${ADDISMAP}` },
  { cat: "beauty", en: "Julie Nails and Spa", status: "pending", phone: "+251 966 21 40 55", landmark: "Bole Bulbula", note: "Yandex Maps (\"Julie nails and SPA Bole Bulbula\", Bole Kebele 47; open until 7 PM), read 2026-10-26. Yandex gave no usable coordinates." },
  { cat: "beauty", en: "Afro Salon & Spa — Bole Bulbula", status: "pending", phone: "+251 953 212 223", instagram: "https://www.instagram.com/afro_salon_spa/", landmark: "Refenti building, 2nd floor, Mariam Mazoria", note: "From a web-search snippet of the Instagram bio (the profile needs a login), 2026-10-26. Refenti Hotel in OSM is at 8.94848, 38.78472 — same building? Confirm." },
  { cat: "beauty", en: "Moon Fitness Center", status: "pending", landmark: "Bole Bulbula", note: "Gym with spa, men and women. Only source: the business's TikTok (video caption seen in a search result), 2026-10-26. Consider a Fitness category." },
  { cat: "education", en: "Wisdom Academy Bole Bulbula", am: "ዊዝደም አካዳሚ ቦሌ ቡልቡላ", status: "pending", website: "https://schoolofwisdomacademy.com", landmark: "Bole Bulbula", note: "Kindergarten. Yandex Maps (Bole Kebele 47; open until 4:30 PM), read 2026-10-26." },
  { cat: "education", en: "Bulbula Primary School", status: "pending", landmark: "Bole Bulbula", note: "Named as a landmark on ethiopiarealty.com/area/bulbula, 2026-10-26. No address or contact." },
  { cat: "hotels", en: "Bulbula Lodging", status: "pending", landmark: "Near the Bulbula Key Afer taxi stop", note: "Yandex Maps (hotel, Bole Kebele 47; nearest stop \"Bulbula Key Afer\", 19 m), read 2026-10-26." },
];

const payload = await getPayload({ config });
const cats = await payload.find({ collection: "categories", limit: 100, depth: 0 });
const catId = new Map(cats.docs.map((c) => [c.slug, c.id]));
const existing = await payload.find({ collection: "businesses", locale: "en", limit: 5000, depth: 0, select: { name: true } });
const names = new Set(existing.docs.map((d) => d.name.trim().toLowerCase()));

let added = 0;
for (const e of ENTRIES) {
  if (names.has(e.en.toLowerCase())) continue;
  const category = catId.get(e.cat);
  if (!category) throw new Error(`No category ${e.cat} — run the seed first.`);
  const doc = await payload.create({
    collection: "businesses",
    locale: "en",
    data: {
      name: e.en,
      category,
      phone: e.phone,
      phone2: e.phone2,
      website: e.website,
      facebook: e.facebook,
      instagram: e.instagram,
      landmark: e.landmark,
      lat: e.lat,
      lng: e.lng,
      status: e.status,
      source: "admin",
      claimed: false,
      featured: false,
      adminNotes: e.note,
    },
  });
  if (e.am) await payload.update({ collection: "businesses", id: doc.id, locale: "am", data: { name: e.am } });
  added++;
}

payload.logger.info(`Research import: ${added} added, ${ENTRIES.length - added} already present.`);
process.exit(0);
