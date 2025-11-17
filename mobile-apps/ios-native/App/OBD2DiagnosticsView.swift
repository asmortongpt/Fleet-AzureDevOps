//
//  OBD2DiagnosticsView.swift
//  DCF Fleet Management
//
//  SwiftUI view for displaying OBD2 vehicle diagnostics and real-time data
//

import SwiftUI
import CoreBluetooth

// MARK: - Main Diagnostics View
struct OBD2DiagnosticsView: View {

    @StateObject private var viewModel = OBD2DiagnosticsViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {

                    // Connection Status Banner
                    ConnectionStatusBanner(state: viewModel.connectionState)
                        .padding(.horizontal)

                    // Connection Controls
                    if viewModel.connectionState != .connected {
                        ConnectionControlsSection(viewModel: viewModel)
                            .padding(.horizontal)
                    }

                    // Real-time Vehicle Data
                    if viewModel.connectionState == .connected {
                        VehicleDataSection(data: viewModel.vehicleData)
                            .padding(.horizontal)

                        // Diagnostic Trouble Codes
                        DiagnosticCodesSection(viewModel: viewModel)
                            .padding(.horizontal)

                        // Connection Statistics
                        StatisticsSection(viewModel: viewModel)
                            .padding(.horizontal)
                    }

                    // Discovered Devices List
                    if viewModel.connectionState == .scanning && !viewModel.discoveredDevices.isEmpty {
                        DiscoveredDevicesSection(
                            devices: viewModel.discoveredDevices,
                            onDeviceSelected: { device in
                                viewModel.connectToDevice(device)
                            }
                        )
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("OBD2 Diagnostics")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { viewModel.refreshData() }) {
                            Label("Refresh Data", systemImage: "arrow.clockwise")
                        }

                        Button(action: { viewModel.requestVIN() }) {
                            Label("Read VIN", systemImage: "barcode")
                        }

                        Button(action: { viewModel.showSettings.toggle() }) {
                            Label("Settings", systemImage: "gear")
                        }

                        if viewModel.connectionState == .connected {
                            Button(role: .destructive, action: { viewModel.disconnect() }) {
                                Label("Disconnect", systemImage: "xmark.circle")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showSettings) {
                OBD2SettingsView(viewModel: viewModel)
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
}

// MARK: - Connection Status Banner
struct ConnectionStatusBanner: View {
    let state: OBD2ConnectionState

    var body: some View {
        HStack {
            statusIcon
            VStack(alignment: .leading, spacing: 4) {
                Text(state.displayName)
                    .font(.headline)
                    .foregroundColor(.white)

                if state.isActive {
                    Text("Real-time data streaming")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.9))
                }
            }
            Spacer()
        }
        .padding()
        .background(backgroundColor)
        .cornerRadius(12)
    }

    private var statusIcon: some View {
        Group {
            switch state {
            case .connected:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.white)
                    .font(.title2)
            case .scanning:
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
            case .connecting, .reconnecting:
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
            case .disconnected:
                Image(systemName: "wifi.slash")
                    .foregroundColor(.white)
                    .font(.title2)
            case .failed:
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.white)
                    .font(.title2)
            }
        }
        .frame(width: 30)
    }

    private var backgroundColor: Color {
        switch state {
        case .connected:
            return Color.green
        case .scanning, .connecting, .reconnecting:
            return Color.blue
        case .disconnected:
            return Color.orange
        case .failed:
            return Color.red
        }
    }
}

// MARK: - Connection Controls Section
struct ConnectionControlsSection: View {
    @ObservedObject var viewModel: OBD2DiagnosticsViewModel

