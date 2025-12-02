//
//  BenchmarkingView.swift
//  Fleet Manager - iOS Native App
//
//  Industry Benchmarking View
//  Compare fleet performance against industry standards
//

import SwiftUI
import Charts

struct BenchmarkingView: View {
    @StateObject private var viewModel = BenchmarkingViewModel()
    @State private var showingDetailView = false
    @State private var selectedMetric: BenchmarkMetric?
    @State private var showingFilters = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with Overall Score
                overallScoreCard

                // Category Selector
                categorySelector

                // Performance vs Industry Card
                if let benchmark = viewModel.selectedBenchmark,
                   let comparison = viewModel.selectedComparison {
                    performanceComparisonCard(benchmark: benchmark, comparison: comparison)
                }

                // Percentile Indicator
                if let comparison = viewModel.selectedComparison {
                    percentileIndicator(comparison: comparison)
                }

                // Trend Chart
                trendChart

                // Top Performing Categories
                topPerformingSection

                // Areas Needing Improvement
                improvementSection

                // Filters Section
                filtersSection
            }
            .padding()
        }
        .navigationTitle("Benchmarking")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingFilters.toggle() }) {
                        Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                    }

                    Button(action: { Task { await viewModel.generateReport() } }) {
                        Label("Generate Report", systemImage: "doc.text.fill")
                    }

                    Button(action: { Task { _ = await viewModel.exportReportToPDF() } }) {
                        Label("Export PDF", systemImage: "arrow.up.doc.fill")
                    }

                    Button(action: { Task { _ = await viewModel.exportToCSV() } }) {
                        Label("Export CSV", systemImage: "tablecells.fill")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            if viewModel.benchmarks.isEmpty {
                await viewModel.fetchBenchmarks()
            }
        }
        .sheet(isPresented: $showingDetailView) {
            if let metric = selectedMetric {
                NavigationView {
                    BenchmarkDetailView(
                        metric: metric,
                        comparison: viewModel.comparisonData.first { $0.category == metric.category },
                        historicalData: viewModel.historicalData.filter { $0.category == metric.category }
                    )
                }
            }
        }
        .sheet(isPresented: $showingFilters) {
            filtersSheet
        }
        .overlay {
            if viewModel.loadingState.isLoading {
                LoadingOverlay()
            }
        }
    }

    // MARK: - Overall Score Card
    private var overallScoreCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Overall Performance")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    Text(viewModel.formattedOverallScore)
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(viewModel.overallPerformanceRank.color)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: viewModel.overallPerformanceRank.icon)
                        Text(viewModel.overallPerformanceRank.displayName)
                    }
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(viewModel.overallPerformanceRank.color)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(viewModel.overallPerformanceRank.color.opacity(0.15))
                    .cornerRadius(8)

                    Text("Industry Rank")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            HStack(spacing: 20) {
                statItem(title: "Categories", value: "\(viewModel.benchmarks.count)", color: .blue)
                statItem(title: "Top Performing", value: "\(viewModel.topPerformingCategories.count)", color: .green)
                statItem(title: "Need Improvement", value: "\(viewModel.categoriesNeedingImprovement.count)", color: .orange)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Category Selector
    private var categorySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(BenchmarkCategory.allCases, id: \.self) { category in
                    CategoryButton(
                        category: category,
                        isSelected: viewModel.selectedCategory == category
                    ) {
                        withAnimation {
                            viewModel.selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Performance Comparison Card
    private func performanceComparisonCard(benchmark: BenchmarkMetric, comparison: BenchmarkComparison) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: benchmark.category.icon)
                    .font(.title2)
                    .foregroundColor(benchmark.category.color)

                VStack(alignment: .leading, spacing: 2) {
                    Text(benchmark.category.displayName)
                        .font(.headline)

                    Text("vs Industry Average")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: {
                    selectedMetric = benchmark
                    showingDetailView = true
                }) {
                    Image(systemName: "chevron.right.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }

            // Comparison Values
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Your Fleet")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(benchmark.formattedFleetValue)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }

                Image(systemName: benchmark.isPerformingBetter ? "arrow.up.right" : "arrow.down.right")
                    .font(.title3)
                    .foregroundColor(benchmark.isPerformingBetter ? .green : .red)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Industry Average")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(benchmark.formattedIndustryAverage)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                }
            }

            // Performance Indicator
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(benchmark.isPerformingBetter ? "Performing Better" : "Below Average")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(benchmark.isPerformingBetter ? .green : .red)

                    Spacer()

                    Text(String(format: "%.1f%%", abs(benchmark.performanceVsIndustry)))
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(benchmark.isPerformingBetter ? .green : .red)
                }

                ProgressView(value: min(abs(benchmark.performanceVsIndustry), 100), total: 100)
                    .tint(benchmark.isPerformingBetter ? .green : .red)
            }

            // Trend Indicator
            HStack {
                Image(systemName: benchmark.trend.icon)
                    .foregroundColor(benchmark.trend.color)

                Text(benchmark.trend.displayName)
                    .font(.subheadline)
                    .foregroundColor(benchmark.trend.color)

                Text(benchmark.formattedChange)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(benchmark.trend.color)

                Text("vs last month")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(benchmark.trend.color.opacity(0.1))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Percentile Indicator
    private func percentileIndicator(comparison: BenchmarkComparison) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Industry Percentile")
                .font(.headline)

            // Visual percentile bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background bar
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 40)

                    // Segments
                    HStack(spacing: 0) {
                        // Bottom 25%
                        Rectangle()
                            .fill(PercentileRank.belowAverage.color.opacity(0.3))
                            .frame(width: geometry.size.width * 0.25, height: 40)

                        // Average (25-75%)
                        Rectangle()
                            .fill(PercentileRank.average.color.opacity(0.3))
                            .frame(width: geometry.size.width * 0.5, height: 40)

                        // Top 25%
                        Rectangle()
                            .fill(PercentileRank.top25.color.opacity(0.3))
                            .frame(width: geometry.size.width * 0.15, height: 40)

                        // Top 10%
                        Rectangle()
                            .fill(PercentileRank.top10.color.opacity(0.3))
                            .frame(width: geometry.size.width * 0.1, height: 40)
                    }

                    // Your position indicator
                    if let benchmark = viewModel.selectedBenchmark {
                        HStack {
                            Spacer()
                                .frame(width: geometry.size.width * (benchmark.percentile / 100) - 15)

                            VStack(spacing: 4) {
                                Image(systemName: "arrowtriangle.down.fill")
                                    .foregroundColor(.blue)

                                Text("You")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                            }

                            Spacer()
                        }
                        .offset(y: -25)
                    }
                }
            }
            .frame(height: 60)

            // Legend
            HStack(spacing: 12) {
                legendItem(rank: .top10)
                legendItem(rank: .top25)
                legendItem(rank: .average)
                legendItem(rank: .belowAverage)
            }
            .font(.caption)

            if let benchmark = viewModel.selectedBenchmark {
                Text("You are in the \(benchmark.percentileRank.displayName) of fleets in \(viewModel.selectedRegion)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Trend Chart
    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Historical Trend (12 Months)")
                .font(.headline)

            if #available(iOS 16.0, *) {
                let categoryData = viewModel.historicalData.filter { $0.category == viewModel.selectedCategory }

                Chart {
                    ForEach(categoryData) { dataPoint in
                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Your Fleet", dataPoint.fleetValue)
                        )
                        .foregroundStyle(.blue)
                        .interpolationMethod(.catmullRom)

                        LineMark(
                            x: .value("Date", dataPoint.date),
                            y: .value("Industry", dataPoint.industryAverage)
                        )
                        .foregroundStyle(.gray)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 3]))
                    }
                }
                .chartYAxisLabel(viewModel.selectedCategory.unit)
                .frame(height: 200)
                .padding(.vertical)
            } else {
                Text("Charts require iOS 16+")
                    .foregroundColor(.secondary)
                    .frame(height: 200)
            }

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.blue)
                        .frame(width: 30, height: 3)
                    Text("Your Fleet")
                        .font(.caption)
                }

                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.gray)
                        .frame(width: 30, height: 3)
                    Text("Industry Average")
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Top Performing Section
    private var topPerformingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "star.fill")
                    .foregroundColor(.yellow)
                Text("Top Performing Categories")
                    .font(.headline)
            }

            if viewModel.topPerformingCategories.isEmpty {
                Text("No data available")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(viewModel.topPerformingCategories) { metric in
                    MetricRow(metric: metric) {
                        selectedMetric = metric
                        showingDetailView = true
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Improvement Section
    private var improvementSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("Areas Needing Improvement")
                    .font(.headline)
            }

            if viewModel.categoriesNeedingImprovement.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("All categories performing at or above average!")
                        .foregroundColor(.secondary)
                }
                .padding()
            } else {
                ForEach(viewModel.categoriesNeedingImprovement) { metric in
                    MetricRow(metric: metric, showWarning: true) {
                        selectedMetric = metric
                        showingDetailView = true
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Filters Section
    private var filtersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Current Filters")
                .font(.headline)

            HStack {
                FilterChip(
                    icon: "building.2.fill",
                    label: viewModel.selectedFleetSize.displayName,
                    color: .blue
                )

                FilterChip(
                    icon: "map.fill",
                    label: viewModel.selectedRegion,
                    color: .green
                )
            }

            Button(action: { showingFilters.toggle() }) {
                HStack {
                    Image(systemName: "slider.horizontal.3")
                    Text("Adjust Filters")
                }
                .font(.subheadline)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Filters Sheet
    private var filtersSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Fleet Size")) {
                    Picker("Fleet Size", selection: $viewModel.selectedFleetSize) {
                        ForEach(FleetSizeCategory.allCases, id: \.self) { size in
                            Text(size.displayName).tag(size)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section(header: Text("Region")) {
                    Picker("Region", selection: $viewModel.selectedRegion) {
                        ForEach(viewModel.availableRegions, id: \.self) { region in
                            Text(region).tag(region)
                        }
                    }
                    .pickerStyle(.inline)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilters = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Views
    private func statItem(title: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func legendItem(rank: PercentileRank) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(rank.color.opacity(0.3))
                .frame(width: 12, height: 12)

            Text(rank.displayName)
        }
    }
}

// MARK: - Category Button
struct CategoryButton: View {
    let category: BenchmarkCategory
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : category.color)

                Text(category.displayName)
                    .font(.caption)
                    .fontWeight(isSelected ? .semibold : .regular)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 100, height: 80)
            .background(isSelected ? category.color : Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

// MARK: - Metric Row
struct MetricRow: View {
    let metric: BenchmarkMetric
    var showWarning: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: metric.category.icon)
                    .font(.title3)
                    .foregroundColor(metric.category.color)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text(metric.category.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    HStack(spacing: 8) {
                        Text(metric.formattedFleetValue)
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("•")
                            .foregroundColor(.secondary)

                        HStack(spacing: 4) {
                            Image(systemName: metric.percentileRank.icon)
                            Text(metric.percentileRank.displayName)
                        }
                        .font(.caption)
                        .foregroundColor(metric.percentileRank.color)
                    }
                }

                Spacer()

                if showWarning {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.orange)
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)

            Text(label)
                .font(.caption)
                .lineLimit(1)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(color.opacity(0.15))
        .foregroundColor(color)
        .cornerRadius(8)
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.5)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
        }
    }
}

#Preview {
    NavigationView {
        BenchmarkingView()
    }
}
