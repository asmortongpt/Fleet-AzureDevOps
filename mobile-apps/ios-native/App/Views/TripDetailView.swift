//
//  TripDetailView.swift
//  Fleet Manager
//
//  Full Trip Detail View with map, statistics, and actions
//

import SwiftUI
import MapKit

// MARK: - Trip Detail View
struct TripDetailView: View {
    let trip: Trip
    @Environment(\.dismiss) private var dismiss
    @State private var showingShareSheet = false
    @State private var showingEditSheet = false
    @State private var region: MKCoordinateRegion

    init(trip: Trip) {
        self.trip = trip
        // Initialize region from trip coordinates or default
        if let firstCoord = trip.coordinates.first {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: firstCoord.latitude, longitude: firstCoord.longitude),
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        } else {
            _region = State(initialValue: MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 30.4383, longitude: -84.2807), // Tallahassee default
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Map Section
                mapSection

                // Trip Info Header
                tripHeaderCard

                // Statistics Grid
                statisticsGrid

                // Timeline Section
                timelineSection

                // Details Section
                detailsSection

                // Actions Section
                actionsSection
            }
        }
        .navigationTitle(trip.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingShareSheet = true }) {
                        Label("Share Trip", systemImage: "square.and.arrow.up")
                    }
                    Button(action: { showingEditSheet = true }) {
                        Label("Edit Trip", systemImage: "pencil")
                    }
                    Button(role: .destructive, action: {}) {
                        Label("Delete Trip", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            TripEditSheet(trip: trip)
        }
    }

    // MARK: - Map Section
    private var mapSection: some View {
        ZStack(alignment: .bottomTrailing) {
            Map(coordinateRegion: $region, annotationItems: tripAnnotations) { annotation in
                MapMarker(coordinate: annotation.coordinate, tint: annotation.isStart ? .green : (annotation.isEnd ? .red : .blue))
            }
            .frame(height: 250)

            // Map Controls
            VStack(spacing: 8) {
                Button(action: fitMapToTrip) {
                    Image(systemName: "arrow.up.left.and.arrow.down.right")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.blue)
                        .padding(10)
                        .background(Color(.systemBackground))
                        .clipShape(Circle())
                        .shadow(radius: 2)
                }

                Button(action: openInMaps) {
                    Image(systemName: "map")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.blue)
                        .padding(10)
                        .background(Color(.systemBackground))
                        .clipShape(Circle())
                        .shadow(radius: 2)
                }
            }
            .padding()
        }
    }

    // MARK: - Trip Header Card
    private var tripHeaderCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trip.name)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(trip.startTime.formatted(date: .abbreviated, time: .shortened))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                TripDetailStatusBadge(status: trip.status)
            }

            Divider()

            HStack(spacing: 30) {
                VStack {
                    Text(trip.formattedDistance)
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Distance")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text(trip.formattedDuration)
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Duration")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text(trip.formattedAverageSpeed)
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Avg Speed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }

    // MARK: - Statistics Grid
    private var statisticsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            TripStatisticCard(
                icon: "speedometer",
                title: "Max Speed",
                value: String(format: "%.1f mph", trip.maxSpeed),
                color: .red
            )

            TripStatisticCard(
                icon: "clock.fill",
                title: "Total Time",
                value: trip.formattedDuration,
                color: .blue
            )

            TripStatisticCard(
                icon: "pause.circle.fill",
                title: "Idle Time",
                value: formatDuration(trip.pausedDuration),
                color: .orange
            )

            TripStatisticCard(
                icon: "location.fill",
                title: "Waypoints",
                value: "\(trip.coordinates.count)",
                color: .green
            )
        }
        .padding()
    }

    // MARK: - Timeline Section
    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Timeline")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 0) {
                TimelineRow(
                    icon: "play.circle.fill",
                    title: "Trip Started",
                    subtitle: trip.startTime.formatted(date: .omitted, time: .standard),
                    color: .green,
                    isFirst: true,
                    isLast: false
                )

                if trip.pausedDuration > 0 {
                    TimelineRow(
                        icon: "pause.circle.fill",
                        title: "Paused",
                        subtitle: "Total: \(formatDuration(trip.pausedDuration))",
                        color: .orange,
                        isFirst: false,
                        isLast: false
                    )
                }

                if let endTime = trip.endTime {
                    TimelineRow(
                        icon: "stop.circle.fill",
                        title: "Trip Ended",
                        subtitle: endTime.formatted(date: .omitted, time: .standard),
                        color: .red,
                        isFirst: false,
                        isLast: true
                    )
                } else {
                    TimelineRow(
                        icon: "location.circle.fill",
                        title: "In Progress",
                        subtitle: "Currently tracking",
                        color: .blue,
                        isFirst: false,
                        isLast: true
                    )
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
    }

    // MARK: - Details Section
    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Details")
                .font(.headline)

            if let vehicleId = trip.vehicleId, !vehicleId.isEmpty {
                DetailRow(icon: "car.fill", label: "Vehicle", value: vehicleId)
            }

            if let driverId = trip.driverId, !driverId.isEmpty {
                DetailRow(icon: "person.fill", label: "Driver", value: driverId)
            }

            if let notes = trip.notes, !notes.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Notes", systemImage: "note.text")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(notes)
                        .font(.body)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }

    // MARK: - Actions Section
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button(action: exportTrip) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                    Text("Export Trip Data")
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .cornerRadius(12)
            }

            Button(action: duplicateTrip) {
                HStack {
                    Image(systemName: "doc.on.doc")
                    Text("Duplicate Trip")
                }
                .font(.headline)
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }
        }
        .padding()
    }

    // MARK: - Helper Properties
    private var tripAnnotations: [TripAnnotation] {
        var annotations: [TripAnnotation] = []

        if let first = trip.coordinates.first {
            annotations.append(TripAnnotation(
                id: "start",
                coordinate: CLLocationCoordinate2D(latitude: first.latitude, longitude: first.longitude),
                isStart: true,
                isEnd: false
            ))
        }

        // Add intermediate points (every 10th point to avoid clutter)
        for (index, coord) in trip.coordinates.enumerated() where index % 10 == 0 && index != 0 && index != trip.coordinates.count - 1 {
            annotations.append(TripAnnotation(
                id: "\(index)",
                coordinate: CLLocationCoordinate2D(latitude: coord.latitude, longitude: coord.longitude),
                isStart: false,
                isEnd: false
            ))
        }

        if let last = trip.coordinates.last, trip.coordinates.count > 1 {
            annotations.append(TripAnnotation(
                id: "end",
                coordinate: CLLocationCoordinate2D(latitude: last.latitude, longitude: last.longitude),
                isStart: false,
                isEnd: true
            ))
        }

        return annotations
    }

    // MARK: - Helper Functions
    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    private func fitMapToTrip() {
        guard !trip.coordinates.isEmpty else { return }

        let latitudes = trip.coordinates.map { $0.latitude }
        let longitudes = trip.coordinates.map { $0.longitude }

        let minLat = latitudes.min() ?? 0
        let maxLat = latitudes.max() ?? 0
        let minLng = longitudes.min() ?? 0
        let maxLng = longitudes.max() ?? 0

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: (maxLat - minLat) * 1.3,
            longitudeDelta: (maxLng - minLng) * 1.3
        )

        withAnimation {
            region = MKCoordinateRegion(center: center, span: span)
        }
    }

    private func openInMaps() {
        guard let first = trip.coordinates.first else { return }
        let coordinate = CLLocationCoordinate2D(latitude: first.latitude, longitude: first.longitude)
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        mapItem.name = trip.name
        mapItem.openInMaps()
    }

    private func exportTrip() {
        // Export functionality
        print("Exporting trip: \(trip.id)")
    }

    private func duplicateTrip() {
        // Duplicate functionality
        print("Duplicating trip: \(trip.id)")
    }
}

