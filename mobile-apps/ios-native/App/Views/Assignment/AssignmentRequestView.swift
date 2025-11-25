//
//  AssignmentRequestView.swift
//  Fleet Manager - iOS Native App
//
//  Driver request form for vehicle assignments
//

import SwiftUI

struct AssignmentRequestView: View {
    @ObservedObject var viewModel: VehicleAssignmentViewModel
    @Environment(\.dismiss) var dismiss

    @State private var vehicleId = ""
    @State private var vehicleType = ""
    @State private var preferSpecificVehicle = false
    @State private var assignmentType: VehicleAssignmentType = .temporary
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 7, to: Date())!
    @State private var hasDuration = true
    @State private var purpose = ""
    @State private var notes = ""

    @State private var isSubmitting = false
    @State private var showSuccessAlert = false

    var isValid: Bool {
        !purpose.isEmpty && (preferSpecificVehicle ? !vehicleId.isEmpty : !vehicleType.isEmpty)
    }

    var body: some View {
        NavigationView {
            Form {
                // Request Type
                Section(header: Text("Vehicle Preference")) {
                    Toggle("Request Specific Vehicle", isOn: $preferSpecificVehicle)

                    if preferSpecificVehicle {
                        TextField("Vehicle ID", text: $vehicleId)
                            .textInputAutocapitalization(.characters)
                    } else {
                        TextField("Vehicle Type (SUV, Truck, Van)", text: $vehicleType)
                            .textInputAutocapitalization(.words)
                    }

                    Picker("Assignment Type", selection: $assignmentType) {
                        ForEach([VehicleAssignmentType.temporary, .pool, .project], id: \.self) { type in
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

                // Request Details
                Section(header: Text("Request Details")) {
                    TextField("Purpose", text: $purpose)
                        .textInputAutocapitalization(.sentences)

                    TextField("Additional Notes (Optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...5)
                        .textInputAutocapitalization(.sentences)
                }

                // Schedule
                Section(header: Text("Schedule")) {
                    DatePicker("Start Date", selection: $startDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])

                    Toggle("Has End Date", isOn: $hasDuration)

                    if hasDuration {
                        DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: [.date, .hourAndMinute])
                    }

                    if hasDuration {
                        let days = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
                        Text("Duration: \(days) days")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Information
                Section {
                    HStack {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.blue)
                        Text("Your request will be reviewed by a manager")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Request Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        submitRequest()
                    }
                    .disabled(!isValid || isSubmitting)
                    .fontWeight(.semibold)
                }
            }
            .overlay {
                if isSubmitting {
                    LoadingOverlay()
                }
            }
            .alert("Request Submitted", isPresented: $showSuccessAlert) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your vehicle assignment request has been submitted for approval.")
            }
        }
    }

    private func submitRequest() {
        isSubmitting = true

        let request = AssignmentRequest(
            id: UUID().uuidString,
            tenantId: "tenant-001", // Get from auth
            vehicleId: preferSpecificVehicle ? vehicleId : nil,
            vehicleType: preferSpecificVehicle ? nil : vehicleType,
            requestedBy: "current-user", // Get from auth
            assignmentType: assignmentType,
            startDate: startDate,
            endDate: hasDuration ? endDate : nil,
            purpose: purpose,
            notes: notes.isEmpty ? nil : notes,
            status: .pending,
            reviewedBy: nil,
            reviewedAt: nil,
            reviewNotes: nil,
            assignmentId: nil,
            createdAt: Date(),
            updatedAt: Date()
        )

        Task {
            let success = await viewModel.submitRequest(request)
            isSubmitting = false

            if success {
                showSuccessAlert = true
            }
        }
    }
}

// MARK: - Preview
#Preview {
    AssignmentRequestView(viewModel: VehicleAssignmentViewModel())
}
