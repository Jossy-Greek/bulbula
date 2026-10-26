import type { Locale } from "@/data/content";

/** A site path in the given language: "/businesses" → "/am/businesses". External links pass through. */
export function localeHref(locale: Locale, href: string) {
  if (!href.startsWith("/")) return href;
  const rest = href === "/" ? "" : href.replace(/^\/(?=#|\?)/, "");
  return `/${locale}${rest}`;
}
