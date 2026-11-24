import { Suspense } from "react";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import DirectoryBrowser from "@/components/DirectoryBrowser";
import BusinessCard from "@/components/BusinessCard";
import CategoryLinks from "@/components/CategoryLinks";
import { alternates } from "@/lib/seo";
import { getContent, isLocale } from "@/data/content";
import { getCategories, getListings } from "@/lib/directory";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/businesses">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = getContent(locale);
  return {
    title: c.listPage.title,
    description: c.meta.businesses,
    alternates: alternates(locale, "/businesses"),
    openGraph: { title: c.listPage.title, description: c.meta.businesses },
  };
}

export default async function BusinessesPage({ params }: PageProps<"/[locale]/businesses">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const listings = await getListings(locale);
  const categories = await getCategories(locale, listings);
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={c.listPage.eyebrow} title={c.listPage.title} intro={c.listPage.intro} />
      <main className="py-10 sm:py-14">
        <div className="container-x">
          {/* The browser reads ?q= and ?c= from the URL, which needs a Suspense boundary on a static page. */}
          {/* Until the browser takes over, the first places are plain HTML: search engines and slow phones see them. */}
          <Suspense
            fallback={
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.slice(0, 24).map((l) => (
                  <BusinessCard key={l.slug} l={l} c={{ locale, ui: c.ui }} />
                ))}
              </ul>
            }
          >
            <DirectoryBrowser listings={listings} categories={categories} c={{ locale, ui: c.ui }} />
          </Suspense>
          <CategoryLinks locale={locale} categories={categories} title={c.categoryPage.browse} />
        </div>
      </main>
      <Footer c={c} />
    </>
  );
}
