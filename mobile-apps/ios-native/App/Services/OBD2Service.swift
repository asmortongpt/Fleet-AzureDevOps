//
//  OBD2Service.swift
//  Fleet Manager
//
//  Simulated OBD2 diagnostics service for vehicle data
//

import Foundation
import Combine

// MARK: - OBD2 Reading Model
public struct OBD2Reading {
    public let timestamp: Date
    public let rpm: Int
    public let speed: Double // mph
    public let engineLoad: Double // percent
    public let coolantTemp: Double // Fahrenheit
    public let throttlePosition: Double // percent
    public let fuelLevel: Double // percent
    public let intakeAirTemp: Double // Fahrenheit
    public let maf: Double // grams/sec (Mass Air Flow)
    public let engineRuntime: TimeInterval // seconds
    public let fuelPressure: Double // psi
    public let batteryVoltage: Double // volts

    public init(
        timestamp: Date = Date(),
        rpm: Int = 0,
        speed: Double = 0,
        engineLoad: Double = 0,
        coolantTemp: Double = 0,
        throttlePosition: Double = 0,
        fuelLevel: Double = 0,
        intakeAirTemp: Double = 0,
        maf: Double = 0,
        engineRuntime: TimeInterval = 0,
        fuelPressure: Double = 0,
        batteryVoltage: Double = 0
    ) {
        self.timestamp = timestamp
        self.rpm = rpm
        self.speed = speed
        self.engineLoad = engineLoad
        self.coolantTemp = coolantTemp
        self.throttlePosition = throttlePosition
        self.fuelLevel = fuelLevel
        self.intakeAirTemp = intakeAirTemp
        self.maf = maf
        self.engineRuntime = engineRuntime
        self.fuelPressure = fuelPressure
        self.batteryVoltage = batteryVoltage
    }
}

// MARK: - OBD2 Diagnostic Trouble Code
public struct DiagnosticTroubleCode {
    public let code: String
    public let description: String
    public let severity: Severity
    public let timestamp: Date

    public enum Severity: String {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
        case critical = "Critical"
    }

    public init(code: String, description: String, severity: Severity, timestamp: Date = Date()) {
        self.code = code
        self.description = description
        self.severity = severity
        self.timestamp = timestamp
    }
}

// MARK: - OBD2 Service
@MainActor
public class OBD2Service: ObservableObject {

    // MARK: - Published Properties
    @Published public var currentReading: OBD2Reading?
    @Published public var isConnected: Bool = false
    @Published public var connectionStatus: String = "Disconnected"
    @Published public var diagnosticCodes: [DiagnosticTroubleCode] = []
    @Published public var readingHistory: [OBD2Reading] = []

    // MARK: - Private Properties
    private var updateTimer: Timer?
    private var simulatedSpeed: Double = 0
    private var simulatedRPM: Int = 800
    private var engineRuntime: TimeInterval = 0
    private let maxHistoryCount = 100

    // MARK: - Singleton
    public static let shared = OBD2Service()

    private init() {}

    // MARK: - Connection Management
    public func connect() {
        isConnected = true
        connectionStatus = "Connected (Simulated)"
        startReading()
        generateDiagnosticCodes()
    }

    public func disconnect() {
        isConnected = false
        connectionStatus = "Disconnected"
        stopReading()
    }

    public func toggleConnection() {
        if isConnected {
            disconnect()
        } else {
            connect()
        }
    }

