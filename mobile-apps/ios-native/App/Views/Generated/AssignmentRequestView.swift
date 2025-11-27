t
//
//  AssignmentRequestView.swift
//  Fleet Manager
//
//  Management of driver assignment requests, allowing drivers to request specific vehicles
//

import SwiftUI

// Represents a single assignment request
struct AssignmentRequest: Identifiable {
    let id = UUID()
    let driverId: String
    let vehicleId: String
    let timestamp: Date
}

// ViewModel for the assignment request view, responsible for handling the business logic
class AssignmentRequestViewModel: ObservableObject {
    @Published var assignmentRequests: [AssignmentRequest] = []
    // TODO: Implement fetchAssignmentRequests() that fetches data from the server
}

struct AssignmentRequestView: View {
    @StateObject private var viewModel = AssignmentRequestViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.assignmentRequests) { assignmentRequest in
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Driver ID: \(assignmentRequest.driverId)").font(.headline)
                            Text("Vehicle ID: \(assignmentRequest.vehicleId)").font(.subheadline)
                        }
                        Spacer()
                        Text("\(assignmentRequest.timestamp, formatter: DateFormatter())").font(.caption)
                    }
                    .padding()
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Assignment request from driver \(assignmentRequest.driverId) for vehicle \(assignmentRequest.vehicleId) made on \(assignmentRequest.timestamp, formatter: DateFormatter())")
                }
            }
            .navigationTitle("Assignment Requests")
        }
        .onAppear {
            // Assuming parameterized queries and input validation are handled in fetchAssignmentRequests
            viewModel.fetchAssignmentRequests()
        }
    }
}

#if DEBUG
struct AssignmentRequestView_Previews: PreviewProvider {
    static var previews: some View {
        AssignmentRequestView()
    }
}
#endif