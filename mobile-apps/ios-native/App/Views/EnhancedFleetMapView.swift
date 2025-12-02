//
//  EnhancedFleetMapView.swift
//  Fleet Manager
//
//  Advanced map view with clustering, geofences, and route visualization
//

import SwiftUI
import MapKit
import Combine

// MARK: - Main Map View

struct EnhancedFleetMapView: View {
    @StateObject private var viewModel = FleetMapViewModel()
    @State private var selectedVehicle: Vehicle?
    @State private var showVehicleDetail = false
    @State private var showFilters = false
    @State private var showGeofences = true
    @State private var showRoutes = false
    @State private var selectedRoute: Trip?

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Map with annotations
            Map(coordinateRegion: $viewModel.region, annotationItems: viewModel.displayedVehicles) { vehicle in
                MapAnnotation(coordinate: vehicle.location.coordinate) {
                    VehicleMarker(vehicle: vehicle, isSelected: selectedVehicle?.id == vehicle.id)
                        .onTapGesture {
                            withAnimation {
                                selectedVehicle = vehicle
                                showVehicleDetail = true
                            }
                        }
                }
            }
            .ignoresSafeArea()
            .overlay(
                GeofenceOverlay(geofences: viewModel.geofences, isVisible: showGeofences)
            )

            // Map Controls
            VStack(spacing: ModernTheme.Spacing.md) {
                // Filter button
                MapControlButton(
                    icon: "line.3.horizontal.decrease.circle.fill",
                    color: viewModel.activeFilters.isActive ? .orange : .blue,
                    action: { showFilters = true }
                )

                // Zoom to all
                MapControlButton(
                    icon: "location.fill",
                    color: .green,
                    action: { viewModel.zoomToAllVehicles() }
                )

                // Toggle geofences
                MapControlButton(
                    icon: showGeofences ? "map.fill" : "map",
                    color: showGeofences ? .purple : .gray,
                    action: { showGeofences.toggle() }
                )

                // Toggle routes
                MapControlButton(
                    icon: showRoutes ? "point.topleft.down.curvedto.point.bottomright.up.fill" : "point.topleft.down.curvedto.point.bottomright.up",
                    color: showRoutes ? .orange : .gray,
                    action: { showRoutes.toggle() }
                )

                // Refresh
                MapControlButton(
                    icon: "arrow.clockwise",
                    color: .blue,
                    action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }
                )

                Spacer()

                // Status Legend
                MapLegend(viewModel: viewModel)
            }
            .padding()

            // Vehicle Detail Card
            if showVehicleDetail, let vehicle = selectedVehicle {
                VStack {
                    Spacer()
                    VehicleDetailCard(
                        vehicle: vehicle,
                        onClose: {
                            withAnimation {
                                showVehicleDetail = false
                                selectedVehicle = nil
                            }
                        },
                        onShowRoute: {
                            showRoutes = true
                            viewModel.showRouteForVehicle(vehicle)
                        }
                    )
                    .padding()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            // Route visualization overlay
            if showRoutes, let route = viewModel.selectedRoute {
                RouteOverlay(route: route, onClose: {
                    showRoutes = false
                    viewModel.selectedRoute = nil
                })
            }
        }
        .navigationTitle("Fleet Map")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 12) {
                    Text("\(viewModel.displayedVehicles.count) vehicles")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if viewModel.isRefreshing {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
            }
        }
        .sheet(isPresented: $showFilters) {
            MapFilterSheet(viewModel: viewModel)
        }
        .onAppear {
            viewModel.loadData()
        }
    }
}

// MARK: - Fleet Map ViewModel

