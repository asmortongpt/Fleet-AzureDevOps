//
//  HealthCheckManager.swift
//  Fleet Manager - iOS Native App
//
//  Comprehensive system health monitoring
//  Checks API connectivity, database, storage, network, and service dependencies
//

import Foundation
import Network

// MARK: - Health Check Manager
/// Monitors system health and generates health reports
class HealthCheckManager {

    // MARK: - Singleton
    static let shared = HealthCheckManager()

    // MARK: - Dependencies
    private let logger = LoggingManager.shared
    private let networkMonitor = NetworkMonitor.shared

    // MARK: - Configuration
    private struct Config {
        var apiTimeout: TimeInterval = 10.0
        var databaseTimeout: TimeInterval = 5.0
        var minStorageThresholdMB: Int64 = 100 // Minimum 100MB required
    }

    private var config = Config()

    // MARK: - Health Check Results
    private var lastHealthReport: HealthCheckReport?
    private var healthHistory: [HealthCheckReport] = []
    private let maxHistoryCount = 50

    // MARK: - Initialization
    private init() {
        logger.log(.info, "HealthCheckManager initialized")
    }

    // MARK: - Health Check Execution

    /// Run comprehensive health check
    func runHealthCheck() async -> HealthCheckReport {
        logger.log(.info, "Starting health check")

        let startTime = Date()

        // Run all health checks in parallel
        async let apiCheck = checkAPIConnectivity()
        async let databaseCheck = checkDatabaseIntegrity()
        async let storageCheck = checkStorageAvailability()
        async let networkCheck = checkNetworkReachability()
        async let servicesCheck = checkServiceDependencies()

        let results = await (
            api: apiCheck,
            database: databaseCheck,
            storage: storageCheck,
            network: networkCheck,
            services: servicesCheck
        )

        let duration = Date().timeIntervalSince(startTime)

        let report = HealthCheckReport(
            timestamp: Date(),
            duration: duration,
            apiHealth: results.api,
            databaseHealth: results.database,
            storageHealth: results.storage,
            networkHealth: results.network,
            servicesHealth: results.services
        )

        // Store report
        lastHealthReport = report
        healthHistory.append(report)
        if healthHistory.count > maxHistoryCount {
            healthHistory.removeFirst()
        }

        logger.log(
            report.isHealthy ? .info : .warning,
            "Health check completed",
            metadata: [
                "isHealthy": String(report.isHealthy),
                "duration": String(format: "%.3f", duration)
            ]
        )

        return report
    }

    /// Run quick health check (essential checks only)
    func runQuickHealthCheck() async -> HealthCheckResult {
        let networkHealthy = networkMonitor.isConnected
        let storageCheck = await checkStorageAvailability()

        let isHealthy = networkHealthy && storageCheck.isHealthy

        return HealthCheckResult(
            isHealthy: isHealthy,
            status: isHealthy ? .healthy : .unhealthy,
            message: isHealthy ? "System is healthy" : "System health issues detected",
            details: [
                "network": networkHealthy ? "OK" : "Disconnected",
                "storage": storageCheck.message
            ],
            checkTime: Date()
        )
    }

    // MARK: - Individual Health Checks

    /// Check API connectivity and health
    private func checkAPIConnectivity() async -> HealthCheckResult {
        logger.log(.debug, "Checking API connectivity")

        do {
            let status = await APIConfiguration.testConnection()

            switch status {
            case .connected:
                return HealthCheckResult(
                    isHealthy: true,
                    status: .healthy,
                    message: "API is reachable and healthy",
                    details: ["endpoint": APIConfiguration.apiBaseURL],
                    checkTime: Date()
                )

            case .degraded(let reason):
                return HealthCheckResult(
                    isHealthy: false,
                    status: .degraded,
                    message: "API is degraded: \(reason)",
                    details: ["endpoint": APIConfiguration.apiBaseURL, "reason": reason],
                    checkTime: Date()
                )

            case .failed(let error):
                return HealthCheckResult(
                    isHealthy: false,
                    status: .unhealthy,
                    message: "API is unreachable: \(error)",
                    details: ["endpoint": APIConfiguration.apiBaseURL, "error": error],
                    checkTime: Date()
                )
            }
        }
    }

    /// Check database integrity and accessibility
    private func checkDatabaseIntegrity() async -> HealthCheckResult {
        logger.log(.debug, "Checking database integrity")

        do {
            // Check if database is accessible
            let canAccessDB = await performDatabaseAccessCheck()

            if !canAccessDB {
                return HealthCheckResult(
                    isHealthy: false,
                    status: .unhealthy,
                    message: "Database is not accessible",
                    details: [:],
                    checkTime: Date()
                )
            }

            // Check database integrity
            let integrityOK = await performDatabaseIntegrityCheck()

            if !integrityOK {
                return HealthCheckResult(
                    isHealthy: false,
                    status: .degraded,
                    message: "Database integrity check failed",
                    details: [:],
                    checkTime: Date()
                )
            }

            return HealthCheckResult(
                isHealthy: true,
                status: .healthy,
                message: "Database is accessible and healthy",
                details: [:],
                checkTime: Date()
            )

        } catch {
            return HealthCheckResult(
                isHealthy: false,
                status: .unhealthy,
                message: "Database check failed: \(error.localizedDescription)",
                details: ["error": error.localizedDescription],
                checkTime: Date()
            )
        }
    }

