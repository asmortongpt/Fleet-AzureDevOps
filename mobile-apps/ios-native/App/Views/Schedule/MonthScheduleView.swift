import SwiftUI

struct MonthScheduleView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    let onScheduleTap: (ScheduleEntry) -> Void
    @State private var selectedDate: Date?

    private let columns = Array(repeating: GridItem(.flexible()), count: 7)
    private let weekdaySymbols = Calendar.current.shortWeekdaySymbols

    var body: some View {
        VStack(spacing: 0) {
            // Calendar grid
            calendarGrid

            Divider()

            // Selected date schedules
            if let selected = selectedDate {
                selectedDateSchedules(selected)
            } else {
                emptySelection
            }
        }
        .background(Color(.systemGroupedBackground))
        .onAppear {
            selectedDate = viewModel.selectedDate
        }
    }

    private var calendarGrid: some View {
        VStack(spacing: 0) {
            // Weekday headers
            LazyVGrid(columns: columns, spacing: 0) {
                ForEach(weekdaySymbols, id: \.self) { symbol in
                    Text(symbol)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                        .frame(height: 30)
                }
            }
            .padding(.horizontal, 8)

            // Calendar days
            LazyVGrid(columns: columns, spacing: 0) {
                ForEach(daysInMonth(), id: \.self) { date in
                    if let date = date {
                        calendarDayCell(date)
                    } else {
                        Color.clear
                            .frame(height: 60)
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .background(Color(.systemBackground))
    }

    private func calendarDayCell(_ date: Date) -> some View {
        let daySchedules = viewModel.schedulesForDate(date)
        let isToday = Calendar.current.isDateInToday(date)
        let isSelected = selectedDate != nil && Calendar.current.isDate(date, inSameDayAs: selectedDate!)
        let dayNumber = Calendar.current.component(.day, from: date)

        return Button {
            selectedDate = date
        } label: {
            VStack(spacing: 4) {
                Text("\(dayNumber)")
                    .font(.system(.body, design: .rounded))
                    .fontWeight(isToday ? .bold : .regular)
                    .foregroundColor(isSelected ? .white : (isToday ? .blue : .primary))
                    .frame(width: 32, height: 32)
                    .background(
                        Circle()
                            .fill(isSelected ? Color.blue : (isToday ? Color.blue.opacity(0.1) : Color.clear))
                    )

                // Schedule indicators
                if !daySchedules.isEmpty {
                    HStack(spacing: 2) {
                        ForEach(0..<min(3, daySchedules.count), id: \.self) { index in
                            Circle()
                                .fill(Color(daySchedules[index].type.colorName))
                                .frame(width: 4, height: 4)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 60)
            .background(isSelected ? Color.blue.opacity(0.05) : Color.clear)
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }

    private func selectedDateSchedules(_ date: Date) -> some View {
        let schedules = viewModel.schedulesForDate(date)

        return VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text(date.relativeDescription())
                    .font(.headline)
                    .fontWeight(.bold)

                Spacer()

                Text("\(schedules.count) event\(schedules.count != 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .background(Color(.systemBackground))

            Divider()

            // Schedules list
            if schedules.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.largeTitle)
                        .foregroundColor(.gray)
                    Text("No schedules")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(schedules) { schedule in
                            ScheduleCard(schedule: schedule) {
                                onScheduleTap(schedule)
                            }
                        }
                    }
                    .padding()
                }
            }
        }
    }

    private var emptySelection: some View {
        VStack(spacing: 8) {
            Image(systemName: "hand.tap")
                .font(.largeTitle)
                .foregroundColor(.gray)
            Text("Tap a day to view schedules")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func daysInMonth() -> [Date?] {
        let calendar = Calendar.current
        let monthStart = viewModel.selectedDate.startOfMonth()

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
}
