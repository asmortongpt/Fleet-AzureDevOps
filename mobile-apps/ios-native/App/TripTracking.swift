import SwiftUI
import CoreLocation
import MapKit

// MARK: - Trip Tracking System
class TripManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var currentTrip: Trip?
    @Published var isTracking = false
    @Published var currentLocation: CLLocation?
    @Published var tripDistance: Double = 0
    @Published var tripDuration: TimeInterval = 0
    @Published var averageSpeed: Double = 0
    @Published var routeCoordinates: [CLLocationCoordinate2D] = []

    private let locationManager = CLLocationManager()
    private var startTime: Date?
    private var locations: [CLLocation] = []
    private var timer: Timer?

    struct Trip {
        let id: String
        let vehicleId: String
        let driverId: String
        let startTime: Date
        var endTime: Date?
        var startLocation: CLLocation
        var endLocation: CLLocation?
        var distance: Double
        var duration: TimeInterval
        var averageSpeed: Double
        var maxSpeed: Double
        var fuelUsed: Double?
        var purpose: String
        var notes: String?
        var routeCoordinates: [CLLocationCoordinate2D]

        var isComplete: Bool {
            endTime != nil
        }
    }

    override init() {
        super.init()
        setupLocationManager()
    }

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 10 // Update every 10 meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true
        locationManager.requestAlwaysAuthorization()
    }

    // MARK: - Trip Controls
    func startTrip(vehicleId: String, driverId: String, purpose: String) {
        guard let location = locationManager.location else { return }

        let trip = Trip(
            id: UUID().uuidString,
            vehicleId: vehicleId,
            driverId: driverId,
            startTime: Date(),
            startLocation: location,
            distance: 0,
            duration: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            purpose: purpose,
            routeCoordinates: []
        )

        currentTrip = trip
        isTracking = true
        startTime = Date()
        locations = [location]
        routeCoordinates = [location.coordinate]

        // Start location updates
        locationManager.startUpdatingLocation()

        // Start timer for duration tracking
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.updateTripDuration()
        }

        // Send start trip event to Azure
        Task {
            await sendTripEventToAzure(event: "trip_started", trip: trip)
        }
    }

    func endTrip(notes: String? = nil) {
        guard var trip = currentTrip else { return }

        trip.endTime = Date()
        trip.endLocation = currentLocation
        trip.notes = notes
        trip.distance = tripDistance
        trip.duration = tripDuration
        trip.averageSpeed = averageSpeed
        trip.routeCoordinates = routeCoordinates

        // Stop tracking
        locationManager.stopUpdatingLocation()
        timer?.invalidate()
        timer = nil
        isTracking = false

        // Send completed trip to Azure
        Task {
            await sendCompletedTripToAzure(trip: trip)
        }

        // Reset
        currentTrip = nil
        tripDistance = 0
        tripDuration = 0
        averageSpeed = 0
        routeCoordinates = []
        locations = []
    }

    func pauseTrip() {
        locationManager.stopUpdatingLocation()
        timer?.invalidate()
    }

    func resumeTrip() {
        locationManager.startUpdatingLocation()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.updateTripDuration()
        }
    }

    // MARK: - CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last,
              isTracking else { return }

        currentLocation = newLocation
        self.locations.append(newLocation)
        routeCoordinates.append(newLocation.coordinate)

        // Calculate distance
        if self.locations.count > 1 {
            let previousLocation = self.locations[self.locations.count - 2]
            let distance = newLocation.distance(from: previousLocation)
            tripDistance += distance
        }

        // Calculate average speed
        if tripDuration > 0 {
            averageSpeed = (tripDistance / 1609.34) / (tripDuration / 3600) // Convert to mph
        }

        // Update max speed
        if var trip = currentTrip {
            let speedMPH = newLocation.speed * 2.23694 // Convert m/s to mph
            if speedMPH > trip.maxSpeed {
                trip.maxSpeed = speedMPH
                currentTrip = trip
            }
        }

        // Send periodic updates to Azure
        if self.locations.count % 10 == 0 { // Every 10 location updates
            Task {
                await sendTripUpdateToAzure()
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            locationManager.startUpdatingLocation()
        default:
            break
        }
    }

    // MARK: - Private Methods
    private func updateTripDuration() {
        guard let start = startTime else { return }
        tripDuration = Date().timeIntervalSince(start)
    }

    // MARK: - Azure Integration
    private func sendTripEventToAzure(event: String, trip: Trip) async {
        guard let url = URL(string: "\(APIConfiguration.apiBaseURL)/trips/event") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "event": event,
            "tripId": trip.id,
            "vehicleId": trip.vehicleId,
            "driverId": trip.driverId,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "location": [
                "latitude": trip.startLocation.coordinate.latitude,
                "longitude": trip.startLocation.coordinate.longitude
            ],
            "purpose": trip.purpose
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            let (_, _) = try await URLSession.shared.data(for: request)
        } catch {
            print("Failed to send trip event: \(error)")
        }
    }

    private func sendTripUpdateToAzure() async {
        guard let trip = currentTrip,
              let location = currentLocation else { return }

        guard let url = URL(string: "\(APIConfiguration.apiBaseURL)/trips/update") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "tripId": trip.id,
            "currentLocation": [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "speed": location.speed * 2.23694, // mph
                "heading": location.course
            ],
            "distance": tripDistance / 1609.34, // Convert to miles
            "duration": tripDuration,
            "averageSpeed": averageSpeed
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            let (_, _) = try await URLSession.shared.data(for: request)
        } catch {
            print("Failed to send trip update: \(error)")
        }
    }

    private func sendCompletedTripToAzure(trip: Trip) async {
        guard let url = URL(string: "\(APIConfiguration.apiBaseURL)/trips/complete") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Convert route coordinates to array of dictionaries
        let routeData = trip.routeCoordinates.map {
            ["latitude": $0.latitude, "longitude": $0.longitude]
        }

        let payload: [String: Any] = [
            "tripId": trip.id,
            "vehicleId": trip.vehicleId,
            "driverId": trip.driverId,
            "startTime": ISO8601DateFormatter().string(from: trip.startTime),
            "endTime": ISO8601DateFormatter().string(from: trip.endTime ?? Date()),
            "startLocation": [
                "latitude": trip.startLocation.coordinate.latitude,
                "longitude": trip.startLocation.coordinate.longitude
            ],
            "endLocation": [
                "latitude": trip.endLocation?.coordinate.latitude ?? 0,
                "longitude": trip.endLocation?.coordinate.longitude ?? 0
            ],
            "distance": trip.distance / 1609.34, // miles
            "duration": trip.duration,
            "averageSpeed": trip.averageSpeed,
            "maxSpeed": trip.maxSpeed,
            "purpose": trip.purpose,
            "notes": trip.notes ?? "",
            "route": routeData
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            let (_, _) = try await URLSession.shared.data(for: request)
        } catch {
            print("Failed to send completed trip: \(error)")
        }
    }
}

