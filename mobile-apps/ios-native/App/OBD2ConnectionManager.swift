//
//  OBD2ConnectionManager.swift
//  Capital Tech Alliance Fleet Management
//
//  Manages OBD2 device connection states, reconnection logic, and monitoring
//

import Foundation
import CoreBluetooth
import Combine

// MARK: - Connection State
enum OBD2ConnectionState {
    case disconnected
    case scanning
    case connecting
    case connected
    case reconnecting
    case failed(Error)

    var displayName: String {
        switch self {
        case .disconnected: return "Disconnected"
        case .scanning: return "Scanning..."
        case .connecting: return "Connecting..."
        case .connected: return "Connected"
        case .reconnecting: return "Reconnecting..."
        case .failed: return "Connection Failed"
        }
    }

    var isActive: Bool {
        switch self {
        case .connected:
            return true
        default:
            return false
        }
    }
}

// MARK: - Connection Error
enum OBD2ConnectionError: Error, LocalizedError {
    case bluetoothUnavailable
    case deviceNotFound
    case connectionTimeout
    case deviceDisconnected
    case initializationFailed
    case unsupportedDevice
    case maxRetriesReached

    var errorDescription: String? {
        switch self {
        case .bluetoothUnavailable:
            return "Bluetooth is not available. Please enable Bluetooth in Settings."
        case .deviceNotFound:
            return "No OBD2 device found. Please ensure your ELM327 adapter is powered on and in range."
        case .connectionTimeout:
            return "Connection timeout. Please try again."
        case .deviceDisconnected:
            return "OBD2 device disconnected unexpectedly."
        case .initializationFailed:
            return "Failed to initialize OBD2 device. Please check the adapter."
        case .unsupportedDevice:
            return "Unsupported OBD2 device. Please use an ELM327 compatible adapter."
        case .maxRetriesReached:
            return "Maximum connection retries reached. Please check your OBD2 adapter."
        }
    }
}

// MARK: - Connection Delegate
protocol OBD2ConnectionDelegate: AnyObject {
    func connectionStateDidChange(_ state: OBD2ConnectionState)
    func didReceiveVehicleData(_ data: OBD2VehicleData)
    func didDiscoverDevice(_ device: CBPeripheral, rssi: NSNumber)
    func didFailWithError(_ error: OBD2ConnectionError)
}

// MARK: - Connection Manager
class OBD2ConnectionManager: ObservableObject {

    // MARK: - Singleton
    static let shared = OBD2ConnectionManager()

    // MARK: - Properties
    weak var delegate: OBD2ConnectionDelegate?

