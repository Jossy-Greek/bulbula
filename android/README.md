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
| `PlaceScreen.kt` | One place: status, call, directions, website, facts, services, menu |
| `MainActivity.kt` | The two screens, back, website links (`/en/b/<slug>`) |
| `Theme.kt` | The website's colours, light and dark |

Language follows the phone (or Android 13+ per-app language): Amharic gets `/am/directory.json` and `values-am/strings.xml`;
everything else English.
