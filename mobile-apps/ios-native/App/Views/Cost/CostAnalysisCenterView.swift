//
//  CostAnalysisCenterView.swift
//  Fleet Manager
//
//  Cost Analysis Center with TCO, cost per mile, and budget tracking
//

import SwiftUI
import Charts

struct CostAnalysisCenterView: View {
    @StateObject private var viewModel = CostViewModel()
    @State private var selectedTab: CostTab = .overview
    @State private var showExportSheet = false
    @State private var showAddCostSheet = false
    @State private var showAddBudgetSheet = false
    @State private var showFilterSheet = false

    enum CostTab: String, CaseIterable {
        case overview = "Overview"
        case categories = "Categories"
        case departments = "Departments"
        case budgets = "Budgets"
        case trends = "Trends"

        var icon: String {
            switch self {
            case .overview: return "chart.bar.fill"
            case .categories: return "rectangle.3.group.fill"
            case .departments: return "building.2.fill"
            case .budgets: return "dollarsign.circle.fill"
            case .trends: return "chart.line.uptrend.xyaxis"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                tabSelector

                // Content
                ScrollView {
                    VStack(spacing: 20) {
                        // Filter and Date Range Selector
                        filterBar

                        // Tab Content
                        if viewModel.isLoading {
                            ProgressView("Loading cost data...")
                                .padding(.top, 100)
                        } else if let error = viewModel.errorMessage {
                            ErrorView(message: error) {
                                Task {
                                    await viewModel.loadAllData()
                                }
                            }
                        } else {
                            switch selectedTab {
                            case .overview:
                                overviewContent
                            case .categories:
                                categoriesContent
                            case .departments:
                                departmentsContent
                            case .budgets:
                                budgetsContent
                            case .trends:
                                trendsContent
                            }
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
            .navigationTitle("Cost Analysis")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showFilterSheet = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showAddCostSheet = true }) {
                            Label("Add Cost", systemImage: "plus.circle")
                        }
                        Button(action: { showAddBudgetSheet = true }) {
                            Label("Create Budget", systemImage: "calendar.badge.plus")
                        }
                        Divider()
                        Button(action: { showExportSheet = true }) {
                            Label("Export Report", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showExportSheet) {
                exportSheet
            }
            .sheet(isPresented: $showAddCostSheet) {
                AddCostRecordView(viewModel: viewModel)
            }
            .sheet(isPresented: $showAddBudgetSheet) {
                AddBudgetView(viewModel: viewModel)
            }
            .sheet(isPresented: $showFilterSheet) {
                FilterSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.loadAllData()
            }
        }
    }

    // MARK: - Tab Selector

    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(CostTab.allCases, id: \.self) { tab in
                    TabButton(
                        title: tab.rawValue,
                        icon: tab.icon,
                        isSelected: selectedTab == tab
                    ) {
                        withAnimation {
                            selectedTab = tab
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }

    // MARK: - Filter Bar

    private var filterBar: some View {
        HStack {
            // Date Range Picker
            Menu {
                ForEach(DateRangeFilter.allCases, id: \.self) { range in
                    Button(action: {
                        viewModel.selectedDateRange = range
                        Task {
                            await viewModel.applyFilters()
                        }
                    }) {
                        Label(range.rawValue, systemImage: viewModel.selectedDateRange == range ? "checkmark" : "")
                    }
                }
            } label: {
                HStack {
                    Image(systemName: "calendar")
                    Text(viewModel.selectedDateRange.rawValue)
                    Image(systemName: "chevron.down")
                }
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(8)
            }

            Spacer()

            // Active Filters Badge
            if viewModel.selectedCategory != nil || viewModel.selectedDepartment != nil || viewModel.selectedVehicleId != nil {
                Button(action: {
                    viewModel.clearFilters()
                    Task {
                        await viewModel.applyFilters()
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "xmark.circle.fill")
                        Text("Clear")
                    }
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue)
                    .cornerRadius(6)
                }
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Overview Content

    private var overviewContent: some View {
        VStack(spacing: 20) {
            // Summary Cards
            summaryCards

            // Cost Breakdown Pie Chart
            costBreakdownChart

            // Recent Costs
            recentCostsSection
        }
    }

    private var summaryCards: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                SummaryCard(
                    title: "Total Costs",
                    value: String(format: "$%.2f", viewModel.totalFleetCosts),
                    icon: "dollarsign.circle.fill",
                    color: .blue,
                    subtitle: viewModel.selectedDateRange.rawValue
                )

                SummaryCard(
                    title: "Avg Per Vehicle",
                    value: String(format: "$%.2f", viewModel.averageCostPerVehicle),
                    icon: "car.fill",
                    color: .green,
                    subtitle: "Per vehicle"
                )
            }

            HStack(spacing: 12) {
                SummaryCard(
                    title: "Cost Per Mile",
                    value: String(format: "$%.3f", viewModel.totalCostPerMile),
                    icon: "gauge.high",
                    color: .orange,
                    subtitle: "Per mile driven"
                )

                SummaryCard(
                    title: "YTD Costs",
                    value: String(format: "$%.2f", viewModel.yearToDateCosts),
                    icon: "calendar.circle.fill",
                    color: .purple,
                    subtitle: "Year to date"
                )
            }
        }
    }

    private var costBreakdownChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cost Breakdown")
                .font(.headline)

            if let summary = viewModel.analyticsSummary,
               !summary.costTrends.isEmpty {
                Chart {
                    ForEach(CostCategory.allCases, id: \.self) { category in
                        let amount = viewModel.calculateCategoryTotal(category: category)
                        if amount > 0 {
                            SectorMark(
                                angle: .value("Amount", amount),
                                innerRadius: .ratio(0.6),
                                angularInset: 2
                            )
                            .foregroundStyle(by: .value("Category", category.rawValue))
                            .cornerRadius(5)
                        }
                    }
                }
                .frame(height: 250)
                .chartLegend(position: .bottom, spacing: 8)

                // Category List
                VStack(spacing: 8) {
                    ForEach(CostCategory.allCases, id: \.self) { category in
                        let amount = viewModel.calculateCategoryTotal(category: category)
                        if amount > 0 {
                            HStack {
                                Image(systemName: category.icon)
                                    .foregroundColor(Color(category.color))
                                Text(category.rawValue)
                                    .font(.subheadline)
                                Spacer()
                                Text(String(format: "$%.2f", amount))
                                    .font(.subheadline.bold())
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            } else {
                Text("No cost data available")
                    .foregroundColor(.secondary)
                    .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    private var recentCostsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Costs")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: CostDetailView(viewModel: viewModel, category: nil)) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
            }

            if viewModel.costRecords.isEmpty {
                Text("No cost records found")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                ForEach(Array(viewModel.costRecords.prefix(5))) { record in
                    CostRecordRow(record: record)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Categories Content

    private var categoriesContent: some View {
        VStack(spacing: 12) {
            ForEach(CostCategory.allCases, id: \.self) { category in
                let amount = viewModel.calculateCategoryTotal(category: category)
                if amount > 0 {
                    NavigationLink(destination: CostDetailView(viewModel: viewModel, category: category)) {
                        CategoryCard(
                            category: category,
                            amount: amount,
                            recordCount: viewModel.costRecords.filter { $0.category == category }.count
                        )
                    }
                }
            }
        }
    }

    // MARK: - Departments Content

    private var departmentsContent: some View {
        VStack(spacing: 12) {
            if viewModel.departmentSummaries.isEmpty {
                Text("No department data available")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                ForEach(viewModel.departmentSummaries) { department in
                    DepartmentCard(department: department)
                }
            }
        }
    }

    // MARK: - Budgets Content

    private var budgetsContent: some View {
        VStack(spacing: 20) {
            // Budget Status Summary
            budgetStatusSummary

            // Budget List
            if viewModel.budgets.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("No budgets created")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Button("Create Budget") {
                        showAddBudgetSheet = true
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 60)
            } else {
                ForEach(viewModel.filteredBudgets) { budget in
                    BudgetCard(budget: budget, viewModel: viewModel)
                }
            }
        }
    }

    private var budgetStatusSummary: some View {
        HStack(spacing: 12) {
            BudgetStatusCard(
                title: "On Track",
                count: viewModel.budgetsOnTrack,
                icon: "checkmark.circle.fill",
                color: .green
            )

            BudgetStatusCard(
                title: "At Risk",
                count: viewModel.budgetsAtRisk,
                icon: "exclamationmark.triangle.fill",
                color: .orange
            )

            BudgetStatusCard(
                title: "Over Budget",
                count: viewModel.budgetsOverBudget,
                icon: "xmark.circle.fill",
                color: .red
            )
        }
    }

    // MARK: - Trends Content

    private var trendsContent: some View {
        VStack(spacing: 20) {
            // Cost Trend Chart
            costTrendChart

            // Forecast
            costForecastSection
        }
    }

    private var costTrendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cost Trends")
                .font(.headline)

            if viewModel.costTrends.isEmpty {
                Text("No trend data available")
                    .foregroundColor(.secondary)
                    .frame(height: 200)
            } else {
                Chart(viewModel.costTrends) { trend in
                    LineMark(
                        x: .value("Period", trend.date),
                        y: .value("Cost", trend.totalCost)
                    )
                    .foregroundStyle(Color.blue)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Period", trend.date),
                        y: .value("Cost", trend.totalCost)
                    )
                    .foregroundStyle(Color.blue.opacity(0.1))
                    .interpolationMethod(.catmullRom)
                }
                .frame(height: 250)
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    private var costForecastSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("6-Month Forecast")
                .font(.headline)

            let forecasts = viewModel.forecastCosts(months: 6)

            if forecasts.isEmpty {
                Text("Insufficient data for forecasting")
                    .foregroundColor(.secondary)
                    .frame(height: 100)
            } else {
                ForEach(forecasts) { forecast in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(forecast.date, style: .date)
                                .font(.subheadline)
                            Text("Confidence: \(forecast.confidencePercentage)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(forecast.formattedCost)
                            .font(.headline)
                    }
                    .padding()
                    .background(Color(.tertiarySystemGroupedBackground))
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Export Sheet

    private var exportSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Export Cost Report")) {
                    Button(action: {
                        Task {
                            if let data = await viewModel.exportCostReport(format: .pdf) {
                                shareFile(data: data, filename: "cost_report.pdf")
                            }
                        }
                    }) {
                        Label("Export as PDF", systemImage: "doc.fill")
                    }

                    Button(action: {
                        Task {
                            if let data = await viewModel.exportCostReport(format: .excel) {
                                shareFile(data: data, filename: "cost_report.xlsx")
                            }
                        }
                    }) {
                        Label("Export as Excel", systemImage: "tablecells")
                    }

                    Button(action: {
                        Task {
                            if let data = await viewModel.exportCostReport(format: .csv) {
                                shareFile(data: data, filename: "cost_report.csv")
                            }
                        }
                    }) {
                        Label("Export as CSV", systemImage: "doc.text")
                    }
                }

                Section(header: Text("Export Budget Report")) {
                    Button(action: {
                        Task {
                            if let data = await viewModel.exportBudgetReport(format: .pdf) {
                                shareFile(data: data, filename: "budget_report.pdf")
                            }
                        }
                    }) {
                        Label("Export Budget as PDF", systemImage: "doc.fill")
                    }
                }
            }
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showExportSheet = false
                    }
                }
            }
        }
    }

    private func shareFile(data: Data, filename: String) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: tempURL)
            let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
            UIApplication.shared.windows.first?.rootViewController?.present(activityVC, animated: true)
        } catch {
            print("Error sharing file: \(error)")
        }
    }
}

// MARK: - Supporting Views

struct TabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                Text(title)
            }
            .font(.subheadline.bold())
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
            .cornerRadius(20)
        }
    }
}

struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.title2.bold())
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct CategoryCard: View {
    let category: CostCategory
    let amount: Double
    let recordCount: Int

    var body: some View {
        HStack {
            Image(systemName: category.icon)
                .font(.title2)
                .foregroundColor(Color(category.color))
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(category.rawValue)
                    .font(.headline)
                Text("\(recordCount) transactions")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(String(format: "$%.2f", amount))
                .font(.title3.bold())
                .foregroundColor(.primary)

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct DepartmentCard: View {
    let department: DepartmentCostSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(department.department)
                        .font(.headline)
                    Text("\(department.vehicleCount) vehicles")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text(department.formattedTotalCosts)
                    .font(.title3.bold())
            }

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Avg Per Vehicle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(String(format: "$%.2f", department.averageCostPerVehicle))
                        .font(.subheadline.bold())
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Cost Per Mile")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(department.formattedCostPerMile)
                        .font(.subheadline.bold())
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct BudgetCard: View {
    let budget: Budget
    let viewModel: CostViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(budget.name)
                        .font(.headline)
                    if let category = budget.category {
                        Text(category.rawValue)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: budget.status.icon)
                    Text(budget.status.rawValue)
                }
                .font(.caption.bold())
                .foregroundColor(Color(budget.status.color))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(budget.status.color).opacity(0.1))
                .cornerRadius(6)
            }

            // Progress Bar
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Spent: \(String(format: "$%.2f", budget.spentAmount))")
                        .font(.caption)
                    Spacer()
                    Text("Budget: \(String(format: "$%.2f", budget.allocatedAmount))")
                        .font(.caption)
                }
                .foregroundColor(.secondary)

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color(.tertiarySystemGroupedBackground))
                            .frame(height: 8)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(Color(budget.status.color))
                            .frame(width: geometry.size.width * min(1.0, budget.percentageUsed / 100), height: 8)
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)

                Text("\(String(format: "%.1f%%", budget.percentageUsed)) used • \(budget.daysRemaining) days left")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct BudgetStatusCard: View {
    let title: String
    let count: Int
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text("\(count)")
                .font(.title.bold())
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct CostRecordRow: View {
    let record: CostRecord

    var body: some View {
        HStack {
            Image(systemName: record.category.icon)
                .foregroundColor(Color(record.category.color))
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(record.category.rawValue)
                    .font(.subheadline.bold())
                Text(record.vehicleNumber)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(record.formattedAmount)
                    .font(.subheadline.bold())
                Text(record.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}

struct ErrorView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            Text("Error")
                .font(.title2.bold())
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Button("Retry") {
                retry()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

// MARK: - Preview

#Preview {
    CostAnalysisCenterView()
}
