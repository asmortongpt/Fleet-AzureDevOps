import SwiftUI

struct VehicleListView: View {
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView("Loading vehicles...")
                } else if viewModel.filteredVehicles.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "car.2.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.gray)
                        Text("No vehicles found")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List(viewModel.filteredVehicles) { vehicle in
                        NavigationLink(destination: VehicleDetailView(vehicle: vehicle)) {
                            VehicleRow(vehicle: vehicle)
                        }
                    }
                    .listStyle(.plain)
                    .searchable(text: $viewModel.searchText, prompt: "Search vehicles")
                }
            }
            .navigationTitle("Vehicles")
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadVehicles()
            }
        }
    }
}

struct VehicleRow: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(vehicle.make) \(vehicle.model)")
                    .font(.headline)

                Spacer()

                StatusBadge(status: vehicle.status)
            }

            HStack(spacing: 16) {
                Label(vehicle.licensePlate, systemImage: "rectangle.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label("\(Int(vehicle.mileage)) mi", systemImage: "speedometer")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label("\(Int(vehicle.fuelLevel * 100))%", systemImage: "fuel.fill")
                    .font(.caption)
                    .foregroundColor(fuelColor)
            }
        }
        .padding(.vertical, 4)
    }

    private var fuelColor: Color {
        vehicle.fuelLevel > 0.5 ? .green :
        vehicle.fuelLevel > 0.25 ? .orange : .red
    }
}

struct StatusBadge: View {
    let status: Vehicle.VehicleStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(6)
    }

    private var statusColor: Color {
        switch status.color {
        case "green": return .green
        case "blue": return .blue
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

#Preview {
    VehicleListView()
}
