import SwiftUI

// Driver-specific app view
// Provides driver-focused interface for vehicle operations
struct DriverApp: View {
    @EnvironmentObject var navigationCoordinator: NavigationCoordinator

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "gauge")
                }

            TripTrackingView()
                .tabItem {
                    Label("Trips", systemImage: "map")
                }

            MaintenanceView()
                .tabItem {
                    Label("Maintenance", systemImage: "wrench")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
        }
    }
}

#if DEBUG
struct DriverApp_Previews: PreviewProvider {
    static var previews: some View {
        DriverApp()
            .environmentObject(NavigationCoordinator())
    }
}
#endif
