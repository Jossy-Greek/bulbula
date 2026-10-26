import { Mail, Phone } from "lucide-react";
import { Wordmark } from "./Nav";
import SocialIcon from "./SocialIcon";
import type { Content } from "@/data/content";
import { site } from "@/data/site";
import { localeHref } from "@/lib/href";

export default function Footer({ c }: { c: Content }) {
  const heading = "text-[12px] font-bold uppercase tracking-[0.14em] text-marigold-soft/80";
  return (
    <footer className="ripples relative mt-auto overflow-hidden bg-river text-white">
      <div className="container-x relative py-12">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark c={c} dark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{c.footer.blurb}</p>
          </div>
          <div className="md:col-span-3">
            <h3 className={heading}>{c.footer.explore}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[...c.nav, c.cta].map((l) => (
                <li key={l.href}>
                  <a href={localeHref(c.locale, l.href)} className="text-white/85 hover:text-marigold-soft">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <h3 className={heading}>{c.footer.contact}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-marigold" aria-hidden="true" />
                <a href={site.operator.phoneHref} className="hover:text-marigold-soft">{site.operator.phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-marigold" aria-hidden="true" />
                <a href={`mailto:${site.operator.email}`} className="break-all hover:text-marigold-soft">{site.operator.email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <SocialIcon platform="Telegram" className="h-4 w-4 text-marigold" />
                <a href={site.operator.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-marigold-soft">{site.operator.telegramHandle}</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/55">
          © {new Date().getFullYear()} {c.locale === "am" ? site.nameAm : site.nameEn}. {c.footer.rights}
        </p>
      </div>
    </footer>
  );
}
