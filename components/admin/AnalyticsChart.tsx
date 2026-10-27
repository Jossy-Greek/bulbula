"use client";

import { useMemo, useRef, useState } from "react";

type Point = { date: string; visitors: number; pageviews: number };
type Metric = "visitors" | "pageviews";

const W = 820;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 30, left: 44 };
const SERIES = "#1f7a85"; // brand teal: 5.0:1 on white
const GRID = "#e4ebea";
const INK_MUTED = "#4b5f63";

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= v)! * pow;
  return step * 4;
}
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n));
// Formatted by hand: Intl output differs between Node and browsers ("Tue, 27 Oct" vs
// "Tue 27 Oct"), which breaks hydration.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmtDay = (iso: string, long = false) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const short = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return long ? `${WEEKDAYS[d.getUTCDay()]} ${short}` : short;
};

/** Visitors or page views per day: one series at a time, with a crosshair tooltip and a table view. */
export default function AnalyticsChart({ days }: { days: Point[] }) {
  const [metric, setMetric] = useState<Metric>("visitors");
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const { xs, ys, max, path, area } = useMemo(() => {
    const values = days.map((d) => d[metric]);
    const max = niceMax(Math.max(...values, 0));
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const xs = days.map((_, i) => PAD.left + (days.length === 1 ? iw / 2 : (i * iw) / (days.length - 1)));
    const ys = values.map((v) => PAD.top + ih - (v / max) * ih);
    const path = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join("");
    const area = `${path}L${xs[xs.length - 1].toFixed(1)},${PAD.top + ih}L${xs[0].toFixed(1)},${PAD.top + ih}Z`;
    return { xs, ys, max, path, area };
  }, [days, metric]);

  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));
  const total = days.reduce((s, d) => s + d[metric], 0);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    setHover(best);
  };

  return (
    <div className="an-chart">
      <div className="an-chart__head">
        <div>
          <h2>{metric === "visitors" ? "Visitors per day" : "Page views per day"}</h2>
          <p>
            {total.toLocaleString("en")} in {days.length} days{metric === "visitors" ? " · each visitor counted once a day, without cookies" : ""}
          </p>
        </div>
        <div className="an-seg" role="group" aria-label="Metric">
          {(["visitors", "pageviews"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}>
              {m === "visitors" ? "Visitors" : "Page views"}
            </button>
          ))}
        </div>
      </div>

      <div className="an-chart__plot">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metric} per day, ${days.length} days`}>
          {ticks.map((t) => {
            const y = PAD.top + (H - PAD.top - PAD.bottom) * (1 - t / max);
            return (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill={INK_MUTED}>
                  {compact(t)}
                </text>
              </g>
            );
          })}
          {days.map((d, i) =>
            i % labelEvery === 0 || i === days.length - 1 ? (
              <text key={d.date} x={xs[i]} y={H - 8} textAnchor="middle" fontSize={11} fill={INK_MUTED}>
                {fmtDay(d.date)}
              </text>
            ) : null,
          )}
          <path d={area} fill={SERIES} fillOpacity={0.1} />
          <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null ? (
            <g pointerEvents="none">
              <line x1={xs[hover]} x2={xs[hover]} y1={PAD.top} y2={H - PAD.bottom} stroke="#9fb2b4" strokeWidth={1} />
              <circle cx={xs[hover]} cy={ys[hover]} r={5} fill={SERIES} stroke="#fff" strokeWidth={2} />
            </g>
          ) : null}
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {hover !== null ? (
          <div className="an-tip" style={{ left: `${(xs[hover] / W) * 100}%`, top: `${(ys[hover] / H) * 100}%` }}>
            <strong>{days[hover][metric].toLocaleString("en")}</strong> {metric === "visitors" ? "visitors" : "page views"}
            <span>{fmtDay(days[hover].date, true)}</span>
          </div>
        ) : null}
      </div>

      <details className="an-table">
        <summary>Show as table</summary>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Visitors</th>
              <th>Page views</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date}>
                <td>{fmtDay(d.date, true)}</td>
                <td>{d.visitors}</td>
                <td>{d.pageviews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
