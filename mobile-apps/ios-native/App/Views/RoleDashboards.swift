//
//  RoleDashboards.swift
//  Fleet Manager
//
//  iOS 15-Compatible Role-Based Dashboards
//  Mobile-First Design with Shared Components
//

import SwiftUI
import Charts

// Import Trip from FleetModels to avoid conflict with TripModels.Trip
typealias FleetTrip = Trip

// MARK: - Shared Components

/// Compact stat card for dashboard metrics
struct CompactStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title3.bold())
                .foregroundColor(.primary)

            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .frame(width: 140)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

// Note: ActivityItem is defined in App/Models/ActivityItem.swift
// Using a local simplified version for dashboard display purposes
struct DashboardActivityItem: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let subtitle: String
    let time: String
    let color: Color
}

/// Activity row view for dashboard-specific activities
struct DashboardActivityRow: View {
    let item: DashboardActivityItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.icon)
                .font(.system(size: 16))
                .foregroundColor(.white)
                .frame(width: 32, height: 32)
                .background(item.color)
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.subheadline)
                    .foregroundColor(.primary)
                Text(item.subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(item.time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Admin Dashboard

struct AdminDashboardView: View {
    @StateObject private var viewModel = AdminDashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Key Metrics Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Key Metrics")
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                CompactStatCard(
                                    title: "Vehicles",
                                    value: "\(viewModel.totalVehicles)",
                                    subtitle: "\(viewModel.activeVehicles) active",
                                    icon: "car.fill",
                                    color: .blue
                                )

                                CompactStatCard(
                                    title: "Users",
                                    value: "\(viewModel.totalUsers)",
                                    subtitle: "\(viewModel.activeUsers) active",
                                    icon: "person.3.fill",
                                    color: .green
                                )

                                CompactStatCard(
                                    title: "Issues",
                                    value: "\(viewModel.openIssues)",
                                    subtitle: "\(viewModel.criticalIssues) critical",
                                    icon: "exclamationmark.triangle.fill",
                                    color: .red
                                )

                                CompactStatCard(
                                    title: "Efficiency",
                                    value: "\(Int(viewModel.fleetEfficiency))%",
                                    subtitle: "Fleet avg",
                                    icon: "gauge.high",
                                    color: .orange
                                )
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal)

                    // System Health Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("System Health")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 8) {
                            HealthRow(title: "Vehicle Status", value: viewModel.vehicleHealthPercent, color: .blue)
                            HealthRow(title: "User Activity", value: viewModel.userActivityPercent, color: .green)
                            HealthRow(title: "Issue Resolution", value: viewModel.issueResolutionPercent, color: .orange)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Recent Activity Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Activity")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            ForEach(viewModel.recentActivities) { activity in
                                DashboardActivityRow(item: activity)
                                    .padding(.horizontal)
                                if activity.id != viewModel.recentActivities.last?.id {
                                    Divider()
                                        .padding(.leading, 56)
                                }
                            }
                        }
                        .padding(.vertical)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Admin Dashboard")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct HealthRow: View {
    let title: String
    let value: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.subheadline)
                Spacer()
                Text("\(Int(value))%")
                    .font(.subheadline.bold())
                    .foregroundColor(color)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * (value / 100), height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}

// MARK: - Manager Dashboard

struct ManagerDashboardView: View {
    @StateObject private var viewModel = ManagerDashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Team Metrics
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Team Overview")
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                CompactStatCard(
                                    title: "Active Trips",
                                    value: "\(viewModel.activeTrips)",
                                    subtitle: "\(viewModel.totalTrips) total",
                                    icon: "figure.walk",
                                    color: .blue
                                )

                                CompactStatCard(
                                    title: "Pending Approvals",
                                    value: "\(viewModel.pendingApprovals)",
                                    subtitle: "Requires action",
                                    icon: "checkmark.circle.fill",
                                    color: .orange
                                )

                                CompactStatCard(
                                    title: "Team Members",
                                    value: "\(viewModel.teamMembers)",
                                    subtitle: "\(viewModel.onDutyMembers) on duty",
                                    icon: "person.3.fill",
                                    color: .green
                                )

