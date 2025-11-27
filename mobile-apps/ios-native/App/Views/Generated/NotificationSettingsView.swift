t
// Import necessary modules
import SwiftUI
import Combine

// MARK: - Notification Categories
enum NotificationCategory: String, CaseIterable {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case alert = "Alert"
    case incident = "Incident"
}

// MARK: - ViewModel
class NotificationSettingsViewModel: ObservableObject {
    @Published var notificationPreferences: [NotificationCategory: Bool] = [:]

    // Mock fetching user's notification preferences from backend
    init() {
        NotificationCategory.allCases.forEach {
            self.notificationPreferences[$0] = Bool.random()
        }
    }

    // Mock updating user's notification preferences in backend
    func updatePreferences(for category: NotificationCategory, to value: Bool) {
        notificationPreferences[category] = value
    }
}

// MARK: - View
struct NotificationSettingsView: View {
    @StateObject private var viewModel = NotificationSettingsViewModel()

    var body: some View {
        NavigationView {
            Form {
                ForEach(NotificationCategory.allCases, id: \.self) { category in
                    Toggle(isOn: $viewModel.notificationPreferences[category].wrappedValue) {
                        Text(category.rawValue)
                    }
                    .accessibilityLabel(category.rawValue)
                    .accessibilityHint("Toggle to enable or disable notifications for \(category.rawValue)")
                }
            }
            .navigationTitle("Notification Settings")
        }
    }
}

// MARK: - Preview
#if DEBUG
struct NotificationSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NotificationSettingsView()
    }
}
#endif