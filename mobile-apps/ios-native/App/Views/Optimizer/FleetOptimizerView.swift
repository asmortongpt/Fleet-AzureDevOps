import SwiftUI
import Charts

struct FleetOptimizerView: View {
    @StateObject private var viewModel = FleetOptimizerViewModel()
    @State private var selectedTab = 0
    @State private var showingGoalPicker = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Header with Goal Selector
                    goalSelectorHeader

                    // Metrics Overview
                    if let metrics = viewModel.metrics {
                        metricsOverview(metrics)
                    }

                    // Tab Picker
                    tabPicker

                    // Content based on selected tab
                    switch selectedTab {
                    case 0:
                        recommendationsSection
                    case 1:
                        utilizationSection
                    case 2:
                        savingsSection
                    default:
                        EmptyView()
                    }
                }
                .padding()
            }
            .navigationTitle("Fleet Optimizer")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }) {
                        Image(systemName: ModernTheme.Symbols.refresh)
                            .symbolRenderingMode(.hierarchical)
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                if viewModel.metrics == nil {
                    await viewModel.analyzeFleet()
                }
                if viewModel.recommendations.isEmpty {
                    await viewModel.generateRecommendations(goal: viewModel.selectedGoal)
                }
            }
            .overlay {
                if viewModel.loadingState.isLoading {
                    ProgressView("Analyzing fleet...")
                        .padding()
                        .background(ModernTheme.Colors.secondaryBackground)
                        .cornerRadius(ModernTheme.CornerRadius.md)
                }
            }
        }
    }

    // MARK: - Goal Selector Header
    private var goalSelectorHeader: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Optimization Goal")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Button(action: {
                showingGoalPicker = true
            }) {
                HStack {
                    Image(systemName: viewModel.selectedGoal.icon)
                        .foregroundColor(ModernTheme.Colors.primary)
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(viewModel.selectedGoal.displayName)
                            .font(ModernTheme.Typography.headline)
                            .foregroundColor(ModernTheme.Colors.primaryText)

                        Text(viewModel.selectedGoal.description)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .lineLimit(1)
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .font(.caption)
                }
                .padding()
                .background(ModernTheme.Colors.secondaryBackground)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }
            .confirmationDialog("Select Optimization Goal", isPresented: $showingGoalPicker) {
                ForEach(OptimizationGoal.allCases) { goal in
                    Button(goal.displayName) {
                        viewModel.selectedGoal = goal
                        Task {
                            await viewModel.generateRecommendations(goal: goal)
                        }
                    }
                }
            } message: {
                Text("Choose the primary objective for fleet optimization")
            }
        }
    }

    // MARK: - Metrics Overview
    private func metricsOverview(_ metrics: FleetMetrics) -> some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Text("Fleet Metrics")
                .font(ModernTheme.Typography.title3)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: ModernTheme.adaptiveColumns, spacing: ModernTheme.Spacing.md) {
                MetricCard(
                    title: "Utilization",
                    value: "\(metrics.utilizationPercentage)%",
                    icon: "chart.line.uptrend.xyaxis",
                    color: utilizationColor(metrics.utilizationRate),
                    trend: metrics.utilizationRate > 0.6 ? .up : .down
                )

                MetricCard(
                    title: "Cost/Mile",
                    value: "$\(String(format: "%.2f", metrics.costPerMile))",
                    icon: "dollarsign.circle",
                    color: .orange,
                    trend: .down
                )

                MetricCard(
                    title: "Downtime",
                    value: "\(metrics.downtimePercentageInt)%",
                    icon: "exclamationmark.triangle",
                    color: downtimeColor(metrics.downtimePercentage),
                    trend: metrics.downtimePercentage < 0.15 ? .down : .up
                )

                MetricCard(
                    title: "Efficiency",
                    value: "\(Int(metrics.efficiencyScore))%",
                    icon: "bolt.fill",
                    color: efficiencyColor(metrics.efficiencyScore),
                    trend: metrics.efficiencyScore > 70 ? .up : .down
                )

                MetricCard(
                    title: "Fleet Size",
                    value: "\(metrics.totalVehicles)",
                    icon: "car.2.fill",
                    color: .blue,
                    subtitle: "Optimal: \(metrics.optimalFleetSize)"
                )

                MetricCard(
                    title: "Underutilized",
                    value: "\(metrics.underutilizedVehicles)",
                    icon: "exclamationmark.circle",
                    color: metrics.underutilizedVehicles > 0 ? .red : .green,
                    subtitle: "Below 40%"
                )
            }
        }
    }

    // MARK: - Tab Picker
    private var tabPicker: some View {
        Picker("View", selection: $selectedTab) {
            Text("Recommendations").tag(0)
            Text("Utilization").tag(1)
            Text("Savings").tag(2)
        }
        .pickerStyle(.segmented)
        .padding(.vertical, ModernTheme.Spacing.sm)
    }

    // MARK: - Recommendations Section
    private var recommendationsSection: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("AI Recommendations")
                    .font(ModernTheme.Typography.title3)

                Spacer()

                if !viewModel.recommendations.isEmpty {
                    Text("\(viewModel.recommendations.count)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            if viewModel.recommendations.isEmpty {
                emptyRecommendationsView
            } else {
                ForEach(viewModel.recommendations) { recommendation in
                    RecommendationCardView(
                        recommendation: recommendation,
                        isImplemented: viewModel.implementedRecommendations.contains(recommendation.id),
                        onImplement: {
                            viewModel.markAsImplemented(recommendation)
                            ModernTheme.Haptics.success()
                        }
                    )
                }
            }
        }
    }

    // MARK: - Utilization Section
    private var utilizationSection: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Text("Vehicle Utilization")
                .font(ModernTheme.Typography.title3)
                .frame(maxWidth: .infinity, alignment: .leading)

            if !viewModel.vehicles.isEmpty {
                UtilizationChartView(vehicles: viewModel.vehicles, viewModel: viewModel)
            } else {
                Text("No utilization data available")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Savings Section
    private var savingsSection: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Text("Savings Projection")
                .font(ModernTheme.Typography.title3)
                .frame(maxWidth: .infinity, alignment: .leading)

            if !viewModel.recommendations.isEmpty {
                SavingsProjectionView(
                    recommendations: viewModel.recommendations,
                    implementedRecommendations: viewModel.implementedRecommendations
                )
            } else {
                Text("No savings projections available")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Empty State
    private var emptyRecommendationsView: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: "lightbulb.fill")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Recommendations Yet")
                .font(ModernTheme.Typography.title3)

            Text("Analyze your fleet to get AI-powered optimization recommendations")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            Button("Analyze Fleet") {
                Task {
                    await viewModel.analyzeFleet()
                    await viewModel.generateRecommendations(goal: viewModel.selectedGoal)
                }
            }
            .primaryButton()
            .padding(.horizontal, 40)
        }
        .padding(.vertical, 40)
    }

    // MARK: - Helper Methods
    private func utilizationColor(_ utilization: Double) -> Color {
        switch utilization {
        case 0..<0.30:
            return .red
        case 0.30..<0.50:
            return .orange
        case 0.50..<0.75:
            return .yellow
        default:
            return .green
        }
    }

    private func downtimeColor(_ downtime: Double) -> Color {
        switch downtime {
        case 0..<0.05:
            return .green
        case 0.05..<0.15:
            return .yellow
        case 0.15..<0.25:
            return .orange
        default:
            return .red
        }
    }

    private func efficiencyColor(_ efficiency: Double) -> Color {
        switch efficiency {
        case 0..<50:
            return .red
        case 50..<70:
            return .orange
        case 70..<85:
            return .yellow
        default:
            return .green
        }
    }
}

// MARK: - Metric Card
struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var trend: TrendDirection = .neutral
    var subtitle: String?

    enum TrendDirection {
        case up, down, neutral
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)

                Spacer()

                if trend != .neutral {
                    Image(systemName: trend == .up ? "arrow.up.right" : "arrow.down.right")
                        .foregroundColor(trend == .up ? .green : .red)
                        .font(.caption)
                }
            }

            Text(value)
                .font(ModernTheme.Typography.title2)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Preview
#Preview {
    FleetOptimizerView()
}
