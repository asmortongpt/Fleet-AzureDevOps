Here is a SwiftUI view for the 'ShiftReportView' feature:

```swift
//  ShiftReportView.swift
//  Fleet Manager
//
//  View for displaying shift reports with hours worked, overtime tracking and related data

import SwiftUI

// MARK: - Shift Report Data Model
struct ShiftReport: Identifiable {
    let id = UUID()
    let driverId: String
    let hoursWorked: Int
    let overtime: Int
}

// MARK: - Shift Report View Model
class ShiftReportViewModel: ObservableObject {
    // Sample data for shift reports, in production app this will be fetched from server
    @Published var shiftReports = [ShiftReport]()
}

// MARK: - Shift Report View
struct ShiftReportView: View {
    @StateObject private var viewModel = ShiftReportViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.shiftReports) { report in
                    VStack(alignment: .leading) {
                        Text("Driver ID: \(report.driverId)")
                        Text("Hours Worked: \(report.hoursWorked)")
                        Text("Overtime: \(report.overtime)")
                    }
                    .padding()
                    .accessibilityLabel("Shift Report for driver \(report.driverId) with \(report.hoursWorked) hours worked and \(report.overtime) hours of overtime.")
                }
            }
            .navigationTitle("Shift Reports")
        }
        .onAppear(perform: loadData)
    }

    // Simulate secure loading of data from a server
    func loadData() {
        // TODO: Implement server request
        // viewModel.shiftReports = serverResponse
    }
}

// MARK: - Preview
struct ShiftReportView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftReportView()
    }
}

```
This code defines a `ShiftReportView` with a corresponding `ShiftReportViewModel`. The view consists of a `NavigationView` with a `List` that displays shift reports data. For each report, driver ID, hours worked, and overtime are displayed. Preview is provided for the Xcode canvas to visualize the UI design and layout during development.

The `loadData` function is a placeholder for securely fetching data from a server. The actual implementation will depend on the specifics of your backend. 

The ViewModel uses the `@Published` property wrapper to enable SwiftUI to listen for changes and re-render the view when the data changes. The ViewModel is marked with `@StateObject` to manage its lifecycle and keep it alive while the view is on screen. 

This code follows SwiftUI best practices, MVVM architecture, and has accessibility labels for VoiceOver support. It's designed to be responsive and look well on both iPhone and iPad.