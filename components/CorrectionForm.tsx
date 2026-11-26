"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import type { Content } from "@/data/content";
import { suggestCorrection, type CorrectionState } from "@/app/(frontend)/[locale]/b/[slug]/actions";

/**
 * "Suggest a correction": a small form in place of the old email link (most phone users don't
 * finish an email). Closed until asked for; it goes to the admin's Corrections list and Telegram.
 */
export default function CorrectionForm({ slug, t, label }: { slug: string; t: Content["correction"]; label: string }) {
  const [state, action, pending] = useActionState<CorrectionState, FormData>(suggestCorrection, { ok: false });
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-tint px-4 py-3 text-sm font-semibold text-teal-text" role="status">
        <span className="pop grid h-7 w-7 flex-none place-items-center rounded-full bg-marigold text-river shadow-[0_3px_0_var(--marigold-edge)]"><CheckCircle2 className="h-4 w-4" strokeWidth={2.75} aria-hidden="true" /></span> <span className="pt-1">{t.thanks}</span>
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-text hover:underline">
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 card p-4">
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot: hidden from people, filled in by simple bots. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="block">
        <span className="label">{t.message}</span>
        <textarea name="message" required minLength={5} maxLength={1000} rows={3} placeholder={t.prompt} className="field" />
      </label>
      <label className="block">
        <span className="label">{t.contact}</span>
        <input name="contact" type="text" inputMode="tel" autoComplete="tel" maxLength={120} className="field" />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-[#8f2a1d]">
          {state.error === "short" ? t.error : t.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-river">
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
