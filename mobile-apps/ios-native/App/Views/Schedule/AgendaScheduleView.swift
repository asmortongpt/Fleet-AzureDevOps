import SwiftUI

struct AgendaScheduleView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    let onScheduleTap: (ScheduleEntry) -> Void

    private var groupedSchedules: [(date: Date, schedules: [ScheduleEntry])] {
        let calendar = Calendar.current
        let endDate = calendar.date(byAdding: .month, value: 1, to: Date()) ?? Date()

        var grouped: [Date: [ScheduleEntry]] = [:]

        for schedule in viewModel.filteredSchedules {
            if schedule.startDate >= Date() && schedule.startDate <= endDate {
                let dayStart = calendar.startOfDay(for: schedule.startDate)
                grouped[dayStart, default: []].append(schedule)
            }
        }

        return grouped
            .sorted { $0.key < $1.key }
            .map { (date: $0.key, schedules: $0.value.sorted { $0.startDate < $1.startDate }) }
    }

    var body: some View {
        ScrollView {
            if groupedSchedules.isEmpty {
                emptyState
            } else {
                LazyVStack(spacing: 0) {
                    ForEach(groupedSchedules, id: \.date) { group in
                        dateSection(date: group.date, schedules: group.schedules)
                    }
                }
            }
        }
        .background(Color(.systemGroupedBackground))
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 60))
                .foregroundColor(.gray)
                .padding(.top, 60)

            Text("No upcoming schedules")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Your schedule for the next month is clear")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func dateSection(date: Date, schedules: [ScheduleEntry]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Date header
            dateSectionHeader(date: date, count: schedules.count)

            // Schedules
            ForEach(schedules) { schedule in
                ScheduleCard(schedule: schedule) {
                    onScheduleTap(schedule)
                }
                .padding(.horizontal)
                .padding(.bottom, 12)
            }
        }
    }

    private func dateSectionHeader(date: Date, count: Int) -> some View {
        let isToday = Calendar.current.isDateInToday(date)
        let isTomorrow = Calendar.current.isDateInTomorrow(date)

        return HStack {
            VStack(alignment: .leading, spacing: 2) {
                if isToday {
                    Text("Today")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                } else if isTomorrow {
                    Text("Tomorrow")
                        .font(.title3)
                        .fontWeight(.bold)
                } else {
                    Text(dayOfWeekString(date))
                        .font(.title3)
                        .fontWeight(.bold)
                }

                Text(dateString(date))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("\(count)")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color.blue)
                .clipShape(Circle())
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }

    private func dayOfWeekString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date)
    }

    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM d, yyyy"
        return formatter.string(from: date)
    }
}
