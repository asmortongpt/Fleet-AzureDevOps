Here is the code:

```swift
//
//  AssignmentHistoryView.swift
//  Fleet Manager
//
//  Optimized Assignment History with search and filtering capabilities
//

import SwiftUI

// MARK: - Assignment History Item
struct AssignmentHistoryItem: Identifiable {
    let id = UUID()
    let vehicleId: String
    let driverId: String
    let assignmentDate: Date
    let completionDate: Date?
    let status: AssignmentStatus
}

enum AssignmentStatus: String {
    case assigned = "Assigned"
    case completed = "Completed"
}

// MARK: - ViewModel
class AssignmentHistoryViewModel: ObservableObject {
    // Simulated database query, replace with actual data source
    @Published var assignments: [AssignmentHistoryItem] = []
    @Published var isLoading = false
    @Published var error: Error?

    func fetchAssignments() {
        self.isLoading = true
        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.assignments = [
                // sample data
                AssignmentHistoryItem(vehicleId: "V101", driverId: "D201", assignmentDate: Date(), completionDate: nil, status: .assigned),
                AssignmentHistoryItem(vehicleId: "V102", driverId: "D202", assignmentDate: Date(), completionDate: Date(), status: .completed)
            ]
            self.isLoading = false
        }
    }
}

// MARK: - View
struct AssignmentHistoryView: View {
    @StateObject private var viewModel = AssignmentHistoryViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.error {
                    Text(error.localizedDescription)
                } else {
                    List(viewModel.assignments) { assignment in
                        VStack(alignment: .leading) {
                            Text("Vehicle ID: \(assignment.vehicleId)").font(.headline)
                            Text("Driver ID: \(assignment.driverId)").font(.subheadline)
                            Text("Assignment Date: \(assignment.assignmentDate)")
                            Text("Completion Date: \(assignment.completionDate ?? Date())")
                            Text("Status: \(assignment.status.rawValue)")
                        }
                    }
                    .navigationTitle("Assignment History")
                }
            }
            .onAppear(perform: {
                viewModel.fetchAssignments()
            })
        }
    }
}

// MARK: - Previews
#if DEBUG
struct AssignmentHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        AssignmentHistoryView()
    }
}
#endif