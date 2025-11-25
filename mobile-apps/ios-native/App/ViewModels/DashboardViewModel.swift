//
//  DashboardViewModel.swift
//  Fleet Manager
//
//  High-performance ViewModel for Dashboard with real-time updates
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var stats: DashboardStats?
    @Published var recentActivity: [ActivityItem] = []
    @Published var vehicles: [Vehicle] = []
    @Published var todayTrips: [Trip] = []
    @Published var alerts: [String] = []
    @Published var isLoading: Bool = false
    @Published var isRefreshing: Bool = false

    // MARK: - Private Properties
    private var updateTimer: Timer?

    // MARK: - Initialization
    init() {
        loadData()
        startRealTimeUpdates()
    }

    deinit {
        updateTimer?.invalidate()
    }

    // MARK: - Data Loading
    func loadData() {
        Task {
            await loadDashboardData()
        }
    }

    @MainActor
    private func loadDashboardData() async {
        isLoading = true

        // Simulate background loading with mock data
        try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        // Initialize with empty data - will be populated from API
        vehicles = []
        todayTrips = []
        stats = DashboardStats(
            totalVehicles: 0,
            activeVehicles: 0,
            totalTrips: 0,
            todayTrips: 0,
            alerts: 0,
            avgFuelLevel: 0,
            maintenanceDue: 0,
            totalMileage: 0,
            totalFuelCost: 0,
            fleetUtilization: 0
        )

        // Generate recent activity
        generateRecentActivity()

        // Collect alerts
        alerts = vehicles.flatMap { $0.alerts }.prefix(5).map { String($0) }

        isLoading = false
    }

    private func generateRecentActivity() {
        var activities: [ActivityItem] = []

        // Add recent trip activities - using TripModels.Trip properties
        for trip in todayTrips.prefix(3) {
            activities.append(ActivityItem(
                timestamp: trip.startTime,
                type: trip.status == .completed ? .tripCompleted : .tripStarted,
                title: "Trip \(trip.status == .completed ? "Completed" : "Started")",
                description: "Trip: \(trip.name)",
                vehicleId: trip.vehicleId,
                driverId: trip.driverId
            ))
        }

        // Add maintenance activities
        let maintenanceDue = vehicles.filter { $0.nextService < Date().addingTimeInterval(7 * 24 * 3600) }.prefix(2)
        for vehicle in maintenanceDue {
            activities.append(ActivityItem(
                timestamp: vehicle.nextService,
                type: .maintenanceScheduled,
                title: "Maintenance Due",
                description: "Vehicle \(vehicle.number) - \(vehicle.make) \(vehicle.model)",
                vehicleId: vehicle.id,
                driverId: nil
            ))
        }

        // Add alerts
        for vehicle in vehicles.filter({ !$0.alerts.isEmpty }).prefix(2) {
            if let alert = vehicle.alerts.first {
                activities.append(ActivityItem(
                    timestamp: Date(),
                    type: .alert,
                    title: alert,
                    description: "Vehicle \(vehicle.number)",
                    vehicleId: vehicle.id,
                    driverId: nil
                ))
            }
        }

        // Sort by timestamp
        recentActivity = activities.sorted { $0.timestamp > $1.timestamp }
    }

    // MARK: - Real-time Updates
    private func startRealTimeUpdates() {
        updateTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task { @MainActor in
                await self.updateStats()
            }
        }
    }

    @MainActor
    private func updateStats() async {
        // Simulate real-time updates by slightly modifying values
        guard let currentStats = stats else { return }

        // Randomly update some values to simulate real-time changes
        let activeVehicles = currentStats.activeVehicles + Int.random(in: -2...2)
        let todayTrips = currentStats.todayTrips + Int.random(in: 0...1)
        let alerts = currentStats.alerts + Int.random(in: -1...1)

        stats = DashboardStats(
            totalVehicles: currentStats.totalVehicles,
            activeVehicles: max(0, min(currentStats.totalVehicles, activeVehicles)),
            totalTrips: currentStats.totalTrips + max(0, todayTrips - currentStats.todayTrips),
            todayTrips: max(0, todayTrips),
            alerts: max(0, alerts),
            avgFuelLevel: currentStats.avgFuelLevel + Double.random(in: -1...1),
            maintenanceDue: currentStats.maintenanceDue,
            totalMileage: currentStats.totalMileage + Double.random(in: 0...100),
            totalFuelCost: currentStats.totalFuelCost + Double.random(in: 0...50),
            fleetUtilization: min(100, max(0, currentStats.fleetUtilization + Double.random(in: -2...2)))
        )
    }

    // MARK: - Refresh
    func refresh() async {
        isRefreshing = true
        await loadDashboardData()
        isRefreshing = false
    }

    // MARK: - Quick Actions
    func startNewTrip() {
        // Navigate to trip start view
        print("Starting new trip")
    }

    func viewAllVehicles() {
        // Navigate to vehicles view
        print("Viewing all vehicles")
    }

    func viewReports() {
        // Navigate to reports view
        print("Viewing reports")
    }

    func viewMaintenance() {
        // Navigate to maintenance view
        print("Viewing maintenance")
    }
}