import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import BusinessCard from "@/components/BusinessCard";
import CategoryIcon from "@/components/CategoryIcon";
import MapLoader from "@/components/MapLoader";
import HeroSearch from "@/components/HeroSearch";
import LatestReviews from "@/components/LatestReviews";
import { getContent, isLocale } from "@/data/content";
import { getCategories, getListings, googleMapsUrl } from "@/lib/directory";
import { localeHref } from "@/lib/href";
import { getLatestReviews } from "@/lib/reviews";

// Admin edits refresh pages at once (lib/revalidate.ts); this is the fallback.
export const revalidate = 300;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const listings = await getListings(locale);
  const categories = await getCategories(locale, listings);
  const latestReviews = await getLatestReviews(locale);
  const withCount = categories.filter((x) => x.count > 0);
  const points = listings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({ slug: l.slug, name: l.name, category: l.category.name, group: l.category.group, claimed: l.claimed, lat: l.lat!, lng: l.lng!, mapsUrl: googleMapsUrl(l) }));
  const showcase = listings.filter((l) => l.category.group === "business").slice(0, 6);

  return (
    <>
      <Nav c={c} />
      <section className="ripples relative z-10 overflow-x-clip bg-river text-white">
        <div className="container-x relative pb-14 pt-[calc(72px+4rem)] sm:pb-20 lg:pt-[calc(72px+5.5rem)]">
          <p className="eyebrow eyebrow-on-dark rise rise-1">{c.hero.eyebrow}</p>
          <h1 className="font-display rise rise-2 mt-5 max-w-3xl text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-[68px]">{c.hero.title}</h1>
          <p className="rise rise-3 mt-5 max-w-xl text-[17px] leading-relaxed text-white/80">{c.hero.body}</p>

          <div className="rise rise-4 relative z-30 mt-9">
            <HeroSearch
              locale={locale}
              ui={c.ui}
              categories={withCount.map((x) => ({ slug: x.slug, name: x.name, icon: x.icon, count: x.count }))}
              places={listings.map((l) => ({ slug: l.slug, name: l.name, category: l.category.name, icon: l.category.icon }))}
            />
          </div>

          <ul className="rise rise-4 -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {withCount
              .filter((x) => x.group === "business")
              .slice(0, 5)
              .map((x) => (
                <li key={x.slug} className="flex-none">
                  <Link
                    href={`${localeHref(locale, "/businesses")}?c=${x.slug}`}
                    className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
                  >
                    <CategoryIcon name={x.icon} className="h-4 w-4 text-marigold" /> {x.name}
                  </Link>
                </li>
              ))}
          </ul>

          <dl className="rise rise-4 mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dd className="font-display text-4xl font-extrabold">{listings.length}</dd>
              <dt className="text-sm text-white/65">{c.hero.stats.businesses}</dt>
            </div>
            <div>
              <dd className="font-display text-4xl font-extrabold">{withCount.length}</dd>
              <dt className="text-sm text-white/65">{c.hero.stats.categories}</dt>
            </div>
          </dl>
        </div>
      </section>

      <main>
        <section className="py-14 sm:py-20">
          <div className="container-x">
            <SectionHeader eyebrow={c.categoriesSection.eyebrow} title={c.categoriesSection.title} locale={locale} />
            {(["business", "community"] as const).map((group) => {
              const list = withCount.filter((x) => x.group === group);
              if (!list.length) return null;
              return (
                <div key={group} className="mt-6 first:mt-0">
                  <h3 className="mb-3 text-sm font-semibold text-muted">{group === "business" ? c.ui.businesses : c.ui.community}</h3>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {list.map((x) => (
                      <li key={x.slug}>
                        <Link
                          href={`${localeHref(locale, "/businesses")}?c=${x.slug}`}
                          className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-raised p-4 transition-colors hover:border-teal"
                        >
                          <span className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${group === "community" ? "bg-river text-white" : "bg-tint text-teal-text group-hover:bg-marigold group-hover:text-ink"}`}>
                            <CategoryIcon name={x.icon} />
                          </span>
                          <span className="font-display text-[15px] font-bold leading-snug text-river">{x.name}</span>
                          <span className="mt-auto text-xs text-muted">{x.count === 1 ? c.ui.resultOne : c.ui.results.replace("{n}", String(x.count))}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-raised py-14 sm:py-20">
          <div className="container-x">
            <SectionHeader eyebrow={c.mapSection.eyebrow} title={c.mapSection.title} locale={locale} />
            <p className="-mt-4 mb-6 text-muted">{c.mapSection.body}</p>
            <MapLoader points={points} locale={locale} detailsLabel={c.ui.details} mapsLabel={c.ui.openInMaps} />
            <p className="mt-2 text-xs text-muted">{c.ui.osmCredit}</p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="container-x">
            <SectionHeader eyebrow={c.newest.eyebrow} title={c.newest.title} link={c.newest.link} locale={locale} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((l) => (
                <BusinessCard key={l.id} l={l} c={c} />
              ))}
            </ul>
          </div>
        </section>

        <LatestReviews reviews={latestReviews} c={c} />

        <section className="bg-marigold">
          <div className="container-x flex flex-col gap-6 py-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-river sm:text-4xl">{c.ownerBand.title}</h2>
              <p className="mt-2 max-w-2xl text-ink/80">{c.ownerBand.body}</p>
            </div>
            <Link href={localeHref(locale, "/add")} className="btn btn-river flex-none">
              <Plus className="h-4 w-4" aria-hidden="true" /> {c.ownerBand.button} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer c={c} />
    </>
  );
}
