//
//  ScheduleView.swift
//  Fleet Manager
//
//  Schedule management for shifts, maintenance, and appointments
//

import SwiftUI

// MARK: - Schedule Event
struct ScheduleEvent: Identifiable {
    let id: String
    let title: String
    let type: ScheduleEventType
    let date: Date
    let duration: TimeInterval
    let vehicleId: String?
    let driverId: String?
    let location: String?
    let notes: String?
    var status: ScheduleEventStatus

    init(
        id: String = UUID().uuidString,
        title: String,
        type: ScheduleEventType,
        date: Date,
        duration: TimeInterval = 3600,
        vehicleId: String? = nil,
        driverId: String? = nil,
        location: String? = nil,
        notes: String? = nil,
        status: ScheduleEventStatus = .scheduled
    ) {
        self.id = id
        self.title = title
        self.type = type
        self.date = date
        self.duration = duration
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.location = location
        self.notes = notes
        self.status = status
    }
}

enum ScheduleEventType: String, CaseIterable {
    case shift = "Shift"
    case maintenance = "Maintenance"
    case inspection = "Inspection"
    case delivery = "Delivery"
    case appointment = "Appointment"
    case training = "Training"

    var icon: String {
        switch self {
        case .shift: return "clock.fill"
        case .maintenance: return "wrench.fill"
        case .inspection: return "checkmark.shield.fill"
        case .delivery: return "shippingbox.fill"
        case .appointment: return "calendar.badge.clock"
        case .training: return "person.3.fill"
        }
    }

    var color: Color {
        switch self {
        case .shift: return .blue
        case .maintenance: return .orange
        case .inspection: return .green
        case .delivery: return .purple
        case .appointment: return .teal
        case .training: return .indigo
        }
    }
}

enum ScheduleEventStatus: String, CaseIterable {
    case scheduled = "Scheduled"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
}

// MARK: - Schedule View
struct ScheduleView: View {
    @State private var selectedDate = Date()
    @State private var selectedFilter: ScheduleEventType?
    @State private var events: [ScheduleEvent] = []
    @State private var showingAddEvent = false
    @State private var viewMode: ViewMode = .day

    enum ViewMode: String, CaseIterable {
        case day = "Day"
        case week = "Week"
        case month = "Month"
    }

    var filteredEvents: [ScheduleEvent] {
        var filtered = events.filter { Calendar.current.isDate($0.date, inSameDayAs: selectedDate) }
        if let filter = selectedFilter {
            filtered = filtered.filter { $0.type == filter }
        }
        return filtered.sorted { $0.date < $1.date }
    }

    var body: some View {
        VStack(spacing: 0) {
            // View Mode Picker
            Picker("View", selection: $viewMode) {
                ForEach(ViewMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            // Calendar Header
            calendarHeader

            // Filter Chips
            filterChips

            Divider()

            // Events List
            if filteredEvents.isEmpty {
                emptyState
            } else {
                eventsList
            }
        }
        .navigationTitle("Schedule")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddEvent = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
        }
        .sheet(isPresented: $showingAddEvent) {
            AddScheduleEventView(selectedDate: selectedDate) { newEvent in
                events.append(newEvent)
            }
        }
        .onAppear {
            loadSampleEvents()
        }
    }

    // MARK: - Calendar Header
    private var calendarHeader: some View {
        VStack(spacing: 16) {
            HStack {
                Button(action: previousPeriod) {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                }

                Spacer()

                Text(dateHeaderText)
                    .font(.headline)

                Spacer()

                Button(action: nextPeriod) {
                    Image(systemName: "chevron.right")
                        .font(.title3)
                }
            }
            .padding(.horizontal)

            // Day selector for week view
            if viewMode == .week || viewMode == .day {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(weekDays, id: \.self) { day in
                            DayButton(
                                date: day,
                                isSelected: Calendar.current.isDate(day, inSameDayAs: selectedDate),
                                hasEvents: hasEvents(on: day)
                            ) {
                                selectedDate = day
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
    }

    // MARK: - Filter Chips
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChipButton(title: "All", isSelected: selectedFilter == nil) {
                    selectedFilter = nil
                }

                ForEach(ScheduleEventType.allCases, id: \.self) { type in
                    FilterChipButton(
                        title: type.rawValue,
                        icon: type.icon,
                        color: type.color,
                        isSelected: selectedFilter == type
                    ) {
                        selectedFilter = type
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Events List
    private var eventsList: some View {
        List {
            ForEach(filteredEvents) { event in
                ScheduleEventRow(event: event)
            }
            .onDelete(perform: deleteEvents)
        }
        .listStyle(.plain)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Events")
                .font(.title2)
                .fontWeight(.semibold)

            Text("No events scheduled for \(selectedDate.formatted(date: .abbreviated, time: .omitted))")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingAddEvent = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Event")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.blue)
                .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Helper Properties
    private var dateHeaderText: String {
        let formatter = DateFormatter()
        switch viewMode {
        case .day:
            formatter.dateFormat = "EEEE, MMMM d"
        case .week:
            formatter.dateFormat = "MMMM yyyy"
        case .month:
            formatter.dateFormat = "MMMM yyyy"
        }
        return formatter.string(from: selectedDate)
    }

    private var weekDays: [Date] {
        let calendar = Calendar.current
        let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate))!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: startOfWeek) }
    }

    // MARK: - Helper Functions
    private func hasEvents(on date: Date) -> Bool {
        events.contains { Calendar.current.isDate($0.date, inSameDayAs: date) }
    }

    private func previousPeriod() {
        let calendar = Calendar.current
        switch viewMode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: -1, to: selectedDate) ?? selectedDate
        case .month:
            selectedDate = calendar.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate
        }
    }

    private func nextPeriod() {
        let calendar = Calendar.current
        switch viewMode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: 1, to: selectedDate) ?? selectedDate
        case .month:
            selectedDate = calendar.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate
        }
    }

