import Foundation

/// "Open now" for OpenStreetMap-style opening hours, in Addis Ababa time.
/// A port of the website's lib/hours.ts (and the Android app's Hours.kt); keep them in step.
///
/// Understands "24/7" and rules separated by ";", each "<days> <ranges>" or "<days> off",
/// e.g. "Mo-Fr 08:00-18:00; Sa 08:00-12:00,14:00-17:00; Su off". Anything else is unknown (nil).
nonisolated enum Hours {
    /// Minutes from midnight; `end` may pass 1440 for ranges that run past midnight.
    struct Range: Equatable {
        let start: Int
        let end: Int
    }

    /// Seven days, index 0 = Monday.
    typealias Week = [[Range]]

    enum Status: Equatable {
        case always
        case open(closesAt: Int)
        case closed(opensDay: Int, opensAt: Int, today: Bool)
        case closedAllWeek
    }

    private static let days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    // Regex values are immutable, so sharing them across threads is safe.
    nonisolated(unsafe) private static let rule = /^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(.*)$/
    nonisolated(unsafe) private static let range = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/

    static func parse(_ spec: String?) -> Week? {
        let s = (spec ?? "").trimmingCharacters(in: .whitespaces)
        if s.isEmpty { return nil }
        if s == "24/7" { return Array(repeating: [Range(start: 0, end: 1440)], count: 7) }
        var week: Week = Array(repeating: [], count: 7)
        for part in s.split(separator: ";").map({ $0.trimmingCharacters(in: .whitespaces) }) where !part.isEmpty {
            guard let m = part.wholeMatch(of: rule) else { return nil }
            var dayList = Array(0...6)
            if let d = m.1 {
                guard let expanded = expand(String(d)) else { return nil }
                dayList = expanded
            }
            let body = m.2.trimmingCharacters(in: .whitespaces)
            var ranges: [Range] = []
            if body != "off" && body != "closed" {
                for piece in body.split(separator: ",") {
                    guard let r = piece.trimmingCharacters(in: .whitespaces).wholeMatch(of: range) else { return nil }
                    let a = Int(r.1)! * 60 + Int(r.2)!
                    var b = Int(r.3)! * 60 + Int(r.4)!
                    if b <= a { b += 1440 }
                    ranges.append(Range(start: a, end: b))
                }
                ranges.sort { $0.start < $1.start }
            }
            for d in dayList { week[d] = ranges }
        }
        return week
    }

    private static func expand(_ list: String) -> [Int]? {
        var out: [Int] = []
        for part in list.split(separator: ",") {
            let ends = part.split(separator: "-").map(String.init)
            guard let i = days.firstIndex(of: ends[0]) else { return nil }
            guard let j = ends.count > 1 ? days.firstIndex(of: ends[1]) : i else { return nil }
            var k = i
            while true {
                if !out.contains(k) { out.append(k) }
                if k == j { break }
                k = (k + 1) % 7
            }
        }
        return out
    }

    /// Day of week (0 = Monday) and minutes since midnight, in Addis Ababa.
    static func addisNow(_ date: Date = .now) -> (day: Int, minutes: Int) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Africa/Addis_Ababa")!
        let c = calendar.dateComponents([.weekday, .hour, .minute], from: date)
        return ((c.weekday! + 5) % 7, c.hour! * 60 + c.minute!)
    }

    static func status(_ week: Week, now: (day: Int, minutes: Int) = addisNow()) -> Status {
        if week.allSatisfy({ $0.count == 1 && $0[0].start == 0 && $0[0].end >= 1440 }) { return .always }
        let (day, minutes) = now
        // A range from yesterday that runs past midnight.
        for r in week[(day + 6) % 7] where r.end > 1440 && minutes < r.end - 1440 { return .open(closesAt: r.end - 1440) }
        for r in week[day] where minutes >= r.start && minutes < r.end { return .open(closesAt: r.end) }
        for k in 0..<7 {
            let d = (day + k) % 7
            if let next = week[d].first(where: { k > 0 || $0.start > minutes }) { return .closed(opensDay: d, opensAt: next.start, today: k == 0) }
        }
        return .closedAllWeek
    }

    static func clock(_ minutes: Int) -> String {
        let m = ((minutes % 1440) + 1440) % 1440
        return String(format: "%02d:%02d", m / 60, m % 60)
    }
}
