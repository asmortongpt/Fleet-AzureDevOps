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
        }
    }
}

// MARK: - Vehicle Detail Wrapper
/// Wrapper view that loads a vehicle by ID and passes it to VehicleDetailView
struct VehicleDetailViewWrapper: View {
    let vehicleId: String
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        if let vehicle = viewModel.vehicles.first(where: { $0.id == vehicleId }) {
            VehicleDetailView(vehicle: vehicle)
        } else {
            ProgressView("Loading vehicle...")
                .onAppear {
                    Task {
                        await viewModel.fetchVehicles()
                    }
                }
        }
    }
}

// MARK: - Trip Detail Wrapper
/// Wrapper view that loads a trip by ID and passes it to TripDetailView
struct TripDetailViewWrapper: View {
    let tripId: String
    @StateObject private var viewModel = TripsViewModel()

    var body: some View {
        if let trip = viewModel.trips.first(where: { $0.id.uuidString == tripId }) {
            TripDetailView(trip: trip)
        } else {
            VStack(spacing: 20) {
                ProgressView("Loading trip...")
            }
            .onAppear {
                Task {
                    await viewModel.refresh()
                }
            }
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
