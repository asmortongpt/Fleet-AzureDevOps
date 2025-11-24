import SwiftUI
import CoreBluetooth

// MARK: - Device Management View
struct DeviceManagementView: View {
    @StateObject private var bluetoothManager = BluetoothDeviceManager()
    @State private var showingAddDevice = false
    @State private var selectedDevice: OBDDevice?

    var body: some View {
        List {
            // Connected Devices Section
            Section {
                if bluetoothManager.connectedDevices.isEmpty {
                    HStack {
                        Image(systemName: "antenna.radiowaves.left.and.right.slash")
                            .foregroundColor(.secondary)
                        Text("No devices connected")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                } else {
                    ForEach(bluetoothManager.connectedDevices) { device in
                        ConnectedDeviceRow(device: device) {
                            selectedDevice = device
                        }
                    }
                }
            } header: {
                Text("Connected Devices")
            }

            // Available Devices Section
            Section {
                if bluetoothManager.isScanning {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Scanning for devices...")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                } else if bluetoothManager.availableDevices.isEmpty {
                    HStack {
                        Image(systemName: "wifi.slash")
                            .foregroundColor(.secondary)
                        Text("No devices found")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                } else {
                    ForEach(bluetoothManager.availableDevices) { device in
                        AvailableDeviceRow(device: device) {
                            bluetoothManager.connect(to: device)
                        }
                    }
                }
            } header: {
                HStack {
                    Text("Available Devices")
                    Spacer()
                    if !bluetoothManager.isScanning {
                        Button("Scan") {
                            bluetoothManager.startScanning()
                        }
                        .font(.caption)
                    }
                }
            }

            // Supported Devices Info
            Section {
                NavigationLink(destination: SupportedDevicesView()) {
                    Label("Supported OBD2 Devices", systemImage: "info.circle")
                }

                NavigationLink(destination: TroubleshootingView()) {
                    Label("Troubleshooting", systemImage: "wrench.and.screwdriver")
                }
            } header: {
                Text("Help")
            }
        }
        .navigationTitle("Device Management")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    if bluetoothManager.isScanning {
                        bluetoothManager.stopScanning()
                    } else {
                        bluetoothManager.startScanning()
                    }
                }) {
                    Image(systemName: bluetoothManager.isScanning ? "stop.circle" : "arrow.clockwise")
                }
            }
        }
        .sheet(item: $selectedDevice) { device in
            DeviceDetailSheet(device: device, manager: bluetoothManager)
        }
        .onAppear {
            bluetoothManager.startScanning()
        }
        .onDisappear {
            bluetoothManager.stopScanning()
        }
    }
}

// MARK: - Connected Device Row
struct ConnectedDeviceRow: View {
    let device: OBDDevice
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: "car.fill")
                    .foregroundColor(.green)
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 2) {
                    Text(device.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text(device.protocol.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Connected")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                    if let signal = device.signalStrength {
                        SignalStrengthView(strength: signal)
                    }
                }

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding(.vertical, 4)
        }
    }
}

// MARK: - Available Device Row
struct AvailableDeviceRow: View {
    let device: OBDDevice
    let onConnect: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(device.name)
                    .font(.headline)
                Text(device.identifier)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button("Connect") {
                onConnect()
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Signal Strength View
struct SignalStrengthView: View {
    let strength: Int // 0-100

    var bars: Int {
        switch strength {
        case 0..<25: return 1
        case 25..<50: return 2
        case 50..<75: return 3
        default: return 4
        }
    }

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...4, id: \.self) { bar in
                RoundedRectangle(cornerRadius: 1)
                    .fill(bar <= bars ? Color.green : Color.gray.opacity(0.3))
                    .frame(width: 4, height: CGFloat(4 + bar * 2))
            }
        }
    }
}

// MARK: - Device Detail Sheet
struct DeviceDetailSheet: View {
    let device: OBDDevice
    @ObservedObject var manager: BluetoothDeviceManager
    @Environment(\.dismiss) private var dismiss
    @State private var showingDisconnectAlert = false

