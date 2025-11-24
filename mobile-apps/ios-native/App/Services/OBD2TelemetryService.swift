/**
 * OBD2 Telemetry Service
 * Phase 4: Connection Analytics & Predictive Modeling
 *
 * Features:
 * - Track all connection attempts with detailed context
 * - Calculate success rates and performance metrics
 * - Identify common failure patterns
 * - Predict connection success probability BEFORE attempting
 * - Machine learning-inspired scoring (using heuristics)
 * - Export telemetry for analysis
 *
 * Target: Predict failures before they happen, optimize connection strategy
 */

import Foundation

@MainActor
class OBD2TelemetryService: ObservableObject {

    // MARK: - Published Properties

    @Published var recentAttempts: [ConnectionAttempt] = []
    @Published var statistics: ConnectionStatistics?
    @Published var predictionModel: PredictionModel = PredictionModel()

    // MARK: - Types

    struct ConnectionAttempt: Codable, Identifiable {
        let id: UUID
        let timestamp: Date
        let deviceName: String?
        let deviceIdentifier: String
        let protocol: String
        let success: Bool
        let connectionTime: TimeInterval?
        let failureReason: String?

        // Context
        let batteryLevel: Float?
        let bluetoothState: String
        let locationPermission: String
        let rssi: Int?
        let priorFailureCount: Int

        // Environment
        let timeOfDay: String
        let dayOfWeek: String
        let appVersion: String
    }

    struct ConnectionStatistics: Codable {
        let totalAttempts: Int
        let successfulConnections: Int
        let failedConnections: Int
        let successRate: Double
        let averageConnectionTime: TimeInterval
        let mostCommonFailure: String?
        let bestProtocol: String?
        let bestTimeOfDay: String?

        var successPercentage: Int {
            Int(successRate * 100)
        }
    }

    struct PredictionModel {
        var baselineSuccessRate: Double = 0.70 // Start at 70% (pre-guarantee)

        func predictSuccessProbability(context: ConnectionContext) -> Double {
            var score = baselineSuccessRate

            // Battery Level Impact (±10%)
            if let battery = context.batteryLevel {
                if battery > 0.50 {
                    score += 0.10 // Good battery helps
                } else if battery < 0.15 {
                    score -= 0.15 // Low battery hurts significantly
                }
            }

            // Bluetooth State Impact (±15%)
            if context.bluetoothPoweredOn {
                score += 0.10
            } else {
                score -= 0.25 // Major issue if BT off
            }

            // Permissions Impact (±10%)
            if context.hasLocationPermission {
                score += 0.05
            } else {
                score -= 0.15
            }

            // Signal Strength Impact (±5%)
            if let rssi = context.rssi {
                if rssi > -70 {
                    score += 0.05 // Strong signal
                } else if rssi < -90 {
                    score -= 0.10 // Weak signal
                }
            }

            // Prior Failure Impact (±20%)
            if context.consecutiveFailures == 0 {
                score += 0.05 // Clean slate
            } else if context.consecutiveFailures >= 3 {
                score -= 0.20 // Multiple failures indicate systemic issue
            } else {
                score -= Double(context.consecutiveFailures) * 0.05
            }

            // Time of Day Impact (±5%)
            let hour = Calendar.current.component(.hour, from: Date())
            if (9...17).contains(hour) {
                score += 0.05 // Business hours (stable network)
            }

            // Protocol Availability Impact (+10%)
            if context.hasMultipleProtocols {
                score += 0.10 // Fallback available
            }

            // Clamp to 0.0 - 1.0
            return max(0.0, min(1.0, score))
        }

        func getConfidenceLevel(_ probability: Double) -> String {
            switch probability {
            case 0.90...1.0: return "Very High"
            case 0.75..<0.90: return "High"
            case 0.60..<0.75: return "Medium"
            case 0.40..<0.60: return "Low"
            default: return "Very Low"
            }
        }

        func shouldProceed(_ probability: Double) -> Bool {
            return probability >= 0.50 // 50% threshold
        }

        func getRecommendation(_ probability: Double, context: ConnectionContext) -> String {
            if probability >= 0.80 {
                return "Connection likely to succeed. Proceed."
            } else if probability >= 0.60 {
                return "Connection may succeed. Proceed with caution."
            } else if probability >= 0.40 {
                // Identify blocking issue
                if !context.bluetoothPoweredOn {
                    return "Turn on Bluetooth before attempting connection."
                } else if !context.hasLocationPermission {
                    return "Grant Location permission for Bluetooth scanning."
                } else if let battery = context.batteryLevel, battery < 0.15 {
                    return "Charge device to at least 20% before connecting."
                } else if context.consecutiveFailures >= 3 {
                    return "Reset OBD2 adapter (unplug 30 seconds) before retrying."
                }
                return "Fix issues before attempting connection."
            } else {
                return "Connection unlikely to succeed. Resolve critical issues first."
            }
        }
    }

