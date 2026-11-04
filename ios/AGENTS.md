# iOS app — rules for agents

Read `README.md` first. The Android app's rules (`../android/AGENTS.md`) apply here too. Then:

- **Native only.** SwiftUI, Observation, Swift Charts, CoreLocation, URLSession; no packages. Use the system's
  Liquid Glass (glass button styles, `glassEffect`, `GlassEffectContainer`, native bars and search) instead of
  drawing your own.
- **`Hours.swift` mirrors `lib/hours.ts`** (and `Hours.kt`). Change all of them together.
- **`Track.swift` mirrors `lib/track.ts`** (and `Track.kt`): the same events to `/e`, tagged `platform: "ios"`.
- **One fixture.** Tests read `../android/app/src/test/resources/directory-sample.json`; refresh it when the endpoint changes.
- **The project file is generated.** Edit `project.yml` and run `xcodegen`; don't commit `Bulbula.xcodeproj`.
- **Swift 6, main actor by default.** Models and network code that leave the main actor are `nonisolated`.
- **Check before you finish:** `xcodegen && xcodebuild test -scheme Bulbula -destination 'platform=iOS Simulator,name=iPhone 17 Pro'`,
  then look at the screens on a simulator (`-route`, light, dark, Amharic).
