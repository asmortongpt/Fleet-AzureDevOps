//
//  MaintenanceView.swift
//  Fleet Manager
//
//  Maintenance view placeholder - Full implementation pending model alignment
//

import SwiftUI

struct MaintenanceView: View {
    @StateObject private var viewModel = MaintenanceViewModel()
    @State private var showingScheduleMaintenance = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading {
                    ProgressView("Loading maintenance records...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredRecords.isEmpty {
                    emptyState
                } else {
                    maintenanceList
                }
            }
            .navigationTitle("Maintenance")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingScheduleMaintenance = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showingScheduleMaintenance) {
                ScheduleMaintenanceView()
            }
<<<<<<< HEAD
            .onAppear {
                viewModel.loadMaintenanceRecords()
=======
            .sheet(item: $selectedRecordForDetail) { record in
                MaintenanceDetailViewEmbedded(record: record, viewModel: viewModel)
>>>>>>> stage-a/requirements-inception
            }
            .refreshable {
                viewModel.loadMaintenanceRecords()
            }
        }
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "wrench.and.screwdriver")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Maintenance Records")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Schedule maintenance to keep your fleet running smoothly")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingScheduleMaintenance = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Schedule Maintenance")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Maintenance List
    private var maintenanceList: some View {
        List {
            ForEach(viewModel.filteredRecords) { record in
                MaintenanceRowView(record: record)
            }
        }
        .listStyle(.plain)
        .searchable(text: $viewModel.searchText, prompt: "Search maintenance")
    }
}

