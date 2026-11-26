import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import BusinessCard from "@/components/BusinessCard";
import CategoryLinks from "@/components/CategoryLinks";
import { SITE_URL, alternates } from "@/lib/seo";
import { localeHref } from "@/lib/href";
import { getContent, isLocale, locales } from "@/data/content";
import { getCategories, getListings, toCard } from "@/lib/directory";

export const revalidate = 300;

/**
 * One page per category ("Pharmacies in Bole Bulbula"), so a search like "pharmacy in Bole
 * Bulbula" has a page to land on. Its places are in the HTML; the filtered list at
 * /businesses?c= renders in the browser and shares the list page's title.
 */
export async function generateStaticParams() {
  const params = [];
  for (const locale of locales) {
    const categories = await getCategories(locale, await getListings(locale));
    for (const x of categories) if (x.count > 0) params.push({ locale, category: x.slug });
  }
  return params;
}

async function load(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const listings = await getListings(locale);
  const categories = await getCategories(locale, listings);
  const category = categories.find((x) => x.slug === slug && x.count > 0);
  if (!category) return null;
  return { locale, categories, category, places: listings.filter((l) => l.category.slug === slug) };
}

export async function generateMetadata({ params }: PageProps<"/[locale]/businesses/[category]">) {
  const { locale, category } = await params;
  const d = await load(locale, category);
  if (!d) return {};
  const t = getContent(d.locale).categoryPage;
  const fill = (s: string) => s.replace("{c}", d.category.name).replace("{n}", String(d.places.length));
  const title = fill(t.title);
  const description = fill(t.description);
  return { title, description, alternates: alternates(d.locale, `/businesses/${d.category.slug}`), openGraph: { title, description } };
}

export default async function CategoryPage({ params }: PageProps<"/[locale]/businesses/[category]">) {
  const { locale: rawLocale, category: slug } = await params;
  const d = await load(rawLocale, slug);
  if (!d) notFound();
  const { locale, category, places, categories } = d;
  const c = getContent(locale);
  const t = c.categoryPage;
  const fill = (s: string) => s.replace("{c}", category.name).replace("{n}", String(places.length));
  // For Google: the list of places on this page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: fill(t.title),
    itemListElement: places.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/${locale}/b/${l.slug}`, name: l.name })),
  };
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={c.listPage.eyebrow} title={fill(t.title)} intro={fill(t.intro)} />
      <main className="py-10 sm:py-14">
        <div className="container-x">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((l) => (
              <BusinessCard key={l.slug} l={toCard(l)} c={{ locale, ui: c.ui }} />
            ))}
          </ul>
          <p className="mt-8">
            <Link href={localeHref(locale, "/businesses")} className="action-link">
              {t.all}
            </Link>
          </p>
          <CategoryLinks locale={locale} categories={categories} title={t.browse} current={category.slug} />
        </div>
      </main>
      <Footer c={c} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
