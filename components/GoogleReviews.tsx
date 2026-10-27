"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Phone, Star, TriangleAlert } from "lucide-react";
import type { Content } from "@/data/content";
import { telHref } from "@/lib/links";

/**
 * Rating, reviews, phone and hours for one place, fetched live from Google
 * (Maps JavaScript API, Places library) in the visitor's browser.
 *
 * Google's terms: nothing here is stored on our side (only the place ID,
 * which may be stored); Google is credited; each review shows its author.
 * Cost: one Place Details request per page view, made only when the section
 * scrolls into view, and at most once per place per page session.
 * Without NEXT_PUBLIC_GOOGLE_MAPS_API_KEY the section never renders.
 */

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Review = {
  authorAttribution?: { displayName: string; uri?: string; photoURI?: string };
  rating?: number;
  text?: string;
  relativePublishTimeDescription?: string;
  googleMapsURI?: string;
};
type Details = {
  rating?: number;
  userRatingCount?: number;
  reviews?: Review[];
  nationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  websiteURI?: string;
  googleMapsURI?: string;
  businessStatus?: string;
};

// Minimal typings for the bits of the Maps JS API we use (no @types package).
type PlacesLib = { Place: new (o: { id: string; requestedLanguage?: string }) => Details & { fetchFields(o: { fields: string[] }): Promise<unknown> } };
declare global {
  interface Window {
    google?: { maps?: { importLibrary?: (name: string) => Promise<unknown> } };
    __bbMapsReady?: () => void;
  }
}

const FIELDS = ["rating", "userRatingCount", "reviews", "nationalPhoneNumber", "regularOpeningHours", "websiteURI", "googleMapsURI", "businessStatus"];
const memo = new Map<string, Promise<Details>>(); // this page session only
let loader: Promise<void> | null = null;

function loadMaps(language: string) {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    window.__bbMapsReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY!)}&v=weekly&loading=async&language=${language}&callback=__bbMapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return loader;
}

function fetchDetails(placeId: string, language: string): Promise<Details> {
  let p = memo.get(placeId);
  if (!p) {
    p = (async () => {
      await loadMaps(language);
      const { Place } = (await window.google!.maps!.importLibrary!("places")) as PlacesLib;
      const place = new Place({ id: placeId, requestedLanguage: language });
      await place.fetchFields({ fields: FIELDS });
      // Copy into a plain object for rendering; it lives only in this page's memory.
      return {
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        reviews: place.reviews?.slice(0, 5),
        nationalPhoneNumber: place.nationalPhoneNumber,
        regularOpeningHours: place.regularOpeningHours,
        websiteURI: place.websiteURI,
        googleMapsURI: place.googleMapsURI,
        businessStatus: place.businessStatus,
      };
    })();
    memo.set(placeId, p);
  }
  return p;
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? "fill-marigold text-marigold" : "text-border"} />
      ))}
    </span>
  );
}

function ReviewItem({ r, ui }: { r: Review; ui: Content["ui"] }) {
  const [open, setOpen] = useState(false);
  const long = (r.text?.length ?? 0) > 220;
  const a = r.authorAttribution;
  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        {a?.photoURI ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google-hosted author photo, shown as Google requires
          <img src={a.photoURI} alt="" width={32} height={32} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full bg-tint" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-tint text-sm font-bold text-teal-text">{a?.displayName?.[0] ?? "?"}</span>
        )}
        <div className="min-w-0">
          {a?.uri ? (
            <a href={a.uri} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-ink hover:underline">
              {a.displayName}
            </a>
          ) : (
            <span className="block truncate font-semibold text-ink">{a?.displayName}</span>
          )}
          <span className="flex items-center gap-2 text-xs text-muted">
            {r.rating ? <Stars value={r.rating} size={12} /> : null}
            {r.relativePublishTimeDescription}
          </span>
        </div>
      </div>
      {r.text ? (
        <p className={`mt-2 text-[15px] leading-relaxed text-ink ${long && !open ? "line-clamp-4" : ""}`}>{r.text}</p>
      ) : null}
      {long ? (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-sm font-semibold text-teal-text hover:underline">
          {open ? ui.showLess : ui.readMore}
        </button>
      ) : null}
    </li>
  );
}

export default function GoogleReviews({ placeId, hasPhone, ui, locale }: { placeId: string | null; hasPhone: boolean; ui: Content["ui"]; locale: Content["locale"] }) {
  const box = useRef<HTMLElement>(null);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "failed"; data?: Details }>({ status: "idle" });

  useEffect(() => {
    if (!KEY || !placeId || !box.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setState({ status: "loading" });
        fetchDetails(placeId, locale === "am" ? "am" : "en").then(
          (data) => setState({ status: "done", data }),
          (err) => {
            console.warn("Google place details unavailable", err);
            setState({ status: "failed" });
          },
        );
      },
      { rootMargin: "200px" },
    );
    io.observe(box.current);
    return () => io.disconnect();
  }, [placeId, locale]);

  if (!KEY || !placeId || state.status === "failed") return null;
  const d = state.data;
  const empty = state.status === "done" && !d?.rating && !d?.reviews?.length && !d?.nationalPhoneNumber && !d?.regularOpeningHours;
  if (empty) return null;

  return (
    <section ref={box} aria-labelledby="google-title" className="rounded-2xl border border-border bg-raised p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="google-title" className="font-display text-xl font-bold text-river">
          {ui.googleTitle}
        </h2>
        {d?.googleMapsURI ? (
          <a href={d.googleMapsURI} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-text hover:underline">
            {ui.readOnGoogle} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {state.status !== "done" ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <div className="h-5 w-40 animate-pulse rounded bg-tint" />
          <div className="h-16 animate-pulse rounded-xl bg-tint" />
        </div>
      ) : (
        <>
          {d?.businessStatus === "CLOSED_PERMANENTLY" || d?.businessStatus === "CLOSED_TEMPORARILY" ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#fdecea] px-3 py-2 text-sm font-semibold text-[#8f2a1d]">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              {d.businessStatus === "CLOSED_PERMANENTLY" ? ui.googleClosedPermanently : ui.googleClosedTemporarily}
            </p>
          ) : null}

          {d?.rating ? (
            <p className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-display text-3xl font-extrabold text-river">{d.rating.toFixed(1)}</span>
              <Stars value={d.rating} />
              <span className="text-sm text-muted">{ui.googleReviews.replace("{n}", String(d.userRatingCount ?? 0))}</span>
            </p>
          ) : null}

          {d?.nationalPhoneNumber && !hasPhone ? (
            <p className="mt-3">
              <a href={telHref(d.nationalPhoneNumber)} className="inline-flex items-center gap-2 font-semibold text-teal-text hover:underline">
                <Phone className="h-4 w-4" aria-hidden="true" /> {d.nationalPhoneNumber}
              </a>
            </p>
          ) : null}

          {d?.regularOpeningHours?.weekdayDescriptions?.length ? (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-river">{ui.hours}</summary>
              <ul className="mt-2 space-y-0.5 text-ink">
                {d.regularOpeningHours.weekdayDescriptions.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {d?.websiteURI ? (
            <p className="mt-3 truncate text-sm">
              <a href={d.websiteURI} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-text hover:underline">
                {d.websiteURI.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </p>
          ) : null}

          {d?.reviews?.length ? (
            <ul className="mt-5">
              {d.reviews.map((r, i) => (
                <ReviewItem key={r.googleMapsURI ?? i} r={r} ui={ui} />
              ))}
            </ul>
          ) : null}

          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">{ui.fromGoogle}</p>
        </>
      )}
    </section>
  );
}
