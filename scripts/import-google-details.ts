/**
 * Copies facts from Google Maps into listings that have a Google place link:
 * phone, website (or Instagram / Facebook / Telegram), hours, services, price
 * range, the business's own menu link, and the Google rating with its review
 * count. Read on 2026-10-29 from each place's Google Maps page in a browser
 * (no API key: we have no Google Cloud billing); the raw read is
 * scripts/data/google-maps-details-2026-10-29.json.
 *
 * Decision (owner, 2026-10-29): copy the facts. Review text and photos are
 * NOT copied — they belong to the people who wrote or took them.
 *
 * Only empty fields are filled, so nothing an owner or admin entered is
 * overwritten. The rating, review count and check date are a snapshot and are
 * always refreshed. Websites were opened first; ones that failed are listed
 * in BAD_SITES. Safe to rerun.
 *
 *   DRY_RUN=1 npx payload run scripts/import-google-details.ts
 *   npx payload run scripts/import-google-details.ts
 */
import { readFileSync } from "node:fs";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Service } from "@/data/services";
import type { Business } from "@/payload-types";

type Read = {
  pid: string;
  name?: string;
  status?: "open" | "closed" | "temp-closed";
  rating?: number;
  reviews?: number;
  category?: string;
  price?: string;
  phone?: string;
  website?: string;
  menu?: string;
  services?: string[];
  hoursRows?: [day: string, times: string][];
  error?: string;
};

const FILE = process.env.DETAILS_FILE ?? "scripts/data/google-maps-details-2026-10-29.json";
const CHECKED = "2026-10-29";
// Opened before import (curl, 2026-10-29) and failed or served something else.
const BAD_SITES = new Set<string>(JSON.parse(process.env.BAD_SITES ?? "[]"));

// Google's many labels → our services (data/services.ts).
const SERVICE_RULES: [Service, RegExp][] = [
  ["dineIn", /dine-in/i],
  ["takeaway", /takeaway|take-out/i],
  ["delivery", /offers delivery|no-contact delivery/i],
  ["reservations", /accepts reservations/i],
  ["appointments", /appointment/i],
  ["outdoorSeating", /outdoor seating/i],
  ["wifi", /wi-fi/i],
  ["coffee", /serves (great )?coffee/i],
  ["breakfast", /serves breakfast/i],
  ["lunch", /serves lunch/i],
  ["dinner", /serves dinner/i],
  ["dessert", /serves (great )?dessert/i],
  ["vegetarian", /vegetarian|vegan/i],
  ["alcohol", /serves (alcohol|beer|wine|cocktails|spirits)/i],
  ["kids", /good for kids/i],
  ["groups", /good for groups/i],
  ["toilet", /toilet|restroom/i],
  ["wheelchair", /wheelchair-accessible entrance/i],
  ["cards", /credit cards|debit cards/i],
  ["mobilePay", /mobile payments/i],
  ["freeParking", /^free (parking|of charge street parking|multi-storey)/i],
  ["parking", /^paid (street parking|parking|multi-storey)|on-site parking/i],
  ["womenOwned", /women-owned/i],
];

