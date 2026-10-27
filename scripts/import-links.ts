/**
 * Fills in websites and social links from first-party sources, checked by hand
 * on 2026-10-27: each website was opened and matched to the business; social
 * links were taken from the business's own website. Bank branches get their
 * bank's official site. Only empty fields are filled — nothing an owner or
 * admin entered is overwritten. Safe to rerun.
 *
 *   DRY_RUN=1 npx payload run scripts/import-links.ts
 *   npx payload run scripts/import-links.ts
 *
 * Left out on purpose (2026-10-27): metrorealestateet.com (domain now serves a
 * gambling spam site), nisirmfi.com (database error), wmcethiopia.com (403 to
 * checks), lonadas.rf.gd, front-door.merawiyohannes.workers.dev,
 * kbacademyetbiopia.org, usacademy.edu.et (did not load), combanketh.et (did
 * not load from here), refenti.com (Refenti Realty Group; our listing is
 * "Refenti Hotel" — sources conflict).
 */
import { getPayload } from "payload";
import config from "@payload-config";

type Links = { website?: string; facebook?: string; instagram?: string; telegram?: string };
type Rule = { match: (name: string) => boolean; links: Links; why: string };

const exact = (n: string) => (name: string) => name === n;
const prefix = (p: string) => (name: string) => name.startsWith(p);

const RULES: Rule[] = [
  { match: exact("Premier Medical Center"), links: { website: "https://www.premiermdcenter.com/", telegram: "https://t.me/PremierMC" }, why: "own site; Telegram linked from it" },
  { match: (n) => n === "Wisdom Academy" || n === "Wisdom Academy Bole Bulbula", links: { website: "https://schoolofwisdomacademy.com/" }, why: "own site" },
  { match: exact("Kangaroo Residential Complex"), links: { website: "https://kangaroodevelopments.com/" }, why: "developer's own site" },
  { match: exact("CURA Car Wash"), links: { website: "https://www.curacarwash.com/" }, why: "own site" },
  { match: exact("Mayamed Trading PLC"), links: { website: "https://www.mayamedtrading.com/" }, why: "own site" },
  { match: exact("Safaricom Shop — Bole Bulbula"), links: { website: "https://www.safaricom.et/" }, why: "operator's site" },
  // Bank branches → the bank's official website.
  { match: prefix("Dashen Bank"), links: { website: "https://dashenbanksc.com/" }, why: "bank's site" },
  { match: prefix("Nib International Bank"), links: { website: "https://www.nibbanksc.com/" }, why: "bank's site" },
  { match: prefix("Awash Bank"), links: { website: "https://awashbank.com/" }, why: "bank's site" },
  { match: prefix("Bank of Abyssinia"), links: { website: "https://www.bankofabyssinia.com/" }, why: "bank's site" },
  // United Bank was renamed Hibret Bank in 2022.
  { match: (n) => n.startsWith("Hibret Bank") || n.startsWith("United Bank"), links: { website: "https://www.hibretbank.com.et/" }, why: "bank's site (United Bank is now Hibret Bank)" },
  { match: prefix("Wegagen Bank"), links: { website: "https://www.wegagen.com/" }, why: "bank's site" },
];

const DRY = process.env.DRY_RUN === "1";
const payload = await getPayload({ config });
const all = (await payload.find({ collection: "businesses", locale: "en", limit: 5000, depth: 0 })).docs;

let changed = 0;
for (const b of all) {
  const rule = RULES.find((r) => r.match(b.name));
  if (!rule) continue;
  const data: Links = {};
  for (const [k, v] of Object.entries(rule.links) as [keyof Links, string][]) if (!b[k]) data[k] = v;
  if (!Object.keys(data).length) continue;
  changed++;
  console.log(`~ ${b.name}: ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(", ")}  (${rule.why})`);
  if (!DRY) await payload.update({ collection: "businesses", id: b.id, data });
}
payload.logger.info(`Links${DRY ? " (dry run)" : ""}: ${changed} listings updated.`);
process.exit(0);