    private func deleteEvents(at offsets: IndexSet) {
        let eventsToDelete = offsets.map { filteredEvents[$0] }
        events.removeAll { event in eventsToDelete.contains { $0.id == event.id } }
    }

    private func loadSampleEvents() {
        // Sample events for demonstration
        events = []
    }
}

// MARK: - Day Button
struct DayButton: View {
    let date: Date
    let isSelected: Bool
    let hasEvents: Bool
    let action: () -> Void

    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }

    private var dayName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(dayName)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .white : .secondary)

                Text(dayNumber)
                    .font(.headline)
                    .foregroundColor(isSelected ? .white : .primary)

                Circle()
                    .fill(hasEvents ? (isSelected ? Color.white : Color.blue) : Color.clear)
                    .frame(width: 6, height: 6)
            }
            .frame(width: 44, height: 70)
            .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }
}

// MARK: - Filter Chip Button
struct FilterChipButton: View {
    let title: String
    var icon: String? = nil
    var color: Color = .blue
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.caption)
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? color : Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
        }
    }
}

// MARK: - Schedule Event Row
struct ScheduleEventRow: View {
    let event: ScheduleEvent

    var body: some View {
        HStack(spacing: 12) {
            // Time indicator
            VStack(spacing: 2) {
                Text(event.date.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .fontWeight(.medium)

                Rectangle()
                    .fill(event.type.color)
                    .frame(width: 3, height: 40)
                    .cornerRadius(2)
            }
            .frame(width: 50)

            // Event details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: event.type.icon)
                        .foregroundColor(event.type.color)
                        .font(.caption)

                    Text(event.title)
                        .font(.headline)
                }

                if let location = event.location {
                    Label(location, systemImage: "mappin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text(event.type.rawValue)
                        .font(.caption2)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(event.type.color)
                        .cornerRadius(4)

                    Text(formatDuration(event.duration))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

// MARK: - Add Schedule Event View
struct AddScheduleEventView: View {
    let selectedDate: Date
    let onSave: (ScheduleEvent) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var type: ScheduleEventType = .appointment
    @State private var date: Date
    @State private var duration: TimeInterval = 3600
    @State private var location = ""
    @State private var notes = ""

    init(selectedDate: Date, onSave: @escaping (ScheduleEvent) -> Void) {
        self.selectedDate = selectedDate
        self.onSave = onSave
        _date = State(initialValue: selectedDate)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Event Details") {
                    TextField("Title", text: $title)

                    Picker("Type", selection: $type) {
                        ForEach(ScheduleEventType.allCases, id: \.self) { eventType in
                            Label(eventType.rawValue, systemImage: eventType.icon)
                                .tag(eventType)
                        }
                    }
                }

                Section("Time") {
                    DatePicker("Date & Time", selection: $date)

                    Picker("Duration", selection: $duration) {
                        Text("30 minutes").tag(TimeInterval(1800))
                        Text("1 hour").tag(TimeInterval(3600))
                        Text("2 hours").tag(TimeInterval(7200))
                        Text("4 hours").tag(TimeInterval(14400))
                        Text("All day").tag(TimeInterval(86400))
                    }
                }

                Section("Location") {
                    TextField("Location (optional)", text: $location)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        let event = ScheduleEvent(
                            title: title,
                            type: type,
                            date: date,
                            duration: duration,
                            location: location.isEmpty ? nil : location,
                            notes: notes.isEmpty ? nil : notes
                        )
                        onSave(event)
                        dismiss()
                    }
                    .font(.headline)
                    .disabled(title.isEmpty)
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        ScheduleView()
    }
}
