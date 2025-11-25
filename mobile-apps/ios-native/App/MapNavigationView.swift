/**
 * Map Navigation View
 *
 * Advanced navigation features for fleet management:
 * - Google Maps / Apple Maps integration
 * - Turn-by-turn directions
 * - Real-time traffic updates
 * - Multiple destination routing
 * - Optimal route calculation
 * - ETA updates
 * - Voice navigation
 * - Map customization (satellite, terrain, hybrid)
 */

import SwiftUI
import MapKit
import CoreLocation

struct MapNavigationView: View {
    @StateObject private var viewModel = MapNavigationViewModel()
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 30.4383, longitude: -84.2807), // Tallahassee, FL
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    @State private var mapType: MKMapType = .standard
    @State private var showingRouteOptions = false
    @State private var showingDestinationPicker = false
    @State private var showingDirections = false
    @State private var selectedDestination: MapDestination?

    var body: some View {
        ZStack {
            // MARK: - Map
            mapView

            // MARK: - Top Controls
            VStack {
                topControlBar

                Spacer()

                // MARK: - Route Info Card
                if let route = viewModel.activeRoute {
                    routeInfoCard(route: route)
                }
            }

            // MARK: - Bottom Controls
            VStack {
                Spacer()
                bottomControlBar
            }
        }
        .navigationTitle("Navigation")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingDestinationPicker) {
            destinationPickerSheet
        }
        .sheet(isPresented: $showingRouteOptions) {
            routeOptionsSheet
        }
        .sheet(isPresented: $showingDirections) {
            directionsListSheet
        }
        .onAppear {
            viewModel.requestLocationPermission()
            viewModel.startUpdatingLocation()
        }
    }

    // MARK: - Map View
    private var mapView: some View {
        Map(coordinateRegion: $region,
            interactionModes: .all,
            showsUserLocation: true,
            userTrackingMode: .constant(.follow),
            annotationItems: viewModel.mapAnnotations) { annotation in
            MapAnnotation(coordinate: annotation.coordinate) {
                annotationView(for: annotation)
            }
        }
        .mapStyle(mapStyleFromType(mapType))
        .edgesIgnoringSafeArea(.all)
    }

    // MARK: - Top Control Bar
    private var topControlBar: some View {
        HStack(spacing: 12) {
            // Search Button
            Button(action: { showingDestinationPicker = true }) {
                HStack {
                    Image(systemName: "magnifyingglass")
                    Text(selectedDestination?.name ?? "Search destination")
                        .lineLimit(1)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 3)
            }
            .foregroundColor(.primary)

            // Map Type Toggle
            Menu {
                Button(action: { mapType = .standard }) {
                    Label("Standard", systemImage: "map")
                }
                Button(action: { mapType = .satellite }) {
                    Label("Satellite", systemImage: "globe")
                }
                Button(action: { mapType = .hybrid }) {
                    Label("Hybrid", systemImage: "map.fill")
                }
            } label: {
                Image(systemName: "map")
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 3)
            }
        }
        .padding()
    }

    // MARK: - Route Info Card
    private func routeInfoCard(route: NavigationRoute) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)

                VStack(alignment: .leading, spacing: 4) {
                    Text(route.destination.name)
                        .font(.headline)

                    HStack(spacing: 16) {
                        Label(route.formattedDuration, systemImage: "clock")
                        Label(route.formattedDistance, systemImage: "ruler")
                        if route.hasTraffic {
                            Label("Traffic", systemImage: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: { showingDirections = true }) {
                    Image(systemName: "list.bullet")
                        .font(.title3)
                }
            }

            // ETA and Traffic Info
            HStack {
                Text("ETA: \(route.formattedETA)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                if let trafficDelay = route.trafficDelayMinutes, trafficDelay > 0 {
                    Text("+\(trafficDelay) min delay")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.2))
                        .cornerRadius(8)
                }
            }

            // Action Buttons
            HStack(spacing: 12) {
                Button(action: {
                    viewModel.startNavigation()
                }) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }

                Button(action: { showingRouteOptions = true }) {
                    HStack {
                        Image(systemName: "arrow.triangle.branch")
                        Text("Options")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 5)
        .padding()
    }

    // MARK: - Bottom Control Bar
    private var bottomControlBar: some View {
        HStack(spacing: 16) {
            // Center on User
            Button(action: {
                viewModel.centerOnUserLocation()
                if let location = viewModel.userLocation {
                    region.center = location
                }
            }) {
                Image(systemName: "location.fill")
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 3)
            }

            Spacer()

            // Open in Maps
            Menu {
                Button(action: { viewModel.openInAppleMaps() }) {
                    Label("Open in Apple Maps", systemImage: "map")
                }
                Button(action: { viewModel.openInGoogleMaps() }) {
                    Label("Open in Google Maps", systemImage: "globe")
                }
            } label: {
                Image(systemName: "square.and.arrow.up")
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 3)
            }

            // Traffic Toggle
            Button(action: {
                viewModel.toggleTrafficOverlay()
            }) {
                Image(systemName: viewModel.showTraffic ? "car.fill" : "car")
                    .padding()
                    .background(viewModel.showTraffic ? Color.blue : Color(.systemBackground))
                    .foregroundColor(viewModel.showTraffic ? .white : .primary)
                    .cornerRadius(12)
                    .shadow(radius: 3)
            }
        }
        .padding()
    }

    // MARK: - Destination Picker Sheet
    private var destinationPickerSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Search")) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        TextField("Enter address or place", text: $viewModel.searchQuery)
                            .textFieldStyle(.plain)
                            .submitLabel(.search)
                            .onSubmit {
                                viewModel.searchDestinations()
                            }
                    }
                }

                Section(header: Text("Recent Destinations")) {
                    ForEach(viewModel.recentDestinations) { destination in
                        Button(action: {
                            selectedDestination = destination
                            viewModel.calculateRoute(to: destination)
                            showingDestinationPicker = false
                        }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(destination.name)
                                    .font(.headline)
                                Text(destination.address)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                Section(header: Text("Saved Locations")) {
                    ForEach(viewModel.savedLocations) { location in
                        Button(action: {
                            selectedDestination = location
                            viewModel.calculateRoute(to: location)
                            showingDestinationPicker = false
                        }) {
                            HStack {
                                Image(systemName: location.icon)
                                    .foregroundColor(.blue)
                                VStack(alignment: .leading) {
                                    Text(location.name)
                                        .font(.headline)
                                    Text(location.address)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }

                if !viewModel.searchResults.isEmpty {
                    Section(header: Text("Search Results")) {
                        ForEach(viewModel.searchResults) { result in
                            Button(action: {
                                selectedDestination = result
                                viewModel.calculateRoute(to: result)
                                showingDestinationPicker = false
                            }) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(result.name)
                                        .font(.headline)
                                    Text(result.address)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Select Destination")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showingDestinationPicker = false
                    }
                }
            }
        }
    }

    // MARK: - Route Options Sheet
    private var routeOptionsSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Route Preferences")) {
                    Toggle("Avoid Tolls", isOn: $viewModel.avoidTolls)
                    Toggle("Avoid Highways", isOn: $viewModel.avoidHighways)
                    Toggle("Shortest Distance", isOn: $viewModel.preferShortestRoute)
                }

                if let alternatives = viewModel.alternativeRoutes, !alternatives.isEmpty {
                    Section(header: Text("Alternative Routes")) {
                        ForEach(alternatives) { route in
                            Button(action: {
                                viewModel.selectRoute(route)
                                showingRouteOptions = false
                            }) {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(route.routeName)
                                            .font(.headline)
                                        HStack {
                                            Text(route.formattedDuration)
                                            Text("•")
                                            Text(route.formattedDistance)
                                        }
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    }
                                    Spacer()
                                    if route.id == viewModel.activeRoute?.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.blue)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Route Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingRouteOptions = false
                    }
                }
            }
        }
    }

    // MARK: - Directions List Sheet
    private var directionsListSheet: some View {
        NavigationView {
            List {
                if let route = viewModel.activeRoute {
                    Section(header: Text("Turn-by-Turn Directions")) {
                        ForEach(Array(route.steps.enumerated()), id: \.offset) { index, step in
                            HStack(alignment: .top, spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(Color.blue.opacity(0.2))
                                        .frame(width: 40, height: 40)
                                    Image(systemName: step.icon)
                                        .foregroundColor(.blue)
                                }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(step.instruction)
                                        .font(.body)
                                    HStack {
                                        Text(step.formattedDistance)
                                        if step.duration > 0 {
                                            Text("•")
                                            Text("\(step.duration) min")
                                        }
                                    }
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Directions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingDirections = false
                    }
                }
            }
        }
    }

    // MARK: - Annotation View
    private func annotationView(for annotation: MapAnnotation) -> some View {
        VStack(spacing: 0) {
            Image(systemName: annotation.icon)
                .padding(8)
                .background(annotationColor(for: annotation.type))
                .foregroundColor(.white)
                .clipShape(Circle())

            Image(systemName: "arrowtriangle.down.fill")
                .font(.caption)
                .foregroundColor(annotationColor(for: annotation.type))
                .offset(y: -3)
        }
    }

    // MARK: - Helper Functions
    @available(iOS 17.0, *)
    private func mapStyleFromType(_ type: MKMapType) -> MapStyle {
        switch type {
        case .satellite:
            return .imagery
        case .hybrid:
            return .hybrid
        default:
            return .standard
        }
    }

    private func annotationColor(for type: AnnotationType) -> Color {
        switch type {
        case .destination:
            return .red
        case .vehicle:
            return .blue
        case .waypoint:
            return .green
        case .incident:
            return .orange
        }
    }
}

// MARK: - View Model
@MainActor
class MapNavigationViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var userLocation: CLLocationCoordinate2D?
    @Published var activeRoute: NavigationRoute?
    @Published var alternativeRoutes: [NavigationRoute]?
    @Published var mapAnnotations: [MapAnnotation] = []
    @Published var showTraffic = false

    @Published var searchQuery = ""
    @Published var searchResults: [MapDestination] = []
    @Published var recentDestinations: [MapDestination] = []
    @Published var savedLocations: [MapDestination] = []

    @Published var avoidTolls = false
    @Published var avoidHighways = false
    @Published var preferShortestRoute = false

    private let locationManager = CLLocationManager()
    private var isNavigating = false

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        loadSavedData()
    }

    func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func startUpdatingLocation() {
        locationManager.startUpdatingLocation()
    }

    func centerOnUserLocation() {
        userLocation = locationManager.location?.coordinate
    }

    func calculateRoute(to destination: MapDestination) {
        guard let userLocation = userLocation else { return }

        Task {
            do {
                let routes = try await APIService.shared.calculateRoutes(
                    from: userLocation,
                    to: destination.coordinate,
                    avoidTolls: avoidTolls,
                    avoidHighways: avoidHighways
                )

                await MainActor.run {
                    self.activeRoute = routes.first
                    self.alternativeRoutes = Array(routes.dropFirst())
                    self.addDestinationToRecent(destination)
                }
            } catch {
                print("Failed to calculate route: \(error)")
            }
        }
    }

    func searchDestinations() {
        Task {
            do {
                let results = try await APIService.shared.searchLocations(query: searchQuery)
                await MainActor.run {
                    self.searchResults = results
                }
            } catch {
                print("Search failed: \(error)")
            }
        }
    }

    func startNavigation() {
        isNavigating = true
        // Enable voice navigation
        // Start turn-by-turn guidance
    }

    func selectRoute(_ route: NavigationRoute) {
        activeRoute = route
    }

    func toggleTrafficOverlay() {
        showTraffic.toggle()
    }

    func openInAppleMaps() {
        guard let route = activeRoute else { return }
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: route.destination.coordinate))
        mapItem.name = route.destination.name
        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
    }

    func openInGoogleMaps() {
        guard let route = activeRoute else { return }
        let destination = route.destination
        let urlString = "comgooglemaps://?daddr=\(destination.coordinate.latitude),\(destination.coordinate.longitude)&directionsmode=driving"

        if let url = URL(string: urlString), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else {
            // Fallback to web Google Maps
            let webURL = "https://www.google.com/maps/dir/?api=1&destination=\(destination.coordinate.latitude),\(destination.coordinate.longitude)"
            if let url = URL(string: webURL) {
                UIApplication.shared.open(url)
            }
        }
    }

    private func addDestinationToRecent(_ destination: MapDestination) {
        recentDestinations.removeAll { $0.id == destination.id }
        recentDestinations.insert(destination, at: 0)
        if recentDestinations.count > 10 {
            recentDestinations.removeLast()
        }
    }

    private func loadSavedData() {
        // Load from UserDefaults or API
        savedLocations = [
            MapDestination(
                id: UUID().uuidString,
                name: "Headquarters",
                address: "123 Main St, Tallahassee, FL",
                coordinate: CLLocationCoordinate2D(latitude: 30.4383, longitude: -84.2807),
                icon: "building.2"
            )
        ]
    }

    // MARK: - CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        userLocation = location.coordinate
    }
}

