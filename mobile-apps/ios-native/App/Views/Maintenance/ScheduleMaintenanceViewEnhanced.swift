//
//  ScheduleMaintenanceViewEnhanced.swift
//  Fleet Manager - iOS Native App
//
//  Enhanced maintenance scheduling view with recurring maintenance support
//  Features: Recurring schedules, reminders, conflict detection, part management
//

import SwiftUI

struct ScheduleMaintenanceViewEnhanced: View {
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss

    let preselectedDate: Date?

    // Basic Info
    @State private var selectedVehicleId = ""
    @State private var maintenanceType: MaintenanceType = .preventive
    @State private var maintenanceCategory: MaintenanceCategory = .oilChange
    @State private var scheduledDate = Date()
    @State private var priority: MaintenancePriority = .normal
    @State private var description = ""

    // Service Details
    @State private var serviceProvider = ""
    @State private var location = ""
    @State private var estimatedCost = ""
    @State private var estimatedDuration = 60 // minutes
    @State private var notes = ""

    // Recurring Settings
    @State private var isRecurring = false
    @State private var recurrenceFrequency: RecurrenceFrequency = .weekly
    @State private var recurrenceInterval = 1
    @State private var recurrenceEndDate: Date?
    @State private var hasRecurrenceEnd = false

    // Reminders
    @State private var reminders: [MaintenanceReminder] = []
    @State private var showingAddReminder = false

    // Parts
    @State private var parts: [MaintenancePart] = []
    @State private var showingAddPart = false

    // Validation
    @State private var showingConflicts = false
    @State private var conflicts: [MaintenanceRecord] = []

    init(viewModel: MaintenanceViewModel, preselectedDate: Date? = nil) {
        self.viewModel = viewModel
        self.preselectedDate = preselectedDate
    }

