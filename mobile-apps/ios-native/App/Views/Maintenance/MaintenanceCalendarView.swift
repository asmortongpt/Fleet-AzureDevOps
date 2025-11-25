//
//  MaintenanceCalendarView.swift
//  Fleet Manager - iOS Native App
//
//  Comprehensive calendar view for maintenance scheduling with multiple view modes
//  Features: Month/Week/Day views, color-coded events, drag-to-reschedule, filters
//

import SwiftUI

struct MaintenanceCalendarView: View {
    @ObservedObject var viewModel: MaintenanceViewModel
    @State private var selectedDate = Date()
    @State private var viewMode: CalendarViewMode = .month
    @State private var showingScheduleMaintenance = false
    @State private var showingFilters = false
    @State private var selectedMaintenance: MaintenanceRecord?
    @State private var draggedMaintenance: MaintenanceRecord?

    // Filters
    @State private var filterByVehicle: String?
    @State private var filterByType: MaintenanceType?
    @State private var filterByStatus: MaintenanceStatus?

    private let columns = Array(repeating: GridItem(.flexible()), count: 7)

    enum CalendarViewMode: String, CaseIterable {
        case month = "Month"
        case week = "Week"
        case day = "Day"

        var icon: String {
            switch self {
            case .month: return "calendar"
            case .week: return "calendar.day.timeline.left"
            case .day: return "calendar.badge.clock"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // View mode picker
                viewModePicker

                Divider()

                // Calendar views
                Group {
                    switch viewMode {
                    case .month:
                        monthView
                    case .week:
                        weekView
                    case .day:
                        dayView
                    }
                }

                Divider()

                // Quick stats
                quickStats
            }
            .navigationTitle("Maintenance Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    todayButton
                    filterButton
                    addButton
                }
            }
            .sheet(isPresented: $showingScheduleMaintenance) {
                ScheduleMaintenanceViewEnhanced(viewModel: viewModel, preselectedDate: selectedDate)
            }
            .sheet(item: $selectedMaintenance) { maintenance in
                MaintenanceCalendarDetailView(maintenance: maintenance, viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                MaintenanceCalendarFiltersView(
                    viewModel: viewModel,
                    filterByVehicle: $filterByVehicle,
                    filterByType: $filterByType,
                    filterByStatus: $filterByStatus
                )
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - View Mode Picker

    private var viewModePicker: some View {
        HStack(spacing: 0) {
            ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                Button(action: { viewMode = mode }) {
                    HStack {
                        Image(systemName: mode.icon)
                            .font(.caption)
                        Text(mode.rawValue)
                            .font(.subheadline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(viewMode == mode ? Color.blue : Color.clear)
                    .foregroundColor(viewMode == mode ? .white : .primary)
                }
            }
        }
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
        .padding()
    }

    // MARK: - Month View

    private var monthView: some View {
        VStack(spacing: 0) {
            // Month navigation
            monthNavigationBar

            // Calendar grid
            VStack(spacing: 0) {
                // Weekday headers
                LazyVGrid(columns: columns, spacing: 0) {
                    ForEach(Calendar.current.shortWeekdaySymbols, id: \.self) { symbol in
                        Text(symbol)
                            .font(.caption2.bold())
                            .foregroundColor(.secondary)
                            .frame(height: 24)
                    }
                }
                .padding(.horizontal, 8)

                // Calendar days
                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(daysInMonth(), id: \.self) { date in
                        if let date = date {
                            monthDayCell(date)
                        } else {
                            Color.clear
                                .frame(height: 80)
                        }
                    }
                }
                .padding(.horizontal, 8)
            }

            Divider()
                .padding(.top, 8)

            // Selected date events
            selectedDateEventsView
        }
    }

    private var monthNavigationBar: some View {
        HStack {
            Button(action: { changeMonth(by: -1) }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.blue)
            }

            Spacer()

            Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                .font(.headline)

            Spacer()

            Button(action: { changeMonth(by: 1) }) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private func monthDayCell(_ date: Date) -> some View {
        let maintenance = viewModel.getMaintenanceByDate(date, filters: currentFilters())
        let isToday = Calendar.current.isDateInToday(date)
        let isSelected = Calendar.current.isDate(date, inSameDayAs: selectedDate)
        let dayNumber = Calendar.current.component(.day, from: date)
        let isCurrentMonth = Calendar.current.isDate(date, equalTo: selectedDate, toGranularity: .month)

        return Button {
            selectedDate = date
        } label: {
            VStack(spacing: 2) {
                Text("\(dayNumber)")
                    .font(.system(size: 14, weight: isToday ? .bold : .regular))
                    .foregroundColor(isSelected ? .white : (isCurrentMonth ? .primary : .secondary))
                    .frame(width: 28, height: 28)
                    .background(
                        Circle()
                            .fill(isSelected ? Color.blue : (isToday ? Color.blue.opacity(0.2) : Color.clear))
                    )

                // Maintenance indicators
                if !maintenance.isEmpty {
                    VStack(spacing: 1) {
                        ForEach(0..<min(3, maintenance.count), id: \.self) { index in
                            Rectangle()
                                .fill(colorForMaintenanceType(maintenance[index].type))
                                .frame(height: 2)
                                .cornerRadius(1)
                        }
                        if maintenance.count > 3 {
                            Text("+\(maintenance.count - 3)")
                                .font(.system(size: 8))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 2)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isToday ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Week View

    private var weekView: some View {
        VStack(spacing: 0) {
            // Week navigation
            weekNavigationBar

            // Time slots with events
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(0..<24) { hour in
                        weekHourRow(hour: hour)
                    }
                }
            }
        }
    }

    private var weekNavigationBar: some View {
        HStack {
            Button(action: { changeWeek(by: -1) }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.blue)
            }

            Spacer()

            Text(weekRangeString())
                .font(.headline)

            Spacer()

            Button(action: { changeWeek(by: 1) }) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private func weekHourRow(hour: Int) -> some View {
        let daysInWeek = daysInCurrentWeek()

        return HStack(spacing: 0) {
            // Time label
            Text(String(format: "%02d:00", hour))
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 50)

            // Events for each day
            HStack(spacing: 2) {
                ForEach(daysInWeek, id: \.self) { date in
                    weekDayTimeSlot(date: date, hour: hour)
                }
            }
        }
        .frame(height: 60)
    }

    private func weekDayTimeSlot(date: Date, hour: Int) -> some View {
        let maintenance = viewModel.getMaintenanceByDate(date, filters: currentFilters())
            .filter { maintenance in
                let maintenanceHour = Calendar.current.component(.hour, from: maintenance.scheduledDate)
                return maintenanceHour == hour
            }

        return ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(Color(.systemBackground))
                .border(Color(.separator), width: 0.5)

            if !maintenance.isEmpty {
                VStack(spacing: 2) {
                    ForEach(maintenance.prefix(2)) { record in
                        Button(action: { selectedMaintenance = record }) {
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(colorForMaintenanceType(record.type))
                                    .frame(width: 6, height: 6)
                                Text(record.vehicleNumber ?? "")
                                    .font(.system(size: 10))
                                    .lineLimit(1)
                            }
                            .padding(2)
                            .background(colorForMaintenanceType(record.type).opacity(0.2))
                            .cornerRadius(4)
                        }
                    }
                }
                .padding(2)
            }
        }
    }

    // MARK: - Day View

    private var dayView: some View {
        VStack(spacing: 0) {
            // Day navigation
            dayNavigationBar

            // Timeline with events
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(0..<24) { hour in
                        dayHourRow(hour: hour)
                    }
                }
            }
        }
    }

    private var dayNavigationBar: some View {
        HStack {
            Button(action: { changeDay(by: -1) }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.blue)
            }

            Spacer()

            VStack(spacing: 2) {
                Text(selectedDate.formatted(.dateTime.weekday(.wide)))
                    .font(.headline)
                Text(selectedDate.formatted(.dateTime.month(.abbreviated).day()))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: { changeDay(by: 1) }) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private func dayHourRow(hour: Int) -> some View {
        let maintenance = viewModel.getMaintenanceByDate(selectedDate, filters: currentFilters())
            .filter { maintenance in
                let maintenanceHour = Calendar.current.component(.hour, from: maintenance.scheduledDate)
                return maintenanceHour == hour
            }

        return HStack(alignment: .top, spacing: 12) {
            // Time label
            VStack(spacing: 2) {
                Text(String(format: "%02d:00", hour))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(width: 50)

            // Events
            VStack(spacing: 8) {
                if maintenance.isEmpty {
                    Rectangle()
                        .fill(Color(.systemBackground))
                        .frame(height: 60)
                        .border(Color(.separator), width: 0.5)
                } else {
                    ForEach(maintenance) { record in
                        Button(action: { selectedMaintenance = record }) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(colorForMaintenanceType(record.type))
                                    .frame(width: 4)

                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(record.vehicleNumber ?? "Unknown")
                                            .font(.subheadline.bold())
                                        Spacer()
                                        Text(record.scheduledDate.formatted(.dateTime.hour().minute()))
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }

                                    Text(record.type.rawValue)
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    if let provider = record.serviceProvider {
                                        Text(provider)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .padding(.vertical, 8)
                                .padding(.trailing, 8)
                            }
                            .background(colorForMaintenanceType(record.type).opacity(0.1))
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal)
        .frame(height: max(60, CGFloat(maintenance.count) * 70))
    }

    // MARK: - Selected Date Events View

    private var selectedDateEventsView: some View {
        let maintenance = viewModel.getMaintenanceByDate(selectedDate, filters: currentFilters())

        return VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(selectedDate.formatted(.dateTime.month(.abbreviated).day().weekday(.abbreviated)))
                    .font(.headline)

                Spacer()

                Text("\(maintenance.count) event\(maintenance.count != 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()

            if maintenance.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "calendar.badge.plus")
                        .font(.largeTitle)
                        .foregroundColor(.gray)
                    Text("No maintenance scheduled")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Button(action: { showingScheduleMaintenance = true }) {
                        Text("Schedule Now")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(maintenance) { record in
                            Button(action: { selectedMaintenance = record }) {
                                MaintenanceEventRow(record: record)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
    }

    // MARK: - Quick Stats

    private var quickStats: some View {
        HStack(spacing: 16) {
            StatBadge(
                title: "Today",
                value: "\(viewModel.getMaintenanceByDate(Date(), filters: currentFilters()).count)",
                color: .blue
            )

            StatBadge(
                title: "This Week",
                value: "\(weekMaintenanceCount())",
                color: .green
            )

            StatBadge(
                title: "Overdue",
                value: "\(viewModel.overdueCount)",
                color: .red
            )
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Toolbar Items

    private var todayButton: some View {
        Button(action: { selectedDate = Date() }) {
            Text("Today")
                .font(.subheadline)
        }
    }

    private var filterButton: some View {
        Button(action: { showingFilters = true }) {
            Image(systemName: filterByVehicle != nil || filterByType != nil || filterByStatus != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                .foregroundColor(filterByVehicle != nil || filterByType != nil || filterByStatus != nil ? .blue : .primary)
        }
    }

    private var addButton: some View {
        Button(action: { showingScheduleMaintenance = true }) {
            Image(systemName: "plus.circle.fill")
                .foregroundColor(.blue)
        }
    }

    // MARK: - Helper Functions

    private func daysInMonth() -> [Date?] {
        let calendar = Calendar.current
        let monthStart = selectedDate.startOfMonth()

        guard let monthRange = calendar.range(of: .day, in: .month, for: monthStart),
              let firstWeekday = calendar.dateComponents([.weekday], from: monthStart).weekday else {
            return []
        }

        var days: [Date?] = []

        // Add empty cells for days before month starts
        for _ in 1..<firstWeekday {
            days.append(nil)
        }

        // Add days of the month
        for day in monthRange {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: monthStart) {
                days.append(date)
            }
        }

        return days
    }

    private func daysInCurrentWeek() -> [Date] {
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: selectedDate)?.start ?? selectedDate

        return (0..<7).compactMap { offset in
            calendar.date(byAdding: .day, value: offset, to: startOfWeek)
        }
    }

    private func weekRangeString() -> String {
        let days = daysInCurrentWeek()
        guard let first = days.first, let last = days.last else {
            return ""
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        return "\(formatter.string(from: first)) - \(formatter.string(from: last))"
    }

    private func weekMaintenanceCount() -> Int {
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        let endOfWeek = calendar.date(byAdding: .day, value: 7, to: startOfWeek) ?? Date()

        return viewModel.getMaintenanceByDateRange(start: startOfWeek, end: endOfWeek, filters: currentFilters()).count
    }

    private func changeMonth(by offset: Int) {
        if let newDate = Calendar.current.date(byAdding: .month, value: offset, to: selectedDate) {
            selectedDate = newDate
        }
    }

    private func changeWeek(by offset: Int) {
        if let newDate = Calendar.current.date(byAdding: .weekOfYear, value: offset, to: selectedDate) {
            selectedDate = newDate
        }
    }

    private func changeDay(by offset: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: offset, to: selectedDate) {
            selectedDate = newDate
        }
    }

    private func colorForMaintenanceType(_ type: MaintenanceType) -> Color {
        switch type {
        case .preventive: return .blue
        case .corrective: return .orange
        case .predictive: return .purple
        case .emergency: return .red
        case .inspection: return .green
        case .recall: return .pink
        }
    }

    private func currentFilters() -> MaintenanceFilters {
        MaintenanceFilters(
            vehicleId: filterByVehicle,
            type: filterByType,
            status: filterByStatus
        )
    }
}

// MARK: - Supporting Views

struct MaintenanceEventRow: View {
    let record: MaintenanceRecord

    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(statusColor(record.status))
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(record.vehicleNumber ?? "Unknown Vehicle")
                        .font(.subheadline.bold())

                    Spacer()

                    Text(record.scheduledDate.formatted(.dateTime.hour().minute()))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(record.type.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let provider = record.serviceProvider {
                    HStack(spacing: 4) {
                        Image(systemName: "building.2")
                            .font(.system(size: 10))
                        Text(provider)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 8)
        }
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }

    private func statusColor(_ status: MaintenanceStatus) -> Color {
        switch status {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .overdue: return .red
        case .cancelled: return .gray
        case .delayed: return .red
        case .onHold: return .yellow
        }
    }
}

struct StatBadge: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

// MARK: - Filter Chips Component

struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(16)
        }
    }
}

struct DetailCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(.primary)
                .lineLimit(2)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

// MARK: - Date Extensions

extension Date {
    func startOfMonth() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: self)
        return calendar.date(from: components) ?? self
    }

    func relativeDescription() -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(self) {
            return "Today"
        } else if calendar.isDateInTomorrow(self) {
            return "Tomorrow"
        } else if calendar.isDateInYesterday(self) {
            return "Yesterday"
        } else {
            return self.formatted(.dateTime.month(.abbreviated).day().weekday(.abbreviated))
        }
    }
}

// MARK: - Preview

#Preview {
    MaintenanceCalendarView(viewModel: MaintenanceViewModel())
}
