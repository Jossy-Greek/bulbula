import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { alternates } from "@/lib/seo";
import { getContent, isLocale } from "@/data/content";
import { UPDATED, privacy } from "@/data/privacy";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const p = privacy[locale];
  return { title: p.title, description: p.intro, alternates: alternates(locale, "/privacy") };
}

/** The privacy policy, linked from the footer and from the Google Play listing. */
export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const p = privacy[locale];
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={c.footer.privacy} title={p.title} intro={p.intro} />
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
