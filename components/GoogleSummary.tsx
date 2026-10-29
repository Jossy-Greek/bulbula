import { ExternalLink } from "lucide-react";
import Stars from "./Stars";
import type { Content } from "@/data/content";
import type { Listing } from "@/lib/directory";

/**
 * The Google Maps rating as copied into our database: the average, the
 * reviews per star and the topics Google says reviews mention. Review text
 * stays on Google (it belongs to its authors), so the box links there.
 */
export default function GoogleSummary({ google, mapsUrl, ui }: { google: NonNullable<Listing["google"]>; mapsUrl: string; ui: Content["ui"] }) {
  const max = Math.max(1, ...(google.stars ?? []));
  return (
    <section aria-labelledby="google-summary" className="rounded-2xl border border-border bg-raised p-6">
      <h2 id="google-summary" className="font-display text-xl font-bold text-river">
        {ui.googleBoxTitle}
      </h2>
      <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-4">
        <div>
          <p className="font-display text-4xl font-extrabold text-river">{google.rating.toFixed(1)}</p>
          <Stars value={google.rating} />
          <p className="mt-1 text-sm text-muted">{ui.onGoogle.replace("{n}", String(google.count))}</p>
        </div>
        {google.stars ? (
          <ul className="min-w-[12rem] flex-1 space-y-1.5" aria-label={ui.googleBoxTitle}>
            {[5, 4, 3, 2, 1].map((n) => {
              const count = google.stars![n - 1];
              return (
                <li key={n} className="flex items-center gap-2 text-xs text-muted">
                  <span className="w-3 text-right font-semibold text-ink" aria-hidden="true">{n}</span>
                  <span className="sr-only">{ui.starsRow.replace("{n}", String(n))}:</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-tint" aria-hidden="true">
                    <span className="block h-full rounded-full bg-marigold" style={{ width: `${(count / max) * 100}%` }} />
                  </span>
                  <span className="w-8 text-right tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {google.topics.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-river">{ui.peopleMention}</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {google.topics.map((t) => (
              <li key={t.label} className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-teal-text">
                {t.label} <span className="font-normal text-muted">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-text hover:underline">
        {ui.readReviewsOnGoogle} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  );
}
