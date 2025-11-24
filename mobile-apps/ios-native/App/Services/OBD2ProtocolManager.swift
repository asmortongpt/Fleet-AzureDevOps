/**
 * OBD2 Protocol Manager
 * Phase 3: Dual Protocol Support & Automatic Fallback
 *
 * Features:
 * - Dual protocol support: Bluetooth LE + WiFi TCP
 * - Automatic protocol detection and selection
 * - Intelligent fallback when primary fails
 * - WiFi OBD2 TCP connection (192.168.0.10:35000)
 * - Protocol-specific optimizations
 * - Concurrent protocol testing for fastest connection
 *
 * Target: Support 100% of OBD2 adapters (BLE + WiFi)
 */

import Foundation
import CoreBluetooth
import Network

@MainActor
class OBD2ProtocolManager: ObservableObject {

    // MARK: - Published Properties

    @Published var activeProtocol: OBD2Protocol?
    @Published var protocolState: ProtocolState = .idle
    @Published var availableProtocols: [OBD2Protocol] = []

    // MARK: - Types

    enum OBD2Protocol: String, Codable {
        case bluetoothLE = "Bluetooth LE"
        case wifiTCP = "WiFi TCP"

        var priority: Int {
            switch self {
            case .bluetoothLE: return 1  // Prefer BLE (more common, lower power)
            case .wifiTCP: return 2      // Fallback to WiFi
            }
        }

        var defaultHost: String? {
            switch self {
            case .bluetoothLE: return nil
            case .wifiTCP: return "192.168.0.10"
            }
        }

        var defaultPort: UInt16? {
            switch self {
            case .bluetoothLE: return nil
            case .wifiTCP: return 35000
            }
        }
    }

    enum ProtocolState: Equatable {
        case idle
        case detecting
        case testing(protocol: OBD2Protocol)
        case connected(protocol: OBD2Protocol)
        case fallback(from: OBD2Protocol, to: OBD2Protocol)
        case failed(reason: String)
    }

    // MARK: - Private Properties

    // Bluetooth LE
    private var bleManager: OBD2ConnectionManager?
    private var blePeripheral: CBPeripheral?

    // WiFi TCP
    private var wifiConnection: NWConnection?
    private var wifiQueue = DispatchQueue(label: "com.fleet.obd2.wifi")
    private var wifiReceiveBuffer = Data()

    // Protocol Testing
    private var protocolTestTasks: [OBD2Protocol: Task<Bool, Never>] = [:]

    // MARK: - Initialization

    init() {
        self.bleManager = OBD2ConnectionManager()
    }

    deinit {
        disconnect()
    }

    // MARK: - Public API

    /// Automatically detect and connect using the best available protocol
    func connectWithBestProtocol(blePeripheral: CBPeripheral? = nil, timeout: TimeInterval = 30.0) async throws {
        protocolState = .detecting
        print("🔍 Detecting available OBD2 protocols...")

        // Detect available protocols
        availableProtocols = await detectAvailableProtocols(blePeripheral: blePeripheral)

        if availableProtocols.isEmpty {
            protocolState = .failed(reason: "No OBD2 protocols available")
            throw OBD2ProtocolError.noProtocolsAvailable
        }

        print("✅ Found \(availableProtocols.count) available protocol(s): \(availableProtocols.map { $0.rawValue }.joined(separator: ", "))")

        // Sort by priority
        let sortedProtocols = availableProtocols.sorted { $0.priority < $1.priority }

        // Try protocols in parallel for fastest connection
        if sortedProtocols.count > 1 {
            return try await connectWithConcurrentProtocolTesting(protocols: sortedProtocols, blePeripheral: blePeripheral, timeout: timeout)
        } else {
            // Single protocol - just connect
            return try await connectWithProtocol(sortedProtocols[0], blePeripheral: blePeripheral, timeout: timeout)
        }
    }