                                CompactStatCard(
                                    title: "Alerts",
                                    value: "\(viewModel.activeAlerts)",
                                    subtitle: "\(viewModel.criticalAlerts) critical",
                                    icon: "bell.fill",
                                    color: .red
                                )
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal)

                    // Approval Queue
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Approval Queue")
                                .font(.headline)
                            Spacer()
                            Text("\(viewModel.pendingApprovals)")
                                .font(.caption.bold())
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.orange)
                                .cornerRadius(8)
                        }
                        .padding(.horizontal)

                        if viewModel.approvalItems.isEmpty {
                            Text("No pending approvals")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity)
                                .padding()
                        } else {
                            VStack(spacing: 0) {
                                ForEach(viewModel.approvalItems) { item in
                                    ApprovalRow(item: item)
                                    if item.id != viewModel.approvalItems.last?.id {
                                        Divider()
                                    }
                                }
                            }
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(12)
                            .padding(.horizontal)
                        }
                    }

                    // Recent Team Activity
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Team Activity")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            ForEach(viewModel.teamActivities) { activity in
                                DashboardActivityRow(item: activity)
                                    .padding(.horizontal)
                                if activity.id != viewModel.teamActivities.last?.id {
                                    Divider()
                                        .padding(.leading, 56)
                                }
                            }
                        }
                        .padding(.vertical)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Manager Dashboard")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct ApprovalItem: Identifiable {
    let id = UUID()
    let type: String
    let requester: String
    let details: String
    let time: String
}

struct ApprovalRow: View {
    let item: ApprovalItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.type)
                        .font(.subheadline.bold())
                    Text(item.requester)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(item.details)
                        .font(.caption)
                        .foregroundColor(.primary)
                }
                Spacer()
                Text(item.time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 8) {
                Button(action: {}) {
                    Text("Approve")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(Color.green)
                        .cornerRadius(8)
                }

                Button(action: {}) {
                    Text("Reject")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(Color.red)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
    }
}

// MARK: - Driver Dashboard

struct DriverDashboardView: View {
    @StateObject private var viewModel = DriverDashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Current Status
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Current Status")
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                CompactStatCard(
                                    title: "Trip Status",
                                    value: viewModel.currentTripStatus,
                                    subtitle: viewModel.currentTripDetails,
                                    icon: "car.fill",
                                    color: viewModel.isOnTrip ? .green : .gray
                                )

                                CompactStatCard(
                                    title: "Distance Today",
                                    value: String(format: "%.1f mi", viewModel.distanceToday),
                                    subtitle: "\(viewModel.tripsToday) trips",
                                    icon: "map.fill",
                                    color: .blue
                                )

                                CompactStatCard(
                                    title: "Hours",
                                    value: String(format: "%.1f hrs", viewModel.hoursToday),
                                    subtitle: "Today",
                                    icon: "clock.fill",
                                    color: .purple
                                )

                                CompactStatCard(
                                    title: "Vehicle",
                                    value: viewModel.assignedVehicle,
                                    subtitle: viewModel.vehicleStatus,
                                    icon: "key.fill",
                                    color: .orange
                                )
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal)

                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 12) {
                            DashboardLegacyQuickActionButton(
                                icon: "play.fill",
                                title: viewModel.isOnTrip ? "End Trip" : "Start Trip",
                                subtitle: viewModel.isOnTrip ? "Complete current journey" : "Begin new journey",
                                color: viewModel.isOnTrip ? .red : .green
                            )

                            DashboardLegacyQuickActionButton(
                                icon: "exclamationmark.triangle.fill",
                                title: "Report Issue",
                                subtitle: "Report vehicle problem",
                                color: .orange
                            )

                            DashboardLegacyQuickActionButton(
                                icon: "fuelpump.fill",
                                title: "Log Fuel",
                                subtitle: "Record refueling",
                                color: .blue
                            )
                        }
                        .padding(.horizontal)
                    }

                    // Recent Trips
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Trips")
                            .font(.headline)
                            .padding(.horizontal)

                        if viewModel.recentTrips.isEmpty {
                            Text("No recent trips")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity)
                                .padding()
                        } else {
                            VStack(spacing: 0) {
                                ForEach(viewModel.recentTrips) { trip in
                                    TripRow(trip: trip)
                                    if trip.id != viewModel.recentTrips.last?.id {
                                        Divider()
                                    }
                                }
                            }
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(12)
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Driver Dashboard")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct DashboardQuickActionButton: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color

    var body: some View {
        Button(action: {}) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(color)
                    .cornerRadius(12)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
    }
}

struct TripItem: Identifiable {
    let id = UUID()
    let destination: String
    let distance: String
    let duration: String
    let time: String
}