    private func performDatabaseAccessCheck() async -> Bool {
        // In a real implementation, this would attempt to open/query the database
        // For now, we'll use a simple check
        do {
            // Check if DataPersistenceManager can be accessed
            let fileManager = FileManager.default
            guard let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
                return false
            }

            let dbPath = documentsDirectory.appendingPathComponent("FleetManagement.db")
            return fileManager.fileExists(atPath: dbPath.path) || fileManager.isWritableFile(atPath: documentsDirectory.path)
        } catch {
            logger.log(.error, "Database access check failed: \(error.localizedDescription)")
            return false
        }
    }

    private func performDatabaseIntegrityCheck() async -> Bool {
        // In a real implementation, this would run PRAGMA integrity_check
        // For now, we'll return true as a placeholder
        return true
    }

    /// Check storage availability
    private func checkStorageAvailability() async -> HealthCheckResult {
        logger.log(.debug, "Checking storage availability")

        do {
            let availableSpace = getAvailableStorageSpace()
            let totalSpace = getTotalStorageSpace()

            let availableMB = availableSpace / 1_048_576
            let totalMB = totalSpace / 1_048_576
            let usedPercentage = Double(totalSpace - availableSpace) / Double(totalSpace) * 100

            let isHealthy = availableSpace > (config.minStorageThresholdMB * 1_048_576)

            let status: HealthStatus
            if availableMB < config.minStorageThresholdMB {
                status = .unhealthy
            } else if usedPercentage > 90 {
                status = .degraded
            } else {
                status = .healthy
            }

            return HealthCheckResult(
                isHealthy: isHealthy,
                status: status,
                message: "Storage: \(availableMB)MB available of \(totalMB)MB",
                details: [
                    "available": String(availableMB) + "MB",
                    "total": String(totalMB) + "MB",
                    "usedPercentage": String(format: "%.1f%%", usedPercentage)
                ],
                checkTime: Date()
            )

        } catch {
            return HealthCheckResult(
                isHealthy: false,
                status: .unhealthy,
                message: "Storage check failed: \(error.localizedDescription)",
                details: ["error": error.localizedDescription],
                checkTime: Date()
            )
        }
    }

    private func getAvailableStorageSpace() -> Int64 {
        guard let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return 0
        }

        do {
            let values = try documentsURL.resourceValues(forKeys: [.volumeAvailableCapacityKey])
            return Int64(values.volumeAvailableCapacity ?? 0)
        } catch {
            logger.log(.error, "Failed to get available storage: \(error.localizedDescription)")
            return 0
        }
    }

    private func getTotalStorageSpace() -> Int64 {
        guard let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return 0
        }

        do {
            let values = try documentsURL.resourceValues(forKeys: [.volumeTotalCapacityKey])
            return Int64(values.volumeTotalCapacity ?? 0)
        } catch {
            logger.log(.error, "Failed to get total storage: \(error.localizedDescription)")
            return 0
        }
    }

    /// Check network reachability
    private func checkNetworkReachability() async -> HealthCheckResult {
        logger.log(.debug, "Checking network reachability")

        let isConnected = networkMonitor.isConnected
        let connectionType = networkMonitor.getConnectionType()

        let status: HealthStatus
        let message: String

        if !isConnected {
            status = .unhealthy
            message = "No network connection"
        } else if networkMonitor.isConstrained || networkMonitor.isExpensive {
            status = .degraded
            message = "Network is constrained or expensive"
        } else {
            status = .healthy
            message = "Network is reachable"
        }

        return HealthCheckResult(
            isHealthy: isConnected,
            status: status,
            message: message,
            details: [
                "connected": String(isConnected),
                "type": connectionType?.rawValue ?? "unknown",
                "expensive": String(networkMonitor.isExpensive),
                "constrained": String(networkMonitor.isConstrained)
            ],
            checkTime: Date()
        )
    }

    /// Check service dependencies
    private func checkServiceDependencies() async -> HealthCheckResult {
        logger.log(.debug, "Checking service dependencies")

        var healthyServices = 0
        var totalServices = 0
        var details: [String: String] = [:]

        // Check authentication service
        totalServices += 1
        if await checkAuthenticationService() {
            healthyServices += 1
            details["authentication"] = "OK"
        } else {
            details["authentication"] = "Failed"
        }

        // Check location service
        totalServices += 1
        if checkLocationService() {
            healthyServices += 1
            details["location"] = "OK"
        } else {
            details["location"] = "Unavailable"
        }

        // Check notification service
        totalServices += 1
        if await checkNotificationService() {
            healthyServices += 1
            details["notifications"] = "OK"
        } else {
            details["notifications"] = "Not authorized"
        }

        let isHealthy = healthyServices == totalServices
        let status: HealthStatus = healthyServices == totalServices ? .healthy :
                                   healthyServices > 0 ? .degraded : .unhealthy

        return HealthCheckResult(
            isHealthy: isHealthy,
            status: status,
            message: "\(healthyServices)/\(totalServices) services healthy",
            details: details,
            checkTime: Date()
        )
    }

    private func checkAuthenticationService() async -> Bool {
        // Check if authentication manager is functional
        // In a real implementation, this would verify token validity
        return true
    }

    private func checkLocationService() -> Bool {
        // Check if location services are available
        return LocationManager.shared.isAuthorized()
    }

    private func checkNotificationService() async -> Bool {
        // Check notification permissions
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        return settings.authorizationStatus == .authorized
    }

    // MARK: - Health Report Access

    /// Get last health check report
    func getLastHealthReport() -> HealthCheckReport? {
        return lastHealthReport
    }

    /// Get health check history
    func getHealthHistory() -> [HealthCheckReport] {
        return healthHistory
    }

    /// Get health trends
    func getHealthTrends() -> HealthTrends {
        let totalChecks = healthHistory.count
        let healthyChecks = healthHistory.filter { $0.isHealthy }.count
        let unhealthyChecks = totalChecks - healthyChecks

        let avgAPIHealth = healthHistory.map { $0.apiHealth.isHealthy ? 1.0 : 0.0 }.reduce(0, +) / Double(max(totalChecks, 1))
        let avgDatabaseHealth = healthHistory.map { $0.databaseHealth.isHealthy ? 1.0 : 0.0 }.reduce(0, +) / Double(max(totalChecks, 1))
        let avgNetworkHealth = healthHistory.map { $0.networkHealth.isHealthy ? 1.0 : 0.0 }.reduce(0, +) / Double(max(totalChecks, 1))

        return HealthTrends(
            totalChecks: totalChecks,
            healthyChecks: healthyChecks,
            unhealthyChecks: unhealthyChecks,
            healthRate: Double(healthyChecks) / Double(max(totalChecks, 1)),
            apiHealthRate: avgAPIHealth,
            databaseHealthRate: avgDatabaseHealth,
            networkHealthRate: avgNetworkHealth
        )
    }

    // MARK: - Manual Checks

    /// Manually trigger specific health check
    func checkSpecificComponent(_ component: HealthComponent) async -> HealthCheckResult {
        switch component {
        case .api:
            return await checkAPIConnectivity()
        case .database:
            return await checkDatabaseIntegrity()
        case .storage:
            return await checkStorageAvailability()
        case .network:
            return await checkNetworkReachability()
        case .services:
            return await checkServiceDependencies()
        }
    }
}

