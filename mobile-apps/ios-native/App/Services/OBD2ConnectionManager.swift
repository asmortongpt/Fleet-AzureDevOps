/**
 * OBD2 Connection Manager
 * Phase 2: Advanced Connection Recovery & Health Monitoring
 *
 * Features:
 * - Exponential backoff retry strategy (1s, 2s, 4s, 8s, 16s)
 * - Real-time connection health monitoring (RSSI, latency, packet loss)
 * - Automatic reconnection on disconnect
 * - Vendor-specific optimizations (ELM327, OBDLink, Veepeak, Vgate)
 * - Device profile caching for faster reconnects
 *
 * Target: Increase connection success from 70% → 90%
 */

import Foundation
import CoreBluetooth
import Combine

@MainActor
class OBD2ConnectionManager: NSObject, ObservableObject {

    // MARK: - Published Properties

    @Published var connectionState: ConnectionState = .disconnected
    @Published var connectionHealth: ConnectionHealth?
    @Published var currentAttempt: Int = 0
    @Published var retryDelay: TimeInterval = 0

    // MARK: - Types

    enum ConnectionState: Equatable {
        case disconnected
        case connecting(attempt: Int)
        case connected
        case failed(reason: String)
        case retrying(attempt: Int, nextDelay: TimeInterval)
    }

    struct ConnectionHealth: Equatable {
        var rssi: Int                    // Signal strength (-30 to -100 dBm)
        var latency: TimeInterval        // Round-trip time in milliseconds
        var packetLoss: Double           // Percentage (0.0 to 1.0)
        var isHealthy: Bool {
            rssi > -85 && latency < 100 && packetLoss < 0.05
        }
        var qualityScore: Double {
            let rssiScore = max(0, min(1, Double(rssi + 100) / 70.0))
            let latencyScore = max(0, min(1, 1.0 - (latency / 200.0)))
            let lossScore = 1.0 - packetLoss
            return (rssiScore + latencyScore + lossScore) / 3.0
        }
    }

    struct DeviceProfile: Codable {
        let deviceIdentifier: String
        let vendorType: VendorType
        let lastSuccessfulConfig: ConnectionConfig
        let averageConnectionTime: TimeInterval
        let successRate: Double
        let lastConnectedAt: Date
    }

    struct ConnectionConfig: Codable {
        let scanTimeout: TimeInterval
        let connectionTimeout: TimeInterval
        let initializationCommands: [String]
        let responseTimeout: TimeInterval
    }

    enum VendorType: String, Codable {
        case elm327 = "ELM327"
        case obdlink = "OBDLink"
        case veepeak = "Veepeak"
        case vgate = "Vgate"
        case generic = "Generic"

        var optimizedConfig: ConnectionConfig {
            switch self {
            case .elm327:
                return ConnectionConfig(
                    scanTimeout: 10.0,
                    connectionTimeout: 5.0,
                    initializationCommands: ["ATZ", "ATE0", "ATL0", "ATS0", "ATH1", "ATSP0"],
                    responseTimeout: 2.0
                )
            case .obdlink:
                return ConnectionConfig(
                    scanTimeout: 8.0,
                    connectionTimeout: 4.0,
                    initializationCommands: ["ATZ", "ATE0", "ATL0", "ATSTFF", "ATSP0"],
                    responseTimeout: 1.5
                )
            case .veepeak:
                return ConnectionConfig(
                    scanTimeout: 10.0,
                    connectionTimeout: 6.0,
                    initializationCommands: ["ATZ", "ATE0", "ATL0", "ATS0", "ATSP0"],
                    responseTimeout: 2.5
                )
            case .vgate:
                return ConnectionConfig(
                    scanTimeout: 12.0,
                    connectionTimeout: 5.0,
                    initializationCommands: ["ATZ", "ATE0", "ATL0", "ATH1", "ATSP0"],
                    responseTimeout: 2.0
                )
            case .generic:
                return ConnectionConfig(
                    scanTimeout: 15.0,
                    connectionTimeout: 8.0,
                    initializationCommands: ["ATZ", "ATE0", "ATSP0"],
                    responseTimeout: 3.0
                )
            }
        }

        static func detect(from deviceName: String) -> VendorType {
            let name = deviceName.lowercased()
            if name.contains("obdlink") || name.contains("scantool") {
                return .obdlink
            } else if name.contains("veepeak") {
                return .veepeak
            } else if name.contains("vgate") || name.contains("icar") {
                return .vgate
            } else if name.contains("elm") || name.contains("obd") {
                return .elm327
            }
            return .generic
        }
    }

    // MARK: - Private Properties

    private var centralManager: CBCentralManager!
    private var connectedPeripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var notifyCharacteristic: CBCharacteristic?

    private let maxRetryAttempts = 5
    private let retryDelays: [TimeInterval] = [1.0, 2.0, 4.0, 8.0, 16.0] // Exponential backoff

    private var healthMonitorTimer: Timer?
    private var lastCommandTime: Date?
    private var commandResponseTimes: [TimeInterval] = []
    private var packetsSent: Int = 0
    private var packetsReceived: Int = 0

