//
//  TripsView.swift
//  Fleet Manager
//
//  Complete Trips view with history, tracking, and trip cards
//

import SwiftUI
import MapKit

struct TripsView: View {
    @StateObject private var viewModel = TripsViewModel()
    @State private var showingStartTrip = false
    @State private var selectedTripForDetail: Trip?
    @State private var showingDatePicker = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.filteredTrips.isEmpty {
                    ProgressView("Loading trips...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredTrips.isEmpty && !viewModel.searchText.isEmpty {
                    emptySearchState
                } else if viewModel.filteredTrips.isEmpty {
                    emptyState
                } else {
                    tripList
                }

                // Active Trip Overlay
                if viewModel.isTrackingActive {
                    VStack {
                        Spacer()
                        ActiveTripCard(viewModel: viewModel)
                            .padding()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
            }
            .navigationTitle("Trips")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search trips...")
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    calendarButton
                    if !viewModel.isTrackingActive {
                        startTripButton
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingStartTrip) {
                StartTripView(viewModel: viewModel)
            }
            .sheet(item: $selectedTripForDetail) { trip in
                TripDetailView(trip: trip)
            }
            .sheet(isPresented: $showingDatePicker) {
                DateRangePickerView(viewModel: viewModel)
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Trip List
    private var tripList: some View {
        ScrollView {
            // Statistics Bar
            tripStatistics

            // Filter Chips
            filterChips

            // Trip Cards
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredTrips) { trip in
                    TripCard(trip: trip) {
                        selectedTripForDetail = trip
                    }
                    .transition(.asymmetric(
                        insertion: .slide.combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, viewModel.isTrackingActive ? 100 : 20)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Trip Statistics
    private var tripStatistics: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                TripStatCard(
                    title: "Today",
                    value: "\(viewModel.todayTrips)",
                    subtitle: "trips",
                    icon: "calendar",
                    color: .blue
                )

                TripStatCard(
                    title: "This Week",
                    value: "\(viewModel.weekTrips)",
                    subtitle: "trips",
                    icon: "calendar.badge.clock",
                    color: .green
                )

                TripStatCard(
                    title: "Total Distance",
                    value: formatDistance(viewModel.totalDistance),
                    subtitle: "miles",
                    icon: "location.fill",
                    color: .purple
                )

                TripStatCard(
                    title: "Avg Duration",
                    value: formatDuration(viewModel.avgTripDuration),
                    subtitle: "per trip",
                    icon: "clock.fill",
                    color: .orange
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Filter Chips
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(TripsViewModel.TripFilter.allCases, id: \.self) { filter in
                    FilterChip(
                        title: filter.rawValue,
                        icon: filter.icon,
                        isSelected: viewModel.selectedFilter == filter
                    ) {
                        viewModel.applyFilter(filter)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Toolbar Items
    private var calendarButton: some View {
        Button(action: { showingDatePicker = true }) {
            Image(systemName: "calendar")
        }
    }

    private var startTripButton: some View {
        Button(action: { showingStartTrip = true }) {
            Image(systemName: "play.circle.fill")
                .foregroundColor(.green)
        }
    }

    // MARK: - Empty States
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "location.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Trips")
                .font(.title2.bold())

            Text("Start your first trip to begin tracking")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showingStartTrip = true }) {
                Label("Start Trip", systemImage: "play.circle")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptySearchState: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Results")
                .font(.title2.bold())

            Text("No trips match '\(viewModel.searchText)'")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button("Clear Search") {
                viewModel.searchText = ""
            }
            .foregroundColor(.blue)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Helper Functions
    private func formatDistance(_ distance: Double) -> String {
        if distance < 1000 {
            return String(format: "%.0f", distance)
        } else {
            return String(format: "%.1fk", distance / 1000)
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

// MARK: - Trip Card Component
struct TripCard: View {
    let trip: Trip
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(trip.vehicleNumber)
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text(trip.driverName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    TripStatusBadge(status: trip.status)
                }

                // Trip Details
                HStack(spacing: 20) {
                    // Distance
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "location.fill")
                                .font(.caption)
                                .foregroundColor(.blue)
                            Text(String(format: "%.1f mi", trip.distance))
                                .font(.subheadline)
                        }
                    }

                    // Duration
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                            Text(formatDuration(trip.duration))
                                .font(.subheadline)
                        }
                    }

                    // Speed
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "speedometer")
                                .font(.caption)
                                .foregroundColor(.green)
                            Text(String(format: "%.0f mph", trip.averageSpeed))
                                .font(.subheadline)
                        }
                    }
                }

                // Locations
                VStack(alignment: .leading, spacing: 8) {
                    LocationRow(
                        type: .start,
                        location: trip.startLocation.address,
                        time: trip.startTime
                    )

                    if let endLocation = trip.endLocation {
                        LocationRow(
                            type: .end,
                            location: endLocation.address,
                            time: trip.endTime ?? trip.startTime
                        )
                    } else if trip.status == .inProgress {
                        LocationRow(
                            type: .inProgress,
                            location: "Trip in progress...",
                            time: nil
                        )
                    }
                }
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)

                // Footer
                if let purpose = trip.purpose {
                    HStack {
                        Image(systemName: "note.text")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text(purpose)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes) min"
        }
    }
}

// MARK: - Location Row
struct LocationRow: View {
    enum LocationType {
        case start
        case end
        case inProgress

        var icon: String {
            switch self {
            case .start: return "circle.fill"
            case .end: return "mappin.circle.fill"
            case .inProgress: return "location.fill"
            }
        }

        var color: Color {
            switch self {
            case .start: return .green
            case .end: return .red
            case .inProgress: return .blue
            }
        }
    }

