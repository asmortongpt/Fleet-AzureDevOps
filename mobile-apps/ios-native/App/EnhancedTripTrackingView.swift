//
//  EnhancedTripTrackingView.swift
//  Fleet Management
//
//  Fully integrated trip tracking with GPS, Weather, and OBD2 diagnostics
//  Real-time data streaming and comprehensive trip recording
//

import SwiftUI
import MapKit
import CoreLocation

struct EnhancedTripTrackingView: View {

    // MARK: - Properties
    let vehicleId: String?

    @StateObject private var locationManager = TripLocationManager()
    @StateObject private var weatherService = WeatherService.shared
    @StateObject private var obd2Manager = OBD2Manager.shared

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    @State private var tripStartTime: Date?
    @State private var currentWeather: WeatherData?
    @State private var showingOBD2Details = false
    @State private var showingSaveTrip = false
    @State private var tripNotes = ""

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            // Map background
            MapViewRepresentable(
                region: $region,
                routePoints: locationManager.isTracking ? getAllCoordinates() : [],
                startLocation: locationManager.currentLocation?.coordinate,
                endLocation: nil
            )
            .edgesIgnoringSafeArea(.all)
            .onAppear {
                centerMapOnUser()
            }

            VStack {
                // Top info cards
                topInfoSection

                Spacer()

                // Control buttons
                controlButtons

                // Stats bar
                if locationManager.isTracking {
                    statsBar
                }
            }
        }
        .navigationTitle("Trip Tracking")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingOBD2Details.toggle() }) {
                        Label("OBD2 Diagnostics", systemImage: "car.fill")
                    }

                    Button(action: refreshData) {
                        Label("Refresh Data", systemImage: "arrow.clockwise")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingOBD2Details) {
            OBD2DiagnosticsView()
        }
        .sheet(isPresented: $showingSaveTrip) {
            SaveTripView(
                distance: locationManager.totalDistance,
                duration: locationManager.tripDuration,
                vehicleId: vehicleId,
                weather: currentWeather,
                onSave: { notes in
                    saveTrip(notes: notes)
                }
            )
        }
        .onAppear {
            setupTracking()
        }
        .alert("Location Permission Required", isPresented: .constant(locationManager.locationError != nil)) {
            Button("Settings") {
                openSettings()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text(locationManager.locationError ?? "")
        }
    }

    // MARK: - Top Info Section

    private var topInfoSection: some View {
        VStack(spacing: 12) {
            // Weather card
            if let weather = currentWeather {
                WeatherCard(weather: weather)
                    .padding(.horizontal)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            // OBD2 quick stats
            if obd2Manager.isConnected {
                OBD2QuickStatsCard()
                    .padding(.horizontal)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding(.top, 10)
    }

    // MARK: - Control Buttons

    private var controlButtons: some View {
        HStack(spacing: 30) {
            if locationManager.isTracking {
                // Stop button
                Button(action: stopTrip) {
                    VStack {
                        Image(systemName: "stop.fill")
                            .font(.title)
                            .foregroundColor(.white)
                            .frame(width: 70, height: 70)
                            .background(Color.red)
                            .clipShape(Circle())
                            .shadow(radius: 5)

                        Text("Stop")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }

                // Pause/Resume button
                Button(action: togglePause) {
                    VStack {
                        Image(systemName: locationManager.isTracking ? "pause.fill" : "play.fill")
                            .font(.title)
                            .foregroundColor(.white)
                            .frame(width: 70, height: 70)
                            .background(Color.orange)
                            .clipShape(Circle())
                            .shadow(radius: 5)

                        Text("Pause")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }
            } else {
                // Start button
                Button(action: startTrip) {
                    VStack {
                        Image(systemName: "play.fill")
                            .font(.largeTitle)
                            .foregroundColor(.white)
                            .frame(width: 90, height: 90)
                            .background(
                                LinearGradient(
                                    colors: [.green, .blue],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .clipShape(Circle())
                            .shadow(radius: 8)

                        Text("Start Trip")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .padding(.bottom, 20)
    }

    // MARK: - Stats Bar

    private var statsBar: some View {
        HStack(spacing: 0) {
            StatItem(
                icon: "location.fill",
                value: String(format: "%.2f", locationManager.totalDistance),
                label: "miles",
                color: .blue
            )

            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.3))

            StatItem(
                icon: "clock.fill",
                value: formatDuration(locationManager.tripDuration),
                label: "duration",
                color: .green
            )

            Divider()
                .frame(height: 40)
                .background(Color.white.opacity(0.3))

            StatItem(
                icon: "speedometer",
                value: String(format: "%.0f", locationManager.currentSpeed),
                label: "mph",
                color: .orange
            )

            if locationManager.maxSpeed > 0 {
                Divider()
                    .frame(height: 40)
                    .background(Color.white.opacity(0.3))

                StatItem(
                    icon: "gauge.high",
                    value: String(format: "%.0f", locationManager.maxSpeed),
                    label: "max mph",
                    color: .red
                )
            }
        }
        .padding()
        .background(Color.black.opacity(0.7))
        .cornerRadius(16)
        .padding(.horizontal)
        .padding(.bottom, 20)
    }

    // MARK: - Actions

    private func setupTracking() {
        locationManager.requestPermissions()

        // Load weather for current location
        if let location = locationManager.currentLocation {
            Task {
                currentWeather = await weatherService.fetchWeather(for: location)
            }
        }
    }

    private func startTrip() {
        locationManager.startTracking()
        tripStartTime = Date()

        // Update weather
        if let location = locationManager.currentLocation {
            Task {
                currentWeather = await weatherService.fetchWeather(for: location)
            }
        }

        // Start OBD2 monitoring if connected
        if obd2Manager.isConnected {
            startOBD2Monitoring()
        }
    }

    private func togglePause() {
        if locationManager.isTracking {
            locationManager.pauseTracking()
        } else {
            locationManager.resumeTracking()
        }
    }

    private func stopTrip() {
        let coordinates = locationManager.stopTracking()

        print("🏁 Trip stopped - \(coordinates.count) points recorded")

        // Show save dialog
        showingSaveTrip = true
    }

    private func saveTrip(notes: String) {
        // In production, save to database
        let tripData = [
            "vehicleId": vehicleId ?? "unknown",
            "startTime": tripStartTime?.ISO8601Format() ?? "",
            "endTime": Date().ISO8601Format(),
            "distance": locationManager.totalDistance,
            "duration": locationManager.tripDuration,
            "maxSpeed": locationManager.maxSpeed,
            "averageSpeed": locationManager.averageSpeed,
            "weather": currentWeather?.condition ?? "Unknown",
            "notes": notes
        ] as [String : Any]

        print("💾 Saving trip:", tripData)

        showingSaveTrip = false
        dismiss()
    }

    private func startOBD2Monitoring() {
        // Request key PIDs
        let monitoringPIDs: [OBD2PID] = [
            .vehicleSpeed,
            .engineRPM,
            .fuelLevel,
            .coolantTemp
        ]

        for pid in monitoringPIDs {
            obd2Manager.requestData(for: pid)
        }
    }

    private func refreshData() {
        if let location = locationManager.currentLocation {
            Task {
                currentWeather = await weatherService.fetchWeather(for: location)
            }
        }

        if obd2Manager.isConnected {
            startOBD2Monitoring()
        }
    }

    private func centerMapOnUser() {
        if let location = locationManager.currentLocation {
            region.center = location.coordinate
        }
    }

    private func getAllCoordinates() -> [CLLocationCoordinate2D] {
        let stats = locationManager.getTripStats()
        return stats.coordinates
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Weather Card

struct WeatherCard: View {
    let weather: WeatherData

    var body: some View {
        HStack {
            Image(systemName: weather.conditionIcon)
                .font(.largeTitle)
                .foregroundColor(.white)
                .frame(width: 60)

            VStack(alignment: .leading, spacing: 4) {
                Text(weather.temperatureString)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(weather.condition)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))

                HStack(spacing: 12) {
                    Label(weather.windSpeedString, systemImage: "wind")
                    Label(weather.visibilityString, systemImage: "eye.fill")
                }
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
            }

            Spacer()

            if let warning = weather.safetyWarning {
                VStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.yellow)
                    Text(warning)
                        .font(.caption2)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                }
                .frame(width: 80)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [.blue.opacity(0.8), .purple.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .shadow(radius: 5)
    }
}

// MARK: - OBD2 Quick Stats Card

struct OBD2QuickStatsCard: View {

    @ObservedObject var connectionManager = OBD2ConnectionManager.shared

    var body: some View {
        let data = connectionManager.currentVehicleData

        HStack(spacing: 16) {
            QuickStat(
                icon: "gauge",
                value: data.engineRPM.map { "\($0)" } ?? "--",
                label: "RPM",
                color: .blue
            )

            QuickStat(
                icon: "fuelpump.fill",
                value: data.fuelLevel.map { "\($0)%" } ?? "--",
                label: "Fuel",
                color: .orange
            )

            QuickStat(
                icon: "thermometer",
                value: data.coolantTemp.map { "\($0)°" } ?? "--",
                label: "Temp",
                color: .red
            )

            Spacer()

            Button(action: {}) {
                Text("Details")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.black.opacity(0.7))
        .cornerRadius(16)
        .shadow(radius: 5)
    }
}

struct QuickStat: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)

            Text(value)
                .font(.headline)
                .foregroundColor(.white)

            Text(label)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.7))
        }
    }
}

// MARK: - Stat Item

struct StatItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text(label)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Save Trip View

struct SaveTripView: View {
    let distance: Double
    let duration: TimeInterval
    let vehicleId: String?
    let weather: WeatherData?
    let onSave: (String) -> Void

    @State private var tripNotes = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Trip Summary")) {
                    HStack {
                        Text("Distance")
                        Spacer()
                        Text(String(format: "%.2f miles", distance))
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Duration")
                        Spacer()
                        Text(formatDuration(duration))
                            .foregroundColor(.secondary)
                    }

                    if let weather = weather {
                        HStack {
                            Text("Weather")
                            Spacer()
                            Text("\(weather.condition), \(weather.temperatureString)")
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $tripNotes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Save Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        onSave(tripNotes)
                    }
                }
            }
        }
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

// MARK: - Preview

struct EnhancedTripTrackingView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EnhancedTripTrackingView(vehicleId: "vehicle-123")
        }
    }
}
