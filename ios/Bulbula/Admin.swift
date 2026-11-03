import Foundation
import Observation
import Security

/// The admin side: the site's existing Payload accounts sign in through Payload's REST API
/// (/api/users/login) and edit listings with their token. Payload's access rules decide what an
/// account may do; the app only offers the actions. The Android app (Admin.kt) does the same.
nonisolated struct AdminPlace: Decodable, Identifiable, Hashable {
    let id: Int
    let name: String
    let slug: String?
    /// At depth=1 the full category.
    let category: Category?
    let status: String
    let unconfirmed: Bool?
    let phone: String?
    let phone2: String?
    /// OSM opening hours ("Mo-Sa 08:00-18:00"), the format `Hours` reads.
    let hours: String?
    let landmark: String?
    let lat: Double?
    let lng: Double?
    let submitter: Submitter?
    /// The id of the listing this submission claims (an id, or the listing itself at depth=1).
    let claimsId: Int?

    var pending: Bool { status == "pending" }
    var isUnconfirmed: Bool { unconfirmed == true }

    /// As the web dashboard: owner and manager submissions publish as claimed; tips and leads don't.
    var byOwner: Bool { !(submitter?.name ?? "").isEmpty && submitter?.relationship != "customer" }

    private enum Keys: String, CodingKey { case id, name, slug, category, status, unconfirmed, phone, phone2, hours, landmark, lat, lng, submitter, claims }
    private struct Ref: Decodable { let id: Int }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        id = try c.decode(Int.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        slug = try c.decodeIfPresent(String.self, forKey: .slug)
        category = try? c.decodeIfPresent(Category.self, forKey: .category)
        status = try c.decode(String.self, forKey: .status)
        unconfirmed = try c.decodeIfPresent(Bool.self, forKey: .unconfirmed)
        phone = try c.decodeIfPresent(String.self, forKey: .phone)
        phone2 = try c.decodeIfPresent(String.self, forKey: .phone2)
        hours = try c.decodeIfPresent(String.self, forKey: .hours)
        landmark = try c.decodeIfPresent(String.self, forKey: .landmark)
        lat = try c.decodeIfPresent(Double.self, forKey: .lat)
        lng = try c.decodeIfPresent(Double.self, forKey: .lng)
        submitter = try c.decodeIfPresent(Submitter.self, forKey: .submitter)
        claimsId = (try? c.decodeIfPresent(Int.self, forKey: .claims)) ?? (try? c.decodeIfPresent(Ref.self, forKey: .claims))?.id
    }
}

nonisolated struct Submitter: Decodable, Hashable {
    let name: String?
    let phone: String?
    let relationship: String?
}

/// A visitor's review waiting for approval (the site's Reviews collection).
nonisolated struct PendingReview: Decodable, Identifiable, Hashable {
    let id: Int
    let rating: Int
    let author: String
    let text: String?
    let business: Reviewed?

    struct Reviewed: Decodable, Hashable { let name: String }
}

/// The site's analytics report (lib/analytics.ts `Report`), the parts the app shows.
nonisolated struct Report: Decodable {
    let range: Int
    let kpis: Kpis
    let live: Int
    let days: [Day]
    let businesses: [BusinessRow]
    let searches: [Count]
    let emptySearches: [Count]

    struct Kpis: Decodable { let visitors, pageviews, leads, searches: Kpi }
    /// This period and the one before it.
    struct Kpi: Decodable { let value, previous: Int }
    struct Day: Decodable, Identifiable { let date: String; let visitors: Int; var id: String { date } }
    struct Count: Decodable, Identifiable { let key: String; let count: Int; var id: String { key } }
    struct BusinessRow: Decodable, Identifiable {
        let slug, name: String
        let views, calls, directions: Int
        let maps, other: Int?
        var id: String { slug }
        /// Calls, directions, maps and website or social clicks: people the place got.
        var leads: Int { calls + directions + (maps ?? 0) + (other ?? 0) }
    }
}

/// Who is signed in. `exp` is Payload's token expiry, in seconds.
nonisolated struct Session: Codable {
    let email: String
    var token: String
    var exp: Double
    var expired: Bool { exp <= Date.now.timeIntervalSince1970 }
}

nonisolated struct Unauthorized: Error {}