// MARK: - Trip Tracking View
struct TripTrackingOverlayView: View {
    @StateObject private var tripManager = TripManager()
    @State private var showingStartTripSheet = false
    @State private var showingEndTripSheet = false
    @State private var tripPurpose = ""
    @State private var tripNotes = ""
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 30.4383, longitude: -84.2807),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    var body: some View {
        VStack(spacing: 0) {
            // Map View
            Map(coordinateRegion: $region, showsUserLocation: true)
                .frame(height: 300)
                .cornerRadius(16)
                .padding()

            // Trip Status Card
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(tripManager.isTracking ? "Trip in Progress" : "No Active Trip")
                            .font(.headline)

                        if tripManager.isTracking {
                            Text("Started: \(formatTime(tripManager.currentTrip?.startTime ?? Date()))")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    Circle()
                        .fill(tripManager.isTracking ? Color.green : Color.gray)
                        .frame(width: 12, height: 12)
                }

                if tripManager.isTracking {
                    // Trip Statistics
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                        TripStatCard(
                            title: "Distance",
                            value: String(format: "%.1f mi", tripManager.tripDistance / 1609.34),
                            icon: "location.fill",
                            color: .blue
                        )

                        TripStatCard(
                            title: "Duration",
                            value: formatDuration(tripManager.tripDuration),
                            icon: "clock.fill",
                            color: .green
                        )

                        TripStatCard(
                            title: "Avg Speed",
                            value: String(format: "%.0f mph", tripManager.averageSpeed),
                            icon: "speedometer",
                            color: .orange
                        )

                        TripStatCard(
                            title: "Max Speed",
                            value: String(format: "%.0f mph", tripManager.currentTrip?.maxSpeed ?? 0),
                            icon: "gauge",
                            color: .purple
                        )
                    }
                }

                // Trip Controls
                if tripManager.isTracking {
                    HStack(spacing: 16) {
                        Button("Pause Trip") {
                            tripManager.pauseTrip()
                        }
                        .buttonStyle(SecondaryButtonStyle())

                        Button("End Trip") {
                            showingEndTripSheet = true
                        }
                        .buttonStyle(PrimaryButtonStyle())
                    }
                } else {
                    Button("Start New Trip") {
                        showingStartTripSheet = true
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .padding(.horizontal)

            Spacer()
        }
        .navigationTitle("Trip Tracking")
        .sheet(isPresented: $showingStartTripSheet) {
            StartTripSheet(tripManager: tripManager, purpose: $tripPurpose)
        }
        .sheet(isPresented: $showingEndTripSheet) {
            EndTripSheet(tripManager: tripManager, notes: $tripNotes)
        }
        .onReceive(tripManager.$currentLocation) { location in
            if let location = location {
                region.center = location.coordinate
            }
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%dh %02dm", hours, minutes)
        } else {
            return String(format: "%dm %02ds", minutes, seconds)
        }
    }
}

