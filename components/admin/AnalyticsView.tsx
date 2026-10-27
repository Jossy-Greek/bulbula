import Link from "next/link";
import { redirect } from "next/navigation";
import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import { ArrowDownRight, ArrowUpRight, Eye, MousePointerClick, Radio, Search, Users } from "lucide-react";
import AnalyticsChart from "./AnalyticsChart";
import ExcludeMe from "./ExcludeMe";
import { buildReport, RANGES, type Kpi, type Range } from "@/lib/analytics";

const ACTION_LABELS: Record<string, string> = {
  call: "Calls",
  directions: "Directions",
  maps: "Opened in Google Maps",
  website: "Website visits",
  social: "Social links",
  share: "Shares",
  telegram: "Shared to Telegram",
  copy: "Links copied",
  claim: "Claim clicks",
};

function Delta({ k }: { k: Kpi }) {
  if (!k.previous) return <span className="an-delta an-delta--flat">no data for the previous period</span>;
  const pct = Math.round(((k.value - k.previous) / k.previous) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`an-delta ${up ? "an-delta--up" : "an-delta--down"}`}>
      <Icon size={14} aria-hidden="true" /> {up ? "+" : ""}
      {pct}% <span>vs previous period</span>
    </span>
  );
}

function Bars({ rows, total, empty, label }: { rows: { key: string; count: number }[]; total?: number; empty: string; label?: (k: string) => React.ReactNode }) {
  if (!rows.length) return <p className="an-empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  const sum = total ?? rows.reduce((s, r) => s + r.count, 0);
  return (
    <ul className="an-bars">
      {rows.map((r) => (
        <li key={r.key} title={`${r.key}: ${r.count}`}>
          <span className="an-bars__label">{label ? label(r.key) : r.key}</span>
          <span className="an-bars__track" aria-hidden="true">
            <span className="an-bars__fill" style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="an-bars__n">
            {r.count.toLocaleString("en")}
            <small>{Math.round((r.count / sum) * 100)}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** /admin/analytics: a small, private Google-Analytics-style report for the directory. */
export default async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  if (!req.user) redirect("/admin/login?redirect=%2Fadmin%2Fanalytics");

  const asked = Number(searchParams?.range);
  const range: Range = (RANGES as readonly number[]).includes(asked) ? (asked as Range) : 30;
  const r = await buildReport(req.payload, range);

  const kpis = [
    { icon: Users, label: "Visitors", k: r.kpis.visitors },
    { icon: Eye, label: "Page views", k: r.kpis.pageviews },
    { icon: MousePointerClick, label: "Leads sent to businesses", hint: "calls, directions, maps, websites", k: r.kpis.leads },
    { icon: Search, label: "Searches", k: r.kpis.searches },
  ];

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="an gutter--left gutter--right">
        <header className="an-head">
          <div>
            <p className="bb-hero__eyebrow an-eyebrow">Bulbula Directory</p>
            <h1>Analytics</h1>
            <p className="an-sub">
              <span className="an-live">
                <Radio size={14} aria-hidden="true" /> {r.live} {r.live === 1 ? "visitor" : "visitors"} in the last 30 minutes
              </span>
            </p>
          </div>
          <nav className="an-range" aria-label="Date range">
            {RANGES.map((d) => (
              <Link key={d} href={`/admin/analytics?range=${d}`} aria-current={d === range ? "page" : undefined}>
                {d} days
              </Link>
            ))}
          </nav>
        </header>

        <ul className="an-kpis">
          {kpis.map(({ icon: I, label, hint, k }) => (
            <li key={label} className="an-kpi">
              <span className="an-kpi__label">
                <I size={16} aria-hidden="true" /> {label}
              </span>
              <span className="an-kpi__value">{k.value.toLocaleString("en")}</span>
              {hint ? <span className="an-kpi__hint">{hint}</span> : null}
              <Delta k={k} />
            </li>
          ))}
        </ul>

        <section className="an-card">
          <AnalyticsChart days={r.days} />
        </section>

        <section className="an-card">
          <header className="an-card__head">
            <h2>Businesses people acted on</h2>
            <p>Page views and what visitors did next. Use these numbers when you talk to owners.</p>
          </header>
          {r.businesses.length ? (
            <div className="an-scroll">
              <table className="an-grid">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Views</th>
                    <th>Calls</th>
                    <th>Directions</th>
                    <th>Google Maps</th>
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>
                  {r.businesses.map((b) => (
                    <tr key={b.slug}>
                      <td>
                        <a href={`/en/b/${b.slug}`} target="_blank" rel="noopener noreferrer">
                          {b.name}
                        </a>
                      </td>
                      <td>{b.views}</td>
                      <td>{b.calls}</td>
                      <td>{b.directions}</td>
                      <td>{b.maps}</td>
                      <td>{b.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="an-empty">No business pages viewed in this period yet.</p>
          )}
        </section>

        <div className="an-cols">
          <section className="an-card">
            <header className="an-card__head">
              <h2>Where visitors come from</h2>
              <p>From the referring site, or ?utm_source= / ?ref= on the link.</p>
            </header>
            <Bars rows={r.sources} empty="No visits yet." />
          </section>
          <section className="an-card">
            <header className="an-card__head">
              <h2>Top pages</h2>
            </header>
            <Bars rows={r.pages} empty="No visits yet." />
          </section>
        </div>

        <div className="an-cols">
          <section className="an-card">
            <header className="an-card__head">
              <h2>What people searched for</h2>
            </header>
            <Bars rows={r.searches} empty="No searches yet." label={(k) => `“${k}”`} />
          </section>
          <section className="an-card">
            <header className="an-card__head">
              <h2>Searches with no results</h2>
              <p>What visitors want that the directory doesn’t have yet. Add these next.</p>
            </header>
            <Bars rows={r.emptySearches} empty="Every search found something." label={(k) => `“${k}”`} />
          </section>
        </div>

        <div className="an-cols an-cols--3">
          <section className="an-card">
            <header className="an-card__head">
              <h2>Actions</h2>
            </header>
            <Bars rows={r.actions} empty="No clicks yet." label={(k) => ACTION_LABELS[k] ?? k} />
          </section>
          <section className="an-card">
            <header className="an-card__head">
              <h2>Devices</h2>
            </header>
            <Bars rows={r.devices} empty="No visits yet." label={(k) => k[0].toUpperCase() + k.slice(1)} />
          </section>
          <section className="an-card">
            <header className="an-card__head">
              <h2>Language</h2>
            </header>
            <Bars rows={r.locales} empty="No visits yet." />
            <header className="an-card__head an-card__head--sub">
              <h2>Categories browsed</h2>
            </header>
            <Bars rows={r.filters} empty="No category filters used yet." />
          </section>
        </div>

        <footer className="an-foot">
          <ExcludeMe />
          <p>
            Counted on this site’s own server: no cookies, no IP addresses stored, bots and link previews ignored. {r.total.toLocaleString("en")} events in this
            period.
          </p>
        </footer>
      </div>
    </DefaultTemplate>
  );
}
