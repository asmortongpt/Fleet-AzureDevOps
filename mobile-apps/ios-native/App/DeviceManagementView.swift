//
//  DeviceManagementView.swift
//  DCF Fleet Management
//
//  Comprehensive device management for OBD2, Bluetooth sensors, and hardware
//

import SwiftUI
import CoreBluetooth
import CoreLocation

// MARK: - Device Management View
struct DeviceManagementView: View {
    @StateObject private var viewModel = DeviceManagementViewModel()
    @State private var showingAddDevice = false
    @State private var selectedDeviceType: DeviceType = .obd2

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Connection Status Overview
                ConnectionOverviewCard(viewModel: viewModel)
                    .padding(.horizontal)

                // Quick Actions
                QuickActionsSection(viewModel: viewModel)
                    .padding(.horizontal)

                // Connected Devices
                ConnectedDevicesSection(viewModel: viewModel)
                    .padding(.horizontal)

                // Available Devices
                if viewModel.isScanning || !viewModel.availableDevices.isEmpty {
                    AvailableDevicesSection(viewModel: viewModel)
                        .padding(.horizontal)
                }

                // Trip Data Section
                TripDataIntegrationSection(viewModel: viewModel)
                    .padding(.horizontal)

                // Device Settings
                DeviceSettingsSection(viewModel: viewModel)
                    .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationTitle("Device Management")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddDevice = true }) {
                    Image(systemName: "plus.circle.fill")
                }
            }
        }
        .sheet(isPresented: $showingAddDevice) {
            AddDeviceSheet(viewModel: viewModel, selectedType: $selectedDeviceType)
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
        .onAppear {
            viewModel.loadSavedDevices()
        }
    }
}

// MARK: - Connection Overview Card
struct ConnectionOverviewCard: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Connection Status")
                        .font(.headline)
                    Text(viewModel.overallStatus)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                statusIndicator
            }

            Divider()

            HStack(spacing: 20) {
                StatusItem(
                    icon: "antenna.radiowaves.left.and.right",
                    label: "OBD2",
                    status: viewModel.obd2Connected ? "Connected" : "Disconnected",
                    isActive: viewModel.obd2Connected
                )

                StatusItem(
                    icon: "location.fill",
                    label: "GPS",
                    status: viewModel.gpsEnabled ? "Active" : "Inactive",
                    isActive: viewModel.gpsEnabled
                )

                StatusItem(
                    icon: "wifi",
                    label: "Bluetooth",
                    status: viewModel.bluetoothEnabled ? "On" : "Off",
                    isActive: viewModel.bluetoothEnabled
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private var statusIndicator: some View {
        ZStack {
            Circle()
                .fill(viewModel.obd2Connected ? Color.green.opacity(0.2) : Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)

            Image(systemName: viewModel.obd2Connected ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.title2)
                .foregroundColor(viewModel.obd2Connected ? .green : .gray)
        }
    }
}

// MARK: - Status Item
struct StatusItem: View {
    let icon: String
    let label: String
    let status: String
    let isActive: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(isActive ? .green : .gray)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(status)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(isActive ? .green : .secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Quick Actions Section
struct QuickActionsSection: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "magnifyingglass",
                    title: "Scan",
                    color: .blue,
                    isLoading: viewModel.isScanning
                ) {
                    viewModel.startScan()
                }

                QuickActionButton(
                    icon: "arrow.triangle.2.circlepath",
                    title: "Refresh",
                    color: .green
                ) {
                    viewModel.refreshDevices()
                }

                QuickActionButton(
                    icon: "xmark.circle",
                    title: "Disconnect All",
                    color: .red
                ) {
                    viewModel.disconnectAll()
                }
            }
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: color))
                } else {
                    Image(systemName: icon)
                        .font(.title2)
                }
                Text(title)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(10)
        }
        .disabled(isLoading)
    }
}

// MARK: - Connected Devices Section
struct ConnectedDevicesSection: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Connected Devices")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.connectedDevices.count)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            if viewModel.connectedDevices.isEmpty {
                EmptyDevicesCard()
            } else {
                ForEach(viewModel.connectedDevices) { device in
                    ConnectedDeviceCard(device: device, viewModel: viewModel)
                }
            }
        }
    }
}

