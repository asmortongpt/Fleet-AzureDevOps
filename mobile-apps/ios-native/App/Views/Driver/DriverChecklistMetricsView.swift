//
//  DriverChecklistMetricsView.swift
//  Fleet Manager
//
//  Shows checklist performance metrics for individual drivers
//

import SwiftUI
import Charts

struct DriverChecklistMetricsView: View {
    let driverId: String
    @StateObject private var analyticsService = ChecklistAnalyticsService.shared
    @State private var metrics: DriverChecklistMetrics?

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                if let metrics = metrics {
                    // Overview Cards
                    overviewCards(metrics: metrics)

                    // Completion Rate Chart
                    completionChart(metrics: metrics)

                    // Recent Checklists
                    recentChecklistsSection(metrics: metrics)
                } else {
                    ProgressView("Loading metrics...")
                }
            }
            .padding()
        }
        .navigationTitle("Checklist Performance")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadMetrics()
        }
    }

    // MARK: - Overview Cards

    private func overviewCards(metrics: DriverChecklistMetrics) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: ModernTheme.Spacing.md) {
            MetricCard(
                title: "Total Assigned",
                value: "\(metrics.totalAssigned)",
                icon: "list.bullet.clipboard",
                color: .blue
            )

            MetricCard(
                title: "Completed",
                value: "\(metrics.completed)",
                icon: "checkmark.circle.fill",
                color: .green
            )

            MetricCard(
                title: "Completion Rate",
                value: String(format: "%.1f%%", metrics.completionRate),
                icon: "chart.bar.fill",
                color: metrics.completionRate >= 90 ? .green : .orange
            )

            MetricCard(
                title: "Compliance Score",
                value: String(format: "%.0f", metrics.complianceScore),
                icon: "shield.checkered",
                color: complianceColor(metrics.complianceScore)
            )

            MetricCard(
                title: "Pending",
                value: "\(metrics.pending)",
                icon: "hourglass",
                color: .orange
            )

            MetricCard(
                title: "Expired",
                value: "\(metrics.expired)",
                icon: "clock.badge.xmark",
                color: .red
            )
        }
    }

    // MARK: - Completion Chart

    private func completionChart(metrics: DriverChecklistMetrics) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Status Breakdown")
                .font(ModernTheme.Typography.headline)

            Chart {
                SectorMark(
                    angle: .value("Count", metrics.completed),
                    innerRadius: .ratio(0.6),
                    angularInset: 1.5
                )
                .foregroundStyle(Color.green)
                .annotation(position: .overlay) {
                    Text("Completed")
                        .font(.caption2)
                        .foregroundColor(.white)
                }

                SectorMark(
                    angle: .value("Count", metrics.pending),
                    innerRadius: .ratio(0.6),
                    angularInset: 1.5
                )
                .foregroundStyle(Color.orange)
                .annotation(position: .overlay) {
                    Text("Pending")
                        .font(.caption2)
                        .foregroundColor(.white)
                }

                if metrics.expired > 0 {
                    SectorMark(
                        angle: .value("Count", metrics.expired),
                        innerRadius: .ratio(0.6),
                        angularInset: 1.5
                    )
                    .foregroundStyle(Color.red)
                    .annotation(position: .overlay) {
                        Text("Expired")
                            .font(.caption2)
                            .foregroundColor(.white)
                    }
                }

                if metrics.skipped > 0 {
                    SectorMark(
                        angle: .value("Count", metrics.skipped),
                        innerRadius: .ratio(0.6),
                        angularInset: 1.5
                    )
                    .foregroundStyle(Color.gray)
                    .annotation(position: .overlay) {
                        Text("Skipped")
                            .font(.caption2)
                            .foregroundColor(.white)
                    }
                }
            }
            .frame(height: 250)
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Recent Checklists

    private func recentChecklistsSection(metrics: DriverChecklistMetrics) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Recent Checklists")
                .font(ModernTheme.Typography.headline)

            if metrics.recentChecklists.isEmpty {
                EmptyStateCard(
                    title: "No Recent Checklists",
                    subtitle: "Checklist activity will appear here"
                )
            } else {
                ForEach(metrics.recentChecklists) { checklist in
                    ChecklistHistoryRow(checklist: checklist)
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func loadMetrics() async {
        if let currentMetrics = analyticsService.currentMetrics {
            self.metrics = currentMetrics.metricsByDriver[driverId]
        } else {
            let updatedMetrics = await analyticsService.calculateMetrics()
            self.metrics = updatedMetrics.metricsByDriver[driverId]
        }
    }

    private func complianceColor(_ score: Double) -> Color {
        if score >= 90 { return .green }
        if score >= 70 { return .orange }
        return .red
    }
}

// MARK: - Checklist History Row

struct ChecklistHistoryRow: View {
    let checklist: ChecklistInstance

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Status Icon
            Circle()
                .fill(statusColor(checklist.status).opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: statusIcon(checklist.status))
                        .foregroundColor(statusColor(checklist.status))
                        .font(.caption)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(checklist.templateName)
                    .font(ModernTheme.Typography.bodyBold)
                    .lineLimit(1)

                Text(checklist.category.rawValue)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                Text(checklist.triggeredAt, style: .relative)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }

            Spacer()

            statusBadge(checklist.status)
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    private func statusIcon(_ status: ChecklistStatus) -> String {
        switch status {
        case .pending: return "hourglass"
        case .active: return "play.circle.fill"
        case .completed: return "checkmark.circle.fill"
        case .expired: return "clock.badge.xmark"
        case .skipped: return "xmark.circle.fill"
        }
    }

    private func statusColor(_ status: ChecklistStatus) -> Color {
        switch status {
        case .pending: return .orange
        case .active: return .blue
        case .completed: return .green
        case .expired: return .red
        case .skipped: return .gray
        }
    }

    private func statusBadge(_ status: ChecklistStatus) -> some View {
        Text(status.rawValue.capitalized)
            .font(ModernTheme.Typography.caption2)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor(status))
            .cornerRadius(6)
    }
}

#if DEBUG
struct DriverChecklistMetricsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DriverChecklistMetricsView(driverId: "driver-123")
        }
    }
}
#endif
