import SwiftUI

// MARK: - Main Tab View with iOS 15+ Support
struct MainTabView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager
    @EnvironmentObject private var networkManager: AzureNetworkManager

    @State private var searchText = ""
    @State private var notificationCount = 0
    @StateObject private var tripsViewModel = TripsViewModel()
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
        // Core destinations
        case .vehicleDetail(let id):
            VehicleDetailViewWrapper(vehicleId: id)

        case .tripDetail(let id):
            TripDetailViewWrapper(tripId: id)

        case .maintenanceDetail(let id):
            MaintenanceDetailView(maintenanceId: id)

        case .addVehicle:
            AddVehicleView()

        case .addTrip:
            AddTripView(tripsViewModel: tripsViewModel)

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

        // Driver management destinations
        case .driverDetail(let id):
            DriverManagementView()

        case .addDriver:
            DriverManagementView()

        case .editDriver(let id):
            DriverManagementView()

        // Hardware integration destinations
        case .fleetMap:
            FleetMapView()

        case .tripTracking(let vehicleId):
            TripTrackingView()

        case .obd2Diagnostics:
            OBD2DiagnosticsView()

        case .maintenancePhoto(let vehicleId, let type):
            PhotoCaptureView(vehicleId: vehicleId, photoType: .maintenance) { photos in
                // Handle captured photos
            }

        case .photoCapture(let vehicleId, let photoType):
            PhotoCaptureView(vehicleId: vehicleId, photoType: .general) { photos in
                // Handle captured photos
            }

        // Geofence management
        case .geofenceList:
            GeofencingView()

        case .geofenceDetail(let id):
            Text("Geofence Details")

        case .addGeofence:
            Text("Add Geofence")

        case .editGeofence(let id):
            Text("Edit Geofence")

        // GIS and Executive
        case .gisCommandCenter:
            Text("GIS Command Center")

        case .executiveDashboard:
            Text("Executive Dashboard")

        // Optimization
        case .fleetOptimizer:
            Text("Fleet Optimizer")

        case .routeOptimizer:
            RouteOptimizerView()

        case .optimizedRoute(let routeId):
            Text("Optimized Route")

        // Data Workbench
        case .dataWorkbench:
            DataGridView()

        case .queryBuilder:
            Text("Query Builder")

        case .dataGrid:
            DataGridView()

        // Vehicle Assignment
        case .vehicleAssignments:
            VehicleAssignmentView()

        case .assignmentDetail(let id):
            Text("Assignment Details")

        case .createAssignment:
            CreateAssignmentView()

        case .assignmentRequest:
            AssignmentRequestView()

        case .assignmentApproval(let requestId):
            Text("Assignment Approval")

        case .assignmentHistory(let assignmentId):
            AssignmentHistoryView()

        // Compliance
        case .complianceDashboard:
            ComplianceDashboardView()

        case .complianceScoreCard:
            Text("Compliance Score Card")

        case .violationsList:
            ViolationsListView()

        case .expiringItems:
            ExpiringItemsView()

        case .complianceItemDetail(let id):
            CertificationManagementView()

        case .violationDetail(let id):
            Text("Violation Detail")

        // Shift Management
        case .shiftManagement:
            ShiftManagementView()

        case .shiftDetail(let id):
            ShiftManagementView()

        case .createShift:
            CreateShiftView()

        case .clockInOut:
            ClockInOutView()

        case .shiftSwaps:
            ShiftSwapView()

        case .shiftReport:
            ShiftReportView()

        // Telemetry
        case .telemetryDashboard:
            TelemetryDashboardView()

        case .telemetryDashboardForVehicle(let vehicleId):
            TelemetryDashboardView()

        case .diagnosticCodeDetail(let code):
            DTCListView()

        case .vehicleHealthDetail(let vehicleId):
            ComponentHealthView()

        case .telemetryHistory(let vehicleId):
            HistoricalChartsView()

        // Predictive Analytics
        case .predictiveAnalytics:
            PredictiveAnalyticsView()

        case .predictionDetail(let id):
            PredictionDetailView()

        // Inventory Management
        case .inventoryManagement:
            InventoryManagementView()

        case .inventoryItemDetail(let id):
            InventoryManagementView()

        case .stockMovement(let itemId):
            StockMovementView()

        case .inventoryAlerts:
            InventoryAlertsView()

        case .inventoryReports:
            InventoryReportView()

        case .addInventoryItem:
            InventoryManagementView()

        // Budget Planning
        case .budgetPlanning:
            BudgetPlanningView()

        case .budgetDetail(let id):
            BudgetPlanningView()

        case .budgetEditor(let budgetId):
            BudgetEditorView()

        case .budgetVariance(let budgetId):
            BudgetVarianceView()

        case .budgetForecast(let budgetId):
            BudgetForecastView()

        // Warranty Management
        case .warrantyManagement:
            WarrantyManagementView()

        case .warrantyDetail(let id):
            WarrantyDetailView()

        case .claimSubmission(let warrantyId):
            ClaimSubmissionView()

        case .claimTracking(let claimId):
            ClaimTrackingView()

        case .addWarranty:
            WarrantyManagementView()

        // Benchmarking
        case .benchmarking:
            BenchmarkingView()

        case .benchmarkDetail(let category):
            BenchmarkDetailView()

        // Schedule Management
        case .schedule:
            ScheduleView()

        case .scheduleDetail(let id):
            ScheduleView()

        case .addSchedule:
            ScheduleView()

        // Checklist Management
        case .checklistManagement:
            ChecklistManagementView()

        case .activeChecklist:
            ActiveChecklistView()

        case .checklistHistory:
            ChecklistHistoryView()

        case .checklistTemplateEditor:
            ChecklistTemplateEditorView()

        // Vehicle Inspection
        case .vehicleInspection(let vehicleId):
            VehicleInspectionView()

        // Reports
        case .reports:
            ReportsView()

        case .customReportBuilder:
            CustomReportBuilderView()

        // Fuel Management
        case .fuelManagement:
            FuelManagementView()

        case .fuelEntry:
            FuelManagementView()

        // Document Management
        case .documentManagement:
            DocumentManagementView()

        case .documentScanner:
            DocumentScannerView(documentType: .general, onComplete: { docs in
                // Handle scanned documents
            }, onCancel: {
                // Handle cancel
            })

        // Incident Reports
        case .incidentReport(let vehicleId):
            IncidentReportView()

        case .damageReport(let vehicleId):
            DamageReportView()
        }
    }

    // Helper function to get vehicle by ID (stub for now)
    private func getVehicle(_ id: String) -> Vehicle? {
        // TODO: Implement actual vehicle fetching
        return nil
    }
}