// MARK: - Models
struct NavigationRoute: Identifiable {
    let id: String
    let routeName: String
    let destination: MapDestination
    let duration: TimeInterval // seconds
    let distance: Double // meters
    let steps: [RouteStep]
    let trafficDelayMinutes: Int?
    let hasTraffic: Bool

    var formattedDuration: String {
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes) min"
    }

    var formattedDistance: String {
        let miles = distance / 1609.34
        return String(format: "%.1f mi", miles)
    }

    var formattedETA: String {
        let eta = Date().addingTimeInterval(duration + Double(trafficDelayMinutes ?? 0) * 60)
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: eta)
    }
}

struct RouteStep {
    let instruction: String
    let distance: Double // meters
    let duration: Int // minutes
    let icon: String

    var formattedDistance: String {
        if distance < 1000 {
            return "\(Int(distance)) m"
        }
        return String(format: "%.1f mi", distance / 1609.34)
    }
}

struct MapDestination: Identifiable {
    let id: String
    let name: String
    let address: String
    let coordinate: CLLocationCoordinate2D
    let icon: String
}

struct MapAnnotation: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
    let type: AnnotationType
    let title: String

    var icon: String {
        switch type {
        case .destination:
            return "mappin.circle.fill"
        case .vehicle:
            return "car.fill"
        case .waypoint:
            return "flag.fill"
        case .incident:
            return "exclamationmark.triangle.fill"
        }
    }
}

enum AnnotationType {
    case destination
    case vehicle
    case waypoint
    case incident
}

#Preview {
    MapNavigationView()
}
