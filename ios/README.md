# Bulbula for iPhone

The directory in your pocket: search, open now, call, directions. Native SwiftUI with Liquid Glass, iOS 26+.

## Run

```sh
cd ios
brew install xcodegen                                   # once
xcodegen                                                # writes Bulbula.xcodeproj (not committed)
open Bulbula.xcodeproj                                  # reads https://bulbula-directory.vercel.app
xcodebuild test -scheme Bulbula -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

To read `npm run dev` on this computer, build with `SITE_URL=http://localhost:3000` (an xcodebuild setting, or
change it in `project.yml`).

Debug builds take a `-route` launch argument, so any screen opens without tapping through:

```sh
xcrun simctl launch booted et.bulbula.directory -route bulbula://place/<slug>   # also settings, review, analytics
xcrun simctl launch booted et.bulbula.directory -AppleLanguages "(am)"         # Amharic
```

## How it works

Same as Android: the app downloads the site's `/{en,am}/directory.json` once, keeps the last copy on disk, and does
search, filtering and "open now" on the phone. Pull down to refresh.

| File | What it is |
|---|---|
| `Directory.swift` | The JSON's shape, the download and cache, the directory state |
| `Hours.swift` | "Open now" from OSM opening hours, a port of the site's `lib/hours.ts` |
| `DirectoryView.swift` | Search, categories, list |
| `PlaceView.swift` | One place: status, call, directions, website, facts, services, menu |
| `SettingsView.swift` | Appearance, language (iOS per-app language), links, admin sign-in |
| `Admin.swift` | Admin side: Payload sign-in (token in the Keychain), review queue, edits, reviews, analytics report |
| `AdminViews.swift` | Sign in, Review, edit a place, analytics (Swift Charts) |
| `Ui.swift` | Colours, category symbols, icon tile, status line, links |
| `BulbulaApp.swift` | The navigation stack, links (`/b/<slug>`, `bulbula://`), appearance |

Words live in `en.lproj` / `am.lproj` `Localizable.strings`; the English text is the key.

## Admin

The same as Android (`../android/README.md#admin`): existing Payload accounts sign in from Settings and get
Review, Edit and Analytics. Try it on the local copy, not the live site.
