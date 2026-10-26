# Bulbula Directory

A bilingual (English / Amharic) directory of businesses, services and community
places in **Bole Bulbula, Addis Ababa** — east of the Bulbula river: Bole
17/19/20, 93 Mazoriya, the condominiums, the road to Bole Michael.

Live: **https://bulbula-directory.vercel.app** · admin at `/admin`
(Vercel project `yoseph4/bulbula`; `bulbula.vercel.app` belongs to someone else.)

## How listings work

| Source | How it arrives | Shown as |
| --- | --- | --- |
| OpenStreetMap | `npm run seed` (Overpass extract, OSM base 2026-07-24) | Published, **Unclaimed**, OSM credit |
| Admin | Added in `/admin` | Published, Unclaimed until an owner claims it |
| Owner | `/add` form → **pending** → approved on the dashboard | Published; **Claimed** when the sender is the owner or a manager |

- **Facts only until claimed.** No listing carries invented text. Without an
  owner's description, the page shows a one-line summary built from the facts
  (category, landmark, hours) and says so.
- **Claiming:** every unclaimed page links to `/add?claim=<slug>`. Approving a
  claim publishes the owner's version and retires the old listing, so the place
  appears once.
- The form fixes `status: pending`, `source: owner`, `claimed: false` on the
  server; a hidden `company` field catches simple bots. Submitter name/phone and
  admin notes are readable only by signed-in admins (field access).

## UX patterns (adapted 2026-10-26)

Taken from Google Maps, Yelp, Airbnb and store-locator guidance, tuned for
phones (most visitors):

- **Open now**: live open/closed badge from OSM-style hours, in Addis Ababa
  time (`lib/hours.ts`), and an "Open now" filter (`?open=1`). Free-text hours
  show as typed — never guessed.
- **List + map**: on desktop a sticky map beside the list shows exactly the
  filtered places, and hovering a card lights its pin. On phones a floating
  Map/List pill switches views.
- **Near me**: sorts by distance from the visitor (browser geolocation; never
  stored or sent anywhere).
- **Card actions**: Call and Google Maps on every card. The name is a stretched
  link to the page.
- **Business page**: on phones, a sticky Call · Map · Directions bar. Share
  (native sheet, Telegram, copy link), "Suggest a correction", and the source
  of the data.
- **Google Maps**: the owner's own Maps link if given, else a pin at the
  coordinates, else a name search.
- Tap targets ≥ 44 px; chip rows scroll sideways on phones.

## Admin dashboard

Two queues: **owner submissions** (Approve publishes; owner/manager → claimed;
a claim retires the old listing) and **leads to verify** (from research;
Publish / Discard, never marked claimed), each with its source note. Also:
category coverage bars, gaps (no contact / pin / hours), recent edits.

`scripts/import-research.ts` loads the 2026-10-26 desk research: 7 bank
branches published from the banks' own lists, 12 leads pending. It skips
existing names, so it is safe to rerun.

## Google Maps leads (2026-10-26)

`scripts/data/google-maps-leads-2026-10-26.json` holds 160 places found by
searching Google Maps around Bulbula, one category at a time (pharmacy, cafe,
restaurant, bakery, supermarket, salon, school, clinic, gym, bank, shop), then
keeping only pins inside 8.928–8.976 N, east of the river to 38.825 E.

Per place, **only** the name, the pin and a link by Google place ID
(`https://www.google.com/maps/search/?api=1&query=…&query_place_id=ChIJ…`) were
recorded. Google's terms don't allow copying phones, hours, reviews or photos
into another directory; those come from a call, a visit or the owner.
`scripts/import-google-leads.ts` (with `DRY_RUN=1` to preview) adds them as
**pending leads**, or links an existing listing when one is within 120 m with
a shared distinctive word in the name. The "near …" landmark is computed
from OpenStreetMap points, not Google's address. It is safe to rerun.

The dashboard groups leads by category. Each one has a "Check on Google Maps"
link; confirm it, fill in phone and hours, then **Publish**.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Payload CMS 3 on Neon
Postgres · Vercel Blob for photos · Leaflet + OpenStreetMap tiles ·
lucide-react. Fonts: Plus Jakarta Sans, Inter, Noto Sans Ethiopic.

```
app/(frontend)/[locale]/   home, businesses, b/[slug], add (+ server action), about
app/(payload)/             Payload admin + REST/GraphQL; custom.scss = admin theme
collections/               Businesses, Categories, Media, Users
components/                site components; components/admin = dashboard, logo
data/content.ts            all UI copy, EN + AM
data/site.ts               area centre, operator contacts
lib/directory.ts           queries, hours formatting, fact summaries
scripts/seed.ts            categories + OSM places + Tukiya (empty DB only)
scripts/import-research.ts banks + leads from web research (idempotent)
scripts/import-google-leads.ts  160 Google Maps finds → pending leads (idempotent)
lib/hours.ts               opening-hours parser + open-now (Addis time)
migrations/                Payload migrations (push is off)
```

## Commands

```bash
npm run dev            # http://localhost:3007 against Neon (.env.local from `vercel env pull`)
npm run dev:local      # http://localhost:3008 on a local SQLite copy
npm run seed           # only when the directory is empty
npx payload migrate:create <name>   # after changing a collection
npm run build          # runs `payload migrate` then `next build`
npx vercel deploy --prod --yes
```

Schema changes: edit the collection → `npm run generate:types` →
`npx payload migrate:create <name>` → commit the migration. The build applies
it. Never let a dev server push schema to the production DB.

## First run

1. Open `/admin` and create the first account **now** — until one exists,
   anyone who opens `/admin` can create it.
2. Approve or reject submissions from the dashboard's review queue.
3. Before approving a submission without a map pin, add `lat`/`lng` (open the
   Google Maps link they sent, right-click → copy coordinates).

## Brand

River blue `#0e3d47`, teal `#1f7a85` (text `#17646d`), marigold `#f2b134`
(never as text on light; amber `#8a5300` instead), page `#f7f5ef`. Motif: river
ripples and a map pin. All text pairs measured ≥ 4.5:1.

## Data notes

- OSM coverage is thin: no pharmacies and almost no cafés are mapped on this
  side of the river. The categories exist so owners can add themselves.
- Wereda 12 Health Center and Bulbula Health Center are two OSM ways ~40 m
  apart and may be one place — check on site.
- Aberus Bakery was in OSM twice; seeded once.
- Map data © OpenStreetMap contributors, ODbL. Credit stays on every map and
  OSM-sourced page.
