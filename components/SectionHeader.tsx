import { ArrowRight } from "lucide-react";
import type { Locale } from "@/data/content";
import { localeHref } from "@/lib/href";

type Props = { eyebrow: string; title: string; link?: { label: string; href: string }; locale: Locale; dark?: boolean };

export default function SectionHeader({ eyebrow, title, link, locale, dark = false }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className={`eyebrow ${dark ? "eyebrow-on-dark" : ""}`}>{eyebrow}</p>
        <h2 className={`font-display mt-3 text-[1.9rem] font-extrabold leading-tight tracking-tight sm:text-[2.4rem] ${dark ? "text-white" : "text-river"}`}>{title}</h2>
      </div>
      {link ? (
        <a href={localeHref(locale, link.href)} className={`action-link flex-none ${dark ? "on-dark" : ""}`}>
          {link.label} <ArrowRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
