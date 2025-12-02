import SwiftUI

struct MaintenanceDetailView: View {
    let maintenanceId: String
    @State private var maintenance: MaintenanceRecord?
    @State private var isLoading = true
    private let repository = MaintenanceRepository()

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading...")
            } else if let maintenance = maintenance {
                VStack {
                    Text("Maintenance Detail")
                    Text(maintenance.type.rawValue)
                }
                .navigationTitle("Maintenance")
            } else {
                Text("Maintenance not found")
                    .foregroundColor(.secondary)
            }
        }
        .task {
            await loadMaintenance()
        }
    }

    private func loadMaintenance() async {
        do {
            maintenance = try repository.fetch(byId: maintenanceId)
        } catch {
            print("Failed to load maintenance: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    MaintenanceDetailView(maintenanceId: "test-maintenance-123")
}