    /// Connect using a specific protocol
    func connectWithProtocol(_ protocol: OBD2Protocol, blePeripheral: CBPeripheral? = nil, timeout: TimeInterval = 30.0) async throws {
        protocolState = .testing(protocol: `protocol`)
        print("📡 Attempting connection via \(`protocol`.rawValue)...")

        do {
            switch `protocol` {
            case .bluetoothLE:
                guard let peripheral = blePeripheral else {
                    throw OBD2ProtocolError.blePeripheralNotProvided
                }
                try await connectViaBluetooth(peripheral: peripheral, timeout: timeout)

            case .wifiTCP:
                try await connectViaWiFi(timeout: timeout)
            }

            activeProtocol = `protocol`
            protocolState = .connected(protocol: `protocol`)
            print("✅ Connected via \(`protocol`.rawValue)")

        } catch {
            print("❌ Failed to connect via \(`protocol`.rawValue): \(error.localizedDescription)")
            throw error
        }
    }

    /// Attempt fallback to alternative protocol
    func fallbackToAlternativeProtocol() async throws {
        guard let current = activeProtocol else {
            throw OBD2ProtocolError.noActiveProtocol
        }

        // Find alternative protocol
        let alternatives = availableProtocols.filter { $0 != current }
        guard let alternative = alternatives.first else {
            throw OBD2ProtocolError.noAlternativeProtocol
        }

        protocolState = .fallback(from: current, to: alternative)
        print("🔄 Falling back from \(current.rawValue) to \(alternative.rawValue)...")

        // Disconnect current
        disconnect()

        // Connect with alternative
        try await connectWithProtocol(alternative, timeout: 15.0)
    }

    /// Disconnect all protocols
    func disconnect() {
        // Disconnect Bluetooth
        bleManager?.disconnect()
        blePeripheral = nil

        // Disconnect WiFi
        wifiConnection?.cancel()
        wifiConnection = nil
        wifiReceiveBuffer.removeAll()

        // Cancel all test tasks
        protocolTestTasks.values.forEach { $0.cancel() }
        protocolTestTasks.removeAll()

        activeProtocol = nil
        protocolState = .idle
    }

    /// Send command via active protocol
    func sendCommand(_ command: String) async throws -> String {
        guard let protocol = activeProtocol else {
            throw OBD2ProtocolError.noActiveProtocol
        }

        switch `protocol` {
        case .bluetoothLE:
            return try await sendViaBluetooth(command)
        case .wifiTCP:
            return try await sendViaWiFi(command)
        }
    }

    // MARK: - Protocol Detection

    private func detectAvailableProtocols(blePeripheral: CBPeripheral?) async -> [OBD2Protocol] {
        var protocols: [OBD2Protocol] = []

        // Check Bluetooth LE availability
        if blePeripheral != nil {
            protocols.append(.bluetoothLE)
        }

        // Check WiFi availability (ping default OBD2 WiFi address)
        if await isWiFiOBD2Available() {
            protocols.append(.wifiTCP)
        }

        return protocols
    }

    private func isWiFiOBD2Available() async -> Bool {
        // Quick check if we can reach typical WiFi OBD2 address
        let host = NWEndpoint.Host("192.168.0.10")
        let port = NWEndpoint.Port(integerLiteral: 35000)
        let connection = NWConnection(host: host, port: port, using: .tcp)

        return await withCheckedContinuation { continuation in
            var hasReturned = false

            connection.stateUpdateHandler = { state in
                if hasReturned { return }

                switch state {
                case .ready:
                    hasReturned = true
                    connection.cancel()
                    continuation.resume(returning: true)
                case .failed:
                    hasReturned = true
                    connection.cancel()
                    continuation.resume(returning: false)
                default:
                    break
                }
            }

            connection.start(queue: wifiQueue)

            // Timeout after 2 seconds
            Task {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                if !hasReturned {
                    hasReturned = true
                    connection.cancel()
                    continuation.resume(returning: false)
                }
            }
        }
    }

    // MARK: - Concurrent Protocol Testing

