import SwiftUI

// Administrator app view
// Provides administrative interface for fleet management
struct AdminApp: View {
    @EnvironmentObject var navigationCoordinator: NavigationCoordinator

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar")
                }

            Text("Vehicle List View - Coming Soon")
                .font(.title)
                .padding()
                .tabItem {
                    Label("Vehicles", systemImage: "car.2")
                }

            DriverManagementView()
                .tabItem {
                    Label("Drivers", systemImage: "person.3")
                }

            ReportsView()
                .tabItem {
                    Label("Reports", systemImage: "doc.text")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}

#if DEBUG
struct AdminApp_Previews: PreviewProvider {
    static var previews: some View {
        AdminApp()
            .environmentObject(NavigationCoordinator())
    }
}
#endif