    let type: LocationType
    let location: String
    let time: Date?

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: type.icon)
                .font(.caption)
                .foregroundColor(type.color)

            Text(location)
                .font(.caption)
                .foregroundColor(.primary)
                .lineLimit(1)

            Spacer()

            if let time = time {
                Text(time, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Trip Status Badge
// TripStatusBadge moved to TripHistoryView.swift to avoid duplicates

// MARK: - Trip Stat Card
// TripStatCard moved to TripHistoryView.swift to avoid duplicates

// MARK: - Active Trip Card
struct ActiveTripCard: View {
    @ObservedObject var viewModel: TripsViewModel

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Trip in Progress")
                        .font(.headline)
                    Text(viewModel.activeTrip?.vehicleNumber ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: { viewModel.stopCurrentTrip() }) {
                    Image(systemName: "stop.circle.fill")
                        .font(.title)
                        .foregroundColor(.red)
                }
            }

            HStack(spacing: 20) {
                VStack {
                    Text(String(format: "%.1f", viewModel.currentDistance))
                        .font(.title2.bold())
                    Text("miles")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text(String(format: "%.0f", viewModel.currentSpeed))
                        .font(.title2.bold())
                    Text("mph")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if let trip = viewModel.activeTrip {
                    VStack {
                        Text(formatDuration(Date().timeIntervalSince(trip.startTime)))
                            .font(.title2.bold())
                        Text("duration")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.green, lineWidth: 2)
        )
        .cornerRadius(12)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
}

// MARK: - Start Trip View
struct StartTripView: View {
    @ObservedObject var viewModel: TripsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedVehicleId = ""
    @State private var tripPurpose = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Vehicle") {
                    Picker("Select Vehicle", selection: $selectedVehicleId) {
                        Text("Select a vehicle").tag("")
                        ForEach(["FL-0001", "FL-0002", "FL-0003"], id: \.self) { vehicle in
                            Text(vehicle).tag(vehicle)
                        }
                    }
                }

                Section("Trip Details") {
                    TextField("Trip Purpose (Optional)", text: $tripPurpose)
                }

                Section {
                    Button(action: startTrip) {
                        Label("Start Tracking", systemImage: "play.circle.fill")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.green)
                }
            }
            .navigationTitle("Start New Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func startTrip() {
        viewModel.startNewTrip(vehicleId: selectedVehicleId.isEmpty ? "vehicle-001" : selectedVehicleId)
        dismiss()
    }
}

// MARK: - Date Range Picker View
struct DateRangePickerView: View {
    @ObservedObject var viewModel: TripsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var startDate = Date().addingTimeInterval(-30 * 24 * 3600)
    @State private var endDate = Date()

    var body: some View {
        NavigationView {
            Form {
                Section("Date Range") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }

                Section {
                    Button("Apply") {
                        viewModel.applyDateRange(DateRange(start: startDate, end: endDate))
                        dismiss()
                    }
                }
            }
            .navigationTitle("Filter by Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Trip Detail View
struct TripDetailView: View {
    let trip: Trip
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "location.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)

                        Text(trip.vehicleNumber)
                            .font(.title.bold())

                        TripStatusBadge(status: trip.status)
                    }
                    .padding()

                    // Map View (placeholder)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Trip Route")
                            .font(.headline)
                            .padding(.horizontal)

                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(.systemGray5))
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Image(systemName: "map")
                                        .font(.largeTitle)
                                        .foregroundColor(.gray)
                                    Text("Route visualization")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            )
                            .padding(.horizontal)
                    }

                    // Trip Metrics
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        MetricCard(title: "Distance", value: String(format: "%.1f mi", trip.distance), icon: "location.fill", color: .blue)
                        MetricCard(title: "Duration", value: formatDuration(trip.duration), icon: "clock.fill", color: .orange)
                        MetricCard(title: "Avg Speed", value: String(format: "%.0f mph", trip.averageSpeed), icon: "speedometer", color: .green)
                        MetricCard(title: "Max Speed", value: String(format: "%.0f mph", trip.maxSpeed), icon: "gauge.high", color: .red)
                        MetricCard(title: "Fuel Used", value: String(format: "%.1f gal", trip.fuelUsed), icon: "fuelpump.fill", color: .purple)
                        MetricCard(title: "Driver", value: trip.driverName, icon: "person.fill", color: .gray)
                    }
                    .padding()

                    // Events
                    if !trip.events.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Trip Events")
                                .font(.headline)
                                .padding(.horizontal)

                            VStack(spacing: 8) {
                                ForEach(Array(trip.events.enumerated()), id: \.offset) { _, event in
                                    HStack {
                                        Image(systemName: eventIcon(for: event.type))
                                            .foregroundColor(eventColor(for: event.severity))
                                        Text(event.type.rawValue)
                                            .font(.subheadline)
                                        Spacer()
                                        Text(event.timestamp, style: .time)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    .padding()
                                    .background(Color(.secondarySystemGroupedBackground))
                                    .cornerRadius(8)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Actions
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Export Trip", systemImage: "square.and.arrow.up")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }

                        Button(action: {}) {
                            Label("View Vehicle", systemImage: "car")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Trip Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
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
            return "\(minutes) min"
        }
    }

    private func eventIcon(for type: TripEvent.EventType) -> String {
        switch type {
        case .start: return "play.circle"
        case .stop: return "stop.circle"
        case .hardBraking: return "exclamationmark.triangle"
        case .rapidAcceleration: return "hare"
        case .speeding: return "gauge.high"
        case .idle: return "pause.circle"
        case .geofenceEntry: return "location.circle"
        case .geofenceExit: return "location.slash.circle"
        }
    }

    private func eventColor(for severity: TripEvent.Severity) -> Color {
        switch severity {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }
}

// MARK: - Metric Card
struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    TripsView()
}