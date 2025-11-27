//
//  ViewerDashboardView.swift
//  Fleet Manager
//
//  Viewer Dashboard - Read-only fleet overview for stakeholders
//

import SwiftUI

struct ViewerDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Welcome Header
                welcomeHeader

                // Overview Stats (Read-Only)
                overviewStatsSection

                // Fleet Summary
                fleetSummarySection

                // Trip Analytics
                tripAnalyticsSection

                // Performance Metrics
                performanceMetricsSection
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Fleet Overview")
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Welcome Header
    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fleet Overview")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(authManager.currentUser?.name ?? "Viewer")
                        .font(.title.bold())
                }
                Spacer()
                Image(systemName: "eye.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.green)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)

            // Read-only notice
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.blue)
                Text("You have read-only access to view fleet data")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
        }
    }

    // MARK: - Overview Stats
    private var overviewStatsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            if let stats = viewModel.stats {
                StatCard(
                    title: "Total Vehicles",
                    value: "\(stats.totalVehicles)",
                    subtitle: "\(stats.activeVehicles) currently active",
                    icon: "car.fill",
                    color: .blue,
                    trend: nil
                )

                StatCard(
                    title: "Active Trips",
                    value: "\(stats.todayTrips)",
                    subtitle: "Currently in progress",
                    icon: "location.fill",
                    color: .green,
                    trend: nil
                )

                StatCard(
                    title: "Fleet Status",
                    value: stats.alerts > 0 ? "Alert" : "Normal",
                    subtitle: stats.alerts > 0 ? "\(stats.alerts) issues" : "All clear",
                    icon: stats.alerts > 0 ? "exclamationmark.triangle.fill" : "checkmark.circle.fill",
                    color: stats.alerts > 0 ? .orange : .green,
                    trend: nil
                )

                StatCard(
                    title: "Avg Fuel",
                    value: String(format: "%.0f%%", stats.avgFuelLevel),
                    subtitle: "Fleet average",
                    icon: "fuelpump.fill",
                    color: .purple,
                    trend: nil
                )
            }
        }
    }

    // MARK: - Fleet Summary
    private var fleetSummarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fleet Summary")
                .font(.headline)

            if let stats = viewModel.stats {
                VStack(spacing: 12) {
                    summaryRow(
                        icon: "car.fill",
                        title: "Total Vehicles",
                        value: "\(stats.totalVehicles)",
                        color: .blue
                    )

                    summaryRow(
                        icon: "checkmark.circle.fill",
                        title: "Active",
                        value: "\(stats.activeVehicles)",
                        color: .green
                    )

                    summaryRow(
                        icon: "pause.circle.fill",
                        title: "Idle",
                        value: "\(stats.totalVehicles - stats.activeVehicles)",
                        color: .orange
                    )

                    summaryRow(
                        icon: "wrench.and.screwdriver.fill",
                        title: "In Maintenance",
                        value: "3",
                        color: .purple
                    )
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    private func summaryRow(icon: String, title: String, value: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 32)

            Text(title)
                .font(.subheadline)

            Spacer()

            Text(value)
                .font(.title3.bold())
                .foregroundColor(color)
        }
    }

    // MARK: - Trip Analytics
    private var tripAnalyticsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Trip Analytics")
                .font(.headline)

            if let stats = viewModel.stats {
                VStack(spacing: 12) {
                    analyticsCard(
                        title: "Today's Trips",
                        value: "\(stats.todayTrips)",
                        subtitle: "Active trips",
                        icon: "location.fill",
                        color: .green
                    )

                    analyticsCard(
                        title: "Total Distance",
                        value: "1,247 mi",
                        subtitle: "This week",
                        icon: "arrow.triangle.turn.up.right.diamond.fill",
                        color: .blue
                    )

                    analyticsCard(
                        title: "Avg Trip Duration",
                        value: "2.3 hrs",
                        subtitle: "Per trip",
                        icon: "clock.fill",
                        color: .orange
                    )
                }
            }
        }
    }

    private func analyticsCard(title: String, value: String, subtitle: String, icon: String, color: Color) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.title2.bold())
                    .foregroundColor(color)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(color.opacity(0.3))
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Performance Metrics
    private var performanceMetricsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Metrics")
                .font(.headline)

            if let stats = viewModel.stats {
                VStack(spacing: 12) {
                    performanceBar(
                        title: "Fleet Utilization",
                        value: stats.fleetUtilization,
                        max: 100,
                        color: .blue
                    )

                    performanceBar(
                        title: "On-Time Performance",
                        value: 92,
                        max: 100,
                        color: .green
                    )

                    performanceBar(
                        title: "Safety Score",
                        value: 88,
                        max: 100,
                        color: .purple
                    )

                    performanceBar(
                        title: "Fuel Efficiency",
                        value: stats.avgFuelLevel,
                        max: 100,
                        color: .orange
                    )
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    private func performanceBar(title: String, value: Double, max: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.subheadline)
                Spacer()
                Text(String(format: "%.1f%%", value))
                    .font(.subheadline.bold())
                    .foregroundColor(color)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray5))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 6)
                        .fill(color)
                        .frame(width: geometry.size.width * (value / max), height: 8)
                        .animation(.easeInOut(duration: 0.3), value: value)
                }
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Preview
#Preview {
    ViewerDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
