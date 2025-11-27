//
//  ManagerDashboardView.swift
//  Fleet Manager
//
//  Manager Dashboard - Fleet analytics, trip approvals, and maintenance oversight
//

import SwiftUI

struct ManagerDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Welcome Header
                welcomeHeader

                // Manager Stats
                managerStatsSection

                // Pending Approvals
                pendingApprovalsSection

                // Fleet Analytics
                fleetAnalyticsSection

                // Maintenance Overview
                maintenanceOverviewSection

                // Recent Activity
                recentActivitySection
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Manager Dashboard")
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Welcome Header
    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back,")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(authManager.currentUser?.name ?? "Manager")
                        .font(.title.bold())
                }
                Spacer()
                Image(systemName: "person.badge.key.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.purple)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Manager Stats
    private var managerStatsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            if let stats = viewModel.stats {
                StatCard(
                    title: "Active Vehicles",
                    value: "\(stats.activeVehicles)",
                    subtitle: "of \(stats.totalVehicles) total",
                    icon: "car.fill",
                    color: .blue,
                    trend: .up(5)
                )

                StatCard(
                    title: "Today's Trips",
                    value: "\(stats.todayTrips)",
                    subtitle: "\(stats.totalTrips) total",
                    icon: "location.fill",
                    color: .green,
                    trend: .up(12)
                )

                StatCard(
                    title: "Pending Approvals",
                    value: "8",
                    subtitle: "Needs review",
                    icon: "checkmark.circle.fill",
                    color: .orange,
                    trend: nil
                )

                StatCard(
                    title: "Fleet Efficiency",
                    value: "87%",
                    subtitle: "This week",
                    icon: "gauge.medium.fill",
                    color: .purple,
                    trend: .up(3)
                )
            }
        }
    }

    // MARK: - Pending Approvals
    private var pendingApprovalsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Pending Approvals")
                    .font(.headline)
                Spacer()
                Text("8 items")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.orange.opacity(0.2))
                    .foregroundColor(.orange)
                    .cornerRadius(8)
            }

            VStack(spacing: 12) {
                approvalCard(
                    title: "Maintenance Request",
                    subtitle: "Vehicle #142 - Oil Change",
                    time: "2 hours ago",
                    type: .maintenance
                )

                approvalCard(
                    title: "Trip Report",
                    subtitle: "John Doe - Downtown Route",
                    time: "4 hours ago",
                    type: .trip
                )

                approvalCard(
                    title: "Expense Report",
                    subtitle: "Fuel Purchase - $245.00",
                    time: "1 day ago",
                    type: .expense
                )
            }
        }
    }

    enum ApprovalType {
        case maintenance, trip, expense

        var icon: String {
            switch self {
            case .maintenance: return "wrench.and.screwdriver.fill"
            case .trip: return "location.fill"
            case .expense: return "dollarsign.circle.fill"
            }
        }

        var color: Color {
            switch self {
            case .maintenance: return .blue
            case .trip: return .green
            case .expense: return .purple
            }
        }
    }

    private func approvalCard(title: String, subtitle: String, time: String, type: ApprovalType) -> some View {
        HStack {
            Circle()
                .fill(type.color.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: type.icon)
                        .foregroundColor(type.color)
                        .font(.caption)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.bold())
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: {}) {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Fleet Analytics
    private var fleetAnalyticsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fleet Analytics")
                .font(.headline)

            if let stats = viewModel.stats {
                VStack(spacing: 12) {
                    analyticsRow(
                        title: "Fleet Utilization",
                        value: stats.fleetUtilization,
                        max: 100,
                        color: .blue
                    )

                    analyticsRow(
                        title: "Driver Efficiency",
                        value: 85,
                        max: 100,
                        color: .green
                    )

                    analyticsRow(
                        title: "Fuel Efficiency",
                        value: 72,
                        max: 100,
                        color: .purple
                    )
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    private func analyticsRow(title: String, value: Double, max: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%.1f%%", value))
                    .font(.caption.bold())
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * (value / max), height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Maintenance Overview
    private var maintenanceOverviewSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Maintenance Overview")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: Text("All Maintenance")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                maintenanceCard(title: "Due Now", count: 5, color: .red, icon: "exclamationmark.triangle.fill")
                maintenanceCard(title: "This Week", count: 12, color: .orange, icon: "calendar.fill")
                maintenanceCard(title: "Scheduled", count: 23, color: .blue, icon: "checkmark.circle.fill")
                maintenanceCard(title: "Completed", count: 87, color: .green, icon: "checkmark.seal.fill")
            }
        }
    }

    private func maintenanceCard(title: String, count: Int, color: Color, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text("\(count)")
                .font(.title.bold())

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Recent Activity
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)

            if viewModel.recentActivity.isEmpty {
                EmptyStateCard(
                    icon: "tray.fill",
                    title: "No Recent Activity",
                    message: "Activity will appear here as it happens"
                )
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.recentActivity.prefix(5)) { activity in
                        ActivityRow(activity: activity)
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }
}

// MARK: - Preview
#Preview {
    ManagerDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
