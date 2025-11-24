/**
 * Vehicle Details View
 * Displays comprehensive information about a vehicle
 * Shown after vehicle request approval or when viewing vehicle details
 */

import SwiftUI
import MapKit

struct VehicleDetailsView: View {
    let vehicle: Vehicle
    @Environment(\.dismiss) private var dismiss
    @State private var region: MKCoordinateRegion

    init(vehicle: Vehicle) {
        self.vehicle = vehicle
        self._region = State(initialValue: MKCoordinateRegion(
            center: vehicle.location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(vehicle.name)
                                    .font(.title2.bold())
                                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            StatusBadge(status: vehicle.status)
                        }

                        // Quick Stats
                        HStack(spacing: 20) {
                            QuickStatItem(
                                icon: "gauge",
                                label: "Mileage",
                                value: "\(Int(vehicle.mileage)) mi"
                            )
                            QuickStatItem(
                                icon: "fuelpump.fill",
                                label: "Fuel",
                                value: "\(vehicle.fuelLevelPercentage)%",
                                color: vehicle.isLowFuel ? .red : .green
                            )
                            QuickStatItem(
                                icon: vehicle.type.icon,
                                label: "Type",
                                value: vehicle.type.displayName
                            )
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // Location Map
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Current Location", systemImage: "location.fill")
                            .font(.headline)

                        Map(coordinateRegion: $region, annotationItems: [vehicle]) { vehicle in
                            MapMarker(coordinate: vehicle.location.coordinate, tint: .blue)
                        }
                        .frame(height: 200)
                        .cornerRadius(12)

                        Text(vehicle.displayLocation ?? "Location unknown")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // Vehicle Information
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Vehicle Information", systemImage: "info.circle")
                            .font(.headline)

                        VStack(spacing: 12) {
                            DetailRow(label: "Vehicle Number", value: vehicle.number)
                            if !vehicle.vin.isEmpty {
                                DetailRow(label: "VIN", value: vehicle.vin)
                            }
                            if !vehicle.licensePlate.isEmpty {
                                DetailRow(label: "License Plate", value: vehicle.licensePlate)
                            }
                            DetailRow(label: "Department", value: vehicle.department)
                            DetailRow(label: "Region", value: vehicle.region)
                            DetailRow(label: "Ownership", value: vehicle.ownership.displayName)
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // Fuel Information
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Fuel Information", systemImage: "fuelpump.fill")
                            .font(.headline)

                        VStack(spacing: 12) {
                            DetailRow(label: "Fuel Type", value: vehicle.fuelType.displayName)
                            DetailRow(label: "Fuel Level", value: "\(vehicle.fuelLevelPercentage)%")

                            // Fuel level progress bar
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.gray.opacity(0.2))
                                        .frame(height: 8)
                                        .cornerRadius(4)

                                    Rectangle()
                                        .fill(vehicle.isLowFuel ? Color.red : Color.green)
                                        .frame(width: geometry.size.width * vehicle.fuelLevel, height: 8)
                                        .cornerRadius(4)
                                }
                            }
                            .frame(height: 8)

                            if vehicle.isLowFuel {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.red)
                                    Text("Low fuel level")
                                        .font(.caption)
                                        .foregroundColor(.red)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // Maintenance Information
                    VStack(alignment: .leading, spacing: 16) {
                        Label("Maintenance", systemImage: "wrench.and.screwdriver.fill")
                            .font(.headline)

                        VStack(spacing: 12) {
                            if let hoursUsed = vehicle.hoursUsed {
                                DetailRow(label: "Hours Used", value: "\(Int(hoursUsed)) hrs")
                            }
                            DetailRow(label: "Last Service", value: formatDate(vehicle.lastService))
                            DetailRow(label: "Next Service", value: formatDate(vehicle.nextService))

                            if !vehicle.alerts.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Alerts")
                                        .font(.subheadline.bold())
                                        .foregroundColor(.orange)
                                    ForEach(vehicle.alerts, id: \.self) { alert in
                                        HStack {
                                            Image(systemName: "exclamationmark.triangle.fill")
                                                .foregroundColor(.orange)
                                            Text(alert)
                                                .font(.caption)
                                        }
                                    }
                                }
                                .padding()
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // Assignment Information (if assigned)
                    if let assignedDriver = vehicle.assignedDriver {
                        VStack(alignment: .leading, spacing: 16) {
                            Label("Assignment", systemImage: "person.fill")
                                .font(.headline)

                            VStack(spacing: 12) {
                                DetailRow(label: "Assigned To", value: assignedDriver)
                                DetailRow(label: "Status", value: vehicle.status.displayName)
                            }
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                    }

                    // Tags (if any)
                    if let tags = vehicle.tags, !tags.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Tags", systemImage: "tag.fill")
                                .font(.headline)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(tags, id: \.self) { tag in
                                        Text(tag)
                                            .font(.caption)
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(Color.blue.opacity(0.1))
                                            .foregroundColor(.blue)
                                            .cornerRadius(16)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                    }
                }
                .padding()
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

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views

struct QuickStatItem: View {
    let icon: String
    let label: String
    let value: String
    var color: Color = .primary

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
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
                .font(.subheadline.weight(.medium))
        }
    }
}

struct StatusBadge: View {
    let status: VehicleStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(colorFromString(status.color).opacity(0.2))
            .foregroundColor(colorFromString(status.color))
            .cornerRadius(8)
    }

    private func colorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "green": return .green
        case "orange": return .orange
        case "blue": return .blue
        case "yellow": return .yellow
        case "gray": return .gray
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Preview

#Preview {
    VehicleDetailsView(vehicle: Vehicle.sampleAvailable)
}
