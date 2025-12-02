//
//  KPICardView.swift
//  Fleet Manager
//
//  Individual KPI card with trend indicator
//

import SwiftUI

struct KPICardView: View {
    let kpi: KPI

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            // Header with category and trend
            HStack {
                Text(kpi.category.rawValue)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .textCase(.uppercase)

                Spacer()

                trendIndicator
            }

            // KPI Name
            Text(kpi.name)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .lineLimit(2)
                .minimumScaleFactor(0.8)

            // Current Value
            HStack(alignment: .firstTextBaseline, spacing: ModernTheme.Spacing.xs) {
                Text(kpi.formattedCurrentValue)
                    .font(ModernTheme.Typography.title2)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .fontWeight(.bold)

                if kpi.percentChange != 0 {
                    Text(kpi.formattedPercentChange)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(percentChangeColor)
                        .padding(.horizontal, ModernTheme.Spacing.xs)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(percentChangeColor.opacity(0.15))
                        )
                }
            }

            // Target and Progress
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                HStack {
                    Text("Target: \(kpi.formattedTargetValue)")
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    Spacer()

                    statusBadge
                }

                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(ModernTheme.Colors.tertiaryBackground)
                            .frame(height: 4)

                        RoundedRectangle(cornerRadius: 2)
                            .fill(progressColor)
                            .frame(width: progressWidth(geometry: geometry), height: 4)
                    }
                }
                .frame(height: 4)
            }
        }
        .padding(ModernTheme.Spacing.md)
        .frame(maxWidth: .infinity)
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
        .overlay(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .strokeBorder(borderColor, lineWidth: 2)
        )
    }

    // MARK: - Computed Properties
    private var trendIndicator: some View {
        HStack(spacing: 2) {
            Image(systemName: trendIcon)
                .font(.caption)
                .foregroundColor(trendColor)
        }
    }

    private var trendIcon: String {
        switch kpi.trend {
        case .up:
            return "arrow.up.right"
        case .down:
            return "arrow.down.right"
        case .stable:
            return "arrow.right"
        }
    }

    private var trendColor: Color {
        switch kpi.trend {
        case .up:
            return kpi.currentValue >= kpi.targetValue ? ModernTheme.Colors.success : ModernTheme.Colors.warning
        case .down:
            return kpi.currentValue <= kpi.targetValue ? ModernTheme.Colors.success : ModernTheme.Colors.warning
        case .stable:
            return ModernTheme.Colors.info
        }
    }

    private var percentChangeColor: Color {
        if kpi.percentChange > 0 {
            return ModernTheme.Colors.success
        } else if kpi.percentChange < 0 {
            return ModernTheme.Colors.error
        } else {
            return ModernTheme.Colors.secondaryText
        }
    }

    private var statusBadge: some View {
        Text(kpi.isOnTarget ? "On Target" : "Off Target")
            .font(ModernTheme.Typography.caption2)
            .foregroundColor(.white)
            .padding(.horizontal, ModernTheme.Spacing.xs)
            .padding(.vertical, 2)
            .background(
                Capsule()
                    .fill(kpi.isOnTarget ? ModernTheme.Colors.success : ModernTheme.Colors.error)
            )
    }

    private var progressColor: Color {
        switch kpi.statusColor {
        case "green":
            return ModernTheme.Colors.success
        case "yellow":
            return ModernTheme.Colors.warning
        case "red":
            return ModernTheme.Colors.error
        default:
            return ModernTheme.Colors.info
        }
    }

    private var borderColor: Color {
        if kpi.isOnTarget {
            return ModernTheme.Colors.success.opacity(0.3)
        } else {
            return ModernTheme.Colors.separator
        }
    }

    private func progressWidth(geometry: GeometryProxy) -> CGFloat {
        guard kpi.targetValue > 0 else { return 0 }
        let progress = min(kpi.currentValue / kpi.targetValue, 1.0)
        return geometry.size.width * progress
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 16) {
        KPICardView(kpi: KPI(
            id: "1",
            name: "Total Fleet Value",
            currentValue: 5250000,
            targetValue: 5000000,
            trend: .up,
            percentChange: 5.2,
            unit: .currency,
            category: .financial,
            priority: 1
        ))

        KPICardView(kpi: KPI(
            id: "2",
            name: "Fleet Utilization Rate",
            currentValue: 87.5,
            targetValue: 90.0,
            trend: .down,
            percentChange: -2.1,
            unit: .percentage,
            category: .operational,
            priority: 2
        ))

        KPICardView(kpi: KPI(
            id: "3",
            name: "Safety Score",
            currentValue: 92.3,
            targetValue: 95.0,
            trend: .stable,
            percentChange: 0.5,
            unit: .decimal,
            category: .safety,
            priority: 1
        ))
    }
    .padding()
    .background(ModernTheme.Colors.groupedBackground)
}
