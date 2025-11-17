//
//  ReportsService.swift
//  Fleet Manager
//
//  Service for generating fleet reports and analytics
//

import Foundation

// MARK: - Report Type
public enum ReportType {
    case fleetUtilization
    case maintenanceSummary
    case fuelUsage
    case tripSummary
    case driverPerformance
    case costAnalysis
}

// MARK: - Fleet Report Model
public struct FleetReport: Identifiable {
    public let id: String
    public let type: ReportType
    public let title: String
    public let generatedDate: Date
    public let data: [String: Any]
    public let summary: String
    public let details: [ReportDetail]

    public init(
        id: String = UUID().uuidString,
        type: ReportType,
        title: String,
        generatedDate: Date = Date(),
        data: [String: Any],
        summary: String,
        details: [ReportDetail] = []
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.generatedDate = generatedDate
        self.data = data
        self.summary = summary
        self.details = details
    }
}

// MARK: - Report Detail
public struct ReportDetail: Identifiable {
    public let id = UUID()
    public let label: String
    public let value: String
    public let icon: String?
    public let trend: TrendIndicator?

    public init(label: String, value: String, icon: String? = nil, trend: TrendIndicator? = nil) {
        self.label = label
        self.value = value
        self.icon = icon
        self.trend = trend
    }
}

// MARK: - Trend Indicator
public enum TrendIndicator {
    case up(Double)
    case down(Double)
    case neutral

    public var icon: String {
        switch self {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .neutral: return "minus"
        }
    }

    public var color: String {
        switch self {
        case .up: return "green"
        case .down: return "red"
        case .neutral: return "gray"
        }
    }
}

// MARK: - Reports Service
@MainActor
public class ReportsService {

    // MARK: - Singleton
    public static let shared = ReportsService()

    private init() {}

    // MARK: - Fleet Utilization Report
    public func generateFleetUtilizationReport(vehicles: [Vehicle], trips: [Trip]) -> FleetReport {
        let totalVehicles = vehicles.count
        let activeVehicles = vehicles.filter { $0.status == .active || $0.status == .moving }.count
        let utilization = totalVehicles > 0 ? Double(activeVehicles) / Double(totalVehicles) * 100 : 0

        let avgMileage = vehicles.isEmpty ? 0 : vehicles.map { $0.mileage }.reduce(0, +) / Double(vehicles.count)
        let totalMileage = vehicles.map { $0.mileage }.reduce(0, +)

        let idleVehicles = vehicles.filter { $0.status == .idle || $0.status == .parked }.count
        let maintenanceVehicles = vehicles.filter { $0.status == .maintenance || $0.status == .service }.count
        let offlineVehicles = vehicles.filter { $0.status == .offline }.count

        let data: [String: Any] = [
            "totalVehicles": totalVehicles,
            "activeVehicles": activeVehicles,
            "utilization": utilization,
            "avgMileage": avgMileage,
            "totalMileage": totalMileage,
            "totalTrips": trips.count,
            "idleVehicles": idleVehicles,
            "maintenanceVehicles": maintenanceVehicles,
            "offlineVehicles": offlineVehicles
        ]

        let details = [
            ReportDetail(
                label: "Fleet Utilization",
                value: String(format: "%.1f%%", utilization),
                icon: "chart.bar.fill",
                trend: utilization > 70 ? .up(utilization) : .down(utilization)
            ),
            ReportDetail(
                label: "Active Vehicles",
                value: "\(activeVehicles)/\(totalVehicles)",
                icon: "car.fill"
            ),
            ReportDetail(
                label: "Total Trips",
                value: "\(trips.count)",
                icon: "location.fill"
            ),
            ReportDetail(
                label: "Average Mileage",
                value: String(format: "%.0f miles", avgMileage),
                icon: "speedometer"
            ),
            ReportDetail(
                label: "Total Fleet Mileage",
                value: String(format: "%.0f miles", totalMileage),
                icon: "road.lanes"
            ),
            ReportDetail(
                label: "Idle Vehicles",
                value: "\(idleVehicles)",
                icon: "pause.circle"
            ),
            ReportDetail(
                label: "In Maintenance",
                value: "\(maintenanceVehicles)",
                icon: "wrench.fill"
            ),
            ReportDetail(
                label: "Offline",
                value: "\(offlineVehicles)",
                icon: "wifi.slash"
            )
        ]

        let summary = """
        Fleet Utilization: \(String(format: "%.1f%%", utilization))
        Active Vehicles: \(activeVehicles) out of \(totalVehicles)
        Total Trips: \(trips.count)
        Average Vehicle Mileage: \(String(format: "%.0f", avgMileage)) miles
        Total Fleet Mileage: \(String(format: "%.0f", totalMileage)) miles
        Idle: \(idleVehicles) | Maintenance: \(maintenanceVehicles) | Offline: \(offlineVehicles)
        """

        return FleetReport(
            type: .fleetUtilization,
            title: "Fleet Utilization Report",
            generatedDate: Date(),
            data: data,
            summary: summary,
            details: details
        )
    }

