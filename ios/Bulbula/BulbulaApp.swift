import SwiftUI

@main
struct BulbulaApp: App {
    @State private var directory = DirectoryModel()
    @State private var admin = AdminModel()
    @AppStorage("appearance") private var appearance = Appearance.system

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(directory)
                .environment(admin)
                .preferredColorScheme(appearance.scheme)
                .tint(.brand)
        }
    }
}

enum Appearance: String, CaseIterable {
    case system, light, dark

    var scheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

/// Every screen above the directory.
enum Route: Hashable {
    case place(String)
    case settings, signIn, review, analytics
    case edit(Int)
}

struct RootView: View {
    @Environment(DirectoryModel.self) private var directory
    @Environment(AdminModel.self) private var admin
    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            DirectoryView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .place(let slug): PlaceView(slug: slug)
                    case .settings: SettingsView()
                    case .signIn: SignInView { path.removeLast(); path.append(.review) }
                    case .review: ReviewView()
                    case .analytics: AnalyticsView()
                    case .edit(let id): EditPlaceView(id: id) { path.removeLast() }
                    }
                }
        }
        .task {
            #if DEBUG
            // Testing: `xcrun simctl launch <device> et.bulbula.directory -route bulbula://settings` opens that screen.
            if let route = UserDefaults.standard.string(forKey: "route"), let url = URL(string: route) { open(url) }
            #endif
            await directory.use(Site.locale)
            await admin.reload()
        }
        .onOpenURL(perform: open)
    }

    /// Website links to a place (/en/b/<slug>), and bulbula://place/<slug>, settings, review, analytics.
    private func open(_ url: URL) {
        let parts = url.pathComponents
        if let i = parts.firstIndex(of: "b"), i + 1 < parts.count { return path = [.place(parts[i + 1])] }
        guard url.scheme == "bulbula" else { return }
        switch url.host() {
        case "place": if let slug = parts.last, slug != "/" { path = [.place(slug)] }
        case "settings": path = [.settings]
        case "review": path = [.review]
        case "analytics": path = [.analytics]
        default: path = []
        }
    }
}
