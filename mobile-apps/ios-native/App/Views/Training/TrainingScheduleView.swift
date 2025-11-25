//
//  TrainingScheduleView.swift
//  Fleet Manager
//
//  Calendar view for training sessions with scheduling and enrollment
//

import SwiftUI

struct TrainingScheduleView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel
    @State private var selectedDate = Date()
    @State private var calendarViewMode: CalendarViewMode = .month
    @State private var showAddSessionSheet = false

    var body: some View {
        VStack(spacing: 0) {
            // View Mode Selector
            Picker("View", selection: $calendarViewMode) {
                ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                    Text(mode.displayName).tag(mode)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            // Calendar View
            switch calendarViewMode {
            case .day:
                DayCalendarView(
                    selectedDate: $selectedDate,
                    viewModel: viewModel
                )
            case .week:
                WeekCalendarView(
                    selectedDate: $selectedDate,
                    viewModel: viewModel
                )
            case .month:
                MonthCalendarView(
                    selectedDate: $selectedDate,
                    viewModel: viewModel
                )
            case .list:
                ScheduleListCalendarView(viewModel: viewModel)
            }
        }
        .navigationTitle("Training Schedule")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddSessionSheet = true
                }) {
                    Image(systemName: "plus.circle.fill")
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    selectedDate = Date()
                }) {
                    Text("Today")
                        .font(.subheadline)
                }
            }
        }
        .sheet(isPresented: $showAddSessionSheet) {
            AddTrainingSessionSheet(viewModel: viewModel)
        }
    }
}

// MARK: - Calendar View Mode
enum CalendarViewMode: String, CaseIterable {
    case day
    case week
    case month
    case list

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Day Calendar View
struct DayCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var viewModel: TrainingManagementViewModel

    var sessionsForDay: [TrainingSchedule] {
        viewModel.schedules.filter { schedule in
            Calendar.current.isDate(schedule.startDateTime, inSameDayAs: selectedDate)
        }.sorted { $0.startDateTime < $1.startDateTime }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Date Selector
            DateNavigator(selectedDate: $selectedDate, mode: .day)

            // Sessions for the day
            if sessionsForDay.isEmpty {
                EmptyStateView(
                    icon: "calendar",
                    title: "No Sessions",
                    message: "No training sessions scheduled for \(formatDate(selectedDate))"
                )
            } else {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(sessionsForDay) { session in
                            DaySessionCard(session: session, viewModel: viewModel)
                        }
                    }
                    .padding()
                }
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Week Calendar View
struct WeekCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var viewModel: TrainingManagementViewModel

    var weekDates: [Date] {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: selectedDate)
        let daysFromSunday = weekday - 1

        var dates: [Date] = []
        for day in 0..<7 {
            if let date = calendar.date(byAdding: .day, value: day - daysFromSunday, to: selectedDate) {
                dates.append(date)
            }
        }
        return dates
    }

    var body: some View {
        VStack(spacing: 0) {
            // Date Navigator
            DateNavigator(selectedDate: $selectedDate, mode: .week)

            // Week Grid
            ScrollView {
                VStack(spacing: 1) {
                    // Day Headers
                    HStack(spacing: 1) {
                        ForEach(weekDates, id: \.self) { date in
                            WeekDayHeader(date: date, isSelected: Calendar.current.isDate(date, inSameDayAs: selectedDate))
                                .onTapGesture {
                                    selectedDate = date
                                }
                        }
                    }

                    // Sessions Grid
                    HStack(alignment: .top, spacing: 1) {
                        ForEach(weekDates, id: \.self) { date in
                            WeekDayColumn(
                                date: date,
                                sessions: viewModel.schedules.filter { schedule in
                                    Calendar.current.isDate(schedule.startDateTime, inSameDayAs: date)
                                },
                                viewModel: viewModel
                            )
                        }
                    }
                }
                .padding()
            }
        }
    }
}

