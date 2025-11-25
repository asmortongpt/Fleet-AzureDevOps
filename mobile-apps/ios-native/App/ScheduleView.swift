//
//  ScheduleView.swift
//  Fleet Manager
//
//  Schedule Management Interface
//

import SwiftUI

struct ScheduleView: View {
    @StateObject private var scheduleService = ScheduleService.shared

    var body: some View {
        List {
            Section(header: Text("Today's Schedule")) {
                if scheduleService.schedules.isEmpty {
                    Text("No scheduled events today")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(scheduleService.schedules) { schedule in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(schedule.title)
                                .font(.headline)
                            Text(schedule.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(formatDate(schedule.startTime))
                                .font(.caption2)
                                .foregroundColor(.blue)
                        }
                    }
                }
            }

            Section(header: Text("Upcoming")) {
                Text("Coming soon: View and manage upcoming schedules")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .navigationTitle("Schedule")
        .onAppear {
            Task {
                await scheduleService.fetchSchedules()
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

#Preview {
    NavigationView {
        ScheduleView()
    }
}