// MARK: - Empty Devices Card
struct EmptyDevicesCard: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right.slash")
                .font(.largeTitle)
                .foregroundColor(.gray)

            Text("No Devices Connected")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Tap 'Scan' to search for nearby OBD2 adapters")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Connected Device Card
struct ConnectedDeviceCard: View {
    let device: FleetDevice
    @ObservedObject var viewModel: DeviceManagementViewModel
    @State private var showingDetails = false

    var body: some View {
        VStack(spacing: 0) {
            Button(action: { showingDetails.toggle() }) {
                HStack {
                    deviceIcon

                    VStack(alignment: .leading, spacing: 4) {
                        Text(device.name)
                            .font(.headline)
                        HStack(spacing: 4) {
                            Circle()
                                .fill(device.isConnected ? Color.green : Color.gray)
                                .frame(width: 6, height: 6)
                            Text(device.statusText)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        if let signalStrength = device.signalStrength {
                            SignalStrengthView(strength: signalStrength)
                        }
                        if let battery = device.batteryLevel {
                            BatteryLevelView(level: battery)
                        }
                    }

                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .rotationEffect(.degrees(showingDetails ? 90 : 0))
                }
                .padding()
            }
            .buttonStyle(PlainButtonStyle())

            if showingDetails {
                DeviceDetailsExpanded(device: device, viewModel: viewModel)
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    private var deviceIcon: some View {
        ZStack {
            Circle()
                .fill(device.type.color.opacity(0.2))
                .frame(width: 44, height: 44)

            Image(systemName: device.type.icon)
                .font(.title3)
                .foregroundColor(device.type.color)
        }
    }
}

// MARK: - Signal Strength View
struct SignalStrengthView: View {
    let strength: Int // 0-100

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<4) { i in
                Rectangle()
                    .fill(i < bars ? Color.green : Color.gray.opacity(0.3))
                    .frame(width: 3, height: CGFloat(4 + i * 3))
            }
        }
    }

    private var bars: Int {
        if strength > 75 { return 4 }
        if strength > 50 { return 3 }
        if strength > 25 { return 2 }
        if strength > 0 { return 1 }
        return 0
    }
}

// MARK: - Battery Level View
struct BatteryLevelView: View {
    let level: Int

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: batteryIcon)
                .font(.caption)
                .foregroundColor(batteryColor)
            Text("\(level)%")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }

    private var batteryIcon: String {
        if level > 75 { return "battery.100" }
        if level > 50 { return "battery.75" }
        if level > 25 { return "battery.50" }
        return "battery.25"
    }

    private var batteryColor: Color {
        if level > 50 { return .green }
        if level > 25 { return .orange }
        return .red
    }
}

