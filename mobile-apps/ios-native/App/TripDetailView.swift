import SwiftUI
import MapKit

// MARK: - Trip Detail View
struct TripDetailView: View {
    let trip: Trip

    @StateObject private var persistenceManager = DataPersistenceManager.shared
    @Environment(\.dismiss) var dismiss

    @State private var region: MKCoordinateRegion
    @State private var showingExportOptions = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    @State private var selectedCoordinate: TripCoordinate?

    init(trip: Trip) {
        self.trip = trip

        // Initialize map region based on trip coordinates
        if let firstCoord = trip.coordinates.first {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: firstCoord.latitude, longitude: firstCoord.longitude),
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        } else {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        }
    }

    init(tripId: String) {
        // Load trip from persistence
        let repository = TripRepository()
        if let uuid = UUID(uuidString: tripId),
           let loadedTrip = try? repository.fetch(byId: uuid) {
            self.trip = loadedTrip
        } else {
            // Fallback trip
            self.trip = Trip(name: "Unknown Trip")
        }

        // Initialize map region based on trip coordinates
        if let firstCoord = trip.coordinates.first {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: firstCoord.latitude, longitude: firstCoord.longitude),
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        } else {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Map View
                    mapSection
                    
                    // Trip Info
                    tripInfoSection
                    
                    // Statistics
                    statisticsSection
                    
                    // Route Details
                    routeDetailsSection
                    
                    // Notes
                    if let notes = trip.notes, !notes.isEmpty {
                        notesSection(notes)
                    }
                }
            }
            .navigationTitle(trip.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { exportTrip(format: .gpx) }) {
                            Label("Export as GPX", systemImage: "map")
                        }
                        
                        Button(action: { exportTrip(format: .csv) }) {
                            Label("Export as CSV", systemImage: "tablecells")
                        }
                        
                        Button(action: { exportTrip(format: .json) }) {
                            Label("Export as JSON", systemImage: "doc.text")
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                if let url = exportURL {
                    ShareSheet(items: [url])
                }
            }
        }
    }
    
    // MARK: - Map Section
    
    private var mapSection: some View {
        ZStack(alignment: .topTrailing) {
            Map(coordinateRegion: $region, annotationItems: mapAnnotations) { annotation in
                MapAnnotation(coordinate: annotation.coordinate) {
                    Circle()
                        .fill(annotation.color)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Circle()
                                .stroke(Color.white, lineWidth: 2)
                        )
                }
            }
            .frame(height: 300)
            
            // Center on route button
            Button(action: centerOnRoute) {
                Image(systemName: "location.fill")
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color.blue)
                    .clipShape(Circle())
                    .shadow(radius: 3)
            }
            .padding()
        }
    }
    
    private var mapAnnotations: [TripMapAnnotation] {
        var annotations: [TripMapAnnotation] = []

        if let first = trip.coordinates.first {
            annotations.append(TripMapAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: first.latitude, longitude: first.longitude),
                color: .green,
                label: "Start"
            ))
        }

        if let last = trip.coordinates.last, trip.coordinates.count > 1 {
            annotations.append(TripMapAnnotation(
                coordinate: CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude),
                color: .red,
                label: "End"
            ))
        }
        
        return annotations
    }
    
    // MARK: - Trip Info Section
    
    private var tripInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            InfoRow(label: "Status", value: trip.status.displayName, icon: "info.circle")
            InfoRow(label: "Start Time", value: trip.startTime.formatted(date: .abbreviated, time: .shortened), icon: "calendar")
            
            if let endTime = trip.endTime {
                InfoRow(label: "End Time", value: endTime.formatted(date: .abbreviated, time: .shortened), icon: "calendar")
            }
            
            if let vehicleId = trip.vehicleId {
                InfoRow(label: "Vehicle ID", value: vehicleId, icon: "car")
            }
            
            if let driverId = trip.driverId {
                InfoRow(label: "Driver ID", value: driverId, icon: "person")
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    // MARK: - Statistics Section
    
    private var statisticsSection: some View {
        VStack(spacing: 16) {
            Text("Statistics")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatisticCard(
                    title: "Distance",
                    value: trip.formattedDistance,
                    icon: "road.lanes",
                    color: .blue
                )
                
                StatisticCard(
                    title: "Duration",
                    value: trip.formattedDuration,
                    icon: "clock.fill",
                    color: .green
                )
                
                StatisticCard(
                    title: "Avg Speed",
                    value: trip.formattedAverageSpeed,
                    icon: "speedometer",
                    color: .orange
                )
                
                StatisticCard(
                    title: "Max Speed",
                    value: String(format: "%.1f mph", trip.maxSpeed),
                    icon: "gauge.high",
                    color: .red
                )
                
                StatisticCard(
                    title: "Coordinates",
                    value: "\(trip.coordinates.count)",
                    icon: "mappin.and.ellipse",
                    color: .purple
                )
                
                if trip.pausedDuration > 0 {
                    StatisticCard(
                        title: "Paused",
                        value: formatDuration(trip.pausedDuration),
                        icon: "pause.circle",
                        color: .gray
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Route Details Section
    
    private var routeDetailsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Route Details")
                .font(.headline)
            
            if !trip.coordinates.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(Array(trip.coordinates.enumerated()), id: \.offset) { index, coordinate in
                            RoutePointCard(
                                index: index + 1,
                                coordinate: coordinate,
                                isSelected: selectedCoordinate?.id == coordinate.id
                            )
                            .onTapGesture {
                                selectedCoordinate = coordinate
                                region.center = CLLocationCoordinate2D(
                                    latitude: coordinate.latitude,
                                    longitude: coordinate.longitude
                                )
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            } else {
                Text("No route data available")
                    .foregroundColor(.secondary)
                    .padding()
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Notes Section
    
    private func notesSection(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notes")
                .font(.headline)
            
            Text(notes)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Helper Functions
    
    private func centerOnRoute() {
        guard !trip.coordinates.isEmpty else { return }
        
        let coordinates = trip.coordinates.map { $0.clLocation.coordinate }
        
        var minLat = coordinates[0].latitude
        var maxLat = coordinates[0].latitude
        var minLon = coordinates[0].longitude
        var maxLon = coordinates[0].longitude
        
        for coord in coordinates {
            minLat = min(minLat, coord.latitude)
            maxLat = max(maxLat, coord.latitude)
            minLon = min(minLon, coord.longitude)
            maxLon = max(maxLon, coord.longitude)
        }
        
        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )
        
        let span = MKCoordinateSpan(
            latitudeDelta: (maxLat - minLat) * 1.5,
            longitudeDelta: (maxLon - minLon) * 1.5
        )
        
        region = MKCoordinateRegion(center: center, span: span)
    }
    
    private func exportTrip(format: ExportFormat) {
        do {
            exportURL = try persistenceManager.exportTrip(trip, format: format)
            showingShareSheet = true
        } catch {
            print("Error exporting trip: \(error)")
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

// MARK: - Supporting Views

struct TripInfoRow: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text(label)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .fontWeight(.medium)
        }
    }
}

struct StatisticCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5)
    }
}

struct RoutePointCard: View {
    let index: Int
    let coordinate: TripCoordinate
    let isSelected: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("#\(index)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(4)
                    .background(Color.blue)
                    .clipShape(Circle())
                
                Spacer()
                
                if let speed = coordinate.speed {
                    Text(String(format: "%.1f mph", speed))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(coordinate.timestamp.formatted(time: .shortened))
                .font(.caption2)
                .foregroundColor(.secondary)
            
            if let altitude = coordinate.altitude {
                Text(String(format: "Alt: %.0fm", altitude))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(10)
        .frame(width: 120)
        .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

struct TripMapAnnotation: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
    let color: Color
    let label: String
}

// MARK: - Share Sheet
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Preview
struct TripDetailView_Previews: PreviewProvider {
    static var previews: some View {
        TripDetailView(trip: Trip(
            name: "Sample Trip",
            startTime: Date().addingTimeInterval(-3600),
            endTime: Date(),
            coordinates: [
                TripCoordinate(latitude: 37.7749, longitude: -122.4194, speed: 35.0),
                TripCoordinate(latitude: 37.7750, longitude: -122.4195, speed: 40.0)
            ],
            status: .completed,
            totalDistance: 12.5,
            averageSpeed: 37.5,
            maxSpeed: 55.0
        ))
    }
}