// MARK: - Maintenance Row View
struct MaintenanceRowView: View {
    let record: MaintenanceRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: record.type.icon)
                    .foregroundColor(.blue)

                Text(record.type.rawValue)
                    .font(.headline)

                Spacer()

                MaintenanceStatusBadge(status: record.status)
            }

            Text(record.description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack {
                if let vehicleNumber = record.vehicleNumber {
                    Label(vehicleNumber, systemImage: "car.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(record.scheduledDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Maintenance Status Badge
struct MaintenanceStatusBadge: View {
    let status: MaintenanceStatus

    var body: some View {
        Text(status.rawValue)
<<<<<<< HEAD
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(statusColor)
            .cornerRadius(8)
=======
            .font(.caption2.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(4)
    }

    private var backgroundColor: Color {
        switch status {
        case .scheduled: return .blue.opacity(0.2)
        case .inProgress: return .orange.opacity(0.2)
        case .completed: return .green.opacity(0.2)
        case .overdue: return .red.opacity(0.2)
        case .cancelled: return .gray.opacity(0.2)
        }
    }

    private var foregroundColor: Color {
        switch status {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .overdue: return .red
        case .cancelled: return .gray
        }
    }
}

// MARK: - Maintenance Stat Card
struct MaintenanceStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title2.bold())
                .foregroundColor(.primary)
        }
        .padding()
        .frame(minWidth: 100)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Schedule Maintenance View
struct ScheduleMaintenanceView: View {
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedVehicleId = ""
    @State private var maintenanceType = "Oil Change"
    @State private var scheduledDate = Date()
    @State private var provider = ""
    @State private var estimatedCost = ""
    @State private var notes = ""

    let maintenanceTypes = [
        "Oil Change",
        "Tire Rotation",
        "Brake Service",
        "Engine Service",
        "Transmission Service",
        "Battery Replacement",
        "Air Filter",
        "Coolant Flush",
        "Inspection",
        "Other"
    ]

    var body: some View {
        NavigationView {
            Form {
                Section("Vehicle") {
                    Picker("Select Vehicle", selection: $selectedVehicleId) {
                        Text("Select a vehicle").tag("")
                        ForEach(viewModel.vehicles) { vehicle in
                            Text("\(vehicle.number) - \(vehicle.make) \(vehicle.model)")
                                .tag(vehicle.id)
                        }
                    }
                }

                Section("Service Details") {
                    Picker("Service Type", selection: $maintenanceType) {
                        ForEach(maintenanceTypes, id: \.self) { type in
                            Text(type).tag(type)
                        }
                    }

                    DatePicker("Scheduled Date", selection: $scheduledDate, displayedComponents: [.date, .hourAndMinute])

                    TextField("Provider (Optional)", text: $provider)

                    TextField("Estimated Cost", text: $estimatedCost)
                        .keyboardType(.decimalPad)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 60)
                }

                Section {
                    Button(action: scheduleMaintenance) {
                        Label("Schedule Maintenance", systemImage: "calendar.badge.plus")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.blue)
                }
            }
            .navigationTitle("Schedule Maintenance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func scheduleMaintenance() {
        viewModel.scheduleNewMaintenance(
            vehicleId: selectedVehicleId.isEmpty ? viewModel.vehicles.first?.id ?? "" : selectedVehicleId,
            type: maintenanceType,
            date: scheduledDate
        )
        dismiss()
    }
}

// MARK: - Maintenance Detail View (Embedded)
// Note: Renamed to MaintenanceDetailViewEmbedded to avoid conflict with MaintenanceDetailView.swift
struct MaintenanceDetailViewEmbedded: View {
    let record: MaintenanceRecord
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingReschedule = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "wrench.and.screwdriver.fill")
                            .font(.system(size: 60))
                            .foregroundColor(statusColor)

                        Text(record.vehicleNumber)
                            .font(.title.bold())

                        Text(record.type)
                            .font(.headline)
                            .foregroundColor(.secondary)

                        MaintenanceStatusBadge(status: record.status)
                    }
                    .padding()

                    // Details Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        DetailCard(title: "Scheduled", value: record.scheduledDate.formatted(date: .abbreviated, time: .shortened), icon: "calendar", color: .blue)
                        DetailCard(title: "Provider", value: record.provider, icon: "building.2", color: .purple)
                        DetailCard(title: "Mileage", value: formatMileage(record.mileageAtService), icon: "speedometer", color: .orange)
                        DetailCard(title: "Cost", value: formatCurrency(record.cost), icon: "dollarsign.circle", color: .green)
                        DetailCard(title: "Labor Hours", value: String(format: "%.1f hrs", record.laborHours), icon: "clock.fill", color: .gray)
                        DetailCard(title: "Warranty", value: record.warranty ? "Yes" : "No", icon: "checkmark.shield", color: record.warranty ? .green : .gray)
                    }
                    .padding()

                    // Parts List
                    if !record.parts.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Parts Replaced")
                                .font(.headline)
                                .padding(.horizontal)

                            VStack(spacing: 8) {
                                ForEach(record.parts, id: \.partNumber) { part in
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(part.name)
                                                .font(.subheadline)
                                            Text("Part #\(part.partNumber)")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing) {
                                            Text("Qty: \(part.quantity)")
                                                .font(.caption)
                                            Text(formatCurrency(part.totalPrice))
                                                .font(.subheadline.bold())
                                        }
                                    }
                                    .padding()
                                    .background(Color(.secondarySystemGroupedBackground))
                                    .cornerRadius(8)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Notes
                    if let notes = record.notes {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)
                                .padding(.horizontal)

                            Text(notes)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.secondarySystemGroupedBackground))
                                .cornerRadius(8)
                                .padding(.horizontal)
                        }
                    }

                    // Action Buttons
                    if record.status == .scheduled || record.status == .overdue {
                        VStack(spacing: 12) {
                            Button(action: { viewModel.markAsCompleted(record) }) {
                                Label("Mark as Completed", systemImage: "checkmark.circle.fill")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }

                            Button(action: { showingReschedule = true }) {
                                Label("Reschedule", systemImage: "calendar.badge.clock")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }

                            Button(action: { viewModel.cancelMaintenance(record) }) {
                                Label("Cancel", systemImage: "xmark.circle")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.red)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Maintenance Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingReschedule) {
                RescheduleView(record: record, viewModel: viewModel)
            }
        }
>>>>>>> stage-a/requirements-inception
    }

    private var statusColor: Color {
        switch status {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .gray
        case .delayed: return .red
        case .onHold: return .yellow
        case .overdue: return .red
        }
    }
}

// MARK: - Maintenance Detail View (placeholder)
struct MaintenanceDetailView: View {
    let record: MaintenanceRecord
    @StateObject private var viewModel: MaintenanceViewModel

    init(record: MaintenanceRecord) {
        self.record = record
        self._viewModel = StateObject(wrappedValue: MaintenanceViewModel())
    }

    // Convenience initializer for navigation
    init(maintenanceId: String) {
        self.record = MaintenanceRecord(
            id: maintenanceId,
            vehicleId: "",
            type: .preventive,
            category: .oilChange,
            scheduledDate: Date(),
            description: "Loading..."
        )
        self._viewModel = StateObject(wrappedValue: MaintenanceViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(record.type.rawValue)
                    .font(.title2)
                    .fontWeight(.bold)

                Text(record.description)
                    .font(.body)

                if let cost = record.cost {
                    Text("Cost: $\(cost, specifier: "%.2f")")
                        .font(.subheadline)
                }

                Text("Scheduled: \(record.scheduledDate.formatted())")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Details")
    }
}

// MARK: - Preview
struct MaintenanceView_Previews: PreviewProvider {
    static var previews: some View {
        MaintenanceView()
    }
}
