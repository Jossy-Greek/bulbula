import SwiftUI

/// The website's colours (app/(frontend)/globals.css), each with a dark counterpart.
extension Color {
    static let brand = Color(light: 0x1F7A85, dark: 0x6CC3CC) // teal: businesses, links, actions
    static let community = Color(light: 0x8A5300, dark: 0xF2B134) // amber: worship, public, community
    static let open = Color(light: 0x17703D, dark: 0x4CC38A)
    static let closed = Color(light: 0xA3321F, dark: 0xFF8A75)

    /// Nonisolated: system materials (Liquid Glass) resolve colours off the main thread.
    nonisolated init(light: UInt32, dark: UInt32) {
        let light = UIColor(rgb: light), dark = UIColor(rgb: dark)
        self.init(uiColor: UIColor { @Sendable traits in traits.userInterfaceStyle == .dark ? dark : light })
    }
}

private extension UIColor {
    nonisolated convenience init(rgb v: UInt32) {
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}

/// The website's category icons (Lucide names) as the closest SF Symbols.
func categorySymbol(_ icon: String?) -> String {
    switch icon {
    case "coffee": "cup.and.saucer"
    case "croissant": "birthday.cake"
    case "shopping-cart": "cart"
    case "pill": "pills"
    case "stethoscope": "stethoscope"
    case "landmark": "building.columns"
    case "bed": "bed.double"
    case "home", "house": "house"
    case "scissors": "scissors"
    case "dumbbell": "dumbbell"
    case "wrench": "wrench.and.screwdriver"
    case "graduation-cap": "graduationcap"
    case "heart-pulse": "waveform.path.ecg"
    case "church": "building"
    case "shield": "shield"
    case "hand-heart": "hands.and.sparkles"
    default: "storefront"
    }
}

/// A category's icon on a soft tile; community places in amber, businesses in teal.
struct IconTile: View {
    let category: Category
    var size: CGFloat = 40

    var body: some View {
        let tint: Color = category.group == "community" ? .community : .brand
        Image(systemName: categorySymbol(category.icon))
            .font(.system(size: size * 0.45, weight: .medium))
            .foregroundStyle(tint)
            .frame(width: size, height: size)
            .background(tint.opacity(0.13), in: .rect(cornerRadius: size * 0.28))
    }
}

/// "Open now · until 19:00", or nil when the hours aren't known. `short` drops the detail, for lists.
struct OpenLine {
    let label: LocalizedStringKey
    let detail: Text?
    let open: Bool

    var color: Color { open ? .open : .closed }

    init?(_ spec: String?, now: (day: Int, minutes: Int), short: Bool) {
        guard let week = Hours.parse(spec) else { return nil }
        switch Hours.status(week, now: now) {
        case .always:
            (label, detail, open) = ("Open 24 hours", nil, true)
        case .open(let closesAt):
            (label, detail, open) = ("Open now", short ? nil : Text("until \(Hours.clock(closesAt))"), true)
        case .closed(let day, let at, let today):
            let detail: Text? = short ? nil : today ? Text("opens \(Hours.clock(at))") : Text("opens \(dayName(day)) \(Hours.clock(at))")
            (label, self.detail, open) = ("Closed", detail, false)
        case .closedAllWeek:
            (label, detail, open) = ("Closed", nil, false)
        }
    }
}

/// Short weekday names, as on the website.
func dayName(_ day: Int) -> String {
    let names = Site.locale == "am" ? ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ", "እሑድ"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return names[day]
}

/// Ethiopian numbers dial with +251 (the website's telHref).
nonisolated func telURL(_ phone: String) -> URL? {
    let digits = phone.filter { $0.isNumber || $0 == "+" }
    let full = digits.hasPrefix("+") ? digits : digits.hasPrefix("0") ? "+251" + digits.dropFirst() : digits
    return URL(string: "tel:\(full)")
}

/// Apple Maps to the pin, or the place's Google Maps link when there's no pin.
func directionsURL(_ place: Place) -> URL? {
    if let lat = place.lat, let lng = place.lng {
        var c = URLComponents(string: "https://maps.apple.com/")!
        c.queryItems = [URLQueryItem(name: "daddr", value: "\(lat),\(lng)"), URLQueryItem(name: "q", value: place.name)]
        return c.url
    }
    return URL(string: place.mapsUrl)
}

func webURL(_ url: String) -> URL? {
    URL(string: url.lowercased().hasPrefix("http") ? url : "https://\(url)")
}

/// Wraps its children onto new lines, like text (service chips).
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        rows(proposal.width ?? .infinity, subviews).last.map { CGSize(width: proposal.width ?? $0.maxX, height: $0.maxY) } ?? .zero
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for frame in rows(bounds.width, subviews) {
            subviews[frame.index].place(at: CGPoint(x: bounds.minX + frame.x, y: bounds.minY + frame.y), proposal: .unspecified)
        }
    }

    private struct Frame { let index: Int; let x, y, maxX, maxY: CGFloat }

    private func rows(_ width: CGFloat, _ subviews: Subviews) -> [Frame] {
        var x: CGFloat = 0, y: CGFloat = 0, line: CGFloat = 0, frames: [Frame] = [], widest: CGFloat = 0
        for (i, view) in subviews.enumerated() {
            let size = view.sizeThatFits(.unspecified)
            if x > 0 && x + size.width > width { x = 0; y += line + spacing; line = 0 }
            widest = max(widest, x + size.width)
            frames.append(Frame(index: i, x: x, y: y, maxX: widest, maxY: y + size.height))
            x += size.width + spacing
            line = max(line, size.height)
        }
        return frames.map { Frame(index: $0.index, x: $0.x, y: $0.y, maxX: widest, maxY: y + line) }
    }
}
