//
//  AssignmentView.swift
//  Fleet Manager - iOS Native App
//
//  View for creating and managing dispatch assignments
//

import SwiftUI

struct AssignmentView: View {
    @ObservedObject var viewModel: DispatchViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedVehicleId: String = ""
    @State private var selectedDriverId: String = ""
    @State private var assignmentType: AssignmentType = .delivery
    @State private var priority: AssignmentPriority = .normal
    @State private var description: String = ""
    @State private var notes: String = ""
    @State private var scheduledStart: Date = Date()
    @State private var scheduledEnd: Date = Date().addingTimeInterval(3600 * 4)
    @State private var locationName: String = ""
    @State private var locationAddress: String = ""

    var body: some View {
        NavigationView {
            Form {
                // Vehicle Selection
                Section("Vehicle") {
                    Picker("Select Vehicle", selection: $selectedVehicleId) {
                        Text("Select a vehicle").tag("")
                        ForEach(viewModel.availableVehiclesList) { vehicle in
                            HStack {
                                Image(systemName: vehicle.type.icon)
                                Text("\(vehicle.number) - \(vehicle.make) \(vehicle.model)")
                            }
                            .tag(vehicle.id)
                        }
                    }

                    if let vehicle = viewModel.vehicles.first(where: { $0.id == selectedVehicleId }) {
                        VehicleInfoRow(vehicle: vehicle)
                    }
                }

                // Driver Selection
                Section("Driver") {
                    Picker("Select Driver", selection: $selectedDriverId) {
                        Text("Select a driver").tag("")
                        ForEach(viewModel.availableDriversList) { driver in
                            HStack {
                                Text(driver.fullName)
                                if let availability = driver.schedule?.availability {
                                    Text("•")
                                        .foregroundColor(.secondary)
                                    Text(availability.displayName)
                                        .foregroundColor(availability.color)
                                }
                            }
                            .tag(driver.id)
                        }
                    }

                    if let driver = viewModel.drivers.first(where: { $0.id == selectedDriverId }) {
                        DriverInfoRow(driver: driver)
                    }
                }

                // Assignment Details
                Section("Assignment Details") {
                    Picker("Type", selection: $assignmentType) {
                        ForEach(AssignmentType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.icon)
                                .tag(type)
                        }
                    }

                    Picker("Priority", selection: $priority) {
                        ForEach(AssignmentPriority.allCases, id: \.self) { priority in
                            Label(priority.displayName, systemImage: priority.icon)
                                .foregroundColor(priority.color)
                                .tag(priority)
                        }
                    }

                    TextField("Description", text: $description)
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                // Schedule
                Section("Schedule") {
                    DatePicker("Start Time", selection: $scheduledStart, displayedComponents: [.date, .hourAndMinute])
                    DatePicker("End Time", selection: $scheduledEnd, displayedComponents: [.date, .hourAndMinute])

                    if scheduledEnd <= scheduledStart {
                        Label("End time must be after start time", systemImage: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                // Location (Optional)
                Section("Destination") {
                    TextField("Location Name", text: $locationName)
                    TextField("Address", text: $locationAddress, axis: .vertical)
                        .lineLimit(2...4)
                }

                // Quick Assignment Actions
                Section {
                    Button {
                        Task {
                            await createAssignment()
                        }
                    } label: {
                        HStack {
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                            Text("Create Assignment")
                                .fontWeight(.semibold)
                            Spacer()
                        }
                    }
                    .disabled(!isFormValid)
                    .foregroundColor(isFormValid ? .white : .gray)
                    .listRowBackground(isFormValid ? ModernTheme.Colors.primary : Color.gray.opacity(0.3))
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
                    if viewModel.selectedVehicle != nil || viewModel.selectedDriver != nil {
                        Button("Quick Assign") {
                            quickAssign()
                        }
                        .disabled(!canQuickAssign)
                    }
                }
            }
            .onAppear {
                // Pre-select vehicle or driver if one was selected in dispatch console
                if let vehicle = viewModel.selectedVehicle {
                    selectedVehicleId = vehicle.id
                }
                if let driver = viewModel.selectedDriver {
                    selectedDriverId = driver.id
                }
            }
        }
    }

    // MARK: - Computed Properties
    private var isFormValid: Bool {
        !selectedVehicleId.isEmpty &&
        !description.isEmpty &&
        scheduledEnd > scheduledStart
    }

    private var canQuickAssign: Bool {
        !selectedVehicleId.isEmpty && !selectedDriverId.isEmpty
    }

    // MARK: - Actions
    private func createAssignment() async {
        let assignment = Assignment(
            id: UUID().uuidString,
            tenantId: "current-tenant", // Should come from auth context
            vehicleId: selectedVehicleId,
            driverId: selectedDriverId.isEmpty ? nil : selectedDriverId,
            routeId: nil,
            tripId: nil,
            type: assignmentType,
            status: selectedDriverId.isEmpty ? .pending : .assigned,
            priority: priority,
            scheduledStart: scheduledStart,
            scheduledEnd: scheduledEnd,
            actualStart: nil,
            actualEnd: nil,
            description: description,
            notes: notes.isEmpty ? nil : notes,
            location: locationName.isEmpty ? nil : AssignmentLocation(
                name: locationName,
                address: locationAddress,
                lat: 0, // Would need geocoding
                lng: 0,
                notes: nil
            ),
            checkpoints: [],
            createdBy: "current-user", // Should come from auth context
            createdAt: Date(),
            updatedAt: Date()
        )

        await viewModel.createAssignment(assignment)
        dismiss()
    }

    private func quickAssign() {
        Task {
            await viewModel.assignVehicleToDriver(
                vehicleId: selectedVehicleId,
                driverId: selectedDriverId
            )
            dismiss()
        }
    }
}

// MARK: - Vehicle Info Row
struct VehicleInfoRow: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.blue)
                Text("Vehicle Details")
                    .font(.caption.weight(.semibold))
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    DetailItem(label: "Status", value: vehicle.status.displayName, color: vehicle.status.themeColor)
                    DetailItem(label: "Fuel", value: "\(vehicle.fuelLevelPercentage)%")
                    DetailItem(label: "Mileage", value: String(format: "%.0f mi", vehicle.mileage))
                }

