t
//
//  ScheduleView.swift
//  Fleet Manager
//
//  Vehicle reservations and scheduling calendar
//

import SwiftUI
import EventKit

struct ScheduleItem: Identifiable {
    let id = UUID()
    let startTime: Date
    let endTime: Date
    let vehicleId: String
    let driverId: String
}

class ScheduleViewModel: ObservableObject {
    @Published var schedules = [ScheduleItem]()
    
    // Fetch schedules from data source (database, API, etc)
    func fetchSchedules() {
        // Add security measures here: input validation, parameterized queries
        self.schedules = [
            // Mock data
            ScheduleItem(startTime: Date(), endTime: Date().addingTimeInterval(3600), vehicleId: "Vehicle 1", driverId: "Driver 1"),
            ScheduleItem(startTime: Date().addingTimeInterval(3600), endTime: Date().addingTimeInterval(7200), vehicleId: "Vehicle 2", driverId: "Driver 2")
        ]
    }
}

struct ScheduleView: View {
    @StateObject private var viewModel = ScheduleViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.schedules) { schedule in
                    ScheduleCard(schedule: schedule)
                }
            }
            .navigationTitle("Schedules")
            .onAppear(perform: viewModel.fetchSchedules)
        }
    }
}

struct ScheduleCard: View {
    var schedule: ScheduleItem
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Vehicle: \(schedule.vehicleId)")
                    .font(.headline)
                Text("Driver: \(schedule.driverId)")
                    .font(.subheadline)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(schedule.startTime, formatter: dateFormatter)")
                    .font(.subheadline)
                Text("\(schedule.endTime, formatter: dateFormatter)")
                    .font(.subheadline)
            }
        }
        .padding()
        .accessibility(identifier: "scheduleCard\(schedule.id)")
    }
}

private let dateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    return formatter
}()

#if DEBUG
struct ScheduleView_Previews: PreviewProvider {
    static var previews: some View {
        ScheduleView()
    }
}
#endif