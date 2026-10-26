import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import AddForm from "@/components/AddForm";
import { getContent, isLocale } from "@/data/content";
import { getCategories, getListing, getListings } from "@/lib/directory";

// Reads ?claim=, so it renders per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/add">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getContent(locale).addPage.title };
}

export default async function AddPage({ params, searchParams }: PageProps<"/[locale]/add">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const sp = await searchParams;
  const claimSlug = typeof sp.claim === "string" ? sp.claim : undefined;
  const listings = await getListings(locale);
  const categories = await getCategories(locale, listings);
  const claimed = claimSlug ? await getListing(claimSlug, locale) : null;
  const claim = claimed
    ? { slug: claimed.slug, name: claimed.name, categoryId: categories.find((x) => x.slug === claimed.category.slug)?.id }
    : undefined;
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={c.addPage.eyebrow} title={c.addPage.title} intro={c.addPage.intro} />
      <main className="py-10 sm:py-14">
        <div className="container-x max-w-3xl">
          <AddForm t={c.addPage} locale={locale} categories={categories} claim={claim} />
        </div>
      </main>
      <Footer c={c} />
    </>
  );
}
