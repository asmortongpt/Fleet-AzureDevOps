//
//  StockMovementView.swift
//  Fleet Manager
//
//  View for recording stock movements (in, out, transfer, adjustment)
//

import SwiftUI

struct StockMovementView: View {
    let item: InventoryItem
    @ObservedObject var viewModel: InventoryManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedMovementType: MovementType = .stockOut
    @State private var quantity: Int = 1
    @State private var fromLocation: StockLocation
    @State private var toLocation: StockLocation = .warehouse
    @State private var fromLocationDetail = ""
    @State private var toLocationDetail = ""
    @State private var vehicleId = ""
    @State private var workOrderId = ""
    @State private var supplierId = ""
    @State private var costPerUnit = ""
    @State private var reason = ""
    @State private var notes = ""
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var isProcessing = false

    init(item: InventoryItem, viewModel: InventoryManagementViewModel) {
        self.item = item
        self.viewModel = viewModel
        _fromLocation = State(initialValue: item.location)
    }

    var body: some View {
        NavigationView {
            Form {
                // Item Information
                Section(header: Text("Item")) {
                    HStack {
                        Text("Item")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(item.name)
                            .fontWeight(.medium)
                    }

                    HStack {
                        Text("SKU")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(item.sku)
                            .fontWeight(.medium)
                    }

                    HStack {
                        Text("Current Stock")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(item.quantity) \(item.unitOfMeasure)")
                            .fontWeight(.medium)
                    }
                }

                // Movement Type
                Section(header: Text("Movement Type")) {
                    Picker("Type", selection: $selectedMovementType) {
                        ForEach(MovementType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }

                // Quantity
                Section(header: Text("Quantity")) {
                    Stepper("Quantity: \(quantity)", value: $quantity, in: 1...1000)

                    if selectedMovementType == .stockOut && quantity > item.quantity {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("Insufficient stock available")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }

                // Location Fields
                locationSection

                // Additional Fields
                additionalFieldsSection

                // Notes
                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }

                // Summary
                Section(header: Text("Summary")) {
                    HStack {
                        Text("Movement")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(selectedMovementType.rawValue)
                            .fontWeight(.medium)
                    }

                    HStack {
                        Text("Quantity")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(quantity) \(item.unitOfMeasure)")
                            .fontWeight(.medium)
                    }

                    if let cost = Double(costPerUnit), cost > 0 {
                        HStack {
                            Text("Total Cost")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text(String(format: "$%.2f", cost * Double(quantity)))
                                .fontWeight(.semibold)
                                .foregroundColor(.green)
                        }
                    }

                    HStack {
                        Text("New Stock Level")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(calculateNewStockLevel()) \(item.unitOfMeasure)")
                            .fontWeight(.semibold)
                            .foregroundColor(stockLevelColor)
                    }
                }
            }
            .navigationTitle("Stock Movement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isProcessing)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveMovement()
                    }
                    .disabled(!canSave || isProcessing)
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .overlay {
                if isProcessing {
                    ProgressView("Processing...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 10)
                }
            }
        }
    }

    // MARK: - Location Section
    @ViewBuilder
    private var locationSection: some View {
        switch selectedMovementType {
        case .stockIn:
            Section(header: Text("Destination")) {
                Picker("To Location", selection: $toLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("Location Detail (Optional)", text: $toLocationDetail)
                    .textContentType(.none)
                    .autocapitalization(.words)
            }

        case .stockOut:
            Section(header: Text("Source")) {
                Picker("From Location", selection: $fromLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("Location Detail (Optional)", text: $fromLocationDetail)
                    .textContentType(.none)
                    .autocapitalization(.words)
            }

        case .transfer:
            Section(header: Text("Transfer")) {
                Picker("From Location", selection: $fromLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("From Location Detail (Optional)", text: $fromLocationDetail)
                    .textContentType(.none)
                    .autocapitalization(.words)

                Picker("To Location", selection: $toLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("To Location Detail (Optional)", text: $toLocationDetail)
                    .textContentType(.none)
                    .autocapitalization(.words)
            }

        case .adjustment:
            Section(header: Text("Location")) {
                Picker("Location", selection: $fromLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("Location Detail (Optional)", text: $fromLocationDetail)
                    .textContentType(.none)
                    .autocapitalization(.words)

                TextField("Reason for Adjustment", text: $reason)
                    .textContentType(.none)
                    .autocapitalization(.sentences)
            }

        case .returnToSupplier, .damaged:
            Section(header: Text("Source")) {
                Picker("From Location", selection: $fromLocation) {
                    ForEach(StockLocation.allCases, id: \.self) { location in
                        Text(location.rawValue).tag(location)
                    }
                }

                TextField("Reason", text: $reason)
                    .textContentType(.none)
                    .autocapitalization(.sentences)
            }
        }
    }

    // MARK: - Additional Fields Section
    @ViewBuilder
    private var additionalFieldsSection: some View {
        Section(header: Text("Additional Information")) {
            if selectedMovementType == .stockOut {
                TextField("Vehicle ID (Optional)", text: $vehicleId)
                    .textContentType(.none)
                    .autocapitalization(.allCharacters)

                TextField("Work Order ID (Optional)", text: $workOrderId)
                    .textContentType(.none)
                    .autocapitalization(.allCharacters)
            }

            if selectedMovementType == .stockIn || selectedMovementType == .returnToSupplier {
                TextField("Supplier ID (Optional)", text: $supplierId)
                    .textContentType(.none)
                    .autocapitalization(.allCharacters)
            }

            if selectedMovementType == .stockIn {
                TextField("Cost Per Unit (Optional)", text: $costPerUnit)
                    .keyboardType(.decimalPad)
            }
        }
    }

    // MARK: - Computed Properties
    private var canSave: Bool {
        quantity > 0 && (selectedMovementType != .stockOut || quantity <= item.quantity)
    }

    private var stockLevelColor: Color {
        let newLevel = calculateNewStockLevel()
        if newLevel == 0 {
            return .red
        } else if newLevel <= item.minLevel {
            return .orange
        } else if newLevel >= item.maxLevel {
            return .purple
        } else {
            return .green
        }
    }

    // MARK: - Helper Methods
    private func calculateNewStockLevel() -> Int {
        switch selectedMovementType {
        case .stockIn, .transfer:
            return item.quantity + quantity
        case .stockOut, .damaged, .returnToSupplier:
            return max(0, item.quantity - quantity)
        case .adjustment:
            return quantity
        }
    }

    private func saveMovement() {
        isProcessing = true

        Task {
            do {
                switch selectedMovementType {
                case .stockIn:
                    let cost = Double(costPerUnit)
                    try await viewModel.recordStockIn(
                        itemId: item.id,
                        quantity: quantity,
                        location: toLocation,
                        locationDetail: toLocationDetail.isEmpty ? nil : toLocationDetail,
                        supplierId: supplierId.isEmpty ? nil : supplierId,
                        costPerUnit: cost,
                        notes: notes.isEmpty ? nil : notes
                    )

                case .stockOut:
                    try await viewModel.recordStockOut(
                        itemId: item.id,
                        quantity: quantity,
                        fromLocation: fromLocation,
                        fromLocationDetail: fromLocationDetail.isEmpty ? nil : fromLocationDetail,
                        vehicleId: vehicleId.isEmpty ? nil : vehicleId,
                        workOrderId: workOrderId.isEmpty ? nil : workOrderId,
                        reason: reason.isEmpty ? nil : reason,
                        notes: notes.isEmpty ? nil : notes
                    )

                case .transfer:
                    try await viewModel.recordTransfer(
                        itemId: item.id,
                        quantity: quantity,
                        fromLocation: fromLocation,
                        fromLocationDetail: fromLocationDetail.isEmpty ? nil : fromLocationDetail,
                        toLocation: toLocation,
                        toLocationDetail: toLocationDetail.isEmpty ? nil : toLocationDetail,
                        notes: notes.isEmpty ? nil : notes
                    )

                case .adjustment, .damaged, .returnToSupplier:
                    try await viewModel.recordAdjustment(
                        itemId: item.id,
                        quantity: selectedMovementType == .adjustment ? quantity : -quantity,
                        location: fromLocation,
                        reason: reason.isEmpty ? selectedMovementType.rawValue : reason,
                        notes: notes.isEmpty ? nil : notes
                    )
                }

                await MainActor.run {
                    isProcessing = false
                    dismiss()
                }

            } catch {
                await MainActor.run {
                    isProcessing = false
                    errorMessage = error.localizedDescription
                    showingError = true
                }
            }
        }
    }
}

#Preview {
    StockMovementView(
        item: InventoryItem.sample,
        viewModel: InventoryManagementViewModel()
    )
}
