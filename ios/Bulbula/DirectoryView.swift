import SwiftUI

/// The title, search (iOS's glass search bar) and categories, then the places.
struct DirectoryView: View {
    @Environment(DirectoryModel.self) private var model
    @Environment(AdminModel.self) private var admin
    @State private var query = ""
    @State private var category: String?

    var body: some View {
        TimelineView(.everyMinute) { context in
            let now = Hours.addisNow(context.date)
            let places = model.directory?.listings.matching(query, category: category) ?? []
            List {
                if let categories = model.directory?.categories {
                    Categories(categories: categories, selected: $category)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
                Section {
                    ForEach(places) { place in
                        NavigationLink(value: Route.place(place.slug)) {
                            PlaceRow(place: place, showCategory: category == nil, now: now)
                        }
                    }
                }
            }
            .overlay {
                if model.directory == nil {
                    if model.failed {
                        ContentUnavailableView {
                            Text("Can't reach Bulbula")
                        } actions: {
                            Button("Try again") { Task { await model.refresh() } }.buttonStyle(.glassProminent)
                        }
                    } else {
                        ProgressView()
                    }
                } else if places.isEmpty {
                    ContentUnavailableView { Text("No places") }
                }
            }
        }
        .navigationTitle("Bulbula")
        .searchable(text: $query, prompt: Text("Search"))
        .refreshable {
            await model.refresh()
            await admin.reload()
        }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if admin.session != nil && admin.waiting > 0 {
                    NavigationLink(value: Route.review) {
                        Image(systemName: "checklist")
                            .overlay(alignment: .topTrailing) { Circle().fill(Color.closed).frame(width: 8, height: 8).offset(x: 3, y: -3) }
                    }
                    .accessibilityLabel(Text("Review"))
                }
                NavigationLink(value: Route.settings) { Image(systemName: "gearshape") }
                    .accessibilityLabel(Text("Settings"))
            }
        }
    }
}

/// Category chips on glass; the chosen one tinted. Tapping it again shows all.
private struct Categories: View {
    let categories: [Category]
    @Binding var selected: String?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            GlassEffectContainer(spacing: 8) {
                HStack(spacing: 8) {
                    Chip(label: Text("All"), on: selected == nil) { selected = nil }
                    ForEach(categories, id: \.slug) { c in
                        Chip(label: Text(verbatim: c.name), on: selected == c.slug) { selected = selected == c.slug ? nil : c.slug }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
            }
        }
        .scrollClipDisabled()
    }
}

private struct Chip: View {
    let label: Text
    let on: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            label
                .font(.subheadline.weight(on ? .semibold : .medium))
                .foregroundStyle(on ? Color.white : Color.primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
        }
        .buttonStyle(.plain)
        .glassEffect(on ? .regular.tint(.brand).interactive() : .regular.interactive(), in: .capsule)
    }
}

private struct PlaceRow: View {
    let place: Place
    let showCategory: Bool
    let now: (day: Int, minutes: Int)

    var body: some View {
        HStack(spacing: 14) {
            IconTile(category: place.category)
            VStack(alignment: .leading, spacing: 3) {
                Text(verbatim: place.name).font(.body.weight(.semibold)).lineLimit(2)
                let status = OpenLine(place.hoursSpec, now: now, short: true)
                if status != nil || showCategory {
                    HStack(spacing: 5) {
                        if let status {
                            Circle().fill(status.color).frame(width: 6, height: 6)
                            Text(status.label).foregroundStyle(status.color).fontWeight(.medium)
                        }
                        if status != nil && showCategory { Text(verbatim: "·").foregroundStyle(.secondary) }
                        if showCategory { Text(verbatim: place.category.name).foregroundStyle(.secondary) }
                    }
                    .font(.subheadline)
                    .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 2)
    }
}
