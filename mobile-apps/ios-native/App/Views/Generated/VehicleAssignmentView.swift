t
//  VehicleAssignmentView.swift
//  Fleet Manager
//
//  A view to display current vehicle assignments
//

import SwiftUI
import Combine

// MARK: - VehicleAssignment Model
struct VehicleAssignment: Identifiable {
    let id = UUID()
    let vehicleId: String
    let driverId: String
}

// MARK: - ViewModel
class VehicleAssignmentViewModel: ObservableObject {
    @Published var assignments: [VehicleAssignment] = [] // Fetch this from your data source
    @Published var isLoading = false
    @Published var error: Error?

    let vehicleService: VehicleService // Assume this exists in your codebase
    let driverService: DriverService // Assume this exists in your codebase
    var cancellables = Set<AnyCancellable>()

    func fetchAssignments() {
        isLoading = true
        // Use your method to fetch assignments
        vehicleService.fetchVehicleAssignments()
            .sink { completion in
                switch completion {
                case .failure(let error):
                    self.error = error
                case .finished:
                    break
                }
                self.isLoading = false
            } receiveValue: { assignments in
                self.assignments = assignments
            }
            .store(in: &cancellables)
    }
}

// MARK: - View
struct VehicleAssignmentView: View {
    @StateObject private var viewModel = VehicleAssignmentViewModel()

    var body: some View {
        NavigationView {
            List {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    ForEach(viewModel.assignments) { assignment in
                        VStack(alignment: .leading) {
                            Text("Vehicle ID: \(assignment.vehicleId)")
                            Text("Driver ID: \(assignment.driverId)")
                        }
                        .padding()
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel(Text("Vehicle assignment. Vehicle ID: \(assignment.vehicleId). Driver ID: \(assignment.driverId)."))
                    }
                    .onAppear {
                        viewModel.fetchAssignments()
                    }
                }
            }
            .navigationTitle("Vehicle Assignments")
            .alert(item: $viewModel.error) { error in
                // Present any errors to the user
                Alert(title: Text("Error"), message: Text(error.localizedDescription), dismissButton: .default(Text("OK")))
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleAssignmentView_Previews: PreviewProvider {
    static var previews: some View {
        VehicleAssignmentView()
    }
}
#endif