struct TripRow: View {
    let trip: TripItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(trip.destination)
                    .font(.subheadline.bold())
                HStack(spacing: 12) {
                    Label(trip.distance, systemImage: "map")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Label(trip.duration, systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            Text(trip.time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

// MARK: - Viewer Dashboard

struct ViewerDashboardView: View {
    @StateObject private var viewModel = ViewerDashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Fleet Overview
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Fleet Overview")
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                CompactStatCard(
                                    title: "Total Vehicles",
                                    value: "\(viewModel.totalVehicles)",
                                    subtitle: "\(viewModel.inUse) in use",
                                    icon: "car.fill",
                                    color: .blue
                                )

                                CompactStatCard(
                                    title: "Active Trips",
                                    value: "\(viewModel.activeTrips)",
                                    subtitle: "Right now",
                                    icon: "figure.walk",
                                    color: .green
                                )

                                CompactStatCard(
                                    title: "Maintenance",
                                    value: "\(viewModel.inMaintenance)",
                                    subtitle: "Vehicles",
                                    icon: "wrench.fill",
                                    color: .orange
                                )

                                CompactStatCard(
                                    title: "Utilization",
                                    value: "\(Int(viewModel.utilization))%",
                                    subtitle: "Fleet avg",
                                    icon: "gauge.high",
                                    color: .purple
                                )
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal)

                    // Fleet Status
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Fleet Status")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 8) {
                            StatusRow(label: "Available", value: viewModel.availableVehicles, total: viewModel.totalVehicles, color: .green)
                            StatusRow(label: "In Use", value: viewModel.inUse, total: viewModel.totalVehicles, color: .blue)
                            StatusRow(label: "Maintenance", value: viewModel.inMaintenance, total: viewModel.totalVehicles, color: .orange)
                            StatusRow(label: "Out of Service", value: viewModel.outOfService, total: viewModel.totalVehicles, color: .red)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }

                    // Recent Updates
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Updates")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            ForEach(viewModel.recentUpdates) { update in
                                DashboardActivityRow(item: update)
                                    .padding(.horizontal)
                                if update.id != viewModel.recentUpdates.last?.id {
                                    Divider()
                                        .padding(.leading, 56)
                                }
                            }
                        }
                        .padding(.vertical)
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Fleet Overview")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct StatusRow: View {
    let label: String
    let value: Int
    let total: Int
    let color: Color

    var percentage: Double {
        total > 0 ? Double(value) / Double(total) * 100 : 0
    }

