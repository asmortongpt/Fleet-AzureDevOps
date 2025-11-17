//
//  NetworkMonitor.swift
//  Fleet Manager - iOS Native App
//
//  Real-time network connectivity monitoring using Network framework
//  Provides connectivity status updates and reachability checking
//

import Foundation
import Network
import Combine

// MARK: - Network Status
public enum NetworkStatus: Equatable {
    case connected(ConnectionType)
    case disconnected
    case connecting

    public var isConnected: Bool {
        if case .connected = self {
            return true
        }
        return false
    }

    public var description: String {
        switch self {
        case .connected(let type):
            return "Connected (\(type.description))"
        case .disconnected:
            return "Disconnected"
        case .connecting:
            return "Connecting..."
        }
    }
}

// MARK: - Connection Type
public enum ConnectionType: String {
    case wifi = "WiFi"
    case cellular = "Cellular"
    case wired = "Wired"
    case other = "Other"

    var description: String {
        return self.rawValue
    }
}

// MARK: - Network Monitor
public class NetworkMonitor: ObservableObject {
    public static let shared = NetworkMonitor()

    // MARK: - Published Properties
    @Published public private(set) var status: NetworkStatus = .disconnected
    @Published public private(set) var isConnected: Bool = false
    @Published public private(set) var isExpensive: Bool = false
    @Published public private(set) var isConstrained: Bool = false

    // MARK: - Publishers
    public let statusPublisher = PassthroughSubject<NetworkStatus, Never>()
    public let connectivityPublisher = PassthroughSubject<Bool, Never>()

    // MARK: - Network Framework
    private let monitor: NWPathMonitor
    private let monitorQueue = DispatchQueue(label: "com.fleet.networkmonitor", qos: .utility)

    // MARK: - Connection History
    private var connectionHistory: [NetworkStatusChange] = []
    private let maxHistoryCount = 50

    // MARK: - Initialization
    private init() {
        self.monitor = NWPathMonitor()
        startMonitoring()
    }