// MARK: - Device Details Expanded
struct DeviceDetailsExpanded: View {
    let device: FleetDevice
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(spacing: 12) {
            Divider()

            // Live Data (for OBD2)
            if device.type == .obd2, let obd2Data = viewModel.currentOBD2Data {
                LiveOBD2DataSection(data: obd2Data)
            }

            // Device Info
            DeviceInfoRow(label: "Type", value: device.type.displayName)
            DeviceInfoRow(label: "ID", value: device.id.uuidString.prefix(8).description)
            if let lastConnected = device.lastConnected {
                DeviceInfoRow(label: "Last Connected", value: formatDate(lastConnected))
            }

            // Actions
            HStack(spacing: 12) {
                Button(action: { viewModel.reconnect(device: device) }) {
                    Label("Reconnect", systemImage: "arrow.triangle.2.circlepath")
                        .font(.caption)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                }

                Button(action: { viewModel.disconnect(device: device) }) {
                    Label("Disconnect", systemImage: "xmark.circle")
                        .font(.caption)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Device Info Row
struct DeviceInfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Live OBD2 Data Section
struct LiveOBD2DataSection: View {
    let data: OBD2VehicleData

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Live Vehicle Data")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                LiveDataItem(icon: "gauge", label: "RPM", value: data.engineRPM.map { "\($0)" } ?? "--")
                LiveDataItem(icon: "speedometer", label: "Speed", value: data.vehicleSpeed.map { "\($0) km/h" } ?? "--")
                LiveDataItem(icon: "fuelpump", label: "Fuel", value: data.fuelLevel.map { "\($0)%" } ?? "--")
                LiveDataItem(icon: "thermometer", label: "Temp", value: data.coolantTemp.map { "\($0)\u{00B0}C" } ?? "--")
            }
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Live Data Item
struct LiveDataItem: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundColor(.green)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Available Devices Section
struct AvailableDevicesSection: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Available Devices")
                    .font(.headline)

                if viewModel.isScanning {
                    ProgressView()
                        .scaleEffect(0.8)
                }

                Spacer()

                if viewModel.isScanning {
                    Button("Stop") {
                        viewModel.stopScan()
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
            }

            ForEach(viewModel.availableDevices) { device in
                AvailableDeviceRow(device: device) {
                    viewModel.connectToDevice(device)
                }
            }
        }
    }
}

// MARK: - Available Device Row
struct AvailableDeviceRow: View {
    let device: FleetDevice
    let onConnect: () -> Void

    var body: some View {
        HStack {
            Image(systemName: device.type.icon)
                .font(.title3)
                .foregroundColor(device.type.color)
                .frame(width: 30)

            VStack(alignment: .leading) {
                Text(device.name)
                    .font(.subheadline)
                Text(device.type.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if let signal = device.signalStrength {
                SignalStrengthView(strength: signal)
            }

            Button("Connect") {
                onConnect()
            }
            .font(.caption)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(6)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Trip Data Integration Section
struct TripDataIntegrationSection: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Trip Data Integration")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: TripDataSettingsView(viewModel: viewModel)) {
                    Image(systemName: "gear")
                        .foregroundColor(.blue)
                }
            }

            VStack(spacing: 8) {
                IntegrationRow(
                    icon: "location.fill",
                    title: "Location Tracking",
                    subtitle: "GPS coordinates & routes",
                    isEnabled: $viewModel.locationTrackingEnabled
                )

                IntegrationRow(
                    icon: "speedometer",
                    title: "Driving Behavior",
                    subtitle: "Speed, acceleration & braking",
                    isEnabled: $viewModel.drivingBehaviorEnabled
                )

                IntegrationRow(
                    icon: "fuelpump.fill",
                    title: "Fuel Monitoring",
                    subtitle: "Consumption & efficiency",
                    isEnabled: $viewModel.fuelMonitoringEnabled
                )

                IntegrationRow(
                    icon: "exclamationmark.triangle.fill",
                    title: "Diagnostic Alerts",
                    subtitle: "Engine codes & warnings",
                    isEnabled: $viewModel.diagnosticAlertsEnabled
                )
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 1)
        }
    }
}

// MARK: - Integration Row
struct IntegrationRow: View {
    let icon: String
    let title: String
    let subtitle: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(isEnabled ? .green : .gray)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isEnabled)
                .labelsHidden()
        }
    }
}

// MARK: - Device Settings Section
struct DeviceSettingsSection: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Settings")
                .font(.headline)

            VStack(spacing: 0) {
                SettingsRow(icon: "arrow.triangle.2.circlepath", title: "Auto-Reconnect", hasToggle: true, isOn: $viewModel.autoReconnectEnabled)
                Divider().padding(.leading, 44)
                SettingsRow(icon: "bell.fill", title: "Connection Alerts", hasToggle: true, isOn: $viewModel.connectionAlertsEnabled)
                Divider().padding(.leading, 44)
                SettingsRow(icon: "icloud.and.arrow.up", title: "Sync to Server", hasToggle: true, isOn: $viewModel.syncToServerEnabled)
                Divider().padding(.leading, 44)

                NavigationLink(destination: BluetoothTroubleshootingView()) {
                    HStack {
                        Image(systemName: "wrench.and.screwdriver")
                            .foregroundColor(.orange)
                            .frame(width: 24)
                        Text("Troubleshooting")
                            .font(.subheadline)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 1)
        }
    }
}

// MARK: - Settings Row
struct SettingsRow: View {
    let icon: String
    let title: String
    var hasToggle: Bool = false
    @Binding var isOn: Bool

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)
            Text(title)
                .font(.subheadline)
            Spacer()
            if hasToggle {
                Toggle("", isOn: $isOn)
                    .labelsHidden()
            }
        }
        .padding()
    }
}

// MARK: - Add Device Sheet
struct AddDeviceSheet: View {
    @ObservedObject var viewModel: DeviceManagementViewModel
    @Binding var selectedType: DeviceType
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Select Device Type")
                    .font(.headline)
                    .padding(.top)

                ForEach(DeviceType.allCases) { type in
                    DeviceTypeCard(type: type, isSelected: selectedType == type) {
                        selectedType = type
                    }
                }