    struct ConnectionContext {
        let batteryLevel: Float?
        let bluetoothPoweredOn: Bool
        let hasLocationPermission: Bool
        let rssi: Int?
        let consecutiveFailures: Int
        let hasMultipleProtocols: Bool
    }

    // MARK: - Private Properties

    private let maxStoredAttempts = 100
    private let userDefaultsKey = "obd2_telemetry_attempts"
    private let statisticsKey = "obd2_telemetry_statistics"

    // MARK: - Initialization

    init() {
        loadTelemetry()
        updateStatistics()
        updatePredictionModel()
    }

    // MARK: - Public API

    /// Record a connection attempt
    func recordAttempt(
        deviceName: String?,
        deviceIdentifier: String,
        protocol: String,
        success: Bool,
        connectionTime: TimeInterval?,
        failureReason: String?,
        batteryLevel: Float?,
        bluetoothState: String,
        locationPermission: String,
        rssi: Int?
    ) {
        let attempt = ConnectionAttempt(
            id: UUID(),
            timestamp: Date(),
            deviceName: deviceName,
            deviceIdentifier: deviceIdentifier,
            protocol: `protocol`,
            success: success,
            connectionTime: connectionTime,
            failureReason: failureReason,
            batteryLevel: batteryLevel,
            bluetoothState: bluetoothState,
            locationPermission: locationPermission,
            rssi: rssi,
            priorFailureCount: getConsecutiveFailureCount(),
            timeOfDay: getTimeOfDay(),
            dayOfWeek: getDayOfWeek(),
            appVersion: getAppVersion()
        )

        recentAttempts.insert(attempt, at: 0)

        // Keep only last N attempts
        if recentAttempts.count > maxStoredAttempts {
            recentAttempts = Array(recentAttempts.prefix(maxStoredAttempts))
        }

        // Update failure counter
        if success {
            UserDefaults.standard.set(0, forKey: "obd2_consecutive_failures")
        } else {
            let count = getConsecutiveFailureCount()
            UserDefaults.standard.set(count + 1, forKey: "obd2_consecutive_failures")
        }

        saveTelemetry()
        updateStatistics()
        updatePredictionModel()
    }

    /// Predict success probability for upcoming connection
    func predictConnection(context: ConnectionContext) -> (probability: Double, confidence: String, recommendation: String) {
        let probability = predictionModel.predictSuccessProbability(context: context)
        let confidence = predictionModel.getConfidenceLevel(probability)
        let recommendation = predictionModel.getRecommendation(probability, context: context)

        return (probability, confidence, recommendation)
    }

    /// Get current statistics
    func getStatistics() -> ConnectionStatistics? {
        return statistics
    }

    /// Get failure pattern analysis
    func getFailurePatterns() -> [(reason: String, count: Int, percentage: Double)] {
        let failures = recentAttempts.filter { !$0.success }
        guard !failures.isEmpty else { return [] }

        // Group by failure reason
        var reasonCounts: [String: Int] = [:]
        for failure in failures {
            let reason = failure.failureReason ?? "Unknown"
            reasonCounts[reason, default: 0] += 1
        }

        // Convert to sorted array
        let totalFailures = Double(failures.count)
        return reasonCounts.map { (reason: $0.key, count: $0.value, percentage: Double($0.value) / totalFailures) }
            .sorted { $0.count > $1.count }
    }

    /// Get success rate by protocol
    func getSuccessRateByProtocol() -> [(protocol: String, successRate: Double, attempts: Int)] {
        var protocolStats: [String: (successes: Int, total: Int)] = [:]

        for attempt in recentAttempts {
            let proto = attempt.protocol
            let current = protocolStats[proto] ?? (successes: 0, total: 0)
            protocolStats[proto] = (
                successes: current.successes + (attempt.success ? 1 : 0),
                total: current.total + 1
            )
        }

        return protocolStats.map {
            (protocol: $0.key, successRate: Double($0.value.successes) / Double($0.value.total), attempts: $0.value.total)
        }.sorted { $0.successRate > $1.successRate }
    }

    /// Get success rate by time of day
    func getSuccessRateByTimeOfDay() -> [(timeOfDay: String, successRate: Double)] {
        var timeStats: [String: (successes: Int, total: Int)] = [:]

        for attempt in recentAttempts {
            let time = attempt.timeOfDay
            let current = timeStats[time] ?? (successes: 0, total: 0)
            timeStats[time] = (
                successes: current.successes + (attempt.success ? 1 : 0),
                total: current.total + 1
            )
        }

        return timeStats.map {
            (timeOfDay: $0.key, successRate: Double($0.value.successes) / Double($0.value.total))
        }.sorted { $0.successRate > $1.successRate }
    }

