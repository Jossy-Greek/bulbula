import SwiftUI

/// Appearance and language, the website's add-a-business and home pages, and the admin side.
struct SettingsView: View {
    @Environment(AdminModel.self) private var admin
    @AppStorage("appearance") private var appearance = Appearance.system
    @Environment(\.openURL) private var openURL

    var body: some View {
        Form {
            Section {
                Picker(selection: $appearance) {
                    Text("System").tag(Appearance.system)
                    Text("Light").tag(Appearance.light)
                    Text("Dark").tag(Appearance.dark)
                } label: {
                    Text("Appearance")
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
            } header: {
                Text("Appearance")
            }

            Section {
                // iOS keeps each app's language in Settings → Bulbula → Language.
                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                } label: {
                    LabeledContent {
                        Text(verbatim: Site.locale == "am" ? "አማርኛ" : "English")
                    } label: {
                        Label("Language", systemImage: "globe")
                    }
                }
                .foregroundStyle(Color.primary)
            }

            Section {
                Link(destination: Site.url.appending(path: "\(Site.locale)/add")) { Label("Add your business", systemImage: "plus.circle") }
                Link(destination: Site.url.appending(path: Site.locale)) { Label("Website", systemImage: "safari") }
            }

            // For the site's existing admin accounts; everyone else only sees "Sign in".
            Section {
                if let session = admin.session {
                    NavigationLink(value: Route.review) { Label("Review", systemImage: "checklist") }
                        .badge(admin.waiting)
                    NavigationLink(value: Route.analytics) { Label("Analytics", systemImage: "chart.bar") }
                    Button(role: .destructive) { admin.signOut() } label: {
                        LabeledContent {
                            Text(verbatim: session.email)
                        } label: {
                            Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                } else {
                    NavigationLink(value: Route.signIn) { Label("Sign in", systemImage: "person.crop.circle") }
                }
            } footer: {
                Text(verbatim: "Bulbula \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "")")
                    .frame(maxWidth: .infinity)
                    .padding(.top, 12)
            }
        }
        .navigationTitle("Settings")
    }
}