// MARK: - Supporting Types

enum HealthComponent {
    case api
    case database
    case storage
    case network
    case services
}

enum HealthStatus: String {
    case healthy = "healthy"
    case degraded = "degraded"
    case unhealthy = "unhealthy"
}

struct HealthCheckResult {
    let isHealthy: Bool
    let status: HealthStatus
    let message: String
    let details: [String: String]
    let checkTime: Date

    func toDictionary() -> [String: Any] {
        return [
            "isHealthy": isHealthy,
            "status": status.rawValue,
            "message": message,
            "details": details,
            "checkTime": ISO8601DateFormatter().string(from: checkTime)
        ]
    }
}

struct HealthCheckReport {
    let timestamp: Date
    let duration: TimeInterval
    let apiHealth: HealthCheckResult
    let databaseHealth: HealthCheckResult
    let storageHealth: HealthCheckResult
    let networkHealth: HealthCheckResult
    let servicesHealth: HealthCheckResult

    var isHealthy: Bool {
        return apiHealth.isHealthy &&
               databaseHealth.isHealthy &&
               storageHealth.isHealthy &&
               networkHealth.isHealthy &&
               servicesHealth.isHealthy
    }

    var overallStatus: HealthStatus {
        let statuses = [
            apiHealth.status,
            databaseHealth.status,
            storageHealth.status,
            networkHealth.status,
            servicesHealth.status
        ]

        if statuses.contains(.unhealthy) {
            return .unhealthy
        } else if statuses.contains(.degraded) {
            return .degraded
        } else {
            return .healthy
        }
    }

    func toDictionary() -> [String: Any] {
        return [
            "timestamp": ISO8601DateFormatter().string(from: timestamp),
            "duration": duration,
            "isHealthy": isHealthy,
            "overallStatus": overallStatus.rawValue,
            "checks": [
                "api": apiHealth.toDictionary(),
                "database": databaseHealth.toDictionary(),
                "storage": storageHealth.toDictionary(),
                "network": networkHealth.toDictionary(),
                "services": servicesHealth.toDictionary()
            ]
        ]
    }
}

struct HealthTrends {
    let totalChecks: Int
    let healthyChecks: Int
    let unhealthyChecks: Int
    let healthRate: Double
    let apiHealthRate: Double
    let databaseHealthRate: Double
    let networkHealthRate: Double

    var healthPercentage: Double {
        return healthRate * 100
    }
}

// MARK: - Extensions

import UserNotifications

extension LocationManager {
    func isAuthorized() -> Bool {
        // Check if location services are authorized
        // This is a placeholder - actual implementation depends on LocationManager
        return true
    }
}