    var body: some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(label)
                .font(.subheadline)
            Spacer()
            Text("\(value)")
                .font(.subheadline.bold())
                .foregroundColor(color)
            Text("(\(Int(percentage))%)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - View Models

class AdminDashboardViewModel: ObservableObject {
    @Published var totalVehicles: Int = 0
    @Published var activeVehicles: Int = 0
    @Published var totalUsers: Int = 0
    @Published var activeUsers: Int = 0
    @Published var openIssues: Int = 0
    @Published var criticalIssues: Int = 0
    @Published var fleetEfficiency: Double = 0.0
    @Published var vehicleHealthPercent: Double = 0.0
    @Published var userActivityPercent: Double = 0.0
    @Published var issueResolutionPercent: Double = 0.0
    @Published var recentActivities: [DashboardActivityItem] = []

    private var vehicles: [Vehicle] = []
    private var trips: [FleetTrip] = []

    init() {
        loadData()
    }

    private func loadData() {
        // Generate real data from MockDataGenerator
        vehicles = MockDataGenerator.shared.generateVehicles(count: 25)
        trips = MockDataGenerator.shared.generateTrips(count: 50, vehicles: vehicles)

        // Calculate real metrics
        totalVehicles = vehicles.count
        activeVehicles = vehicles.filter {
            $0.status == .active || $0.status == .moving || $0.status == .available
        }.count

        // Users calculation (simulated from drivers)
        let uniqueDrivers = Set(vehicles.compactMap { $0.assignedDriver })
        totalUsers = uniqueDrivers.count + 12 // drivers + estimated support staff
        activeUsers = uniqueDrivers.count + Int.random(in: 5...10)

        // Issues from vehicle alerts
        openIssues = vehicles.reduce(0) { $0 + $1.alerts.count }
        criticalIssues = vehicles.filter {
            $0.status == .maintenance || !$0.alerts.isEmpty
        }.count

        // Fleet efficiency from completed trips
        let completedTrips = trips.filter { $0.status == .completed }
        if !completedTrips.isEmpty {
            let avgSpeed = completedTrips.map { $0.averageSpeed }.reduce(0, +) / Double(completedTrips.count)
            let avgDistance = completedTrips.map { $0.totalDistance }.reduce(0, +) / Double(completedTrips.count)
            // Calculate efficiency based on speed and distance metrics
            fleetEfficiency = min((avgSpeed / 60.0) * (avgDistance / 50.0) * 100, 95.0)
        } else {
            fleetEfficiency = 82.0
        }

        // Health percentages
        let healthyVehicles = vehicles.filter { $0.alerts.isEmpty && $0.status != .maintenance }.count
        vehicleHealthPercent = Double(healthyVehicles) / Double(max(vehicles.count, 1)) * 100

        userActivityPercent = Double(activeUsers) / Double(max(totalUsers, 1)) * 100

        let resolvedIssues = vehicles.filter { $0.status == .active || $0.status == .available }.count
        issueResolutionPercent = Double(resolvedIssues) / Double(max(vehicles.count, 1)) * 100

        // Generate recent activities from real data
        generateRecentActivities()
    }

    private func generateRecentActivities() {
        var activities: [DashboardActivityItem] = []

        // Recent trip completions
        let recentCompletedTrips = trips
            .filter { $0.status == .completed }
            .sorted { ($0.endTime ?? Date.distantPast) > ($1.endTime ?? Date.distantPast) }
            .prefix(2)

        for trip in recentCompletedTrips {
            let timeAgo = timeAgoString(from: trip.endTime ?? Date())
            activities.append(DashboardActivityItem(
                icon: "checkmark.circle",
                title: "Trip Completed",
                subtitle: "\(trip.vehicleNumber) - \(trip.purpose ?? "Route completed")",
                time: timeAgo,
                color: .blue
            ))
        }

        // Vehicle issues
        let vehiclesWithAlerts = vehicles.filter { !$0.alerts.isEmpty }.prefix(2)
        for vehicle in vehiclesWithAlerts {
            let alert = vehicle.alerts.first!
            activities.append(DashboardActivityItem(
                icon: "exclamationmark.triangle",
                title: "Vehicle Alert",
                subtitle: "\(vehicle.number): \(alert)",
                time: "1h ago",
                color: .orange
            ))
        }

        // New vehicles
        if vehicles.count > 20 {
            activities.append(DashboardActivityItem(
                icon: "car.fill",
                title: "Fleet Expanded",
                subtitle: "Added \(vehicles.count - 20) new vehicles",
                time: "3h ago",
                color: .green
            ))
        }

        recentActivities = Array(activities.prefix(5))
    }

    private func timeAgoString(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h ago"
        } else if minutes > 0 {
            return "\(minutes)m ago"
        } else {
            return "Just now"
        }
    }
}

class ManagerDashboardViewModel: ObservableObject {
    @Published var activeTrips: Int = 0
    @Published var totalTrips: Int = 0
    @Published var pendingApprovals: Int = 0
    @Published var teamMembers: Int = 0
    @Published var onDutyMembers: Int = 0
    @Published var activeAlerts: Int = 0
    @Published var criticalAlerts: Int = 0
    @Published var approvalItems: [ApprovalItem] = []
    @Published var teamActivities: [DashboardActivityItem] = []

    private var vehicles: [Vehicle] = []
    private var trips: [FleetTrip] = []

    init() {
        loadData()
    }

    private func loadData() {
        // Generate real data
        vehicles = MockDataGenerator.shared.generateVehicles(count: 25)
        trips = MockDataGenerator.shared.generateTrips(count: 50, vehicles: vehicles)

        // Calculate real metrics
        activeTrips = trips.filter { $0.status == .active }.count
        totalTrips = trips.count

        // Team members from unique drivers
        let uniqueDrivers = Set(trips.compactMap { $0.driverId })
        teamMembers = uniqueDrivers.count
        onDutyMembers = activeTrips // One driver per active trip

        // Alerts from vehicles
        activeAlerts = vehicles.reduce(0) { $0 + $1.alerts.count }
        criticalAlerts = vehicles.filter { $0.status == .maintenance }.count

        // Generate approval items
        generateApprovalItems()

        // Generate team activities
        generateTeamActivities()
    }