    // MARK: - Reading Management
    private func startReading() {
        // Simulate readings every 2 seconds
        updateTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.generateSimulatedReading()
            }
        }
    }

    private func stopReading() {
        updateTimer?.invalidate()
        updateTimer = nil
        currentReading = nil
        readingHistory.removeAll()
        engineRuntime = 0
    }

    private func generateSimulatedReading() {
        // Simulate realistic driving conditions
        simulateVehicleMovement()

        let reading = OBD2Reading(
            timestamp: Date(),
            rpm: simulatedRPM,
            speed: simulatedSpeed,
            engineLoad: calculateEngineLoad(),
            coolantTemp: Double.random(in: 180...220),
            throttlePosition: calculateThrottlePosition(),
            fuelLevel: Double.random(in: 20...90),
            intakeAirTemp: Double.random(in: 70...150),
            maf: calculateMAF(),
            engineRuntime: engineRuntime,
            fuelPressure: Double.random(in: 35...65),
            batteryVoltage: Double.random(in: 12.5...14.5)
        )

        currentReading = reading
        addToHistory(reading)
        engineRuntime += 2.0
    }

    private func simulateVehicleMovement() {
        // Simulate realistic speed and RPM changes
        let speedChange = Double.random(in: -5...5)
        simulatedSpeed = max(0, min(75, simulatedSpeed + speedChange))

        // RPM correlates with speed
        if simulatedSpeed < 5 {
            // Idle
            simulatedRPM = Int.random(in: 700...900)
        } else {
            // Driving - RPM proportional to speed with some variance
            let baseRPM = Int(simulatedSpeed * 40) // ~40 RPM per mph
            simulatedRPM = Int.random(in: (baseRPM - 200)...(baseRPM + 200))
            simulatedRPM = max(800, min(4500, simulatedRPM))
        }
    }

    private func calculateEngineLoad() -> Double {
        // Engine load correlates with speed and RPM
        let speedFactor = (simulatedSpeed / 75.0) * 50
        let rpmFactor = (Double(simulatedRPM) / 4500.0) * 50
        return min(100, speedFactor + rpmFactor)
    }

    private func calculateThrottlePosition() -> Double {
        // Throttle position correlates with engine load
        let load = calculateEngineLoad()
        return min(100, load * 1.2 + Double.random(in: -10...10))
    }

    private func calculateMAF() -> Double {
        // Mass air flow correlates with RPM and load
        let rpmFactor = Double(simulatedRPM) / 1000.0
        let loadFactor = calculateEngineLoad() / 100.0
        return max(0.5, min(25, rpmFactor * loadFactor * 3))
    }

    private func addToHistory(_ reading: OBD2Reading) {
        readingHistory.append(reading)
        if readingHistory.count > maxHistoryCount {
            readingHistory.removeFirst()
        }
    }

    // MARK: - Diagnostic Codes
    private func generateDiagnosticCodes() {
        // Simulate some diagnostic trouble codes
        let codes = [
            DiagnosticTroubleCode(
                code: "P0420",
                description: "Catalyst System Efficiency Below Threshold (Bank 1)",
                severity: .medium
            ),
            DiagnosticTroubleCode(
                code: "P0171",
                description: "System Too Lean (Bank 1)",
                severity: .low
            )
        ]

        // Randomly decide if we have any codes
        if Bool.random() {
            diagnosticCodes = codes.filter { _ in Bool.random() }
        } else {
            diagnosticCodes = []
        }
    }

    public func clearDiagnosticCodes() {
        diagnosticCodes.removeAll()
    }

    // MARK: - Statistics
    public func getAverageSpeed() -> Double {
        guard !readingHistory.isEmpty else { return 0 }
        let total = readingHistory.map { $0.speed }.reduce(0, +)
        return total / Double(readingHistory.count)
    }

    public func getAverageRPM() -> Double {
        guard !readingHistory.isEmpty else { return 0 }
        let total = readingHistory.map { Double($0.rpm) }.reduce(0, +)
        return total / Double(readingHistory.count)
    }

    public func getAverageFuelLevel() -> Double {
        guard !readingHistory.isEmpty else { return 0 }
        let total = readingHistory.map { $0.fuelLevel }.reduce(0, +)
        return total / Double(readingHistory.count)
    }

    public func getMaxSpeed() -> Double {
        readingHistory.map { $0.speed }.max() ?? 0
    }

    public func getMaxRPM() -> Int {
        readingHistory.map { $0.rpm }.max() ?? 0
    }

    // MARK: - Health Check
    public func performHealthCheck() -> VehicleHealth {
        guard isConnected, let reading = currentReading else {
            return VehicleHealth(
                overall: .unknown,
                engine: .unknown,
                transmission: .unknown,
                brakes: .unknown,
                battery: .unknown,
                emissions: .unknown
            )
        }

        return VehicleHealth(
            overall: calculateOverallHealth(reading: reading),
            engine: checkEngineHealth(reading: reading),
            transmission: checkTransmissionHealth(reading: reading),
            brakes: .good, // Simulated
            battery: checkBatteryHealth(reading: reading),
            emissions: checkEmissionsHealth(reading: reading)
        )
    }

    private func calculateOverallHealth(reading: OBD2Reading) -> HealthStatus {
        // Simple health calculation based on various parameters
        var score = 100.0

        // Check coolant temperature
        if reading.coolantTemp > 230 {
            score -= 30
        } else if reading.coolantTemp > 220 {
            score -= 10
        }

        // Check battery voltage
        if reading.batteryVoltage < 12.0 {
            score -= 20
        } else if reading.batteryVoltage < 12.5 {
            score -= 10
        }

        // Check diagnostic codes
        score -= Double(diagnosticCodes.count) * 15

        if score >= 90 {
            return .excellent
        } else if score >= 75 {
            return .good
        } else if score >= 50 {
            return .fair
        } else {
            return .poor
        }
    }

    private func checkEngineHealth(reading: OBD2Reading) -> HealthStatus {
        if reading.coolantTemp > 230 || reading.engineLoad > 95 {
            return .poor
        } else if reading.coolantTemp > 220 || reading.engineLoad > 85 {
            return .fair
        } else if reading.coolantTemp > 210 {
            return .good
        } else {
            return .excellent
        }
    }

    private func checkTransmissionHealth(reading: OBD2Reading) -> HealthStatus {
        // Simulated transmission health
        return .good
    }

    private func checkBatteryHealth(reading: OBD2Reading) -> HealthStatus {
        if reading.batteryVoltage < 12.0 {
            return .poor
        } else if reading.batteryVoltage < 12.5 {
            return .fair
        } else if reading.batteryVoltage < 13.0 {
            return .good
        } else {
            return .excellent
        }
    }

    private func checkEmissionsHealth(reading: OBD2Reading) -> HealthStatus {
        if !diagnosticCodes.isEmpty {
            let highSeverity = diagnosticCodes.contains { $0.severity == .high || $0.severity == .critical }
            return highSeverity ? .poor : .fair
        }
        return .excellent
    }
}

// MARK: - Vehicle Health Model
public struct VehicleHealth {
    public let overall: HealthStatus
    public let engine: OBD2HealthStatus
    public let transmission: OBD2HealthStatus
    public let brakes: OBD2HealthStatus
    public let battery: OBD2HealthStatus
    public let emissions: OBD2HealthStatus
}

public enum OBD2HealthStatus: String {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case unknown = "Unknown"

    public var color: String {
        switch self {
        case .excellent: return "green"
        case .good: return "blue"
        case .fair: return "yellow"
        case .poor: return "red"
        case .unknown: return "gray"
        }
    }

    public var icon: String {
        switch self {
        case .excellent: return "checkmark.circle.fill"
        case .good: return "checkmark.circle"
        case .fair: return "exclamationmark.triangle"
        case .poor: return "xmark.circle.fill"
        case .unknown: return "questionmark.circle"
        }
    }
}