    /// Export telemetry as JSON
    func exportTelemetry() -> String? {
        let export = TelemetryExport(
            exportDate: Date(),
            attempts: recentAttempts,
            statistics: statistics,
            failurePatterns: getFailurePatterns(),
            protocolStats: getSuccessRateByProtocol(),
            timeStats: getSuccessRateByTimeOfDay()
        )

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted

        guard let data = try? encoder.encode(export),
              let json = String(data: data, encoding: .utf8) else {
            return nil
        }

        return json
    }

    /// Clear all telemetry
    func clearTelemetry() {
        recentAttempts.removeAll()
        statistics = nil
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
        UserDefaults.standard.removeObject(forKey: statisticsKey)
        UserDefaults.standard.set(0, forKey: "obd2_consecutive_failures")
    }

    // MARK: - Private Methods

    private func loadTelemetry() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey),
              let attempts = try? JSONDecoder().decode([ConnectionAttempt].self, from: data) else {
            return
        }
        recentAttempts = attempts
    }

    private func saveTelemetry() {
        guard let data = try? JSONEncoder().encode(recentAttempts) else { return }
        UserDefaults.standard.set(data, forKey: userDefaultsKey)
    }

    private func updateStatistics() {
        guard !recentAttempts.isEmpty else {
            statistics = nil
            return
        }

        let successful = recentAttempts.filter { $0.success }
        let failed = recentAttempts.filter { !$0.success }

        let successRate = Double(successful.count) / Double(recentAttempts.count)

        let connectionTimes = successful.compactMap { $0.connectionTime }
        let avgTime = connectionTimes.isEmpty ? 0 : connectionTimes.reduce(0, +) / Double(connectionTimes.count)

        // Most common failure
        let failureReasons = failed.compactMap { $0.failureReason }
        let mostCommon = failureReasons.reduce(into: [:]) { counts, reason in
            counts[reason, default: 0] += 1
        }.max(by: { $0.value < $1.value })?.key

        // Best protocol
        let protocolSuccessRates = getSuccessRateByProtocol()
        let bestProtocol = protocolSuccessRates.max(by: { $0.successRate < $1.successRate })?.protocol

        // Best time of day
        let timeSuccessRates = getSuccessRateByTimeOfDay()
        let bestTime = timeSuccessRates.max(by: { $0.successRate < $1.successRate })?.timeOfDay

        statistics = ConnectionStatistics(
            totalAttempts: recentAttempts.count,
            successfulConnections: successful.count,
            failedConnections: failed.count,
            successRate: successRate,
            averageConnectionTime: avgTime,
            mostCommonFailure: mostCommon,
            bestProtocol: bestProtocol,
            bestTimeOfDay: bestTime
        )

        // Save statistics
        if let data = try? JSONEncoder().encode(statistics) {
            UserDefaults.standard.set(data, forKey: statisticsKey)
        }
    }

    private func updatePredictionModel() {
        // Update baseline from actual data
        if let stats = statistics, stats.totalAttempts >= 10 {
            predictionModel.baselineSuccessRate = stats.successRate
        }
    }

    private func getConsecutiveFailureCount() -> Int {
        return UserDefaults.standard.integer(forKey: "obd2_consecutive_failures")
    }

    private func getTimeOfDay() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<6: return "Night (12am-6am)"
        case 6..<12: return "Morning (6am-12pm)"
        case 12..<18: return "Afternoon (12pm-6pm)"
        default: return "Evening (6pm-12am)"
        }
    }

    private func getDayOfWeek() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: Date())
    }

    private func getAppVersion() -> String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    }

    // MARK: - Export Type

    struct TelemetryExport: Codable {
        let exportDate: Date
        let attempts: [ConnectionAttempt]
        let statistics: ConnectionStatistics?
        let failurePatterns: [(reason: String, count: Int, percentage: Double)]
        let protocolStats: [(protocol: String, successRate: Double, attempts: Int)]
        let timeStats: [(timeOfDay: String, successRate: Double)]

        private enum CodingKeys: String, CodingKey {
            case exportDate, attempts, statistics, failurePatterns, protocolStats, timeStats
        }

        func encode(to encoder: Encoder) throws {
            var container = encoder.container(keyedBy: CodingKeys.self)
            try container.encode(exportDate, forKey: .exportDate)
            try container.encode(attempts, forKey: .attempts)
            try container.encode(statistics, forKey: .statistics)

            // Encode tuples as dictionaries
            let failurePatternDicts = failurePatterns.map { ["reason": $0.reason, "count": String($0.count), "percentage": String($0.percentage)] }
            try container.encode(failurePatternDicts, forKey: .failurePatterns)

            let protocolStatDicts = protocolStats.map { ["protocol": $0.protocol, "successRate": String($0.successRate), "attempts": String($0.attempts)] }
            try container.encode(protocolStatDicts, forKey: .protocolStats)

            let timeStatDicts = timeStats.map { ["timeOfDay": $0.timeOfDay, "successRate": String($0.successRate)] }
            try container.encode(timeStatDicts, forKey: .timeStats)
        }
    }
}
