//
//  MaintenanceView.swift
//  Fleet Manager
//
//  Complete Maintenance view with scheduling, service history, and maintenance cards
//

import SwiftUI

struct MaintenanceView: View {
    @StateObject private var viewModel = MaintenanceViewModel()
    @State private var showingScheduleMaintenance = false
    @State private var selectedRecordForDetail: MaintenanceRecord?
    @State private var showingFilterOptions = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.filteredRecords.isEmpty {
                    ProgressView("Loading maintenance records...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredRecords.isEmpty && !viewModel.searchText.isEmpty {
                    emptySearchState
                } else if viewModel.filteredRecords.isEmpty {
                    emptyState
                } else {
                    maintenanceList
                }
            }
            .navigationTitle("Maintenance")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search maintenance...")
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    filterButton
                    scheduleButton
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingScheduleMaintenance) {
                ScheduleMaintenanceView(viewModel: viewModel)
            }
            .sheet(item: $selectedRecordForDetail) { record in
                MaintenanceDetailViewEmbedded(record: record, viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilterOptions) {
                MaintenanceFilterView(viewModel: viewModel)
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Maintenance List
    private var maintenanceList: some View {
        ScrollView {
            // Statistics Bar
            statisticsBar

            // Filter Chips
            filterChips

            // Maintenance Cards
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredRecords) { record in
                    MaintenanceCard(record: record) {
                        selectedRecordForDetail = record
                    }
                    .transition(.asymmetric(
                        insertion: .slide.combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Statistics Bar
    private var statisticsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                MaintenanceStatCard(
                    title: "Overdue",
                    value: "\(viewModel.overdueCount)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )

                MaintenanceStatCard(
                    title: "Scheduled",
                    value: "\(viewModel.scheduledCount)",
                    icon: "calendar",
                    color: .blue
                )

                MaintenanceStatCard(
                    title: "This Month",
                    value: "\(viewModel.completedThisMonth)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                MaintenanceStatCard(
                    title: "Monthly Cost",
                    value: formatCurrency(viewModel.totalCostThisMonth),
                    icon: "dollarsign.circle.fill",
                    color: .purple
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Filter Chips
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(MaintenanceViewModel.MaintenanceFilter.allCases, id: \.self) { filter in
                    FilterChip(
                        title: filter.rawValue,
                        icon: filter.icon,
                        isSelected: viewModel.selectedFilter == filter
                    ) {
                        viewModel.applyFilter(filter)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Toolbar Items
    private var filterButton: some View {
        Button(action: { showingFilterOptions = true }) {
            Image(systemName: "line.3.horizontal.decrease.circle")
        }
    }

    private var scheduleButton: some View {
        Button(action: { showingScheduleMaintenance = true }) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(.blue)
        }
    }

    // MARK: - Empty States
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "wrench.and.screwdriver")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Maintenance Records")
                .font(.title2.bold())

            Text("Schedule your first maintenance")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: { showingScheduleMaintenance = true }) {
                Label("Schedule Maintenance", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptySearchState: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.gray)

            Text("No Results")
                .font(.title2.bold())

            Text("No maintenance records match '\(viewModel.searchText)'")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button("Clear Search") {
                viewModel.searchText = ""
            }
            .foregroundColor(.blue)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Helper Functions
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// MARK: - Maintenance Card Component
struct MaintenanceCard: View {
    let record: MaintenanceRecord
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(record.vehicleNumber)
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text(record.type)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    MaintenanceStatusBadge(status: record.status)
                }

                // Service Details
                HStack(spacing: 20) {
                    // Date
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.caption)
                            .foregroundColor(dateColor(for: record.status))
                        Text(record.scheduledDate, style: .date)
                            .font(.caption)
                    }

                    // Provider
                    HStack(spacing: 4) {
                        Image(systemName: "building.2")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text(record.provider)
                            .font(.caption)
                            .lineLimit(1)
                    }

                    // Cost
                    if record.cost > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "dollarsign.circle")
                                .font(.caption)
                                .foregroundColor(.green)
                            Text(formatCost(record.cost))
                                .font(.caption)
                        }
                    }
                }

                // Mileage
                HStack {
                    Image(systemName: "speedometer")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("At \(formatMileage(record.mileageAtService))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // Parts if any
                if !record.parts.isEmpty {
                    HStack {
                        Image(systemName: "wrench")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Text("\(record.parts.count) part\(record.parts.count == 1 ? "" : "s") replaced")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Notes if any
                if let notes = record.notes {
                    HStack(alignment: .top) {
                        Image(systemName: "note.text")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text(notes)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }

                // Overdue Warning
                if record.status == .overdue {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                        Text("Overdue by \(daysSince(record.scheduledDate)) days")
                            .font(.caption.bold())
                            .foregroundColor(.red)
                    }
                    .padding(8)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func dateColor(for status: MaintenanceStatus) -> Color {
        switch status {
        case .overdue: return .red
        case .scheduled: return .blue
        case .completed: return .green
        case .inProgress: return .orange
        case .cancelled: return .gray
        }
    }

    private func formatCost(_ cost: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: cost)) ?? "$0"
    }

    private func formatMileage(_ mileage: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return (formatter.string(from: NSNumber(value: mileage)) ?? "0") + " mi"
    }

    private func daysSince(_ date: Date) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: date, to: Date())
        return components.day ?? 0
    }
}

// MARK: - Maintenance Status Badge
struct MaintenanceStatusBadge: View {
    let status: MaintenanceStatus

    var body: some View {
        Text(status.rawValue)
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
    }

    private var statusColor: Color {
        switch record.status {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .overdue: return .red
        case .cancelled: return .gray
        }
    }

    private func formatMileage(_ mileage: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return (formatter.string(from: NSNumber(value: mileage)) ?? "0") + " mi"
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = amount == floor(amount) ? 0 : 2
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// MARK: - Reschedule View
struct RescheduleView: View {
    let record: MaintenanceRecord
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var newDate = Date()

    var body: some View {
        NavigationView {
            Form {
                Section("Current Schedule") {
                    HStack {
                        Text("Vehicle")
                        Spacer()
                        Text(record.vehicleNumber)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Service")
                        Spacer()
                        Text(record.type)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Original Date")
                        Spacer()
                        Text(record.scheduledDate, style: .date)
                            .foregroundColor(.secondary)
                    }
                }

                Section("New Schedule") {
                    DatePicker("New Date", selection: $newDate, displayedComponents: [.date, .hourAndMinute])
                }

                Section {
                    Button(action: reschedule) {
                        Label("Confirm Reschedule", systemImage: "calendar.badge.clock")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.blue)
                }
            }
            .navigationTitle("Reschedule Maintenance")
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

    private func reschedule() {
        viewModel.rescheduleMaintenance(record, newDate: newDate)
        dismiss()
    }
}

// MARK: - Maintenance Filter View
struct MaintenanceFilterView: View {
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section("Filter By Status") {
                    ForEach(MaintenanceViewModel.MaintenanceFilter.allCases, id: \.self) { filter in
                        Button(action: {
                            viewModel.applyFilter(filter)
                            dismiss()
                        }) {
                            HStack {
                                Label(filter.rawValue, systemImage: filter.icon)
                                    .foregroundColor(filter.color)
                                Spacer()
                                if viewModel.selectedFilter == filter {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }

                Section("Actions") {
                    Button(action: viewModel.exportMaintenanceReport) {
                        Label("Export Report", systemImage: "square.and.arrow.up")
                    }
                }
            }
            .navigationTitle("Filter Options")
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
    MaintenanceView()
}