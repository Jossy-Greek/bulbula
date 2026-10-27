import Link from "next/link";
import type { Payload } from "payload";
import { ArrowUpRight, BadgeCheck, Clock, FolderTree, Globe, Inbox, MapPin, Phone, Plus, Search, Store } from "lucide-react";
import type { Business, Category, Review } from "@/payload-types";
import ReviewButtons from "./ReviewButtons";
import ModerateReview from "./ModerateReview";

const ADMIN = "/admin/collections";

function ago(iso: string, now: Date) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

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

/**
 * The top of the admin dashboard, built around the one job that needs a person:
 * deciding what goes live. A river-blue welcome with the "claimed" ring, the
 * numbers, two queues (owners' submissions first, then research leads to
 * verify), what each category holds, data gaps, and recent edits.
 */
export default async function DirectoryDashboard({ payload }: { payload: Payload }) {
  const [all, cats, waiting] = await Promise.all([
    payload.find({ collection: "businesses", locale: "en", limit: 2000, depth: 1, sort: "-createdAt" }),
    payload.find({ collection: "categories", locale: "en", limit: 100, depth: 0, sort: "order" }),
    payload.find({ collection: "reviews", where: { status: { equals: "pending" } }, limit: 100, depth: 0, sort: "createdAt" }),
  ]);
  const pendingReviews = waiting.docs as Review[];
  const docs = all.docs as Business[];
  const now = new Date();
  const published = docs.filter((b) => b.status === "published");
  const pending = docs.filter((b) => b.status === "pending");
  const submissions = pending.filter((b) => b.submitter?.name);
  const leads = pending.filter((b) => !b.submitter?.name);
  const claimed = published.filter((b) => b.claimed);
  const byCat = new Map<string, Business[]>();
  for (const b of leads) {
    const k = catOf(b)?.name ?? "No category";
    byCat.set(k, [...(byCat.get(k) ?? []), b]);
  }
  const leadGroups = [...byCat]
    .map(([name, items]) => ({ name, items: items.sort((x, y) => x.name.localeCompare(y.name)) }))
    .sort((x, y) => y.items.length - x.items.length);
  const byName = new Map(docs.map((b) => [b.id, b.name]));
  const bizOf = (r: Review) => docs.find((b) => b.id === (typeof r.business === "object" ? r.business.id : r.business));
  const share = published.length ? claimed.length / published.length : 0;

  const gaps = [
    { label: "No phone, website or social", items: published.filter((b) => !hasContact(b)) },
    { label: "No map pin", items: published.filter((b) => b.lat == null || b.lng == null) },
    { label: "No opening hours", items: published.filter((b) => !b.hours) },
    { label: "Not yet confirmed (from research)", items: published.filter((b) => b.unconfirmed) },
  ];
  const perCat = (cats.docs as Category[]).map((c) => ({
    c,
    n: published.filter((b) => catOf(b)?.id === c.id).length,
  }));
  const maxCat = Math.max(1, ...perCat.map((x) => x.n));
  const recent = [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  const stats = [
    { icon: Store, value: published.length, label: "Live on the site" },
    { icon: Inbox, value: submissions.length, label: "Owner submissions", warn: submissions.length > 0 },
    { icon: Search, value: leads.length, label: "Leads to verify" },
    { icon: BadgeCheck, value: claimed.length, label: "Claimed by owners" },
  ];

  return (
    <div className="bb-dash">
      <section className="bb-hero">
        <div>
          <p className="bb-hero__eyebrow">Bulbula Directory · admin</p>
          <h1 className="bb-hero__title">
            {submissions.length
              ? `${submissions.length} ${submissions.length === 1 ? "business is" : "businesses are"} waiting for you`
              : pendingReviews.length
                ? `${pendingReviews.length} ${pendingReviews.length === 1 ? "review is" : "reviews are"} waiting for you`
                : leads.length
                  ? `${leads.length} leads to check`
                  : "Everything is reviewed"}
          </h1>
          <p className="bb-hero__summary">
            {published.length} places are live, {claimed.length} run by owners who claimed them. Leads come from research — call or visit before publishing.
          </p>
          <div className="bb-hero__actions">
            <Link href={`${ADMIN}/businesses/create`} className="bb-btn bb-btn--marigold">
              <Plus size={16} aria-hidden="true" /> Add a place
            </Link>
            <Link href="/admin/analytics" className="bb-btn bb-btn--ghost">
              Analytics
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="bb-btn bb-btn--ghost">
              View the site <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="bb-ring" role="img" aria-label={`${Math.round(share * 100)}% of listings are claimed`}>
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
            {share > 0 ? <circle cx="60" cy="60" r="50" fill="none" stroke="#f2b134" strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray={`${share * 100} 100`} transform="rotate(-90 60 60)" /> : null}
          </svg>
          <span className="bb-ring__pct">{Math.round(share * 100)}%</span>
          <span className="bb-ring__cap">claimed</span>
        </div>
      </section>

      <ul className="bb-stats">
        {stats.map(({ icon: I, value, label, warn }) => (
          <li key={label} className={`bb-stat ${warn ? "bb-stat--warn" : ""}`}>
            <I size={20} aria-hidden="true" />
            <span className="bb-stat__value">{value}</span>
            <span className="bb-stat__label">{label}</span>
          </li>
        ))}
      </ul>

      <div className="bb-grid">
        <div className="bb-side">
          {pendingReviews.length ? (
            <section className="bb-card">
              <header className="bb-card__head">
                <h2>Reviews to approve</h2>
                <p>Written by visitors. Publish fair ones, good or bad; reject spam, insults, personal details and adverts.</p>
              </header>
              <ul className="bb-queue">
                {pendingReviews.map((r) => {
                  const b = bizOf(r);
                  return (
                    <li key={r.id}>
                      <div className="bb-queue__main">
                        <span className="bb-queue__name">
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)} · {r.author}
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
            </section>
          ) : null}

          <section className="bb-card">
            <header className="bb-card__head">
              <h2>Owner submissions</h2>
              <p>From the “Add your business” form. Nothing goes live until you approve it.</p>
            </header>
            {submissions.length ? (
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
            ) : (
              <p className="bb-empty">
                <Clock size={16} aria-hidden="true" /> Nothing waiting. Share the “Add your business” link with shops in Bulbula.
              </p>
            )}
          </section>

          <section className="bb-card">
            <header className="bb-card__head">
              <h2>Leads to verify</h2>
              <p>Found in directories and map apps, not confirmed. Call or visit, fix the details, then publish — or discard.</p>
            </header>
            {leads.length ? (
              // Grouped by category so a long research list stays workable: open one group, work through it.
              leadGroups.map(({ name, items }) => (
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
              ))
            ) : (
              <p className="bb-empty">No leads waiting.</p>
            )}
          </section>
        </div>

        <aside className="bb-side">
          <section className="bb-card">
            <header className="bb-card__head">
              <h2>What the directory holds</h2>
              <p>Live places per category. Empty ones are where to look next.</p>
            </header>
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
          </section>

          <section className="bb-card">
            <header className="bb-card__head">
              <h2>Gaps in live listings</h2>
              <p>Fill these in on a visit or a call.</p>
            </header>
            {gaps.map((g) => (
              <details key={g.label} className="bb-gap">
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
          </section>

          <section className="bb-card">
            <header className="bb-card__head">
              <h2>Recently edited</h2>
            </header>
            <ul className="bb-list">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link href={`${ADMIN}/businesses/${b.id}`}>{b.name}</Link>
                  <span>{ago(b.updatedAt, now)}</span>
                </li>
              ))}
            </ul>
          </section>

          <nav className="bb-tiles" aria-label="Shortcuts">
            <Link href={`${ADMIN}/businesses`} className="bb-tile">
              <Store size={18} aria-hidden="true" /> All listings
            </Link>
            <Link href={`${ADMIN}/categories`} className="bb-tile">
              <FolderTree size={18} aria-hidden="true" /> Categories
            </Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
