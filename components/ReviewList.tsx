"use client";

import { useState } from "react";
import type { Content } from "@/data/content";
import type { Review } from "@/lib/reviews";
import { reviewDate } from "@/lib/dates";
import Stars from "./Stars";

const FIRST = 5;

function ReviewItem({ r, t, ui }: { r: Review; t: Content["reviews"]; ui: Content["ui"] }) {
  const [open, setOpen] = useState(false);
  const long = (r.text?.length ?? 0) > 220;
  return (
    <li className="border-t border-border py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-tint text-sm font-bold text-teal-text" aria-hidden="true">
          {r.author[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <span className="block truncate font-semibold text-ink">{r.author}</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            <Stars value={r.rating} size={12} />
            <span className="sr-only">{t.stars[r.rating - 1]}</span>
            {reviewDate(r.createdAt, t.months)}
          </span>
        </div>
      </div>
      {r.text ? <p className={`mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink ${long && !open ? "line-clamp-4" : ""}`}>{r.text}</p> : null}
      {long ? (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 text-sm font-semibold text-teal-text hover:underline">
          {open ? ui.showLess : ui.readMore}
        </button>
      ) : null}
    </li>
  );
}

export default function ReviewList({ reviews, t, ui }: { reviews: Review[]; t: Content["reviews"]; ui: Content["ui"] }) {
  const [all, setAll] = useState(false);
  const shown = all ? reviews : reviews.slice(0, FIRST);
  return (
    <>
      <ul className="mt-5">
        {shown.map((r) => (
          <ReviewItem key={r.id} r={r} t={t} ui={ui} />
        ))}
      </ul>
      {reviews.length > FIRST && !all ? (
        <button type="button" onClick={() => setAll(true)} className="mt-1 text-sm font-semibold text-teal-text hover:underline">
          {t.showAll.replace("{n}", String(reviews.length))}
        </button>
      ) : null}
    </>
  );
}
