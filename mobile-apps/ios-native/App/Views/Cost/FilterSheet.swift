//
//  FilterSheet.swift
//  Fleet Manager
//
//  Filter sheet for cost analysis
//

import SwiftUI

struct FilterSheet: View {
    @ObservedObject var viewModel: CostViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var tempCategory: CostCategory?
    @State private var tempDepartment: String?
    @State private var tempVehicleId: String?
    @State private var tempDateRange: DateRangeFilter

    init(viewModel: CostViewModel) {
        self.viewModel = viewModel
        _tempCategory = State(initialValue: viewModel.selectedCategory)
        _tempDepartment = State(initialValue: viewModel.selectedDepartment)
        _tempVehicleId = State(initialValue: viewModel.selectedVehicleId)
        _tempDateRange = State(initialValue: viewModel.selectedDateRange)
    }

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Category")) {
                    Picker("Filter by Category", selection: $tempCategory) {
                        Text("All Categories").tag(nil as CostCategory?)
                        ForEach(CostCategory.allCases, id: \.self) { category in
                            HStack {
                                Image(systemName: category.icon)
                                Text(category.rawValue)
                            }
                            .tag(category as CostCategory?)
                        }
                    }
                    .pickerStyle(.navigationLink)
                }

                Section(header: Text("Department")) {
                    HStack {
                        TextField("Department Name", text: Binding(
                            get: { tempDepartment ?? "" },
                            set: { tempDepartment = $0.isEmpty ? nil : $0 }
                        ))
                        .textContentType(.organizationName)

                        if tempDepartment != nil {
                            Button(action: { tempDepartment = nil }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                Section(header: Text("Vehicle")) {
                    HStack {
                        TextField("Vehicle ID", text: Binding(
                            get: { tempVehicleId ?? "" },
                            set: { tempVehicleId = $0.isEmpty ? nil : $0 }
                        ))
                        .textContentType(.none)
                        .autocapitalization(.none)

                        if tempVehicleId != nil {
                            Button(action: { tempVehicleId = nil }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                Section(header: Text("Date Range")) {
                    Picker("Period", selection: $tempDateRange) {
                        ForEach(DateRangeFilter.allCases, id: \.self) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.navigationLink)
                }

                Section {
                    Button(action: clearAllFilters) {
                        HStack {
                            Image(systemName: "xmark.circle")
                            Text("Clear All Filters")
                        }
                        .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        applyFilters()
                        dismiss()
                    }
                    .bold()
                }
            }
        }
    }

    // MARK: - Actions

    private func applyFilters() {
        viewModel.selectedCategory = tempCategory
        viewModel.selectedDepartment = tempDepartment
        viewModel.selectedVehicleId = tempVehicleId
        viewModel.selectedDateRange = tempDateRange

        Task {
            await viewModel.applyFilters()
        }
    }

    private func clearAllFilters() {
        tempCategory = nil
        tempDepartment = nil
        tempVehicleId = nil
        tempDateRange = .thisMonth
    }
}

// MARK: - Preview

#Preview {
    FilterSheet(viewModel: CostViewModel())
}