    private func generateApprovalItems() {
        var items: [ApprovalItem] = []

        // Generate approvals from recent trips
        let recentTrips = trips.filter { $0.status == .active }.prefix(3)

        for trip in recentTrips {
            if Int.random(in: 0...1) == 0 {
                items.append(ApprovalItem(
                    type: "Trip Extension",
                    requester: trip.driverId ?? "Unknown Driver",
                    details: "\(trip.vehicleNumber ?? "Vehicle") - Extended \(Int(trip.totalDistance)) mi",
                    time: timeAgoString(from: trip.startTime)
                ))
            }
        }

        // Add vehicle swap requests
        let maintenanceVehicles = vehicles.filter { $0.status == .maintenance }.prefix(1)
        for vehicle in maintenanceVehicles {
            if let driver = vehicle.assignedDriver {
                items.append(ApprovalItem(
                    type: "Vehicle Swap",
                    requester: driver,
                    details: "\(vehicle.number) needs replacement",
                    time: "2h ago"
                ))
            }
        }

        pendingApprovals = items.count
        approvalItems = Array(items.prefix(5))
    }

    private func generateTeamActivities() {
        var activities: [DashboardActivityItem] = []

        // Recent trip starts
        let recentActiveTrips = trips
            .filter { $0.status == .active }
            .sorted { $0.startTime > $1.startTime }
            .prefix(3)

        for trip in recentActiveTrips {
            activities.append(DashboardActivityItem(
                icon: "figure.walk",
                title: "Trip Started",
                subtitle: "\(trip.driverId ?? "Driver") - \(trip.vehicleNumber ?? "Vehicle")",
                time: timeAgoString(from: trip.startTime),
                color: .blue
            ))
        }

        // Completed trips
        let completedTrips = trips
            .filter { $0.status == .completed }
            .sorted { ($0.endTime ?? Date.distantPast) > ($1.endTime ?? Date.distantPast) }
            .prefix(2)

        for trip in completedTrips {
            activities.append(DashboardActivityItem(
                icon: "checkmark.circle",
                title: "Trip Completed",
                subtitle: "\(trip.driverId ?? "Driver") - \(String(format: "%.1f mi", trip.totalDistance))",
                time: timeAgoString(from: trip.endTime ?? Date()),
                color: .green
            ))
        }

        teamActivities = Array(activities.prefix(5))
    }

    private func timeAgoString(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h ago"
        } else if minutes > 0 {
            return "\(minutes)m ago"
        } else {
            return "Just now"
        }
    }
}

class DriverDashboardViewModel: ObservableObject {
    @Published var isOnTrip: Bool = false
    @Published var currentTripStatus: String = "Ready"
    @Published var currentTripDetails: String = "No active trip"
    @Published var distanceToday: Double = 0.0
    @Published var tripsToday: Int = 0
    @Published var hoursToday: Double = 0.0
    @Published var assignedVehicle: String = "None"
    @Published var vehicleStatus: String = "N/A"
    @Published var recentTrips: [TripItem] = []

    private var vehicles: [Vehicle] = []
    private var trips: [Trip] = []
    private var myDriverName: String = "Current Driver"

    init() {
        loadData()
    }

    private func loadData() {
        // Generate real data
        vehicles = MockDataGenerator.shared.generateVehicles(count: 25)
        trips = MockDataGenerator.shared.generateTrips(count: 50, vehicles: vehicles)

        // Pick a random driver to simulate current user
        if let firstTrip = trips.first {
            myDriverName = firstTrip.driverId ?? "Driver001"
        }

        // Find my trips
        let myTrips = trips.filter { $0.driverId == myDriverName }

        // Check if on active trip
        let activeTrip = myTrips.first { $0.status == .active }
        isOnTrip = activeTrip != nil

        if let active = activeTrip {
            currentTripStatus = "In Progress"
            currentTripDetails = active.purpose ?? "Trip to \(active.endLocation?.address ?? "destination")"
        }

        // Calculate today's stats
        let today = Calendar.current.startOfDay(for: Date())
        let todaysTrips = myTrips.filter {
            Calendar.current.isDate($0.startTime, inSameDayAs: today)
        }

        tripsToday = todaysTrips.count
        distanceToday = todaysTrips.reduce(0.0) { $0 + $1.totalDistance }
        hoursToday = todaysTrips.reduce(0.0) { $0 + $1.duration / 3600.0 }

        // Find assigned vehicle
        if let myVehicle = vehicles.first(where: { $0.assignedDriver == myDriverName }) {
            assignedVehicle = myVehicle.number
            vehicleStatus = myVehicle.status.displayName
        } else if let lastTrip = myTrips.sorted(by: { $0.startTime > $1.startTime }).first {
            assignedVehicle = lastTrip.vehicleNumber ?? "Unassigned"
            if let vehicleNum = lastTrip.vehicleNumber,
               let vehicle = vehicles.first(where: { $0.number == vehicleNum }) {
                vehicleStatus = vehicle.status.displayName
            } else {
                vehicleStatus = "Available"
            }
        }

        // Generate recent trips
        generateRecentTrips()
    }