    private func connectWithConcurrentProtocolTesting(protocols: [OBD2Protocol], blePeripheral: CBPeripheral?, timeout: TimeInterval) async throws {
        print("🏁 Testing \(protocols.count) protocols concurrently for fastest connection...")

        // Start all protocol tests concurrently
        for proto in protocols {
            let task = Task { @MainActor in
                await testProtocol(proto, blePeripheral: blePeripheral, timeout: timeout / 2)
            }
            protocolTestTasks[proto] = task
        }

        // Wait for first successful connection
        for proto in protocols {
            guard let task = protocolTestTasks[proto] else { continue }

            let success = await task.value
            if success {
                // First protocol succeeded - cancel others and use this one
                protocolTestTasks.values.forEach { $0.cancel() }
                protocolTestTasks.removeAll()

                activeProtocol = proto
                protocolState = .connected(protocol: proto)
                print("⚡️ Fastest connection: \(proto.rawValue)")
                return
            }
        }

        // All protocols failed
        protocolState = .failed(reason: "All protocols failed to connect")
        throw OBD2ProtocolError.allProtocolsFailed
    }

    private func testProtocol(_ protocol: OBD2Protocol, blePeripheral: CBPeripheral?, timeout: TimeInterval) async -> Bool {
        do {
            switch `protocol` {
            case .bluetoothLE:
                guard let peripheral = blePeripheral else { return false }
                try await connectViaBluetooth(peripheral: peripheral, timeout: timeout)
                return true

            case .wifiTCP:
                try await connectViaWiFi(timeout: timeout)
                return true
            }
        } catch {
            return false
        }
    }

    // MARK: - Bluetooth LE Protocol

    private func connectViaBluetooth(peripheral: CBPeripheral, timeout: TimeInterval) async throws {
        guard let manager = bleManager else {
            throw OBD2ProtocolError.bleManagerNotInitialized
        }

        blePeripheral = peripheral
        try await manager.connect(to: peripheral, timeout: timeout)
    }

    private func sendViaBluetooth(_ command: String) async throws -> String {
        guard let manager = bleManager else {
            throw OBD2ProtocolError.bleManagerNotInitialized
        }

        return try await manager.sendCommand(command)
    }

    // MARK: - WiFi TCP Protocol

    private func connectViaWiFi(host: String = "192.168.0.10", port: UInt16 = 35000, timeout: TimeInterval) async throws {
        let nwHost = NWEndpoint.Host(host)
        let nwPort = NWEndpoint.Port(integerLiteral: port)

        let connection = NWConnection(host: nwHost, port: nwPort, using: .tcp)
        wifiConnection = connection

        return try await withCheckedThrowingContinuation { continuation in
            var hasReturned = false

            connection.stateUpdateHandler = { [weak self] state in
                guard let self = self else { return }
                if hasReturned { return }

                Task { @MainActor in
                    switch state {
                    case .ready:
                        hasReturned = true
                        print("✅ WiFi TCP connection established")

                        // Start receiving data
                        self.startReceiving(connection: connection)

                        // Initialize OBD2 adapter
                        Task {
                            try? await self.initializeWiFiOBD2()
                        }

                        continuation.resume()

                    case .failed(let error):
                        hasReturned = true
                        print("❌ WiFi TCP connection failed: \(error.localizedDescription)")
                        connection.cancel()
                        continuation.resume(throwing: OBD2ProtocolError.wifiConnectionFailed(error))

                    case .cancelled:
                        if !hasReturned {
                            hasReturned = true
                            continuation.resume(throwing: OBD2ProtocolError.wifiConnectionCancelled)
                        }

                    default:
                        break
                    }
                }
            }

            connection.start(queue: wifiQueue)

            // Timeout
            Task {
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                if !hasReturned {
                    hasReturned = true
                    connection.cancel()
                    continuation.resume(throwing: OBD2ProtocolError.wifiConnectionTimeout)
                }
            }
        }
    }

    private func startReceiving(connection: NWConnection) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, isComplete, error in
            guard let self = self else { return }

