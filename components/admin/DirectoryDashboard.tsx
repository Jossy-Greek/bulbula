import Link from "next/link";
import type { Payload } from "payload";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  Globe,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Search,
  Store,
  Users,
} from "lucide-react";
import type { Business, Category, Review } from "@/payload-types";
import ReviewButtons from "./ReviewButtons";
import ModerateReview from "./ModerateReview";

const ADMIN = "/admin/collections";
const DAY = 86_400_000;

function ago(iso: string, now: Date) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const catOf = (b: Business) => (typeof b.category === "object" ? (b.category as Category) : null);
const idOf = (v: Business["claims"]) => (v ? (typeof v === "object" ? v.id : v) : null);
const hasContact = (b: Business) => Boolean(b.phone || b.website || b.facebook || b.instagram || b.telegram);
/** Owner/manager submissions publish as claimed; customers' tips and research leads do not. */
const byOwner = (b: Business) => Boolean(b.submitter?.name) && (b.submitter?.relationship ?? "owner") !== "customer";

function Facts({ b }: { b: Business }) {
  return (
    <span className="bb-queue__facts">
      {b.phone ? (
        <span>
          <Phone size={13} aria-hidden="true" /> {b.phone}
        </span>
      ) : null}
      {b.website ? (
        <span>
          <Globe size={13} aria-hidden="true" /> {b.website}
        </span>
      ) : null}
      {b.landmark ? (
        <span>
          <MapPin size={13} aria-hidden="true" /> {b.landmark}
        </span>
      ) : null}
      {b.lat == null ? <span className="bb-warn">No map pin — add lat/lng first if you can</span> : null}
    </span>
  );
}

function Stat({ icon: Icon, value, label, href, alert }: { icon: LucideIcon; value: number; label: string; href: string; alert?: boolean }) {
  return (
    <a href={href} className={`bb-stat ${alert ? "bb-stat--alert" : ""}`} aria-label={`${label}: ${value}`}>
      <span className="bb-stat__icon">
        <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
        {alert ? <span className="bb-stat__dot" aria-hidden="true" /> : null}
      </span>
      <span>
        <span className="bb-stat__value">{value.toLocaleString("en-US")}</span>
        <span className="bb-stat__label">{label}</span>
      </span>
    </a>
  );
}

function Card({ id, title, intro, children }: { id?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bb-card">
      <header className="bb-card__head">
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </header>
      {children}
    </section>
  );
}

/**
 * The admin home, laid out like the French Chamber workspace: an editorial
 * header with one main action, four live numbers, a "Needs attention" list made
 * only of real work, the queues to act on, and a dark quick-actions panel.
 * Bulbula's own colours (river, teal, marigold); near-square corners.
 */
