//
//  VehicleChecklistMetricsView.swift
//  Fleet Manager
//
//  Shows checklist history and metrics for individual vehicles
//

import SwiftUI
import Charts

struct VehicleChecklistMetricsView: View {
    let vehicleId: String
    @StateObject private var analyticsService = ChecklistAnalyticsService.shared
    @State private var metrics: VehicleChecklistMetrics?

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                if let metrics = metrics {
                    // Overview Cards
                    overviewCards(metrics: metrics)

                    // Category Distribution
                    categoryDistribution(metrics: metrics)

                    // Last Checklist Info
                    lastChecklistInfo(metrics: metrics)
                } else {
                    ProgressView("Loading metrics...")
                }
            }
            .padding()
        }
        .navigationTitle("Vehicle Checklists")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadMetrics()
        }
    }

    // MARK: - Overview Cards

    private func overviewCards(metrics: VehicleChecklistMetrics) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: ModernTheme.Spacing.md) {
            MetricCard(
                title: "Total Checklists",
                value: "\(metrics.totalChecklists)",
                icon: "list.bullet.clipboard",
                color: .blue
            )

            MetricCard(
                title: "Safety Checks",
                value: "\(metrics.safetyChecklists)",
                icon: "shield.checkered",
                color: .green
            )

            MetricCard(
                title: "Maintenance",
                value: "\(metrics.maintenanceChecklists)",
                icon: "wrench.and.screwdriver.fill",
                color: .orange
            )

            MetricCard(
                title: "Compliance",
                value: String(format: "%.1f%%", metrics.complianceRate),
                icon: "checkmark.shield.fill",
                color: complianceColor(metrics.complianceRate)
            )
        }
    }

    // MARK: - Category Distribution

    private func categoryDistribution(metrics: VehicleChecklistMetrics) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Checklist Types")
                .font(ModernTheme.Typography.headline)

            Chart {
                SectorMark(
                    angle: .value("Count", metrics.safetyChecklists),
                    innerRadius: .ratio(0.6),
                    angularInset: 1.5
                )
                .foregroundStyle(Color.green)
                .annotation(position: .overlay) {
                    VStack {
                        Text("\(metrics.safetyChecklists)")
                            .font(.caption.bold())
                        Text("Safety")
                            .font(.caption2)
                    }
                    .foregroundColor(.white)
                }

                SectorMark(
                    angle: .value("Count", metrics.maintenanceChecklists),
                    innerRadius: .ratio(0.6),
                    angularInset: 1.5
                )
                .foregroundStyle(Color.orange)
                .annotation(position: .overlay) {
                    VStack {
                        Text("\(metrics.maintenanceChecklists)")
                            .font(.caption.bold())
                        Text("Maintenance")
                            .font(.caption2)
                    }
                    .foregroundColor(.white)
                }

                let others = metrics.totalChecklists - metrics.safetyChecklists - metrics.maintenanceChecklists
                if others > 0 {
                    SectorMark(
                        angle: .value("Count", others),
                        innerRadius: .ratio(0.6),
                        angularInset: 1.5
                    )
                    .foregroundStyle(Color.blue)
                    .annotation(position: .overlay) {
                        VStack {
                            Text("\(others)")
                                .font(.caption.bold())
                            Text("Other")
                                .font(.caption2)
                        }
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

    // MARK: - Last Checklist Info

    private func lastChecklistInfo(metrics: VehicleChecklistMetrics) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Last Checklist")
                .font(ModernTheme.Typography.headline)

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    if let lastDate = metrics.lastChecklistDate {
                        Text("Completed")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Text(lastDate, style: .relative)
                            .font(ModernTheme.Typography.bodyBold)

                        Text(lastDate, style: .date)
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    } else {
                        Text("No checklists completed yet")
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 40))
                    .foregroundColor(metrics.lastChecklistDate != nil ? .green : .gray)
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Helper Methods

    private func loadMetrics() async {
        if let currentMetrics = analyticsService.currentMetrics {
            self.metrics = currentMetrics.metricsByVehicle[vehicleId]
        } else {
            let updatedMetrics = await analyticsService.calculateMetrics()
            self.metrics = updatedMetrics.metricsByVehicle[vehicleId]
        }
    }

    private func complianceColor(_ rate: Double) -> Color {
        if rate >= 90 { return .green }
        if rate >= 70 { return .orange }
        return .red
    }
}

#if DEBUG
struct VehicleChecklistMetricsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            VehicleChecklistMetricsView(vehicleId: "vehicle-123")
        }
    }
}
#endif
