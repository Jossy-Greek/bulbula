"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import Nav from "@/components/Nav";
import { getContent, isLocale } from "@/data/content";
import { localeHref } from "@/lib/href";

/**
 * Unknown pages and places, in the page's language, with the site's nav, a search box and a
 * way back (instead of Next's plain default 404). A client component so it can read the locale.
 */
export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale && isLocale(params.locale) ? params.locale : "en";
  const c = getContent(locale);
  const t = c.notFound;
  return (
    <>
      <Nav c={c} />
      <main className="container-x flex flex-1 flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-6xl font-extrabold text-teal">404</p>
        <h1 className="font-display mt-4 text-3xl font-extrabold text-river">{t.title}</h1>
        <p className="mt-3 max-w-md text-muted">{t.body}</p>
        <form action={localeHref(locale, "/businesses")} className="mt-8 flex w-full max-w-md gap-2">
          <label className="sr-only" htmlFor="nf-q">{t.search}</label>
          <input id="nf-q" name="q" placeholder={t.search} className="field flex-1" />
          <button type="submit" className="btn btn-river">
            <Search className="h-4 w-4" aria-hidden="true" /> {t.searchButton}
          </button>
        </form>
        <div className="mt-6 flex gap-4 text-sm font-semibold">
          <Link href={localeHref(locale, "/")} className="action-link">{t.home}</Link>
          <Link href={localeHref(locale, "/businesses")} className="action-link">{t.browse}</Link>
        </div>
      </main>
    </>
  );
}
