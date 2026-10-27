/** Sends one analytics event to /e. Browser only; never throws. */

type Event =
  | { type: "pageview" }
  | { type: "action"; action: string; slug?: string }
  | { type: "search"; query: string; results: number }
  | { type: "filter"; query: string };

export const OPT_OUT_KEY = "bb-no-track";
const SOURCE_KEY = "bb-source";

let lastView = { path: "", at: 0 };

/**
 * Where this visit came from: ?utm_source= / ?ref= or the external referrer of the
 * landing page, kept for the browser session so later pages in the same visit
 * are credited to it too (the query string is gone after the first click).
 */
function visitSource(): { utm?: string; ref?: string } {
  const params = new URLSearchParams(location.search);
  const utm = params.get("utm_source") || params.get("ref") || undefined;
  const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : undefined;
  try {
    if (utm || ref) sessionStorage.setItem(SOURCE_KEY, JSON.stringify({ utm, ref }));
    else return JSON.parse(sessionStorage.getItem(SOURCE_KEY) ?? "{}");
  } catch {}
  return { utm, ref };
}

export function track(e: Event) {
  try {
    if (typeof window === "undefined" || localStorage.getItem(OPT_OUT_KEY) === "1") return;
    const path = location.pathname;
    if (e.type === "pageview") {
      // One view per path change (React may run the effect twice in development).
      if (lastView.path === path && Date.now() - lastView.at < 2000) return;
      lastView = { path, at: Date.now() };
    }
    const body = JSON.stringify({
      ...e,
      path,
      locale: path.split("/")[1],
      slug: "slug" in e && e.slug ? e.slug : path.match(/^\/[a-z]{2}\/b\/([^/]+)/)?.[1],
      ...visitSource(),
    });
    if (!navigator.sendBeacon?.("/e", body)) fetch("/e", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // analytics must never break the page
  }
}
