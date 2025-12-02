//
//  BudgetEditorView.swift
//  Fleet Manager
//
//  Create and edit budget allocations with category breakdown
//

import SwiftUI

struct BudgetEditorView: View {
    @ObservedObject var viewModel: BudgetPlanningViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var fiscalYear: Int
    @State private var period: BudgetPeriod = .annual
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date()
    @State private var department: String = ""
    @State private var vehicleId: String = ""

    // Category allocations
    @State private var categoryAllocations: [CategoryAllocationInput] = []
    @State private var totalBudget: Double = 0

    @State private var showingTemplates = false
    @State private var selectedTemplate: BudgetTemplate?
    @State private var showingError = false
    @State private var errorMessage = ""

    init(viewModel: BudgetPlanningViewModel, budget: BudgetPlan? = nil) {
        self.viewModel = viewModel
        _fiscalYear = State(initialValue: budget?.fiscalYear ?? Calendar.current.component(.year, from: Date()))

        if let budget = budget {
            _name = State(initialValue: budget.name)
            _period = State(initialValue: budget.period)
            _startDate = State(initialValue: budget.startDate)
            _endDate = State(initialValue: budget.endDate)
            _department = State(initialValue: budget.department ?? "")
            _vehicleId = State(initialValue: budget.vehicleId ?? "")
            _totalBudget = State(initialValue: budget.totalAllocated)
            _categoryAllocations = State(initialValue: budget.categories.map {
                CategoryAllocationInput(category: $0.category, amount: $0.allocatedAmount, percentage: $0.percentage)
            })
        } else {
            // Initialize with default categories
            _categoryAllocations = State(initialValue: BudgetCategory.allCases.map {
                CategoryAllocationInput(category: $0, amount: 0, percentage: 0)
            })
        }
    }

