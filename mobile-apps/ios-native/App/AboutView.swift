import SwiftUI

struct AboutView: View {
    var body: some View {
        List {
            Section("App Information") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Text("Build")
                    Spacer()
                    Text("1")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("About")
    }
}

#Preview {
    if #available(iOS 16.0, *) {
        NavigationStack {
            AboutView()
        }
    } else {
        NavigationView {
            AboutView()
        }
    }
}
