# Android app — rules for agents

Read `README.md` first. Then:

- **One source of truth.** Listings, order, wording and switches come from the site's `directory.json`. Don't
  re-implement website rules in the app; add a field to the endpoint (`app/(frontend)/[locale]/directory.json/route.ts`)
  instead, keep it backward compatible (apps in the wild read it), and refresh `app/src/test/resources/directory-sample.json`.
- **`Hours.kt` mirrors `lib/hours.ts`.** Change both together; `HoursTest` covers the cases.
- **Admin goes through Payload.** Sign-in, edits and moderation use Payload's REST API with the user's token, so
  the server's access rules apply; never add an app-only shortcut. Test admin changes on the local copy (README).
- **Simple stays simple.** A directory, a place and settings, plus admin screens only after sign-in; no navigation, DI or image libraries, and one HTTP client. A new dependency needs a reason
  the platform can't meet (OkHttp: HttpURLConnection can't PATCH).
- **No helper text.** No taglines, hints or secondary labels; if a screen needs one to make sense, change the layout.
  New words go in `values/strings.xml` and `values-am/strings.xml`, worded as on the website (`data/content.ts`).
- **Check before you finish:** `./gradlew testDebugUnitTest lintDebug assembleRelease`, then run it on an emulator
  (`-PsiteUrl=http://10.0.2.2:3000` for a local site; only debug builds allow plain http).
