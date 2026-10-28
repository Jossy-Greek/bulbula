"use client";

import { startTransition, useActionState, useState } from "react";
import { CheckCircle2, PenLine, Star } from "lucide-react";
import type { Content } from "@/data/content";
import { submitReview, type ReviewState } from "@/app/(frontend)/[locale]/b/[slug]/actions";
import { track } from "@/lib/track";

type Props = { slug: string; t: Content["reviews"]; locale: Content["locale"] };

/**
 * "Write a review": closed until asked for, so the page stays short on phones.
 * The stars are a radio group (arrow keys work); the chosen star's label is
 * read out next to it.
 */
export default function ReviewForm({ slug, t, locale }: Props) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, { ok: false });
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [drawn, setDrawn] = useState(0);

  if (state.ok) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-tint px-4 py-3 text-sm font-semibold text-teal-text" role="status">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" /> {t.thanks}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDrawn(Date.now());
        }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-river px-4 text-[15px] font-bold text-white hover:bg-river/90"
      >
        <PenLine className="h-4 w-4" aria-hidden="true" /> {t.write}
      </button>
    );
  }

  const shown = hover || rating;
  return (
    <form
      // Not `action={action}`: React resets the form after an action, wiping the text on a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
        track({ type: "action", action: "review", slug });
      }}
      className="space-y-4 rounded-xl border border-border bg-page p-4 sm:p-5"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="t" value={drawn} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className="label">{t.yourRating}</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" required />
                <span className="sr-only">{t.stars[n - 1]}</span>
                <Star
                  aria-hidden="true"
                  className={`h-8 w-8 rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal ${n <= shown ? "fill-marigold text-marigold" : "text-border"}`}
                />
              </label>
            ))}
          </div>
          <span className="text-sm font-semibold text-muted" aria-live="polite">
            {shown ? t.stars[shown - 1] : ""}
          </span>
        </div>
      </fieldset>

      <label className="block">
        <span className="label">{t.name}</span>
        <input name="author" required maxLength={60} autoComplete="given-name" className="field" />
      </label>

      <label className="block">
        <span className="label">{t.text}</span>
        <textarea name="text" rows={4} maxLength={1000} className="field" />
        <span className="mt-1 block text-xs text-muted">{t.textHint}</span>
      </label>

      {state.error ? (
        <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-sm font-semibold text-[#8f2a1d]" role="alert">
          {t.errors[state.error]}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-marigold disabled:opacity-60">
          {pending ? t.sending : t.submit}
        </button>
        <p className="text-xs text-muted">{t.moderated}</p>
      </div>
    </form>
  );
}