    private var reconnectionTask: Task<Void, Never>?

    // MARK: - Initialization

    override init() {
        super.init()
        self.centralManager = CBCentralManager(delegate: self, queue: .main)
    }

    deinit {
        healthMonitorTimer?.invalidate()
        reconnectionTask?.cancel()
    }

    // MARK: - Public API

    /// Connect to OBD2 device with advanced retry logic
    func connect(to peripheral: CBPeripheral, timeout: TimeInterval = 30.0) async throws {
        connectionState = .connecting(attempt: 1)
        currentAttempt = 1

        // Check for cached device profile
        let vendorType = VendorType.detect(from: peripheral.name ?? "")
        let config = getDeviceProfile(for: peripheral.identifier.uuidString)?.lastSuccessfulConfig
                     ?? vendorType.optimizedConfig

        // Attempt connection with retry logic
        for attempt in 1...maxRetryAttempts {
            do {
                try await attemptConnection(to: peripheral, config: config, timeout: timeout)

                // Connection successful
                connectionState = .connected
                currentAttempt = 0

                // Cache successful profile
                cacheDeviceProfile(peripheral: peripheral, vendorType: vendorType, config: config)

                // Start health monitoring
                startHealthMonitoring()

                return

            } catch {
                currentAttempt = attempt

                if attempt < maxRetryAttempts {
                    let delay = retryDelays[attempt - 1]
                    retryDelay = delay
                    connectionState = .retrying(attempt: attempt, nextDelay: delay)

                    print("⚠️ Connection attempt \(attempt) failed: \(error.localizedDescription)")
                    print("⏳ Retrying in \(delay) seconds...")

                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                } else {
                    // All attempts failed
                    connectionState = .failed(reason: "Connection failed after \(maxRetryAttempts) attempts")
                    throw OBD2ConnectionError.maxRetriesExceeded
                }
            }
        }
    }

    /// Disconnect from OBD2 device
    func disconnect() {
        healthMonitorTimer?.invalidate()
        reconnectionTask?.cancel()

        if let peripheral = connectedPeripheral {
            centralManager.cancelPeripheralConnection(peripheral)
        }

        connectionState = .disconnected
        connectionHealth = nil
        connectedPeripheral = nil
        writeCharacteristic = nil
        notifyCharacteristic = nil
    }

    /// Send command and measure response time
    func sendCommand(_ command: String) async throws -> String {
        guard let peripheral = connectedPeripheral,
              let characteristic = writeCharacteristic else {
            throw OBD2ConnectionError.notConnected
        }

        let commandData = "\(command)\r".data(using: .utf8)!
        lastCommandTime = Date()
        packetsSent += 1

        peripheral.writeValue(commandData, for: characteristic, type: .withResponse)

        // Wait for response (simplified - actual implementation would use delegate callbacks)
        try await Task.sleep(nanoseconds: 100_000_000) // 100ms

        return "OK" // Placeholder
    }

    // MARK: - Health Monitoring

    private func startHealthMonitoring() {
        healthMonitorTimer?.invalidate()

        healthMonitorTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.updateConnectionHealth()
            }
        }
    }

    private func updateConnectionHealth() async {
        guard let peripheral = connectedPeripheral else { return }

        // Read RSSI
        peripheral.readRSSI()

        // Calculate average latency
        let avgLatency = commandResponseTimes.isEmpty ? 0 :
                         commandResponseTimes.reduce(0, +) / Double(commandResponseTimes.count)

        // Calculate packet loss
        let packetLoss = packetsSent > 0 ?
                         Double(packetsSent - packetsReceived) / Double(packetsSent) : 0

        // Update health
        if let rssi = peripheral.rssi?.intValue {
            connectionHealth = ConnectionHealth(
                rssi: rssi,
                latency: avgLatency,
                packetLoss: packetLoss
            )

            // Check if connection is degraded
            if let health = connectionHealth, !health.isHealthy {
                print("⚠️ Connection health degraded:")
                print("  - RSSI: \(health.rssi) dBm")
                print("  - Latency: \(health.latency) ms")
                print("  - Packet Loss: \(health.packetLoss * 100)%")
                print("  - Quality Score: \(Int(health.qualityScore * 100))%")

                // Attempt automatic recovery if severely degraded
                if health.qualityScore < 0.3 {
                    print("🔄 Quality too low, attempting automatic reconnection...")
                    await attemptAutomaticReconnection()
                }
            }
        }
    }

    private func attemptAutomaticReconnection() async {
        guard let peripheral = connectedPeripheral else { return }

        // Cancel any existing reconnection
        reconnectionTask?.cancel()

        reconnectionTask = Task {
            disconnect()
            try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 second pause
            try? await connect(to: peripheral)
        }
    }

    // MARK: - Private Helpers

    private func attemptConnection(to peripheral: CBPeripheral, config: ConnectionConfig, timeout: TimeInterval) async throws {
        // Store peripheral reference
        connectedPeripheral = peripheral
        peripheral.delegate = self

        // Connect to peripheral
        centralManager.connect(peripheral, options: nil)

        // Wait for connection with timeout
        let startTime = Date()
        while peripheral.state != .connected {
            if Date().timeIntervalSince(startTime) > timeout {
                throw OBD2ConnectionError.connectionTimeout
            }
            try await Task.sleep(nanoseconds: 100_000_000) // Check every 100ms
        }

        // Discover services
        peripheral.discoverServices([CBUUID(string: "FFE0")]) // Common OBD2 service UUID

        try await Task.sleep(nanoseconds: 1_000_000_000) // Wait for service discovery

        // Discover characteristics
        if let service = peripheral.services?.first {
            peripheral.discoverCharacteristics(nil, for: service)
            try await Task.sleep(nanoseconds: 1_000_000_000) // Wait for characteristic discovery
        }

        // Verify characteristics found
        guard writeCharacteristic != nil && notifyCharacteristic != nil else {
            throw OBD2ConnectionError.characteristicsNotFound
        }

        // Initialize with vendor-specific commands
        for command in config.initializationCommands {
            _ = try await sendCommand(command)
            try await Task.sleep(nanoseconds: 500_000_000) // 500ms between commands
        }
    }

    // MARK: - Device Profile Caching

    private func getDeviceProfile(for identifier: String) -> DeviceProfile? {
        guard let data = UserDefaults.standard.data(forKey: "obd2_profile_\(identifier)"),
              let profile = try? JSONDecoder().decode(DeviceProfile.self, from: data) else {
            return nil
        }
        return profile
    }

    private func cacheDeviceProfile(peripheral: CBPeripheral, vendorType: VendorType, config: ConnectionConfig) {
        let profile = DeviceProfile(
            deviceIdentifier: peripheral.identifier.uuidString,
            vendorType: vendorType,
            lastSuccessfulConfig: config,
            averageConnectionTime: 5.0, // Would be calculated from actual attempts
            successRate: 1.0, // Would be calculated from history
            lastConnectedAt: Date()
        )

        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: "obd2_profile_\(peripheral.identifier.uuidString)")
        }
    }
}

