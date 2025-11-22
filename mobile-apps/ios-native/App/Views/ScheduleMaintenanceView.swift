//
//  ScheduleMaintenanceView.swift
//  Fleet Manager
//
//  Schedule new maintenance for vehicles
//

import SwiftUI

struct ScheduleMaintenanceView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = MaintenanceViewModel()

    @State private var selectedVehicleId: String = ""
    @State private var selectedType: MaintenanceType = .preventive
    @State private var selectedCategory: MaintenanceCategory = .oilChange
    @State private var selectedPriority: MaintenancePriority = .normal
    @State private var scheduledDate: Date = Date()
    @State private var description: String = ""
    @State private var estimatedCost: String = ""
    @State private var serviceProvider: String = ""
    @State private var location: String = ""
    @State private var notes: String = ""
    @State private var showingVehiclePicker = false
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationView {
            Form {
                // Vehicle Selection
                Section("Vehicle") {
                    Button(action: { showingVehiclePicker = true }) {
                        HStack {
                            Image(systemName: "car.fill")
                                .foregroundColor(.blue)
                            Text(selectedVehicleId.isEmpty ? "Select Vehicle" : selectedVehicleId)
                                .foregroundColor(selectedVehicleId.isEmpty ? .secondary : .primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Maintenance Type
                Section("Maintenance Type") {
                    Picker("Type", selection: $selectedType) {
                        ForEach(MaintenanceType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                    .pickerStyle(.menu)

                    Picker("Category", selection: $selectedCategory) {
                        ForEach(MaintenanceCategory.allCases, id: \.self) { category in
                            Text(category.rawValue).tag(category)
                        }
                    }
                    .pickerStyle(.menu)
                }

                // Schedule
                Section("Schedule") {
                    DatePicker("Date", selection: $scheduledDate, displayedComponents: [.date, .hourAndMinute])

                    Picker("Priority", selection: $selectedPriority) {
                        ForEach(MaintenancePriority.allCases, id: \.self) { priority in
                            HStack {
                                Circle()
                                    .fill(priorityColor(priority))
                                    .frame(width: 10, height: 10)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }
                    .pickerStyle(.menu)
                }

                // Description
                Section("Description") {
                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                }

                // Cost & Provider
                Section("Service Details") {
                    HStack {
                        Text("$")
                            .foregroundColor(.secondary)
                        TextField("Estimated Cost", text: $estimatedCost)
                            .keyboardType(.decimalPad)
                    }

                    TextField("Service Provider", text: $serviceProvider)

                    TextField("Location", text: $location)
                }

                // Notes
                Section("Additional Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                // Quick Schedule Options
                Section("Quick Schedule") {
                    QuickScheduleButton(title: "Oil Change", icon: "drop.fill", color: .yellow) {
                        selectedCategory = .oilChange
                        selectedType = .preventive
                        description = "Regular oil change service"
                    }

                    QuickScheduleButton(title: "Tire Rotation", icon: "circle.grid.cross.fill", color: .gray) {
                        selectedCategory = .tireRotation
                        selectedType = .preventive
                        description = "Tire rotation and inspection"
                    }

                    QuickScheduleButton(title: "Brake Service", icon: "exclamationmark.octagon.fill", color: .red) {
                        selectedCategory = .brakeService
                        selectedType = .corrective
                        description = "Brake inspection and service"
                    }

                    QuickScheduleButton(title: "Full Inspection", icon: "checkmark.shield.fill", color: .green) {
                        selectedCategory = .diagnostic
                        selectedType = .preventive
                        description = "Complete vehicle inspection"
                    }
                }
            }
            .navigationTitle("Schedule Maintenance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveMaintenance()
                    }
                    .font(.headline)
                    .disabled(selectedVehicleId.isEmpty || description.isEmpty || isSaving)
                }
            }
            .sheet(isPresented: $showingVehiclePicker) {
                VehiclePickerView(selectedVehicleId: $selectedVehicleId)
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
            .overlay {
                if isSaving {
                    ProgressView("Scheduling...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(radius: 10)
                }
            }
        }
    }

    private func priorityColor(_ priority: MaintenancePriority) -> Color {
        switch priority {
        case .low: return .green
        case .normal: return .blue
        case .high: return .orange
        case .urgent: return .red
        case .critical: return .purple
        }
    }

    private func saveMaintenance() {
        guard !selectedVehicleId.isEmpty else {
            errorMessage = "Please select a vehicle"
            showError = true
            return
        }

        guard !description.isEmpty else {
            errorMessage = "Please enter a description"
            showError = true
            return
        }

        isSaving = true

        // Create the maintenance record
        let cost = Double(estimatedCost)
        viewModel.scheduleMaintenance(
            for: selectedVehicleId,
            type: selectedType,
            date: scheduledDate,
            description: description
        )

        // Simulate API call delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isSaving = false
            dismiss()
        }
    }
}

// MARK: - Quick Schedule Button
struct QuickScheduleButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 24)
                Text(title)
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "arrow.right.circle")
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Vehicle Picker View
struct VehiclePickerView: View {
    @Binding var selectedVehicleId: String
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vehicleViewModel = VehiclesViewModel()
    @State private var searchText = ""

    var filteredVehicles: [Vehicle] {
        if searchText.isEmpty {
            return vehicleViewModel.vehicles
        }
        return vehicleViewModel.vehicles.filter {
            $0.number.localizedCaseInsensitiveContains(searchText) ||
            $0.make.localizedCaseInsensitiveContains(searchText) ||
            $0.model.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationView {
            List(filteredVehicles) { vehicle in
                Button(action: {
                    selectedVehicleId = vehicle.number
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: vehicle.type.icon)
                            .foregroundColor(.blue)
                            .frame(width: 30)

                        VStack(alignment: .leading) {
                            Text(vehicle.number)
                                .font(.headline)
                            Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        if selectedVehicleId == vehicle.number {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.blue)
                        }
                    }
                }
                .foregroundColor(.primary)
            }
            .navigationTitle("Select Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search vehicles")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    ScheduleMaintenanceView()
}
