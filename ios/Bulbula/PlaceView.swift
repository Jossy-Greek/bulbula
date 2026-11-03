import SwiftUI

/// One place: what it is, whether it's open, and the ways to reach it.
struct PlaceView: View {
    let slug: String
    @Environment(DirectoryModel.self) private var model
    @Environment(AdminModel.self) private var admin
    @Environment(\.openURL) private var openURL

    var body: some View {
        if let place = model.directory?.listings.first(where: { $0.slug == slug }) {
            TimelineView(.everyMinute) { context in
                content(place, now: Hours.addisNow(context.date))
            }
        } else if model.directory == nil {
            ProgressView()
        } else {
            ContentUnavailableView { Text("Place not found") }
        }
    }

    private func content(_ place: Place, now: (day: Int, minutes: Int)) -> some View {
        let status = OpenLine(place.hoursSpec, now: now, short: false)
        let always = Hours.parse(place.hoursSpec).map { Hours.status($0, now: now) == .always } ?? false
        let location = [place.landmark, place.address].compactMap { $0 }.reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }.joined(separator: ", ")
        let services = (place.services ?? []).compactMap { model.directory?.services?[$0] }

        return List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    IconTile(category: place.category, size: 56).padding(.bottom, 8)
                    Text(verbatim: place.name).font(.title.bold())
                    Text(verbatim: place.category.name).foregroundStyle(.secondary)
                    if let status {
                        HStack(spacing: 6) {
                            Circle().fill(status.color).frame(width: 7, height: 7)
                            Text(status.label).fontWeight(.semibold)
                            status.detail.map { $0.opacity(0.8) }
                        }
                        .font(.subheadline)
                        .foregroundStyle(status.color)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(status.color.opacity(0.12), in: .capsule)
                        .padding(.top, 6)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 0, leading: 4, bottom: 4, trailing: 4))
            }

            // The ways to reach it, on glass; the first one tinted.
            Section {
                GlassEffectContainer(spacing: 10) {
                    HStack(spacing: 10) {
                        if let phone = place.phone, let url = telURL(phone) {
                            Action(symbol: "phone.fill", label: Text("Call"), prominent: true) { openURL(url) }
                        }
                        if let url = directionsURL(place) {
                            Action(symbol: "arrow.triangle.turn.up.right.diamond.fill", label: Text("Directions"), prominent: place.phone == nil) { openURL(url) }
                        }
                        if let site = place.website, let url = webURL(site) {
                            Action(symbol: "safari", label: Text("Website"), prominent: false) { openURL(url) }
                        }
                    }
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            }

            if place.generated != true, let text = place.description, !text.isEmpty {
                Section { Text(verbatim: text) }
            }

            // Facts without labels: the icon says what each one is.
            Section {
                if let hours = place.hours, !always { Label { Text(verbatim: hours) } icon: { Image(systemName: "clock") } }
                if !location.isEmpty { Label { Text(verbatim: location) } icon: { Image(systemName: "mappin.and.ellipse") } }
                ForEach([place.phone, place.phone2].compactMap { $0 }, id: \.self) { phone in
                    if let url = telURL(phone) { Link(destination: url) { Label { Text(verbatim: phone) } icon: { Image(systemName: "phone") } } }
                }
                if let g = place.google, let url = URL(string: place.mapsUrl) {
                    Link(destination: url) {
                        Label { Text(verbatim: "\(g.rating.formatted(.number.precision(.fractionLength(1))))  (\(g.count))").foregroundStyle(Color.primary) } icon: {
                            Image(systemName: "star.fill").foregroundStyle(Color.community)
                        }
                    }
                }
            }

            if !services.isEmpty {
                Section {
                    FlowLayout {
                        ForEach(services, id: \.self) { s in
                            Text(verbatim: s).font(.subheadline).padding(.horizontal, 12).padding(.vertical, 7).background(.fill.tertiary, in: .capsule)
                        }
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4))
                }
            }

            if let menu = place.menu, !menu.isEmpty {
                ForEach(menu, id: \.self) { section in
                    Section {
                        ForEach(section.items, id: \.self) { item in
                            HStack {
                                Text(verbatim: item.name)
                                Spacer()
                                if let price = item.price { Text("\(price.formatted(.number.locale(Locale(identifier: "en")))) Br").fontWeight(.medium) }
                            }
                        }
                    } header: {
                        Text(verbatim: section.title)
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if admin.session != nil {
                    NavigationLink(value: Route.edit(place.id)) { Image(systemName: "pencil") }.accessibilityLabel(Text("Edit"))
                }
                ShareLink(item: Site.url.appending(path: "\(Site.locale)/b/\(place.slug)"), subject: Text(verbatim: place.name))
            }
        }
    }
}

/// An action: icon over its word, on glass; the main one tinted.
private struct Action: View {
    let symbol: String
    let label: Text
    let prominent: Bool
    let action: () -> Void

    var body: some View {
        let content = VStack(spacing: 5) {
            Image(systemName: symbol).font(.title3).frame(height: 26)
            label.font(.subheadline.weight(.semibold)).lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        if prominent {
            Button(action: action) { content }.buttonStyle(.glassProminent)
        } else {
            Button(action: action) { content }.buttonStyle(.glass)
        }
    }
}
