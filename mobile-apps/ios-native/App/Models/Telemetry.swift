//
//  Telemetry.swift
//  Fleet Manager
//
//  Telemetry data models for real-time OBD-II monitoring and vehicle diagnostics
//

import Foundation
import SwiftUI

// MARK: - TelemetryData
/// Real-time telemetry data from vehicle sensors
struct TelemetryData: Codable, Identifiable, Equatable {
    let id: UUID
    let vehicleId: String
    let timestamp: Date

    // Speed and distance
    let speed: Double // mph
    let odometer: Double? // miles

    // Engine metrics
    let rpm: Double // revolutions per minute
    let engineLoad: Double? // percentage
    let throttlePosition: Double? // percentage
    let engineTemp: Double // Fahrenheit

    // Fuel metrics
    let fuelLevel: Double // percentage
    let fuelRate: Double? // gallons per hour
    let fuelPressure: Double? // psi

    // Battery and electrical
    let batteryVoltage: Double // volts
    let alternatorVoltage: Double? // volts

    // Air intake
    let intakeTemp: Double? // Fahrenheit
    let intakePressure: Double? // psi
    let maf: Double? // mass air flow - grams/sec

    // Emissions
    let o2Sensor: Double? // voltage
    let catalystTemp: Double? // Fahrenheit

    // Transmission
    let transmissionTemp: Double? // Fahrenheit
    let gearPosition: String? // Current gear

    // Location (optional - may come from GPS)
    let latitude: Double?
    let longitude: Double?
    let altitude: Double? // feet

    // Derived metrics
    var fuelEfficiency: Double? {
        guard let fuelRate = fuelRate, speed > 0, fuelRate > 0 else { return nil }
        return speed / fuelRate // MPG estimate
    }

    var isOverheating: Bool {
        engineTemp > 220 // Over 220°F is concerning
    }

    var isBatteryLow: Bool {
        batteryVoltage < 12.0 // Below 12V is low
    }

    var isHighRPM: Bool {
        rpm > 4000 // Over 4000 RPM is high
    }

    init(
        id: UUID = UUID(),
        vehicleId: String,
        timestamp: Date = Date(),
        speed: Double,
        odometer: Double? = nil,
        rpm: Double,
        engineLoad: Double? = nil,
        throttlePosition: Double? = nil,
        engineTemp: Double,
        fuelLevel: Double,
        fuelRate: Double? = nil,
        fuelPressure: Double? = nil,
        batteryVoltage: Double,
        alternatorVoltage: Double? = nil,
        intakeTemp: Double? = nil,
        intakePressure: Double? = nil,
        maf: Double? = nil,
        o2Sensor: Double? = nil,
        catalystTemp: Double? = nil,
        transmissionTemp: Double? = nil,
        gearPosition: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        altitude: Double? = nil
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.timestamp = timestamp
        self.speed = speed
        self.odometer = odometer
        self.rpm = rpm
        self.engineLoad = engineLoad
        self.throttlePosition = throttlePosition
        self.engineTemp = engineTemp
        self.fuelLevel = fuelLevel
        self.fuelRate = fuelRate
        self.fuelPressure = fuelPressure
        self.batteryVoltage = batteryVoltage
        self.alternatorVoltage = alternatorVoltage
        self.intakeTemp = intakeTemp
        self.intakePressure = intakePressure
        self.maf = maf
        self.o2Sensor = o2Sensor
        self.catalystTemp = catalystTemp
        self.transmissionTemp = transmissionTemp
        self.gearPosition = gearPosition
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
    }
}

// MARK: - DiagnosticTroubleCode (DTC)
/// OBD-II diagnostic trouble codes
struct DiagnosticTroubleCode: Codable, Identifiable, Equatable {
    let id: UUID
    let code: String // e.g., "P0420"
    let description: String
    let severity: DTCSeverity
    let detectedAt: Date
    let clearedAt: Date?
    let vehicleId: String
    let mileageWhenDetected: Double?

    var isActive: Bool {
        clearedAt == nil
    }

    var codeType: DTCType {
        guard let firstChar = code.first else { return .unknown }
        switch firstChar {
        case "P": return .powertrain
        case "C": return .chassis
        case "B": return .body
        case "U": return .network
        default: return .unknown
        }
    }

    init(
        id: UUID = UUID(),
        code: String,
        description: String,
        severity: DTCSeverity,
        detectedAt: Date = Date(),
        clearedAt: Date? = nil,
        vehicleId: String,
        mileageWhenDetected: Double? = nil
    ) {
        self.id = id
        self.code = code
        self.description = description
        self.severity = severity
        self.detectedAt = detectedAt
        self.clearedAt = clearedAt
        self.vehicleId = vehicleId
        self.mileageWhenDetected = mileageWhenDetected
    }
}

