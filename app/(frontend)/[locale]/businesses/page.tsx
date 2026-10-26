import { Suspense } from "react";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import DirectoryBrowser from "@/components/DirectoryBrowser";
import { getContent, isLocale } from "@/data/content";
import { getCategories, getListings } from "@/lib/directory";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/businesses">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getContent(locale).listPage.title };
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
          <Suspense>
            <DirectoryBrowser listings={listings} categories={categories} c={{ locale, ui: c.ui }} />
          </Suspense>
        </div>
      </main>
      <Footer c={c} />
    </>
  );
}
