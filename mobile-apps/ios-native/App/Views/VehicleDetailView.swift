import SwiftUI
import MapKit

// MARK: - Vehicle Detail View
struct VehicleDetailView: View {
    let vehicle: Vehicle
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                // Header Card
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(vehicle.number)
                                .font(ModernTheme.Typography.title1)
                                .foregroundColor(ModernTheme.Colors.primaryText)

                            Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                .font(ModernTheme.Typography.title3)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        }

                        Spacer()

                        // Status Badge
                        HStack {
                            Image(systemName: vehicle.status.symbolName)
                                .foregroundColor(.white)
                            Text(vehicle.status.displayName)
                                .font(.caption.weight(.semibold))
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(vehicle.status.themeColor)
                        .cornerRadius(12)
                    }

                    // VIN and License
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("VIN:")
                                .font(.caption)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                            Text(vehicle.vin)
                                .font(.caption.weight(.medium))
                        }

                        HStack {
                            Text("License Plate:")
                                .font(.caption)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                            Text(vehicle.licensePlate)
                                .font(.caption.weight(.medium))
                        }
                    }
                }
                .padding(ModernTheme.Spacing.lg)
                .background(ModernTheme.Colors.secondaryBackground)
                .cornerRadius(ModernTheme.CornerRadius.lg)

                // Location Section
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                    Text("Location")
                        .font(ModernTheme.Typography.headline)
                    VehicleLocationSection(vehicle: vehicle)
                }
                .padding(ModernTheme.Spacing.lg)
                .background(ModernTheme.Colors.background)
                .cornerRadius(ModernTheme.CornerRadius.lg)

                // Metrics Section
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                    Text("Vehicle Metrics")
                        .font(ModernTheme.Typography.headline)
                    VehicleMetricsSection(vehicle: vehicle)
                }
                .padding(ModernTheme.Spacing.lg)
                .background(ModernTheme.Colors.background)
                .cornerRadius(ModernTheme.CornerRadius.lg)

                // Maintenance Section
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                    Text("Maintenance")
                        .font(ModernTheme.Typography.headline)
                    MaintenanceSection(vehicle: vehicle)
                }
                .padding(ModernTheme.Spacing.lg)
                .background(ModernTheme.Colors.background)
                .cornerRadius(ModernTheme.CornerRadius.lg)

                // Alerts Section (if any)
                if !vehicle.alerts.isEmpty {
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        Text("Active Alerts")
                            .font(ModernTheme.Typography.headline)
                        AlertsSection(alerts: vehicle.alerts)
                    }
                    .padding(ModernTheme.Spacing.lg)
                    .background(ModernTheme.Colors.background)
                    .cornerRadius(ModernTheme.CornerRadius.lg)
                }

                // Tags Section (if any)
                if let tags = vehicle.tags, !tags.isEmpty {
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        Text("Tags")
                            .font(ModernTheme.Typography.headline)
                        TagsSection(tags: vehicle.tags)
                    }
                    .padding(ModernTheme.Spacing.lg)
                    .background(ModernTheme.Colors.background)
                    .cornerRadius(ModernTheme.CornerRadius.lg)
                }
            }
            .padding()
        }
        .navigationTitle(vehicle.number)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Vehicle Location Section
struct VehicleLocationSection: View {
    let vehicle: Vehicle
    @State private var region: MKCoordinateRegion