// MARK: - DTCSeverity
enum DTCSeverity: String, Codable, CaseIterable {
    case critical = "critical"
    case warning = "warning"
    case info = "info"

    var color: Color {
        switch self {
        case .critical: return .red
        case .warning: return .orange
        case .info: return .blue
        }
    }

    var icon: String {
        switch self {
        case .critical: return "exclamationmark.triangle.fill"
        case .warning: return "exclamationmark.circle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

// MARK: - DTCType
enum DTCType: String {
    case powertrain = "Powertrain"
    case chassis = "Chassis"
    case body = "Body"
    case network = "Network"
    case unknown = "Unknown"
}

// MARK: - VehicleHealth
/// Overall vehicle health assessment
struct VehicleHealth: Codable, Identifiable, Equatable {
    let id: UUID
    let vehicleId: String
    let timestamp: Date

    // Health scores (0-100)
    let overallScore: Double
    let engineHealth: Double
    let transmissionHealth: Double
    let brakesHealth: Double
    let batteryHealth: Double
    let emissionsHealth: Double

    // Component status
    let activeWarnings: Int
    let criticalIssues: Int

    var healthStatus: HealthStatus {
        switch overallScore {
        case 80...100: return .excellent
        case 60..<80: return .good
        case 40..<60: return .fair
        case 20..<40: return .poor
        default: return .critical
        }
    }

    var statusColor: Color {
        healthStatus.color
    }

    init(
        id: UUID = UUID(),
        vehicleId: String,
        timestamp: Date = Date(),
        overallScore: Double,
        engineHealth: Double,
        transmissionHealth: Double,
        brakesHealth: Double,
        batteryHealth: Double,
        emissionsHealth: Double,
        activeWarnings: Int = 0,
        criticalIssues: Int = 0
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.timestamp = timestamp
        self.overallScore = overallScore
        self.engineHealth = engineHealth
        self.transmissionHealth = transmissionHealth
        self.brakesHealth = brakesHealth
        self.batteryHealth = batteryHealth
        self.emissionsHealth = emissionsHealth
        self.activeWarnings = activeWarnings
        self.criticalIssues = criticalIssues
    }
}

// MARK: - HealthStatus
enum HealthStatus: String {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case critical = "Critical"

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .orange
        case .critical: return .red
        }
    }

    var icon: String {
        switch self {
        case .excellent: return "checkmark.circle.fill"
        case .good: return "checkmark.circle"
        case .fair: return "minus.circle"
        case .poor: return "exclamationmark.circle"
        case .critical: return "xmark.circle.fill"
        }
    }
}

// MARK: - TelemetryAlert
/// Real-time alerts based on telemetry data
struct TelemetryAlert: Codable, Identifiable, Equatable {
    let id: UUID
    let vehicleId: String
    let type: AlertType
    let message: String
    let severity: DTCSeverity
    let timestamp: Date
    let value: Double?
    let threshold: Double?
    let isAcknowledged: Bool

    init(
        id: UUID = UUID(),
        vehicleId: String,
        type: AlertType,
        message: String,
        severity: DTCSeverity,
        timestamp: Date = Date(),
        value: Double? = nil,
        threshold: Double? = nil,
        isAcknowledged: Bool = false
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.type = type
        self.message = message
        self.severity = severity
        self.timestamp = timestamp
        self.value = value
        self.threshold = threshold
        self.isAcknowledged = isAcknowledged
    }
}

// MARK: - AlertType
enum AlertType: String, Codable, CaseIterable {
    case lowFuel = "low_fuel"
    case highTemp = "high_temp"
    case checkEngine = "check_engine"
    case batteryLow = "battery_low"
    case tirePressure = "tire_pressure"
    case oilPressure = "oil_pressure"
    case brakeIssue = "brake_issue"
    case transmissionIssue = "transmission_issue"
    case coolantLow = "coolant_low"
    case airbagWarning = "airbag_warning"

    var icon: String {
        switch self {
        case .lowFuel: return "fuelpump.fill"
        case .highTemp: return "thermometer.sun.fill"
        case .checkEngine: return "engine.combustion.fill"
        case .batteryLow: return "battery.25"
        case .tirePressure: return "circle.circle"
        case .oilPressure: return "drop.fill"
        case .brakeIssue: return "exclamationmark.brake"
        case .transmissionIssue: return "gearshape.fill"
        case .coolantLow: return "drop.triangle.fill"
        case .airbagWarning: return "airbag"
        }
    }

