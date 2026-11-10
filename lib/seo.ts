import type { Metadata } from "next";
import { site } from "@/data/site";
import type { Locale } from "@/data/content";

/** The public address (also the base for relative image and canonical URLs). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbula-directory.vercel.app";

export const brand = (locale: Locale) => (locale === "am" ? site.nameAm : site.nameEn);

/**
 * Canonical and language links for a page (`path` after the locale, "" for home). A child
 * page's `alternates` replaces the layout's, so every page passes its own.
 */
export function alternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: { en: `/en${path}`, am: `/am${path}`, "x-default": `/en${path}` },
  };
}

/**
 * Where a place is, without saying the area twice: listings' landmarks often already end in
 * "Bole Bulbula" ("93 Mazoria, Bole Bulbula").
 */
export function placeLine(where: string | null | undefined, locale: Locale) {
  const area = locale === "am" ? site.areaAm : site.areaEn;
  if (!where) return area;
  return /bulbula|ቡልቡላ/i.test(where) ? `${where}${locale === "am" ? "፣ አዲስ አበባ" : ", Addis Ababa"}` : `${where}, ${area}`;
}

/** Search-result and link-preview text, trimmed to what Google shows (~160 characters). */
export function clip(text: string, max = 158) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/[\s,;:—–-]+\S*$/, "")}…`;
}
