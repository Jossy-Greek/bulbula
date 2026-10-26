"use client";

import { useSyncExternalStore } from "react";
import type { Content } from "@/data/content";
import { clock, openStatus, parseHours, type OpenStatus } from "@/lib/hours";

// A clock that ticks once a minute, shared by every badge on the page.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
};
const minuteNow = () => Math.floor(Date.now() / 60_000);
// Pages are cached; the server never claims "open" — the browser decides.
const serverNow = () => null;

/** The current minute in the browser; null while rendering on the server. */
export function useMinute() {
  return useSyncExternalStore(subscribe, minuteNow, serverNow);
}

export function useOpenStatus(spec: string | null): OpenStatus | null {
  const tick = useMinute();
  if (tick === null) return null;
  const week = parseHours(spec);
  return week ? openStatus(week) : null;
}

export function isOpen(spec: string | null) {
  const week = parseHours(spec);
  if (!week) return false;
  const s = openStatus(week);
  return s.state === "open" || s.state === "always";
}

export default function OpenBadge({ spec, ui, size = "sm" }: { spec: string | null; ui: Content["ui"]; size?: "sm" | "lg" }) {
  const status = useOpenStatus(spec);
  if (!status) return null;
  const open = status.state === "open" || status.state === "always";
  const label = status.state === "always" ? ui.open24 : open ? ui.openNow : ui.closedNow;
  const detail =
    status.state === "open"
      ? ui.until.replace("{t}", clock(status.closesAt))
      : status.state === "closed"
        ? status.today
          ? ui.opensToday.replace("{t}", clock(status.opensAt))
          : ui.opensDay.replace("{d}", ui.days[status.opensDay]).replace("{t}", clock(status.opensAt))
        : null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${size === "lg" ? "text-sm" : "text-[13px]"}`}>
      <span className={`h-2 w-2 flex-none rounded-full ${open ? "bg-[#1e8a4c]" : "bg-[#b4402b]"}`} aria-hidden="true" />
      <strong className={open ? "text-[#17703d]" : "text-[#a3321f]"}>{label}</strong>
      {detail ? <span className="text-muted">· {detail}</span> : null}
    </span>
  );
}
