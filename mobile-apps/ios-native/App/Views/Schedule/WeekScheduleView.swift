import SwiftUI

struct WeekScheduleView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    let onScheduleTap: (ScheduleEntry) -> Void

    private var weekDays: [Date] {
        let calendar = Calendar.current
        let weekStart = viewModel.selectedDate.startOfWeek()

        return (0..<7).compactMap { dayOffset in
            calendar.date(byAdding: .day, value: dayOffset, to: weekStart)
        }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(weekDays, id: \.self) { date in
                    daySection(for: date)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    private func daySection(for date: Date) -> some View {
        let daySchedules = viewModel.schedulesForDate(date)
        let isToday = Calendar.current.isDateInToday(date)

        return VStack(alignment: .leading, spacing: 12) {
            // Day header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(dayOfWeekString(date))
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(isToday ? .blue : .primary)

                    Text(dateString(date))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if isToday {
                    Text("Today")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }

                Text("\(daySchedules.count)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(width: 28, height: 28)
                    .background(daySchedules.isEmpty ? Color.gray : Color.blue)
                    .clipShape(Circle())
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
            .cornerRadius(12)

            // Schedules for the day
            if daySchedules.isEmpty {
                Text("No schedules")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
            } else {
                ForEach(daySchedules) { schedule in
                    ScheduleCard(schedule: schedule) {
                        onScheduleTap(schedule)
                    }
                }
            }
        }
    }

    private func dayOfWeekString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date)
    }

    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }
}
