//
//  CreateAssignmentView.swift
//  Fleet Manager - iOS Native App
//
//  View for creating new vehicle assignments with conflict detection
//

import SwiftUI

struct CreateAssignmentView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel
    @Environment(\.dismiss) var dismiss

    @State private var vehicleId = ""
    @State private var assignedTo = ""
    @State private var assignmentType: VehicleAssignmentType = .temporary
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State private var hasDuration = true
    @State private var purpose = ""
    @State private var notes = ""
    @State private var odometer = ""
    @State private var fuelLevel = ""

    @State private var detectedConflicts: [AssignmentConflict] = []
    @State private var showingConflictWarning = false
    @State private var isSaving = false

    var isValid: Bool {
        !vehicleId.isEmpty && !assignedTo.isEmpty && !purpose.isEmpty
    }

    var body: some View {
        NavigationView {
            Form {
                // Vehicle Selection
                Section(header: Text("Vehicle Information")) {
                    TextField("Vehicle ID", text: $vehicleId)
                        .onChange(of: vehicleId) { _ in checkConflicts() }

                    Picker("Assignment Type", selection: $assignmentType) {
                        ForEach(VehicleAssignmentType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.displayName)
                            }
                            .tag(type)
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(assignmentType.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Assignment Details
                Section(header: Text("Assignment Details")) {
                    TextField("Assigned To (Driver/Dept/Project)", text: $assignedTo)

                    TextField("Purpose", text: $purpose)
                        .textInputAutocapitalization(.sentences)

                    TextField("Notes (Optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...5)
                        .textInputAutocapitalization(.sentences)
                }

                // Date Range
                Section(header: Text("Schedule")) {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: [.date, .hourAndMinute])
                        .onChange(of: startDate) { _ in checkConflicts() }

                    Toggle("Has End Date", isOn: $hasDuration)

                    if hasDuration {
                        DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: [.date, .hourAndMinute])
                            .onChange(of: endDate) { _ in checkConflicts() }
                    }

                    if hasDuration {
                        let days = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
                        Text("Duration: \(days) days")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Vehicle Condition
                Section(header: Text("Initial Condition")) {
                    HStack {
                        Text("Odometer")
                        Spacer()
                        TextField("Miles", text: $odometer)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }

                    HStack {
                        Text("Fuel Level")
                        Spacer()
                        TextField("0.0 - 1.0", text: $fuelLevel)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                }

                // Conflict Detection
                if !detectedConflicts.isEmpty {
                    Section(header: HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text("Conflicts Detected (\(detectedConflicts.count))")
                    }) {
                        ForEach(detectedConflicts) { conflict in
                            ConflictWarningRow(conflict: conflict)
                        }
                    }
                }

                // Availability Status
                Section {
                    if detectedConflicts.isEmpty && !vehicleId.isEmpty {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Vehicle is available for this period")
                                .font(.subheadline)
                        }
                    }
                }
            }
            .navigationTitle("New Assignment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        createAssignment()
                    }
                    .disabled(!isValid || isSaving)
                    .fontWeight(.semibold)
                }
            }
            .overlay {
                if isSaving {
                    LoadingOverlay()
                }
            }
            .alert("Conflicts Detected", isPresented: $showingConflictWarning) {
                Button("Create Anyway", role: .destructive) {
                    createAssignment(ignoreConflicts: true)
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This assignment conflicts with \(detectedConflicts.count) existing assignment(s). Do you want to continue?")
            }
        }
    }

    private func checkConflicts() {
        guard !vehicleId.isEmpty else {
            detectedConflicts = []
            return
        }

        let tempAssignment = VehicleAssignment(
            id: UUID().uuidString,
            tenantId: "temp",
            vehicleId: vehicleId,
            assignedTo: assignedTo,
            assignmentType: assignmentType,
            status: .pending,
            startDate: startDate,
            endDate: hasDuration ? endDate : nil,
            purpose: purpose,
            notes: notes.isEmpty ? nil : notes,
            approvedBy: nil,
            approvedAt: nil,
            requestedBy: "current-user",
            requestedAt: Date(),
            handoffNotes: nil,
            odometer: Double(odometer),
            fuelLevel: Double(fuelLevel),
            returnOdometer: nil,
            returnFuelLevel: nil,
            returnCondition: nil,
            returnNotes: nil,
            returnedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        detectedConflicts = viewModel.getConflicts(for: tempAssignment)
    }

    private func createAssignment(ignoreConflicts: Bool = false) {
        if !ignoreConflicts && !detectedConflicts.isEmpty {
            showingConflictWarning = true
            return
        }

        isSaving = true

        let assignment = VehicleAssignment(
            id: UUID().uuidString,
            tenantId: "tenant-001", // Get from auth
            vehicleId: vehicleId,
            assignedTo: assignedTo,
            assignmentType: assignmentType,
            status: .pending,
            startDate: startDate,
            endDate: hasDuration ? endDate : nil,
            purpose: purpose,
            notes: notes.isEmpty ? nil : notes,
            approvedBy: nil,
            approvedAt: nil,
            requestedBy: "current-user", // Get from auth
            requestedAt: Date(),
            handoffNotes: nil,
            odometer: Double(odometer),
            fuelLevel: Double(fuelLevel),
            returnOdometer: nil,
            returnFuelLevel: nil,
            returnCondition: nil,
            returnNotes: nil,
            returnedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        Task {
            let success = await viewModel.createAssignment(assignment)
            isSaving = false

            if success {
                dismiss()
            }
        }
    }
}

// MARK: - Conflict Warning Row
struct ConflictWarningRow: View {
    let conflict: AssignmentConflict

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Overlaps with existing assignment")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.red)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Assigned to: \(conflict.assignment1.assignedTo)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("Overlap: \(conflict.overlapDays) day(s)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.leading, 24)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Filters View
struct AssignmentFiltersView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Status")) {
                    Picker("Status", selection: $viewModel.filterStatus) {
                        Text("All").tag(nil as VehicleAssignmentStatus?)
                        ForEach(VehicleAssignmentStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(status as VehicleAssignmentStatus?)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section(header: Text("Type")) {
                    Picker("Type", selection: $viewModel.filterType) {
                        Text("All").tag(nil as VehicleAssignmentType?)
                        ForEach(VehicleAssignmentType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.displayName)
                            }
                            .tag(type as VehicleAssignmentType?)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section(header: Text("Options")) {
                    Toggle("Show Only Active", isOn: $viewModel.showOnlyActive)
                    Toggle("Show Only Conflicts", isOn: $viewModel.showOnlyConflicts)
                }

                Section {
                    Button("Reset Filters") {
                        viewModel.resetFilters()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    CreateAssignmentView(viewModel: VehicleAssignmentViewModel())
}
