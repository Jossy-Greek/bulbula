"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { adminUrl, notifyAdmin } from "@/lib/notify";
import { findPlayer } from "@/lib/players";

export type AddState = { ok: boolean; error?: "required" | "contact" | "consent" | "photo" | "failed" };

const clean = (v: FormDataEntryValue | null, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A photo of the place, up to 5 MB. The type is read from the bytes, not from what the sender says. */
const MAX_PHOTO = 5 * 1024 * 1024;
function photoType(b: Buffer): { mimetype: string; ext: string } | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mimetype: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mimetype: "image/png", ext: "png" };
  if (b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return { mimetype: "image/webp", ext: "webp" };
  return null;
}

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

  const relationship = (["owner", "manager", "customer"] as const).find((r) => r === form.get("relationship")) ?? "owner";

  // Owners and staff are called to confirm, so they leave a phone; a customer's tip doesn't need one.
  if (!nameEn || !category || !yourName || (!yourPhone && relationship !== "customer")) return { ok: false, error: "required" };
  if (!phone && !website && !facebook && !instagram && !telegram) return { ok: false, error: "contact" };
  if (form.get("consent") !== "on") return { ok: false, error: "consent" };

  const upload = form.get("photo");
  let photo: { data: Buffer; mimetype: string; ext: string } | null = null;
  if (upload instanceof File && upload.size > 0) {
    if (upload.size > MAX_PHOTO) return { ok: false, error: "photo" };
    const data = Buffer.from(await upload.arrayBuffer());
    const type = photoType(data);
    if (!type) return { ok: false, error: "photo" };
    photo = { data, ...type };
  }

  try {
    const payload = await getPayload({ config });
    const claimSlug = clean(form.get("claim"), 80);
    let claims: number | undefined;
    if (claimSlug) {
      const found = await payload.find({ collection: "businesses", where: { slug: { equals: claimSlug } }, limit: 1, depth: 0 });
      claims = found.docs[0]?.id;
    }
    // From the app, with cloud backup on: the recovery code ties the place to its player.
    const player = await findPlayer(payload, form.get("player"));
    // Saved first so the listing can point to it; it shows only once an admin publishes the place.
    const media = photo
      ? await payload.create({
          collection: "media",
          locale: "en",
          overrideAccess: true,
          data: { alt: nameEn },
          file: { data: photo.data, mimetype: photo.mimetype, name: `place-${Date.now()}.${photo.ext}`, size: photo.data.length },
        })
      : null;
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
        photo: media?.id,
        status: "pending",
        source: "owner",
        player: player?.id,
        claimed: false,
        featured: false,
        claims,
        submitter: {
          name: yourName,
          phone: yourPhone || undefined,
          relationship,
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
    const who = `${yourName} (${relationship})`;
    await notifyAdmin(
      `🏪 ${claims ? "Claim" : "New business"}: ${nameEn}${cat ? ` — ${cat.name}` : ""}${media ? " 📷" : ""}\nFrom ${who}\nApprove or reject: ${adminUrl("#submissions")}`,
    );
    return { ok: true };
  } catch (e) {
    console.error("submitBusiness failed", e);
    return { ok: false, error: "failed" };
  }
}
