"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { List, LocateFixed, Map as MapIcon, Search, X } from "lucide-react";
import BusinessCard from "./BusinessCard";
import CategoryIcon from "./CategoryIcon";
import MapLoader from "./MapLoader";
import { isOpen, useMinute } from "./OpenBadge";
import type { Content } from "@/data/content";
import type { CategoryInfo, Listing } from "@/lib/directory";
import { track } from "@/lib/track";

function matches(l: Listing, q: string) {
  const hay = `${l.name} ${l.category.name} ${l.landmark ?? ""} ${l.address ?? ""} ${l.description ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/** Great-circle distance in metres. */
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const chip = (on: boolean) =>
  `flex h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold ring-1 transition-colors ${on ? "bg-river text-white ring-river" : "bg-raised text-river ring-border hover:ring-teal"}`;

/**
 * Search, filters and the list + map view. Patterns from Google Maps, Yelp and
 * Airbnb: an "Open now" filter, "Near me" sorting, a sticky map beside the list
 * that shows exactly the filtered places (hovering a card lights its pin), and
 * a Map/List switch on phones. Query, category and "open now" live in the URL
 * (?q=&c=&open=1) so a filtered view can be shared.
 */
export default function DirectoryBrowser({ listings, categories, c }: { listings: Listing[]; categories: CategoryInfo[]; c: Pick<Content, "locale" | "ui"> }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(params.get("c") ?? "");
  const [openOnly, setOpenOnly] = useState(params.get("open") === "1");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState<"idle" | "busy" | "failed">("idle");
  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const minute = useMinute(); // re-filter "open now" as the clock moves
  const mapBox = useRef<HTMLDivElement>(null);

  const sync = (next: { q?: string; c?: string; open?: boolean }) => {
    const v = { q, c: cat, open: openOnly, ...next };
    const sp = new URLSearchParams();
    if (v.q) sp.set("q", v.q);
    if (v.c) sp.set("c", v.c);
    if (v.open) sp.set("open", "1");
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const locate = () => {
    if (me) return setMe(null);
    if (!("geolocation" in navigator)) return setLocating("failed");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating("idle");
      },
      () => setLocating("failed"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const shown = useMemo(() => {
    const list = listings
      .filter((l) => (!cat || l.category.slug === cat) && (!q.trim() || matches(l, q)) && (!openOnly || (minute !== null && isOpen(l.hoursSpec))))
      .map((l) => ({ l, d: me && l.lat != null && l.lng != null ? metres(me, { lat: l.lat, lng: l.lng }) : null }));
    if (me) list.sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
    return list;
  }, [listings, q, cat, openOnly, me, minute]);

  // Analytics: a search counts once typing settles (with its result count, so
  // searches that find nothing show up as gaps); a category pick counts at once.
  const settledQ = q.trim();
  useEffect(() => {
    if (settledQ.length < 2) return;
    const t = setTimeout(() => track({ type: "search", query: settledQ, results: shown.length }), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- count the result size at the time the query settles
  }, [settledQ]);
  useEffect(() => {
    if (cat) track({ type: "filter", query: cat });
  }, [cat]);

  const points = shown
    .filter(({ l }) => l.lat != null && l.lng != null)
    .map(({ l }) => ({ slug: l.slug, name: l.name, category: l.category.name, group: l.category.group, claimed: l.claimed, lat: l.lat!, lng: l.lng!, mapsUrl: l.mapsUrl }));
  const used = categories.filter((x) => x.count > 0);
  const filtered = Boolean(cat || q || openOnly || me);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <label className="relative block flex-1 lg:max-w-xl">
          <span className="sr-only">{c.ui.search}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              sync({ q: e.target.value });
            }}
            placeholder={c.ui.searchShort}
            className="field h-13 text-[16px]"
            style={{ paddingLeft: "3rem" }}
          />
        </label>
        <p className="text-sm font-semibold text-muted" aria-live="polite">
          {shown.length === 1 ? c.ui.resultOne : c.ui.results.replace("{n}", String(shown.length))}
        </p>
      </div>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          aria-pressed={openOnly}
          onClick={() => {
            setOpenOnly(!openOnly);
            sync({ open: !openOnly });
          }}
          className={chip(openOnly)}
        >
          <span className={`h-2 w-2 rounded-full ${openOnly ? "bg-[#7ee2a8]" : "bg-[#1e8a4c]"}`} aria-hidden="true" /> {c.ui.openNow}
        </button>
        <button type="button" aria-pressed={Boolean(me)} onClick={locate} className={chip(Boolean(me))}>
          <LocateFixed className="h-4 w-4" aria-hidden="true" /> {locating === "busy" ? c.ui.locating : c.ui.nearMe}
        </button>
        {locating === "failed" ? (
          <span role="status" className="self-center text-sm text-[#a3321f]">
            {c.ui.noLocation}
          </span>
        ) : null}
      </div>

      <ul className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categories">
        <li>
          <button
            type="button"
            onClick={() => {
              setCat("");
              sync({ c: "" });
            }}
            aria-pressed={!cat}
            className={chip(!cat)}
          >
            {c.ui.all}
          </button>
        </li>
        {used.map((x) => (
          <li key={x.slug}>
            <button
              type="button"
              onClick={() => {
                const next = cat === x.slug ? "" : x.slug;
                setCat(next);
                sync({ c: next });
              }}
              aria-pressed={cat === x.slug}
              className={chip(cat === x.slug)}
            >
              <CategoryIcon name={x.icon} className="h-4 w-4" /> {x.name}
              <span className={`text-xs ${cat === x.slug ? "text-white/70" : "text-muted"}`}>{x.count}</span>
            </button>
          </li>
        ))}
        {filtered ? (
          <li>
            <button
              type="button"
              aria-label="Clear filters"
              onClick={() => {
                setQ("");
                setCat("");
                setOpenOnly(false);
                setMe(null);
                sync({ q: "", c: "", open: false });
              }}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-muted ring-1 ring-border hover:text-river"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ) : null}
      </ul>

      <div className="mt-6 pb-20 lg:grid lg:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-6">
        <div className={view === "map" ? "hidden lg:block" : ""}>
          {shown.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {shown.map(({ l, d }) => (
                <BusinessCard key={l.id} l={l} c={c} distance={d} active={active === l.slug} onActive={setActive} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-raised p-8 text-center text-muted">{c.ui.noResults}</p>
          )}
        </div>
        <div ref={mapBox} className={`${view === "map" ? "block" : "hidden"} scroll-mt-20 lg:block`}>
          <div className="lg:sticky lg:top-[88px]">
            <MapLoader
              points={points}
              locale={c.locale}
              detailsLabel={c.ui.details}
              mapsLabel={c.ui.openInMaps}
              activeSlug={active}
              fit
              height="calc(100svh - 120px)"
            />
            <p className="mt-2 text-xs text-muted">{c.ui.osmCredit}</p>
          </div>
        </div>
      </div>

      {/* Phones: one view at a time, switched by a floating pill (Airbnb / Google Maps pattern). */}
      <button
        type="button"
        onClick={() => {
          const next = view === "list" ? "map" : "list";
          setView(next);
          // Bring the map (or the top of the list) under the filters into view.
          requestAnimationFrame(() => (next === "map" ? mapBox.current : document.querySelector("main"))?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }}
        className="fixed bottom-5 left-1/2 z-[900] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-river px-5 py-3 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(14,61,71,0.8)] lg:hidden"
      >
        {view === "list" ? (
          <>
            <MapIcon className="h-4 w-4" aria-hidden="true" /> {c.ui.showMap}
          </>
        ) : (
          <>
            <List className="h-4 w-4" aria-hidden="true" /> {c.ui.showList}
          </>
        )}
      </button>
    </div>
  );
}
