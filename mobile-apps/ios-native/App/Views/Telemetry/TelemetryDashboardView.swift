//
//  TelemetryDashboardView.swift
//  Fleet Manager
//
//  Real-time telemetry dashboard with gauges, alerts, and diagnostics
//

import SwiftUI
import Charts

struct TelemetryDashboardView: View {
    @StateObject private var viewModel = TelemetryDashboardViewModel()
    @State private var selectedTab = 0
    @State private var showingVehiclePicker = false
    @State private var showingExportSheet = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.selectedVehicleId.isEmpty {
                    vehicleSelectionPrompt
                } else {
                    mainContent
                }
            }
            .navigationTitle("Telemetry Dashboard")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    connectionStatusBadge
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingVehiclePicker = true }) {
                            Label("Change Vehicle", systemImage: "car.fill")
                        }
                        Button(action: { Task { await viewModel.refresh() } }) {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                        Divider()
                        Button(action: { showingExportSheet = true }) {
                            Label("Export Data", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingVehiclePicker) {
                VehiclePickerView(selectedVehicleId: $viewModel.selectedVehicleId)
            }
            .sheet(isPresented: $showingExportSheet) {
                ExportDataView(viewModel: viewModel)
            }
        }
        .task {
            if !viewModel.selectedVehicleId.isEmpty {
                await viewModel.refresh()
            }
        }
    }

    // MARK: - Vehicle Selection Prompt
    private var vehicleSelectionPrompt: some View {
        VStack(spacing: 20) {
            Image(systemName: "car.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)

            Text("Select a Vehicle")
                .font(.title2)
                .fontWeight(.bold)

            Text("Choose a vehicle to view real-time telemetry data")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingVehiclePicker = true }) {
                Label("Select Vehicle", systemImage: "car.fill")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
    }

    // MARK: - Main Content
    private var mainContent: some View {
        VStack(spacing: 0) {
            // Tab Picker
            Picker("View", selection: $selectedTab) {
                Text("Live").tag(0)
                Text("History").tag(1)
                Text("Diagnostics").tag(2)
                Text("Health").tag(3)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            // Tab Content
            TabView(selection: $selectedTab) {
                LiveTelemetryTab(viewModel: viewModel)
                    .tag(0)

                HistoricalTelemetryTab(viewModel: viewModel)
                    .tag(1)

                DiagnosticsTab(viewModel: viewModel)
                    .tag(2)

                VehicleHealthTab(viewModel: viewModel)
                    .tag(3)
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        }
    }

    // MARK: - Connection Status Badge
    private var connectionStatusBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(viewModel.isConnected ? Color.green : Color.gray)
                .frame(width: 8, height: 8)
            Text(viewModel.isConnected ? "Live" : "Offline")
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Live Telemetry Tab
struct LiveTelemetryTab: View {
    @ObservedObject var viewModel: TelemetryDashboardViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Active Alerts
                if !viewModel.activeAlerts.isEmpty {
                    alertsSection
                }

                // Live Gauges
                LiveGaugesView(telemetry: viewModel.currentTelemetry)

                // Quick Stats
                if let telemetry = viewModel.currentTelemetry {
                    quickStatsSection(telemetry: telemetry)
                }

                // Last Update Time
                if let telemetry = viewModel.currentTelemetry {
                    Text("Last updated: \(telemetry.timestamp.formatted(date: .omitted, time: .standard))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.fetchLiveTelemetry()
        }
    }

    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active Alerts")
                .font(.headline)
                .padding(.horizontal)

            ForEach(viewModel.activeAlerts) { alert in
                AlertCard(alert: alert) {
                    Task {
                        await viewModel.acknowledgeAlert(alert)
                    }
                }
            }
        }
    }

    private func quickStatsSection(telemetry: TelemetryData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Stats")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(title: "Odometer", value: "\(Int(telemetry.odometer ?? 0))", unit: "mi", icon: "gauge.high")
                StatCard(title: "Fuel Economy", value: String(format: "%.1f", telemetry.fuelEfficiency ?? 0), unit: "MPG", icon: "fuelpump.fill")
                StatCard(title: "Engine Load", value: "\(Int(telemetry.engineLoad ?? 0))", unit: "%", icon: "engine.combustion.fill")
                StatCard(title: "Throttle", value: "\(Int(telemetry.throttlePosition ?? 0))", unit: "%", icon: "speedometer")
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Historical Telemetry Tab
struct HistoricalTelemetryTab: View {
    @ObservedObject var viewModel: TelemetryDashboardViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Time Period Picker
            Picker("Period", selection: $viewModel.selectedTimePeriod) {
                ForEach(TimePeriod.allCases, id: \.self) { period in
                    Text(period.displayName).tag(period)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            .onChange(of: viewModel.selectedTimePeriod) { newPeriod in
                viewModel.selectTimePeriod(newPeriod)
            }

            ScrollView {
                VStack(spacing: 20) {
                    HistoricalChartsView(data: viewModel.historicalData)
                }
                .padding()
            }
        }
        .task {
            await viewModel.fetchHistoricalTelemetry()
        }
    }
}

// MARK: - Diagnostics Tab
struct DiagnosticsTab: View {
    @ObservedObject var viewModel: TelemetryDashboardViewModel

    var body: some View {
        VStack {
            if viewModel.activeDTCs.isEmpty {
                noDiagnosticsView
            } else {
                DTCListView(dtcs: viewModel.activeDTCs) { dtc in
                    Task {
                        await viewModel.clearDiagnosticCode(dtc)
                    }
                }
            }
        }
        .task {
            await viewModel.fetchDiagnosticCodes()
        }
    }

    private var noDiagnosticsView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("No Active Codes")
                .font(.title2)
                .fontWeight(.bold)

            Text("Vehicle diagnostics are clear")
                .font(.body)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Vehicle Health Tab
struct VehicleHealthTab: View {
    @ObservedObject var viewModel: TelemetryDashboardViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let health = viewModel.vehicleHealth {
                    // Overall Health Score
                    overallHealthCard(health: health)

                    // Component Health Breakdown
                    componentHealthSection(health: health)

                    // Issues Summary
                    issuesSummarySection(health: health)
                } else {
                    ProgressView("Loading vehicle health...")
                }
            }
            .padding()
        }
        .task {
            await viewModel.fetchVehicleHealth()
        }
    }

    private func overallHealthCard(health: VehicleHealth) -> some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                    .frame(width: 150, height: 150)

                Circle()
                    .trim(from: 0, to: health.overallScore / 100)
                    .stroke(health.statusColor, lineWidth: 20)
                    .frame(width: 150, height: 150)
                    .rotationEffect(.degrees(-90))

                VStack {
                    Text("\(Int(health.overallScore))")
                        .font(.system(size: 48, weight: .bold))
                    Text("Health Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            HStack {
                Image(systemName: health.healthStatus.icon)
                    .foregroundColor(health.statusColor)
                Text(health.healthStatus.rawValue)
                    .font(.title3)
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }

    private func componentHealthSection(health: VehicleHealth) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Component Health")
                .font(.headline)

            HealthBarItem(title: "Engine", value: health.engineHealth, icon: "engine.combustion.fill")
            HealthBarItem(title: "Transmission", value: health.transmissionHealth, icon: "gearshape.fill")
            HealthBarItem(title: "Brakes", value: health.brakesHealth, icon: "exclamationmark.brake")
            HealthBarItem(title: "Battery", value: health.batteryHealth, icon: "battery.100")
            HealthBarItem(title: "Emissions", value: health.emissionsHealth, icon: "smoke.fill")
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }

    private func issuesSummarySection(health: VehicleHealth) -> some View {
        HStack(spacing: 20) {
            VStack {
                Text("\(health.activeWarnings)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Text("Warnings")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.orange.opacity(0.1))
            .cornerRadius(12)

            VStack {
                Text("\(health.criticalIssues)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.red)
                Text("Critical")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// MARK: - Supporting Views

struct AlertCard: View {
    let alert: TelemetryAlert
    let onAcknowledge: () -> Void

    var body: some View {
        HStack {
            Image(systemName: alert.type.icon)
                .font(.title2)
                .foregroundColor(alert.severity.color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(alert.type.displayName)
                    .font(.headline)
                Text(alert.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: onAcknowledge) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(alert.severity.color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(value)
                        .font(.title3)
                        .fontWeight(.bold)
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(8)
    }
}

struct HealthBarItem: View {
    let title: String
    let value: Double
    let icon: String

    private var color: Color {
        switch value {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(color)
                            .frame(width: geometry.size.width * (value / 100), height: 8)
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)
            }

            Text("\(Int(value))%")
                .font(.caption)
                .fontWeight(.semibold)
                .frame(width: 40, alignment: .trailing)
        }
    }
}

// MARK: - Vehicle Picker View
struct VehiclePickerView: View {
    @Binding var selectedVehicleId: String
    @Environment(\.dismiss) var dismiss

    // Mock vehicle list - replace with actual data
    let vehicles = [
        ("vehicle-1", "Truck 101"),
        ("vehicle-2", "Van 202"),
        ("vehicle-3", "Sedan 303")
    ]

    var body: some View {
        NavigationView {
            List(vehicles, id: \.0) { vehicle in
                Button(action: {
                    selectedVehicleId = vehicle.0
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: "car.fill")
                            .foregroundColor(.blue)
                        Text(vehicle.1)
                        Spacer()
                        if selectedVehicleId == vehicle.0 {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
            .navigationTitle("Select Vehicle")
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
}

// MARK: - Export Data View
struct ExportDataView: View {
    @ObservedObject var viewModel: TelemetryDashboardViewModel
    @Environment(\.dismiss) var dismiss
    @State private var isExporting = false

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Export Telemetry Data")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Export historical telemetry data to CSV format")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                Button(action: exportData) {
                    if isExporting {
                        ProgressView()
                            .padding()
                    } else {
                        Text("Export to CSV")
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .disabled(isExporting)
                .padding(.horizontal)
            }
            .padding()
            .navigationTitle("Export Data")
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

    private func exportData() {
        isExporting = true
        if let url = viewModel.exportTelemetryCSV() {
            // Share the file
            let activityVC = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootVC = windowScene.windows.first?.rootViewController {
                rootVC.present(activityVC, animated: true)
            }
        }
        isExporting = false
        dismiss()
    }
}

#Preview {
    TelemetryDashboardView()
}