/// Payload's REST API with the signed-in user's token.
nonisolated struct AdminAPI {
    var site = Site.url

    private func call(_ path: String, token: String? = nil, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        try await call(path, token: token, method: method, json: body.map { try JSONSerialization.data(withJSONObject: $0) })
    }

    private func call(_ path: String, token: String?, method: String, json: Data?) async throws -> Data {
        var req = URLRequest(url: URL(string: site.absoluteString + path)!)
        req.httpMethod = method
        if let token { req.setValue("JWT \(token)", forHTTPHeaderField: "Authorization") }
        if let json {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = json
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        if code == 401 || code == 403 { throw Unauthorized() }
        guard (200..<300).contains(code) else { throw URLError(.badServerResponse) }
        return data
    }

    private struct Login: Decodable { let token: String; let exp: Double; let user: User; struct User: Decodable { let email: String } }
    private struct Refreshed: Decodable { let refreshedToken: String; let exp: Double }
    private struct Page<T: Decodable>: Decodable { let docs: [T] }

    func signIn(email: String, password: String) async throws -> Session {
        let r = try JSONDecoder().decode(Login.self, from: try await call("/api/users/login", method: "POST", body: ["email": email, "password": password]))
        return Session(email: r.user.email, token: r.token, exp: r.exp)
    }

    func refresh(_ s: Session) async throws -> Session {
        let r = try JSONDecoder().decode(Refreshed.self, from: try await call("/api/users/refresh-token", token: s.token, method: "POST", body: [:]))
        return Session(email: s.email, token: r.refreshedToken, exp: r.exp)
    }

    /// Pending submissions and leads, then published places still "not yet confirmed".
    func queue(_ s: Session) async throws -> (pending: [AdminPlace], unconfirmed: [AdminPlace]) {
        func list(_ where_: String) async throws -> [AdminPlace] {
            try JSONDecoder().decode(Page<AdminPlace>.self, from: try await call("/api/businesses?\(where_)&depth=1&locale=en&limit=1000&sort=name", token: s.token)).docs
        }
        return (try await list("where[status][equals]=pending"), try await list("where[status][equals]=published&where[unconfirmed][equals]=true"))
    }

    func reviews(_ s: Session) async throws -> [PendingReview] {
        try JSONDecoder().decode(Page<PendingReview>.self, from: try await call("/api/reviews?where[status][equals]=pending&depth=1&locale=en&limit=200&sort=-createdAt", token: s.token)).docs
    }

    /// "published" or "rejected", as the web dashboard's review buttons.
    func moderate(_ s: Session, review: Int, status: String) async throws {
        _ = try await call("/api/reviews/\(review)", token: s.token, method: "PATCH", body: ["status": status])
    }

    /// `range`: 7, 30 or 90 days, as on /admin/analytics.
    func report(_ s: Session, range: Int) async throws -> Report {
        try JSONDecoder().decode(Report.self, from: try await call("/api/analytics-events/report?range=\(range)", token: s.token))
    }

    func place(_ s: Session, id: Int) async throws -> AdminPlace {
        try JSONDecoder().decode(AdminPlace.self, from: try await call("/api/businesses/\(id)?depth=1&locale=en", token: s.token))
    }

    /// Text fields are written in English, the site's default; Amharic pages fall back to it.
    /// `fields` is a JSON object (see `placeFields`).
    func update(_ s: Session, id: Int, fields: Data) async throws {
        _ = try await call("/api/businesses/\(id)?locale=en", token: s.token, method: "PATCH", json: fields)
    }
}

/// A place's edited fields for `AdminModel.save`; blank text clears the field.
nonisolated func placeFields(phone: String, phone2: String, hours: String, landmark: String, pin: (Double, Double)?, confirm: Bool) -> [String: Any] {
    func text(_ v: String) -> Any { v.trimmingCharacters(in: .whitespaces).isEmpty ? NSNull() : v.trimmingCharacters(in: .whitespaces) }
    var f: [String: Any] = ["phone": text(phone), "phone2": text(phone2), "hours": text(hours), "landmark": text(landmark)]
    if let pin { f["lat"] = pin.0; f["lng"] = pin.1 }
    if confirm { f["unconfirmed"] = false }
    return f
}

@Observable
final class AdminModel {
    private(set) var session: Session?
    private(set) var pending: [AdminPlace] = []
    private(set) var unconfirmed: [AdminPlace] = []
    private(set) var reviews: [PendingReview] = []
    private(set) var loading = false
    private(set) var failed = false
    private let api = AdminAPI()

    /// What's waiting on an admin: pending places and reviews (unconfirmed places are ongoing work).
    var waiting: Int { pending.count + reviews.count }
    var lastEmail: String { UserDefaults.standard.string(forKey: "adminEmail") ?? "" }

    init() {
        session = Keychain.load().flatMap { try? JSONDecoder().decode(Session.self, from: $0) }.flatMap { $0.expired ? nil : $0 }
    }

    private func save(_ s: Session?) {
        session = s
        if let s {
            UserDefaults.standard.set(s.email, forKey: "adminEmail")
            Keychain.save((try? JSONEncoder().encode(s)) ?? Data())
        } else {
            Keychain.delete()
            pending = []; unconfirmed = []; reviews = []
        }
    }

    func signIn(email: String, password: String) async -> Bool {
        guard let s = try? await api.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password) else { return false }
        save(s)
        await reload()
        return true
    }

    func signOut() { save(nil) }

    /// Refreshes the token while it's still valid (its last hour), then the queue.
    func reload() async {
        guard var s = session else { return }
        if s.expired { return signOut() }
        loading = true
        defer { loading = false }
        do {
            if s.exp - Date.now.timeIntervalSince1970 < 3600 { s = try await api.refresh(s); save(s) }
            let q = try await api.queue(s)
            let r = try await api.reviews(s)
            (pending, unconfirmed, reviews, failed) = (q.pending, q.unconfirmed, r, false)
        } catch is Unauthorized {
            signOut()
        } catch {
            failed = true
        }
    }

    func place(_ id: Int) async -> AdminPlace? { await guarded { try await self.api.place($0, id: id) } }

    func report(_ range: Int) async -> Report? { await guarded { try await self.api.report($0, range: range) } }

    /// Saves `fields`; for a pending place `decision` true publishes it (retiring the listing it claims), false rejects it.
    func save(_ place: AdminPlace, fields: [String: Any], decision: Bool? = nil) async -> Bool {
        var body = fields
        switch decision {
        case true?:
            body["status"] = "published"
            if place.pending { body["claimed"] = place.byOwner }
        case false?:
            body["status"] = "rejected"
        case nil:
            break
        }
        // As JSON bytes: safe to hand to the network task.
        guard let sent = try? JSONSerialization.data(withJSONObject: body),
              let retire = try? JSONSerialization.data(withJSONObject: ["status": "rejected"]) else { return false }
        let ok = await guarded { s in
            try await self.api.update(s, id: place.id, fields: sent)
            if decision == true, let claimed = place.claimsId { try await self.api.update(s, id: claimed, fields: retire) }
            return true
        } ?? false
        if ok { await reload() }
        return ok
    }

    /// Publishes or rejects a visitor's review; it leaves the list at once.
    func moderate(_ review: PendingReview, publish: Bool) async -> Bool {
        let ok = await guarded { try await self.api.moderate($0, review: review.id, status: publish ? "published" : "rejected"); return true } ?? false
        if ok { reviews.removeAll { $0.id == review.id } }
        return ok
    }

    private func guarded<T>(_ work: (Session) async throws -> T) async -> T? {
        guard let s = session, !s.expired else { signOut(); return nil }
        do { return try await work(s) } catch is Unauthorized { signOut(); return nil } catch { return nil }
    }
}

/// The signed-in session, in the Keychain (this device only).
enum Keychain {
    private static let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "et.bulbula.directory", kSecAttrAccount as String: "admin"]

    static func save(_ data: Data) {
        delete()
        SecItemAdd(query.merging([kSecValueData as String: data, kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]) { $1 } as CFDictionary, nil)
    }

    static func load() -> Data? {
        var out: AnyObject?
        guard SecItemCopyMatching(query.merging([kSecReturnData as String: true]) { $1 } as CFDictionary, &out) == errSecSuccess else { return nil }
        return out as? Data
    }

    static func delete() { SecItemDelete(query as CFDictionary) }
}
