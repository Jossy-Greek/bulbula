import Charts
import CoreLocation
import SwiftUI

struct SignInView: View {
    let onSignedIn: () -> Void
    @Environment(AdminModel.self) private var admin
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var failed = false

    var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.username)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField("Password", text: $password)
                    .textContentType(.password)
            } footer: {
                if failed { Text("Email or password is wrong").foregroundStyle(Color.closed) }
            }
            Section {
                Button {
                    busy = true
                    Task {
                        failed = !(await admin.signIn(email: email, password: password))
                        busy = false
                        if !failed { onSignedIn() }
                    }
                } label: {
                    Group { if busy { ProgressView() } else { Text("Sign in") } }.frame(maxWidth: .infinity).padding(.vertical, 6)
                }
                .buttonStyle(.glassProminent)
                .disabled(busy || email.isEmpty || password.isEmpty)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            }
        }
        .navigationTitle("Sign in")
        .onAppear { if email.isEmpty { email = admin.lastEmail } }
    }
}

/// Pending submissions and leads, places not yet confirmed, and visitors' reviews.
struct ReviewView: View {
    @Environment(AdminModel.self) private var admin
    @State private var tab = 0

    var body: some View {
        List {
            Picker(selection: $tab) {
                Text("Pending \(admin.pending.count)").tag(0)
                Text("Unconfirmed \(admin.unconfirmed.count)").tag(1)
                Text("Reviews \(admin.reviews.count)").tag(2)
            } label: {
                Text("Review")
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())

            if tab == 2 {
                ForEach(admin.reviews) { ReviewRow(review: $0) }
            } else {
                Section {
                    ForEach(tab == 0 ? admin.pending : admin.unconfirmed) { p in
                        NavigationLink(value: Route.edit(p.id)) {
                            HStack(spacing: 14) {
                                if let c = p.category { IconTile(category: c) }
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(verbatim: p.name).font(.body.weight(.semibold)).lineLimit(2)
                                    // Who sent it, or how to reach it: what the reviewer acts on.
                                    let line = p.submitter?.name ?? [p.landmark, p.phone].compactMap { $0 }.joined(separator: " · ")
                                    if !line.isEmpty { Text(verbatim: line).font(.subheadline).foregroundStyle(.secondary).lineLimit(1) }
                                }
                            }
                        }
                    }
                }
            }
        }
        .overlay {
            let empty = tab == 0 ? admin.pending.isEmpty : tab == 1 ? admin.unconfirmed.isEmpty : admin.reviews.isEmpty
            if empty && !admin.loading { ContentUnavailableView { Text(admin.failed ? "Can't reach Bulbula" : "Nothing to review") } }
        }
        .navigationTitle("Review")
        .refreshable { await admin.reload() }
        .onAppear { tab = [admin.pending, admin.unconfirmed].firstIndex { !$0.isEmpty } ?? (admin.reviews.isEmpty ? 0 : 2) }
    }
}

/// A visitor's review: stars, who, where, what they wrote; publish or reject.
private struct ReviewRow: View {
    let review: PendingReview
    @Environment(AdminModel.self) private var admin
    @State private var busy = false
    @State private var failed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(verbatim: String(repeating: "★", count: review.rating) + String(repeating: "☆", count: max(0, 5 - review.rating))).foregroundStyle(Color.community)
                Text(verbatim: review.author).fontWeight(.semibold)
            }
            if let place = review.business?.name { Text(verbatim: place).font(.subheadline).foregroundStyle(.secondary) }
            if let text = review.text, !text.isEmpty { Text(verbatim: text) }
            if failed { Text("Not saved. Try again.").font(.subheadline).foregroundStyle(Color.closed) }
            GlassEffectContainer(spacing: 10) {
                HStack(spacing: 10) {
                    Button { decide(true) } label: { Text("Publish").frame(maxWidth: .infinity) }.buttonStyle(.glassProminent)
                    Button { decide(false) } label: { Text("Reject").frame(maxWidth: .infinity).foregroundStyle(Color.closed) }.buttonStyle(.glass)
                }
            }
            .disabled(busy)
            .padding(.top, 6)
        }
        .padding(.vertical, 4)
    }

    private func decide(_ publish: Bool) {
        busy = true
        Task {
            failed = !(await admin.moderate(review, publish: publish))
            busy = false
        }
    }
}

