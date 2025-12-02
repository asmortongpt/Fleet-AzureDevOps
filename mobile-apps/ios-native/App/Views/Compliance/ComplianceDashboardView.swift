import SwiftUI
import Charts

struct ComplianceDashboardView: View {
    @StateObject private var viewModel = ComplianceDashboardViewModel()
    @State private var showingExpiringItems = false
    @State private var showingViolations = false
    @State private var showingReport = false
    @State private var selectedTimeframe: TimeFrame = .month

    enum TimeFrame: String, CaseIterable {
        case week = "Week"
        case month = "Month"
        case quarter = "Quarter"
        case year = "Year"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Overall Score Card
                overallScoreCard

                // Quick Actions
                quickActionsSection

                // Alerts
                if !viewModel.checkForAlerts().isEmpty {
                    alertsSection
                }

                // Category Breakdown
                categoryBreakdownSection

                // Expiring Items Summary
                expiringItemsSection

                // Violations Summary
                violationsSummary

                // Trend Chart
                trendChartSection
            }
            .padding()
        }
        .navigationTitle("Compliance Dashboard")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await viewModel.refresh()
        }
        .sheet(isPresented: $showingExpiringItems) {
            NavigationView {
                ExpiringItemsView(viewModel: viewModel)
            }
        }
        .sheet(isPresented: $showingViolations) {
            NavigationView {
                ViolationsListView(viewModel: viewModel)
            }
        }
        .sheet(isPresented: $showingReport) {
            NavigationView {
                ComplianceReportView(viewModel: viewModel)
            }
        }
    }

    // MARK: - Overall Score Card
    private var overallScoreCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Overall Compliance")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", viewModel.overallScore))
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(viewModel.scoreColor)

                        Text("%")
                            .font(.title)
                            .foregroundColor(.secondary)
                    }

                    HStack(spacing: 8) {
                        Text("Grade: \(viewModel.scoreGrade)")
                            .font(.title3)
                            .fontWeight(.semibold)

                        if let dashboard = viewModel.dashboard {
                            HStack(spacing: 4) {
                                Image(systemName: dashboard.score.trend.icon)
                                    .font(.caption)
                                Text(dashboard.score.trend.rawValue.capitalized)
                                    .font(.caption)
                            }
                            .foregroundColor(Color(dashboard.score.trend.color))
                        }
                    }
                }

                Spacer()

                // Score Ring
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                        .frame(width: 100, height: 100)

                    Circle()
                        .trim(from: 0, to: viewModel.overallScore / 100)
                        .stroke(viewModel.scoreColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .frame(width: 100, height: 100)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut, value: viewModel.overallScore)

                    Text(viewModel.scoreGrade)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(viewModel.scoreColor)
                }
            }

            Divider()

            // Stats Grid
            HStack(spacing: 16) {
                StatItem(
                    label: "Compliant",
                    value: "\(viewModel.dashboard?.score.compliantItems ?? 0)",
                    color: .green
                )

                StatItem(
                    label: "Warning",
                    value: "\(viewModel.dashboard?.score.warningItems ?? 0)",
                    color: .yellow
                )

                StatItem(
                    label: "Violation",
                    value: "\(viewModel.dashboard?.score.violationItems ?? 0)",
                    color: .orange
                )

                StatItem(
                    label: "Expired",
                    value: "\(viewModel.dashboard?.score.expiredItems ?? 0)",
                    color: .red
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                ActionButton(
                    icon: "clock.badge.exclamationmark",
                    title: "Expiring",
                    count: viewModel.expiringIn30Days.count,
                    color: .orange
                ) {
                    showingExpiringItems = true
                }

                ActionButton(
                    icon: "exclamationmark.triangle",
                    title: "Violations",
                    count: viewModel.unresolvedViolationsCount,
                    color: .red
                ) {
                    showingViolations = true
                }

                ActionButton(
                    icon: "doc.text",
                    title: "Report",
                    color: .blue
                ) {
                    showingReport = true
                }
            }
        }
    }

    // MARK: - Alerts Section
    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Alerts")
                .font(.headline)

            ForEach(viewModel.checkForAlerts()) { alert in
                AlertCard(alert: alert)
            }
        }
    }

    // MARK: - Category Breakdown
    private var categoryBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Category Breakdown")
                    .font(.headline)

                Spacer()

                NavigationLink(destination: ComplianceScoreCardView(viewModel: viewModel)) {
                    Text("View Details")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }

            VStack(spacing: 12) {
                ForEach(ComplianceCategory.allCases, id: \.self) { category in
                    CategoryScoreRow(
                        category: category,
                        score: viewModel.calculateCategoryScore(category)
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Expiring Items Section
    private var expiringItemsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Expiring Items")
                    .font(.headline)

                Spacer()

                Button(action: { showingExpiringItems = true }) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }

            VStack(spacing: 8) {
                ExpiringRow(
                    label: "Next 30 days",
                    count: viewModel.expiringIn30Days.count,
                    color: .red
                )

                ExpiringRow(
                    label: "31-60 days",
                    count: viewModel.expiringIn60Days.count,
                    color: .orange
                )

                ExpiringRow(
                    label: "61-90 days",
                    count: viewModel.expiringIn90Days.count,
                    color: .yellow
                )

                if !viewModel.expiredItems.isEmpty {
                    ExpiringRow(
                        label: "Already Expired",
                        count: viewModel.expiredItems.count,
                        color: .gray
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Violations Summary
    private var violationsSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Violations")
                    .font(.headline)

                Spacer()

                Button(action: { showingViolations = true }) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }

            if viewModel.violations.isEmpty {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.green)
                        Text("No Violations")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical)
                    Spacer()
                }
            } else {
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(viewModel.unresolvedViolationsCount)")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                            Text("Unresolved")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing) {
                            Text("$\(String(format: "%.2f", viewModel.totalOutstandingFines))")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.orange)
                            Text("Outstanding Fines")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    ForEach(viewModel.violations.prefix(3)) { violation in
                        ViolationSummaryRow(violation: violation)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Trend Chart
    private var trendChartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Compliance Trend")
                    .font(.headline)

                Spacer()

                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(TimeFrame.allCases, id: \.self) { timeframe in
                        Text(timeframe.rawValue).tag(timeframe)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 250)
            }

            if let monthlyTrend = viewModel.dashboard?.monthlyTrend {
                Chart(monthlyTrend) { data in
                    LineMark(
                        x: .value("Month", data.month),
                        y: .value("Score", data.score)
                    )
                    .foregroundStyle(.blue)
                    .lineStyle(StrokeStyle(lineWidth: 3))

                    PointMark(
                        x: .value("Month", data.month),
                        y: .value("Score", data.score)
                    )
                    .foregroundStyle(.blue)
                }
                .frame(height: 200)
                .chartYScale(domain: 0...100)
            } else {
                Text("No trend data available")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Supporting Views

struct StatItem: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ActionButton: View {
    let icon: String
    let title: String
    var count: Int?
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(color)

                    if let count = count, count > 0 {
                        Text("\(count)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(4)
                            .background(Color.red)
                            .clipShape(Circle())
                            .offset(x: 8, y: -8)
                    }
                }

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(8)
        }
    }
}

