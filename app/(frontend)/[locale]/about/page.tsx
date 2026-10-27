import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import SocialIcon from "@/components/SocialIcon";
import { getContent, isLocale } from "@/data/content";
import { site } from "@/data/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getContent(locale).aboutPage.title };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = getContent(locale);
  const a = c.aboutPage;
  return (
    <>
      <Nav c={c} />
      <PageHero eyebrow={a.eyebrow} title={a.title} intro={a.intro} />
      <main className="py-12 sm:py-16">
        <div className="container-x grid gap-6 lg:grid-cols-3">
          {a.sections.map((s) => (
            <section key={s.title} className="rounded-2xl border border-border bg-raised p-7">
              <h2 className="font-display text-xl font-bold text-river">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            </section>
          ))}
          <section className="rounded-2xl bg-river p-7 text-white lg:col-span-3">
            <h2 className="font-display text-xl font-bold">{a.contactTitle}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-white/90">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-marigold" aria-hidden="true" />
                <a href={site.operator.phoneHref}>{site.operator.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-marigold" aria-hidden="true" />
                <a href={`mailto:${site.operator.email}`}>{site.operator.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <SocialIcon platform="Telegram" className="h-4 w-4 text-marigold" />
                <a href={site.operator.telegram} target="_blank" rel="noopener noreferrer">{site.operator.telegramHandle}</a>
              </li>
            </ul>
            <p className="mt-6 text-xs text-white/60">
              Map data ©{" "}
              <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
                OpenStreetMap
              </a>{" "}
              contributors, available under the Open Database License.
            </p>
            <p className="mt-2 text-xs text-white/60">{a.privacy}</p>
          </section>
        </div>
      </main>
      <Footer c={c} />
    </>
  );
}
