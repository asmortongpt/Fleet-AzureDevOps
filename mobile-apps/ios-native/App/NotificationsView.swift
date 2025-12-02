import SwiftUI

struct NotificationsView: View {
    var body: some View {
        List {
            Text("No notifications")
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Notifications")
    }
}

#Preview {
    if #available(iOS 16.0, *) {
        NavigationStack {
            NotificationsView()
        }
    } else {
        NavigationView {
            NotificationsView()
        }
    }
}
