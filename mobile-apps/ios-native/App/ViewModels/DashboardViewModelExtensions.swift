/**
 * DashboardViewModelExtensions.swift
 * Fleet Management - Low Fuel Alert Extensions
 *
 * Extensions for DashboardViewModel adding low fuel monitoring and alerts
 */

import Foundation
import UserNotifications

// MARK: - DashboardViewModel Low Fuel Extensions
extension DashboardViewModel {

    /// Check for low fuel vehicles and schedule alerts
    func checkLowFuelVehicles() async {
        // Request notification permission
        let authorized = await NotificationService.shared.requestAuthorization()
        guard authorized else {
            print("⚠️ Notification permission denied for low fuel alerts")
            return
        }

        // Find vehicles with low fuel (< 25%)
        let lowFuelVehicles = vehicles.filter { $0.fuelLevel < 0.25 }

        guard !lowFuelVehicles.isEmpty else {
            print("✅ No low fuel vehicles")
            return
        }

        // Schedule alerts for each low fuel vehicle
        for vehicle in lowFuelVehicles {
            NotificationService.shared.scheduleLowFuelAlert(for: vehicle)
        }

        print("✅ Scheduled low fuel alerts for \(lowFuelVehicles.count) vehicles")
    }

    /// Check for critical fuel levels and schedule urgent alerts
    func checkCriticalFuelLevels() async {
        // Request notification permission
        let authorized = await NotificationService.shared.requestAuthorization()
        guard authorized else {
            print("⚠️ Notification permission denied")
            return
        }

        // Find vehicles with critical fuel (< 10%)
        let criticalFuelVehicles = vehicles.filter { $0.fuelLevel < 0.10 }

        for vehicle in criticalFuelVehicles {
            NotificationService.shared.scheduleLowFuelAlert(for: vehicle)
        }

        if !criticalFuelVehicles.isEmpty {
            print("🚨 CRITICAL: \(criticalFuelVehicles.count) vehicles with very low fuel")
        }
    }

    /// Monitor fleet status and schedule all relevant alerts
    func monitorFleetStatus() async {
        // Check low fuel
        await checkLowFuelVehicles()

        // Check for vehicles with service due soon
        await checkServiceDueVehicles()

        // Check for offline vehicles
        checkOfflineVehicles()

        print("✅ Fleet monitoring complete")
    }

    /// Check for vehicles with service due soon
    private func checkServiceDueVehicles() async {
        // Request notification permission
        let authorized = await NotificationService.shared.requestAuthorization()
        guard authorized else {
            return
        }

        // Find vehicles with alerts (service due indicators)
        let serviceDueVehicles = vehicles.filter { !$0.alerts.isEmpty }

        for vehicle in serviceDueVehicles {
            // Parse next service date from vehicle.nextService string
            // For now, schedule a generic service due alert for 7 days from now
            let dueDate = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
            NotificationService.shared.scheduleServiceDueAlert(
                for: vehicle,
                serviceName: "Scheduled Maintenance",
                dueDate: dueDate
            )
        }

        if !serviceDueVehicles.isEmpty {
            print("✅ Scheduled service alerts for \(serviceDueVehicles.count) vehicles")
        }
    }

    /// Check for offline vehicles
    private func checkOfflineVehicles() {
        let offlineVehicles = vehicles.filter { $0.status == .offline }

        if !offlineVehicles.isEmpty {
            print("⚠️ \(offlineVehicles.count) vehicles are offline")
            // Could schedule notifications for offline vehicles if needed
        }
    }

    /// Get low fuel statistics
    func getLowFuelStats() -> (count: Int, percentage: Double, vehicles: [Vehicle]) {
        let lowFuelVehicles = vehicles.filter { $0.fuelLevel < 0.25 }
        let percentage = vehicles.isEmpty ? 0.0 : (Double(lowFuelVehicles.count) / Double(vehicles.count)) * 100

        return (
            count: lowFuelVehicles.count,
            percentage: percentage,
            vehicles: lowFuelVehicles
        )
    }

    /// Get critical fuel statistics
    func getCriticalFuelStats() -> (count: Int, percentage: Double, vehicles: [Vehicle]) {
        let criticalVehicles = vehicles.filter { $0.fuelLevel < 0.10 }
        let percentage = vehicles.isEmpty ? 0.0 : (Double(criticalVehicles.count) / Double(vehicles.count)) * 100

        return (
            count: criticalVehicles.count,
            percentage: percentage,
            vehicles: criticalVehicles
        )
    }

    /// Get fleet health summary including fuel status
    func getFleetHealthSummary() -> FleetHealthSummary {
        let lowFuel = getLowFuelStats()
        let criticalFuel = getCriticalFuelStats()

        let activeVehicles = vehicles.filter { $0.status == .active || $0.status == .moving }.count
        let maintenanceVehicles = vehicles.filter { $0.status == .maintenance || $0.status == .service }.count
        let offlineVehicles = vehicles.filter { $0.status == .offline }.count

        return FleetHealthSummary(
            totalVehicles: vehicles.count,
            activeVehicles: activeVehicles,
            maintenanceVehicles: maintenanceVehicles,
            offlineVehicles: offlineVehicles,
            lowFuelCount: lowFuel.count,
            criticalFuelCount: criticalFuel.count,
            avgFuelLevel: vehicles.isEmpty ? 0 : vehicles.map { $0.fuelLevel }.reduce(0, +) / Double(vehicles.count)
        )
    }
}

// MARK: - Fleet Health Summary
struct FleetHealthSummary {
    let totalVehicles: Int
    let activeVehicles: Int
    let maintenanceVehicles: Int
    let offlineVehicles: Int
    let lowFuelCount: Int
    let criticalFuelCount: Int
    let avgFuelLevel: Double

    var healthScore: Double {
        guard totalVehicles > 0 else { return 0.0 }

        let activePercentage = Double(activeVehicles) / Double(totalVehicles)
        let fuelHealthPercentage = 1.0 - (Double(lowFuelCount) / Double(totalVehicles))
        let maintenanceHealthPercentage = 1.0 - (Double(maintenanceVehicles) / Double(totalVehicles))

        // Weighted health score
        return (activePercentage * 0.4 + fuelHealthPercentage * 0.3 + maintenanceHealthPercentage * 0.3) * 100
    }

    var statusColor: String {
        switch healthScore {
        case 80...100:
            return "green"
        case 60..<80:
            return "yellow"
        case 40..<60:
            return "orange"
        default:
            return "red"
        }
    }

    var statusText: String {
        switch healthScore {
        case 80...100:
            return "Excellent"
        case 60..<80:
            return "Good"
        case 40..<60:
            return "Fair"
        default:
            return "Needs Attention"
        }
    }
}