@MainActor
class FleetMapViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var vehicles: [Vehicle] = []
    @Published var displayedVehicles: [Vehicle] = []
    @Published var geofences: [Geofence] = []
    @Published var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 5.0, longitudeDelta: 5.0)
    )
    @Published var activeFilters = MapFilters()
    @Published var selectedRoute: Trip?

    // Statistics
    @Published var vehiclesByStatus: [VehicleStatus: Int] = [:]
    @Published var clusteringEnabled = true
    @Published var clusterThreshold: Double = 0.5 // Distance in degrees for clustering

    // MARK: - Private Properties
    private var trips: [Trip] = []

    // MARK: - Data Loading

    func loadData() {
        Task {
            await loadMapData()
        }
    }

    @MainActor
    private func loadMapData() async {
        startLoading()

        // Simulate network delay
        await Task.sleep(300_000_000)

        // Initialize with empty data - will be populated from API
        vehicles = []
        trips = []
        geofences = generateGeofences()

        // Calculate statistics
        updateStatistics()

        // Apply initial filters
        applyFilters()

        // Zoom to show all vehicles
        zoomToAllVehicles()

        finishLoading()
    }

    private func generateGeofences() -> [Geofence] {
        [
            Geofence(
                id: UUID().uuidString,
                name: "Downtown Service Area",
                center: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
                radius: 5000,
                type: .service,
                color: "blue"
            ),
            Geofence(
                id: UUID().uuidString,
                name: "Restricted Zone",
                center: CLLocationCoordinate2D(latitude: 40.7580, longitude: -73.9855),
                radius: 3000,
                type: .restricted,
                color: "red"
            ),
            Geofence(
                id: UUID().uuidString,
                name: "Main Depot",
                center: CLLocationCoordinate2D(latitude: 40.6892, longitude: -74.0445),
                radius: 2000,
                type: .depot,
                color: "green"
            ),
            Geofence(
                id: UUID().uuidString,
                name: "Customer Zone A",
                center: CLLocationCoordinate2D(latitude: 34.0522, longitude: -118.2437),
                radius: 4000,
                type: .customer,
                color: "purple"
            )
        ]
    }

    // MARK: - Filtering

    func applyFilters() {
        var filtered = vehicles

        if !activeFilters.statuses.isEmpty {
            filtered = filtered.filter { activeFilters.statuses.contains($0.status) }
        }

        if !activeFilters.departments.isEmpty {
            filtered = filtered.filter { activeFilters.departments.contains($0.department) }
        }

        if !activeFilters.vehicleTypes.isEmpty {
            filtered = filtered.filter { activeFilters.vehicleTypes.contains($0.type) }
        }

        if activeFilters.lowFuelOnly {
            filtered = filtered.filter { $0.fuelLevel < 0.25 }
        }

        if activeFilters.hasAlertsOnly {
            filtered = filtered.filter { !$0.alerts.isEmpty }
        }

        withAnimation {
            displayedVehicles = clusteringEnabled ? clusterVehicles(filtered) : filtered
        }

        updateStatistics()
    }

    // MARK: - Clustering

    private func clusterVehicles(_ vehicles: [Vehicle]) -> [Vehicle] {
        // Simple clustering algorithm: group nearby vehicles
        // In production, use a proper clustering library
        guard vehicles.count > 10 else { return vehicles }

        var clustered: [Vehicle] = []
        var processed: Set<String> = []

        for vehicle in vehicles {
            if processed.contains(vehicle.id) { continue }

            var cluster = [vehicle]
            processed.insert(vehicle.id)

            // Find nearby vehicles
            for other in vehicles {
                if processed.contains(other.id) { continue }

                let distance = calculateDistance(
                    from: vehicle.location.coordinate,
                    to: other.location.coordinate
                )

                if distance < clusterThreshold {
                    cluster.append(other)
                    processed.insert(other.id)
                }
            }

            // If cluster has multiple vehicles, create a representative
            if cluster.count > 1 {
                // Use the first vehicle as representative
                clustered.append(cluster[0])
            } else {
                clustered.append(vehicle)
            }
        }

        return clustered
    }

    private func calculateDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let latDiff = from.latitude - to.latitude
        let lngDiff = from.longitude - to.longitude
        return sqrt(latDiff * latDiff + lngDiff * lngDiff)
    }

    // MARK: - Map Controls

    func zoomToAllVehicles() {
        guard !displayedVehicles.isEmpty else { return }

        var minLat = 90.0
        var maxLat = -90.0
        var minLng = 180.0
        var maxLng = -180.0

        for vehicle in displayedVehicles {
            minLat = min(minLat, vehicle.location.lat)
            maxLat = max(maxLat, vehicle.location.lat)
            minLng = min(minLng, vehicle.location.lng)
            maxLng = max(maxLng, vehicle.location.lng)
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.5, 0.1),
            longitudeDelta: max((maxLng - minLng) * 1.5, 0.1)
        )

        withAnimation {
            region = MKCoordinateRegion(center: center, span: span)
        }
    }

    func showRouteForVehicle(_ vehicle: Vehicle) {
        // Find most recent trip for this vehicle
        if let trip = trips.first(where: { $0.vehicleId == vehicle.id && $0.status == .completed }) {
            selectedRoute = trip

            // Zoom to route
            if let start = trip.startLocation, let end = trip.endLocation {
                let minLat = min(start.lat, end.lat)
                let maxLat = max(start.lat, end.lat)
                let minLng = min(start.lng, end.lng)
                let maxLng = max(start.lng, end.lng)

                let center = CLLocationCoordinate2D(
                    latitude: (minLat + maxLat) / 2,
                    longitude: (minLng + maxLng) / 2
                )

                let span = MKCoordinateSpan(
                    latitudeDelta: max((maxLat - minLat) * 1.5, 0.2),
                    longitudeDelta: max((maxLng - minLng) * 1.5, 0.2)
                )

                withAnimation {
                    region = MKCoordinateRegion(center: center, span: span)
                }
            }
        }
    }

    // MARK: - Statistics

    private func updateStatistics() {
        vehiclesByStatus = [:]
        for vehicle in displayedVehicles {
            vehiclesByStatus[vehicle.status, default: 0] += 1
        }
    }

    // MARK: - Refresh

    override func refresh() async {
        startRefreshing()
        await loadMapData()
        finishRefreshing()
    }
}