    var body: some View {
        VStack(spacing: 12) {
            Button(action: { viewModel.startScanning() }) {
                HStack {
                    Image(systemName: "magnifyingglass")
                    Text(viewModel.connectionState == .scanning ? "Scanning..." : "Scan for Devices")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(viewModel.connectionState == .scanning)

            if viewModel.connectionState == .scanning {
                Button(action: { viewModel.stopScanning() }) {
                    Text("Stop Scanning")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
        }
    }
}

// MARK: - Vehicle Data Section
struct VehicleDataSection: View {
    let data: OBD2VehicleData

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Real-Time Data")
                .font(.title2)
                .fontWeight(.bold)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                DataCard(
                    title: "RPM",
                    value: data.engineRPM?.description ?? "--",
                    unit: "rpm",
                    icon: "gauge",
                    color: .blue
                )

                DataCard(
                    title: "Speed",
                    value: data.vehicleSpeed?.description ?? "--",
                    unit: "km/h",
                    icon: "speedometer",
                    color: .green
                )

                DataCard(
                    title: "Fuel Level",
                    value: data.fuelLevel?.description ?? "--",
                    unit: "%",
                    icon: "fuelpump",
                    color: .orange
                )

                DataCard(
                    title: "Coolant Temp",
                    value: data.coolantTemp?.description ?? "--",
                    unit: "°C",
                    icon: "thermometer",
                    color: .red
                )

                DataCard(
                    title: "Engine Load",
                    value: data.engineLoad?.description ?? "--",
                    unit: "%",
                    icon: "waveform.path.ecg",
                    color: .purple
                )

                DataCard(
                    title: "Throttle",
                    value: data.throttlePosition?.description ?? "--",
                    unit: "%",
                    icon: "arrow.up.circle",
                    color: .indigo
                )
            }

            // Additional Data (if available)
            if data.engineOilTemp != nil || data.controlModuleVoltage != nil {
                Divider()

                VStack(spacing: 8) {
                    if let oilTemp = data.engineOilTemp {
                        HStack {
                            Image(systemName: "drop.fill")
                            Text("Oil Temperature:")
                            Spacer()
                            Text("\(oilTemp)°C")
                                .fontWeight(.semibold)
                        }
                    }

                    if let voltage = data.controlModuleVoltage {
                        HStack {
                            Image(systemName: "bolt.fill")
                            Text("Battery Voltage:")
                            Spacer()
                            Text(String(format: "%.1fV", voltage))
                                .fontWeight(.semibold)
                        }
                    }

                    if let fuelRate = data.engineFuelRate {
                        HStack {
                            Image(systemName: "fuelpump.fill")
                            Text("Fuel Rate:")
                            Spacer()
                            Text(String(format: "%.1f L/h", fuelRate))
                                .fontWeight(.semibold)
                        }
                    }
                }
                .font(.subheadline)
            }

            // Timestamp
            Text("Updated: \(formattedTimestamp)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private var formattedTimestamp: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        return formatter.string(from: data.timestamp)
    }
}

// MARK: - Data Card
struct DataCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Diagnostic Codes Section
struct DiagnosticCodesSection: View {
    @ObservedObject var viewModel: OBD2DiagnosticsViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Diagnostic Codes")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                Button(action: { viewModel.readDTCs() }) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Refresh")
                    }
                    .font(.caption)
                }
            }

            if viewModel.diagnosticCodes.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("No diagnostic trouble codes found")
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.green.opacity(0.1))
                .cornerRadius(10)
            } else {
                ForEach(viewModel.diagnosticCodes, id: \.code) { dtc in
                    DTCCard(dtc: dtc)
                }

                Button(action: { viewModel.clearDTCs() }) {
                    HStack {
                        Image(systemName: "trash")
                        Text("Clear All Codes")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(10)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// MARK: - DTC Card
struct DTCCard: View {
    let dtc: DiagnosticTroubleCode

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(dtc.code)
                    .font(.headline)
                    .fontWeight(.bold)

                Spacer()

                Text(dtc.severity.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(severityColor.opacity(0.2))
                    .foregroundColor(severityColor)
                    .cornerRadius(6)
            }

            Text(dtc.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(severityColor.opacity(0.05))
        .cornerRadius(10)
    }

    private var severityColor: Color {
        switch dtc.severity {
        case .pending: return .yellow
        case .confirmed: return .red
        case .permanent: return .purple
        }
    }
}

// MARK: - Statistics Section
struct StatisticsSection: View {
    @ObservedObject var viewModel: OBD2DiagnosticsViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Connection Statistics")
                .font(.headline)

            VStack(spacing: 8) {
                StatRow(label: "Device", value: viewModel.connectedDeviceName)
                StatRow(label: "Connection Attempts", value: "\(viewModel.connectionAttempts)")
                StatRow(label: "Successful Connections", value: "\(viewModel.successfulConnections)")
                StatRow(label: "Data Points Received", value: "\(viewModel.totalDataReceived)")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Stat Row
struct StatRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
        .font(.subheadline)
    }
}

// MARK: - Discovered Devices Section
struct DiscoveredDevicesSection: View {
    let devices: [CBPeripheral]
    let onDeviceSelected: (CBPeripheral) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Discovered Devices")
                .font(.title2)
                .fontWeight(.bold)

            ForEach(devices, id: \.identifier) { device in
                Button(action: { onDeviceSelected(device) }) {
                    HStack {
                        Image(systemName: "car.fill")
                            .foregroundColor(.blue)

                        VStack(alignment: .leading) {
                            Text(device.name ?? "Unknown Device")
                                .fontWeight(.semibold)
                            Text(device.identifier.uuidString)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(10)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Settings View
struct OBD2SettingsView: View {
    @ObservedObject var viewModel: OBD2DiagnosticsViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Connection")) {
                    Toggle("Auto-Reconnect", isOn: $viewModel.autoReconnect)
                    Stepper("Max Retries: \(viewModel.maxRetries)", value: $viewModel.maxRetries, in: 1...10)
                    Stepper("Scan Timeout: \(Int(viewModel.scanTimeout))s", value: $viewModel.scanTimeout, in: 5...60, step: 5)
                }

                Section(header: Text("Permissions")) {
                    Button("Check Bluetooth Permission") {
                        viewModel.checkPermissions()
                    }

                    Button("Open Settings") {
                        BluetoothPermissionManager.shared.openSettings()
                    }
                }

                Section(header: Text("Actions")) {
                    Button("Reset Statistics") {
                        viewModel.resetStatistics()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("OBD2 Settings")
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

// MARK: - View Model
class OBD2DiagnosticsViewModel: ObservableObject {

    @Published var connectionState: OBD2ConnectionState = .disconnected
    @Published var vehicleData: OBD2VehicleData = OBD2VehicleData()
    @Published var diagnosticCodes: [DiagnosticTroubleCode] = []
    @Published var discoveredDevices: [CBPeripheral] = []

    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    @Published var showSettings: Bool = false

    @Published var autoReconnect: Bool = true
    @Published var maxRetries: Int = 3
    @Published var scanTimeout: TimeInterval = 15.0

    var connectedDeviceName: String {
        return OBD2ConnectionManager.shared.connectedDevice?.name ?? "None"
    }

    var connectionAttempts: Int {
        return OBD2ConnectionManager.shared.connectionAttempts
    }

    var successfulConnections: Int {
        return OBD2ConnectionManager.shared.successfulConnections
    }

    var totalDataReceived: Int {
        return OBD2ConnectionManager.shared.totalDataReceived
    }

    init() {
        setupConnectionManager()
        checkPermissions()
    }

    private func setupConnectionManager() {
        OBD2ConnectionManager.shared.delegate = self

        // Apply settings
        OBD2ConnectionManager.shared.autoReconnect = autoReconnect
        OBD2ConnectionManager.shared.maxRetries = maxRetries
        OBD2ConnectionManager.shared.scanTimeout = scanTimeout
    }

    func startScanning() {
        discoveredDevices.removeAll()
        OBD2ConnectionManager.shared.startScanning()
    }

    func stopScanning() {
        OBD2ConnectionManager.shared.stopScanning()
    }

    func connectToDevice(_ device: CBPeripheral) {
        OBD2ConnectionManager.shared.connect(to: device)
    }

    func disconnect() {
        OBD2ConnectionManager.shared.disconnect()
        discoveredDevices.removeAll()
    }

    func refreshData() {
        for pid in OBD2DataParser.monitoringPIDs {
            OBD2Manager.shared.requestData(for: pid)
        }
    }

    func readDTCs() {
        OBD2Manager.shared.requestDiagnosticCodes()
    }

    func clearDTCs() {
        OBD2Manager.shared.clearDiagnosticCodes()
        diagnosticCodes.removeAll()
    }

    func requestVIN() {
        OBD2Manager.shared.requestVIN()
    }

    func checkPermissions() {
        BluetoothPermissionManager.shared.requestPermission { [weak self] status in
            DispatchQueue.main.async {
                switch status {
                case .denied, .restricted:
                    self?.showError(message: "Bluetooth permission is required for OBD2 connectivity")
                default:
                    break
                }
            }
        }
    }

    func resetStatistics() {
        OBD2ConnectionManager.shared.resetStatistics()
    }

    private func showError(message: String) {
        errorMessage = message
        showError = true
    }
}

// MARK: - Connection Delegate
extension OBD2DiagnosticsViewModel: OBD2ConnectionDelegate {

    func connectionStateDidChange(_ state: OBD2ConnectionState) {
        DispatchQueue.main.async {
            self.connectionState = state
        }
    }

    func didReceiveVehicleData(_ data: OBD2VehicleData) {
        DispatchQueue.main.async {
            self.vehicleData = data
        }
    }

    func didDiscoverDevice(_ device: CBPeripheral, rssi: NSNumber) {
        DispatchQueue.main.async {
            if !self.discoveredDevices.contains(where: { $0.identifier == device.identifier }) {
                self.discoveredDevices.append(device)
            }
        }
    }

    func didFailWithError(_ error: OBD2ConnectionError) {
        DispatchQueue.main.async {
            self.showError(message: error.localizedDescription)
        }
    }
}

// MARK: - Preview
struct OBD2DiagnosticsView_Previews: PreviewProvider {
    static var previews: some View {
        OBD2DiagnosticsView()
    }
}
