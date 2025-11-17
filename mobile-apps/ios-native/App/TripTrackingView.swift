import SwiftUI
import MapKit
import CoreLocation

// MARK: - Trip Tracking View
/// View for tracking and displaying active trips with iOS 15 compatibility
struct TripTrackingView: View {

    // MARK: - State
    @StateObject private var viewModel = TripTrackingViewModel()
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    var body: some View {
        ZStack {
            // Map View (iOS 15 compatible)
            MapViewRepresentable(
                region: $region,
                routePoints: viewModel.currentTrip?.routePoints ?? [],
                startLocation: viewModel.currentTrip?.startLocation,
                endLocation: viewModel.currentTrip?.endLocation
            )
            .edgesIgnoringSafeArea(.all)

            // Overlay UI
            VStack {
                // Trip Stats Card
                if let trip = viewModel.currentTrip {
                    TripStatsCard(trip: trip)
                        .padding()
                }

                Spacer()

                // Control Buttons
                HStack(spacing: 20) {
                    if viewModel.isTracking {
                        Button(action: {
                            viewModel.pauseTrip()
                        }) {
                            Image(systemName: "pause.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.orange)
                                .clipShape(Circle())
                        }

                        Button(action: {
                            viewModel.stopTrip()
                        }) {
                            Image(systemName: "stop.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.red)
                                .clipShape(Circle())
                        }
                    } else {
                        Button(action: {
                            viewModel.startTrip(vehicleId: "vehicle-123")
                        }) {
                            Image(systemName: "play.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.green)
                                .clipShape(Circle())
                        }
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Trip Tracking")
        .onAppear {
            viewModel.requestLocationPermission()
        }
    }
}

// MARK: - Trip Stats Card
struct TripStatsCard: View {
    let trip: TripModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Trip in Progress")
                    .font(.headline)
                Spacer()
                Text(trip.status.rawValue.capitalized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Divider()

            HStack(spacing: 20) {
                StatItem(
                    title: "Distance",
                    value: String(format: "%.1f km", trip.distance),
                    icon: "car.fill"
                )

                StatItem(
                    title: "Duration",
                    value: formatDuration(trip.duration),
                    icon: "clock.fill"
                )

                StatItem(
                    title: "Avg Speed",
                    value: String(format: "%.0f km/h", trip.averageSpeed),
                    icon: "speedometer"
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 8)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Stat Item
struct StatItem: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)

            Text(value)
                .font(.headline)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - MapView Representable (iOS 15 compatible)
struct MapViewRepresentable: UIViewRepresentable {
    @Binding var region: MKCoordinateRegion
    let routePoints: [CLLocationCoordinate2D]
    let startLocation: CLLocationCoordinate2D?
    let endLocation: CLLocationCoordinate2D?

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = true
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.setRegion(region, animated: true)

        // Remove old overlays and annotations
        mapView.removeOverlays(mapView.overlays)
        mapView.removeAnnotations(mapView.annotations)

        // Add start location marker
        if let start = startLocation {
            let annotation = MKPointAnnotation()
            annotation.coordinate = start
            annotation.title = "Start"
            mapView.addAnnotation(annotation)
        }

        // Add end location marker
        if let end = endLocation {
            let annotation = MKPointAnnotation()
            annotation.coordinate = end
            annotation.title = "End"
            mapView.addAnnotation(annotation)
        }

        // Draw route if we have points
        if routePoints.count >= 2 {
            let polyline = MKPolyline(coordinates: routePoints, count: routePoints.count)
            mapView.addOverlay(polyline)
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: MapViewRepresentable

        init(_ parent: MapViewRepresentable) {
            self.parent = parent
        }

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = .systemBlue
                renderer.lineWidth = 4
                return renderer
            }
            return MKOverlayRenderer(overlay: overlay)
        }

        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard !(annotation is MKUserLocation) else { return nil }

            let identifier = "TripMarker"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)

            if annotationView == nil {
                annotationView = MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = true
            } else {
                annotationView?.annotation = annotation
            }

            if let markerView = annotationView as? MKMarkerAnnotationView {
                if annotation.title == "Start" {
                    markerView.markerTintColor = .green
                } else if annotation.title == "End" {
                    markerView.markerTintColor = .red
                }
            }

            return annotationView
        }
    }
}

// MARK: - Trip Tracking View Model
@MainActor
class TripTrackingViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {

    // MARK: - Published Properties
    @Published var currentTrip: TripModel?
    @Published var isTracking: Bool = false

    // MARK: - Properties
    private let locationManager = CLLocationManager()
    private var lastLocation: CLLocation?

    // MARK: - Initialization
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10 // Update every 10 meters
    }

    // MARK: - Public Methods

    func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func startTrip(vehicleId: String) {
        guard let location = locationManager.location else {
            print("⚠️ Location not available")
            return
        }

        currentTrip = TripModel(
            vehicleId: vehicleId,
            startLocation: location.coordinate
        )

        isTracking = true
        locationManager.startUpdatingLocation()

        print("🚗 Trip started for vehicle: \(vehicleId)")
    }

    func pauseTrip() {
        guard var trip = currentTrip else { return }

        trip.status = .paused
        currentTrip = trip
        locationManager.stopUpdatingLocation()

        print("⏸️ Trip paused")
    }

    func stopTrip() {
        guard var trip = currentTrip, let location = locationManager.location else { return }

        trip.status = .completed
        trip.endTime = Date()
        trip.endLocation = location.coordinate
        currentTrip = trip

        isTracking = false
        locationManager.stopUpdatingLocation()

        print("🏁 Trip completed - Distance: \(trip.distance) km")

        // Save trip (in production, save to Core Data)
        saveTrip(trip)

        // Clear current trip after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.currentTrip = nil
        }
    }

    // MARK: - CLLocationManagerDelegate

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            guard var trip = currentTrip, trip.isActive else { return }

            for location in locations {
                // Add point to route
                trip.routePoints.append(location.coordinate)

                // Calculate distance
                if let lastLocation = lastLocation {
                    let distance = location.distance(from: lastLocation) / 1000.0 // Convert to km
                    trip.distance += distance

                    // Calculate speed
                    let speed = location.speed * 3.6 // Convert m/s to km/h
                    if speed > 0 {
                        trip.maxSpeed = max(trip.maxSpeed, speed)

                        // Update average speed
                        let pointCount = Double(trip.routePoints.count)
                        trip.averageSpeed = ((trip.averageSpeed * (pointCount - 1)) + speed) / pointCount
                    }
                }

                lastLocation = location
            }

            currentTrip = trip
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error.localizedDescription)")
    }

    // MARK: - Private Methods

    private func saveTrip(_ trip: TripModel) {
        // In production, save to Core Data
        print("💾 Saving trip: \(trip.id)")
    }
}
