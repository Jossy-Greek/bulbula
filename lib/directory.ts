import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Locale } from "@/data/content";
import type { Service } from "@/data/services";
import type { Business, Category, Media } from "@/payload-types";

/** What the public pages need about a listing — serialisable, so client components can take it. */
export type Listing = {
  id: number;
  slug: string;
  name: string;
  category: { slug: string; name: string; group: "business" | "community"; icon: string };
  description: string | null;
  /** True when `description` was built from the listing's own fields, not written by the owner. */
  generated: boolean;
  landmark: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  phone2: string | null;
  website: string | null;
  mapsLink: string | null;
  /** Google Maps link to show (see googleMapsUrl). */
  mapsUrl: string;
  /** Google place ID from the stored Google Maps link (IDs may be stored; Google's content may not). */
  googlePlaceId: string | null;
  /** Hours as stored (OSM syntax when parseable), for the live open/closed badge. */
  hoursSpec: string | null;
  facebook: string | null;
  instagram: string | null;
  telegram: string | null;
  hours: string | null;
  photo: { url: string; alt: string } | null;
  claimed: boolean;
  /** Published from research, not yet checked by phone or visit. */
  unconfirmed: boolean;
  source: "osm" | "owner" | "admin";
  featured: boolean;
  services: Service[];
  priceRange: string | null;
  menuLink: string | null;
  /** Copied from Google Maps (see scripts/import-google-details.ts). */
  google: {
    rating: number;
    count: number;
    checkedAt: string | null;
    /** Reviews per star, index 0 = 1★ … 4 = 5★. */
    stars: number[] | null;
    /** What Google says reviews mention, most-mentioned first. */
    topics: { label: string; count: number }[];
  } | null;
  menu: { title: string; items: { name: string; nameAm: string | null; price: number | null }[] }[];
  menuSource: string | null;
};

export type CategoryInfo = { id: number; slug: string; name: string; group: "business" | "community"; icon: string; count: number };

const DAYS: Record<Locale, Record<string, string>> = {
  en: { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" },
  am: { Mo: "ሰኞ", Tu: "ማክሰኞ", We: "ረቡዕ", Th: "ሐሙስ", Fr: "ዓርብ", Sa: "ቅዳሜ", Su: "እሑድ" },
};

/** Makes OpenStreetMap-style hours ("Mo-Sa 08:00-18:00; Su off", "24/7") readable; other text passes through. */
export function readableHours(raw: string | null | undefined, locale: Locale): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s === "24/7") return locale === "am" ? "24 ሰዓት ክፍት" : "Open 24 hours";
  if (!/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/.test(s)) return s;
  return s
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAYS[locale][d])
    .replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/g, "$1–$2")
    .replace(/(\S)-(\S)/g, "$1–$2")
    .replace(/;\s*/g, " · ")
    .replace(/\boff\b/g, locale === "am" ? "ዝግ" : "closed");
}

/** A one-line summary from facts we hold — never invented. */
function factSummary(b: { categoryName: string; landmark: string | null; hours: string | null }, locale: Locale) {
  // Landmarks that already name the area ("Bole Bulbula, 93 Mazoriya") are not suffixed again.
  const named = b.landmark && /bulbula|ቡልቡላ/i.test(b.landmark);
  const where = b.landmark
    ? named
      ? b.landmark
      : locale === "am"
        ? `${b.landmark}፣ ቦሌ ቡልቡላ`
        : `${b.landmark}, Bole Bulbula`
    : locale === "am"
      ? "በቦሌ ቡልቡላ"
      : "in Bole Bulbula";
  const first = locale === "am" ? `${b.categoryName} — ${where}።` : `${b.categoryName} ${b.landmark ? "—" : ""} ${where}.`.replace(/\s+/g, " ");
  const hours = b.hours ? (locale === "am" ? ` የስራ ሰዓት፦ ${b.hours}።` : /^open/i.test(b.hours) ? ` ${b.hours}.` : ` Open ${b.hours}.`) : "";
  return (first + hours).trim();
}

