import Foundation
import Testing
@testable import Bulbula

/// The same cases as the Android app's HoursTest; lib/hours.ts is the source of truth.
struct HoursTests {
    let monday = 0, sunday = 6
    func at(_ day: Int, _ h: Int, _ m: Int = 0) -> (day: Int, minutes: Int) { (day, h * 60 + m) }

    @Test func alwaysOpen() { #expect(Hours.status(Hours.parse("24/7")!, now: at(monday, 3)) == .always) }
    @Test func openInsideRange() { #expect(Hours.status(Hours.parse("Mo-Sa 08:30-19:00; Su 10:00-16:00")!, now: at(monday, 12)) == .open(closesAt: 19 * 60)) }
    @Test func closedBeforeOpeningToday() { #expect(Hours.status(Hours.parse("Mo-Sa 08:30-19:00")!, now: at(monday, 7)) == .closed(opensDay: monday, opensAt: 8 * 60 + 30, today: true)) }
    @Test func closedDayPointsToNextOpening() { #expect(Hours.status(Hours.parse("Mo-Sa 08:00-18:00; Su off")!, now: at(sunday, 12)) == .closed(opensDay: monday, opensAt: 8 * 60, today: false)) }
    @Test func pastMidnight() { #expect(Hours.status(Hours.parse("Mo-Su 18:00-02:00")!, now: at(monday, 1)) == .open(closesAt: 2 * 60)) }
    @Test func laterRuleReplaces() { #expect(Hours.status(Hours.parse("Mo-Su 08:00-20:00; Su 10:00-16:00")!, now: at(sunday, 9)) == .closed(opensDay: sunday, opensAt: 10 * 60, today: true)) }
    @Test func freeTextIsUnknown() { #expect(Hours.parse("Mon–Sat 8am till late") == nil) }
    @Test func clockWraps() { #expect(Hours.clock(26 * 60) == "02:00") }
    @Test func addisIsUTCPlus3() {
        // 2026-11-02 (Monday) 06:30 UTC is 09:30 in Addis Ababa.
        let now = Hours.addisNow(Date(timeIntervalSince1970: 1_793_601_000))
        #expect(now.day == monday && now.minutes == 9 * 60 + 30)
    }
}

/// directory-sample.json is the Android tests' trimmed copy of the site's /en/directory.json:
/// if the site's shape changes, both apps' tests fail first.
struct DirectoryTests {
    let directory: Directory = {
        let url = Bundle(for: Marker.self).url(forResource: "directory-sample", withExtension: "json")!
        return try! JSONDecoder().decode(Directory.self, from: Data(contentsOf: url))
    }()

    @Test func siteJSONDecodes() {
        #expect(directory.listings.count == 3)
        #expect(directory.services?["toilet"] != nil)
        #expect(directory.listings.allSatisfy { $0.mapsUrl.hasPrefix("https://") })
    }

    @Test func searchMatchesNamesCategoriesAndLandmarks() {
        #expect(directory.listings.matching("prodent", category: nil).map(\.name) == ["Prodent Speciality Dental Clinic"])
        #expect(directory.listings.matching("bulbula mariam", category: nil).contains { $0.name.hasPrefix("Prodent") })
        #expect(directory.listings.matching("", category: "clinics").allSatisfy { $0.category.slug == "clinics" })
    }

    @Test func phonesDialWithCountryCode() {
        #expect(telURL("0956 464 748")?.absoluteString == "tel:+251956464748")
        #expect(telURL("+251 93 501 7555")?.absoluteString == "tel:+251935017555")
    }
}

/// The admin side reads Payload's documents and follows the web dashboard's rules.
struct AdminTests {
    func place(_ json: String) throws -> AdminPlace { try JSONDecoder().decode(AdminPlace.self, from: Data(json.utf8)) }

    @Test func claimsIsAnIdOrAPopulatedListing() throws {
        #expect(try place(#"{"id":1,"name":"A","status":"pending","claims":9}"#).claimsId == 9)
        #expect(try place(#"{"id":1,"name":"A","status":"pending","claims":{"id":7,"name":"Old"}}"#).claimsId == 7)
        #expect(try place(#"{"id":1,"name":"A","status":"pending","claims":null}"#).claimsId == nil)
    }

    @Test func ownersPublishAsClaimedTipsAndLeadsDont() throws {
        #expect(try place(#"{"id":1,"name":"A","status":"pending","submitter":{"name":"Selam","relationship":"owner"}}"#).byOwner)
        #expect(try !place(#"{"id":1,"name":"A","status":"pending","submitter":{"name":"Abebe","relationship":"customer"}}"#).byOwner)
        #expect(try !place(#"{"id":1,"name":"A","status":"pending"}"#).byOwner)
    }

    @Test func blankFieldsClearAndConfirmUnsetsUnconfirmed() {
        let f = placeFields(phone: "0911 000 000", phone2: " ", hours: "", landmark: "Near 93", pin: (8.95, 38.78), confirm: true)
        #expect(f["phone"] as? String == "0911 000 000")
        #expect(f["phone2"] is NSNull)
        #expect(f["unconfirmed"] as? Bool == false)
        #expect(f["lat"] as? Double == 8.95)
    }

    @Test func reportDecodesTheSiteShape() throws {
        let json = #"{"range":7,"kpis":{"visitors":{"value":120,"previous":100},"pageviews":{"value":300,"previous":0},"leads":{"value":9,"previous":12},"searches":{"value":40,"previous":40}},"live":2,"days":[{"date":"2026-11-01","visitors":20,"pageviews":50}],"businesses":[{"slug":"lomi","name":"Lomi","views":30,"calls":3,"directions":2,"maps":1,"other":0}],"pages":[],"sources":[],"devices":[],"locales":[],"searches":[{"key":"bank","count":4}],"emptySearches":[],"filters":[],"actions":[],"total":420}"#
        let r = try JSONDecoder().decode(Report.self, from: Data(json.utf8))
        #expect(r.kpis.visitors.value == 120)
        #expect(r.businesses.first?.leads == 6)
    }
}

private final class Marker {}
