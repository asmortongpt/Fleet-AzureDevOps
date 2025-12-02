//
//  AddCostRecordView.swift
//  Fleet Manager
//
//  Form to add new cost records
//

import SwiftUI

struct AddCostRecordView: View {
    @ObservedObject var viewModel: CostViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var vehicleId = ""
    @State private var vehicleNumber = ""
    @State private var department = ""
    @State private var selectedCategory: CostCategory = .fuel
    @State private var amount = ""
    @State private var date = Date()
    @State private var odometer = ""
    @State private var vendor = ""
    @State private var invoiceNumber = ""
    @State private var description = ""

    @State private var showError = false
    @State private var errorMessage = ""
    @State private var isSaving = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle Information")) {
                    TextField("Vehicle ID", text: $vehicleId)
                        .textContentType(.none)
                        .autocapitalization(.none)

                    TextField("Vehicle Number", text: $vehicleNumber)
                        .textContentType(.none)

                    TextField("Department", text: $department)
                        .textContentType(.organizationName)
                }

                Section(header: Text("Cost Details")) {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(CostCategory.allCases, id: \.self) { category in
                            HStack {
                                Image(systemName: category.icon)
                                Text(category.rawValue)
                            }
                            .tag(category)
                        }
                    }

                    HStack {
                        Text("$")
                            .foregroundColor(.secondary)
                        TextField("Amount", text: $amount)
                            .keyboardType(.decimalPad)
                    }

                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section(header: Text("Additional Information")) {
                    TextField("Odometer (optional)", text: $odometer)
                        .keyboardType(.decimalPad)

                    TextField("Vendor (optional)", text: $vendor)
                        .textContentType(.organizationName)

                    TextField("Invoice Number (optional)", text: $invoiceNumber)
                        .textContentType(.none)

                    TextField("Description (optional)", text: $description)
                        .textContentType(.none)
                }
            }
            .navigationTitle("Add Cost")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: saveCost) {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Save")
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

    // MARK: - Validation

    private var isValid: Bool {
        !vehicleId.isEmpty &&
        !vehicleNumber.isEmpty &&
        !department.isEmpty &&
        !amount.isEmpty &&
        Double(amount) != nil &&
        Double(amount)! > 0
    }

    // MARK: - Save Cost

    private func saveCost() {
        guard isValid else { return }

        isSaving = true

        Task {
            let success = await viewModel.addCostRecord(
                vehicleId: vehicleId,
                vehicleNumber: vehicleNumber,
                department: department,
                category: selectedCategory,
                amount: Double(amount) ?? 0,
                date: date,
                odometer: Double(odometer),
                vendor: vendor.isEmpty ? nil : vendor,
                invoiceNumber: invoiceNumber.isEmpty ? nil : invoiceNumber,
                description: description.isEmpty ? nil : description
            )

            isSaving = false

            if success {
                dismiss()
            } else {
                errorMessage = viewModel.errorMessage ?? "Failed to save cost record"
                showError = true
            }
        }
    }
}

// MARK: - Preview

#Preview {
    AddCostRecordView(viewModel: CostViewModel())
}
