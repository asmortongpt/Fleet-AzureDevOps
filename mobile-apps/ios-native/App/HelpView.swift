import SwiftUI

struct HelpView: View {
    var body: some View {
        List {
            Section("Support") {
                Link("Contact Support", destination: URL(string: "mailto:support@example.com")!)
                Link("Documentation", destination: URL(string: "https://example.com/docs")!)
            }
        }
        .navigationTitle("Help")
    }
}

#Preview {
    if #available(iOS 16.0, *) {
        NavigationStack {
            HelpView()
        }
    } else {
        NavigationView {
            HelpView()
        }
    }
}
