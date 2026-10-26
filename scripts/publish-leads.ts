/**
 * Publishes the research leads as "Not yet confirmed" (decided 2026-10-26).
 *
 *   DRY_RUN=1 npx payload run scripts/publish-leads.ts
 *   npx payload run scripts/publish-leads.ts
 *
 * Takes every pending listing that came from research (source "admin", no
 * submitter) and sets status published + unconfirmed. Owner submissions are
 * never touched. Kept back on purpose:
 * - places whose only source is old addismap data that Google Maps no longer shows;
 * - Bulbula Primary School, which Google lists as permanently closed (it is
 *   rejected, with a note).
 */
import { getPayload } from "payload";
import config from "@payload-config";

const DRY = process.env.DRY_RUN === "1";
const KEEP_PENDING = new Set(["Ahadu Café", "Grar Café", "Rohbot Café", "Beza Kurs Bet"]);
const REJECT: Record<string, string> = {
  "Bulbula Primary School": "Google Maps lists \"Bulbula elementary school (Chefe Timertbet)\" as permanently closed (2026-10-26). Rejected rather than published.",
};

const payload = await getPayload({ config });
const pending = (await payload.find({ collection: "businesses", where: { status: { equals: "pending" } }, locale: "en", limit: 5000, depth: 0 })).docs;

let published = 0;
for (const b of pending) {
  if (b.submitter?.name || b.source !== "admin") continue; // owner submissions stay in the queue
  if (KEEP_PENDING.has(b.name)) {
    console.log(`  keep pending: ${b.name}`);
    continue;
  }
  if (REJECT[b.name]) {
    console.log(`  reject: ${b.name}`);
    if (!DRY) await payload.update({ collection: "businesses", id: b.id, data: { status: "rejected", adminNotes: [b.adminNotes, REJECT[b.name]].filter(Boolean).join("\n") } });
    continue;
  }
  published++;
  if (!DRY) await payload.update({ collection: "businesses", id: b.id, data: { status: "published", unconfirmed: true } });
}

payload.logger.info(`${DRY ? "Dry run: would publish" : "Published"} ${published} leads as "Not yet confirmed".`);
process.exit(0);
