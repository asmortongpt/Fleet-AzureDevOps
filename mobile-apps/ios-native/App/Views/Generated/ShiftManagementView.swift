t
//
//  ShiftManagementView.swift
//  Fleet Manager
//
//  Shift scheduling and management dashboard
//

import SwiftUI

// MARK: - ShiftItem struct
/// A struct representing a shift.
///
/// It includes properties for the shift's unique identifier, start time, end time,
/// associated vehicle, and assigned driver. 
struct ShiftItem: Identifiable {
    let id = UUID()
    let startTime: Date
    let endTime: Date
    let vehicleId: String
    let driverId: String
}

// MARK: - ShiftManagementViewModel class
/// The view model associated with the ShiftManagementView.
///
/// This class is responsible for managing the state and logic associated with shifts.
class ShiftManagementViewModel: ObservableObject {
    @Published var shifts: [ShiftItem] = []
    // TODO: Add data fetching and manipulation methods, ensuring all inputs are validated and SQL queries are parameterized.
}

// MARK: - ShiftManagementView
struct ShiftManagementView: View {
    @StateObject private var viewModel = ShiftManagementViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.shifts) { shift in
                    ShiftCard(shift: shift)
                }
            }
            .navigationTitle("Shift Management")
        }
        .accessibilityLabel("Shift Management Screen")
    }
}

// MARK: - ShiftCard view
/// A view representing a card for a single shift.
///
/// It includes elements for displaying the shift's start time, end time, associated vehicle, and assigned driver.
struct ShiftCard: View {
    let shift: ShiftItem

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Vehicle: \(shift.vehicleId)")
                    .font(.headline)
                Text("Driver: \(shift.driverId)")
                    .font(.subheadline)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text("Start: \(shift.startTime, formatter: dateFormatter)")
                    .font(.subheadline)
                Text("End: \(shift.endTime, formatter: dateFormatter)")
                    .font(.subheadline)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 5)
    }
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }
}

// MARK: - Preview
#if DEBUG
struct ShiftManagementView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftManagementView()
    }
}
#endif