import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { alternates } from "@/lib/seo";
import { getContent, isLocale } from "@/data/content";
import { UPDATED, terms } from "@/data/terms";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const p = terms[locale];
  return { title: p.title, description: p.intro, alternates: alternates(locale, "/terms") };
}

/** The terms of use, linked from the footer and from the add and review forms. */
export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const p = terms[locale];
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={c.footer.terms} title={p.title} intro={p.intro} />
      <main className="py-12 sm:py-16">
        <article className="container-x max-w-3xl space-y-10">
          <p className="text-sm text-muted">
            {p.updated}: <time dateTime={UPDATED}>{UPDATED}</time>
          </p>
          {p.sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl font-bold text-river">{s.title}</h2>
              <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-ink">
                {s.body.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </main>
      <Footer c={c} />
    </>
  );
}
