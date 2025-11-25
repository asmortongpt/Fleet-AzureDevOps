//
//  AddBudgetView.swift
//  Fleet Manager
//
//  Form to create new budgets
//

import SwiftUI

struct AddBudgetView: View {
    @ObservedObject var viewModel: CostViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var department = ""
    @State private var vehicleId = ""
    @State private var selectedCategory: CostCategory?
    @State private var selectedPeriod: BudgetPeriod = .monthly
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .month, value: 1, to: Date()) ?? Date()
    @State private var allocatedAmount = ""

    @State private var showError = false
    @State private var errorMessage = ""
    @State private var isSaving = false
    @State private var showCategoryPicker = false
    @State private var includeDepartment = false
    @State private var includeVehicle = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Budget Information")) {
                    TextField("Budget Name", text: $name)
                        .textContentType(.none)

                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(BudgetPeriod.allCases, id: \.self) { period in
                            HStack {
                                Image(systemName: period.icon)
                                Text(period.rawValue)
                            }
                            .tag(period)
                        }
                    }
                    .onChange(of: selectedPeriod) { newValue in
                        updateDates(for: newValue)
                    }

                    HStack {
                        Text("$")
                            .foregroundColor(.secondary)
                        TextField("Allocated Amount", text: $allocatedAmount)
                            .keyboardType(.decimalPad)
                    }
                }

                Section(header: Text("Date Range")) {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                        .onChange(of: startDate) { _ in
                            validateDates()
                        }

                    DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: .date)
                }

                Section(header: Text("Scope (Optional)")) {
                    Toggle("Specific Category", isOn: $showCategoryPicker)

                    if showCategoryPicker {
                        Picker("Category", selection: $selectedCategory) {
                            Text("All Categories").tag(nil as CostCategory?)
                            ForEach(CostCategory.allCases, id: \.self) { category in
                                HStack {
                                    Image(systemName: category.icon)
                                    Text(category.rawValue)
                                }
                                .tag(category as CostCategory?)
                            }
                        }
                    }

                    Toggle("Specific Department", isOn: $includeDepartment)

                    if includeDepartment {
                        TextField("Department", text: $department)
                            .textContentType(.organizationName)
                    }

                    Toggle("Specific Vehicle", isOn: $includeVehicle)

                    if includeVehicle {
                        TextField("Vehicle ID", text: $vehicleId)
                            .textContentType(.none)
                            .autocapitalization(.none)
                    }
                }

                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Budget Summary")
                            .font(.headline)

                        HStack {
                            Text("Duration:")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("\(daysCount) days")
                        }

                        if let amount = Double(allocatedAmount), amount > 0 {
                            HStack {
                                Text("Daily Budget:")
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text(String(format: "$%.2f", amount / Double(daysCount)))
                            }
                        }
                    }
                    .font(.subheadline)
                }
            }
            .navigationTitle("Create Budget")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: createBudget) {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Create")
                                .bold()
                        }
                    }
                    .disabled(isSaving || !isValid)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Computed Properties

    private var daysCount: Int {
        let days = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
        return max(1, days)
    }

    private var isValid: Bool {
        !name.isEmpty &&
        !allocatedAmount.isEmpty &&
        Double(allocatedAmount) != nil &&
        Double(allocatedAmount)! > 0 &&
        endDate > startDate
    }

    // MARK: - Date Management

    private func updateDates(for period: BudgetPeriod) {
        let calendar = Calendar.current
        startDate = Date()

        switch period {
        case .monthly:
            endDate = calendar.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        case .quarterly:
            endDate = calendar.date(byAdding: .month, value: 3, to: startDate) ?? startDate
        case .yearly:
            endDate = calendar.date(byAdding: .year, value: 1, to: startDate) ?? startDate
        case .custom:
            // Keep current end date for custom
            break
        }
    }

    private func validateDates() {
        if endDate <= startDate {
            endDate = Calendar.current.date(byAdding: .day, value: 1, to: startDate) ?? startDate
        }
    }

    // MARK: - Create Budget

    private func createBudget() {
        guard isValid else { return }

        isSaving = true

        Task {
            let success = await viewModel.createBudget(
                name: name,
                department: includeDepartment ? department : nil,
                vehicleId: includeVehicle ? vehicleId : nil,
                category: showCategoryPicker ? selectedCategory : nil,
                period: selectedPeriod,
                startDate: startDate,
                endDate: endDate,
                allocatedAmount: Double(allocatedAmount) ?? 0
            )

            isSaving = false

            if success {
                dismiss()
            } else {
                errorMessage = viewModel.errorMessage ?? "Failed to create budget"
                showError = true
            }
        }
    }
}

// MARK: - Preview

#Preview {
    AddBudgetView(viewModel: CostViewModel())
}
