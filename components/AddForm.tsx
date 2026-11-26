"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Send } from "lucide-react";
import type { Content } from "@/data/content";
import type { CategoryInfo } from "@/lib/directory";
import { submitBusiness, type AddState } from "@/app/(frontend)/[locale]/add/actions";
import { localeHref } from "@/lib/href";

type Props = {
  t: Content["addPage"];
  locale: Content["locale"];
  categories: CategoryInfo[];
  claim?: { slug: string; name: string; categoryId?: number };
};

/** The longest side of a sent photo, as in the app: a camera photo goes up as a few hundred KB. */
const MAX_SIDE = 1600;

/** The picked image, upright and shrunk to a JPEG; null if the browser can't read it. */
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file); // applies the camera's rotation
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.82));
  } catch {
    return null;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export default function AddForm({ t, locale, categories, claim }: Props) {
  const [state, action, pending] = useActionState<AddState, FormData>(submitBusiness, { ok: false });
  const f = t.fields;
  // Customers may leave their phone out; owners and staff are called to confirm.
  const [relationship, setRelationship] = useState<"owner" | "manager" | "customer">("owner");
  const phoneNeeded = relationship !== "customer";
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!file) return;
    const blob = await shrink(file);
    setPhotoFailed(!blob);
    setPhoto(blob ? { blob, url: URL.createObjectURL(blob) } : null);
  }

  if (state.ok) {
    return (
      <div className="card p-8 text-center" role="status">
        <span className="celebrate">
          <CheckCircle2 className="h-11 w-11" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h2 className="font-display mt-4 text-2xl font-extrabold text-river">{t.successTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{t.successBody}</p>
        <Link href={localeHref(locale, "/add")} className="action-link mt-6">
          {t.another}
        </Link>
      </div>
    );
  }

  const card = "card p-6 sm:p-8";
  const h = "font-display mb-5 text-xl font-bold text-river";
  return (
    <form
      // Not `action={action}`: React resets a form after its action runs, which
      // would wipe what the visitor typed whenever validation sends it back.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (photo) data.set("photo", new File([photo.blob], "photo.jpg", { type: "image/jpeg" }));
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      {claim ? (
        <p className="rounded-xl bg-marigold-soft/60 px-4 py-3 text-sm text-ink ring-1 ring-marigold/40">
          <strong>{t.claimingTitle}:</strong> {claim.name}
          <input type="hidden" name="claim" value={claim.slug} />
        </p>
      ) : null}
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section className={card}>
        <h2 className={h}>{t.sections.business}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.nameEn}>
            <input name="nameEn" required maxLength={120} defaultValue={claim?.name} className="field" />
          </Field>
          <Field label={f.nameAm}>
            <input name="nameAm" maxLength={120} lang="am" className="field" />
          </Field>
          <Field label={f.category}>
            <select name="category" required defaultValue={claim?.categoryId ?? ""} className="field">
              <option value="" disabled>
                {f.chooseCategory}
              </option>
              {categories.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f.landmark} hint={f.landmarkHint}>
            <input name="landmark" maxLength={200} className="field" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={f.mapsLink} hint={f.mapsLinkHint}>
              <input name="mapsLink" type="url" maxLength={300} placeholder="https://maps.app.goo.gl/…" className="field" />
            </Field>
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h}>{t.sections.contact}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.phone}>
            <input name="phone" type="tel" inputMode="tel" maxLength={40} placeholder="09…" className="field" />
          </Field>
          <Field label={f.website}>
            <input name="website" maxLength={200} placeholder="www.…" className="field" />
          </Field>
          <Field label={f.facebook}>
            <input name="facebook" maxLength={200} placeholder="facebook.com/…" className="field" />
          </Field>
          <Field label={f.instagram}>
            <input name="instagram" maxLength={200} placeholder="instagram.com/…" className="field" />
          </Field>
          <Field label={f.telegram}>
            <input name="telegram" maxLength={200} placeholder="t.me/…" className="field" />
          </Field>
          <Field label={f.hours} hint={f.hoursHint}>
            <input name="hours" maxLength={120} className="field" />
          </Field>
        </div>
      </section>

      <section className={card}>
        <h2 className={h}>{t.sections.about}</h2>
        <div className="grid gap-5">
          <Field label={f.descriptionEn}>
            <textarea name="descriptionEn" rows={4} maxLength={1200} className="field" />
          </Field>
          <Field label={f.descriptionAm}>
            <textarea name="descriptionAm" rows={4} maxLength={1200} lang="am" className="field" />
          </Field>
          <div>
            <span className="label">{f.photo}</span>
            {photo ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image */}
                <img src={photo.url} alt="" className="aspect-[4/3] w-full max-w-md rounded-xl object-cover" />
                <div className="flex flex-wrap gap-2">
                  <label className="btn btn-outline cursor-pointer">
                    {f.photoChange}
                    <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                  </label>
                  <button type="button" className="btn btn-outline" onClick={() => setPhoto(null)}>
                    {f.photoRemove}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border p-4 transition hover:border-teal hover:bg-tint/50">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-tint text-teal-text">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted">{f.photoHint}</span>
                <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
              </label>
            )}
            {photoFailed ? <p className="mt-2 text-sm font-semibold text-[#8f2a1d]">{t.errors.photo}</p> : null}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={h}>{t.sections.you}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.yourName}>
            <input name="yourName" required maxLength={120} className="field" />
          </Field>
          <Field label={phoneNeeded ? f.yourPhone : f.yourPhoneOptional}>
            <input name="yourPhone" required={phoneNeeded} type="tel" inputMode="tel" maxLength={40} className="field" />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="label">{f.relationship}</legend>
            <div className="flex flex-wrap gap-2">
              {(claim ? (["owner", "manager"] as const) : (["owner", "manager", "customer"] as const)).map((r, i) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-b-4 border-border px-4 py-2.5 font-semibold transition-colors hover:border-teal has-[:checked]:border-teal has-[:checked]:bg-tint">
                  <input type="radio" name="relationship" value={r} defaultChecked={i === 0} onChange={() => setRelationship(r)} className="accent-[#1f7a85]" />
                  {f[r]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#1f7a85]" />
            <span className="text-sm text-ink">{f.consent}</span>
          </label>
        </div>
      </section>

      {state.error ? (
        <p role="alert" className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#8f2a1d]">
          {t.errors[state.error]}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-river w-full sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" /> {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