    init(vehicle: Vehicle) {
        self.vehicle = vehicle
        _region = State(initialValue: MKCoordinateRegion(
            center: CLLocationCoordinate2D(
                latitude: vehicle.location.lat,
                longitude: vehicle.location.lng
            ),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Map
            Map(coordinateRegion: $region, annotationItems: [vehicle]) { vehicle in
                MapMarker(
                    coordinate: CLLocationCoordinate2D(
                        latitude: vehicle.location.lat,
                        longitude: vehicle.location.lng
                    ),
                    tint: .blue
                )
            }
            .frame(height: 200)
            .cornerRadius(12)

            // Address
            HStack {
                Image(systemName: "mappin.and.ellipse")
                    .foregroundColor(.red)
                Text(vehicle.location.address)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Coordinates
            HStack(spacing: 16) {
                HStack {
                    Text("Lat:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(String(format: "%.4f", vehicle.location.lat))
                        .font(.caption)
                        .fontWeight(.medium)
                }

                HStack {
                    Text("Lng:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(String(format: "%.4f", vehicle.location.lng))
                        .font(.caption)
                        .fontWeight(.medium)
                }
            }
        }
    }
}

// MARK: - Vehicle Metrics Section
struct VehicleMetricsSection: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 16) {
            // Fuel Level with Progress
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "fuelpump.fill")
                        .foregroundColor(vehicle.isLowFuel ? .red : .green)
                    Text("Fuel Level")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(vehicle.fuelLevelPercentage)%")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(vehicle.isLowFuel ? .red : .green)
                }

                ProgressView(value: vehicle.fuelLevel)
                    .tint(vehicle.isLowFuel ? .red : .green)
            }

            Divider()

            // Mileage
            HStack {
                Image(systemName: "speedometer")
                    .foregroundColor(.blue)
                    .frame(width: 24)
                Text("Total Mileage")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%.0f mi", vehicle.mileage))
                    .font(.subheadline)
                    .fontWeight(.bold)
            }

            if let hoursUsed = vehicle.hoursUsed {
                Divider()
                HStack {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.orange)
                        .frame(width: 24)
                    Text("Hours Used")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(String(format: "%.1f hrs", hoursUsed))
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
            }
        }
    }
}

// MARK: - Maintenance Section
struct MaintenanceSection: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Last Service")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatDate(vehicle.lastService))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                Spacer()
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Next Service Due")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatDate(vehicle.nextService))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                Spacer()
                Image(systemName: "calendar.circle.fill")
                    .foregroundColor(.orange)
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Alerts Section
struct AlertsSection: View {
    let alerts: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(alerts, id: \.self) { alert in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                        .font(.caption)

                    Text(alert)
                        .font(.subheadline)
                        .foregroundColor(.primary)

                    Spacer()
                }
                .padding(.vertical, 4)
            }
        }
    }
}

// MARK: - Tags Section
struct TagsSection: View {
    let tags: [String]?

    var body: some View {
        if #available(iOS 16.0, *) {
            FlowLayout(spacing: 8) {
                ForEach(tags ?? [], id: \.self) { tag in
                    Text(tag)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.15))
                        .foregroundColor(.blue)
                        .cornerRadius(16)
                }
            }
        } else {
            // Fallback for iOS 15
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(tags ?? [], id: \.self) { tag in
                        Text(tag)
                            .font(.caption)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue.opacity(0.15))
                            .foregroundColor(.blue)
                            .cornerRadius(16)
                    }
                }
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleDetailView_Previews: PreviewProvider {
    static var previews: some View {
        let dateFormatter = ISO8601DateFormatter()
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
            location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "1600 Pennsylvania Ave NW, Washington, DC 20500"),
            region: "Northeast",
            department: "Operations",
            fuelLevel: 0.35,
            fuelType: .gasoline,
            mileage: 45000,
            hoursUsed: 2500,
            assignedDriver: "John Doe",
            ownership: .owned,
            lastService: dateFormatter.date(from: "2024-01-15T00:00:00Z") ?? Date(),
            nextService: dateFormatter.date(from: "2024-04-15T00:00:00Z") ?? Date(),
            alerts: ["Oil change due", "Tire rotation needed"],
            customFields: nil,
            tags: ["Heavy Duty", "Winter Ready", "4WD"]
        )

        NavigationView {
            VehicleDetailView(vehicle: sampleVehicle)
        }
    }
}
#endif
