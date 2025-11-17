import Foundation
import Network

// MARK: - Network Optimizer
/// Optimizes network requests based on connection quality
public class NetworkOptimizer {

    // MARK: - Singleton
    public static let shared = NetworkOptimizer()

    // MARK: - Properties
    private let monitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.fleet.network.monitor")

    private var currentPath: NWPath?
    private var isConnected: Bool = false
    private var connectionType: ConnectionType = .unknown

    // Configuration
    private var lowBandwidthThreshold: Int = 1_000_000 // 1 Mbps
    private var requestBatchSize: Int = 10

    // MARK: - Connection Type
    public enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown
    }

    // MARK: - Initialization
    private init() {
        setupNetworkMonitoring()
    }

    // MARK: - Public Methods

    /// Start monitoring network conditions
    public func startMonitoring() {
        monitor.start(queue: monitorQueue)
        print("🌐 NetworkOptimizer: Started monitoring")
    }

    /// Stop monitoring network conditions
    public func stopMonitoring() {
        monitor.cancel()
        print("🌐 NetworkOptimizer: Stopped monitoring")
    }

    /// Check if device is connected to network
    /// - Returns: True if connected
    public func isNetworkAvailable() -> Bool {
        return isConnected
    }

    /// Get current connection type
    /// - Returns: Connection type
    public func getConnectionType() -> ConnectionType {
        return connectionType
    }

    /// Determine if network is suitable for large downloads
    /// - Returns: True if network can handle large downloads
    public func canHandleLargeDownloads() -> Bool {
        switch connectionType {
        case .wifi, .ethernet:
            return true
        case .cellular:
            return false // Conserve cellular data
        case .unknown:
            return false
        }
    }

    /// Get optimal batch size for network requests
    /// - Returns: Recommended batch size
    public func getOptimalBatchSize() -> Int {
        switch connectionType {
        case .wifi, .ethernet:
            return requestBatchSize * 2 // Higher batch size for fast connections
        case .cellular:
            return requestBatchSize / 2 // Lower batch size for cellular
        case .unknown:
            return requestBatchSize
        }
    }

    /// Get recommended timeout for network requests
    /// - Returns: Timeout in seconds
    public func getRecommendedTimeout() -> TimeInterval {
        switch connectionType {
        case .wifi, .ethernet:
            return 30.0
        case .cellular:
            return 60.0 // Longer timeout for cellular
        case .unknown:
            return 45.0
        }
    }

    // MARK: - Private Methods

    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            self?.handlePathUpdate(path)
        }
    }

    private func handlePathUpdate(_ path: NWPath) {
        currentPath = path
        isConnected = path.status == .satisfied

        // Determine connection type
        if path.usesInterfaceType(.wifi) {
            connectionType = .wifi
        } else if path.usesInterfaceType(.cellular) {
            connectionType = .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = .ethernet
        } else {
            connectionType = .unknown
        }

        print("🌐 NetworkOptimizer: Network status changed - \(connectionType), connected: \(isConnected)")

        // Post notification
        NotificationCenter.default.post(
            name: .networkStatusChanged,
            object: nil,
            userInfo: [
                "isConnected": isConnected,
                "connectionType": connectionType
            ]
        )
    }
}