    @Published private(set) var connectionState: OBD2ConnectionState = .disconnected {
        didSet {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.delegate?.connectionStateDidChange(self.connectionState)
            }
        }
    }

    private(set) var connectedDevice: CBPeripheral?
    private(set) var currentVehicleData = OBD2VehicleData()

    // Connection Settings
    var autoReconnect: Bool = true
    var maxRetries: Int = 3
    var scanTimeout: TimeInterval = 15.0
    var connectionTimeout: TimeInterval = 10.0
    var reconnectDelay: TimeInterval = 2.0

    // Internal State
    private var retryCount: Int = 0
    private var scanTimer: Timer?
    private var connectionTimer: Timer?
    private var reconnectTimer: Timer?
    private var monitoringTimer: Timer?
    private var lastSuccessfulConnection: Date?

    // Statistics
    private(set) var connectionAttempts: Int = 0
    private(set) var successfulConnections: Int = 0
    private(set) var totalDataReceived: Int = 0

    // MARK: - Initialization
    private init() {
        setupNotifications()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Public Methods

    /// Start scanning for OBD2 devices
    func startScanning() {
        guard BluetoothPermissionManager.shared.isBluetoothAvailable() else {
            connectionState = .failed(.bluetoothUnavailable)
            delegate?.didFailWithError(.bluetoothUnavailable)
            return
        }

        connectionState = .scanning
        connectionAttempts += 1
        retryCount = 0

        print("🔍 Starting OBD2 device scan...")

        // Start scan via OBD2Manager
        OBD2Manager.shared.startScanning()

        // Set scan timeout
        scanTimer?.invalidate()
        scanTimer = Timer.scheduledTimer(withTimeInterval: scanTimeout, repeats: false) { [weak self] _ in
            self?.handleScanTimeout()
        }
    }

    /// Stop scanning
    func stopScanning() {
        scanTimer?.invalidate()
        OBD2Manager.shared.stopScanning()

        if connectionState == .scanning {
            connectionState = .disconnected
        }
    }

    /// Connect to a specific device
    func connect(to device: CBPeripheral) {
        stopScanning()
        connectionState = .connecting
        connectedDevice = device

        print("🔗 Connecting to device: \(device.name ?? "Unknown")")

        OBD2Manager.shared.connect(to: device)

        // Set connection timeout
        connectionTimer?.invalidate()
        connectionTimer = Timer.scheduledTimer(withTimeInterval: connectionTimeout, repeats: false) { [weak self] _ in
            self?.handleConnectionTimeout()
        }
    }

    /// Disconnect from current device
    func disconnect() {
        stopMonitoring()
        cancelAllTimers()

        if let device = connectedDevice {
            OBD2Manager.shared.disconnect(from: device)
        }

        connectedDevice = nil
        connectionState = .disconnected
        retryCount = 0

        print("❌ Disconnected from OBD2 device")
    }

    /// Handle successful connection
    func handleConnectionSuccess() {
        connectionTimer?.invalidate()
        connectionState = .connected
        lastSuccessfulConnection = Date()
        successfulConnections += 1
        retryCount = 0

        print("✅ Successfully connected to OBD2 device")

        // Start monitoring vehicle data
        startMonitoring()
    }

    /// Handle connection failure
    func handleConnectionFailure(error: OBD2ConnectionError) {
        connectionTimer?.invalidate()

        print("⚠️ Connection failed: \(error.localizedDescription)")

        if autoReconnect && retryCount < maxRetries {
            retryConnection()
        } else {
            connectionState = .failed(error)
            delegate?.didFailWithError(error)

            if retryCount >= maxRetries {
                delegate?.didFailWithError(.maxRetriesReached)
            }
        }
    }

    /// Handle unexpected disconnection
    func handleUnexpectedDisconnection() {
        stopMonitoring()

        print("⚠️ Device disconnected unexpectedly")

        if autoReconnect && retryCount < maxRetries {
            connectionState = .reconnecting
            retryConnection()
        } else {
            connectionState = .failed(.deviceDisconnected)
            delegate?.didFailWithError(.deviceDisconnected)
        }
    }

    /// Update vehicle data
    func updateVehicleData(_ data: OBD2VehicleData) {
        currentVehicleData = data
        totalDataReceived += 1

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.delegate?.didReceiveVehicleData(data)
        }
    }

    // MARK: - Private Methods

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }

    private func handleScanTimeout() {
        print("⏱ Scan timeout - no devices found")

        stopScanning()

        if retryCount < maxRetries {
            retryCount += 1
            print("🔄 Retry \(retryCount)/\(maxRetries)")

            DispatchQueue.main.asyncAfter(deadline: .now() + reconnectDelay) { [weak self] in
                self?.startScanning()
            }
        } else {
            connectionState = .failed(.deviceNotFound)
            delegate?.didFailWithError(.deviceNotFound)
        }
    }

    private func handleConnectionTimeout() {
        print("⏱ Connection timeout")

        if let device = connectedDevice {
            OBD2Manager.shared.disconnect(from: device)
        }

        handleConnectionFailure(error: .connectionTimeout)
    }

    private func retryConnection() {
        retryCount += 1
        print("🔄 Attempting reconnection \(retryCount)/\(maxRetries)")

        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: reconnectDelay, repeats: false) { [weak self] _ in
            guard let self = self else { return }

            if let device = self.connectedDevice {
                self.connect(to: device)
            } else {
                self.startScanning()
            }
        }
    }

    private func startMonitoring() {
        // Poll vehicle data every 1 second
        monitoringTimer?.invalidate()
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.requestVehicleData()
        }

        RunLoop.current.add(monitoringTimer!, forMode: .common)
    }

    private func stopMonitoring() {
        monitoringTimer?.invalidate()
        monitoringTimer = nil
    }

    private func requestVehicleData() {
        // Request data for monitoring PIDs
        for pid in OBD2DataParser.monitoringPIDs {
            OBD2Manager.shared.requestData(for: pid)
        }
    }

    private func cancelAllTimers() {
        scanTimer?.invalidate()
        connectionTimer?.invalidate()
        reconnectTimer?.invalidate()
        monitoringTimer?.invalidate()

        scanTimer = nil
        connectionTimer = nil
        reconnectTimer = nil
        monitoringTimer = nil
    }

    // MARK: - App Lifecycle

    @objc private func handleAppDidEnterBackground() {
        print("📱 App entering background - maintaining connection")
        // Optionally reduce monitoring frequency or disconnect
    }

    @objc private func handleAppWillEnterForeground() {
        print("📱 App entering foreground")

        // Check if we should reconnect
        if autoReconnect && connectionState == .disconnected {
            if let lastConnection = lastSuccessfulConnection,
               Date().timeIntervalSince(lastConnection) < 300 { // 5 minutes
                startScanning()
            }
        }
    }

    // MARK: - Statistics

    func getConnectionStatistics() -> [String: Any] {
        return [
            "connectionAttempts": connectionAttempts,
            "successfulConnections": successfulConnections,
            "totalDataReceived": totalDataReceived,
            "currentState": connectionState.displayName,
            "retryCount": retryCount,
            "connectedDevice": connectedDevice?.name ?? "None"
        ]
    }

    func resetStatistics() {
        connectionAttempts = 0
        successfulConnections = 0
        totalDataReceived = 0
        retryCount = 0
    }
}