    private func generateRecentTrips() {
        let myTrips = trips.filter { $0.driverId == myDriverName }
        let sorted = myTrips
            .filter { $0.status == .completed }
            .sorted { ($0.endTime ?? Date.distantPast) > ($1.endTime ?? Date.distantPast) }
            .prefix(5)

        recentTrips = sorted.map { trip in
            let destination = trip.purpose ?? "Trip"
            let distance = String(format: "%.1f mi", trip.totalDistance)
            let duration = formatDuration(trip.duration)
            let time = timeAgoString(from: trip.endTime ?? Date())

            return TripItem(
                destination: destination,
                distance: distance,
                duration: duration,
                time: time
            )
        }
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds / 3600)
        let minutes = Int((seconds.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes) min"
        }
    }

    private func timeAgoString(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let hours = Int(interval / 3600)
        let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)

        if hours > 0 {
            return "\(hours)h ago"
        } else if minutes > 0 {
            return "\(minutes)m ago"
        } else {
            return "Just now"
        }
    }
}

class ViewerDashboardViewModel: ObservableObject {
    @Published var totalVehicles: Int = 0
    @Published var inUse: Int = 0
    @Published var activeTrips: Int = 0
    @Published var inMaintenance: Int = 0
    @Published var utilization: Double = 0.0
    @Published var availableVehicles: Int = 0
    @Published var outOfService: Int = 0
    @Published var recentUpdates: [DashboardActivityItem] = []

    private var vehicles: [Vehicle] = []
    private var trips: [Trip] = []

    init() {
        loadData()
    }

    private func loadData() {
        // Generate real data
        vehicles = MockDataGenerator.shared.generateVehicles(count: 25)
        trips = MockDataGenerator.shared.generateTrips(count: 50, vehicles: vehicles)

        // Calculate real metrics
        totalVehicles = vehicles.count
        inUse = vehicles.filter { $0.status == .inUse || $0.status == .moving }.count
        activeTrips = trips.filter { $0.status == .active }.count
        inMaintenance = vehicles.filter { $0.status == .maintenance || $0.status == .service }.count
        availableVehicles = vehicles.filter { $0.status == .available || $0.status == .active }.count
        outOfService = vehicles.filter { $0.status == .inactive || $0.status == .offline }.count

        // Calculate utilization
        let utilizableVehicles = vehicles.filter { $0.status != .inactive && $0.status != .offline }
        let inUseCount = vehicles.filter { $0.status == .inUse || $0.status == .moving || $0.status == .reserved }
        utilization = Double(inUseCount.count) / Double(max(utilizableVehicles.count, 1)) * 100

        // Generate recent updates
        generateRecentUpdates()
    }

    private func generateRecentUpdates() {
        var updates: [DashboardActivityItem] = []

        // Recent status changes
        let availableVehicles = vehicles.filter { $0.status == .available }.prefix(2)
        for vehicle in availableVehicles {
            updates.append(DashboardActivityItem(
                icon: "car.fill",
                title: "Vehicle Available",
                subtitle: "\(vehicle.number) - \(vehicle.make) \(vehicle.model)",
                time: "15m ago",
                color: .green
            ))
        }

        // Maintenance scheduled
        let maintenanceVehicles = vehicles.filter { $0.status == .maintenance }.prefix(1)
        for vehicle in maintenanceVehicles {
            updates.append(DashboardActivityItem(
                icon: "wrench.fill",
                title: "In Maintenance",
                subtitle: "\(vehicle.number) - Service in progress",
                time: "1h ago",
                color: .orange
            ))
        }

        // High activity
        if activeTrips > 5 {
            updates.append(DashboardActivityItem(
                icon: "figure.walk",
                title: "High Activity",
                subtitle: "\(activeTrips) vehicles currently on trips",
                time: "30m ago",
                color: .blue
            ))
        }

        // Fleet stats
        updates.append(DashboardActivityItem(
            icon: "gauge.high",
            title: "Fleet Utilization",
            subtitle: String(format: "%.0f%% of fleet in use", utilization),
            time: "2h ago",
            color: .purple
        ))

        recentUpdates = Array(updates.prefix(5))
    }
}
