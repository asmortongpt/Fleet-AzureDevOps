/**
 * Vehicle Idling Monitoring View
 *
 * Real-time monitoring and analytics for vehicle idling detection
 *
 * Features:
 * - Live idling status for all vehicles
 * - Individual vehicle idling history
 * - Driver performance scoreboard
 * - Fleet-wide statistics
 * - Cost impact tracking
 * - Configurable alert thresholds
 */

import SwiftUI
import MapKit

struct VehicleIdlingView: View {
    @StateObject private var viewModel = VehicleIdlingViewModel()
    @State private var selectedTab = 0
    @State private var showingThresholdSettings = false
    @State private var selectedVehicle: IdlingVehicle?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    Text("Active").tag(0)
                    Text("History").tag(1)
                    Text("Analytics").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    ActiveIdlingView(viewModel: viewModel, selectedVehicle: $selectedVehicle)
                        .tag(0)

                    IdlingHistoryView(viewModel: viewModel)
                        .tag(1)

                    IdlingAnalyticsView(viewModel: viewModel)
                        .tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("Idling Monitor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingThresholdSettings = true }) {
                        Image(systemName: "gear")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.refreshData() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(isPresented: $showingThresholdSettings) {
                ThresholdSettingsView(viewModel: viewModel)
            }
            .sheet(item: $selectedVehicle) { vehicle in
                VehicleIdlingDetailView(vehicle: vehicle, viewModel: viewModel)
            }
            .onAppear {
                viewModel.startMonitoring()
            }
            .onDisappear {
                viewModel.stopMonitoring()
            }
        }
    }
}

// MARK: - Active Idling View
struct ActiveIdlingView: View {
    @ObservedObject var viewModel: VehicleIdlingViewModel
    @Binding var selectedVehicle: IdlingVehicle?

    var body: some View {
        ZStack {
            if viewModel.isLoading && viewModel.activeIdlingVehicles.isEmpty {
                ProgressView("Loading active idling vehicles...")
            } else if viewModel.activeIdlingVehicles.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)

                    Text("No Active Idling")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("All vehicles are operating efficiently")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.activeIdlingVehicles) { vehicle in
                            ActiveIdlingCard(vehicle: vehicle)
                                .onTapGesture {
                                    selectedVehicle = vehicle
                                }
                        }
                    }
                    .padding()
                }
            }
        }
    }
}

// MARK: - Active Idling Card
struct ActiveIdlingCard: View {
    let vehicle: IdlingVehicle

    var severityColor: Color {
        switch vehicle.severity {
        case "warning": return .yellow
        case "alert": return .orange
        case "critical": return .red
        default: return .gray
        }
    }

    var severityIcon: String {
        switch vehicle.severity {
        case "warning": return "exclamationmark.triangle.fill"
        case "alert": return "exclamationmark.circle.fill"
        case "critical": return "xmark.octagon.fill"
        default: return "info.circle.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.vehicleName)
                        .font(.headline)

                    Text(vehicle.licensePlate)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Image(systemName: severityIcon)
                        .foregroundColor(severityColor)
                        .font(.title2)

                    Text(vehicle.severity.uppercased())
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(severityColor)
                }
            }

            Divider()

            // Metrics
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Duration")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(formatDuration(vehicle.idleSeconds))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Est. Fuel Waste")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(String(format: "%.2f gal", vehicle.estimatedFuelWaste))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Est. Cost")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(String(format: "$%.2f", vehicle.estimatedCost))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                }
            }

            // Driver and Location
            if let driver = vehicle.driverName {
                HStack {
                    Image(systemName: "person.fill")
                        .foregroundColor(.blue)
                    Text(driver)
                        .font(.caption)
                }
            }

            if let location = vehicle.location {
                HStack {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.red)
                    Text(location)
                        .font(.caption)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: severityColor.opacity(0.3), radius: 5, x: 0, y: 2)
    }

    private func formatDuration(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Idling History View
struct IdlingHistoryView: View {
    @ObservedObject var viewModel: VehicleIdlingViewModel
    @State private var selectedDays = 7

    var body: some View {
        VStack(spacing: 0) {
            // Time range selector
            Picker("Period", selection: $selectedDays) {
                Text("7 Days").tag(7)
                Text("30 Days").tag(30)
                Text("90 Days").tag(90)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            .onChange(of: selectedDays) { newValue in
                viewModel.loadHistory(days: newValue)
            }

            if viewModel.idlingHistory.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)

                    Text("No Idling History")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .padding()
            } else {
                List(viewModel.idlingHistory) { event in
                    IdlingHistoryRow(event: event)
                }
                .listStyle(PlainListStyle())
            }
        }
    }
}

// MARK: - Idling History Row
struct IdlingHistoryRow: View {
    let event: IdlingEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(event.vehicleName)
                    .font(.headline)

                Spacer()

