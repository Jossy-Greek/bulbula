"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { adminUrl, notifyAdmin } from "@/lib/notify";

export type AddState = { ok: boolean; error?: "required" | "contact" | "consent" | "failed" };

const clean = (v: FormDataEntryValue | null, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Saves a public submission as a *pending* listing. Status, source, claimed and
 * featured are fixed here, so nothing a visitor sends can publish itself.
 * `company` is a honeypot: people never see it, simple bots fill it in.
 */
export async function submitBusiness(_prev: AddState, form: FormData): Promise<AddState> {
  if (clean(form.get("company"))) return { ok: true }; // pretend success for bots

  const nameEn = clean(form.get("nameEn"), 120);
  const nameAm = clean(form.get("nameAm"), 120);
  const category = Number(form.get("category"));
  const yourName = clean(form.get("yourName"), 120);
  const yourPhone = clean(form.get("yourPhone"), 40);
  const phone = clean(form.get("phone"), 40);
  const website = clean(form.get("website"), 200);
  const facebook = clean(form.get("facebook"), 200);
  const instagram = clean(form.get("instagram"), 200);
  const telegram = clean(form.get("telegram"), 200);

  if (!nameEn || !category || !yourName || !yourPhone) return { ok: false, error: "required" };
  if (!phone && !website && !facebook && !instagram && !telegram) return { ok: false, error: "contact" };
  if (form.get("consent") !== "on") return { ok: false, error: "consent" };

  try {
    const payload = await getPayload({ config });
    const claimSlug = clean(form.get("claim"), 80);
    let claims: number | undefined;
    if (claimSlug) {
      const found = await payload.find({ collection: "businesses", where: { slug: { equals: claimSlug } }, limit: 1, depth: 0 });
      claims = found.docs[0]?.id;
    }
    const doc = await payload.create({
      collection: "businesses",
      locale: "en",
      overrideAccess: true,
      data: {
        name: nameEn,
        category,
        landmark: clean(form.get("landmark"), 200) || undefined,
        mapsLink: clean(form.get("mapsLink"), 300) || undefined,
        phone: phone || undefined,
        website: website || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
        telegram: telegram || undefined,
        hours: clean(form.get("hours"), 120) || undefined,
        description: clean(form.get("descriptionEn"), 1200) || undefined,
        status: "pending",
        source: "owner",
        claimed: false,
        featured: false,
        claims,
        submitter: {
          name: yourName,
          phone: yourPhone,
          relationship: (["owner", "manager", "customer"] as const).find((r) => r === form.get("relationship")) ?? "owner",
        },
      },
    });
    const am = { name: nameAm, description: clean(form.get("descriptionAm"), 1200) };
    if (am.name || am.description) {
      await payload.update({
        collection: "businesses",
        id: doc.id,
        locale: "am",
        overrideAccess: true,
        data: { ...(am.name ? { name: am.name } : {}), ...(am.description ? { description: am.description } : {}) },
      });
    }
    const cat = await payload.findByID({ collection: "categories", id: category, depth: 0 }).catch(() => null);
    const who = `${yourName} (${(["owner", "manager", "customer"] as const).find((r) => r === form.get("relationship")) ?? "owner"})`;
    await notifyAdmin(
      `🏪 ${claims ? "Claim" : "New business"}: ${nameEn}${cat ? ` — ${cat.name}` : ""}\nFrom ${who}\nApprove or reject: ${adminUrl("#submissions")}`,
    );
    return { ok: true };
  } catch (e) {
    console.error("submitBusiness failed", e);
    return { ok: false, error: "failed" };
  }
}