            Task { @MainActor in
                if let data = data, !data.isEmpty {
                    self.wifiReceiveBuffer.append(data)
                    print("📨 Received \(data.count) bytes via WiFi")
                }

                if let error = error {
                    print("❌ WiFi receive error: \(error.localizedDescription)")
                    return
                }

                if !isComplete {
                    self.startReceiving(connection: connection)
                }
            }
        }
    }

    private func initializeWiFiOBD2() async throws {
        // Send initialization commands
        let initCommands = ["ATZ\r", "ATE0\r", "ATL0\r", "ATSP0\r"]

        for command in initCommands {
            _ = try await sendViaWiFi(command)
            try await Task.sleep(nanoseconds: 500_000_000) // 500ms between commands
        }

        print("✅ WiFi OBD2 initialized")
    }

    private func sendViaWiFi(_ command: String) async throws -> String {
        guard let connection = wifiConnection else {
            throw OBD2ProtocolError.wifiNotConnected
        }

        let commandData = "\(command)\r".data(using: .utf8)!

        return try await withCheckedThrowingContinuation { continuation in
            var hasReturned = false

            connection.send(content: commandData, completion: .contentProcessed { error in
                if hasReturned { return }

                if let error = error {
                    hasReturned = true
                    continuation.resume(throwing: OBD2ProtocolError.wifiSendFailed(error))
                } else {
                    // Wait for response
                    Task { @MainActor in
                        try? await Task.sleep(nanoseconds: 500_000_000) // 500ms for response

                        if !hasReturned {
                            hasReturned = true

                            // Read from buffer
                            if let response = String(data: self.wifiReceiveBuffer, encoding: .utf8) {
                                self.wifiReceiveBuffer.removeAll()
                                continuation.resume(returning: response)
                            } else {
                                continuation.resume(returning: "OK")
                            }
                        }
                    }
                }
            })

            // Timeout
            Task {
                try? await Task.sleep(nanoseconds: 3_000_000_000) // 3 second timeout
                if !hasReturned {
                    hasReturned = true
                    continuation.resume(throwing: OBD2ProtocolError.wifiResponseTimeout)
                }
            }
        }
    }

    // MARK: - Protocol Information

    func getProtocolInfo() -> ProtocolInfo? {
        guard let proto = activeProtocol else { return nil }

        switch proto {
        case .bluetoothLE:
            return ProtocolInfo(
                protocol: proto,
                connectionType: "Bluetooth Low Energy",
                host: blePeripheral?.name ?? "Unknown",
                port: nil,
                latency: bleManager?.connectionHealth?.latency ?? 0,
                signalStrength: bleManager?.connectionHealth?.rssi
            )

        case .wifiTCP:
            return ProtocolInfo(
                protocol: proto,
                connectionType: "WiFi TCP",
                host: proto.defaultHost ?? "Unknown",
                port: proto.defaultPort,
                latency: nil,
                signalStrength: nil
            )
        }
    }

    struct ProtocolInfo {
        let protocol: OBD2Protocol
        let connectionType: String
        let host: String
        let port: UInt16?
        let latency: TimeInterval?
        let signalStrength: Int?
    }
}

// MARK: - Errors

enum OBD2ProtocolError: LocalizedError {
    case noProtocolsAvailable
    case noActiveProtocol
    case noAlternativeProtocol
    case allProtocolsFailed
    case blePeripheralNotProvided
    case bleManagerNotInitialized
    case wifiNotConnected
    case wifiConnectionFailed(Error)
    case wifiConnectionCancelled
    case wifiConnectionTimeout
    case wifiSendFailed(Error)
    case wifiResponseTimeout

    var errorDescription: String? {
        switch self {
        case .noProtocolsAvailable:
            return "No OBD2 communication protocols are available"
        case .noActiveProtocol:
            return "No active OBD2 protocol connection"
        case .noAlternativeProtocol:
            return "No alternative protocol available for fallback"
        case .allProtocolsFailed:
            return "All OBD2 protocols failed to connect"
        case .blePeripheralNotProvided:
            return "Bluetooth peripheral not provided for BLE connection"
        case .bleManagerNotInitialized:
            return "Bluetooth manager not initialized"
        case .wifiNotConnected:
            return "WiFi OBD2 not connected"
        case .wifiConnectionFailed(let error):
            return "WiFi connection failed: \(error.localizedDescription)"
        case .wifiConnectionCancelled:
            return "WiFi connection was cancelled"
        case .wifiConnectionTimeout:
            return "WiFi connection timed out"
        case .wifiSendFailed(let error):
            return "Failed to send command via WiFi: \(error.localizedDescription)"
        case .wifiResponseTimeout:
            return "WiFi response timed out"
        }
    }
}
