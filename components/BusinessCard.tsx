"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, Map as MapIcon, MapPin, Navigation2, Phone } from "lucide-react";
import OpenBadge from "./OpenBadge";
import { parseHours } from "@/lib/hours";
import { telHref } from "@/lib/links";
import CategoryIcon from "./CategoryIcon";
import type { Content } from "@/data/content";
import type { Listing } from "@/lib/directory";
import { localeHref } from "@/lib/href";

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/**
 * One listing in a grid. The name is a stretched link, so the whole card opens
 * the detail page; the Call / Google Maps buttons sit above it (z-10), as on
 * Google Maps result cards. In the list+map view, hovering a card highlights
 * its pin (onActive).
 */
export default function BusinessCard({
  l,
  c,
  distance,
  active = false,
  onActive,
}: {
  l: Listing;
  c: Pick<Content, "locale" | "ui">;
  distance?: number | null;
  active?: boolean;
  onActive?: (slug: string | null) => void;
}) {
  const parseable = Boolean(parseHours(l.hoursSpec));
  return (
    <li
      data-slug={l.slug}
      onMouseEnter={onActive ? () => onActive(l.slug) : undefined}
      onMouseLeave={onActive ? () => onActive(null) : undefined}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-[0_18px_40px_-26px_rgba(14,61,71,0.5)] ${active ? "border-teal ring-2 ring-teal/30" : "border-border"}`}
    >
      {l.photo ? (
        <div className="relative aspect-[16/9] bg-tint">
          <Image src={l.photo.url} alt={l.photo.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${l.category.group === "community" ? "bg-river text-white" : "bg-tint text-teal-text"}`}>
            <CategoryIcon name={l.category.icon} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-bold leading-snug text-river">
              <Link href={localeHref(c.locale, `/b/${l.slug}`)} className="after:absolute after:inset-0">
                {l.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-[13px] text-muted">{l.category.name}</p>
          </div>
          {l.claimed ? (
            <BadgeCheck className="ml-auto h-5 w-5 flex-none text-teal" aria-label={c.ui.verified} />
          ) : null}
        </div>
        {l.description ? <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-ink/85">{l.description}</p> : null}
        <ul className="mt-auto space-y-1.5 pt-4 text-[13px] text-muted">
          {l.landmark ? (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-none text-teal" aria-hidden="true" /> <span className="truncate">{l.landmark}</span>
            </li>
          ) : null}
          {l.hours ? (
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 flex-none text-teal" aria-hidden="true" />
              {parseable ? <OpenBadge spec={l.hoursSpec} ui={c.ui} /> : <span className="truncate">{l.hours}</span>}
            </li>
          ) : null}
          {distance != null ? (
            <li className="flex items-center gap-2">
              <Navigation2 className="h-3.5 w-3.5 flex-none text-teal" aria-hidden="true" /> {c.ui.away.replace("{d}", formatDistance(distance))}
            </li>
          ) : null}
          {l.phone ? (
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-none text-teal" aria-hidden="true" /> {l.phone}
            </li>
          ) : null}
        </ul>
        <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {l.phone ? (
            <a href={telHref(l.phone)} className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-tint px-3 text-[13px] font-semibold text-teal-text hover:bg-marigold-soft hover:text-river">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {c.ui.call}
            </a>
          ) : null}
          <a href={l.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-tint px-3 text-[13px] font-semibold text-teal-text hover:bg-marigold-soft hover:text-river">
            <MapIcon className="h-3.5 w-3.5" aria-hidden="true" /> Google Maps
          </a>
          {l.unconfirmed ? (
            <span className="ml-auto rounded-full bg-marigold-soft px-2.5 py-1 text-[11px] font-semibold text-amber-text">{c.ui.unconfirmed}</span>
          ) : !l.claimed ? (
            <span className="ml-auto rounded-full bg-page px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-border">{c.ui.unclaimed}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