    // MARK: - Maintenance Summary Report
    public func generateMaintenanceSummary(records: [MaintenanceRecord]) -> FleetReport {
        let completed = records.filter { $0.status == .completed }
        let scheduled = records.filter { $0.status == .scheduled }
        let inProgress = records.filter { $0.status == .inProgress }
        let overdue = records.filter { record in
            guard record.scheduledDate < Date() else { return false }
            return record.status != .completed && record.status != .cancelled
        }

        let totalCost = completed.compactMap { $0.cost }.reduce(0, +)
        let avgCost = completed.isEmpty ? 0 : totalCost / Double(completed.count)

        // Calculate by type
        let preventiveCount = completed.filter { $0.type == .preventive }.count
        let correctiveCount = completed.filter { $0.type == .corrective }.count
        let emergencyCount = completed.filter { $0.type == .emergency }.count

        let data: [String: Any] = [
            "completed": completed.count,
            "scheduled": scheduled.count,
            "inProgress": inProgress.count,
            "overdue": overdue.count,
            "totalCost": totalCost,
            "avgCost": avgCost,
            "preventiveCount": preventiveCount,
            "correctiveCount": correctiveCount,
            "emergencyCount": emergencyCount
        ]

        let details = [
            ReportDetail(
                label: "Completed Services",
                value: "\(completed.count)",
                icon: "checkmark.circle.fill",
                trend: .up(Double(completed.count))
            ),
            ReportDetail(
                label: "Scheduled",
                value: "\(scheduled.count)",
                icon: "calendar"
            ),
            ReportDetail(
                label: "In Progress",
                value: "\(inProgress.count)",
                icon: "clock.fill"
            ),
            ReportDetail(
                label: "Overdue",
                value: "\(overdue.count)",
                icon: "exclamationmark.triangle.fill",
                trend: overdue.count > 0 ? .down(Double(overdue.count)) : .neutral
            ),
            ReportDetail(
                label: "Total Cost",
                value: String(format: "$%.2f", totalCost),
                icon: "dollarsign.circle.fill"
            ),
            ReportDetail(
                label: "Average Cost",
                value: String(format: "$%.2f", avgCost),
                icon: "chart.bar.fill"
            ),
            ReportDetail(
                label: "Preventive",
                value: "\(preventiveCount)",
                icon: "calendar.badge.clock"
            ),
            ReportDetail(
                label: "Corrective",
                value: "\(correctiveCount)",
                icon: "wrench.fill"
            ),
            ReportDetail(
                label: "Emergency",
                value: "\(emergencyCount)",
                icon: "exclamationmark.triangle.fill"
            )
        ]

        let summary = """
        Completed: \(completed.count)
        Scheduled: \(scheduled.count)
        In Progress: \(inProgress.count)
        Overdue: \(overdue.count)
        Total Cost: $\(String(format: "%.2f", totalCost))
        Average Cost: $\(String(format: "%.2f", avgCost))
        Preventive: \(preventiveCount) | Corrective: \(correctiveCount) | Emergency: \(emergencyCount)
        """

        return FleetReport(
            type: .maintenanceSummary,
            title: "Maintenance Summary",
            generatedDate: Date(),
            data: data,
            summary: summary,
            details: details
        )
    }

