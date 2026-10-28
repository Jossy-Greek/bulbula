import type { Content } from "@/data/content";
import type { ReviewSummary } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import Stars from "./Stars";

/** Visitors' own reviews of one place: the average, the list, and the form. */
export default function Reviews({ slug, summary, c }: { slug: string; summary: ReviewSummary; c: Content }) {
  const t = c.reviews;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 rounded-2xl border border-border bg-raised p-6">
      <h2 id="reviews-title" className="font-display text-xl font-bold text-river">
        {t.title}
      </h2>
      {summary.count ? (
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-display text-3xl font-extrabold text-river">{summary.average.toFixed(1)}</span>
          <Stars value={summary.average} />
          <span className="text-sm text-muted">{summary.count === 1 ? t.one : t.count.replace("{n}", String(summary.count))}</span>
        </p>
      ) : (
        <p className="mt-2 text-[15px] text-muted">{t.none}</p>
      )}
      <div className="mt-4">
        <ReviewForm slug={slug} t={t} locale={c.locale} />
      </div>
      {summary.count ? <ReviewList reviews={summary.reviews} t={t} ui={c.ui} /> : null}
    </section>
  );
}