export default async function DirectoryDashboard({ payload }: { payload: Payload }) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString();
  const [all, cats, waiting, views] = await Promise.all([
    payload.find({ collection: "businesses", locale: "en", limit: 2000, depth: 1, sort: "-createdAt" }),
    payload.find({ collection: "categories", locale: "en", limit: 100, depth: 0, sort: "order" }),
    payload.find({ collection: "reviews", where: { status: { equals: "pending" } }, limit: 100, depth: 0, sort: "createdAt" }),
    payload
      .find({
        collection: "analytics-events",
        where: { and: [{ type: { equals: "pageview" } }, { createdAt: { greater_than: weekAgo } }] },
        select: { visitor: true },
        pagination: false,
        depth: 0,
      })
      .catch(() => ({ docs: [] as { visitor?: string | null }[] })),
  ]);
  const docs = all.docs as Business[];
  const pendingReviews = waiting.docs as Review[];
  const visitors = new Set(views.docs.map((v) => v.visitor).filter(Boolean)).size;

  const published = docs.filter((b) => b.status === "published");
  const pending = docs.filter((b) => b.status === "pending");
  const submissions = pending.filter((b) => b.submitter?.name);
  const leads = pending.filter((b) => !b.submitter?.name);
  const claimed = published.filter((b) => b.claimed);
  const share = published.length ? claimed.length / published.length : 0;
  const byName = new Map(docs.map((b) => [b.id, b.name]));
  const bizOf = (r: Review) => docs.find((b) => b.id === (typeof r.business === "object" ? r.business.id : r.business));
  const waitingCount = submissions.length + pendingReviews.length;
  const firstQueue = submissions.length ? "#submissions" : "#reviews";

  const byCat = new Map<string, Business[]>();
  for (const b of leads) {
    const k = catOf(b)?.name ?? "No category";
    byCat.set(k, [...(byCat.get(k) ?? []), b]);
  }
  const leadGroups = [...byCat]
    .map(([name, items]) => ({ name, items: items.sort((x, y) => x.name.localeCompare(y.name)) }))
    .sort((x, y) => y.items.length - x.items.length);

  const gaps = [
    { label: "No phone, website or social", items: published.filter((b) => !hasContact(b)) },
    { label: "No map pin", items: published.filter((b) => b.lat == null || b.lng == null) },
    { label: "No opening hours", items: published.filter((b) => !b.hours) },
    { label: "Not yet confirmed", items: published.filter((b) => b.unconfirmed) },
  ];
  const perCat = (cats.docs as Category[]).map((c) => ({ c, n: published.filter((b) => catOf(b)?.id === c.id).length }));
  const maxCat = Math.max(1, ...perCat.map((x) => x.n));
  const recent = [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  // Only real, non-zero work appears here, most urgent first.
  const attention = [
    submissions.length > 0 && {
      title: "Review new businesses",
      detail: `${plural(submissions.length, "submission is", "submissions are")} waiting — the oldest from ${ago(submissions[submissions.length - 1].createdAt, now)}.`,
      href: "#submissions",
    },
    pendingReviews.length > 0 && {
      title: "Approve visitor reviews",
      detail: `${plural(pendingReviews.length, "review stays", "reviews stay")} hidden until you publish.`,
      href: "#reviews",
    },
    leads.length > 0 && {
      title: "Verify research leads",
      detail: `${plural(leads.length, "place", "places")} found on maps and directories. Call or visit, then publish.`,
      href: "#leads",
    },
    gaps[0].items.length > 0 && {
      title: "Add contact details",
      detail: `${plural(gaps[0].items.length, "live place has", "live places have")} no phone, website or social link.`,
      href: "#gaps",
    },
  ].filter((x): x is { title: string; detail: string; href: string } => Boolean(x));

  const summary = `${waitingCount ? `${plural(waitingCount, "thing waits", "things wait")} for you.` : "Nothing waits for you."} ${published.length} places are live, ${claimed.length} run by their owners.`;

  const quick: { label: string; href: string; icon: LucideIcon; external?: boolean }[] = [
    { label: "Add a place", href: `${ADMIN}/businesses/create`, icon: Plus },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "All listings", href: `${ADMIN}/businesses`, icon: Store },
    { label: "All reviews", href: `${ADMIN}/reviews`, icon: MessageSquareText },
    { label: "Categories", href: `${ADMIN}/categories`, icon: FolderTree },
    { label: "View the site", href: "/", icon: ArrowUpRight, external: true },
  ];

  return (
    <div className="bb-dash">
      <header className="bb-head">
        <span className="bb-eyebrow">Bulbula Directory · Admin</span>
        <h1 className="bb-head__title">Dashboard</h1>
        <div className="bb-head__row">
          <p className="bb-head__summary">{summary}</p>
          {waitingCount ? (
            <a href={firstQueue} className="bb-btn bb-btn--primary">
              <Bell size={16} aria-hidden="true" /> Review now <span className="bb-btn__count">{waitingCount}</span>
            </a>
          ) : (
            <Link href={`${ADMIN}/businesses/create`} className="bb-btn bb-btn--primary">
              <Plus size={16} aria-hidden="true" /> Add a place
            </Link>
          )}
        </div>
      </header>

      <section className="bb-stats" aria-label="Key numbers">
        <Stat icon={Store} value={published.length} label="Live places" href={`${ADMIN}/businesses?where[status][equals]=published`} />
        <Stat icon={Bell} value={waitingCount} label="Waiting for you" href={firstQueue} alert={waitingCount > 0} />
        <Stat icon={Search} value={leads.length} label="Leads to verify" href="#leads" />
        <Stat icon={Users} value={visitors} label="Visitors, last 7 days" href="/admin/analytics" />
      </section>

      <div className="bb-grid">
        <div className="bb-main">
          <section className="bb-card bb-attention">
            <header className="bb-card__head bb-card__head--rule">
              <h2>Needs attention</h2>
              <p>The next things to do, most urgent first.</p>
            </header>
            {attention.length ? (
              <ul>
                {attention.map((a) => (
                  <li key={a.title}>
                    <a href={a.href}>
                      <span>
                        <strong>{a.title}</strong>
                        <span>{a.detail}</span>
                      </span>
                      <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="bb-empty">
                <CheckCircle2 size={18} aria-hidden="true" /> Nothing needs you right now.
              </p>
            )}
          </section>

          {submissions.length ? (
            <Card id="submissions" title="New businesses" intro="From the “Add your business” form. Nothing goes live until you approve it.">
              <ul className="bb-queue">
                {submissions.map((b) => (
                  <li key={b.id}>
                    <div className="bb-queue__main">
                      <Link href={`${ADMIN}/businesses/${b.id}`} className="bb-queue__name">
                        {b.name}
                      </Link>
                      <span className="bb-queue__meta">
                        {catOf(b)?.name ?? "No category"} · {ago(b.createdAt, now)} · from {b.submitter?.name} ({b.submitter?.relationship ?? "owner"}
                        {b.submitter?.phone ? `, ${b.submitter.phone}` : ""})
                      </span>
                      {idOf(b.claims) ? <span className="bb-tag">Claims “{byName.get(idOf(b.claims)!) ?? "a listing"}”</span> : null}
                      <Facts b={b} />
                    </div>
                    <ReviewButtons id={b.id} name={b.name} claims={idOf(b.claims)} byOwner={byOwner(b)} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {pendingReviews.length ? (
            <Card id="reviews" title="Reviews to approve" intro="Publish fair reviews, good or bad. Reject spam, insults, personal details and adverts.">
              <ul className="bb-queue">
                {pendingReviews.map((r) => {
                  const b = bizOf(r);
                  return (
                    <li key={r.id}>
                      <div className="bb-queue__main">
                        <span className="bb-queue__name">
                          <span className="bb-stars" role="img" aria-label={`${r.rating} of 5 stars`}>
                            {"★".repeat(r.rating)}
                            <span>{"★".repeat(5 - r.rating)}</span>
                          </span>{" "}
                          {r.author}
                        </span>
                        <span className="bb-queue__meta">
                          on {b ? <Link href={`${ADMIN}/businesses/${b.id}`}>{b.name}</Link> : "a removed place"} · {ago(r.createdAt, now)}
                          {r.locale === "am" ? " · Amharic site" : ""}
                        </span>
                        {r.text ? <p className="bb-quote">{r.text}</p> : null}
                      </div>
                      <ModerateReview id={r.id} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          {leads.length ? (
            <Card id="leads" title="Leads to verify" intro="Found in directories and map apps, not confirmed. Call or visit, fix the details, then publish — or discard.">
              {/* Grouped by category so a long list stays workable: open one group, work through it. */}
              {leadGroups.map(({ name, items }) => (
                <details key={name} className="bb-group">
                  <summary>
                    {name} <span>{items.length}</span>
                  </summary>
                  <ul className="bb-queue">
                    {items.map((b) => (
                      <li key={b.id}>
                        <div className="bb-queue__main">
                          <Link href={`${ADMIN}/businesses/${b.id}`} className="bb-queue__name">
                            {b.name}
                          </Link>
                          <Facts b={b} />
                          {b.mapsLink ? (
                            <a href={b.mapsLink} target="_blank" rel="noopener noreferrer" className="bb-maplink">
                              Check on Google Maps <ArrowUpRight size={13} aria-hidden="true" />
                            </a>
                          ) : null}
                          {b.adminNotes ? <span className="bb-note">{b.adminNotes}</span> : null}
                        </div>
                        <ReviewButtons id={b.id} name={b.name} byOwner={false} lead />
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </Card>
          ) : null}
        </div>

        <aside className="bb-side">
          <section className="bb-quick" aria-labelledby="bb-quick-title">
            <h2 id="bb-quick-title">Quick actions</h2>
            <ul>
              {quick.map(({ label, href, icon: Icon, external }) => (
                <li key={label}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {label} <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    </a>
                  ) : (
                    <Link href={href}>
                      {label} <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="bb-quick__claimed">
              <span>
                <strong>{Math.round(share * 100)}%</strong> claimed by their owners
              </span>
              <span className="bb-quick__track" aria-hidden="true">
                <span style={{ width: `${share * 100}%` }} />
              </span>
            </div>
          </section>

          <Card title="What the directory holds" intro="Live places per category. Empty ones are where to look next.">
            <ul className="bb-bars">
              {perCat.map(({ c, n }) => (
                <li key={c.id} className={n ? "" : "bb-bars--empty"}>
                  <span className="bb-bars__label">{c.name}</span>
                  <span className="bb-bars__track">
                    <span className="bb-bars__fill" style={{ width: `${(n / maxCat) * 100}%` }} />
                  </span>
                  <span className="bb-bars__n">{n || "none yet"}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card id="gaps" title="Gaps in live listings" intro="Fill these in on a visit or a call.">
            {gaps.map((g) => (
              <details key={g.label} className={`bb-gap ${g.items.length ? "" : "bb-gap--none"}`}>
                <summary>
                  {g.label} <span>{g.items.length}</span>
                </summary>
                <ul>
                  {g.items.slice(0, 12).map((b) => (
                    <li key={b.id}>
                      <Link href={`${ADMIN}/businesses/${b.id}`}>{b.name}</Link>
                    </li>
                  ))}
                  {g.items.length > 12 ? <li className="bb-more">+{g.items.length - 12} more</li> : null}
                </ul>
              </details>
            ))}
          </Card>

          <Card title="Recently edited">
            <ul className="bb-list">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link href={`${ADMIN}/businesses/${b.id}`}>{b.name}</Link>
                  <span>{ago(b.updatedAt, now)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
