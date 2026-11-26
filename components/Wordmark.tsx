import Mark from "./Mark";
import type { Locale } from "@/data/content";
import { site } from "@/data/site";

/** The logo with the directory's name and area, in the nav and the footer. */
export default function Wordmark({ locale, dark = false }: { locale: Locale; dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark className="h-10 w-10 flex-none" dark={dark} />
      <span className="flex flex-col leading-tight">
        <span className={`font-display text-[17px] font-extrabold tracking-tight ${dark ? "text-white" : "text-river"}`}>
          {locale === "am" ? site.nameAm : site.nameEn}
        </span>
        <span className={`text-[11.5px] font-medium ${dark ? "text-marigold-soft" : "text-teal-text"}`}>{locale === "am" ? site.areaAm : site.areaEn}</span>
      </span>
    </span>
  );
}