// MARK: - Vehicle Detail Wrapper
/// Wrapper view that loads a vehicle by ID and passes it to VehicleDetailView
struct VehicleDetailViewWrapper: View {
    let vehicleId: String
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Loading vehicle...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let vehicle = viewModel.selectedVehicle {
                VehicleDetailView(vehicle: vehicle)
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)

                    Text("Failed to Load Vehicle")
                        .font(.title2.bold())

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Button("Retry") {
                        Task {
                            await viewModel.fetchVehicle(id: vehicleId)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "car.2")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)

                    Text("Vehicle Not Found")
                        .font(.title2.bold())

                    Text("Unable to load vehicle with ID: \(vehicleId)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task {
            await viewModel.fetchVehicle(id: vehicleId)
        }
        .navigationTitle("Vehicle Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Trip Detail Wrapper
/// Wrapper view that loads a trip by ID and passes it to TripDetailView
struct TripDetailViewWrapper: View {
    let tripId: String
    @StateObject private var persistenceManager = DataPersistenceManager.shared
    @State private var trip: Trip?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading trip...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let trip = trip {
                TripDetailView(trip: trip)
            } else if let error = errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)

                    Text("Failed to Load Trip")
                        .font(.title2.bold())

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Button("Retry") {
                        loadTrip()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "map")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)

                    Text("Trip Not Found")
                        .font(.title2.bold())

                    Text("Unable to load trip with ID: \(tripId)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onAppear {
            loadTrip()
        }
        .navigationTitle("Trip Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func loadTrip() {
        isLoading = true
        errorMessage = nil

        // Try to find trip from cached trips
        if let trips = persistenceManager.getCachedTrips() {
            trip = trips.first { String(describing: $0.id) == tripId }
            if trip == nil {
                errorMessage = "Trip not found in local cache"
            }
        } else {
            errorMessage = "No cached trips available"
        }

        isLoading = false
    }
}

// MARK: - Shared Components

// Placeholder View
struct PlaceholderView: View {
    let title: String
    let icon: String
    let message: String

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text(title)
                .font(.title.bold())

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .navigationTitle(title)
    }
}

// Filter Chip (used by MaintenanceView)
struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

// Detail Card (used by MaintenanceView)
struct DetailCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
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
