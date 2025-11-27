t
//
//  CreateAssignmentView.swift
//  Fleet Manager
//
//  View to assign vehicles to drivers with date/time selection
//

import SwiftUI

// MARK: - Assignment Model
struct Assignment: Identifiable {
    let id = UUID()
    let vehicleId: String
    let driverId: String
    let date: Date
}

// MARK: - ViewModel
class CreateAssignmentViewModel: ObservableObject {
    @Published var vehicles = [Vehicle]()
    @Published var drivers = [Driver]()
    @Published var date = Date()
    @Published var selectedVehicleId: String?
    @Published var selectedDriverId: String?
    @Published var isLoading = false
    @Published var error: Error?

    // TODO: Implement loading of vehicles and drivers from the API here
}

// MARK: - CreateAssignmentView
struct CreateAssignmentView: View {
    @StateObject private var viewModel = CreateAssignmentViewModel()

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle")) {
                    Picker("Vehicle", selection: $viewModel.selectedVehicleId) {
                        ForEach(viewModel.vehicles) { vehicle in
                            Text(vehicle.name).tag(vehicle.id)
                        }
                    }
                }

                Section(header: Text("Driver")) {
                    Picker("Driver", selection: $viewModel.selectedDriverId) {
                        ForEach(viewModel.drivers) { driver in
                            Text(driver.name).tag(driver.id)
                        }
                    }
                }

                Section(header: Text("Date")) {
                    DatePicker("Date", selection: $viewModel.date, displayedComponents: .date)
                }

                Button(action: {
                    // TODO: Implement assignment creation here
                }) {
                    Text("Create Assignment")
                }
                .disabled(viewModel.selectedVehicleId == nil || viewModel.selectedDriverId == nil)
            }
            .navigationTitle("Create Assignment")
            .navigationBarItems(trailing: Button(action: {
                viewModel.date = Date()
                viewModel.selectedVehicleId = nil
                viewModel.selectedDriverId = nil
            }) {
                Image(systemName: "xmark.circle")
                    .accessibilityLabel("Reset form")
            })
            .alert(item: $viewModel.error) { error in
                Alert(title: Text("Error"), message: Text(error.localizedDescription), dismissButton: .default(Text("OK")))
            }
        }
        .onAppear {
            viewModel.isLoading = true
            // TODO: Load vehicles and drivers here
            viewModel.isLoading = false
        }
    }
}

// MARK: - Preview
#if DEBUG
struct CreateAssignmentView_Previews: PreviewProvider {
    static var previews: some View {
        CreateAssignmentView()
    }
}
#endif