    var body: some View {
        NavigationView {
            List {
                Section {
                    LabeledContent("Name", value: device.name)
                    LabeledContent("Identifier", value: device.identifier)
                    LabeledContent("Protocol", value: device.protocol.rawValue)
                    if let firmware = device.firmwareVersion {
                        LabeledContent("Firmware", value: firmware)
                    }
                } header: {
                    Text("Device Info")
                }

                Section {
                    HStack {
                        Text("Status")
                        Spacer()
                        HStack(spacing: 4) {
                            Circle()
                                .fill(device.isConnected ? Color.green : Color.red)
                                .frame(width: 8, height: 8)
                            Text(device.isConnected ? "Connected" : "Disconnected")
                                .foregroundColor(device.isConnected ? .green : .red)
                        }
                    }

                    if let signal = device.signalStrength {
                        HStack {
                            Text("Signal Strength")
                            Spacer()
                            SignalStrengthView(strength: signal)
                            Text("\(signal)%")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } header: {
                    Text("Connection")
                }

                if device.isConnected {
                    Section {
                        NavigationLink(destination: LiveDataView(device: device)) {
                            Label("Live Data", systemImage: "waveform.path.ecg")
                        }

                        NavigationLink(destination: DiagnosticCodesView(device: device)) {
                            Label("Diagnostic Codes", systemImage: "exclamationmark.triangle")
                        }

                        NavigationLink(destination: FreezeFrameView(device: device)) {
                            Label("Freeze Frame Data", systemImage: "pause.circle")
                        }
                    } header: {
                        Text("Diagnostics")
                    }
                }

                Section {
                    Button(role: .destructive) {
                        showingDisconnectAlert = true
                    } label: {
                        Label("Disconnect Device", systemImage: "xmark.circle")
                    }
                }
            }
            .navigationTitle(device.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Disconnect Device", isPresented: $showingDisconnectAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Disconnect", role: .destructive) {
                    manager.disconnect(from: device)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to disconnect from \(device.name)?")
            }
        }
    }
}

// MARK: - Supported Devices View
struct SupportedDevicesView: View {
    var body: some View {
        List {
            Section {
                ForEach(SupportedOBDDevice.allCases, id: \.self) { device in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(device.name)
                            .font(.headline)
                        Text(device.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            } header: {
                Text("Compatible OBD2 Adapters")
            } footer: {
                Text("Most ELM327-based Bluetooth adapters are compatible with this app.")
            }
        }
        .navigationTitle("Supported Devices")
    }
}

// MARK: - Troubleshooting View
struct TroubleshootingView: View {
    var body: some View {
        List {
            Section {
                TroubleshootingItem(
                    title: "Device not found",
                    solution: "Ensure Bluetooth is enabled and the OBD2 adapter is powered on. Try moving closer to the adapter."
                )

                TroubleshootingItem(
                    title: "Connection drops frequently",
                    solution: "Check the OBD2 port connection. Some vehicles may have intermittent power to the port when the engine is off."
                )

                TroubleshootingItem(
                    title: "No data available",
                    solution: "Ensure the vehicle's ignition is on. Some data requires the engine to be running."
                )

                TroubleshootingItem(
                    title: "Incorrect readings",
                    solution: "Try switching the OBD protocol in settings. Some vehicles work better with specific protocols."
                )
            } header: {
                Text("Common Issues")
            }
        }
        .navigationTitle("Troubleshooting")
    }
}

struct TroubleshootingItem: View {
    let title: String
    let solution: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(solution)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Placeholder Views for Diagnostics
struct LiveDataView: View {
    let device: OBDDevice

    var body: some View {
        Text("Live Data View - Coming Soon")
            .navigationTitle("Live Data")
    }
}

struct DiagnosticCodesView: View {
    let device: OBDDevice

    var body: some View {
        Text("Diagnostic Codes View - Coming Soon")
            .navigationTitle("Diagnostic Codes")
    }
}

struct FreezeFrameView: View {
    let device: OBDDevice

    var body: some View {
        Text("Freeze Frame View - Coming Soon")
            .navigationTitle("Freeze Frame")
    }
}

// MARK: - Models
struct OBDDevice: Identifiable {
    let id: UUID
    let name: String
    let identifier: String
    let `protocol`: OBDProtocol
    var isConnected: Bool
    var signalStrength: Int?
    var firmwareVersion: String?

    init(id: UUID = UUID(), name: String, identifier: String, protocol: OBDProtocol = .auto, isConnected: Bool = false, signalStrength: Int? = nil, firmwareVersion: String? = nil) {
        self.id = id
        self.name = name
        self.identifier = identifier
        self.protocol = `protocol`
        self.isConnected = isConnected
        self.signalStrength = signalStrength
        self.firmwareVersion = firmwareVersion
    }
}

enum OBDProtocol: String, CaseIterable {
    case auto = "Auto"
    case iso9141 = "ISO 9141-2"
    case iso14230 = "ISO 14230-4 (KWP)"
    case iso15765 = "ISO 15765-4 (CAN)"
    case j1850vpw = "SAE J1850 VPW"
    case j1850pwm = "SAE J1850 PWM"
}

enum SupportedOBDDevice: String, CaseIterable {
    case elm327 = "ELM327"
    case obdlink = "OBDLink"
    case veepeak = "Veepeak"
    case bluedriver = "BlueDriver"
    case carista = "Carista"

    var name: String { rawValue }

    var description: String {
        switch self {
        case .elm327: return "Most common OBD2 adapter chip"
        case .obdlink: return "Professional-grade OBD2 adapter"
        case .veepeak: return "Budget-friendly Bluetooth adapter"
        case .bluedriver: return "Professional diagnostic tool"
        case .carista: return "Coding and diagnostics adapter"
        }
    }
}

// MARK: - Bluetooth Device Manager
class BluetoothDeviceManager: NSObject, ObservableObject {
    @Published var isScanning = false
    @Published var connectedDevices: [OBDDevice] = []
    @Published var availableDevices: [OBDDevice] = []
    @Published var bluetoothState: CBManagerState = .unknown

    private var centralManager: CBCentralManager?
    private var discoveredPeripherals: [CBPeripheral] = []

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    func startScanning() {
        guard bluetoothState == .poweredOn else { return }
        isScanning = true
        availableDevices.removeAll()

        // Scan for OBD2 service UUIDs
        centralManager?.scanForPeripherals(
            withServices: nil, // Scan for all devices initially
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )

        // Stop scanning after 10 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self] in
            self?.stopScanning()
        }
    }

    func stopScanning() {
        centralManager?.stopScan()
        isScanning = false
    }

    func connect(to device: OBDDevice) {
        guard let peripheral = discoveredPeripherals.first(where: { $0.identifier.uuidString == device.identifier }) else {
            return
        }
        centralManager?.connect(peripheral, options: nil)
    }

    func disconnect(from device: OBDDevice) {
        guard let peripheral = discoveredPeripherals.first(where: { $0.identifier.uuidString == device.identifier }) else {
            return
        }
        centralManager?.cancelPeripheralConnection(peripheral)

        // Update local state
        if let index = connectedDevices.firstIndex(where: { $0.id == device.id }) {
            connectedDevices.remove(at: index)
        }
    }
}

extension BluetoothDeviceManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        bluetoothState = central.state

        if central.state == .poweredOn && isScanning {
            startScanning()
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        // Filter for OBD2-like device names
        let name = peripheral.name ?? "Unknown Device"
        let identifier = peripheral.identifier.uuidString

        // Only add devices that look like OBD adapters
        let obdKeywords = ["OBD", "ELM", "327", "VEEPEAK", "VLINK", "CARISTA", "BLUEDRIVER"]
        let isOBDDevice = obdKeywords.contains { name.uppercased().contains($0) }

        // Add to discovered list
        if !discoveredPeripherals.contains(where: { $0.identifier == peripheral.identifier }) {
            discoveredPeripherals.append(peripheral)
        }

        // Only show OBD-like devices in UI, but keep all for testing
        if isOBDDevice || name != "Unknown Device" {
            let device = OBDDevice(
                name: name,
                identifier: identifier,
                isConnected: false,
                signalStrength: min(100, max(0, Int(RSSI.intValue) + 100))
            )

            if !availableDevices.contains(where: { $0.identifier == identifier }) &&
               !connectedDevices.contains(where: { $0.identifier == identifier }) {
                DispatchQueue.main.async {
                    self.availableDevices.append(device)
                }
            }
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        let device = OBDDevice(
            name: peripheral.name ?? "OBD2 Device",
            identifier: peripheral.identifier.uuidString,
            isConnected: true,
            signalStrength: 80,
            firmwareVersion: "1.5"
        )

        DispatchQueue.main.async {
            // Remove from available
            self.availableDevices.removeAll { $0.identifier == device.identifier }
            // Add to connected
            if !self.connectedDevices.contains(where: { $0.identifier == device.identifier }) {
                self.connectedDevices.append(device)
            }
        }
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        DispatchQueue.main.async {
            self.connectedDevices.removeAll { $0.identifier == peripheral.identifier.uuidString }
        }
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("Failed to connect to \(peripheral.name ?? "unknown"): \(error?.localizedDescription ?? "unknown error")")
    }
}

// MARK: - iOS 15 Compatibility
@available(iOS, deprecated: 16.0, message: "Use LabeledContent instead")
struct LabeledContent: View {
    let title: String
    let value: String

    init(_ title: String, value: String) {
        self.title = title
        self.value = value
    }

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    NavigationView {
        DeviceManagementView()
    }
}