// MARK: - Month Calendar View
struct MonthCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var viewModel: TrainingManagementViewModel

    var monthDates: [[Date]] {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: selectedDate)
        let year = calendar.component(.year, from: selectedDate)

        var dates: [[Date]] = []
        var currentWeek: [Date] = []

        guard let range = calendar.range(of: .day, in: .month, for: selectedDate),
              let firstDay = calendar.date(from: DateComponents(year: year, month: month, day: 1)) else {
            return []
        }

        let firstWeekday = calendar.component(.weekday, from: firstDay)

        // Add empty days for the beginning of the month
        for _ in 1..<firstWeekday {
            currentWeek.append(Date.distantPast)
        }

        // Add actual days
        for day in range {
            if let date = calendar.date(from: DateComponents(year: year, month: month, day: day)) {
                currentWeek.append(date)

                if currentWeek.count == 7 {
                    dates.append(currentWeek)
                    currentWeek = []
                }
            }
        }

        // Add remaining days
        while currentWeek.count < 7 && !currentWeek.isEmpty {
            currentWeek.append(Date.distantPast)
        }

        if !currentWeek.isEmpty {
            dates.append(currentWeek)
        }

        return dates
    }

    var body: some View {
        VStack(spacing: 0) {
            // Date Navigator
            DateNavigator(selectedDate: $selectedDate, mode: .month)

            // Month Grid
            VStack(spacing: 1) {
                // Weekday Headers
                HStack(spacing: 1) {
                    ForEach(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], id: \.self) { day in
                        Text(day)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                }

                // Calendar Grid
                ForEach(monthDates.indices, id: \.self) { weekIndex in
                    HStack(spacing: 1) {
                        ForEach(monthDates[weekIndex], id: \.self) { date in
                            if date == Date.distantPast {
                                Color.clear
                                    .frame(maxWidth: .infinity)
                                    .aspectRatio(1, contentMode: .fit)
                            } else {
                                MonthDayCell(
                                    date: date,
                                    isSelected: Calendar.current.isDate(date, inSameDayAs: selectedDate),
                                    sessionCount: viewModel.schedules.filter { schedule in
                                        Calendar.current.isDate(schedule.startDateTime, inSameDayAs: date)
                                    }.count
                                )
                                .onTapGesture {
                                    selectedDate = date
                                }
                            }
                        }
                    }
                }
            }
            .padding()

            // Selected Day Sessions
            Divider()

            if !selectedDaySessions.isEmpty {
                ScrollView {
                    VStack(spacing: 8) {
                        Text("Sessions for \(formatSelectedDate())")
                            .font(.headline)
                            .padding(.top)

                        ForEach(selectedDaySessions) { session in
                            CompactSessionCard(session: session)
                        }
                    }
                    .padding()
                }
            }
        }
    }

    private var selectedDaySessions: [TrainingSchedule] {
        viewModel.schedules.filter { schedule in
            Calendar.current.isDate(schedule.startDateTime, inSameDayAs: selectedDate)
        }.sorted { $0.startDateTime < $1.startDateTime }
    }

    private func formatSelectedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: selectedDate)
    }
}

// MARK: - List Calendar View
struct ScheduleListCalendarView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var groupedSessions: [(String, [TrainingSchedule])] {
        let grouped = Dictionary(grouping: viewModel.schedules.filter { $0.isUpcoming }) { schedule -> String in
            let formatter = DateFormatter()
            formatter.dateFormat = "MMMM yyyy"
            return formatter.string(from: schedule.startDateTime)
        }

        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        List {
            ForEach(groupedSessions, id: \.0) { month, sessions in
                Section(header: Text(month)) {
                    ForEach(sessions.sorted { $0.startDateTime < $1.startDateTime }) { session in
                        NavigationLink(destination: SessionDetailView(session: session, viewModel: viewModel)) {
                            ListSessionRow(session: session)
                        }
                    }
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
    }
}

// MARK: - Supporting Views
struct DateNavigator: View {
    @Binding var selectedDate: Date
    let mode: CalendarViewMode

    var body: some View {
        HStack {
            Button(action: previousPeriod) {
                Image(systemName: "chevron.left")
                    .font(.title3)
            }

            Spacer()

            Text(formattedDate)
                .font(.headline)

            Spacer()

            Button(action: nextPeriod) {
                Image(systemName: "chevron.right")
                    .font(.title3)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
    }

    private var formattedDate: String {
        let formatter = DateFormatter()

        switch mode {
        case .day:
            formatter.dateFormat = "EEEE, MMMM d, yyyy"
        case .week:
            formatter.dateFormat = "MMM d"
            let calendar = Calendar.current
            let weekday = calendar.component(.weekday, from: selectedDate)
            let daysFromSunday = weekday - 1

            if let startOfWeek = calendar.date(byAdding: .day, value: -daysFromSunday, to: selectedDate),
               let endOfWeek = calendar.date(byAdding: .day, value: 6, to: startOfWeek) {
                return "\(formatter.string(from: startOfWeek)) - \(formatter.string(from: endOfWeek))"
            }
        case .month, .list:
            formatter.dateFormat = "MMMM yyyy"
        }

        return formatter.string(from: selectedDate)
    }

    private func previousPeriod() {
        let calendar = Calendar.current
        switch mode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: -1, to: selectedDate) ?? selectedDate
        case .month, .list:
            selectedDate = calendar.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate
        }
    }

    private func nextPeriod() {
        let calendar = Calendar.current
        switch mode {
        case .day:
            selectedDate = calendar.date(byAdding: .day, value: 1, to: selectedDate) ?? selectedDate
        case .week:
            selectedDate = calendar.date(byAdding: .weekOfYear, value: 1, to: selectedDate) ?? selectedDate
        case .month, .list:
            selectedDate = calendar.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate
        }
    }
}

struct DaySessionCard: View {
    let session: TrainingSchedule
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        NavigationLink(destination: SessionDetailView(session: session, viewModel: viewModel)) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.courseName ?? "Training Session")
                            .font(.headline)

                        Text(session.formattedTime)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    StatusBadge(status: session.status)
                }