                Text(formatDate(event.startTime))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 16) {
                Label(formatDuration(event.durationSeconds), systemImage: "clock.fill")
                    .font(.caption)

                Label(String(format: "%.2f gal", event.fuelWaste), systemImage: "drop.fill")
                    .font(.caption)
                    .foregroundColor(.orange)

                Label(String(format: "$%.2f", event.cost), systemImage: "dollarsign.circle.fill")
                    .font(.caption)
                    .foregroundColor(.red)
            }

            if let driver = event.driverName {
                Text("Driver: \(driver)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"

        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .short
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }

        return dateString
    }

    private func formatDuration(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Idling Analytics View
struct IdlingAnalyticsView: View {
    @ObservedObject var viewModel: VehicleIdlingViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Fleet Summary Card
                FleetSummaryCard(stats: viewModel.fleetStats)

                // Top Offenders
                if !viewModel.topOffenders.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Top Idling Vehicles (30 Days)")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(viewModel.topOffenders) { offender in
                            TopOffenderRow(offender: offender)
                        }
                    }
                }

                // Driver Performance
                if !viewModel.driverPerformance.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Driver Performance (30 Days)")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(viewModel.driverPerformance) { driver in
                            DriverPerformanceRow(driver: driver)
                        }
                    }
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Fleet Summary Card
struct FleetSummaryCard: View {
    let stats: FleetIdlingStats

    var body: some View {
        VStack(spacing: 16) {
            Text("Fleet Overview (30 Days)")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatBox(title: "Total Events", value: "\(stats.totalEvents)", color: .blue)
                StatBox(title: "Total Time", value: formatHours(stats.totalHours), color: .purple)
                StatBox(title: "Fuel Waste", value: String(format: "%.1f gal", stats.totalFuelWaste), color: .orange)
                StatBox(title: "Total Cost", value: String(format: "$%.0f", stats.totalCost), color: .red)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private func formatHours(_ hours: Double) -> String {
        if hours < 1 {
            return String(format: "%.0f min", hours * 60)
        } else {
            return String(format: "%.1f hrs", hours)
        }
    }
}

// MARK: - Stat Box
struct StatBox: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Top Offender Row
struct TopOffenderRow: View {
    let offender: TopOffender

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(offender.vehicleName)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(offender.licensePlate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "%.1f hrs", offender.totalHours))
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(String(format: "$%.0f cost", offender.totalCost))
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

// MARK: - Driver Performance Row
struct DriverPerformanceRow: View {
    let driver: DriverPerformance

    var scoreColor: Color {
        if driver.score >= 80 { return .green }
        else if driver.score >= 60 { return .yellow }
        else { return .red }
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(driver.driverName)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("\(driver.eventCount) events")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Text("\(driver.score)")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor)

                    Image(systemName: driver.score >= 70 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundColor(scoreColor)
                }

                Text(String(format: "%.1f hrs idle", driver.totalHours))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

// MARK: - Threshold Settings View
struct ThresholdSettingsView: View {
    @ObservedObject var viewModel: VehicleIdlingViewModel
    @Environment(\.presentationMode) var presentationMode

    @State private var warningMinutes: Double = 5
    @State private var alertMinutes: Double = 10
    @State private var criticalMinutes: Double = 30

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Alert Thresholds")) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Warning: \(Int(warningMinutes)) minutes")
                            .font(.subheadline)

                        Slider(value: $warningMinutes, in: 1...10, step: 1)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Alert: \(Int(alertMinutes)) minutes")
                            .font(.subheadline)

                        Slider(value: $alertMinutes, in: 5...20, step: 1)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Critical: \(Int(criticalMinutes)) minutes")
                            .font(.subheadline)

                        Slider(value: $criticalMinutes, in: 15...60, step: 5)
                    }
                }

                Section {
                    Button("Save Settings") {
                        viewModel.updateThresholds(
                            warning: Int(warningMinutes) * 60,
                            alert: Int(alertMinutes) * 60,
                            critical: Int(criticalMinutes) * 60
                        )
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .navigationTitle("Threshold Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Vehicle Idling Detail View
struct VehicleIdlingDetailView: View {
    let vehicle: IdlingVehicle
    @ObservedObject var viewModel: VehicleIdlingViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Current Status
                    ActiveIdlingCard(vehicle: vehicle)
                        .padding()

                    // Map showing location
                    if let lat = vehicle.latitude, let lon = vehicle.longitude {
                        Map(coordinateRegion: .constant(MKCoordinateRegion(
                            center: CLLocationCoordinate2D(latitude: lat, longitude: lon),
                            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                        )), annotationItems: [vehicle]) { v in
                            MapMarker(coordinate: CLLocationCoordinate2D(
                                latitude: v.latitude!,
                                longitude: v.longitude!
                            ), tint: .red)
                        }
                        .frame(height: 200)
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Actions
                    VStack(spacing: 12) {
                        Button(action: {
                            // Send alert to driver
                            viewModel.sendAlertToDriver(vehicleId: vehicle.vehicleId)
                        }) {
                            Label("Send Alert to Driver", systemImage: "bell.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }

                        Button(action: {
                            // Call driver
                            viewModel.callDriver(vehicleId: vehicle.vehicleId)
                        }) {
                            Label("Call Driver", systemImage: "phone.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("Idling Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview
struct VehicleIdlingView_Previews: PreviewProvider {
    static var previews: some View {
        VehicleIdlingView()
    }
}