    var body: some View {
        NavigationView {
            Form {
                // Basic Information Section
                Section(header: Text("Basic Information")) {
                    TextField("Budget Name", text: $name)

                    Picker("Fiscal Year", selection: $fiscalYear) {
                        ForEach(viewModel.availableFiscalYears, id: \.self) { year in
                            Text("FY \(year)").tag(year)
                        }
                    }

                    Picker("Period", selection: $period) {
                        ForEach(BudgetPeriod.allCases) { period in
                            HStack {
                                Image(systemName: period.icon)
                                Text(period.rawValue)
                            }
                            .tag(period)
                        }
                    }
                }

                // Date Range Section
                Section(header: Text("Date Range")) {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                        .onChange(of: startDate) { _, newValue in
                            updateEndDate(from: newValue)
                        }

                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }

                // Organization Section
                Section(header: Text("Organization (Optional)")) {
                    TextField("Department", text: $department)
                    TextField("Vehicle ID", text: $vehicleId)
                }

                // Total Budget Section
                Section(header: Text("Total Budget")) {
                    HStack {
                        Text("Total Allocated")
                            .font(.headline)
                        Spacer()
                        Text(String(format: "$%.2f", calculatedTotal))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }

                    if abs(calculatedTotal - totalBudget) > 0.01 {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("Category total doesn't match total budget")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }

                // Category Allocations Section
                Section(header: HStack {
                    Text("Category Allocations")
                    Spacer()
                    Button("Use Template") {
                        showingTemplates = true
                    }
                    .font(.caption)
                }) {
                    ForEach($categoryAllocations) { $allocation in
                        CategoryAllocationRow(
                            allocation: $allocation,
                            totalBudget: calculatedTotal
                        )
                    }

                    Button("Add Category") {
                        categoryAllocations.append(CategoryAllocationInput(
                            category: .other,
                            amount: 0,
                            percentage: 0
                        ))
                    }
                }

                // Quick Allocation Section
                Section(header: Text("Quick Allocation")) {
                    Button("Distribute Evenly") {
                        distributeEvenly()
                    }

                    Button("Allocate by Percentage") {
                        allocateByPercentage()
                    }
                }

                // Actions Section
                Section {
                    Button("Save Budget") {
                        saveBudget()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.blue)

                    Button("Cancel") {
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Budget Editor")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingTemplates) {
                BudgetTemplateSelector(
                    viewModel: viewModel,
                    onSelect: { template in
                        applyTemplate(template)
                    }
                )
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Computed Properties
    private var calculatedTotal: Double {
        categoryAllocations.reduce(0) { $0 + $1.amount }
    }

    // MARK: - Helper Functions
    private func updateEndDate(from startDate: Date) {
        let calendar = Calendar.current
        switch period {
        case .monthly:
            endDate = calendar.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        case .quarterly:
            endDate = calendar.date(byAdding: .month, value: 3, to: startDate) ?? startDate
        case .annual:
            endDate = calendar.date(byAdding: .year, value: 1, to: startDate) ?? startDate
        case .custom:
            break
        }
    }

    private func distributeEvenly() {
        let perCategory = calculatedTotal / Double(categoryAllocations.count)
        for index in categoryAllocations.indices {
            categoryAllocations[index].amount = perCategory
            categoryAllocations[index].percentage = 100.0 / Double(categoryAllocations.count)
        }
    }

    private func allocateByPercentage() {
        for index in categoryAllocations.indices {
            let percentage = categoryAllocations[index].percentage
            categoryAllocations[index].amount = calculatedTotal * (percentage / 100.0)
        }
    }

    private func applyTemplate(_ template: BudgetTemplate) {
        categoryAllocations = template.categories.map {
            CategoryAllocationInput(
                category: $0.category,
                amount: $0.allocatedAmount,
                percentage: $0.percentage
            )
        }
        period = template.period
        showingTemplates = false
    }

    private func saveBudget() {
        // Validation
        guard !name.isEmpty else {
            errorMessage = "Budget name is required"
            showingError = true
            return
        }

        guard calculatedTotal > 0 else {
            errorMessage = "Total budget must be greater than zero"
            showingError = true
            return
        }

        guard startDate < endDate else {
            errorMessage = "End date must be after start date"
            showingError = true
            return
        }

        // Convert to BudgetAllocation objects
        let allocations = categoryAllocations.filter { $0.amount > 0 }.map { input in
            BudgetAllocation(
                id: UUID().uuidString,
                category: input.category,
                allocatedAmount: input.amount,
                spentAmount: 0,
                projectedAmount: 0,
                percentage: input.percentage
            )
        }

        Task {
            let success = await viewModel.createBudget(
                name: name,
                fiscalYear: fiscalYear,
                period: period,
                startDate: startDate,
                endDate: endDate,
                categories: allocations,
                department: department.isEmpty ? nil : department,
                vehicleId: vehicleId.isEmpty ? nil : vehicleId
            )

            if success {
                dismiss()
            } else {
                errorMessage = "Failed to create budget"
                showingError = true
            }
        }
    }
}

// MARK: - Category Allocation Input
struct CategoryAllocationInput: Identifiable {
    let id = UUID()
    var category: BudgetCategory
    var amount: Double
    var percentage: Double
}

// MARK: - Category Allocation Row
struct CategoryAllocationRow: View {
    @Binding var allocation: CategoryAllocationInput
    let totalBudget: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: allocation.category.icon)
                    .foregroundColor(Color(allocation.category.color))
                    .frame(width: 24)

                Picker("Category", selection: $allocation.category) {
                    ForEach(BudgetCategory.allCases) { category in
                        Text(category.rawValue).tag(category)
                    }
                }
                .labelsHidden()
            }

            HStack {
                Text("Amount:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                TextField("Amount", value: $allocation.amount, format: .currency(code: "USD"))
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
                    .onChange(of: allocation.amount) { _, newValue in
                        if totalBudget > 0 {
                            allocation.percentage = (newValue / totalBudget) * 100
                        }
                    }
            }

            HStack {
                Text("Percentage:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                TextField("Percentage", value: $allocation.percentage, format: .number)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)
                    .onChange(of: allocation.percentage) { _, newValue in
                        if totalBudget > 0 {
                            allocation.amount = totalBudget * (newValue / 100)
                        }
                    }

                Text("%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Progress bar showing percentage
            if totalBudget > 0 {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 6)
                            .cornerRadius(3)

                        Rectangle()
                            .fill(Color(allocation.category.color))
                            .frame(width: min(geometry.size.width * CGFloat(allocation.percentage / 100), geometry.size.width), height: 6)
                            .cornerRadius(3)
                    }
                }
                .frame(height: 6)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Budget Template Selector
struct BudgetTemplateSelector: View {
    @ObservedObject var viewModel: BudgetPlanningViewModel
    let onSelect: (BudgetTemplate) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                if viewModel.templates.isEmpty {
                    Text("No templates available")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(viewModel.templates) { template in
                        Button(action: {
                            onSelect(template)
                            dismiss()
                        }) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text(template.name)
                                        .font(.headline)

                                    Spacer()

                                    if template.isDefault {
                                        Text("DEFAULT")
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.blue.opacity(0.2))
                                            .foregroundColor(.blue)
                                            .cornerRadius(4)
                                    }
                                }

                                Text(template.description)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)

                                HStack {
                                    Image(systemName: template.period.icon)
                                        .font(.caption)
                                    Text(template.period.rawValue)
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    Spacer()

                                    Text("\(template.categories.count) categories")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Select Template")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .task {
                if viewModel.templates.isEmpty {
                    await viewModel.fetchTemplates()
                }
            }
        }
    }
}

#Preview {
    BudgetEditorView(viewModel: BudgetPlanningViewModel())
}
