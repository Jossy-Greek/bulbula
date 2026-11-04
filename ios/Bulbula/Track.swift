import Foundation

/// Usage counts for the admin's analytics, as the website's lib/track.ts sends them: the same
/// events to the same /e endpoint, tagged platform=ios. No ids and nothing stored on the phone;
/// the server counts a visitor once a day from the address and the user agent below.
/// Fire and forget: analytics never slows or breaks the app.
nonisolated enum Track {
    /// Off while an admin is signed in, as the website skips admins' browsers.
    nonisolated(unsafe) static var enabled = true

    // App version, iOS version and model, so phones sharing one address still count apart.
    private static let userAgent: String = {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?"
        var info = utsname()
        uname(&info)
        let model = withUnsafeBytes(of: info.machine) { String(decoding: $0.prefix { $0 != 0 }, as: UTF8.self) }
        let os = ProcessInfo.processInfo.operatingSystemVersion
        return "Bulbula-iOS/\(version) (iOS \(os.majorVersion).\(os.minorVersion).\(os.patchVersion); \(model))"
    }()

    static func view(slug: String? = nil) { send(["type": "pageview"], slug: slug) }

    /// call · directions · maps · website · share
    static func action(_ action: String, slug: String) { send(["type": "action", "action": action], slug: slug) }

    static func search(_ query: String, results: Int) { send(["type": "search", "query": query, "results": results]) }

    static func filter(_ category: String) { send(["type": "filter", "query": category]) }

    private static func send(_ event: [String: Any], slug: String? = nil) {
        guard enabled else { return }
        let locale = Site.locale
        var body = event
        body["platform"] = "ios"
        body["locale"] = locale
        // Paths as the website's, so the report's "pages" line up across platforms.
        body["path"] = slug.map { "/\(locale)/b/\($0)" } ?? "/\(locale)"
        if let slug { body["slug"] = slug }
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var request = URLRequest(url: Site.url.appending(path: "e"))
        request.httpMethod = "POST"
        request.setValue("text/plain", forHTTPHeaderField: "Content-Type")
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.httpBody = data
        URLSession.shared.dataTask(with: request).resume() // offline: the count is simply lost
    }
}
