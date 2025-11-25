//
//  DashboardView.swift
//  Fleet Manager
//
//  Optimized Dashboard with real-time stats and smooth performance
//

import SwiftUI
import Charts

// MARK: - Activity Types
struct ActivityItem: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ActivityType
    let title: String
    let description: String
    let vehicleId: String?
    let driverId: String?
}

enum ActivityType: String {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case alert = "Alert"
    case incident = "Incident"
}

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var selectedStatDetail: StatDetailType?

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading && viewModel.stats == nil {
                    ProgressView("Loading Dashboard...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    dashboardContent
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.refresh()
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Dashboard Content
    private var dashboardContent: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Stats Grid
                statsSection

                // Quick Actions
                quickActionsSection

                // Fleet Utilization Chart
                if viewModel.stats != nil {
                    utilizationChartSection
                }

                // Recent Activity
                recentActivitySection

                // Alerts Section
                if !viewModel.alerts.isEmpty {
                    alertsSection
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Stats Section
    private var statsSection: some View {
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
                .onTapGesture {
                    selectedStatDetail = .vehicles
                }

                StatCard(
                    title: "Today's Trips",
                    value: "\(stats.todayTrips)",
                    subtitle: "\(stats.totalTrips) total",
                    icon: "location.fill",
                    color: .green,
                    trend: .up(12)
                )
                .onTapGesture {
                    selectedStatDetail = .trips
                }

                StatCard(
                    title: "Alerts",
                    value: "\(stats.alerts)",
                    subtitle: stats.alerts > 0 ? "Action needed" : "All clear",
                    icon: "exclamationmark.triangle.fill",
                    color: stats.alerts > 0 ? .orange : .gray,
                    trend: stats.alerts > 0 ? .down(2) : nil
                )
                .onTapGesture {
                    selectedStatDetail = .alerts
                }

                StatCard(
                    title: "Fuel Level",
                    value: String(format: "%.0f%%", stats.avgFuelLevel),
                    subtitle: "Fleet average",
                    icon: "fuelpump.fill",
                    color: stats.avgFuelLevel < 30 ? .red : .purple,
                    trend: nil
                )
                .onTapGesture {
                    selectedStatDetail = .fuel
                }
            } else {
                ForEach(0..<4) { _ in
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.secondarySystemGroupedBackground))
                        .frame(height: 100)
                        .shimmering()
                }
            }
        }
    }

    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionButton(
                    title: "Start Trip",
                    icon: "play.circle.fill",
                    color: .green
                ) {
                    viewModel.startNewTrip()
                }

                QuickActionButton(
                    title: "View Fleet",
                    icon: "car.2.fill",
                    color: .blue
                ) {
                    viewModel.viewAllVehicles()
                }

                QuickActionButton(
                    title: "Maintenance",
                    icon: "wrench.and.screwdriver.fill",
                    color: .orange
                ) {
                    viewModel.viewMaintenance()
                }

                QuickActionButton(
                    title: "Reports",
                    icon: "chart.bar.doc.horizontal.fill",
                    color: .purple
                ) {
                    viewModel.viewReports()
                }
            }
        }
    }

    // MARK: - Utilization Chart Section
    @ViewBuilder
    private var utilizationChartSection: some View {
        if let stats = viewModel.stats {
            VStack(alignment: .leading, spacing: 12) {
                Text("Fleet Utilization")
                    .font(.headline)

                VStack(spacing: 8) {
                    HStack {
                        Text("Current")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.1f%%", stats.fleetUtilization))
                            .font(.caption.bold())
                    }

                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.systemGray5))
                                .frame(height: 8)

                            RoundedRectangle(cornerRadius: 4)
                                .fill(utilizationColor(for: stats.fleetUtilization))
                                .frame(width: geometry.size.width * (stats.fleetUtilization / 100), height: 8)
                                .animation(.easeInOut(duration: 0.3), value: stats.fleetUtilization)
                        }
                    }
                    .frame(height: 8)

                    HStack {
                        ForEach([("Low", 0.0), ("Optimal", 70.0), ("High", 90.0)], id: \.0) { label, threshold in
                            Text(label)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            if label != "High" {
                                Spacer()
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Recent Activity Section
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Activity")
                    .font(.headline)
                Spacer()
                if !viewModel.recentActivity.isEmpty {
                    Text("View All")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }

            if viewModel.recentActivity.isEmpty {
                EmptyStateCard(
                    title: "No Recent Activity",
                    subtitle: "Activity will appear here as it happens"
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

    // MARK: - Alerts Section
    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Active Alerts")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.alerts.count)")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.orange.opacity(0.2))
                    .foregroundColor(.orange)
                    .cornerRadius(8)
            }

            LazyVStack(spacing: 8) {
                ForEach(viewModel.alerts, id: \.self) { alert in
                    AlertRow(alert: alert)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Helper Methods
    private func utilizationColor(for percentage: Double) -> Color {
        switch percentage {
        case 0..<40: return .red
        case 40..<70: return .orange
        case 70..<90: return .green
        default: return .blue
        }
    }
}

// MARK: - Stat Card Component
struct StatCard: View {
    enum Trend {
        case up(Int)
        case down(Int)
    }

    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    let trend: Trend?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
                if let trend = trend {
                    trendIndicator(trend)
                }
            }

            Text(value)
                .font(.title.bold())
                .foregroundColor(.primary)

            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    @ViewBuilder
    private func trendIndicator(_ trend: Trend) -> some View {
        switch trend {
        case .up(let value):
            HStack(spacing: 2) {
                Image(systemName: "arrow.up.right")
                    .font(.caption2)
                Text("+\(value)%")
                    .font(.caption2.bold())
            }
            .foregroundColor(.green)

        case .down(let value):
            HStack(spacing: 2) {
                Image(systemName: "arrow.down.right")
                    .font(.caption2)
                Text("-\(value)%")
                    .font(.caption2.bold())
            }
            .foregroundColor(.red)
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }
}

// MARK: - Activity Row
struct ActivityRow: View {
    let activity: ActivityItem

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(color(for: activity.type).opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: icon(for: activity.type))
                        .foregroundColor(color(for: activity.type))
                        .font(.caption)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(activity.title)
                    .font(.subheadline.weight(.medium))

                Text(activity.description)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(activity.timestamp, style: .relative)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }

    private func icon(for type: ActivityType) -> String {
        switch type {
        case .tripStarted: return "play.fill"
        case .tripCompleted: return "checkmark.circle.fill"
        case .maintenanceScheduled: return "wrench.fill"
        case .maintenanceCompleted: return "wrench.and.screwdriver.fill"
        case .alert: return "exclamationmark.triangle.fill"
        case .incident: return "exclamationmark.octagon.fill"
        }
    }

    private func color(for type: ActivityType) -> Color {
        switch type {
        case .tripStarted, .tripCompleted: return .green
        case .maintenanceScheduled, .maintenanceCompleted: return .blue
        case .alert: return .orange
        case .incident: return .red
        }
    }
}

// MARK: - Alert Row
struct AlertRow: View {
    let alert: String

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
                .font(.caption)

            Text(alert)
                .font(.subheadline)
                .foregroundColor(.primary)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Empty State Card
struct EmptyStateCard: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundColor(.secondary)

            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Stat Detail Type
enum StatDetailType {
    case vehicles
    case trips
    case alerts
    case fuel
}

// MARK: - Shimmer Modifier
struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    colors: [
                        Color.gray.opacity(0.3),
                        Color.gray.opacity(0.1),
                        Color.gray.opacity(0.3)
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase * 200 - 100)
                .animation(
                    Animation.linear(duration: 1.5)
                        .repeatForever(autoreverses: false),
                    value: phase
                )
            )
            .onAppear {
                phase = 1
            }
    }
}

extension View {
    func shimmering() -> some View {
        modifier(ShimmerModifier())
    }
}

// MARK: - Preview
#Preview {
    DashboardView()
}