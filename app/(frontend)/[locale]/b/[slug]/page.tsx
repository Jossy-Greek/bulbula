import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Clock, ExternalLink, Globe, Info, Map as MapIcon, MapPin, Navigation, Phone } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CategoryIcon from "@/components/CategoryIcon";
import MapLoader from "@/components/MapLoader";
import SocialIcon from "@/components/SocialIcon";
import OpenBadge from "@/components/OpenBadge";
import ShareButtons from "@/components/ShareButtons";
import { site } from "@/data/site";
import { getContent, isLocale, locales } from "@/data/content";
import { directionsUrl, externalUrl, getListing, getListings, googleMapsUrl, telHref } from "@/lib/directory";
import { localeHref } from "@/lib/href";

export const revalidate = 300;
// New listings published after a deploy are rendered on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  const all = await getListings("en");
  return locales.flatMap((locale) => all.map((l) => ({ locale, slug: l.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/b/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const l = await getListing(slug, locale);
  return l ? { title: `${l.name} — ${l.category.name}`, description: l.description ?? undefined } : {};
}

export default async function BusinessPage({ params }: PageProps<"/[locale]/b/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const l = await getListing(slug, locale);
  if (!l) notFound();
  const maps = googleMapsUrl(l);
  const socials = (
    [
      ["Facebook", l.facebook],
      ["Instagram", l.instagram],
      ["Telegram", l.telegram],
    ] as const
  ).filter(([, u]) => Boolean(u)) as [ "Facebook" | "Instagram" | "Telegram", string][];

  return (
    <>
      <Nav c={c} />
      <section className="ripples relative overflow-hidden bg-river text-white">
        <div className="container-x relative pb-10 pt-[calc(72px+2.5rem)] sm:pb-14">
          <Link href={localeHref(locale, "/businesses")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {c.ui.back}
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-marigold text-river">
              <CategoryIcon name={l.category.icon} className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-marigold-soft">{l.category.name}</p>
              <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-tight tracking-tight sm:text-5xl">{l.name}</h1>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                {l.claimed ? (
                  <>
                    <BadgeCheck className="h-3.5 w-3.5 text-marigold" aria-hidden="true" /> {c.ui.verified}
                  </>
                ) : l.unconfirmed ? (
                  c.ui.unconfirmed
                ) : (
                  c.ui.unclaimed
                )}
              </p>
            </div>
          </div>
          {/* On phones the sticky bottom bar carries these. */}
          <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
            {l.phone ? (
              <a href={telHref(l.phone)} className="btn btn-marigold">
                <Phone className="h-4 w-4" aria-hidden="true" /> {c.ui.call}
              </a>
            ) : null}
            {l.website ? (
              <a href={externalUrl(l.website)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
                <Globe className="h-4 w-4" aria-hidden="true" /> {c.ui.website}
              </a>
            ) : null}
            <a href={maps} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
              <MapIcon className="h-4 w-4" aria-hidden="true" /> {c.ui.openInMaps}
            </a>
            <a href={directionsUrl(l)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
              <Navigation className="h-4 w-4" aria-hidden="true" /> {c.ui.directions}
            </a>
          </div>
        </div>
      </section>

      <main className="py-10 sm:py-14">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {l.photo ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-tint">
                <Image src={l.photo.url} alt={l.photo.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
              </div>
            ) : null}
            {l.description ? (
              <div className="rounded-2xl border border-border bg-raised p-6">
                <p className="text-[17px] leading-relaxed text-ink">{l.description}</p>
                {l.generated ? (
                  <p className="mt-3 flex items-start gap-2 text-xs text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" /> {c.ui.generated}
                  </p>
                ) : null}
              </div>
            ) : null}
            {l.lat != null && l.lng != null ? (
              <div>
                <MapLoader
                  points={[{ slug: l.slug, name: l.name, category: l.category.name, group: l.category.group, claimed: l.claimed, lat: l.lat, lng: l.lng, mapsUrl: maps }]}
                  locale={locale}
                  detailsLabel={c.ui.details}
                  mapsLabel={c.ui.openInMaps}
                  showDetails={false}
                  center={{ lat: l.lat, lng: l.lng }}
                  zoom={17}
                  height={340}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <a href={maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-text hover:underline">
                    {c.ui.openInMaps} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  {l.source === "osm" ? <p className="text-xs text-muted">{c.ui.osmCredit}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <dl className="divide-y divide-border rounded-2xl border border-border bg-raised">
              {l.landmark || l.address ? (
                <div className="flex gap-3 p-5">
                  <MapPin className="mt-0.5 h-5 w-5 flex-none text-teal" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{c.ui.address}</dt>
                    <dd className="mt-1 text-ink">
                      {l.landmark}
                      {l.landmark && l.address ? <br /> : null}
                      {l.address}
                    </dd>
                  </div>
                </div>
              ) : null}
              {l.hours ? (
                <div className="flex gap-3 p-5">
                  <Clock className="mt-0.5 h-5 w-5 flex-none text-teal" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{c.ui.hours}</dt>
                    <dd className="mt-1 text-ink">{l.hours}</dd>
                    <dd className="mt-1.5">
                      <OpenBadge spec={l.hoursSpec} ui={c.ui} size="lg" />
                    </dd>
                  </div>
                </div>
              ) : null}
              {l.phone || l.phone2 ? (
                <div className="flex gap-3 p-5">
                  <Phone className="mt-0.5 h-5 w-5 flex-none text-teal" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{c.ui.phone}</dt>
                    {[l.phone, l.phone2].filter(Boolean).map((p) => (
                      <dd key={p} className="mt-1">
                        <a href={telHref(p!)} className="font-semibold text-teal-text hover:underline">{p}</a>
                      </dd>
                    ))}
                  </div>
                </div>
              ) : null}
              {l.website || socials.length ? (
                <div className="flex gap-3 p-5">
                  <Globe className="mt-0.5 h-5 w-5 flex-none text-teal" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{c.ui.socials}</dt>
                    {l.website ? (
                      <dd className="mt-1 truncate">
                        <a href={externalUrl(l.website)} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-text hover:underline">
                          {l.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      </dd>
                    ) : null}
                    {socials.length ? (
                      <dd className="mt-2 flex gap-2">
                        {socials.map(([p, u]) => (
                          <a key={p} href={externalUrl(u)} target="_blank" rel="noopener noreferrer" aria-label={p} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-river hover:border-teal">
                            <SocialIcon platform={p} className="h-4 w-4" />
                          </a>
                        ))}
                      </dd>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </dl>

            <div className="space-y-3">
              <ShareButtons name={l.name} ui={c.ui} />
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{c.ui.source[l.source]}</span>
                <span aria-hidden="true">·</span>
                <a
                  href={`mailto:${site.operator.email}?subject=${encodeURIComponent(`${c.ui.suggestEdit}: ${l.name}`)}&body=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${locale}/b/${l.slug}\n\n`)}`}
                  className="font-semibold text-teal-text hover:underline"
                >
                  {c.ui.suggestEdit}
                </a>
              </p>
            </div>

            {!l.claimed ? (
              <div className="rounded-2xl bg-marigold-soft/60 p-6 ring-1 ring-marigold/40">
                <p className="font-display text-lg font-bold text-river">{c.ui.claim}</p>
                <p className="mt-1 text-sm text-ink/80">{c.ui.claimHint}</p>
                {l.unconfirmed ? (
                  <p className="mt-2 text-xs text-muted">{c.ui.unconfirmedHint}</p>
                ) : l.source === "osm" ? (
                  <p className="mt-2 text-xs text-muted">{c.ui.unclaimedHint}</p>
                ) : null}
                <Link href={`${localeHref(locale, "/add")}?claim=${l.slug}`} className="action-link mt-4">
                  {c.ui.claim} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      {/* Phones: the three things people come for, always under the thumb (Yelp / Google Maps pattern). */}
      <nav
        aria-label={l.name}
        className="fixed inset-x-0 bottom-0 z-[900] grid auto-cols-fr grid-flow-col gap-2 border-t border-border bg-raised/95 px-4 pt-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {l.phone ? (
          <a href={telHref(l.phone)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-marigold text-[15px] font-bold text-ink">
            <Phone className="h-4 w-4" aria-hidden="true" /> {c.ui.call}
          </a>
        ) : null}
        <a href={maps} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-tint text-[15px] font-bold text-teal-text">
          <MapIcon className="h-4 w-4" aria-hidden="true" /> {c.ui.showMap}
        </a>
        <a href={directionsUrl(l)} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-river text-[15px] font-bold text-white">
          <Navigation className="h-4 w-4" aria-hidden="true" /> {c.ui.directions}
        </a>
      </nav>
      <Footer c={c} />
      <div className="h-[76px] bg-river lg:hidden" aria-hidden="true" />
    </>
  );
}