    // MARK: - Fuel Usage Report
    public func generateFuelUsageReport(vehicles: [Vehicle], trips: [Trip]) -> FleetReport {
        let totalDistance = trips.map { $0.distance }.reduce(0, +)
        let totalFuelUsed = trips.map { $0.fuelUsed }.reduce(0, +)

        // Calculate MPG
        let avgMPG = totalFuelUsed > 0 ? totalDistance / totalFuelUsed : 0

        // Estimate cost (assuming $3.50/gallon average)
        let pricePerGallon = 3.50
        let estimatedCost = totalFuelUsed * pricePerGallon

        // Average fuel level across fleet
        let avgFuelLevel = vehicles.isEmpty ? 0 : vehicles.map { $0.fuelLevel }.reduce(0, +) / Double(vehicles.count) * 100

        // Low fuel vehicles
        let lowFuelVehicles = vehicles.filter { $0.fuelLevel < 0.25 }.count

        // Fuel by type
        let gasolineVehicles = vehicles.filter { $0.fuelType == .gasoline }.count
        let dieselVehicles = vehicles.filter { $0.fuelType == .diesel }.count
        let electricVehicles = vehicles.filter { $0.fuelType == .electric }.count

        let data: [String: Any] = [
            "totalDistance": totalDistance,
            "totalFuelUsed": totalFuelUsed,
            "avgMPG": avgMPG,
            "estimatedCost": estimatedCost,
            "avgFuelLevel": avgFuelLevel,
            "lowFuelVehicles": lowFuelVehicles,
            "gasolineVehicles": gasolineVehicles,
            "dieselVehicles": dieselVehicles,
            "electricVehicles": electricVehicles
        ]

        let details = [
            ReportDetail(
                label: "Total Distance",
                value: String(format: "%.0f miles", totalDistance),
                icon: "road.lanes"
            ),
            ReportDetail(
                label: "Fuel Consumed",
                value: String(format: "%.1f gallons", totalFuelUsed),
                icon: "fuelpump.fill"
            ),
            ReportDetail(
                label: "Average MPG",
                value: String(format: "%.1f mpg", avgMPG),
                icon: "gauge.medium",
                trend: avgMPG > 15 ? .up(avgMPG) : .down(avgMPG)
            ),
            ReportDetail(
                label: "Estimated Cost",
                value: String(format: "$%.2f", estimatedCost),
                icon: "dollarsign.circle.fill"
            ),
            ReportDetail(
                label: "Average Fuel Level",
                value: String(format: "%.0f%%", avgFuelLevel),
                icon: "chart.bar.fill"
            ),
            ReportDetail(
                label: "Low Fuel Alerts",
                value: "\(lowFuelVehicles)",
                icon: "exclamationmark.triangle.fill",
                trend: lowFuelVehicles > 0 ? .down(Double(lowFuelVehicles)) : .neutral
            ),
            ReportDetail(
                label: "Gasoline Vehicles",
                value: "\(gasolineVehicles)",
                icon: "fuelpump"
            ),
            ReportDetail(
                label: "Diesel Vehicles",
                value: "\(dieselVehicles)",
                icon: "fuelpump.fill"
            ),
            ReportDetail(
                label: "Electric Vehicles",
                value: "\(electricVehicles)",
                icon: "bolt.fill"
            )
        ]

        let summary = """
        Total Distance: \(String(format: "%.0f", totalDistance)) miles
        Fuel Consumed: \(String(format: "%.1f", totalFuelUsed)) gallons
        Average MPG: \(String(format: "%.1f", avgMPG))
        Estimated Cost: $\(String(format: "%.2f", estimatedCost))
        Average Fuel Level: \(String(format: "%.0f%%", avgFuelLevel))
        Low Fuel Alerts: \(lowFuelVehicles)
        """

        return FleetReport(
            type: .fuelUsage,
            title: "Fuel Usage Report",
            generatedDate: Date(),
            data: data,
            summary: summary,
            details: details
        )
    }

