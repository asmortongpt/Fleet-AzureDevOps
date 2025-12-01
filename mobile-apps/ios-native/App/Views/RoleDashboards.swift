//
//  RoleDashboards.swift
//  Fleet Manager
//
//  iOS 15-Compatible Role-Based Dashboards
//  Mobile-First Design with Shared Components
//

import SwiftUI
import Charts

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
                            DashboardQuickActionButton(
                                icon: "play.fill",
                                title: viewModel.isOnTrip ? "End Trip" : "Start Trip",
                                subtitle: viewModel.isOnTrip ? "Complete current journey" : "Begin new journey",
                                color: viewModel.isOnTrip ? .red : .green
                            )

                            DashboardQuickActionButton(
                                icon: "exclamationmark.triangle.fill",
                                title: "Report Issue",
                                subtitle: "Report vehicle problem",
                                color: .orange
                            )

                            DashboardQuickActionButton(
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
    @Published var totalVehicles = 24
    @Published var activeVehicles = 18
    @Published var totalUsers = 45
    @Published var activeUsers = 32
    @Published var openIssues = 7
    @Published var criticalIssues = 2
    @Published var fleetEfficiency = 87.5
    @Published var vehicleHealthPercent = 92.0
    @Published var userActivityPercent = 78.0
    @Published var issueResolutionPercent = 85.0
    @Published var recentActivities: [DashboardActivityItem] = [
        DashboardActivityItem(icon: "person.badge.plus", title: "New User Added", subtitle: "John Smith joined as Driver", time: "2m ago", color: .green),
        DashboardActivityItem(icon: "exclamationmark.triangle", title: "Vehicle Issue", subtitle: "FL-001 reported engine warning", time: "15m ago", color: .red),
        DashboardActivityItem(icon: "checkmark.circle", title: "Trip Completed", subtitle: "Route to Tallahassee finished", time: "1h ago", color: .blue)
    ]
}

class ManagerDashboardViewModel: ObservableObject {
    @Published var activeTrips = 12
    @Published var totalTrips = 45
    @Published var pendingApprovals = 3
    @Published var teamMembers = 18
    @Published var onDutyMembers = 14
    @Published var activeAlerts = 2
    @Published var criticalAlerts = 1
    @Published var approvalItems: [ApprovalItem] = [
        ApprovalItem(type: "Leave Request", requester: "Sarah Johnson", details: "Medical appointment - 3 hours", time: "30m ago"),
        ApprovalItem(type: "Vehicle Swap", requester: "Mike Chen", details: "FL-003 → FL-007", time: "1h ago"),
        ApprovalItem(type: "Overtime", requester: "Lisa Davis", details: "Weekend shift coverage", time: "2h ago")
    ]
    @Published var teamActivities: [DashboardActivityItem] = [
        DashboardActivityItem(icon: "figure.walk", title: "Trip Started", subtitle: "Sarah Johnson to Jacksonville", time: "10m ago", color: .blue),
        DashboardActivityItem(icon: "checkmark.circle", title: "Inspection Complete", subtitle: "Mike Chen completed FL-001", time: "45m ago", color: .green)
    ]
}

class DriverDashboardViewModel: ObservableObject {
    @Published var isOnTrip = false
    @Published var currentTripStatus = "Ready"
    @Published var currentTripDetails = "No active trip"
    @Published var distanceToday = 45.3
    @Published var tripsToday = 3
    @Published var hoursToday = 4.5
    @Published var assignedVehicle = "FL-007"
    @Published var vehicleStatus = "Healthy"
    @Published var recentTrips: [TripItem] = [
        TripItem(destination: "Tallahassee Capitol", distance: "12.5 mi", duration: "25 min", time: "2h ago"),
        TripItem(destination: "Leon County Office", distance: "8.3 mi", duration: "18 min", time: "4h ago"),
        TripItem(destination: "FSU Campus", distance: "6.2 mi", duration: "15 min", time: "6h ago")
    ]
}

class ViewerDashboardViewModel: ObservableObject {
    @Published var totalVehicles = 24
    @Published var inUse = 12
    @Published var activeTrips = 12
    @Published var inMaintenance = 3
    @Published var utilization = 75.0
    @Published var availableVehicles = 9
    @Published var outOfService = 0
    @Published var recentUpdates: [DashboardActivityItem] = [
        DashboardActivityItem(icon: "car.fill", title: "Vehicle Status Change", subtitle: "FL-012 now available", time: "5m ago", color: .green),
        DashboardActivityItem(icon: "wrench.fill", title: "Maintenance Scheduled", subtitle: "FL-003 service tomorrow", time: "1h ago", color: .orange),
        DashboardActivityItem(icon: "figure.walk", title: "High Activity Period", subtitle: "12 vehicles currently in use", time: "2h ago", color: .blue)
    ]
}