function mapServices(labels: string[] = []): Service[] {
  // "No delivery", "No dine-in" etc. say the opposite.
  const yes = labels.filter((l) => !/^no /i.test(l));
  const out = SERVICE_RULES.filter(([, re]) => yes.some((l) => re.test(l))).map(([s]) => s);
  // Free parking already says there is parking.
  return out.includes("freeParking") ? out.filter((s) => s !== "parking") : out;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const KEYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** "7 AM" / "11:30" + meridiem → "07:00" / "11:30". */
function clock(t: string, meridiem: string) {
  const [h, m = "00"] = t.split(":");
  let hour = Number(h) % 12;
  if (meridiem === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${m}`;
}

/** One day's Google text ("7 AM–11:30 PM", "8 AM–12 PM, 2–6 PM", "Open 24 hours", "Closed") → OSM ranges. */
function dayRanges(text: string): string | null {
  const t = text.replace(/ | /g, " ").trim();
  if (/^open 24 hours$/i.test(t)) return "00:00-24:00";
  if (/^closed$/i.test(t)) return "off";
  const parts = t.split(/,\s*/);
  const out: string[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*[–-]\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)$/i);
    if (!m) return null;
    const endM = m[4].toUpperCase();
    let startM = m[2]?.toUpperCase();
    if (!startM) {
      // "2–6 PM" is 2 PM; "11–2 PM" is 11 AM.
      const s = Number(m[1].split(":")[0]) % 12;
      const e = Number(m[3].split(":")[0]) % 12;
      startM = endM === "PM" && s > e ? "AM" : endM;
    }
    const start = clock(m[1], startM);
    let end = clock(m[3], endM);
    if (end === "00:00") end = "24:00";
    out.push(`${start}-${end}`);
  }
  return out.join(",");
}

/** Google's week table → OSM opening_hours ("Mo-Fr 08:00-18:00; Sa 08:00-12:00; Su off", "24/7"). */
function toOsmHours(rows: [string, string][] = []): string | null {
  const byDay = new Map(rows.map(([d, t]) => [d, t]));
  const specs = DAYS.map((d) => (byDay.has(d) ? dayRanges(byDay.get(d)!) : null));
  if (specs.some((s) => s === null)) return null; // anything we can't read exactly is left out
  // Opening between midnight and 5 AM is almost always Ethiopian clock time typed into Google
  // ("2:30" = 8:30 AM), which would make "Open now" wrong. Leave those for a call.
  if (specs.some((s) => s && s !== "off" && s !== "00:00-24:00" && s.split(",").some((r) => r < "05:00"))) return null;
  if (specs.every((s) => s === "00:00-24:00")) return "24/7";
  if (specs.every((s) => s === "off")) return null;
  const rules: string[] = [];
  for (let i = 0; i < 7; ) {
    let j = i;
    while (j + 1 < 7 && specs[j + 1] === specs[i]) j++;
    const days = i === j ? KEYS[i] : `${KEYS[i]}-${KEYS[j]}`;
    rules.push(`${days} ${specs[i]}`);
    i = j + 1;
  }
  return rules.join("; ");
}

/** "0944745254" → "0944 745 254"; "0114714923" → "0114 71 4923" (the format already used). */
function formatPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (/^09\d{8}$|^07\d{8}$/.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (/^0\d{9}$/.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 6)} ${d.slice(6)}`;
  return p;
}

type Links = { website?: string; facebook?: string; instagram?: string; telegram?: string };
function linkFields(url: string): Links {
  if (/instagram\.com/i.test(url)) return { instagram: url };
  if (/facebook\.com|fb\.com/i.test(url)) return { facebook: url };
  if (/(^|\/\/)(t\.me|telegram\.me)\//i.test(url)) return { telegram: url };
  return { website: url };
}

const DRY = process.env.DRY_RUN === "1";
const reads = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Read>;
const payload = await getPayload({ config });
const closed: string[] = [];
const unread: string[] = [];
let changed = 0;

for (const [id, r] of Object.entries(reads)) {
  const b = await payload.findByID({ collection: "businesses", id: Number(id), locale: "en", depth: 0 }).catch(() => null);
  if (!b) continue;
  if (r.error || !r.name) {
    unread.push(`${b.name} (${r.error ?? "no data"})`);
    continue;
  }
  if (r.status !== "open") closed.push(`${b.name} — Google: ${r.status}`);

  const data: Partial<Business> = {};
  if (r.phone && !b.phone) data.phone = formatPhone(r.phone);
  if (r.website && !BAD_SITES.has(r.website)) {
    for (const [k, v] of Object.entries(linkFields(r.website)) as [keyof Links, string][]) if (!b[k]) data[k] = v;
  }
  const hours = toOsmHours(r.hoursRows);
  if (hours && !b.hours) data.hours = hours;
  const services = mapServices(r.services);
  if (services.length && !b.services?.length) data.services = services;
  if (r.price && !b.priceRange) data.priceRange = r.price.replace(/\bBr\b/g, "ETB");
  if (r.menu && !b.menuLink && !/google\./i.test(r.menu) && !BAD_SITES.has(r.menu)) data.menuLink = r.menu;
  if (r.rating) {
    data.googleRating = r.rating;
    data.googleReviewCount = r.reviews ?? 0;
  }
  data.googleCheckedAt = new Date(`${CHECKED}T12:00:00+03:00`).toISOString();

  const filled = (Object.keys(data) as (keyof Business)[]).filter((k) => !k.startsWith("google"));
  if (filled.length || r.rating) {
    changed++;
    console.log(`~ ${b.name}: ${filled.map((k) => (k === "services" ? `services=${services.join("/")}` : `${k}=${data[k]}`)).join(", ")}${r.rating ? ` · ★${r.rating} (${r.reviews ?? 0})` : ""}`);
  }
  if (!DRY) {
    await payload.update({ collection: "businesses", id: b.id, locale: "en", data, overrideAccess: true });
    // Hours are written in English only: /am falls back to them and readableHours shows Amharic day names.
  }
}
if (closed.length) console.log(`\nGoogle says closed (left published — check by hand):\n  ${closed.join("\n  ")}`);
if (unread.length) console.log(`\nNot read:\n  ${unread.join("\n  ")}`);
payload.logger.info(`Google details${DRY ? " (dry run)" : ""}: ${changed} listings updated.`);
process.exit(0);