    // MARK: - Trip Summary Report
    public func generateTripSummary(trips: [Trip]) -> FleetReport {
        let totalTrips = trips.count
        let completedTrips = trips.filter { $0.status == .completed }.count
        let inProgressTrips = trips.filter { $0.status == .inProgress }.count

        let totalDistance = trips.map { $0.distance }.reduce(0, +)
        let avgDistance = trips.isEmpty ? 0 : totalDistance / Double(trips.count)

        let totalDuration = trips.map { $0.duration }.reduce(0, +)
        let avgDuration = trips.isEmpty ? 0 : totalDuration / Double(trips.count)

        let avgSpeed = trips.isEmpty ? 0 : trips.map { $0.averageSpeed }.reduce(0, +) / Double(trips.count)
        let maxSpeed = trips.map { $0.maxSpeed }.max() ?? 0

        // Today's trips
        let calendar = Calendar.current
        let todayTrips = trips.filter { calendar.isDateInToday($0.startTime) }.count

        // This week's trips
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        let weekTrips = trips.filter { $0.startTime >= startOfWeek }.count

        let data: [String: Any] = [
            "totalTrips": totalTrips,
            "completedTrips": completedTrips,
            "inProgressTrips": inProgressTrips,
            "totalDistance": totalDistance,
            "avgDistance": avgDistance,
            "avgDuration": avgDuration,
            "avgSpeed": avgSpeed,
            "maxSpeed": maxSpeed,
            "todayTrips": todayTrips,
            "weekTrips": weekTrips
        ]

        let details = [
            ReportDetail(
                label: "Total Trips",
                value: "\(totalTrips)",
                icon: "location.fill"
            ),
            ReportDetail(
                label: "Completed",
                value: "\(completedTrips)",
                icon: "checkmark.circle.fill"
            ),
            ReportDetail(
                label: "In Progress",
                value: "\(inProgressTrips)",
                icon: "location.fill.viewfinder"
            ),
            ReportDetail(
                label: "Total Distance",
                value: String(format: "%.0f miles", totalDistance),
                icon: "road.lanes"
            ),
            ReportDetail(
                label: "Average Distance",
                value: String(format: "%.1f miles", avgDistance),
                icon: "chart.bar.fill"
            ),
            ReportDetail(
                label: "Average Duration",
                value: formatDuration(avgDuration),
                icon: "clock.fill"
            ),
            ReportDetail(
                label: "Average Speed",
                value: String(format: "%.1f mph", avgSpeed),
                icon: "speedometer"
            ),
            ReportDetail(
                label: "Max Speed",
                value: String(format: "%.1f mph", maxSpeed),
                icon: "gauge.high"
            ),
            ReportDetail(
                label: "Today's Trips",
                value: "\(todayTrips)",
                icon: "calendar"
            ),
            ReportDetail(
                label: "This Week",
                value: "\(weekTrips)",
                icon: "calendar.badge.clock"
            )
        ]

        let summary = """
        Total Trips: \(totalTrips) (\(completedTrips) completed, \(inProgressTrips) in progress)
        Total Distance: \(String(format: "%.0f", totalDistance)) miles
        Average Distance: \(String(format: "%.1f", avgDistance)) miles
        Average Duration: \(formatDuration(avgDuration))
        Average Speed: \(String(format: "%.1f", avgSpeed)) mph
        Today: \(todayTrips) trips | This Week: \(weekTrips) trips
        """

        return FleetReport(
            type: .tripSummary,
            title: "Trip Summary Report",
            generatedDate: Date(),
            data: data,
            summary: summary,
            details: details
        )
    }

    // MARK: - Cost Analysis Report
    public func generateCostAnalysis(vehicles: [Vehicle], trips: [Trip], maintenanceRecords: [MaintenanceRecord]) -> FleetReport {
        // Fuel costs
        let totalFuelUsed = trips.map { $0.fuelUsed }.reduce(0, +)
        let fuelCost = totalFuelUsed * 3.50 // $3.50/gallon

        // Maintenance costs
        let maintenanceCost = maintenanceRecords.compactMap { $0.cost }.reduce(0, +)

        // Total operational cost
        let totalCost = fuelCost + maintenanceCost

        // Cost per vehicle
        let costPerVehicle = vehicles.isEmpty ? 0 : totalCost / Double(vehicles.count)

        // Cost per mile
        let totalMiles = trips.map { $0.distance }.reduce(0, +)
        let costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0

        let data: [String: Any] = [
            "fuelCost": fuelCost,
            "maintenanceCost": maintenanceCost,
            "totalCost": totalCost,
            "costPerVehicle": costPerVehicle,
            "costPerMile": costPerMile
        ]

        let details = [
            ReportDetail(
                label: "Total Operating Cost",
                value: String(format: "$%.2f", totalCost),
                icon: "dollarsign.circle.fill",
                trend: .up(totalCost)
            ),
            ReportDetail(
                label: "Fuel Cost",
                value: String(format: "$%.2f", fuelCost),
                icon: "fuelpump.fill"
            ),
            ReportDetail(
                label: "Maintenance Cost",
                value: String(format: "$%.2f", maintenanceCost),
                icon: "wrench.fill"
            ),
            ReportDetail(
                label: "Cost per Vehicle",
                value: String(format: "$%.2f", costPerVehicle),
                icon: "car.fill"
            ),
            ReportDetail(
                label: "Cost per Mile",
                value: String(format: "$%.2f", costPerMile),
                icon: "road.lanes"
            )
        ]

        let summary = """
        Total Operating Cost: $\(String(format: "%.2f", totalCost))
        Fuel Cost: $\(String(format: "%.2f", fuelCost))
        Maintenance Cost: $\(String(format: "%.2f", maintenanceCost))
        Cost per Vehicle: $\(String(format: "%.2f", costPerVehicle))
        Cost per Mile: $\(String(format: "%.2f", costPerMile))
        """

        return FleetReport(
            type: .costAnalysis,
            title: "Cost Analysis Report",
            generatedDate: Date(),
            data: data,
            summary: summary,
            details: details
        )
    }

    // MARK: - Helper Methods
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        return "\(hours)h \(minutes)m"
    }
}
