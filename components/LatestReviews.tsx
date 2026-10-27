import Link from "next/link";
import type { Content } from "@/data/content";
import type { Review } from "@/lib/reviews";
import { reviewDate } from "@/lib/dates";
import { localeHref } from "@/lib/href";
import SectionHeader from "./SectionHeader";
import Stars from "./Stars";

/** Home page: the newest approved reviews, each linking to its place. Hidden until there are some. */
export default function LatestReviews({ reviews, c }: { reviews: Review[]; c: Content }) {
  if (!reviews.length) return null;
  const t = c.reviews;
  return (
    <section className="border-t border-border bg-raised py-14 sm:py-20">
      <div className="container-x">
        <SectionHeader eyebrow={t.latestEyebrow} title={t.latestTitle} locale={c.locale} />
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="w-[85%] flex-none snap-start sm:w-auto">
              <Link
                href={`${localeHref(c.locale, `/b/${r.business!.slug}`)}#reviews`}
                className="flex h-full flex-col rounded-2xl border border-border bg-page p-5 transition-colors hover:border-teal"
              >
                <span className="flex items-center gap-2">
                  <Stars value={r.rating} size={14} />
                  <span className="sr-only">{t.stars[r.rating - 1]}</span>
                </span>
                <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-ink">{r.text}</p>
                <span className="mt-auto pt-4 text-sm">
                  <span className="font-semibold text-ink">{r.author}</span>
                  <span className="text-muted"> · {reviewDate(r.createdAt, t.months)}</span>
                  <span className="mt-0.5 block truncate font-display font-bold text-river">{r.business!.name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
