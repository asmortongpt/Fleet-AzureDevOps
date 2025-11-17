//
//  FleetMapView.swift
//  Fleet Manager
//
//  Map view showing vehicle locations with status indicators
//

import SwiftUI
import MapKit

struct FleetMapView: View {
    @ObservedObject var viewModel: VehiclesViewModel
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )
    @State private var selectedVehicle: Vehicle?
    @State private var showVehicleDetail = false

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Map(coordinateRegion: $region, annotationItems: viewModel.filteredVehicles) { vehicle in
                MapAnnotation(coordinate: CLLocationCoordinate2D(
                    latitude: vehicle.location.lat,
                    longitude: vehicle.location.lng
                )) {
                    VehicleMapMarker(vehicle: vehicle)
                        .onTapGesture {
                            selectedVehicle = vehicle
                            showVehicleDetail = true
                        }
                }
            }
            .ignoresSafeArea()

            // Map Controls
            VStack(spacing: 12) {
                // Zoom to all vehicles button
                Button(action: zoomToAllVehicles) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }

                // Refresh button
                Button(action: { Task { await viewModel.refresh() } }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color.green)
                        .clipShape(Circle())
                        .shadow(radius: 4)
                }
            }
            .padding()

            // Vehicle Detail Sheet
            if showVehicleDetail, let vehicle = selectedVehicle {
                VStack {
                    Spacer()
                    VehicleMapDetailCard(vehicle: vehicle)
                        .padding()
                        .transition(.move(edge: .bottom))
                }
            }
        }
        .navigationTitle("Fleet Map")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            zoomToAllVehicles()
        }
        .sheet(isPresented: $showVehicleDetail) {
            if let vehicle = selectedVehicle {
                VehicleMapDetailSheet(vehicle: vehicle)
            }
        }
    }

    private func zoomToAllVehicles() {
        guard !viewModel.filteredVehicles.isEmpty else { return }

        var minLat = 90.0
        var maxLat = -90.0
        var minLng = 180.0
        var maxLng = -180.0

        for vehicle in viewModel.filteredVehicles {
            minLat = min(minLat, vehicle.location.lat)
            maxLat = max(maxLat, vehicle.location.lat)
            minLng = min(minLng, vehicle.location.lng)
            maxLng = max(maxLng, vehicle.location.lng)
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.5, 0.1),
            longitudeDelta: max((maxLng - minLng) * 1.5, 0.1)
        )

        withAnimation {
            region = MKCoordinateRegion(center: center, span: span)
        }
    }
}

struct VehicleMapMarker: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 40, height: 40)
                    .shadow(radius: 4)

                Image(systemName: vehicle.type.icon)
                    .foregroundColor(.white)
                    .font(.system(size: 20))
            }

            Text(vehicle.number)
                .font(.caption2)
                .fontWeight(.semibold)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white)
                .cornerRadius(4)
                .shadow(radius: 2)
        }
    }

    private var statusColor: Color {
        switch vehicle.status {
        case .active, .moving: return .green
        case .idle, .parked: return .blue
        case .offline: return .red
        case .maintenance, .service: return .orange
        case .charging: return .purple
        case .emergency: return .red
        case .inactive: return .gray
        }
    }
}

struct VehicleMapDetailCard: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.number)
                        .font(.headline)
                        .fontWeight(.bold)

                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(vehicle.status.displayName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(statusColor)
                        .cornerRadius(8)

                    Text(vehicle.location.address)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Divider()

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fuel")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(Int(vehicle.fuelLevel * 100))%")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Mileage")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(String(format: "%.0f mi", vehicle.mileage))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                if let driver = vehicle.assignedDriver {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Driver")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(driver)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .lineLimit(1)
                    }
                }

                Spacer()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 8)
    }

    private var statusColor: Color {
        switch vehicle.status {
        case .active, .moving: return .green
        case .idle, .parked: return .blue
        case .offline: return .red
        case .maintenance, .service: return .orange
        case .charging: return .purple
        case .emergency: return .red
        case .inactive: return .gray
        }
    }
}

struct VehicleMapDetailSheet: View {
    let vehicle: Vehicle
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text(vehicle.number)
                            .font(.title)
                            .fontWeight(.bold)

                        Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    .padding()

                    // Status
                    HStack {
                        Text("Status:")
                            .font(.headline)
                        Spacer()
                        Text(vehicle.status.displayName)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(statusColor)
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)

                    Divider()

                    // Details
                    VStack(alignment: .leading, spacing: 16) {
                        DetailRow(label: "VIN", value: vehicle.vin)
                        DetailRow(label: "License Plate", value: vehicle.licensePlate)
                        DetailRow(label: "Department", value: vehicle.department)
                        DetailRow(label: "Region", value: vehicle.region)
                        DetailRow(label: "Fuel Level", value: "\(Int(vehicle.fuelLevel * 100))%")
                        DetailRow(label: "Fuel Type", value: vehicle.fuelType.displayName)
                        DetailRow(label: "Mileage", value: String(format: "%.0f miles", vehicle.mileage))
                        DetailRow(label: "Ownership", value: vehicle.ownership.displayName)

                        if let driver = vehicle.assignedDriver {
                            DetailRow(label: "Assigned Driver", value: driver)
                        }

                        if let hours = vehicle.hoursUsed {
                            DetailRow(label: "Hours Used", value: String(format: "%.0f hours", hours))
                        }
                    }
                    .padding(.horizontal)

                    Divider()

                    // Location
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Location")
                            .font(.headline)
                        Text(vehicle.location.address)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)

                    // Alerts
                    if !vehicle.alerts.isEmpty {
                        Divider()

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Alerts")
                                .font(.headline)

                            ForEach(vehicle.alerts, id: \.self) { alert in
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.orange)
                                    Text(alert)
                                        .font(.subheadline)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Vehicle Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var statusColor: Color {
        switch vehicle.status {
        case .active, .moving: return .green
        case .idle, .parked: return .blue
        case .offline: return .red
        case .maintenance, .service: return .orange
        case .charging: return .purple
        case .emergency: return .red
        case .inactive: return .gray
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

#if DEBUG
struct FleetMapView_Previews: PreviewProvider {
    static var previews: some View {
        FleetMapView(viewModel: VehiclesViewModel())
    }
}
#endif