    // MARK: - Monitoring Control
    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }

            let newStatus = self.determineStatus(from: path)
            let wasConnected = self.isConnected

            DispatchQueue.main.async {
                self.status = newStatus
                self.isConnected = newStatus.isConnected
                self.isExpensive = path.isExpensive
                self.isConstrained = path.isConstrained

                // Publish status change
                self.statusPublisher.send(newStatus)

                // Publish connectivity change if it changed
                if wasConnected != newStatus.isConnected {
                    self.connectivityPublisher.send(newStatus.isConnected)

                    // Post notification for legacy compatibility
                    NotificationCenter.default.post(
                        name: .networkStatusChanged,
                        object: nil,
                        userInfo: ["isOnline": newStatus.isConnected]
                    )
                }

                // Track history
                self.addToHistory(status: newStatus)

                // Log change
                self.logStatusChange(from: wasConnected, to: newStatus.isConnected)
            }
        }

        monitor.start(queue: monitorQueue)
    }

    public func stopMonitoring() {
        monitor.cancel()
    }

    // MARK: - Status Determination
    private func determineStatus(from path: NWPath) -> NetworkStatus {
        guard path.status == .satisfied else {
            return path.status == .requiresConnection ? .connecting : .disconnected
        }

        // Determine connection type
        let connectionType: ConnectionType
        if path.usesInterfaceType(.wifi) {
            connectionType = .wifi
        } else if path.usesInterfaceType(.cellular) {
            connectionType = .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = .wired
        } else {
            connectionType = .other
        }

        return .connected(connectionType)
    }

    // MARK: - History Tracking
    private func addToHistory(status: NetworkStatus) {
        let change = NetworkStatusChange(
            status: status,
            timestamp: Date()
        )

        connectionHistory.append(change)

        // Limit history size
        if connectionHistory.count > maxHistoryCount {
            connectionHistory.removeFirst()
        }
    }

    public func getConnectionHistory() -> [NetworkStatusChange] {
        return connectionHistory
    }

    // MARK: - Logging
    private func logStatusChange(from wasConnected: Bool, to isConnected: Bool) {
        let logger = LoggingManager.shared

        if !wasConnected && isConnected {
            logger.log(.info, "Network connected: \(status.description)", category: .network, metadata: [
                "connectionType": getConnectionType()?.rawValue ?? "unknown",
                "isExpensive": String(isExpensive),
                "isConstrained": String(isConstrained)
            ])

            // Log to security logger
            SecurityLogger.shared.logSecurityEvent(
                .configurationLoaded,
                details: ["event": "Network connected"],
                severity: .low
            )
        } else if wasConnected && !isConnected {
            logger.log(.warning, "Network disconnected", category: .network)

            // Log to security logger
            SecurityLogger.shared.logSecurityEvent(
                .apiRequestFailed,
                details: ["event": "Network disconnected"],
                severity: .medium
            )
        }
    }

    // MARK: - Public API

    /// Check if currently connected to network
    public func checkConnectivity() -> Bool {
        return isConnected
    }

    /// Get current connection type (if connected)
    public func getConnectionType() -> ConnectionType? {
        if case .connected(let type) = status {
            return type
        }
        return nil
    }

    /// Check if connection is suitable for large data transfers
    public func isSuitableForLargeTransfer() -> Bool {
        return isConnected && !isExpensive && !isConstrained
    }

    /// Wait for network connection with timeout
    public func waitForConnection(timeout: TimeInterval = 30.0) async -> Bool {
        // If already connected, return immediately
        if isConnected {
            return true
        }

        // Create async stream to wait for connection
        return await withCheckedContinuation { continuation in
            var cancellable: AnyCancellable?
            var timeoutTask: Task<Void, Never>?

            // Set timeout
            timeoutTask = Task {
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                cancellable?.cancel()
                continuation.resume(returning: false)
            }

            // Wait for connection
            cancellable = connectivityPublisher
                .filter { $0 == true }
                .first()
                .sink { isConnected in
                    timeoutTask?.cancel()
                    continuation.resume(returning: isConnected)
                }
        }
    }

    /// Get network statistics
    public func getNetworkStatistics() -> NetworkStatistics {
        let connectedCount = connectionHistory.filter { $0.status.isConnected }.count
        let disconnectedCount = connectionHistory.count - connectedCount

        let lastConnected = connectionHistory.last(where: { $0.status.isConnected })
        let lastDisconnected = connectionHistory.last(where: { !$0.status.isConnected })

        return NetworkStatistics(
            currentStatus: status,
            totalChanges: connectionHistory.count,
            connectedCount: connectedCount,
            disconnectedCount: disconnectedCount,
            lastConnectedTime: lastConnected?.timestamp,
            lastDisconnectedTime: lastDisconnected?.timestamp,
            isExpensive: isExpensive,
            isConstrained: isConstrained
        )
    }
}

// MARK: - Supporting Types

public struct NetworkStatusChange: Identifiable {
    public let id = UUID()
    public let status: NetworkStatus
    public let timestamp: Date
}

public struct NetworkStatistics {
    public let currentStatus: NetworkStatus
    public let totalChanges: Int
    public let connectedCount: Int
    public let disconnectedCount: Int
    public let lastConnectedTime: Date?
    public let lastDisconnectedTime: Date?
    public let isExpensive: Bool
    public let isConstrained: Bool

    public var uptime: TimeInterval? {
        guard let lastConnected = lastConnectedTime else { return nil }
        return Date().timeIntervalSince(lastConnected)
    }

    public var formattedUptime: String {
        guard let uptime = uptime else { return "N/A" }

        let hours = Int(uptime) / 3600
        let minutes = (Int(uptime) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    public static let networkStatusChanged = Notification.Name("networkStatusChanged")
}
