import Foundation
import Combine

@MainActor
class VehicleViewModel: ObservableObject {
    @Published var vehicles: [Vehicle] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""

    var filteredVehicles: [Vehicle] {
        if searchText.isEmpty {
            return vehicles
        }
        return vehicles.filter {
            $0.make.localizedCaseInsensitiveContains(searchText) ||
            $0.model.localizedCaseInsensitiveContains(searchText) ||
            $0.licensePlate.localizedCaseInsensitiveContains(searchText) ||
            $0.vin.localizedCaseInsensitiveContains(searchText)
        }
    }

    func loadVehicles() async {
        isLoading = true
        errorMessage = nil

        do {
            let response: VehiclesResponse = try await APIClient.shared.get(endpoint: "/vehicles")
            vehicles = response.vehicles
            isLoading = false
            print("✅ Loaded \(vehicles.count) vehicles")
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            print("❌ Vehicle load failed: \(error)")

            // Use mock data for demo
            loadMockData()
        }
    }

    func refresh() async {
        await loadVehicles()
    }

    private func loadMockData() {
        vehicles = [
            Vehicle(
                id: "1",
                make: "Ford",
                model: "F-150",
                year: 2022,
                vin: "1FTFW1E50MKE12345",
                licensePlate: "FL-1234",
                status: .available,
                mileage: 15420.5,
                fuelLevel: 0.75,
                location: Location(latitude: 30.4383, longitude: -84.2807, address: "Tallahassee, FL"),
                lastMaintenance: Date().addingTimeInterval(-86400 * 30),
                nextMaintenanceDue: Date().addingTimeInterval(86400 * 60)
            ),
            Vehicle(
                id: "2",
                make: "Chevrolet",
                model: "Silverado",
                year: 2021,
                vin: "1GCUYEED7MZ234567",
                licensePlate: "FL-5678",
                status: .inUse,
                mileage: 28750.2,
                fuelLevel: 0.45,
                location: Location(latitude: 25.7617, longitude: -80.1918, address: "Miami, FL"),
                lastMaintenance: Date().addingTimeInterval(-86400 * 15),
                nextMaintenanceDue: Date().addingTimeInterval(86400 * 45)
            ),
            Vehicle(
                id: "3",
                make: "Ram",
                model: "1500",
                year: 2023,
                vin: "1C6SRFFT5PN345678",
                licensePlate: "FL-9012",
                status: .maintenance,
                mileage: 8920.0,
                fuelLevel: 0.20,
                location: Location(latitude: 28.5383, longitude: -81.3792, address: "Orlando, FL"),
                lastMaintenance: Date().addingTimeInterval(-86400 * 2),
                nextMaintenanceDue: Date().addingTimeInterval(86400 * 90)
            )
        ]
    }
}
