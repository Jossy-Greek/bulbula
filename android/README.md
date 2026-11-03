# Bulbula for Android

The directory in your pocket: search, open now, call, directions. Kotlin and Jetpack Compose, one module.

## Run

```sh
cd android
./gradlew installDebug                                  # reads https://bulbula-directory.vercel.app
./gradlew installDebug -PsiteUrl=http://10.0.2.2:3000   # reads `npm run dev` on this computer (emulator)
./gradlew testDebugUnitTest lintDebug                   # tests and lint
```

Android Studio: open the `android/` folder.

## How it works

The site serves the whole directory as one file, `/{en,am}/directory.json`
(`app/(frontend)/[locale]/directory.json/route.ts`), with the same listings, order and switches as the website.
The app downloads it once, keeps the last copy on disk and does search, filtering and "open now" on the phone,
so it opens instantly and works offline. Pull down to refresh.

| File | What it is |
|---|---|
| `Directory.kt` | The JSON's shape, the download and cache, the screen state |
| `Hours.kt` | "Open now" from OSM opening hours, a port of the site's `lib/hours.ts` |
| `DirectoryScreen.kt` | Search, categories, list |
| `SettingsScreen.kt`, `Settings.kt` | Appearance and language (Android 13+ per-app language) |
| `Admin.kt` | Admin side: Payload sign-in, review queue, edits, reviews, analytics report |
| `AdminScreens.kt`, `AnalyticsScreen.kt` | Sign in, Review (pending, unconfirmed, reviews), edit a place, analytics |
| `Ui.kt` | Shared pieces: cards, icon tiles, status pill, pill switch, category icons |
| `PlaceScreen.kt` | One place: status, call, directions, website, facts, services, menu |
| `MainActivity.kt` | The screens, back, appearance, website links (`/en/b/<slug>`) |
| `Theme.kt` | The website's colours, light and dark |

Icons are the website's Lucide set, converted by `scripts/lucide-icons.mjs` (licence in `LICENSE-lucide.txt`).

Language follows the phone unless chosen in Settings: Amharic gets `/am/directory.json` and `values-am/strings.xml`;
everything else English.

## Admin

The site's existing Payload accounts sign in from Settings (Payload's `/api/users/login`; the token is
refreshed while in use). Admins then get:

- **Review**: pending submissions and leads (publish / reject, the same rules as the web dashboard), places
  not yet confirmed (fix and confirm), and visitors' reviews (publish / reject).
- **Edit** on any place: phones, hours (OSM format, checked by `Hours.kt`), landmark and the pin from where you stand.
- **Analytics**: the same report as `/admin/analytics`, from `GET /api/analytics-events/report?range=7|30|90`
  (`collections/AnalyticsEvents.ts`).

Payload's access rules decide what an account may do; the app only offers the actions. Try it on the local
copy, not the live site: `npm run dev:local`, `BULBULA_LOCAL_DB=1 npx payload run scripts/local-admin.ts`
for a test account, then `./gradlew installDebug -PsiteUrl=http://10.0.2.2:3008`.
