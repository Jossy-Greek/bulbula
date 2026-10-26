/**
 * "Open now" for OpenStreetMap-style opening hours, in Addis Ababa time.
 *
 * Understands the subset our data uses: "24/7"; rules separated by ";", each
 * "<days> <ranges>" or "<days> off", e.g. "Mo-Fr 08:00-18:00; Sa 08:00-12:00,14:00-17:00; Su off".
 * Days are lists and ranges of Mo..Su; a rule without days covers every day;
 * a later rule replaces earlier ones for the days it names (as in OSM).
 * Anything else (free text an owner typed) is "unknown" — we never guess.
 */

const DAY_KEYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Range = [start: number, end: number]; // minutes from midnight; end may exceed 1440 (past midnight)
export type Week = Range[][]; // index 0 = Monday

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function parseHours(spec: string | null | undefined): Week | null {
  if (!spec) return null;
  const s = spec.trim();
  if (s === "24/7") return DAY_KEYS.map(() => [[0, 1440]]);
  const week: Week = DAY_KEYS.map(() => []);
  for (const rule of s.split(";").map((r) => r.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(.*)$/);
    if (!m) return null;
    const days = m[1] ? expandDays(m[1]) : [0, 1, 2, 3, 4, 5, 6];
    const body = m[2].trim();
    if (!days) return null;
    let ranges: Range[] = [];
    if (body !== "off" && body !== "closed") {
      const parts = body.split(",").map((p) => p.trim());
      for (const p of parts) {
        const r = p.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
        if (!r) return null;
        const a = toMin(r[1]);
        let b = toMin(r[2]);
        if (b <= a) b += 1440;
        ranges.push([a, b]);
      }
      ranges = ranges.sort((x, y) => x[0] - y[0]);
    }
    for (const d of days) week[d] = ranges;
  }
  return week;
}

function expandDays(list: string): number[] | null {
  const out = new Set<number>();
  for (const part of list.split(",").filter(Boolean)) {
    const [a, b] = part.split("-");
    const i = DAY_KEYS.indexOf(a as (typeof DAY_KEYS)[number]);
    const j = b ? DAY_KEYS.indexOf(b as (typeof DAY_KEYS)[number]) : i;
    if (i < 0 || j < 0) return null;
    for (let k = i; ; k = (k + 1) % 7) {
      out.add(k);
      if (k === j) break;
    }
  }
  return [...out];
}

/** Day of week (0 = Monday) and minutes since midnight, in Addis Ababa. */
export function addisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Addis_Ababa", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus =
  | { state: "always" }
  | { state: "open"; closesAt: number } // minutes; may exceed 1440
  | { state: "closed"; opensDay: number; opensAt: number; today: boolean }
  | { state: "closed-week" };

export function openStatus(week: Week, now = addisNow()): OpenStatus {
  if (week.every((d) => d.length === 1 && d[0][0] === 0 && d[0][1] >= 1440)) return { state: "always" };
  const { day, minutes } = now;
  // A range from yesterday that runs past midnight.
  const prev = week[(day + 6) % 7];
  for (const [, b] of prev) if (b > 1440 && minutes < b - 1440) return { state: "open", closesAt: b - 1440 };
  for (const [a, b] of week[day]) {
    if (minutes >= a && minutes < b) return { state: "open", closesAt: b };
  }
  for (let k = 0; k < 7; k++) {
    const d = (day + k) % 7;
    const next = week[d].find(([a]) => k > 0 || a > minutes);
    if (next) return { state: "closed", opensDay: d, opensAt: next[0], today: k === 0 };
  }
  return { state: "closed-week" };
}

export const clock = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
