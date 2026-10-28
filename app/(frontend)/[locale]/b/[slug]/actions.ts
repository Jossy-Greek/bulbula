"use server";

import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { dailyVisitor } from "@/lib/visitor";

export type ReviewState = { ok: boolean; error?: "rating" | "name" | "links" | "already" | "failed" };

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Reviews are about the place, not adverts: no links, handles or phone numbers.
const LINKISH = /https?:|www\.|\b[a-z0-9-]+\.(com|et|net|org|io|me)\b|t\.me|@[a-z0-9_]{3,}|(?:\d[\s-]?){9,}/i;
const PER_DAY = 5;

/**
 * Saves a visitor's review as *pending*; it shows only after an admin approves
 * it. `company` is a honeypot and `t` the time the form was drawn — a form sent
 * back within 3 seconds was not filled in by a person. Both get a quiet "thanks".
 */
export async function submitReview(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const drawn = Number(form.get("t"));
  if (clean(form.get("company"), 100) || !drawn || Date.now() - drawn < 3000) return { ok: true };

  const slug = clean(form.get("slug"), 120);
  const rating = Math.round(Number(form.get("rating")));
  const author = clean(form.get("author"), 60);
  const text = clean(form.get("text"), 1000);
  const locale = form.get("locale") === "am" ? "am" : "en";

  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "rating" };
  if (!author) return { ok: false, error: "name" };
  if (LINKISH.test(text) || LINKISH.test(author)) return { ok: false, error: "links" };

  try {
    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "businesses",
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
      limit: 1,
      depth: 0,
    });
    const business = found.docs[0];
    if (!business) return { ok: false, error: "failed" };

    const visitor = dailyVisitor(await headers());
    const today = await payload.find({
      collection: "reviews",
      overrideAccess: true,
      where: { and: [{ visitor: { equals: visitor } }, { createdAt: { greater_than: new Date(Date.now() - 86_400_000).toISOString() } }] },
      limit: PER_DAY,
      depth: 0,
    });
    const sameBusiness = today.docs.some((r) => (typeof r.business === "object" ? r.business.id : r.business) === business.id);
    if (sameBusiness) return { ok: false, error: "already" };
    if (today.totalDocs >= PER_DAY) return { ok: true }; // a flood: accept quietly, keep nothing

    await payload.create({
      collection: "reviews",
      overrideAccess: true,
      data: { business: business.id, rating, author, text: text || undefined, locale, visitor, status: "pending" },
    });
    return { ok: true };
  } catch (e) {
    console.error("submitReview failed", e);
    return { ok: false, error: "failed" };
  }
}
