"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/** What a click on an outgoing link means, from its href (no markup needed for the common ones). */
function actionFor(a: HTMLAnchorElement): string | null {
  const own = a.dataset.track;
  if (own) return own;
  const href = a.getAttribute("href") ?? "";
  if (href.startsWith("tel:")) return "call";
  if (/google\.[a-z.]+\/maps\/dir|\/maps\/dir\//.test(href)) return "directions";
  if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(href)) return "maps";
  if (/t\.me\/share|telegram\.me\/share/.test(href)) return "telegram";
  if (/facebook\.com|instagram\.com|t\.me\//.test(href)) return "social";
  if (/\/add\?claim=/.test(href)) return "claim";
  if (/^https?:\/\//.test(href) && !href.startsWith(location.origin) && !/openstreetmap|leafletjs/.test(href)) return "website";
  return null;
}

/**
 * Counts page views (on every client-side navigation too) and clicks on calls,
 * directions, maps, websites and shares. Business cards carry data-slug so a
 * click from a list is credited to the right business.
 */
export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    track({ type: "pageview" });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a, button[data-track]");
      if (!el) return;
      const action = el instanceof HTMLAnchorElement ? actionFor(el) : (el as HTMLElement).dataset.track ?? null;
      if (!action) return;
      const slug = (el.closest("[data-slug]") as HTMLElement | null)?.dataset.slug;
      track({ type: "action", action, slug });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
