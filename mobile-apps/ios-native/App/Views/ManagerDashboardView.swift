//
//  ManagerDashboardView.swift
//  Fleet Manager
//
//  Manager Dashboard - Mobile-First Optimized (No Scrolling)
//

import SwiftUI

struct ManagerDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.verticalSizeClass) var verticalSizeClass

    var body: some View {
        VStack(spacing: 12) {
            // Compact Header
            compactHeader

            // Horizontal Stats Scroll
            horizontalStatsSection

            // Pending Approvals (Limited to 2)
            limitedApprovalsSection

            // Fleet Analytics (Compact)
            compactAnalyticsSection

            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Manager")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: "person.badge.key.fill")
                .font(.system(size: 32))
                .foregroundColor(.purple)
                .frame(width: 50, height: 50)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

            // Welcome Text
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(authManager.currentUser?.name ?? "Manager")
                    .font(.headline)
                    .lineLimit(1)
            }

            Spacer()

            // Quick Approval Badge
            HStack(spacing: 4) {
                Circle()
                    .fill(Color.orange)
                    .frame(width: 8, height: 8)
                Text("8")
                    .font(.caption.bold())
                    .foregroundColor(.orange)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.orange.opacity(0.15))
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
                            title: "Active Vehicles",
                            value: "\(stats.activeVehicles)",
                            subtitle: "of \(stats.totalVehicles) total",
                            icon: "car.fill",
                            color: .blue
                        )

                        CompactStatCard(
                            title: "Today's Trips",
                            value: "\(stats.todayTrips)",
                            subtitle: "\(stats.totalTrips) total",
                            icon: "location.fill",
                            color: .green
                        )

                        CompactStatCard(
                            title: "Approvals",
                            value: "8",
                            subtitle: "Needs review",
                            icon: "checkmark.circle.fill",
                            color: .orange
                        )

                        CompactStatCard(
                            title: "Efficiency",
                            value: "87%",
                            subtitle: "This week",
                            icon: "gauge.medium.fill",
                            color: .purple
                        )
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Limited Approvals
    private var limitedApprovalsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Pending Approvals")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("All Approvals")) {
                    HStack(spacing: 2) {
                        Text("View All (8)")
                            .font(.caption2)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 4)

            VStack(spacing: 8) {
                compactApprovalRow(
                    title: "Maintenance Request",
                    subtitle: "Vehicle #142 - Oil Change",
                    time: "2h ago",
                    type: .maintenance
                )

                compactApprovalRow(
                    title: "Trip Report",
                    subtitle: "John Doe - Downtown Route",
                    time: "4h ago",
                    type: .trip
                )
            }
            .padding(12)
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Approval Type
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

    private func compactApprovalRow(title: String, subtitle: String, time: String, type: ApprovalType) -> some View {
        HStack(spacing: 12) {
            Image(systemName: type.icon)
                .font(.caption)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(type.color)
                .cornerRadius(6)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption.bold())
                    .lineLimit(1)

                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            Text(time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Compact Analytics
    private var compactAnalyticsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Fleet Analytics")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("Detailed Analytics")) {
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
                VStack(spacing: 8) {
                    compactAnalyticsRow(
                        title: "Fleet Utilization",
                        value: stats.fleetUtilization,
                        max: 100,
                        color: .blue
                    )

                    compactAnalyticsRow(
                        title: "Driver Efficiency",
                        value: 85,
                        max: 100,
                        color: .green
                    )

                    compactAnalyticsRow(
                        title: "Fuel Efficiency",
                        value: 72,
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

    private func compactAnalyticsRow(title: String, value: Double, max: Double, color: Color) -> some View {
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
    ManagerDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
