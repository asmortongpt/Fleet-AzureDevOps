//
//  ChecklistDashboardWidget.swift
//  Fleet Manager
//
//  Dashboard widget for checklist overview
//

import SwiftUI

struct ChecklistDashboardWidget: View {
    @ObservedObject var analyticsService = ChecklistAnalyticsService.shared

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                Image(systemName: "checklist")
                    .font(.title3)
                    .foregroundColor(ModernTheme.Colors.primary)

                Text("Checklists")
                    .font(ModernTheme.Typography.headline)

                Spacer()

                if let data = analyticsService.dashboardData {
                    let totalBadge = data.pendingCount + data.overdueCount
                    if totalBadge > 0 {
                        Badge(
                            count: totalBadge,
                            color: data.overdueCount > 0 ? .red : .orange
                        )
                    }
                }
            }

            if let data = analyticsService.dashboardData {
                // Stats Row
                HStack(spacing: ModernTheme.Spacing.lg) {
                    ChecklistStatColumn(
                        value: "\(data.pendingCount)",
                        label: "Pending",
                        color: .blue
                    )

                    ChecklistStatColumn(
                        value: "\(data.overdueCount)",
                        label: "Overdue",
                        color: .red
                    )

                    ChecklistStatColumn(
                        value: String(format: "%.0f%%", data.completionRateToday),
                        label: "Today",
                        color: .green
                    )
                }

                Divider()

                // Compliance Score
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Compliance Score")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Text(String(format: "%.0f", data.complianceScore))
                            .font(ModernTheme.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(complianceColor(data.complianceScore))
                    }

                    Spacer()

                    // Compliance Badge
                    complianceBadge(data.complianceScore)
                }

                // Recent Violations
                if !data.recentViolations.isEmpty {
                    Divider()

                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                        HStack {
                            Text("Recent Violations")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            Spacer()

                            Text("\(data.recentViolations.count)")
                                .font(ModernTheme.Typography.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.red)
                                .cornerRadius(4)
                        }

                        ForEach(data.recentViolations.prefix(3)) { violation in
                            ViolationMiniRow(violation: violation)
                        }
                    }
                }
            } else {
                // Loading State
                HStack(spacing: ModernTheme.Spacing.lg) {
                    ForEach(0..<3) { _ in
                        ChecklistStatColumn(
                            value: "—",
                            label: "Loading",
                            color: .gray
                        )
                    }
                }
            }

            // Footer Navigation
            Divider()

            NavigationLink(destination: ChecklistManagementView()) {
                HStack {
                    Text("View All Checklists")
                        .font(ModernTheme.Typography.footnote)
                        .foregroundColor(ModernTheme.Colors.primary)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .task {
            await analyticsService.updateDashboardData()
        }
    }

    // MARK: - Helper Views

    private func complianceColor(_ score: Double) -> Color {
        if score >= 90 { return .green }
        if score >= 70 { return .orange }
        return .red
    }

    private func complianceBadge(_ score: Double) -> some View {
        let status = score >= 90 ? "Excellent" : score >= 70 ? "Fair" : "Poor"
        let color = complianceColor(score)

        return Text(status)
            .font(ModernTheme.Typography.caption2)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color)
            .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Stat Column

struct ChecklistStatColumn: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(label)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Violation Mini Row

struct ViolationMiniRow: View {
    let violation: ComplianceViolation

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(severityColor(violation.severity))
                .frame(width: 6, height: 6)

            VStack(alignment: .leading, spacing: 2) {
                Text(violation.violationType.rawValue)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .lineLimit(1)

                Text(violation.driverName)
                    .font(.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                    .lineLimit(1)
            }

            Spacer()

            Text(violation.timestamp, style: .relative)
                .font(.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .padding(.vertical, 4)
    }

    private func severityColor(_ severity: Severity) -> Color {
        switch severity {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

// MARK: - Badge

struct Badge: View {
    let count: Int
    let color: Color

    var body: some View {
        Text("\(count)")
            .font(ModernTheme.Typography.caption2)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color)
            .cornerRadius(10)
    }
}

#if DEBUG
struct ChecklistDashboardWidget_Previews: PreviewProvider {
    static var previews: some View {
        ChecklistDashboardWidget()
            .padding()
            .background(Color(.systemGroupedBackground))
            .previewLayout(.sizeThatFits)
    }
}
#endif