                Spacer()

                VStack(alignment: .leading, spacing: 4) {
                    DetailItem(label: "Region", value: vehicle.region)
                    DetailItem(label: "Department", value: vehicle.department)
                    if let driver = vehicle.assignedDriver {
                        DetailItem(label: "Current Driver", value: driver, color: .orange)
                    }
                }
            }
        }
        .padding(ModernTheme.Spacing.sm)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Driver Info Row
struct DriverInfoRow: View {
    let driver: Driver

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.blue)
                Text("Driver Details")
                    .font(.caption.weight(.semibold))
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    DetailItem(label: "Status", value: driver.status.displayName, color: driver.status.color)
                    DetailItem(label: "Department", value: driver.department)
                    if let availability = driver.schedule?.availability {
                        DetailItem(label: "Availability", value: availability.displayName, color: availability.color)
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 4) {
                    DetailItem(label: "Safety Score", value: String(format: "%.1f", driver.performanceMetrics.safetyScore))
                    DetailItem(label: "Total Trips", value: "\(driver.performanceMetrics.totalTrips)")
                    if !driver.assignedVehicles.isEmpty {
                        DetailItem(label: "Current Vehicles", value: "\(driver.assignedVehicles.count)", color: .orange)
                    }
                }
            }
        }
        .padding(ModernTheme.Spacing.sm)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Detail Item
struct DetailItem: View {
    let label: String
    let value: String
    var color: Color?

    var body: some View {
        HStack(spacing: 4) {
            Text(label + ":")
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(value)
                .font(.caption2.weight(.semibold))
                .foregroundColor(color ?? .primary)
        }
    }
}

// MARK: - Dispatch Filter Sheet
struct DispatchFilterSheet: View {
    @ObservedObject var viewModel: DispatchViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Region") {
                    Picker("Select Region", selection: $viewModel.selectedRegion) {
                        Text("All Regions").tag(nil as String?)
                        ForEach(viewModel.availableRegions, id: \.self) { region in
                            Text(region).tag(region as String?)
                        }
                    }
                }

                Section("Department") {
                    Picker("Select Department", selection: $viewModel.selectedDepartment) {
                        Text("All Departments").tag(nil as String?)
                        ForEach(viewModel.availableDepartments, id: \.self) { department in
                            Text(department).tag(department as String?)
                        }
                    }
                }

                Section("Vehicle Status") {
                    Picker("Select Status", selection: $viewModel.selectedStatus) {
                        Text("All Statuses").tag(nil as VehicleStatus?)
                        ForEach(VehicleStatus.allCases, id: \.self) { status in
                            HStack {
                                Circle()
                                    .fill(status.themeColor)
                                    .frame(width: 12, height: 12)
                                Text(status.displayName)
                            }
                            .tag(status as VehicleStatus?)
                        }
                    }
                }

                Section {
                    Button {
                        viewModel.clearFilters()
                    } label: {
                        HStack {
                            Spacer()
                            Image(systemName: "xmark.circle")
                            Text("Clear All Filters")
                            Spacer()
                        }
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
#if DEBUG
struct AssignmentView_Previews: PreviewProvider {
    static var previews: some View {
        AssignmentView(viewModel: DispatchViewModel())
    }
}
#endif
