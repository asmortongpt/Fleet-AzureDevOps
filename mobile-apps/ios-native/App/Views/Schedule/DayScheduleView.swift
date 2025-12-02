import SwiftUI

struct DayScheduleView: View {
    @ObservedObject var viewModel: ScheduleViewModel
    let onScheduleTap: (ScheduleEntry) -> Void

    private let hours = Array(0...23)

    var body: some View {
        ScrollView {
            if viewModel.schedulesForDate(viewModel.selectedDate).isEmpty {
                emptyState
            } else {
                LazyVStack(spacing: 0) {
                    ForEach(hours, id: \.self) { hour in
                        hourRow(hour: hour)
                    }
                }
                .padding(.horizontal)
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

            Text("No schedules for this day")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Tap the + button to add a new schedule")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private func hourRow(hour: Int) -> some View {
        let schedulesInHour = schedulesForHour(hour)

        return HStack(alignment: .top, spacing: 12) {
            // Time label
            Text(formatHour(hour))
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .frame(width: 60, alignment: .trailing)
                .padding(.top, 4)

            // Hour divider and schedules
            VStack(alignment: .leading, spacing: 0) {
                Divider()

                if !schedulesInHour.isEmpty {
                    VStack(spacing: 8) {
                        ForEach(schedulesInHour) { schedule in
                            ScheduleCard(schedule: schedule) {
                                onScheduleTap(schedule)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .frame(minHeight: 60)
    }

    private func schedulesForHour(_ hour: Int) -> [ScheduleEntry] {
        let calendar = Calendar.current
        return viewModel.schedulesForDate(viewModel.selectedDate).filter { schedule in
            let scheduleHour = calendar.component(.hour, from: schedule.startDate)
            return scheduleHour == hour
        }
    }

    private func formatHour(_ hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short

        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: viewModel.selectedDate)
        components.hour = hour
        components.minute = 0

        if let date = calendar.date(from: components) {
            return formatter.string(from: date)
        }

        return "\(hour):00"
    }
}
