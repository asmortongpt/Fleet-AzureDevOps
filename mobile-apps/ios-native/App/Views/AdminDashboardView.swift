//
//  AdminDashboardView.swift
//  Fleet Manager
//
//  Administrator Dashboard - Mobile-First Optimized (No Scrolling)
//

import SwiftUI

struct AdminDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager
    @State private var selectedStatDetail: StatDetailType?
    @Environment(\.verticalSizeClass) var verticalSizeClass

    var body: some View {
        VStack(spacing: 12) {
            // Compact Header + Key Stat
            compactHeader

            // Horizontal Stats Scroll
            horizontalStatsSection

            // System Health (Compact)
            compactSystemHealthSection

            // Recent Activity (Limited to 2 items)
            limitedRecentActivitySection

            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Admin")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: "person.badge.shield.checkmark.fill")
                .font(.system(size: 32))
                .foregroundColor(.red)
                .frame(width: 50, height: 50)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

            // Welcome Text
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(authManager.currentUser?.name ?? "Administrator")
                    .font(.headline)
                    .lineLimit(1)
            }

            Spacer()

            // Quick Admin Action
            NavigationLink(destination: Text("Manage Users")) {
                Image(systemName: "person.2.badge.gearshape")
                    .font(.title3)
                    .foregroundColor(.blue)
                    .frame(width: 44, height: 44)
            }
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
                            title: "Vehicles",
                            value: "\(stats.totalVehicles)",
                            subtitle: "\(stats.activeVehicles) active",
                            icon: "car.fill",
                            color: .blue
                        )

                        CompactStatCard(
                            title: "Users",
                            value: "24",
                            subtitle: "12 online",
                            icon: "person.3.fill",
                            color: .green
                        )

                        CompactStatCard(
                            title: "Alerts",
                            value: "\(stats.alerts)",
                            subtitle: stats.alerts > 0 ? "Active" : "Clear",
                            icon: "exclamationmark.triangle.fill",
                            color: stats.alerts > 0 ? .orange : .gray
                        )

                        CompactStatCard(
                            title: "Savings",
                            value: "$12.5K",
                            subtitle: "This month",
                            icon: "dollarsign.circle.fill",
                            color: .purple
                        )
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Compact System Health
    private var compactSystemHealthSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("System Status")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 6, height: 6)
                    Text("All Systems Operational")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 4)

            HStack(spacing: 12) {
                systemStatusIndicator(title: "API", status: .operational)
                systemStatusIndicator(title: "DB", status: .operational)
                systemStatusIndicator(title: "Azure", status: .operational)
                systemStatusIndicator(title: "Backup", status: .operational)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    private func systemStatusIndicator(title: String, status: SystemStatus) -> some View {
        VStack(spacing: 6) {
            Circle()
                .fill(status.color)
                .frame(width: 12, height: 12)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    enum SystemStatus {
        case operational, warning, error

        var color: Color {
            switch self {
            case .operational: return .green
            case .warning: return .orange
            case .error: return .red
            }
        }
    }

    // MARK: - Limited Recent Activity
    private var limitedRecentActivitySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Recent Activity")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("All Activity")) {
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

            if viewModel.recentActivity.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "tray.fill")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("No Recent Activity")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 24)
                    Spacer()
                }
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.recentActivity.prefix(2)) { activity in
                        CompactActivityRow(activity: activity)
                    }
                }
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
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

// MARK: - Compact Activity Row
struct CompactActivityRow: View {
    let activity: ActivityItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: activity.type.icon)
                .font(.caption)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color(activity.type.color))
                .cornerRadius(6)

            VStack(alignment: .leading, spacing: 2) {
                Text(activity.title)
                    .font(.caption.bold())
                    .lineLimit(1)

                if let description = activity.description {
                    Text(description)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Text(activity.timestamp, style: .relative)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        AdminDashboardView()
            .environmentObject(AuthenticationManager.shared)
    }
}
