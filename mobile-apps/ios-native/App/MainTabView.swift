import SwiftUI

// MARK: - Main Tab View with iOS 15+ Support
struct MainTabView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var networkManager: AzureNetworkManager

    @State private var searchText = ""
    @State private var notificationCount = 0
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass: UserInterfaceSizeClass?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion: Bool

    var body: some View {
        TabView(selection: $navigationCoordinator.selectedTab) {
            // Dashboard Tab
            if #available(iOS 16.0, *) {
                NavigationStack(path: $navigationCoordinator.navigationPath) {
                    DashboardView()
                        .navigationDestination(for: NavigationDestination.self) { destination in
                            destinationView(for: destination)
                        }
                        .searchable(
                            text: $searchText,
                            placement: .navigationBarDrawer(displayMode: .always),
                            prompt: "Search fleet data..."
                        )
                        .toolbar {
                            ToolbarItem(placement: .bottomBar) {
                                quickActionToolbar
                            }
                        }
                }
                .tabItem {
                    Label(TabItem.dashboard.title, systemImage: TabItem.dashboard.systemImage)
                }
                .tag(TabItem.dashboard)
                .badge(notificationCount)
            } else {
                NavigationView {
                    DashboardView()
                        .searchable(
                            text: $searchText,
                            prompt: "Search fleet data..."
                        )
                        .toolbar {
                            ToolbarItem(placement: .bottomBar) {
                                quickActionToolbar
                            }
                        }
                }
                .navigationViewStyle(.stack)
                .tabItem {
                    Label(TabItem.dashboard.title, systemImage: TabItem.dashboard.systemImage)
                }
                .tag(TabItem.dashboard)
                .badge(notificationCount)
            }

            // Vehicles Tab
            if #available(iOS 16.0, *) {
                NavigationStack(path: $navigationCoordinator.navigationPath) {
                    VehiclesView()
                        .navigationDestination(for: NavigationDestination.self) { destination in
                            destinationView(for: destination)
                        }
                }
                .tabItem {
                    Label(TabItem.vehicles.title, systemImage: TabItem.vehicles.systemImage)
                }
                .tag(TabItem.vehicles)
            } else {
                NavigationView {
                    VehiclesView()
                }
                .navigationViewStyle(.stack)
                .tabItem {
                    Label(TabItem.vehicles.title, systemImage: TabItem.vehicles.systemImage)
                }
                .tag(TabItem.vehicles)
            }

            // Trips Tab
            if #available(iOS 16.0, *) {
                NavigationStack(path: $navigationCoordinator.navigationPath) {
                    TripsView()
                        .navigationDestination(for: NavigationDestination.self) { destination in
                            destinationView(for: destination)
                        }
                }
                .tabItem {
                    Label(TabItem.trips.title, systemImage: TabItem.trips.systemImage)
                }
                .tag(TabItem.trips)
            } else {
                NavigationView {
                    TripsView()
                }
                .navigationViewStyle(.stack)
                .tabItem {
                    Label(TabItem.trips.title, systemImage: TabItem.trips.systemImage)
                }
                .tag(TabItem.trips)
            }

            // Maintenance Tab
            if #available(iOS 16.0, *) {
                NavigationStack(path: $navigationCoordinator.navigationPath) {
                    MaintenanceView()
                        .navigationDestination(for: NavigationDestination.self) { destination in
                            destinationView(for: destination)
                        }
                }
                .tabItem {
                    Label(TabItem.maintenance.title, systemImage: TabItem.maintenance.systemImage)
                }
                .tag(TabItem.maintenance)
            } else {
                NavigationView {
                    MaintenanceView()
                }
                .navigationViewStyle(.stack)
                .tabItem {
                    Label(TabItem.maintenance.title, systemImage: TabItem.maintenance.systemImage)
                }
                .tag(TabItem.maintenance)
            }

            // More Tab
            if #available(iOS 16.0, *) {
                NavigationStack(path: $navigationCoordinator.navigationPath) {
                    MoreView()
                        .navigationDestination(for: NavigationDestination.self) { destination in
                            destinationView(for: destination)
                        }
                }
                .tabItem {
                    Label(TabItem.more.title, systemImage: TabItem.more.systemImage)
                }
                .tag(TabItem.more)
                .badge(notificationCount)
            } else {
                NavigationView {
                    MoreView()
                }
                .navigationViewStyle(.stack)
                .tabItem {
                    Label(TabItem.more.title, systemImage: TabItem.more.systemImage)
                }
                .tag(TabItem.more)
                .badge(notificationCount)
            }
        }
        .tabViewStyle(.automatic)
        .tint(ModernTheme.Colors.primary)
        .alert(navigationCoordinator.alertTitle, isPresented: $navigationCoordinator.showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(navigationCoordinator.alertMessage)
        }
        .task {
            await loadNotificationCount()
        }
    }

    // MARK: - Quick Action Toolbar
    private var quickActionToolbar: some View {
        HStack(spacing: ModernTheme.Spacing.lg) {
            Button(action: {
                ModernTheme.Haptics.light()
                navigationCoordinator.navigate(to: .addVehicle)
            }) {
                Label("Add Vehicle", systemImage: "plus.circle.fill")
                    .symbolRenderingMode(.hierarchical)
            }

            Button(action: {
                ModernTheme.Haptics.light()
                navigationCoordinator.navigate(to: .addTrip)
            }) {
                Label("Start Trip", systemImage: "location.circle.fill")
                    .symbolRenderingMode(.hierarchical)
            }
        }
        .font(.caption)
        .foregroundColor(ModernTheme.Colors.primary)
    }

    // MARK: - Load Notification Count
    private func loadNotificationCount() async {
        // Simulate loading notification count
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        notificationCount = 3 // Example count
    }

    // MARK: - Navigation Destination Router
    @ViewBuilder
    private func destinationView(for destination: NavigationDestination) -> some View {
        switch destination {
        case .vehicleDetail(let id):
            VehicleDetailViewWrapper(vehicleId: id)

        case .tripDetail(let id):
            TripDetailViewWrapper(tripId: id)

        case .maintenanceDetail(let id):
            MaintenanceDetailView(maintenanceId: id)

        case .addVehicle:
            AddVehicleView()

        case .addTrip:
            AddTripView()

        case .maintenance:
            MaintenanceView()

        case .settings:
            SettingsView()

        case .profile:
            ProfileView()

        case .notifications:
            NotificationsView()

        case .about:
            AboutView()

        case .help:
            HelpView()

        case .pushToTalk:
            Text("Push-To-Talk - Coming Soon")
                .font(.headline)
                .foregroundColor(.secondary)
            // TODO: Implement PushToTalkPanel

        case .fleetMap:
            Text("Fleet Map View - Coming Soon")
                .font(.headline)
                .foregroundColor(.secondary)

        case .tripTracking(let vehicleId):
            Text("Trip Tracking for vehicle \(vehicleId) - Coming Soon")
                .font(.headline)
                .foregroundColor(.secondary)
            // TODO: Implement EnhancedTripTrackingView

        case .obd2Diagnostics:
            Text("OBD2 Diagnostics - Coming Soon")
                .font(.headline)
                .foregroundColor(.secondary)
            // TODO: Implement OBD2DiagnosticsView

        case .maintenancePhoto(let vehicleId, let type):
            Text("Maintenance Photo for vehicle \(vehicleId) - Type: \(type)")
                .font(.headline)
                .foregroundColor(.secondary)
            // TODO: Implement VehicleMaintenancePhotoView

        case .photoCapture(let vehicleId, let photoType):
            Text("Photo Capture for vehicle \(vehicleId) - Type: \(photoType)")
                .font(.headline)
                .foregroundColor(.secondary)
            // TODO: Implement PhotoCaptureView
        }
    }

}

// MARK: - Preview Provider
struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(NavigationCoordinator())
            .environmentObject(AuthenticationManager.shared)
            .environmentObject(AzureNetworkManager())
    }
}