                HStack {
                    Label(session.location, systemImage: "location.fill")
                    Spacer()
                    Label(session.instructor, systemImage: "person.fill")
                }
                .font(.caption)
                .foregroundColor(.secondary)

                ProgressView(value: Double(session.enrolledCount), total: Double(session.maxCapacity))
                    .tint(session.isFull ? .red : .blue)

                Text("\(session.enrolledCount)/\(session.maxCapacity) enrolled")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(UIColor.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct WeekDayHeader: View {
    let date: Date
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 4) {
            Text(dayName)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            Text("\(dayNumber)")
                .font(.subheadline)
                .fontWeight(isSelected ? .bold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .frame(width: 32, height: 32)
                .background(isSelected ? Color.blue : Color.clear)
                .clipShape(Circle())
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var dayName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    private var dayNumber: Int {
        Calendar.current.component(.day, from: date)
    }
}

struct WeekDayColumn: View {
    let date: Date
    let sessions: [TrainingSchedule]
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(sessions) { session in
                NavigationLink(destination: SessionDetailView(session: session, viewModel: viewModel)) {
                    CompactSessionPill(session: session)
                }
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, minHeight: 400, alignment: .top)
        .padding(4)
        .background(Color(UIColor.systemGray6))
    }
}

struct MonthDayCell: View {
    let date: Date
    let isSelected: Bool
    let sessionCount: Int

    var body: some View {
        VStack(spacing: 4) {
            Text("\(dayNumber)")
                .font(.subheadline)
                .fontWeight(isSelected ? .bold : .regular)
                .foregroundColor(isToday ? .white : (isSelected ? .blue : .primary))
                .frame(width: 32, height: 32)
                .background(isToday ? Color.blue : (isSelected ? Color.blue.opacity(0.1) : Color.clear))
                .clipShape(Circle())

            if sessionCount > 0 {
                HStack(spacing: 2) {
                    ForEach(0..<min(sessionCount, 3), id: \.self) { _ in
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 4, height: 4)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(1, contentMode: .fit)
    }

    private var dayNumber: Int {
        Calendar.current.component(.day, from: date)
    }

    private var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }
}

struct CompactSessionCard: View {
    let session: TrainingSchedule

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.courseName ?? "Training")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(session.formattedTime)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("\(session.enrolledCount)/\(session.maxCapacity)")
                .font(.caption)
                .foregroundColor(session.isFull ? .red : .secondary)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

struct CompactSessionPill: View {
    let session: TrainingSchedule

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(session.courseName ?? "Training")
                .font(.caption2)
                .fontWeight(.medium)
                .lineLimit(1)

            Text(formatTime(session.startDateTime))
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .padding(6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.blue.opacity(0.2))
        .cornerRadius(4)
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct ListSessionRow: View {
    let session: TrainingSchedule

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(session.courseName ?? "Training Session")
                    .font(.headline)

                Spacer()

                StatusBadge(status: session.status)
            }

            HStack(spacing: 16) {
                Label(session.formattedDate, systemImage: "calendar")
                Label(session.formattedTime, systemImage: "clock")
            }
            .font(.caption)
            .foregroundColor(.secondary)

            HStack {
                Label(session.location, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(session.enrolledCount)/\(session.maxCapacity)")
                    .font(.caption)
                    .foregroundColor(session.isFull ? .red : .secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// Placeholder for session detail view
struct SessionDetailView: View {
    let session: TrainingSchedule
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        Text("Session Detail - Coming Soon")
    }
}

// Placeholder for add session sheet
struct AddTrainingSessionSheet: View {
    @ObservedObject var viewModel: TrainingManagementViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Section {
                    Text("Add Training Session - Coming Soon")
                }
            }
            .navigationTitle("New Training Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        TrainingScheduleView(viewModel: TrainingManagementViewModel())
    }
}
