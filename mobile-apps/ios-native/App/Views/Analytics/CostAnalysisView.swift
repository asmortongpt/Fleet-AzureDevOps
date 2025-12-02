//
//  CostAnalysisView.swift
//  Fleet Manager - iOS Native App
//
//  Detailed Cost Analysis and Breakdown
//  Total cost of ownership, cost per mile, maintenance costs
//

import SwiftUI
import Charts

struct CostAnalysisView: View {
    @ObservedObject var viewModel: AnalyticsViewModel
    @State private var selectedCategory: CostCategory = .all

    enum CostCategory: String, CaseIterable {
        case all = "All Categories"
        case maintenance = "Maintenance"
        case fuel = "Fuel"
        case insurance = "Insurance"
        case registration = "Registration"
        case other = "Other"

        var color: Color {
            switch self {
            case .all: return .blue
            case .maintenance: return .orange
            case .fuel: return .green
            case .insurance: return .purple
            case .registration: return .red
            case .other: return .gray
            }
        }

        var icon: String {
            switch self {
            case .all: return "chart.pie.fill"
            case .maintenance: return "wrench.and.screwdriver.fill"
            case .fuel: return "fuelpump.fill"
            case .insurance: return "shield.fill"
            case .registration: return "doc.text.fill"
            case .other: return "ellipsis.circle.fill"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Total Cost Summary
                totalCostSummary

                // Category Selector
                categorySelector

                // Cost Breakdown Chart
                costBreakdownChart

                // Detailed Cost List
                detailedCostList

                // Cost Insights
                costInsights

                // Maintenance Category Breakdown
                if selectedCategory == .all || selectedCategory == .maintenance {
                    maintenanceCategoryBreakdown
                }
            }
            .padding()
        }
        .navigationTitle("Cost Analysis")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Total Cost Summary