                Button(action: {
                    viewModel.startScan(for: selectedType)
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Start Scanning")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding()

                Spacer()
            }
            .padding()
            .navigationTitle("Add Device")
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

// MARK: - Device Type Card
struct DeviceTypeCard: View {
    let type: DeviceType
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: type.icon)
                    .font(.title2)
                    .foregroundColor(type.color)
                    .frame(width: 40)

                VStack(alignment: .leading) {
                    Text(type.displayName)
                        .font(.headline)
                    Text(type.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Trip Data Settings View
struct TripDataSettingsView: View {
    @ObservedObject var viewModel: DeviceManagementViewModel

    var body: some View {
        Form {
            Section(header: Text("Data Collection")) {
                Toggle("Record Location", isOn: $viewModel.locationTrackingEnabled)
                Toggle("Record Speed", isOn: $viewModel.drivingBehaviorEnabled)
                Toggle("Record Fuel Data", isOn: $viewModel.fuelMonitoringEnabled)
                Toggle("Record Engine Data", isOn: $viewModel.diagnosticAlertsEnabled)
            }

            Section(header: Text("Sync Settings")) {
                Toggle("Auto-sync to Server", isOn: $viewModel.syncToServerEnabled)
                Picker("Sync Frequency", selection: $viewModel.syncFrequency) {
                    Text("Real-time").tag(0)
                    Text("Every 30 seconds").tag(30)
                    Text("Every minute").tag(60)
                    Text("Every 5 minutes").tag(300)
                }
            }

            Section(header: Text("Server Endpoint")) {
                Text(viewModel.serverEndpoint)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .navigationTitle("Trip Data Settings")
    }
}

// MARK: - Bluetooth Troubleshooting View
struct BluetoothTroubleshootingView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                TroubleshootingSection(
                    title: "OBD2 Device Not Found",
                    steps: [
                        "Ensure the OBD2 adapter is plugged into your vehicle's OBD port",
                        "Turn on the vehicle's ignition (engine doesn't need to be running)",
                        "Check that Bluetooth is enabled on your device",
                        "Make sure the adapter's LED is blinking (indicating it's powered)",
                        "Try moving closer to the adapter"
                    ]
                )

                TroubleshootingSection(
                    title: "Connection Keeps Dropping",
                    steps: [
                        "Check if the vehicle's battery is low",
                        "Ensure no other devices are connected to the OBD2 adapter",
                        "Try 'forgetting' the device in Bluetooth settings and re-pairing",
                        "Update the app to the latest version",
                        "Restart the adapter by unplugging and replugging it"
                    ]
                )

                TroubleshootingSection(
                    title: "No Data Being Received",
                    steps: [
                        "Some older vehicles may not support all OBD2 parameters",
                        "Ensure the vehicle supports OBD2 (most cars from 1996+ in the US)",
                        "Try requesting fewer data points at once",
                        "Check if the adapter is ELM327 compatible"
                    ]
                )

                Button(action: {
                    BluetoothPermissionManager.shared.openSettings()
                }) {
                    HStack {
                        Image(systemName: "gear")
                        Text("Open Bluetooth Settings")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .padding()
            }
            .padding()
        }
        .navigationTitle("Troubleshooting")
    }
}

// MARK: - Troubleshooting Section
struct TroubleshootingSection: View {
    let title: String
    let steps: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)

            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(index + 1)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(width: 20, height: 20)
                        .background(Color.blue)
                        .clipShape(Circle())

                    Text(step)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Device Type Enum
enum DeviceType: String, CaseIterable, Identifiable {
    case obd2
    case gps
    case dashcam
    case sensor

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .obd2: return "OBD2 Adapter"
        case .gps: return "GPS Tracker"
        case .dashcam: return "Dash Camera"
        case .sensor: return "Vehicle Sensor"
        }
    }

    var description: String {
        switch self {
        case .obd2: return "ELM327 compatible Bluetooth adapter"
        case .gps: return "External GPS tracking device"
        case .dashcam: return "Connected dash camera"
        case .sensor: return "Tire pressure, temperature sensors"
        }
    }

    var icon: String {
        switch self {
        case .obd2: return "antenna.radiowaves.left.and.right"
        case .gps: return "location.fill"
        case .dashcam: return "video.fill"
        case .sensor: return "sensor.fill"
        }
    }

    var color: Color {
        switch self {
        case .obd2: return .blue
        case .gps: return .green
        case .dashcam: return .orange
        case .sensor: return .purple
        }
    }
}

// MARK: - Fleet Device Model
struct FleetDevice: Identifiable {
    let id: UUID
    var name: String
    var type: DeviceType
    var isConnected: Bool
    var signalStrength: Int?
    var batteryLevel: Int?
    var lastConnected: Date?
    var macAddress: String?

    var statusText: String {
        if isConnected {
            return "Connected"
        } else if let lastConnected = lastConnected {
            let formatter = RelativeDateTimeFormatter()
            return "Last seen \(formatter.localizedString(for: lastConnected, relativeTo: Date()))"
        }
        return "Not connected"
    }
}

// MARK: - Device Management View Model
class DeviceManagementViewModel: ObservableObject {
    @Published var connectedDevices: [FleetDevice] = []
    @Published var availableDevices: [FleetDevice] = []
    @Published var isScanning = false
    @Published var showError = false
    @Published var errorMessage = ""

    // Connection status
    @Published var obd2Connected = false
    @Published var gpsEnabled = true
    @Published var bluetoothEnabled = true

    // Integration settings
    @Published var locationTrackingEnabled = true
    @Published var drivingBehaviorEnabled = true
    @Published var fuelMonitoringEnabled = true
    @Published var diagnosticAlertsEnabled = true

    // Device settings
    @Published var autoReconnectEnabled = true
    @Published var connectionAlertsEnabled = true
    @Published var syncToServerEnabled = true
    @Published var syncFrequency = 30

    // Live data
    @Published var currentOBD2Data: OBD2VehicleData?

    var overallStatus: String {
        if obd2Connected {
            return "OBD2 device connected and streaming data"
        } else if isScanning {
            return "Scanning for devices..."
        } else {
            return "No devices connected"
        }
    }

    var serverEndpoint: String {
        return "https://api.dcffleet.com/v1/telemetry"
    }

    init() {
        setupOBD2Observer()
        checkBluetoothStatus()
    }

    private func setupOBD2Observer() {
        // Observe OBD2 connection state
        OBD2ConnectionManager.shared.$connectionState
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.obd2Connected = state.isActive
                self?.updateConnectedDevices()
            }
            .store(in: &cancellables)
    }

    private var cancellables = Set<AnyCancellable>()

    private func checkBluetoothStatus() {
        bluetoothEnabled = BluetoothPermissionManager.shared.isBluetoothAvailable()
    }

    func loadSavedDevices() {
        // Load previously connected devices from UserDefaults or Core Data
        updateConnectedDevices()
    }

    private func updateConnectedDevices() {
        if obd2Connected, let device = OBD2ConnectionManager.shared.connectedDevice {
            let fleetDevice = FleetDevice(
                id: UUID(),
                name: device.name ?? "OBD2 Adapter",
                type: .obd2,
                isConnected: true,
                signalStrength: 80,
                batteryLevel: nil,
                lastConnected: Date(),
                macAddress: device.identifier.uuidString
            )
            connectedDevices = [fleetDevice]
            currentOBD2Data = OBD2ConnectionManager.shared.currentVehicleData
        } else {
            connectedDevices = []
        }
    }

    func startScan(for type: DeviceType = .obd2) {
        isScanning = true
        availableDevices = []

        if type == .obd2 {
            OBD2ConnectionManager.shared.startScanning()
        }

        // Stop scanning after timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            self?.stopScan()
        }
    }

    func stopScan() {
        isScanning = false
        OBD2ConnectionManager.shared.stopScanning()
    }

    func refreshDevices() {
        updateConnectedDevices()
    }

    func connectToDevice(_ device: FleetDevice) {
        // Implementation would connect via OBD2ConnectionManager
    }

    func disconnect(device: FleetDevice) {
        if device.type == .obd2 {
            OBD2ConnectionManager.shared.disconnect()
        }
    }

    func disconnectAll() {
        OBD2ConnectionManager.shared.disconnect()
        connectedDevices = []
    }

    func reconnect(device: FleetDevice) {
        if device.type == .obd2 {
            OBD2ConnectionManager.shared.startScanning()
        }
    }
}

// MARK: - Import Combine for cancellables
import Combine

// MARK: - Preview
struct DeviceManagementView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DeviceManagementView()
        }
    }
}
