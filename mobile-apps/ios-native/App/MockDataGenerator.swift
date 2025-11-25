//
//  MockDataGenerator.swift
//  Fleet Manager
//
//  Mock data generator for development and testing
//

import Foundation

class MockDataGenerator {
    static let shared = MockDataGenerator()

    private init() {}

    // MARK: - Trip Generation
    func generateTrips(count: Int = 10) -> [Trip] {
        return []  // Stub implementation
    }

    // MARK: - Vehicle Generation
    func generateVehicles(count: Int = 20) -> [Vehicle] {
        return []  // Stub implementation
    }

    // MARK: - Maintenance Generation
    func generateMaintenanceRecords(count: Int = 15) -> [MaintenanceRecord] {
        return []  // Stub implementation
    }

    // MARK: - Fuel Generation
    // Note: FuelRecord is defined in FleetModels.swift
    func generateFuelRecords(count: Int = 30) -> [Any] {
        return []  // Stub implementation - returns FuelRecord when needed
    }
}