// MARK: - Supporting Models

struct Geofence: Identifiable {
    let id: String
    let name: String
    let center: CLLocationCoordinate2D
    let radius: Double // in meters
    let type: GeofenceType
    let color: String

    var boundingRegion: MKCoordinateRegion {
        let radiusInDegrees = radius / 111000.0 // Approximate conversion
        return MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(
                latitudeDelta: radiusInDegrees * 2,
                longitudeDelta: radiusInDegrees * 2
            )
        )
    }
}

enum GeofenceType: String {
    case service = "Service Area"
    case restricted = "Restricted Zone"
    case depot = "Depot"
    case customer = "Customer Zone"
    case parking = "Parking Area"

    var icon: String {
        switch self {
        case .service: return "wrench.and.screwdriver.fill"
        case .restricted: return "hand.raised.fill"
        case .depot: return "building.2.fill"
        case .customer: return "person.2.fill"
        case .parking: return "parkingsign"
        }
    }
}

struct MapFilters {
    var statuses: [VehicleStatus] = []
    var departments: [String] = []
    var vehicleTypes: [VehicleType] = []
    var lowFuelOnly = false
    var hasAlertsOnly = false

    var isActive: Bool {
        !statuses.isEmpty || !departments.isEmpty || !vehicleTypes.isEmpty || lowFuelOnly || hasAlertsOnly
    }
}

// MARK: - Supporting Views

struct VehicleMarker: View {
    let vehicle: Vehicle
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 2) {
            ZStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: isSelected ? 50 : 40, height: isSelected ? 50 : 40)
                    .shadow(radius: isSelected ? 6 : 4)

                Image(systemName: vehicle.type.icon)
                    .foregroundColor(.white)
                    .font(.system(size: isSelected ? 24 : 20))
            }

            if isSelected {
                Text(vehicle.number)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.white)
                    .cornerRadius(4)
                    .shadow(radius: 2)
            }
        }
        .animation(.spring(response: 0.3), value: isSelected)
    }

    private var statusColor: Color {
        vehicle.status.themeColor
    }
}

struct MapControlButton: View {
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(color)
                .clipShape(Circle())
                .shadow(color: Color.black.opacity(0.3), radius: 4, x: 0, y: 2)
        }
    }
}

struct MapLegend: View {
    @ObservedObject var viewModel: FleetMapViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
            ForEach(Array(viewModel.vehiclesByStatus.keys.sorted(by: { $0.rawValue < $1.rawValue })), id: \.self) { status in
                if let count = viewModel.vehiclesByStatus[status], count > 0 {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(status.themeColor)
                            .frame(width: 12, height: 12)

                        Text("\(status.displayName): \(count)")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.primaryText)
                    }
                }
            }
        }
        .padding(ModernTheme.Spacing.sm)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(Color.white.opacity(0.9))
                .shadow(color: Color.black.opacity(0.2), radius: 4)
        )
    }
}

