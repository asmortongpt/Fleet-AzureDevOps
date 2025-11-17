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
final class DashboardViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var stats: DashboardStats?
    @Published var recentActivity: [ActivityItem] = []
    @Published var vehicles: [Vehicle] = []
    @Published var todayTrips: [Trip] = []
    @Published var alerts: [String] = []

    // MARK: - Private Properties
    private let mockData = MockDataGenerator.shared
    private var updateTimer: Timer?

    // MARK: - Initialization
    override init() {
        super.init()
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
        startLoading()

        // Simulate background loading with mock data
        await Task.sleep(100_000_000) // 0.1 seconds

        // Generate mock data
        vehicles = mockData.generateVehicles(count: 25)
        let trips = mockData.generateTrips(count: 50, vehicles: vehicles)
        todayTrips = trips.filter { Calendar.current.isDateInToday($0.startTime) }
        stats = mockData.generateDashboardStats(vehicles: vehicles, trips: trips)

        // Generate recent activity
        generateRecentActivity()

        // Collect alerts
        alerts = vehicles.flatMap { $0.alerts }.prefix(5).map { String($0) }

        // Cache the data
        if let statsData = try? JSONEncoder().encode(stats) {
            cacheObject(statsData as AnyObject, forKey: "dashboard_stats")
        }

        finishLoading()
    }

    private func generateRecentActivity() {
        var activities: [ActivityItem] = []

        // Add recent trip activities
        for trip in todayTrips.prefix(3) {
            activities.append(ActivityItem(
                timestamp: trip.startTime,
                type: trip.status == .completed ? .tripCompleted : .tripStarted,
                title: "Trip \(trip.status == .completed ? "Completed" : "Started")",
                description: "Vehicle \(trip.vehicleNumber) - \(trip.driverName)",
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
    override func refresh() async {
        startRefreshing()
        await loadDashboardData()
        finishRefreshing()
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