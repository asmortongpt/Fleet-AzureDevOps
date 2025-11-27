//
//  AdminDashboardView.swift
//  Fleet Manager
//
//  Administrator Dashboard - Full system access with user management
//

import SwiftUI

struct AdminDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager
    @State private var selectedStatDetail: StatDetailType?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Welcome Header
                welcomeHeader

                // Admin Stats Grid
                adminStatsSection

                // System Health
                systemHealthSection

                // User Management Quick Access
                userManagementSection

                // Fleet Overview
                fleetOverviewSection

                // Recent Activity
                recentActivitySection
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Admin Dashboard")
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
                    Text(authManager.currentUser?.name ?? "Administrator")
                        .font(.title.bold())
                }
                Spacer()
                Image(systemName: "person.badge.shield.checkmark.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.red)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Admin Stats
    private var adminStatsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            if let stats = viewModel.stats {
                StatCard(
                    title: "Total Vehicles",
                    value: "\(stats.totalVehicles)",
                    subtitle: "\(stats.activeVehicles) active",
                    icon: "car.fill",
                    color: .blue,
                    trend: .up(5)
                )

                StatCard(
                    title: "Active Users",
                    value: "24",
                    subtitle: "12 drivers online",
                    icon: "person.3.fill",
                    color: .green,
                    trend: .up(8)
                )

                StatCard(
                    title: "System Alerts",
                    value: "\(stats.alerts)",
                    subtitle: stats.alerts > 0 ? "Needs attention" : "All clear",
                    icon: "exclamationmark.triangle.fill",
                    color: stats.alerts > 0 ? .orange : .gray,
                    trend: stats.alerts > 0 ? .down(2) : nil
                )

                StatCard(
                    title: "Cost Savings",
                    value: "$12.5K",
                    subtitle: "This month",
                    icon: "dollarsign.circle.fill",
                    color: .purple,
                    trend: .up(15)
                )
            }
        }
    }

    // MARK: - System Health
    private var systemHealthSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("System Health")
                .font(.headline)

            VStack(spacing: 12) {
                healthRow(title: "API Status", status: "Operational", color: .green)
                healthRow(title: "Database", status: "Healthy", color: .green)
                healthRow(title: "Azure Services", status: "All Systems Go", color: .green)
                healthRow(title: "Backup Status", status: "Last: 2 hours ago", color: .blue)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    private func healthRow(title: String, status: String, color: Color) -> some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(title)
                .font(.subheadline)
            Spacer()
            Text(status)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - User Management
    private var userManagementSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("User Management")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: Text("Manage Users")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionButton(title: "Add User", icon: "person.badge.plus.fill", color: .blue) {
                    // Add user action
                }
                QuickActionButton(title: "Role Management", icon: "person.2.badge.gearshape.fill", color: .purple) {
                    // Role management
                }
            }
        }
    }

    // MARK: - Fleet Overview
    private var fleetOverviewSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fleet Overview")
                .font(.headline)

            if let stats = viewModel.stats {
                VStack(spacing: 8) {
                    progressBar(title: "Active Trips", value: Double(stats.todayTrips), max: Double(stats.totalVehicles), color: .green)
                    progressBar(title: "Maintenance Due", value: 5, max: Double(stats.totalVehicles), color: .orange)
                    progressBar(title: "Fleet Utilization", value: stats.fleetUtilization, max: 100, color: .blue)
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    private func progressBar(title: String, value: Double, max: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(value))/\(Int(max))")
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

    // MARK: - Recent Activity
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Admin Activity")
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
    AdminDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