// MARK: - Start Trip Sheet
struct StartTripSheet: View {
    let tripManager: TripManager
    @Binding var purpose: String
    @Environment(\.dismiss) private var dismiss: DismissAction

    private let purposeOptions = [
        "Delivery",
        "Maintenance",
        "Service Call",
        "Inspection",
        "Emergency",
        "Training",
        "Other"
    ]

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Start New Trip")
                    .font(.title2)
                    .fontWeight(.bold)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Trip Purpose")
                        .font(.headline)

                    ForEach(purposeOptions, id: \.self) { option in
                        Button(action: {
                            purpose = option
                        }) {
                            HStack {
                                Text(option)
                                    .foregroundColor(.primary)

                                Spacer()

                                if purpose == option {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }
                }

                Spacer()

                Button("Start Tracking") {
                    tripManager.startTrip(
                        vehicleId: "FL-GOV-001",
                        driverId: "EMP001",
                        purpose: purpose
                    )
                    dismiss()
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(purpose.isEmpty)
            }
            .padding()
            .navigationBarItems(trailing: Button("Cancel") { dismiss() })
        }
    }
}

// MARK: - End Trip Sheet
struct EndTripSheet: View {
    let tripManager: TripManager
    @Binding var notes: String
    @Environment(\.dismiss) private var dismiss: DismissAction

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("End Trip")
                    .font(.title2)
                    .fontWeight(.bold)

                // Trip Summary
                if let trip = tripManager.currentTrip {
                    VStack(spacing: 16) {
                        HStack {
                            Text("Distance:")
                            Spacer()
                            Text(String(format: "%.1f miles", tripManager.tripDistance / 1609.34))
                                .fontWeight(.bold)
                        }

                        HStack {
                            Text("Duration:")
                            Spacer()
                            Text(formatDuration(tripManager.tripDuration))
                                .fontWeight(.bold)
                        }

                        HStack {
                            Text("Purpose:")
                            Spacer()
                            Text(trip.purpose)
                                .fontWeight(.bold)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Trip Notes (Optional)")
                        .font(.headline)

                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                }

                Spacer()

                Button("Complete Trip") {
                    tripManager.endTrip(notes: notes.isEmpty ? nil : notes)
                    dismiss()
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding()
            .navigationBarItems(trailing: Button("Cancel") { dismiss() })
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60

        if hours > 0 {
            return String(format: "%dh %02dm", hours, minutes)
        } else {
            return String(format: "%d minutes", minutes)
        }
    }
}

// MARK: - Trip Stat Card
struct TripStatCard: View {
    let title: String
    let value: String
    var subtitle: String? = nil
    let icon: String
    var color: Color = ModernTheme.Colors.primary

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            HStack(spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}
