import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Globe, Lock, Navigation, Phone, Star, Users } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import OwnerShare from "@/components/OwnerShare";
import { getContent, isLocale } from "@/data/content";
import { ownerStats } from "@/data/owner-stats";
import { site } from "@/data/site";
import { localeHref } from "@/lib/href";
import { SITE_URL } from "@/lib/seo";
import { findByStatsKey, getOwnerStats, type Window } from "@/lib/owner-stats";

// The key is checked on every visit, so a replaced link stops working at once.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Owner stats",
  // A private page: never in search results, and its address isn't sent on to sites it links to.
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** An owner's private page: what people did with their listing in the last 30 days. */
export default async function OwnerStatsPage({ params }: PageProps<"/[locale]/stats/[key]">) {
  const { locale, key } = await params;
  if (!isLocale(locale)) notFound();
  const place = await findByStatsKey(key, locale);
  if (!place?.slug) notFound();
  const stats = await getOwnerStats(place.id, place.slug);
  const c = getContent(locale);
  const t = ownerStats[locale];
  const name = place.name;
  const pagePath = localeHref(locale, `/b/${place.slug}`);
  const pageUrl = `${SITE_URL}${pagePath}`;

  const cards: { k: keyof Window & keyof typeof t.cards; icon: typeof Users }[] = [
    { k: "visits", icon: Users },
    { k: "calls", icon: Phone },
    { k: "directions", icon: Navigation },
    { k: "links", icon: Globe },
  ];
  const change = (k: keyof Window) => {
    const d = stats.now[k] - stats.before[k];
    return d > 0 ? { text: fill(t.up, { n: d }), tone: "text-teal-text" } : d < 0 ? { text: fill(t.down, { n: -d }), tone: "text-muted" } : { text: t.same, tone: "text-muted" };
  };

  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={t.eyebrow} title={name} intro={t.intro} />
      <main className="py-12 sm:py-16">
        <div className="container-x max-w-4xl space-y-10">
          {stats.now.visits === 0 ? <p className="rounded-xl bg-marigold-soft/60 px-4 py-3 text-ink ring-1 ring-marigold/40">{t.empty}</p> : null}

          <section className="grid grid-cols-2 gap-3 sm:gap-4">
            {cards.map(({ k, icon: Icon }) => {
              const ch = change(k);
              return (
                <div key={k} className="rounded-2xl border border-border bg-raised p-4 sm:p-6">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-tint text-teal-text">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="text-sm font-semibold leading-snug text-river sm:text-base">{t.cards[k]}</h2>
                  </div>
                  <p className="font-display mt-3 text-4xl font-extrabold sm:mt-4 sm:text-5xl text-river">{stats.now[k]}</p>
                  <p className="mt-1 text-xs text-muted sm:text-sm">{t.hints[k]}</p>
                  <p className={`mt-3 text-xs font-semibold sm:text-sm ${ch.tone}`}>{ch.text}</p>
                </div>
              );
            })}
          </section>

          <section className="flex flex-wrap gap-x-8 gap-y-2 text-ink">
            {stats.now.shares ? <p>{stats.now.shares === 1 ? t.shareOnce : fill(t.shares, { n: stats.now.shares })}</p> : null}
            <p className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-marigold" aria-hidden="true" />
              {stats.reviews ? `${stats.reviews === 1 ? t.review : fill(t.reviews, { n: stats.reviews })} · ${fill(t.rating, { r: stats.rating ?? "" })}` : t.noReviews}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-raised p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-river">{t.growTitle}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-ink">
              {t.grow.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="mt-5 break-all text-sm text-muted">{pageUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <OwnerShare url={pageUrl} name={name} copyText={t.copyLink} copiedText={t.copied} telegramText={t.shareTelegram} />
              <Link href={pagePath} className="btn btn-outline">
                {t.viewPage}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={site.operator.telegram} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                {t.askUpdate}
              </a>
            </div>
          </section>

          <section className="grid gap-6 text-sm text-muted sm:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-river">
                <Lock className="h-4 w-4" aria-hidden="true" />
                {t.privateTitle}
              </h2>
              <p className="mt-1">{t.private}</p>
            </div>
            <div>
              <h2 className="font-semibold text-river">{t.howTitle}</h2>
              <p className="mt-1">{t.how}</p>
            </div>
          </section>
        </div>
      </main>
      <Footer c={c} />
    </>
  );
}