struct AlertCard: View {
    let alert: ComplianceAlert

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundColor(alert.severity.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(alert.title)
                    .font(.headline)
                Text(alert.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(alert.severity.color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct CategoryScoreRow: View {
    let category: ComplianceCategory
    let score: Double

    var scoreColor: Color {
        if score >= 90 {
            return .green
        } else if score >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    var body: some View {
        HStack {
            Image(systemName: category.icon)
                .foregroundColor(Color(category.color))
                .frame(width: 30)

            Text(category.displayName)
                .font(.subheadline)

            Spacer()

            Text(String(format: "%.1f%%", score))
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(scoreColor)

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(scoreColor)
                        .frame(width: geometry.size.width * (score / 100), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(width: 100, height: 6)
        }
        .padding(.vertical, 4)
    }
}

struct ExpiringRow: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text("\(count)")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
    }
}

struct ViolationSummaryRow: View {
    let violation: Violation

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: violation.severity.icon)
                .foregroundColor(Color(violation.severity.color))

            VStack(alignment: .leading, spacing: 2) {
                Text(violation.description)
                    .font(.subheadline)
                    .lineLimit(1)

                Text(violation.entityName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if let fine = violation.fineAmount {
                Text("$\(String(format: "%.2f", fine))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Compliance Report View
struct ComplianceReportView: View {
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @Environment(\.dismiss) var dismiss
    @State private var reportText = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(reportText)
                    .font(.system(.body, design: .monospaced))
                    .padding()
            }
        }
        .navigationTitle("Compliance Report")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Close") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                ShareLink(item: reportText)
            }
        }
        .task {
            reportText = await viewModel.generateComplianceReport()
        }
    }
}

#Preview {
    NavigationView {
        ComplianceDashboardView()
    }
}
