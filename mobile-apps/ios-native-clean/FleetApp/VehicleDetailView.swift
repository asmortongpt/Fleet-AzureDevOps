import SwiftUI
import MapKit

struct VehicleDetailView: View {
    let vehicle: Vehicle

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("\(vehicle.make) \(vehicle.model)")
                        .font(.title)
                        .fontWeight(.bold)

                    HStack {
                        Label(vehicle.licensePlate, systemImage: "rectangle.fill")
                        Spacer()
                        StatusBadge(status: vehicle.status)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Vehicle Info
                VStack(alignment: .leading, spacing: 16) {
                    Text("Vehicle Information")
                        .font(.headline)

                    InfoRow(label: "Year", value: "\(vehicle.year)")
                    InfoRow(label: "VIN", value: vehicle.vin)
                    InfoRow(label: "Mileage", value: "\(Int(vehicle.mileage)) miles")
                    InfoRow(label: "Fuel Level", value: "\(Int(vehicle.fuelLevel * 100))%")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Maintenance
                if let lastMaintenance = vehicle.lastMaintenance,
                   let nextMaintenance = vehicle.nextMaintenanceDue {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Maintenance")
                            .font(.headline)

                        InfoRow(label: "Last Service", value: formatDate(lastMaintenance))
                        InfoRow(label: "Next Service Due", value: formatDate(nextMaintenance))
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }

                // Location Map
                if let location = vehicle.location {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Current Location")
                            .font(.headline)

                        Map(coordinateRegion: .constant(MKCoordinateRegion(
                            center: CLLocationCoordinate2D(
                                latitude: location.latitude,
                                longitude: location.longitude
                            ),
                            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                        )), annotationItems: [location]) { loc in
                            MapMarker(coordinate: CLLocationCoordinate2D(
                                latitude: loc.latitude,
                                longitude: loc.longitude
                            ), tint: .blue)
                        }
                        .frame(height: 200)
                        .cornerRadius(12)

                        if let address = location.address {
                            Text(address)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Vehicle Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

extension Location: Identifiable {
    var id: String { "\(latitude),\(longitude)" }
}

#Preview {
    NavigationView {
        VehicleDetailView(vehicle: Vehicle(
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
        ))
    }
}