    var body: some View {
        NavigationView {
            Form {
                vehicleSection
                serviceDetailsSection
                scheduleSection
                recurringSection
                remindersSection
                partsSection
                notesSection
                actionSection
            }
            .navigationTitle("Schedule Maintenance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                if let preselectedDate = preselectedDate {
                    scheduledDate = preselectedDate
                }
                checkConflicts()
            }
            .sheet(isPresented: $showingAddReminder) {
                AddReminderView(reminders: $reminders)
            }
            .sheet(isPresented: $showingAddPart) {
                AddPartView(parts: $parts)
            }
            .alert("Scheduling Conflicts", isPresented: $showingConflicts) {
                Button("Schedule Anyway", role: .destructive) {
                    scheduleMaintenance()
                }
                Button("Choose Different Time", role: .cancel) {}
            } message: {
                Text("There are \(conflicts.count) maintenance event(s) scheduled around this time. Do you want to proceed?")
            }
        }
    }

    // MARK: - Vehicle Section

    private var vehicleSection: some View {
        Section("Vehicle") {
            Picker("Select Vehicle", selection: $selectedVehicleId) {
                Text("Select a vehicle").tag("")
                ForEach(viewModel.vehicles) { vehicle in
                    HStack {
                        Text(vehicle.number)
                            .fontWeight(.semibold)
                        Text("-")
                            .foregroundColor(.secondary)
                        Text("\(vehicle.make) \(vehicle.model)")
                    }
                    .tag(vehicle.id)
                }
            }
            .onChange(of: selectedVehicleId) { _ in
                checkConflicts()
            }

            if !selectedVehicleId.isEmpty,
               let vehicle = viewModel.vehicles.first(where: { $0.id == selectedVehicleId }) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "speedometer")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(Int(vehicle.mileage)) miles")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if !vehicle.alerts.isEmpty {
                        ForEach(vehicle.alerts, id: \.self) { alert in
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                                Text(alert)
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Service Details Section

    private var serviceDetailsSection: some View {
        Section("Service Details") {
            Picker("Type", selection: $maintenanceType) {
                ForEach(MaintenanceType.allCases, id: \.self) { type in
                    HStack {
                        Image(systemName: type.icon)
                        Text(type.rawValue)
                    }
                    .tag(type)
                }
            }

            Picker("Category", selection: $maintenanceCategory) {
                ForEach(MaintenanceCategory.allCases, id: \.self) { category in
                    HStack {
                        Image(systemName: category.icon)
                        Text(category.rawValue)
                    }
                    .tag(category)
                }
            }

            Picker("Priority", selection: $priority) {
                ForEach(MaintenancePriority.allCases, id: \.self) { priority in
                    Text(priority.rawValue)
                        .tag(priority)
                }
            }

            TextField("Description", text: $description)
                .textInputAutocapitalization(.sentences)

            TextField("Service Provider", text: $serviceProvider)
                .textInputAutocapitalization(.words)

            TextField("Location", text: $location)
                .textInputAutocapitalization(.words)

            HStack {
                Text("Estimated Cost")
                Spacer()
                TextField("$0.00", text: $estimatedCost)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 100)
            }

            Picker("Duration", selection: $estimatedDuration) {
                Text("30 min").tag(30)
                Text("1 hour").tag(60)
                Text("2 hours").tag(120)
                Text("3 hours").tag(180)
                Text("4 hours").tag(240)
                Text("Full day").tag(480)
            }
        }
    }

    // MARK: - Schedule Section

    private var scheduleSection: some View {
        Section("Schedule") {
            DatePicker("Date & Time", selection: $scheduledDate, displayedComponents: [.date, .hourAndMinute])
                .onChange(of: scheduledDate) { _ in
                    checkConflicts()
                }

            if !conflicts.isEmpty {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("\(conflicts.count) conflict(s) detected")
                        .font(.caption)
                        .foregroundColor(.orange)
                    Spacer()
                    Button("View") {
                        showingConflicts = true
                    }
                    .font(.caption)
                }
            }
        }
    }

    // MARK: - Recurring Section

    private var recurringSection: some View {
        Section {
            Toggle("Recurring Maintenance", isOn: $isRecurring)

            if isRecurring {
                Picker("Frequency", selection: $recurrenceFrequency) {
                    ForEach(RecurrenceFrequency.allCases, id: \.self) { frequency in
                        Text(frequency.displayName).tag(frequency)
                    }
                }

                Stepper("Every \(recurrenceInterval) \(recurrenceFrequency.singularName)", value: $recurrenceInterval, in: 1...30)

                Toggle("Set End Date", isOn: $hasRecurrenceEnd)

                if hasRecurrenceEnd {
                    DatePicker("End Date", selection: Binding(
                        get: { recurrenceEndDate ?? Date().addingTimeInterval(365 * 24 * 3600) },
                        set: { recurrenceEndDate = $0 }
                    ), displayedComponents: [.date])
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Summary")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(recurrenceSummary())
                        .font(.subheadline)
                }
            }
        } header: {
            Text("Recurring Settings")
        } footer: {
            if isRecurring {
                Text("This will create multiple maintenance events based on the recurrence pattern.")
            }
        }
    }

    // MARK: - Reminders Section

    private var remindersSection: some View {
        Section("Reminders") {
            ForEach(reminders) { reminder in
                HStack {
                    Image(systemName: reminder.type.icon)
                        .foregroundColor(.blue)
                    Text("\(reminder.minutesBefore) min before")
                    Spacer()
                    Text(reminder.type.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .onDelete { indexSet in
                reminders.remove(atOffsets: indexSet)
            }

            Button(action: { showingAddReminder = true }) {
                Label("Add Reminder", systemImage: "bell.badge.fill")
            }
        }
    }

    // MARK: - Parts Section

    private var partsSection: some View {
        Section("Parts & Materials") {
            ForEach(parts) { part in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(part.name)
                            .fontWeight(.semibold)
                        Spacer()
                        Text(part.formattedCost)
                            .foregroundColor(.secondary)
                    }

                    if let partNumber = part.partNumber {
                        Text("Part #\(partNumber)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Text("Qty: \(part.quantity)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .onDelete { indexSet in
                parts.remove(atOffsets: indexSet)
            }

            Button(action: { showingAddPart = true }) {
                Label("Add Part", systemImage: "plus.circle.fill")
            }

            if !parts.isEmpty {
                HStack {
                    Text("Total Parts Cost")
                        .fontWeight(.semibold)
                    Spacer()
                    Text(formatCurrency(parts.reduce(0) { $0 + $1.totalCost }))
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
        }
    }

    // MARK: - Notes Section

    private var notesSection: some View {
        Section("Notes") {
            TextEditor(text: $notes)
                .frame(minHeight: 80)
        }
    }

    // MARK: - Action Section

    private var actionSection: some View {
        Section {
            Button(action: {
                if !conflicts.isEmpty {
                    showingConflicts = true
                } else {
                    scheduleMaintenance()
                }
            }) {
                Label("Schedule Maintenance", systemImage: "calendar.badge.plus")
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.white)
            }
            .listRowBackground(Color.blue)
            .disabled(selectedVehicleId.isEmpty || description.isEmpty)
        }
    }

    // MARK: - Helper Functions

    private func checkConflicts() {
        guard !selectedVehicleId.isEmpty else {
            conflicts = []
            return
        }

        let calendar = Calendar.current
        let startTime = scheduledDate
        let endTime = calendar.date(byAdding: .minute, value: estimatedDuration, to: scheduledDate) ?? scheduledDate

        conflicts = viewModel.getMaintenanceForVehicle(selectedVehicleId).filter { existing in
            guard existing.status != .completed && existing.status != .cancelled else {
                return false
            }

            let existingEnd = calendar.date(byAdding: .hour, value: 2, to: existing.scheduledDate) ?? existing.scheduledDate

            // Check for overlap
            return (startTime < existingEnd && endTime > existing.scheduledDate)
        }
    }

    private func scheduleMaintenance() {
        guard !selectedVehicleId.isEmpty else { return }

        if isRecurring {
            scheduleRecurringMaintenance()
        } else {
            scheduleSingleMaintenance()
        }

        dismiss()
    }

    private func scheduleSingleMaintenance() {
        guard let vehicle = viewModel.vehicles.first(where: { $0.id == selectedVehicleId }) else { return }

        let cost = Double(estimatedCost.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: ""))

        let record = MaintenanceRecord(
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.number,
            type: maintenanceType,
            category: maintenanceCategory,
            scheduledDate: scheduledDate,
            completedDate: nil,
            status: .scheduled,
            priority: priority,
            description: description.isEmpty ? "\(maintenanceCategory.rawValue)" : description,
            cost: cost,
            mileageAtService: vehicle.mileage,
            servicedBy: nil,
            serviceProvider: serviceProvider.isEmpty ? nil : serviceProvider,
            location: location.isEmpty ? nil : location,
            notes: notes.isEmpty ? nil : notes,
            parts: parts.isEmpty ? nil : parts,
            attachments: nil,
            nextServiceMileage: nil,
            nextServiceDate: nil
        )

        viewModel.addMaintenanceRecord(record)

        // Schedule reminders
        for reminder in reminders {
            viewModel.scheduleReminder(for: record, reminder: reminder)
        }
    }

    private func scheduleRecurringMaintenance() {
        guard let vehicle = viewModel.vehicles.first(where: { $0.id == selectedVehicleId }) else { return }

        let cost = Double(estimatedCost.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: ""))

        let recurrence = RecurrenceRule(
            frequency: recurrenceFrequency,
            interval: recurrenceInterval,
            endDate: hasRecurrenceEnd ? recurrenceEndDate : nil,
            count: nil,
            daysOfWeek: nil,
            daysOfMonth: nil
        )

        viewModel.scheduleRecurringMaintenance(
            vehicleId: vehicle.id,
            type: maintenanceType,
            category: maintenanceCategory,
            priority: priority,
            description: description.isEmpty ? "\(maintenanceCategory.rawValue)" : description,
            cost: cost,
            provider: serviceProvider.isEmpty ? nil : serviceProvider,
            location: location.isEmpty ? nil : location,
            notes: notes.isEmpty ? nil : notes,
            parts: parts.isEmpty ? nil : parts,
            recurrence: recurrence,
            startDate: scheduledDate,
            reminders: reminders
        )
    }

    private func recurrenceSummary() -> String {
        var summary = "Repeats every "
        if recurrenceInterval > 1 {
            summary += "\(recurrenceInterval) "
        }
        summary += recurrenceInterval > 1 ? recurrenceFrequency.pluralName : recurrenceFrequency.singularName

        if hasRecurrenceEnd, let endDate = recurrenceEndDate {
            summary += " until \(endDate.formatted(date: .abbreviated, time: .omitted))"
        } else {
            summary += " indefinitely"
        }

        return summary
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Add Reminder View

struct AddReminderView: View {
    @Binding var reminders: [MaintenanceReminder]
    @Environment(\.dismiss) private var dismiss

    @State private var reminderType: ReminderType = .notification
    @State private var minutesBefore = 60

    let minuteOptions = [15, 30, 60, 120, 1440, 2880] // 15min to 2 days

    var body: some View {
        NavigationView {
            Form {
                Section("Reminder Details") {
                    Picker("Type", selection: $reminderType) {
                        ForEach(ReminderType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.icon)
                                .tag(type)
                        }
                    }

                    Picker("Remind me", selection: $minutesBefore) {
                        ForEach(minuteOptions, id: \.self) { minutes in
                            Text(formatMinutes(minutes)).tag(minutes)
                        }
                    }
                }

                Section {
                    Button("Add Reminder") {
                        let reminder = MaintenanceReminder(
                            type: reminderType,
                            minutesBefore: minutesBefore,
                            sent: false
                        )
                        reminders.append(reminder)
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Add Reminder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func formatMinutes(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) minutes before"
        } else if minutes < 1440 {
            let hours = minutes / 60
            return "\(hours) hour\(hours > 1 ? "s" : "") before"
        } else {
            let days = minutes / 1440
            return "\(days) day\(days > 1 ? "s" : "") before"
        }
    }
}

// MARK: - Add Part View

struct AddPartView: View {
    @Binding var parts: [MaintenancePart]
    @Environment(\.dismiss) private var dismiss

    @State private var partName = ""
    @State private var partNumber = ""
    @State private var quantity = 1
    @State private var cost = ""
    @State private var supplier = ""
    @State private var notes = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Part Information") {
                    TextField("Part Name", text: $partName)
                        .textInputAutocapitalization(.words)

                    TextField("Part Number (Optional)", text: $partNumber)

                    Stepper("Quantity: \(quantity)", value: $quantity, in: 1...100)

                    HStack {
                        Text("Unit Cost")
                        Spacer()
                        TextField("$0.00", text: $cost)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }

                    TextField("Supplier (Optional)", text: $supplier)
                        .textInputAutocapitalization(.words)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 60)
                }

                if let costValue = Double(cost.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: "")),
                   costValue > 0 {
                    Section {
                        HStack {
                            Text("Total Cost")
                                .fontWeight(.semibold)
                            Spacer()
                            Text(formatCurrency(costValue * Double(quantity)))
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                    }
                }

                Section {
                    Button("Add Part") {
                        addPart()
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(partName.isEmpty || cost.isEmpty)
                }
            }
            .navigationTitle("Add Part")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func addPart() {
        guard let costValue = Double(cost.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: "")) else {
            return
        }

        let part = MaintenancePart(
            name: partName,
            partNumber: partNumber.isEmpty ? nil : partNumber,
            quantity: quantity,
            cost: costValue,
            supplier: supplier.isEmpty ? nil : supplier,
            notes: notes.isEmpty ? nil : notes
        )

        parts.append(part)
        dismiss()
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Supporting Types

struct MaintenanceReminder: Identifiable, Codable {
    let id: String
    let type: ReminderType
    let minutesBefore: Int
    var sent: Bool

    init(id: String = UUID().uuidString, type: ReminderType, minutesBefore: Int, sent: Bool) {
        self.id = id
        self.type = type
        self.minutesBefore = minutesBefore
        self.sent = sent
    }
}

enum ReminderType: String, Codable, CaseIterable {
    case notification
    case email
    case sms

    var displayName: String {
        switch self {
        case .notification: return "Push Notification"
        case .email: return "Email"
        case .sms: return "Text Message"
        }
    }

    var icon: String {
        switch self {
        case .notification: return "bell.badge.fill"
        case .email: return "envelope.fill"
        case .sms: return "message.fill"
        }
    }
}

enum RecurrenceFrequency: String, Codable, CaseIterable {
    case daily
    case weekly
    case monthly
    case yearly

    var displayName: String {
        rawValue.capitalized
    }

    var singularName: String {
        switch self {
        case .daily: return "day"
        case .weekly: return "week"
        case .monthly: return "month"
        case .yearly: return "year"
        }
    }

    var pluralName: String {
        switch self {
        case .daily: return "days"
        case .weekly: return "weeks"
        case .monthly: return "months"
        case .yearly: return "years"
        }
    }
}

struct RecurrenceRule: Codable {
    let frequency: RecurrenceFrequency
    let interval: Int
    let endDate: Date?
    let count: Int?
    let daysOfWeek: [Int]?
    let daysOfMonth: [Int]?
}

struct MaintenanceFilters {
    let vehicleId: String?
    let type: MaintenanceType?
    let status: MaintenanceStatus?
}

// MARK: - Maintenance Calendar Detail View

struct MaintenanceCalendarDetailView: View {
    let maintenance: MaintenanceRecord
    @ObservedObject var viewModel: MaintenanceViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: maintenance.category.icon)
                            .font(.system(size: 60))
                            .foregroundColor(.blue)

                        Text(maintenance.vehicleNumber ?? "Unknown Vehicle")
                            .font(.title.bold())

                        Text(maintenance.type.rawValue)
                            .font(.headline)
                            .foregroundColor(.secondary)

                        MaintenanceStatusBadge(status: maintenance.status)
                    }
                    .padding()

                    // Details
                    VStack(spacing: 12) {
                        DetailRow(icon: "calendar", title: "Scheduled", value: maintenance.scheduledDate.formatted(date: .long, time: .shortened))
                        DetailRow(icon: "building.2", title: "Provider", value: maintenance.serviceProvider ?? "Not specified")
                        if let cost = maintenance.cost {
                            DetailRow(icon: "dollarsign.circle", title: "Cost", value: String(format: "$%.2f", cost))
                        }
                        if let mileage = maintenance.mileageAtService {
                            DetailRow(icon: "speedometer", title: "Mileage", value: String(format: "%.0f mi", mileage))
                        }
                    }
                    .padding()

                    // Actions
                    if maintenance.status == .scheduled || maintenance.status == .overdue {
                        VStack(spacing: 12) {
                            Button(action: {
                                viewModel.markAsCompleted(maintenance)
                                dismiss()
                            }) {
                                Label("Mark as Completed", systemImage: "checkmark.circle.fill")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }

                            Button(action: {
                                viewModel.cancelMaintenance(maintenance)
                                dismiss()
                            }) {
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
            .navigationTitle("Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
                .frame(width: 20)

            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
        }
        .padding(.horizontal)
    }
}

// MARK: - Maintenance Calendar Filters View

struct MaintenanceCalendarFiltersView: View {
    @ObservedObject var viewModel: MaintenanceViewModel
    @Binding var filterByVehicle: String?
    @Binding var filterByType: MaintenanceType?
    @Binding var filterByStatus: MaintenanceStatus?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Filter by Vehicle") {
                    Picker("Vehicle", selection: $filterByVehicle) {
                        Text("All Vehicles").tag(nil as String?)
                        ForEach(viewModel.vehicles) { vehicle in
                            Text("\(vehicle.number) - \(vehicle.make) \(vehicle.model)")
                                .tag(vehicle.id as String?)
                        }
                    }
                }

                Section("Filter by Type") {
                    Picker("Type", selection: $filterByType) {
                        Text("All Types").tag(nil as MaintenanceType?)
                        ForEach(MaintenanceType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type as MaintenanceType?)
                        }
                    }
                }

                Section("Filter by Status") {
                    Picker("Status", selection: $filterByStatus) {
                        Text("All Statuses").tag(nil as MaintenanceStatus?)
                        ForEach(MaintenanceStatus.allCases, id: \.self) { status in
                            Text(status.rawValue)
                                .tag(status as MaintenanceStatus?)
                        }
                    }
                }

                Section {
                    Button("Clear All Filters") {
                        filterByVehicle = nil
                        filterByType = nil
                        filterByStatus = nil
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    ScheduleMaintenanceViewEnhanced(viewModel: MaintenanceViewModel())
}