struct VehicleDetailCard: View {
    let vehicle: Vehicle
    let onClose: () -> Void
    let onShowRoute: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.number)
                        .font(ModernTheme.Typography.title3)
                        .fontWeight(.bold)

                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }

            // Status
            HStack {
                Image(systemName: vehicle.status.symbolName)
                    .foregroundColor(vehicle.status.themeColor)
                Text(vehicle.status.displayName)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(vehicle.status.themeColor.opacity(0.2))
                    .cornerRadius(6)
            }

            Divider()

            // Details Grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: ModernTheme.Spacing.md) {
                DetailItem(icon: "fuelpump.fill", label: "Fuel", value: "\(Int(vehicle.fuelLevel * 100))%")
                DetailItem(icon: "speedometer", label: "Mileage", value: String(format: "%.0f mi", vehicle.mileage))
                DetailItem(icon: "building.2.fill", label: "Department", value: vehicle.department)
                DetailItem(icon: "mappin.circle.fill", label: "Region", value: vehicle.region)
            }

            if let driver = vehicle.assignedDriver {
                Divider()
                HStack {
                    Image(systemName: "person.fill")
                        .foregroundColor(ModernTheme.Colors.primary)
                    Text("Driver: \(driver)")
                        .font(ModernTheme.Typography.subheadline)
                }
            }

            // Actions
            HStack(spacing: ModernTheme.Spacing.md) {
                Button(action: onShowRoute) {
                    HStack {
                        Image(systemName: "map.fill")
                        Text("Show Route")
                    }
                    .font(ModernTheme.Typography.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(ModernTheme.Colors.primary)
                    .foregroundColor(.white)
                    .cornerRadius(ModernTheme.CornerRadius.sm)
                }

                Button(action: {}) {
                    HStack {
                        Image(systemName: "info.circle.fill")
                        Text("Details")
                    }
                    .font(ModernTheme.Typography.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(ModernTheme.Colors.secondaryBackground)
                    .foregroundColor(ModernTheme.Colors.primary)
                    .cornerRadius(ModernTheme.CornerRadius.sm)
                }
            }

            // Alerts
            if !vehicle.alerts.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(vehicle.alerts, id: \.self) { alert in
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                            Text(alert)
                                .font(ModernTheme.Typography.caption1)
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.2), radius: 8)
        )
    }
}

struct DetailItem: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            Text(value)
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.semibold)
        }
    }
}

struct GeofenceOverlay: View {
    let geofences: [Geofence]
    let isVisible: Bool

    var body: some View {
        Group {
            if isVisible {
                ForEach(geofences) { geofence in
                    Circle()
                        .stroke(geofenceColor(geofence.color), lineWidth: 2)
                        .opacity(0.5)
                        .frame(width: 100, height: 100) // Simplified visualization
                }
            }
        }
    }

    private func geofenceColor(_ colorString: String) -> Color {
        switch colorString {
        case "blue": return .blue
        case "red": return .red
        case "green": return .green
        case "purple": return .purple
        default: return .gray
        }
    }
}

struct RouteOverlay: View {
    let route: Trip
    let onClose: () -> Void

    var body: some View {
        VStack {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Route: \(route.vehicleNumber)")
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(.white)

                    Text("\(String(format: "%.1f", route.distance)) mi • \(formatDuration(route.duration))")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                }
            }
            .padding()
            .background(ModernTheme.Colors.primary)

            Spacer()
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        return hours > 0 ? "\(hours)h \(minutes)m" : "\(minutes)m"
    }
}

struct MapFilterSheet: View {
    @ObservedObject var viewModel: FleetMapViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var filters: MapFilters

    init(viewModel: FleetMapViewModel) {
        self.viewModel = viewModel
        _filters = State(initialValue: viewModel.activeFilters)
    }

    var body: some View {
        NavigationView {
            List {
                Section("Quick Filters") {
                    Toggle("Low Fuel Only", isOn: $filters.lowFuelOnly)
                    Toggle("Has Alerts Only", isOn: $filters.hasAlertsOnly)
                }

                Section("Status") {
                    ForEach(VehicleStatus.allCases, id: \.self) { status in
                        Toggle(status.displayName, isOn: Binding(
                            get: { filters.statuses.contains(status) },
                            set: { isOn in
                                if isOn {
                                    filters.statuses.append(status)
                                } else {
                                    filters.statuses.removeAll { $0 == status }
                                }
                            }
                        ))
                    }
                }

                Section {
                    Button("Apply Filters") {
                        viewModel.activeFilters = filters
                        viewModel.applyFilters()
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)

                    Button("Clear All") {
                        filters = MapFilters()
                        viewModel.activeFilters = MapFilters()
                        viewModel.applyFilters()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Map Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

#if DEBUG
struct EnhancedFleetMapView_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedFleetMapView()
    }
}
#endif
