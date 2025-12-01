//
//  ViewerDashboardView.swift
//  Fleet Manager
//
//  Viewer Dashboard - Mobile-First Optimized (No Scrolling)
//

import SwiftUI

struct ViewerDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.verticalSizeClass) var verticalSizeClass

    var body: some View {
        VStack(spacing: 12) {
            // Compact Header with Read-Only Badge
            compactHeader

            // Horizontal Stats Scroll
            horizontalStatsSection

            // Fleet Summary (Compact)
            compactFleetSummarySection

            // Performance Metrics (Compact)
            compactPerformanceSection

            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Overview")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: "eye.fill")
                .font(.system(size: 32))
                .foregroundColor(.green)
                .frame(width: 50, height: 50)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

            // Welcome Text
            VStack(alignment: .leading, spacing: 2) {
                Text("Fleet Overview")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(authManager.currentUser?.name ?? "Viewer")
                    .font(.headline)
                    .lineLimit(1)
            }

            Spacer()

            // Read-Only Badge
            HStack(spacing: 4) {
                Image(systemName: "eye.circle.fill")
                    .font(.caption2)
                Text("View")
                    .font(.caption2.bold())
            }
            .foregroundColor(.blue)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.blue.opacity(0.15))
            .cornerRadius(12)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Horizontal Stats
    private var horizontalStatsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Key Metrics")
                .font(.caption.bold())
                .foregroundColor(.secondary)
                .padding(.leading, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    if let stats = viewModel.stats {
                        CompactStatCard(
                            title: "Total Vehicles",
                            value: "\(stats.totalVehicles)",
                            subtitle: "\(stats.activeVehicles) active",
                            icon: "car.fill",
                            color: .blue
                        )

                        CompactStatCard(
                            title: "Active Trips",
                            value: "\(stats.todayTrips)",
                            subtitle: "In progress",
                            icon: "location.fill",
                            color: .green
                        )

                        CompactStatCard(
                            title: "Fleet Status",
                            value: stats.alerts > 0 ? "Alert" : "Normal",
                            subtitle: stats.alerts > 0 ? "\(stats.alerts) issues" : "All clear",
                            icon: stats.alerts > 0 ? "exclamationmark.triangle.fill" : "checkmark.circle.fill",
                            color: stats.alerts > 0 ? .orange : .green
                        )

                        CompactStatCard(
                            title: "Avg Fuel",
                            value: String(format: "%.0f%%", stats.avgFuelLevel),
                            subtitle: "Fleet average",
                            icon: "fuelpump.fill",
                            color: .purple
                        )
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Compact Fleet Summary
    private var compactFleetSummarySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Fleet Summary")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("Detailed Summary")) {
                    HStack(spacing: 2) {
                        Text("Details")
                            .font(.caption2)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 4)

            if let stats = viewModel.stats {
                HStack(spacing: 8) {
                    compactSummaryCard(
                        icon: "checkmark.circle.fill",
                        title: "Active",
                        value: "\(stats.activeVehicles)",
                        color: .green
                    )

                    compactSummaryCard(
                        icon: "pause.circle.fill",
                        title: "Idle",
                        value: "\(stats.totalVehicles - stats.activeVehicles)",
                        color: .orange
                    )

                    compactSummaryCard(
                        icon: "wrench.fill",
                        title: "Maintenance",
                        value: "3",
                        color: .purple
                    )
                }
            }
        }
    }

    private func compactSummaryCard(icon: String, title: String, value: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.title3.bold())

            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
    }

    // MARK: - Compact Performance
    private var compactPerformanceSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Performance")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("Full Analytics")) {
                    HStack(spacing: 2) {
                        Text("View All")
                            .font(.caption2)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 4)

            if let stats = viewModel.stats {
                VStack(spacing: 8) {
                    compactPerformanceBar(
                        title: "Fleet Utilization",
                        value: stats.fleetUtilization,
                        max: 100,
                        color: .blue
                    )

                    compactPerformanceBar(
                        title: "On-Time",
                        value: 92,
                        max: 100,
                        color: .green
                    )

                    compactPerformanceBar(
                        title: "Safety Score",
                        value: 88,
                        max: 100,
                        color: .purple
                    )
                }
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    private func compactPerformanceBar(title: String, value: Double, max: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%.0f%%", value))
                    .font(.caption.bold())
                    .foregroundColor(color)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(.systemGray5))
                        .frame(height: 5)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: geometry.size.width * (value / max), height: 5)
                }
            }
            .frame(height: 5)
        }
    }
}

// MARK: - Compact Stat Card
struct CompactStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2.bold())

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2.bold())
                    .foregroundColor(.secondary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(width: 140, height: 120)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    ViewerDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