    var displayName: String {
        switch self {
        case .lowFuel: return "Low Fuel"
        case .highTemp: return "High Temperature"
        case .checkEngine: return "Check Engine"
        case .batteryLow: return "Low Battery"
        case .tirePressure: return "Tire Pressure"
        case .oilPressure: return "Oil Pressure"
        case .brakeIssue: return "Brake System"
        case .transmissionIssue: return "Transmission"
        case .coolantLow: return "Low Coolant"
        case .airbagWarning: return "Airbag System"
        }
    }
}

// MARK: - OBDData
/// Standard OBD-II PIDs (Parameter IDs)
struct OBDData: Codable, Identifiable, Equatable {
    let id: UUID
    let vehicleId: String
    let timestamp: Date

    // Mode 01 - Current data
    let pid0C: Double? // Engine RPM
    let pid0D: Double? // Vehicle speed
    let pid05: Double? // Engine coolant temperature
    let pid0F: Double? // Intake air temperature
    let pid2F: Double? // Fuel tank level input
    let pid42: Double? // Control module voltage
    let pid04: Double? // Calculated engine load
    let pid11: Double? // Throttle position
    let pid0A: Double? // Fuel pressure
    let pid10: Double? // MAF air flow rate
    let pid14: Double? // O2 Sensor
    let pid3C: Double? // Catalyst temperature
    let pid5C: Double? // Engine oil temperature

    // Calculated values
    var calculatedMPG: Double? {
        guard let speed = pid0D, let maf = pid10, maf > 0 else { return nil }
        // Simplified MPG calculation
        return (speed * 7.718) / maf
    }

    init(
        id: UUID = UUID(),
        vehicleId: String,
        timestamp: Date = Date(),
        pid0C: Double? = nil,
        pid0D: Double? = nil,
        pid05: Double? = nil,
        pid0F: Double? = nil,
        pid2F: Double? = nil,
        pid42: Double? = nil,
        pid04: Double? = nil,
        pid11: Double? = nil,
        pid0A: Double? = nil,
        pid10: Double? = nil,
        pid14: Double? = nil,
        pid3C: Double? = nil,
        pid5C: Double? = nil
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.timestamp = timestamp
        self.pid0C = pid0C
        self.pid0D = pid0D
        self.pid05 = pid05
        self.pid0F = pid0F
        self.pid2F = pid2F
        self.pid42 = pid42
        self.pid04 = pid04
        self.pid11 = pid11
        self.pid0A = pid0A
        self.pid10 = pid10
        self.pid14 = pid14
        self.pid3C = pid3C
        self.pid5C = pid5C
    }
}

// MARK: - Historical Telemetry
/// Telemetry data aggregated over time periods
struct HistoricalTelemetry: Codable, Identifiable {
    let id: UUID
    let vehicleId: String
    let period: TimePeriod
    let startTime: Date
    let endTime: Date

    // Aggregated metrics
    let avgSpeed: Double
    let maxSpeed: Double
    let avgRPM: Double
    let maxRPM: Double
    let avgFuelLevel: Double
    let avgEngineTemp: Double
    let maxEngineTemp: Double
    let avgBatteryVoltage: Double
    let totalDistance: Double
    let totalFuelConsumed: Double?

    var avgMPG: Double? {
        guard let fuelConsumed = totalFuelConsumed, fuelConsumed > 0 else { return nil }
        return totalDistance / fuelConsumed
    }

    init(
        id: UUID = UUID(),
        vehicleId: String,
        period: TimePeriod,
        startTime: Date,
        endTime: Date,
        avgSpeed: Double,
        maxSpeed: Double,
        avgRPM: Double,
        maxRPM: Double,
        avgFuelLevel: Double,
        avgEngineTemp: Double,
        maxEngineTemp: Double,
        avgBatteryVoltage: Double,
        totalDistance: Double,
        totalFuelConsumed: Double? = nil
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.period = period
        self.startTime = startTime
        self.endTime = endTime
        self.avgSpeed = avgSpeed
        self.maxSpeed = maxSpeed
        self.avgRPM = avgRPM
        self.maxRPM = maxRPM
        self.avgFuelLevel = avgFuelLevel
        self.avgEngineTemp = avgEngineTemp
        self.maxEngineTemp = maxEngineTemp
        self.avgBatteryVoltage = avgBatteryVoltage
        self.totalDistance = totalDistance
        self.totalFuelConsumed = totalFuelConsumed
    }
}

// MARK: - TimePeriod
enum TimePeriod: String, Codable, CaseIterable {
    case hour = "hour"
    case day = "day"
    case week = "week"
    case month = "month"

    var displayName: String {
        switch self {
        case .hour: return "Last Hour"
        case .day: return "Last 24 Hours"
        case .week: return "Last Week"
        case .month: return "Last Month"
        }
    }

    var timeInterval: TimeInterval {
        switch self {
        case .hour: return 3600
        case .day: return 86400
        case .week: return 604800
        case .month: return 2592000
        }
    }
}