    private var totalCostSummary: some View {
        VStack(spacing: 16) {
            if let costs = viewModel.costData {
                // Main Total
                VStack(spacing: 8) {
                    Text("Total Cost")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    Text(costs.formattedTotalCost)
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.primary)

                    Text("For Selected Period")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Divider()

                // Key Metrics
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    CostMetric(
                        title: "Per Vehicle",
                        value: costs.formattedCostPerVehicle,
                        icon: "car.fill",
                        color: .blue
                    )

                    CostMetric(
                        title: "Per Mile",
                        value: viewModel.fleetMetrics?.formattedCostPerMile ?? "$0.00",
                        icon: "location.fill",
                        color: .green
                    )

                    CostMetric(
                        title: "Maintenance",
                        value: String(format: "$%.0f", costs.maintenanceCosts),
                        icon: "wrench.fill",
                        color: .orange
                    )

                    CostMetric(
                        title: "Fuel",
                        value: String(format: "$%.0f", costs.fuelCosts),
                        icon: "fuelpump.fill",
                        color: .green
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Category Selector

    private var categorySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(CostCategory.allCases, id: \.self) { category in
                    Button(action: {
                        withAnimation {
                            selectedCategory = category
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: category.icon)
                                .font(.caption)
                            Text(category.rawValue)
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            selectedCategory == category
                                ? category.color.opacity(0.2)
                                : Color(.systemGray6)
                        )
                        .foregroundColor(
                            selectedCategory == category
                                ? category.color
                                : .primary
                        )
                        .cornerRadius(20)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }

    // MARK: - Cost Breakdown Chart

    private var costBreakdownChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cost Distribution")
                .font(.headline)

            if let costs = viewModel.costData {
                // Donut Chart
                Chart {
                    SectorMark(
                        angle: .value("Cost", costs.maintenanceCosts),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(CostCategory.maintenance.color)
                    .cornerRadius(4)

                    SectorMark(
                        angle: .value("Cost", costs.fuelCosts),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(CostCategory.fuel.color)
                    .cornerRadius(4)

                    SectorMark(
                        angle: .value("Cost", costs.insuranceCosts),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(CostCategory.insurance.color)
                    .cornerRadius(4)

                    SectorMark(
                        angle: .value("Cost", costs.registrationCosts),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(CostCategory.registration.color)
                    .cornerRadius(4)

                    SectorMark(
                        angle: .value("Cost", costs.otherCosts),
                        innerRadius: .ratio(0.5),
                        angularInset: 2
                    )
                    .foregroundStyle(CostCategory.other.color)
                    .cornerRadius(4)
                }
                .frame(height: 250)

                // Center Label
                VStack {
                    Text(costs.formattedTotalCost)
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Total")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Detailed Cost List

    private var detailedCostList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Detailed Breakdown")
                .font(.headline)

            if let costs = viewModel.costData {
                VStack(spacing: 8) {
                    CostRow(
                        category: .maintenance,
                        amount: costs.maintenanceCosts,
                        percentage: costs.maintenanceCosts / costs.totalCost
                    )

                    CostRow(
                        category: .fuel,
                        amount: costs.fuelCosts,
                        percentage: costs.fuelCosts / costs.totalCost
                    )

                    CostRow(
                        category: .insurance,
                        amount: costs.insuranceCosts,
                        percentage: costs.insuranceCosts / costs.totalCost
                    )

                    CostRow(
                        category: .registration,
                        amount: costs.registrationCosts,
                        percentage: costs.registrationCosts / costs.totalCost
                    )

                    CostRow(
                        category: .other,
                        amount: costs.otherCosts,
                        percentage: costs.otherCosts / costs.totalCost
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Cost Insights

    private var costInsights: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Insights & Recommendations")
                .font(.headline)

            if let costs = viewModel.costData {
                VStack(spacing: 8) {
                    // Maintenance cost insight
                    if costs.maintenanceCosts / costs.totalCost > 0.4 {
                        InsightCard(
                            icon: "exclamationmark.triangle.fill",
                            color: .orange,
                            title: "High Maintenance Costs",
                            message: "Maintenance represents \(String(format: "%.0f%%", (costs.maintenanceCosts / costs.totalCost) * 100)) of total costs. Consider preventive maintenance strategies."
                        )
                    }

                    // Fuel cost insight
                    if costs.fuelCosts / costs.totalCost > 0.35 {
                        InsightCard(
                            icon: "fuelpump.fill",
                            color: .green,
                            title: "Fuel Cost Optimization",
                            message: "Fuel costs are high. Consider route optimization and driver training programs."
                        )
                    }

                    // Positive insight
                    if costs.maintenanceCosts / costs.totalCost < 0.25 {
                        InsightCard(
                            icon: "checkmark.circle.fill",
                            color: .green,
                            title: "Well-Maintained Fleet",
                            message: "Low maintenance costs indicate a well-maintained fleet."
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Maintenance Category Breakdown

    private var maintenanceCategoryBreakdown: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Maintenance Cost by Category")
                .font(.headline)

            if let costs = viewModel.costData {
                VStack(spacing: 8) {
                    ForEach(costs.categoryBreakdownSorted, id: \.0) { category, amount in
                        MaintenanceCategoryRow(
                            category: category,
                            amount: amount,
                            totalMaintenance: costs.maintenanceCosts
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Supporting Views

struct CostMetric: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct CostRow: View {
    let category: CostAnalysisView.CostCategory
    let amount: Double
    let percentage: Double

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: category.icon)
                    .foregroundColor(category.color)
                    .frame(width: 24)

                Text(category.rawValue)
                    .font(.subheadline)

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(String(format: "$%.2f", amount))
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text(String(format: "%.1f%%", percentage * 100))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            ProgressView(value: percentage)
                .tint(category.color)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct InsightCard: View {
    let icon: String
    let color: Color
    let title: String
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct MaintenanceCategoryRow: View {
    let category: String
    let amount: Double
    let totalMaintenance: Double

    var percentage: Double {
        totalMaintenance > 0 ? amount / totalMaintenance : 0
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(category)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text(String(format: "$%.2f", amount))
                    .font(.caption)
                    .fontWeight(.semibold)

                Text("(\(String(format: "%.0f%%", percentage * 100)))")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            ProgressView(value: percentage)
                .tint(.orange)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        CostAnalysisView(viewModel: AnalyticsViewModel())
    }
}