function toListing(b: Business, locale: Locale): Listing {
  const cat = b.category as Category;
  const media = b.photo && typeof b.photo === "object" ? (b.photo as Media) : null;
  const hours = readableHours(b.hours, locale);
  const own = b.description?.trim() || null;
  return {
    id: b.id,
    slug: b.slug ?? String(b.id),
    name: b.name,
    category: { slug: cat?.slug ?? "other", name: cat?.name ?? "", group: (cat?.group as "business" | "community") ?? "business", icon: cat?.icon ?? "store" },
    description: own ?? factSummary({ categoryName: cat?.name ?? "", landmark: b.landmark ?? null, hours }, locale),
    generated: !own,
    landmark: b.landmark ?? null,
    address: b.address ?? null,
    lat: b.lat ?? null,
    lng: b.lng ?? null,
    phone: b.phone ?? null,
    phone2: b.phone2 ?? null,
    website: b.website ?? null,
    mapsLink: b.mapsLink ?? null,
    googlePlaceId: b.mapsLink?.match(/[?&]query_place_id=([A-Za-z0-9_-]+)/)?.[1] ?? null,
    mapsUrl: googleMapsUrl({ lat: b.lat ?? null, lng: b.lng ?? null, name: b.name, mapsLink: b.mapsLink ?? null }),
    hoursSpec: b.hours ?? null,
    facebook: b.facebook ?? null,
    instagram: b.instagram ?? null,
    telegram: b.telegram ?? null,
    hours,
    photo: media?.url ? { url: media.sizes?.card?.url || media.url, alt: media.alt || b.name } : null,
    claimed: Boolean(b.claimed),
    unconfirmed: Boolean(b.unconfirmed),
    source: (b.source as Listing["source"]) ?? "admin",
    featured: Boolean(b.featured),
    services: (b.services ?? []) as Service[],
    priceRange: b.priceRange ?? null,
    menuLink: b.menuLink ?? null,
    google: b.googleRating
      ? {
          rating: b.googleRating,
          count: b.googleReviewCount ?? 0,
          checkedAt: b.googleCheckedAt ?? null,
          stars: Array.isArray(b.googleStars) && b.googleStars.length === 5 ? (b.googleStars as number[]) : null,
          topics: Array.isArray(b.googleTopics) ? (b.googleTopics as { label: string; count: number }[]) : [],
        }
      : null,
    // Hidden menus stay in the admin; the site gets none.
    menu: (b.showMenu === false ? [] : (b.menu ?? [])).map((s) => ({
      title: s.title,
      items: (s.items ?? []).map((i) => ({ name: i.name, nameAm: i.nameAm ?? null, price: i.price ?? null })),
    })),
    menuSource: b.menuSource ?? null,
  };
}

/** All published listings, featured and claimed first, then by name. */
export async function getListings(locale: Locale): Promise<Listing[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "businesses",
    locale,
    where: { status: { equals: "published" } },
    limit: 2000,
    depth: 1,
    overrideAccess: false,
  });
  return res.docs
    .map((b) => toListing(b as Business, locale))
    .sort(
      // "Recommended": featured, then run by their owners, then confirmed, then reachable by phone, then by name.
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(b.claimed) - Number(a.claimed) ||
        Number(a.unconfirmed) - Number(b.unconfirmed) ||
        Number(Boolean(b.phone)) - Number(Boolean(a.phone)) ||
        a.name.localeCompare(b.name),
    );
}

export async function getListing(slug: string, locale: Locale): Promise<Listing | null> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "businesses",
    locale,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  });
  return res.docs[0] ? toListing(res.docs[0] as Business, locale) : null;
}

export async function getCategories(locale: Locale, listings?: Listing[]): Promise<CategoryInfo[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({ collection: "categories", locale, sort: "order", limit: 100 });
  const all = listings ?? (await getListings(locale));
  return (res.docs as Category[]).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    group: c.group as "business" | "community",
    icon: c.icon,
    count: all.filter((l) => l.category.slug === c.slug).length,
  }));
}

export { externalUrl, telHref } from "./links";

/**
 * The place in Google Maps: the owner's own Maps link when they gave one (it opens
 * their listing, with reviews and photos), otherwise a pin at the coordinates,
 * otherwise a search by name.
 */
export function googleMapsUrl(l: Pick<Listing, "lat" | "lng" | "name" | "mapsLink">) {
  if (l.mapsLink && /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps)/i.test(l.mapsLink)) return l.mapsLink;
  return l.lat != null && l.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name} Bole Bulbula Addis Ababa`)}`;
}

export function directionsUrl(l: Pick<Listing, "lat" | "lng" | "name">) {
  return l.lat != null && l.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name} Bole Bulbula Addis Ababa`)}`;
}
