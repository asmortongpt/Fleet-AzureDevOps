//
//  VehicleComparisonView.swift
//  Fleet Manager
//
//  Vehicle Emissions Comparison
//  Compare vehicles by emissions, MPG, and sustainability score
//

import SwiftUI
import Charts

struct VehicleComparisonView: View {
    @StateObject private var viewModel = EnvironmentalImpactViewModel()
    @State private var sortBy: SortOption = .sustainabilityScore
    @State private var showingBenchmark = false
    @State private var selectedVehicle: SustainabilityMetrics?

    enum SortOption: String, CaseIterable {
        case sustainabilityScore = "Sustainability Score"
        case co2Emissions = "CO2 Emissions"
        case mpg = "MPG"
        case idleTime = "Idle Time"

        var icon: String {
            switch self {
            case .sustainabilityScore: return "star.fill"
            case .co2Emissions: return "cloud.fill"
            case .mpg: return "speedometer"
            case .idleTime: return "clock.fill"
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Sort Options
                sortOptionsSection

                // Fleet Overview Chart
                fleetOverviewChart

                // Performance Distribution
                performanceDistributionSection

                // Vehicle List
                vehicleListSection

                // Industry Benchmark Comparison
                if showingBenchmark {
                    benchmarkComparisonSection
                }
            }
            .padding()
        }
        .navigationTitle("Vehicle Comparison")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingBenchmark.toggle() }) {
                    Image(systemName: showingBenchmark ? "chart.bar.fill" : "chart.bar")
                }
            }
        }
        .sheet(item: $selectedVehicle) { vehicle in
            VehicleDetailSheet(vehicle: vehicle, viewModel: viewModel)
        }
        .task {
            if viewModel.sustainabilityMetrics.isEmpty {
                await viewModel.refresh()
            }
        }
    }

    // MARK: - Sort Options
    private var sortOptionsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sort By")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Button(action: { sortBy = option }) {
                            HStack(spacing: 6) {
                                Image(systemName: option.icon)
                                Text(option.rawValue)
                            }
                            .font(.subheadline)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(sortBy == option ? Color.blue : Color(.systemGray5))
                            .foregroundColor(sortBy == option ? .white : .primary)
                            .cornerRadius(10)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Fleet Overview Chart
    private var fleetOverviewChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fleet Overview")
                .font(.headline)

            Chart {
                ForEach(sortedMetrics.prefix(10)) { metric in
                    BarMark(
                        x: .value("Score", metric.sustainabilityScore),
                        y: .value("Vehicle", metric.vehicleNumber)
                    )
                    .foregroundStyle(by: .value("Category", metric.scoreCategory))
                }
            }
            .chartForegroundStyleScale([
                "Excellent": Color.green,
                "Good": Color.yellow,
                "Fair": Color.orange,
                "Poor": Color.red,
                "Critical": Color.purple
            ])
            .frame(height: 300)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Performance Distribution
    private var performanceDistributionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Distribution")
                .font(.headline)

            let distribution = getPerformanceDistribution()

            HStack(spacing: 16) {
                ForEach(Array(distribution.keys.sorted()), id: \.self) { category in
                    VStack(spacing: 8) {
                        Text("\(distribution[category] ?? 0)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(categoryColor(category))

                        Text(category)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(categoryColor(category).opacity(0.1))
                    .cornerRadius(10)
                }
            }
        }
    }

    // MARK: - Vehicle List
    private var vehicleListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Vehicles (\(sortedMetrics.count))")
                    .font(.headline)

                Spacer()

                Text("Sorted by \(sortBy.rawValue)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                ForEach(sortedMetrics) { metric in
                    VehicleComparisonCard(metric: metric)
                        .onTapGesture {
                            selectedVehicle = metric
                        }
                }
            }
        }
    }

    // MARK: - Benchmark Comparison
    private var benchmarkComparisonSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Industry Benchmark Comparison")
                .font(.headline)

            VStack(spacing: 12) {
                ForEach(sortedMetrics.prefix(5)) { metric in
                    if let comparison = viewModel.compareToIndustry(metrics: metric) {
                        BenchmarkComparisonCard(
                            vehicle: metric,
                            comparison: comparison
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Helper Methods
    private var sortedMetrics: [SustainabilityMetrics] {
        switch sortBy {
        case .sustainabilityScore:
            return viewModel.sustainabilityMetrics.sorted { $0.sustainabilityScore > $1.sustainabilityScore }
        case .co2Emissions:
            return viewModel.sustainabilityMetrics.sorted { $0.totalCO2 < $1.totalCO2 }
        case .mpg:
            return viewModel.sustainabilityMetrics.sorted { $0.mpg > $1.mpg }
        case .idleTime:
            return viewModel.sustainabilityMetrics.sorted { $0.idleTimePercentage < $1.idleTimePercentage }
        }
    }

    private func getPerformanceDistribution() -> [String: Int] {
        var distribution: [String: Int] = [
            "Excellent": 0,
            "Good": 0,
            "Fair": 0,
            "Poor": 0,
            "Critical": 0
        ]

        for metric in viewModel.sustainabilityMetrics {
            distribution[metric.scoreCategory, default: 0] += 1
        }

        return distribution
    }

    private func categoryColor(_ category: String) -> Color {
        switch category {
        case "Excellent": return .green
        case "Good": return .yellow
        case "Fair": return .orange
        case "Poor": return .red
        case "Critical": return .purple
        default: return .gray
        }
    }
}

// MARK: - Vehicle Comparison Card
struct VehicleComparisonCard: View {
    let metric: SustainabilityMetrics

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(metric.vehicleNumber)
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("\(metric.vehicleType.displayName) • \(metric.fuelType.displayName)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(metric.sustainabilityScore))")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(Color(metric.scoreColor))

                    Text(metric.scoreCategory)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Metrics Grid
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricItem(
                    icon: "speedometer",
                    value: String(format: "%.1f", metric.mpg),
                    label: "MPG",
                    color: metric.mpg > 25 ? .green : .orange
                )

                MetricItem(
                    icon: "cloud.fill",
                    value: String(format: "%.2f", metric.emissionsPerMile),
                    label: "CO2/mi",
                    color: metric.emissionsPerMile < 0.35 ? .green : .orange
                )

                MetricItem(
                    icon: "clock.fill",
                    value: String(format: "%.1f%%", metric.idleTimePercentage),
                    label: "Idle",
                    color: metric.idleTimePercentage < 15 ? .green : .orange
                )
            }

            // Progress Bar
            VStack(alignment: .leading, spacing: 4) {
                Text("Sustainability Score")
                    .font(.caption)
                    .foregroundColor(.secondary)

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 8)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(Color(metric.scoreColor))
                            .frame(width: geometry.size.width * (metric.sustainabilityScore / 100), height: 8)
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Metric Item
struct MetricItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Benchmark Comparison Card
struct BenchmarkComparisonCard: View {
    let vehicle: SustainabilityMetrics
    let comparison: BenchmarkComparison

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(vehicle.vehicleNumber)
                .font(.subheadline)
                .fontWeight(.semibold)

            VStack(spacing: 8) {
                ComparisonRow(
                    title: "MPG",
                    difference: comparison.mpgDifference,
                    isInverse: false
                )

                ComparisonRow(
                    title: "Emissions/Mile",
                    difference: comparison.emissionsDifference,
                    isInverse: true
                )

                ComparisonRow(
                    title: "Idle Time",
                    difference: comparison.idleTimeDifference,
                    isInverse: true
                )
            }

            Text(comparison.performanceSummary)
                .font(.caption)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Comparison Row
struct ComparisonRow: View {
    let title: String
    let difference: Double
    let isInverse: Bool

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            HStack(spacing: 4) {
                Image(systemName: difference > 0 ? "arrow.up" : "arrow.down")
                    .font(.caption2)

                Text(String(format: "%.1f", abs(difference)))
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(comparisonColor(difference, isInverse: isInverse))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(comparisonColor(difference, isInverse: isInverse).opacity(0.2))
            .cornerRadius(6)
        }
    }

    private func comparisonColor(_ difference: Double, isInverse: Bool) -> Color {
        if difference > 0 {
            return isInverse ? .red : .green
        } else if difference < 0 {
            return isInverse ? .green : .red
        }
        return .gray
    }
}

// MARK: - Vehicle Detail Sheet
struct VehicleDetailSheet: View {
    let vehicle: SustainabilityMetrics
    let viewModel: EnvironmentalImpactViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Text(vehicle.vehicleNumber)
                            .font(.title)
                            .fontWeight(.bold)

                        Text("\(vehicle.vehicleType.displayName) • \(vehicle.fuelType.displayName) • \(vehicle.year)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()

                    // Sustainability Score
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                                .frame(width: 150, height: 150)

                            Circle()
                                .trim(from: 0, to: vehicle.sustainabilityScore / 100)
                                .stroke(
                                    Color(vehicle.scoreColor),
                                    style: StrokeStyle(lineWidth: 20, lineCap: .round)
                                )
                                .frame(width: 150, height: 150)
                                .rotationEffect(.degrees(-90))

                            VStack(spacing: 4) {
                                Text("\(Int(vehicle.sustainabilityScore))")
                                    .font(.system(size: 40, weight: .bold))
                                    .foregroundColor(Color(vehicle.scoreColor))

                                Text(vehicle.scoreCategory)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()

                    // Detailed Metrics
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Environmental Metrics")
                            .font(.headline)

                        DetailMetricRow(
                            icon: "speedometer",
                            title: "Fuel Efficiency",
                            value: String(format: "%.1f MPG", vehicle.mpg),
                            color: .green
                        )

                        DetailMetricRow(
                            icon: "cloud.fill",
                            title: "Total CO2 Emissions",
                            value: String(format: "%.1f kg", vehicle.totalCO2),
                            color: .red
                        )

                        DetailMetricRow(
                            icon: "chart.line.uptrend.xyaxis",
                            title: "Emissions per Mile",
                            value: String(format: "%.3f kg/mi", vehicle.emissionsPerMile),
                            color: .orange
                        )

                        DetailMetricRow(
                            icon: "clock.fill",
                            title: "Idle Time",
                            value: String(format: "%.1f%%", vehicle.idleTimePercentage),
                            color: .purple
                        )

                        DetailMetricRow(
                            icon: "road.lanes",
                            title: "Total Miles",
                            value: String(format: "%.0f mi", vehicle.totalMiles),
                            color: .blue
                        )
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Industry Comparison
                    if let comparison = viewModel.compareToIndustry(metrics: vehicle) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Industry Comparison")
                                .font(.headline)

                            Text(comparison.performanceSummary)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Detail Metric Row
struct DetailMetricRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.headline)
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

#Preview {
    NavigationView {
        VehicleComparisonView()
    }
}
