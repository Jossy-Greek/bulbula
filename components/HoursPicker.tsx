"use client";

import { useState } from "react";
import { ethiopianClock, hoursSpec, type DayHours } from "@/lib/hours";
import type { Content } from "@/data/content";

type Text = Content["addPage"]["fields"]["hoursPicker"];
type Mode = "skip" | "set" | "always";

// `.field` is full width; a time box only needs its own.
const TIME = { width: "auto", paddingBlock: "0.4rem", paddingInline: "0.6rem" } as const;

/** Most shops here: Monday to Saturday, 8 to 6. A starting point the owner changes. */
const START: DayHours[] = Array.from({ length: 7 }, (_, i) => ({ open: i < 6, from: "08:00", to: "18:00" }));

/**
 * Opening hours as a week of on/off days with times, sent as the
 * OpenStreetMap-style spec in a hidden `hours` field, so the place gets the
 * "Open now" badge. Nothing is sent until the visitor chooses to set hours:
 * guessed hours would be worse than none.
 */
export default function HoursPicker({ t, label, ethiopian }: { t: Text; label: string; ethiopian: boolean }) {
  const [mode, setMode] = useState<Mode>("skip");
  const [days, setDays] = useState(START);
  const spec = mode === "always" ? "24/7" : mode === "set" ? hoursSpec(days) : "";
  const change = (i: number, patch: Partial<DayHours>) => setDays((d) => d.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const copyFirst = () => {
    const first = days.find((d) => d.open) ?? days[0];
    setDays((d) => d.map((x) => (x.open ? { ...x, from: first.from, to: first.to } : x)));
  };

  const chip =
    "flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:border-teal has-[:checked]:border-teal has-[:checked]:bg-tint";
  return (
    <fieldset className="sm:col-span-2">
      <legend className="label">{label}</legend>
      <input type="hidden" name="hours" value={spec} />
      <div className="flex flex-wrap gap-2">
        {(["skip", "set", "always"] as const).map((m) => (
          <label key={m} className={chip}>
            <input type="radio" name="hoursMode" value={m} checked={mode === m} onChange={() => setMode(m)} className="accent-[#1f7a85]" />
            {t.modes[m]}
          </label>
        ))}
      </div>

      {mode === "set" ? (
        <div className="mt-4 space-y-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border px-3 py-2">
              <label className="flex w-28 flex-none cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                <input type="checkbox" checked={d.open} onChange={(e) => change(i, { open: e.target.checked })} className="h-4 w-4 accent-[#1f7a85]" />
                {t.days[i]}
              </label>
              {d.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    step={900}
                    required
                    aria-label={`${t.days[i]} ${t.from}`}
                    value={d.from}
                    onChange={(e) => change(i, { from: e.target.value })}
                    className="field"
                    style={TIME}
                  />
                  <span aria-hidden="true" className="text-muted">–</span>
                  <input
                    type="time"
                    step={900}
                    required
                    aria-label={`${t.days[i]} ${t.to}`}
                    value={d.to}
                    onChange={(e) => change(i, { to: e.target.value })}
                    className="field"
                    style={TIME}
                  />
                </div>
              ) : (
                <span className="text-sm text-muted">{t.closed}</span>
              )}
              {ethiopian && d.open && d.from && d.to ? (
                <span className="basis-full text-xs text-muted sm:basis-auto">
                  ({ethiopianClock(d.from)} – {ethiopianClock(d.to)})
                </span>
              ) : null}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button type="button" onClick={copyFirst} className="text-sm font-semibold text-teal-text underline-offset-2 hover:underline">
              {t.copyFirst}
            </button>
            <span className="text-xs text-muted">{t.lateHint}</span>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
