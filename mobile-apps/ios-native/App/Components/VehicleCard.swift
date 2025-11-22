import SwiftUI

// MARK: - Vehicle Card Component
struct VehicleCard: View {
    let vehicle: Vehicle
    var onTap: (() -> Void)?

    var body: some View {
        Button(action: {
            onTap?()
        }) {
            VStack(alignment: .leading, spacing: 0) {
                // Header with vehicle number and status
                HStack {
                    // Vehicle Type Icon
                    Image(systemName: vehicle.type.icon)
                        .font(.title2)
                        .foregroundColor(.blue)
                        .frame(width: 40, height: 40)
                        .background(Color.blue.opacity(0.1))
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text(vehicle.number)
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    // Status Badge
                    VehicleStatusBadge(status: vehicle.status)
                }
                .padding()

                Divider()

                // Vehicle Info Grid
                VStack(spacing: 12) {
                    HStack(spacing: 16) {
                        // Mileage
                        VehicleInfoItem(
                            icon: "speedometer",
                            label: "Mileage",
                            value: String(format: "%.0f mi", vehicle.mileage),
                            color: .blue
                        )

                        Divider()
                            .frame(height: 40)

                        // Fuel Level
                        VehicleInfoItem(
                            icon: "fuelpump.fill",
                            label: "Fuel",
                            value: "\(vehicle.fuelLevelPercentage)%",
                            color: vehicle.isLowFuel ? .red : .green
                        )
                    }

                    Divider()

                    HStack(spacing: 16) {
                        // License Plate
                        VehicleInfoItem(
                            icon: "doc.text.fill",
                            label: "Plate",
                            value: vehicle.licensePlate,
                            color: .purple
                        )

                        Divider()
                            .frame(height: 40)

                        // Department
                        VehicleInfoItem(
                            icon: "building.2.fill",
                            label: "Dept",
                            value: vehicle.department,
                            color: .orange
                        )
                    }
                }
                .padding()

                // Alerts Section (if any)
                if !vehicle.alerts.isEmpty {
                    Divider()

                    VStack(alignment: .leading, spacing: 8) {
                        Label("Alerts", systemImage: "exclamationmark.triangle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.orange)

                        ForEach(vehicle.alerts.prefix(2), id: \.self) { alert in
                            HStack {
                                Circle()
                                    .fill(Color.orange)
                                    .frame(width: 6, height: 6)

                                Text(alert)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }

                        if vehicle.alerts.count > 2 {
                            Text("+\(vehicle.alerts.count - 2) more")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .padding(.leading, 14)
                        }
                    }
                    .padding()
                    .background(Color.orange.opacity(0.05))
                }
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Vehicle Status Badge
struct VehicleStatusBadge: View {
    let status: VehicleStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)

            Text(status.displayName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(statusColor.opacity(0.2))
        .foregroundColor(statusColor)
        .cornerRadius(12)
    }

    private var statusColor: Color {
        switch status {
        case .active:
            return .green
        case .idle:
            return .gray
        case .charging:
            return .blue
        case .service:
            return .orange
        case .emergency:
            return .red
        case .offline:
            return .black
        }
    }
}

// MARK: - Vehicle Info Item
struct VehicleInfoItem: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .lineLimit(1)
            }

            Spacer()
        }
    }
}

// MARK: - Compact Vehicle Card (for lists)
struct CompactVehicleCard: View {
    let vehicle: Vehicle
    var onTap: (() -> Void)?

    var body: some View {
        Button(action: {
            onTap?()
        }) {
            HStack(spacing: 12) {
                // Vehicle Icon
                Image(systemName: vehicle.type.icon)
                    .font(.title3)
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.7)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                // Vehicle Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.number)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text("\(vehicle.make) \(vehicle.model)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    HStack(spacing: 12) {
                        HStack(spacing: 4) {
                            Image(systemName: "speedometer")
                                .font(.caption)
                            Text(String(format: "%.0f mi", vehicle.mileage))
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)

                        HStack(spacing: 4) {
                            Image(systemName: "fuelpump.fill")
                                .font(.caption)
                            Text("\(vehicle.fuelLevelPercentage)%")
                                .font(.caption)
                        }
                        .foregroundColor(vehicle.isLowFuel ? .red : .secondary)
                    }
                }

                Spacer()

                // Status and Alerts
                VStack(alignment: .trailing, spacing: 8) {
                    VehicleStatusBadge(status: vehicle.status)

                    if !vehicle.alerts.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.caption)
                            Text("\(vehicle.alerts.count)")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.orange)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleCard_Previews: PreviewProvider {
    static var previews: some View {
        let sampleVehicle = Vehicle(
            id: "1",
            tenantId: "tenant1",
            number: "V-001",
            type: .truck,
            make: "Ford",
            model: "F-150",
            year: 2022,
            vin: "1FTFW1E54MFA12345",
            licensePlate: "ABC123",
            status: .active,
            location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "Washington, DC"),
            region: "Northeast",
            department: "Operations",
            fuelLevel: 0.75,
            fuelType: .gasoline,
            mileage: 45000,
            hoursUsed: nil,
            assignedDriver: "John Doe",
            ownership: .owned,
            lastService: "2024-01-15",
            nextService: "2024-04-15",
            alerts: ["Oil change due", "Tire rotation needed"],
            customFields: nil,
            tags: nil
        )

        VStack(spacing: 16) {
            VehicleCard(vehicle: sampleVehicle)
            CompactVehicleCard(vehicle: sampleVehicle)
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
#endif