// MARK: - CBCentralManagerDelegate

extension OBD2ConnectionManager: CBCentralManagerDelegate {

    nonisolated func centralManagerDidUpdateState(_ central: CBCentralManager) {
        Task { @MainActor in
            print("📡 Bluetooth state: \(central.state.rawValue)")
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        Task { @MainActor in
            print("✅ Connected to \(peripheral.name ?? "Unknown")")
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        Task { @MainActor in
            if let error = error {
                print("⚠️ Disconnected with error: \(error.localizedDescription)")
            } else {
                print("📴 Disconnected from \(peripheral.name ?? "Unknown")")
            }

            // Attempt automatic reconnection if not intentional
            if connectionState != .disconnected {
                await attemptAutomaticReconnection()
            }
        }
    }

    nonisolated func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        Task { @MainActor in
            print("❌ Failed to connect: \(error?.localizedDescription ?? "Unknown error")")
        }
    }
}

// MARK: - CBPeripheralDelegate

extension OBD2ConnectionManager: CBPeripheralDelegate {

    nonisolated func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        Task { @MainActor in
            if let error = error {
                print("❌ Service discovery error: \(error.localizedDescription)")
                return
            }
            print("🔍 Discovered \(peripheral.services?.count ?? 0) services")
        }
    }

    nonisolated func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        Task { @MainActor in
            if let error = error {
                print("❌ Characteristic discovery error: \(error.localizedDescription)")
                return
            }

            // Find write and notify characteristics
            for characteristic in service.characteristics ?? [] {
                if characteristic.properties.contains(.write) || characteristic.properties.contains(.writeWithoutResponse) {
                    writeCharacteristic = characteristic
                    print("✍️ Found write characteristic")
                }
                if characteristic.properties.contains(.notify) {
                    notifyCharacteristic = characteristic
                    peripheral.setNotifyValue(true, for: characteristic)
                    print("🔔 Found notify characteristic")
                }
            }
        }
    }

    nonisolated func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        Task { @MainActor in
            packetsReceived += 1

            if let lastTime = lastCommandTime {
                let responseTime = Date().timeIntervalSince(lastTime) * 1000 // Convert to ms
                commandResponseTimes.append(responseTime)

                // Keep only last 20 measurements
                if commandResponseTimes.count > 20 {
                    commandResponseTimes.removeFirst()
                }
            }
        }
    }

    nonisolated func peripheralDidUpdateRSSI(_ peripheral: CBPeripheral, error: Error?) {
        Task { @MainActor in
            if let error = error {
                print("⚠️ RSSI read error: \(error.localizedDescription)")
            }
        }
    }
}

// MARK: - Errors

enum OBD2ConnectionError: LocalizedError {
    case notConnected
    case connectionTimeout
    case characteristicsNotFound
    case maxRetriesExceeded
    case initializationFailed

    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "OBD2 device is not connected"
        case .connectionTimeout:
            return "Connection attempt timed out"
        case .characteristicsNotFound:
            return "Required Bluetooth characteristics not found"
        case .maxRetriesExceeded:
            return "Maximum connection retry attempts exceeded"
        case .initializationFailed:
            return "OBD2 device initialization failed"
        }
    }
}