// MARK: - Supporting Views
struct TripAnnotation: Identifiable {
    let id: String
    let coordinate: CLLocationCoordinate2D
    let isStart: Bool
    let isEnd: Bool
}

struct TripDetailStatusBadge: View {
    let status: TripStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(statusColor)
            .cornerRadius(8)
    }

    private var statusColor: Color {
        switch status {
        case .active, .inProgress: return .green
        case .paused: return .orange
        case .completed: return .blue
        case .cancelled: return .gray
        }
    }
}

struct TripStatisticCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct TimelineRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let isFirst: Bool
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(spacing: 0) {
                if !isFirst {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 2, height: 20)
                }

                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)

                if !isLast {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 2, height: 20)
                }
            }
            .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)

            Spacer()
        }
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Trip Edit Sheet
struct TripEditSheet: View {
    let trip: Trip
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var notes: String = ""

    init(trip: Trip) {
        self.trip = trip
        _name = State(initialValue: trip.name)
        _notes = State(initialValue: trip.notes ?? "")
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Trip Name") {
                    TextField("Name", text: $name)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Edit Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        // Save changes
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        TripDetailView(trip: Trip(
            name: "Morning Commute",
            startTime: Date().addingTimeInterval(-3600),
            endTime: Date(),
            coordinates: [
                TripCoordinate(latitude: 30.4383, longitude: -84.2807),
                TripCoordinate(latitude: 30.4400, longitude: -84.2850),
                TripCoordinate(latitude: 30.4450, longitude: -84.2900)
            ],
            status: .completed,
            totalDistance: 12.5,
            averageSpeed: 35.0,
            maxSpeed: 55.0,
            vehicleId: "V-001",
            driverId: "D-001",
            notes: "Regular morning route"
        ))
    }
}
