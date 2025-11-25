//
//  VehicleDetailViewWrapper.swift
//  Fleet Manager
//
//  Wrapper to load vehicle by ID and display VehicleDetailView
//

import SwiftUI

struct VehicleDetailViewWrapper: View {
    let vehicleId: String
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Loading vehicle...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let vehicle = viewModel.selectedVehicle {
                VehicleDetailView(vehicle: vehicle)
            } else if let error = viewModel.errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)

                    Text("Failed to Load Vehicle")
                        .font(.title2.bold())

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Button("Retry") {
                        Task {
                            await viewModel.fetchVehicle(id: vehicleId)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "car.2")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)

                    Text("Vehicle Not Found")
                        .font(.title2.bold())

                    Text("Unable to load vehicle with ID: \(vehicleId)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task {
            await viewModel.fetchVehicle(id: vehicleId)
        }
        .navigationTitle("Vehicle Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}
