/**
 * Paid extras (Featured place, a weekly offer) run until an end date. A date is a whole day:
 * an end date of 15 Jan still counts on 15 Jan (Addis is UTC+3; a day's grace covers it).
 * No end date = on until the admin unticks it (e.g. featured for free).
 */
const DAY = 86_400_000;

export function activeUntil(on: boolean, until: string | null | undefined, now = Date.now()): boolean {
  if (!on) return false;
  if (!until) return true;
  return new Date(until).getTime() + DAY > now;
}

/** Whole days left until an end date (0 = ends today), or null without one. */
export function daysLeft(until: string | null | undefined, now = Date.now()): number | null {
  if (!until) return null;
  return Math.max(0, Math.floor((new Date(until).getTime() + DAY - now) / DAY));
}

/** "15 Jan 2027" — the same in both languages (Gregorian dates, as the rest of the site). */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Addis_Ababa" });
