import Foundation
import Observation

/// The site the app reads from (project.yml `SITE_URL`).
nonisolated enum Site {
    static let url = URL(string: Bundle.main.object(forInfoDictionaryKey: "BulbulaSiteURL") as? String ?? "")
        ?? URL(string: "https://bulbula-directory.vercel.app")!

    /// The site's language for this app: Amharic when iOS runs the app in Amharic, else English.
    static var locale: String { Bundle.main.preferredLocalizations.first == "am" ? "am" : "en" }
}

/// The whole directory, as served at /{locale}/directory.json (app/(frontend)/[locale]/directory.json).
nonisolated struct Directory: Codable {
    let categories: [Category]
    /// Service key → label in this language, e.g. "dineIn" → "Dine-in".
    let services: [String: String]?
    /// Already in the website's order: featured, owner-run, confirmed, with a phone, then by name.
    let listings: [Place]
}

nonisolated struct Category: Codable, Hashable {
    let slug: String
    let name: String
    /// A Lucide icon name from the site ("coffee", "landmark", …); see `CategoryIcon`.
    let icon: String?
    /// "business" or "community".
    let group: String?
}

nonisolated struct Place: Codable, Identifiable, Hashable {
    let id: Int
    let slug: String
    let name: String
    let category: Category
    let description: String?
    /// True when `description` was written by us from the category, not by the place.
    let generated: Bool?
    let landmark: String?
    let address: String?
    let lat: Double?
    let lng: Double?
    let phone: String?
    let phone2: String?
    let website: String?
    let mapsUrl: String
    /// Readable hours in this language, e.g. "Mon–Sat 08:30–19:00 · Sun 10:00–16:00".
    let hours: String?
    /// The same hours as OSM opening_hours, for "open now" (`Hours`).
    let hoursSpec: String?
    let services: [String]?
    let google: Rating?
    let menu: [MenuSection]?
}

nonisolated struct Rating: Codable, Hashable {
    let rating: Double
    let count: Int
}

nonisolated struct MenuSection: Codable, Hashable {
    let title: String
    let items: [MenuItem]
}

nonisolated struct MenuItem: Codable, Hashable {
    let name: String
    let price: Double?
}

extension [Place] {
    /// Name first, then category and landmark; a name that starts with the query ranks first.
    func matching(_ query: String, category: String?) -> [Place] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        let found = filter { p in
            (category == nil || p.category.slug == category)
                && (q.isEmpty || [p.name, p.category.name, p.landmark ?? ""].contains { $0.lowercased().contains(q) })
        }
        guard !q.isEmpty else { return found }
        return found.filter { $0.name.lowercased().hasPrefix(q) } + found.filter { !$0.name.lowercased().hasPrefix(q) }
    }
}

/// Reads the directory from the site and keeps the last copy on disk, so the app opens offline.
@Observable
final class DirectoryModel {
    private(set) var directory: Directory?
    private(set) var refreshing = false
    private(set) var failed = false
    private var locale: String?

    private let folder = URL.applicationSupportDirectory
    private func file(_ locale: String) -> URL { folder.appending(path: "directory-\(locale).json") }

    /// Shows the saved copy in this language ("en" or "am") at once, then refreshes it.
    func use(_ locale: String) async {
        guard locale != self.locale else { return }
        self.locale = locale
        directory = (try? Data(contentsOf: file(locale))).flatMap { try? JSONDecoder().decode(Directory.self, from: $0) }
        await refresh()
    }

    func refresh() async {
        guard let locale, !refreshing else { return }
        refreshing = true
        defer { refreshing = false }
        do {
            let (data, response) = try await URLSession.shared.data(from: Site.url.appending(path: "\(locale)/directory.json"))
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
            let fresh = try JSONDecoder().decode(Directory.self, from: data)
            guard locale == self.locale else { return } // language changed meanwhile
            directory = fresh
            failed = false
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try? data.write(to: file(locale))
        } catch {
            failed = true
        }
    }
}
