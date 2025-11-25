//
//  ExecutiveSummaryView.swift
//  Fleet Manager
//
//  Text summary with insights
//

import SwiftUI

struct ExecutiveSummaryView: View {
    let summary: DashboardSummary?
    let metrics: ExecutiveMetrics?

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Executive Summary")
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    if let summary = summary {
                        Text(summary.formattedPeriod)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                Image(systemName: "doc.text.fill")
                    .font(.title2)
                    .foregroundColor(ModernTheme.Colors.primary)
            }

            Divider()

            if let summary = summary {
                ScrollView {
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                        // Key Metrics Overview
                        if let metrics = metrics {
                            metricsOverview(metrics)
                        }

                        // Highlights
                        if !summary.highlights.isEmpty {
                            sectionView(
                                title: "Key Highlights",
                                icon: "star.fill",
                                color: ModernTheme.Colors.success,
                                items: summary.highlights
                            )
                        }

                        // Concerns
                        if !summary.concerns.isEmpty {
                            sectionView(
                                title: "Areas of Concern",
                                icon: "exclamationmark.triangle.fill",
                                color: ModernTheme.Colors.warning,
                                items: summary.concerns
                            )
                        }

                        // Recommendations
                        if !summary.recommendations.isEmpty {
                            sectionView(
                                title: "Recommendations",
                                icon: "lightbulb.fill",
                                color: ModernTheme.Colors.info,
                                items: summary.recommendations
                            )
                        }
                    }
                }
            } else {
                loadingState
            }
        }
        .padding(ModernTheme.Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(
                    color: ModernTheme.Shadow.small.color,
                    radius: ModernTheme.Shadow.small.radius,
                    x: ModernTheme.Shadow.small.x,
                    y: ModernTheme.Shadow.small.y
                )
        )
    }

    // MARK: - Metrics Overview
    private func metricsOverview(_ metrics: ExecutiveMetrics) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Fleet Overview")
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(ModernTheme.Colors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: ModernTheme.Spacing.md) {
                metricCard(
                    label: "Total Fleet Value",
                    value: metrics.formattedFleetValue,
                    icon: "dollarsign.circle.fill",
                    color: ModernTheme.Colors.success
                )

                metricCard(
                    label: "Monthly Costs",
                    value: metrics.formattedMonthlyCosts,
                    icon: "chart.line.downtrend.xyaxis",
                    color: ModernTheme.Colors.warning
                )

                metricCard(
                    label: "Utilization Rate",
                    value: metrics.formattedUtilization,
                    icon: "gauge.medium",
                    color: ModernTheme.Colors.info
                )

                metricCard(
                    label: "Compliance Score",
                    value: metrics.formattedComplianceScore,
                    icon: "checkmark.shield.fill",
                    color: ModernTheme.Colors.primary
                )
            }
        }
    }

    private func metricCard(label: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.caption)

                Spacer()
            }

            Text(value)
                .font(ModernTheme.Typography.title3)
                .fontWeight(.bold)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(label)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .lineLimit(1)
        }
        .padding(ModernTheme.Spacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(ModernTheme.Colors.secondaryBackground)
        )
    }

    // MARK: - Section View
    private func sectionView(title: String, icon: String, color: Color, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack(spacing: ModernTheme.Spacing.xs) {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.subheadline)

                Text(title)
                    .font(ModernTheme.Typography.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }

            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    bulletItem(text: item, color: color)
                }
            }
        }
        .padding(ModernTheme.Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(color.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                        .strokeBorder(color.opacity(0.2), lineWidth: 1)
                )
        )
    }

    private func bulletItem(text: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: ModernTheme.Spacing.sm) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
                .padding(.top, 6)

            Text(text)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Loading State
    private var loadingState: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            ProgressView()
                .scaleEffect(1.2)

            Text("Generating summary...")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ModernTheme.Spacing.xxl)
    }
}

// MARK: - Preview
#Preview {
    ExecutiveSummaryView(
        summary: DashboardSummary(
            generatedAt: Date(),
            periodStart: Calendar.current.date(byAdding: .day, value: -30, to: Date())!,
            periodEnd: Date(),
            highlights: [
                "Fleet utilization increased by 8% compared to last month",
                "Fuel efficiency improved to 22.3 MPG fleet average (+1.2 MPG)",
                "Zero critical safety incidents reported this period",
                "Maintenance costs reduced by $12,000 through preventive scheduling"
            ],
            concerns: [
                "Operations department is 15% over budget ($45,000 overage)",
                "3 vehicles require immediate compliance inspections",
                "Average vehicle age has increased to 4.2 years (target: 3.5 years)",
                "2 departments showing declining utilization trends"
            ],
            recommendations: [
                "Approve additional budget allocation for Operations department",
                "Schedule compliance inspections for affected vehicles by end of week",
                "Initiate vehicle replacement planning for aging fleet",
                "Conduct utilization review with underperforming departments"
            ]
        ),
        metrics: ExecutiveMetrics(
            totalFleetValue: 5250000,
            monthlyCosts: 287500,
            utilizationRate: 87.5,
            safetyScore: 92.3,
            complianceScore: 94.5,
            averageVehicleAge: 4.2,
            maintenanceOnTimePercent: 89.0,
            fuelEfficiency: 22.3,
            totalVehicles: 125,
            activeVehicles: 109,
            lastUpdated: Date()
        )
    )
    .padding()
    .background(ModernTheme.Colors.groupedBackground)
}