/// Fix what's wrong on the spot (phones, hours, where it is), then publish, confirm or save.
struct EditPlaceView: View {
    let id: Int
    let onDone: () -> Void
    @Environment(AdminModel.self) private var admin
    @Environment(DirectoryModel.self) private var directory
    @State private var place: AdminPlace?
    @State private var phone = ""
    @State private var phone2 = ""
    @State private var hours = ""
    @State private var landmark = ""
    @State private var pin: (Double, Double)?
    @State private var locating = false
    @State private var busy = false
    @State private var failed = false
    @State private var rejecting = false

    var body: some View {
        Group {
            if let p = place { form(p) } else { ProgressView() }
        }
        .task {
            guard place == nil else { return }
            var found = (admin.pending + admin.unconfirmed).first { $0.id == id }
            if found == nil { found = await admin.place(id) }
            guard let p = found else { return onDone() }
            (place, phone, phone2, hours, landmark) = (p, p.phone ?? "", p.phone2 ?? "", p.hours ?? "", p.landmark ?? "")
        }
    }

    private func form(_ p: AdminPlace) -> some View {
        let hoursOK = hours.trimmingCharacters(in: .whitespaces).isEmpty || Hours.parse(hours) != nil
        let shown = pin ?? p.lat.flatMap { lat in p.lng.map { (lat, $0) } }
        return Form {
            Section {
                HStack(spacing: 14) {
                    if let c = p.category { IconTile(category: c, size: 48) }
                    VStack(alignment: .leading) {
                        Text(verbatim: p.name).font(.title3.bold())
                        if let c = p.category { Text(verbatim: c.name).font(.subheadline).foregroundStyle(.secondary) }
                    }
                }
                .listRowBackground(Color.clear)
            }
            // Who sent it: call them to check before publishing.
            if let s = p.submitter, let name = s.name, !name.isEmpty {
                Section {
                    if let phone = s.phone, let url = telURL(phone) {
                        Link(destination: url) { Label { Text(verbatim: "\(name) · \(phone)") } icon: { Image(systemName: "person") } }
                    } else {
                        Label { Text(verbatim: name) } icon: { Image(systemName: "person") }
                    }
                }
            }
            Section {
                TextField("Phone", text: $phone).keyboardType(.phonePad)
                TextField("Second phone", text: $phone2).keyboardType(.phonePad)
                TextField("Hours", text: $hours, prompt: Text(verbatim: "Mo-Sa 08:00-18:00"))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .foregroundStyle(hoursOK ? Color.primary : Color.closed)
                TextField("Where in Bulbula?", text: $landmark)
            }
            Section {
                Button {
                    locating = true
                    Task { pin = await currentPin() ?? pin; locating = false }
                } label: {
                    Label {
                        if let shown { Text(verbatim: String(format: "%.5f, %.5f", shown.0, shown.1)) } else { Text("Use my location") }
                    } icon: {
                        Image(systemName: pin == nil ? "location" : "location.fill")
                    }
                    .foregroundStyle(pin == nil ? Color.brand : Color.open)
                }
                .disabled(locating)
            }
            Section {
                if failed { Text("Not saved. Try again.").foregroundStyle(Color.closed) }
                let ready = !busy && hoursOK
                VStack(spacing: 10) {
                    if p.pending {
                        Button { submit(p, decision: true, confirm: false) } label: { wide(Text("Publish")) }.buttonStyle(.glassProminent).disabled(!ready)
                        Button(role: .destructive) { rejecting = true } label: { wide(Text("Reject")) }.buttonStyle(.glass).disabled(busy)
                    } else if p.isUnconfirmed {
                        Button { submit(p, decision: nil, confirm: true) } label: { wide(Text("Confirm")) }.buttonStyle(.glassProminent).disabled(!ready)
                        Button { submit(p, decision: nil, confirm: false) } label: { wide(Text("Save")) }.buttonStyle(.glass).disabled(!ready)
                    } else {
                        Button { submit(p, decision: nil, confirm: false) } label: { wide(Text("Save")) }.buttonStyle(.glassProminent).disabled(!ready)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            }
        }
        .navigationTitle("Edit")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(Text("Reject \(p.name)?"), isPresented: $rejecting, titleVisibility: .visible) {
            Button("Reject", role: .destructive) { submit(p, decision: false, confirm: false) }
            Button("Cancel", role: .cancel) {}
        }
    }

    private func wide(_ label: Text) -> some View { label.frame(maxWidth: .infinity).padding(.vertical, 6) }

    private func submit(_ p: AdminPlace, decision: Bool?, confirm: Bool) {
        busy = true
        failed = false
        let fields = placeFields(phone: phone, phone2: phone2, hours: hours, landmark: landmark, pin: pin, confirm: confirm)
        Task {
            let ok = await admin.save(p, fields: fields, decision: decision)
            busy = false
            if ok {
                await directory.refresh()
                onDone()
            } else {
                failed = true
            }
        }
    }
}

/// One fresh fix from the phone, or nil. Asks for location access the first time.
private func currentPin() async -> (Double, Double)? {
    let session = CLServiceSession(authorization: .whenInUse)
    defer { withExtendedLifetime(session) {} }
    do {
        for try await update in CLLocationUpdate.liveUpdates() {
            if let l = update.location { return (l.coordinate.latitude, l.coordinate.longitude) }
            if update.authorizationDenied || update.authorizationDeniedGlobally { return nil }
        }
    } catch {}
    return nil
}

/// The site's analytics (the same report as /admin/analytics), sized for a phone.
struct AnalyticsView: View {
    @Environment(AdminModel.self) private var admin
    @State private var range = 30
    @State private var report: Report?
    @State private var failed = false

    var body: some View {
        List {
            Picker(selection: $range) {
                ForEach([7, 30, 90], id: \.self) { Text("\($0) days").tag($0) }
            } label: {
                Text("Analytics")
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())

            if let r = report, r.range == range {
                Section {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
                        Stat(label: Text("Visitors"), kpi: r.kpis.visitors)
                        Stat(label: Text("Page views"), kpi: r.kpis.pageviews)
                        Stat(label: Text("Leads"), kpi: r.kpis.leads)
                        Stat(label: Text("Searches"), kpi: r.kpis.searches)
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }
                if r.days.contains(where: { $0.visitors > 0 }) {
                    Section {
                        Chart(r.days) { d in
                            BarMark(x: .value("Day", d.date), y: .value("Visitors", d.visitors), width: .fixed(min(10, 260 / CGFloat(max(r.days.count, 1)))))
                                .foregroundStyle(Color.brand)
                                .clipShape(.capsule)
                        }
                        .chartXAxis(.hidden)
                        .frame(height: 110)
                        .padding(.vertical, 8)
                    }
                }
                top(Text("Businesses people acted on"), r.businesses.filter { $0.leads > 0 }.sorted { $0.leads > $1.leads }.prefix(10).map { ($0.name, $0.leads) })
                top(Text("Searches"), r.searches.prefix(10).map { ("“\($0.key)”", $0.count) })
                top(Text("Searches with no results"), r.emptySearches.prefix(10).map { ("“\($0.key)”", $0.count) })
            }
        }
        .overlay {
            if report?.range != range { if failed { ContentUnavailableView { Text("Can't reach Bulbula") } } else { ProgressView() } }
        }
        .navigationTitle("Analytics")
        .toolbar {
            if let live = report?.live {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 5) {
                        Circle().fill(live > 0 ? Color.open : Color.secondary).frame(width: 7, height: 7)
                        Text("\(live) now").font(.subheadline)
                    }
                    .padding(.horizontal, 6)
                }
            }
        }
        .task(id: range) {
            failed = false
            if let r = await admin.report(range) { report = r } else { failed = true }
        }
    }

    @ViewBuilder
    private func top(_ title: Text, _ rows: [(String, Int)]) -> some View {
        if !rows.isEmpty {
            Section {
                ForEach(rows, id: \.0) { name, count in
                    LabeledContent { Text(verbatim: "\(count)").fontWeight(.semibold) } label: { Text(verbatim: name).lineLimit(1) }
                }
            } header: {
                title
            }
        }
    }
}

/// A number, its name, and the change from the period before.
private struct Stat: View {
    let label: Text
    let kpi: Report.Kpi

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(verbatim: kpi.value.formatted()).font(.title.bold())
            HStack(spacing: 6) {
                label.font(.subheadline).foregroundStyle(.secondary)
                if kpi.previous > 0 {
                    let pct = Int(((Double(kpi.value - kpi.previous) / Double(kpi.previous)) * 100).rounded())
                    if pct != 0 { Text(verbatim: pct > 0 ? "+\(pct)%" : "−\(-pct)%").font(.caption.bold()).foregroundStyle(pct > 0 ? Color.open : Color.closed) }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground), in: .rect(cornerRadius: 18))
    }
}
