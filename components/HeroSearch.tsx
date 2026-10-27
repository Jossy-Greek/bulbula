"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import { matchesQuery } from "@/lib/search";
import { localeHref } from "@/lib/href";
import type { Content } from "@/data/content";

type Place = { slug: string; name: string; category: string; icon: string };
type Cat = { slug: string; name: string; icon: string; count: number };
type Option = { kind: "category" | "place" | "search"; label: string; sub?: string; icon?: string; href: string };

/**
 * The home-page search with suggestions as you type: matching categories and
 * places, then "search for …". Keyboard: ↑ ↓ to move, Enter to open, Esc to close.
 * Without JavaScript it is still a plain GET form to /businesses?q=.
 */
export default function HeroSearch({ locale, ui, places, categories }: { locale: Content["locale"]; ui: Content["ui"]; places: Place[]; categories: Cat[] }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLFormElement>(null);
  const list = localeHref(locale, "/businesses");

  const options = useMemo<Option[]>(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    const cats = categories
      .filter((c) => c.count > 0 && matchesQuery(c.name, t))
      .slice(0, 3)
      .map((c) => ({ kind: "category" as const, label: c.name, sub: ui.results.replace("{n}", String(c.count)), icon: c.icon, href: `${list}?c=${c.slug}` }));
    const found = places
      .filter((p) => matchesQuery(`${p.name} ${p.category}`, t))
      .slice(0, 5)
      .map((p) => ({ kind: "place" as const, label: p.name, sub: p.category, icon: p.icon, href: localeHref(locale, `/b/${p.slug}`) }));
    return [...cats, ...found, { kind: "search" as const, label: `“${t}”`, sub: ui.searchButton, href: `${list}?q=${encodeURIComponent(t)}` }];
  }, [q, places, categories, list, locale, ui]);

  const show = open && options.length > 0;
  const go = (o: Option) => {
    setOpen(false);
    router.push(o.href);
  };

  return (
    <form
      ref={box}
      action={list}
      role="search"
      onSubmit={(e) => {
        if (show && options[active]) {
          e.preventDefault();
          go(options[active]);
        }
      }}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      className="relative flex max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)]"
    >
      <label className="relative flex-1">
        <span className="sr-only">{ui.search}</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          name="q"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={show}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={show ? `${id}-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % options.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + options.length) % options.length);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={ui.searchShort}
          className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-[16px] text-ink placeholder:text-[#7b8c8f] focus:outline-none"
        />
      </label>
      <button type="submit" className="btn btn-marigold">
        {ui.searchButton}
      </button>

      {show ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[60vh] overflow-auto rounded-2xl border border-border bg-raised p-1.5 text-left shadow-[0_24px_60px_-24px_rgba(14,61,71,0.55)]"
        >
          {options.map((o, i) => (
            <li
              key={o.href}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so blur doesn't close before the click
                go(o);
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-tint" : ""}`}
            >
              <span className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${o.kind === "category" ? "bg-marigold-soft text-amber-text" : "bg-tint text-teal-text"}`}>
                {o.kind === "search" ? <Search className="h-4 w-4" aria-hidden="true" /> : <CategoryIcon name={o.icon!} className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{o.label}</span>
                {o.sub ? <span className="block truncate text-[13px] text-muted">{o.sub}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
