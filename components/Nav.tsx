"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Menu, Plus, X } from "lucide-react";
import Mark from "./Mark";
import type { Content, Locale } from "@/data/content";
import { site } from "@/data/site";
import { localeHref } from "@/lib/href";

function swapLocale(pathname: string, locale: Locale) {
  return `/${locale}${pathname.replace(/^\/(en|am)(?=\/|$)/, "")}`;
}

function LanguageSwitch({ c, pathname, className = "" }: { c: Content; pathname: string; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = pathname.startsWith("/am") ? "am" : "en";
  const go = (locale: Locale) => {
    if (locale !== active) startTransition(() => router.push(swapLocale(pathname, locale), { scroll: false }));
  };
  const cls = (l: Locale) => (l === active ? "text-river" : "text-river/45 transition-colors hover:text-river");
  return (
    <p className={`text-[14px] font-semibold ${pending ? "opacity-70" : ""} ${className}`} aria-label={c.ui.language}>
      <button type="button" onClick={() => go("en")} lang="en" aria-pressed={active === "en"} className={cls("en")}>
        EN
      </button>
      <span className="mx-1.5 text-border">/</span>
      <button type="button" onClick={() => go("am")} lang="am" aria-pressed={active === "am"} className={cls("am")}>
        አማ
      </button>
    </p>
  );
}

export function Wordmark({ c, dark = false }: { c: Content; dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark className="h-10 w-10 flex-none" dark={dark} />
      <span className="flex flex-col leading-tight">
        <span className={`font-display text-[17px] font-extrabold tracking-tight ${dark ? "text-white" : "text-river"}`}>
          {c.locale === "am" ? site.nameAm : site.nameEn}
        </span>
        <span className={`text-[11.5px] font-medium ${dark ? "text-marigold-soft" : "text-teal-text"}`}>{c.locale === "am" ? site.areaAm : site.areaEn}</span>
      </span>
    </span>
  );
}

export default function Nav({ c }: { c: Content }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const isActive = (href: string) => {
    const target = localeHref(c.locale, href);
    return pathname === target || (href !== "/" && pathname.startsWith(`${target}/`));
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-[1000] border-b border-border bg-raised/95 text-river backdrop-blur ${open ? "flex max-h-dvh flex-col" : ""}`}>
      <div className="container-x flex h-[72px] shrink-0 items-center gap-6">
        <Link href={`/${c.locale}`} onClick={() => setOpen(false)}>
          <Wordmark c={c} />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Primary">
          {c.nav.map((l) => (
            <Link
              key={l.href}
              href={localeHref(c.locale, l.href)}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`text-[15px] font-semibold transition-colors hover:text-teal-text ${isActive(l.href) ? "text-teal-text underline decoration-marigold decoration-2 underline-offset-8" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <LanguageSwitch c={c} pathname={pathname} />
          <Link href={localeHref(c.locale, c.cta.href)} className="btn btn-marigold h-11 px-4">
            <Plus className="h-4 w-4" aria-hidden="true" /> {c.cta.label}
          </Link>
        </nav>
        <button
          type="button"
          aria-label={open ? c.ui.closeMenu : c.ui.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-river/20 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-border bg-raised md:hidden" aria-label="Menu">
          <div className="container-x grid gap-1 py-5">
            {c.nav.map((l) => (
              <Link key={l.href} href={localeHref(c.locale, l.href)} onClick={() => setOpen(false)} className="font-display py-2 text-2xl font-bold">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-4">
              <LanguageSwitch c={c} pathname={pathname} />
              <Link href={localeHref(c.locale, c.cta.href)} onClick={() => setOpen(false)} className="btn btn-marigold h-11 px-4">
                <Plus className="h-4 w-4" aria-hidden="true" /> {c.cta.label}
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
