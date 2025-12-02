import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var metrics: DashboardMetrics?
    @Published var isLoading = false
    @Published var errorMessage: String?

    func loadDashboard() async {
        isLoading = true
        errorMessage = nil

        do {
            metrics = try await APIClient.shared.get(endpoint: "/dashboard/metrics")
            isLoading = false
            print("✅ Dashboard loaded: \(metrics?.totalVehicles ?? 0) vehicles")
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            print("❌ Dashboard load failed: \(error)")

            // Use mock data for demo
            loadMockData()
        }
    }

    func refresh() async {
        await loadDashboard()
    }

    private func loadMockData() {
        // Mock data for demo purposes
        metrics = DashboardMetrics(
            totalVehicles: 25,
            activeVehicles: 18,
            totalTrips: 142,
            activeTrips: 8,
            totalAlerts: 12,
            unreadAlerts: 5,
            averageFuelLevel: 0.68,
            totalMileage: 45_820.5,
            recentActivity: [
                .init(id: "1", type: "trip_start", message: "Vehicle #FL-1234 started trip", timestamp: Date().addingTimeInterval(-3600)),
                .init(id: "2", type: "maintenance", message: "Vehicle #FL-5678 completed maintenance", timestamp: Date().addingTimeInterval(-7200)),
                .init(id: "3", type: "alert", message: "Low fuel alert for Vehicle #FL-9012", timestamp: Date().addingTimeInterval(-10800))
            ]
        )
    }
}
