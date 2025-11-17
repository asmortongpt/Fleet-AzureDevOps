import SwiftUI
import MapKit

// MARK: - Vehicle Detail View
struct VehicleDetailView: View {
    let vehicle: Vehicle
    @StateObject private var viewModel = VehicleViewModel()
    @State private var showInspection = false
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header Card
                VehicleHeaderCard(vehicle: vehicle)
                    .padding()

                // Quick Actions
                QuickActionsBar(vehicle: vehicle, onInspect: {
                    showInspection = true
                })
                .padding(.horizontal)
                .padding(.bottom)

                // Details Sections
                VStack(spacing: 16) {
                    // Vehicle Information
                    DetailSection(title: "Vehicle Information", icon: "info.circle.fill") {
                        VehicleInfoSection(vehicle: vehicle)
                    }

                    // Location
                    DetailSection(title: "Current Location", icon: "location.fill") {
                        VehicleLocationSection(vehicle: vehicle)
                    }

                    // Status & Metrics
                    DetailSection(title: "Status & Metrics", icon: "chart.bar.fill") {
                        VehicleMetricsSection(vehicle: vehicle)
                    }

                    // Maintenance
                    DetailSection(title: "Maintenance", icon: "wrench.fill") {
                        MaintenanceSection(vehicle: vehicle)
                    }

                    // Alerts
                    if !vehicle.alerts.isEmpty {
                        DetailSection(title: "Alerts", icon: "exclamationmark.triangle.fill") {
                            AlertsSection(alerts: vehicle.alerts)
                        }
                    }

                    // Tags
                    if let tags = vehicle.tags, !tags.isEmpty {
                        DetailSection(title: "Tags", icon: "tag.fill") {
                            TagsSection(tags: tags)
                        }
                    }
                }
                .padding()
            }
        }
        .navigationTitle(vehicle.number)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    // Share or more options
                }) {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showInspection) {
            NavigationView {
                VehicleInspectionView(vehicle: vehicle)
            }
        }
    }
}

// MARK: - Vehicle Header Card
struct VehicleHeaderCard: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 16) {
            // Vehicle Type Icon
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.7)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)

                Image(systemName: vehicle.type.icon)
                    .font(.system(size: 50))
                    .foregroundColor(.white)
            }

            // Vehicle Info
            VStack(spacing: 4) {
                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                    .font(.title2)
                    .fontWeight(.bold)

                Text(vehicle.type.displayName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                VehicleStatusBadge(status: vehicle.status)
                    .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical)
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

// MARK: - Quick Actions Bar
struct QuickActionsBar: View {
    let vehicle: Vehicle
    let onInspect: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            QuickActionButton(
                icon: "checkmark.circle.fill",
                title: "Inspect",
                color: .blue,
                action: onInspect
            )

            QuickActionButton(
                icon: "wrench.fill",
                title: "Service",
                color: .orange,
                action: {}
            )

            QuickActionButton(
                icon: "map.fill",
                title: "Locate",
                color: .green,
                action: {}
            )

            QuickActionButton(
                icon: "doc.text.fill",
                title: "Records",
                color: .purple,
                action: {}
            )
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.15))
                    .clipShape(Circle())

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Detail Section
struct DetailSection<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(.primary)

            content
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Vehicle Info Section
struct VehicleInfoSection: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 12) {
            InfoRow(label: "VIN", value: vehicle.vin, icon: "barcode")
            Divider()
            InfoRow(label: "License Plate", value: vehicle.licensePlate, icon: "doc.text.fill")
            Divider()
            InfoRow(label: "Department", value: vehicle.department, icon: "building.2.fill")
            Divider()
            InfoRow(label: "Region", value: vehicle.region, icon: "map.fill")
            Divider()
            InfoRow(label: "Ownership", value: vehicle.ownership.displayName, icon: "key.fill")
            Divider()
            InfoRow(label: "Fuel Type", value: vehicle.fuelType.displayName, icon: "fuelpump.fill")

            if let driver = vehicle.assignedDriver {
                Divider()
                InfoRow(label: "Assigned Driver", value: driver, icon: "person.fill")
            }
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
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

    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: dateString) {
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
        return dateString
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
    let tags: [String]

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(tags, id: \.self) { tag in
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

// MARK: - Flow Layout for Tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: CGSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.replacingUnspecifiedDimensions().width, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: CGSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX, y: bounds.minY + result.frames[index].minY), proposal: .unspecified)
        }
    }

    struct FlowResult {
        var frames: [CGRect] = []
        var size: CGSize = .zero

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                frames.append(CGRect(origin: CGPoint(x: currentX, y: currentY), size: size))
                currentX += size.width + spacing
                lineHeight = max(lineHeight, size.height)
            }

            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleDetailView_Previews: PreviewProvider {
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
            location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "1600 Pennsylvania Ave NW, Washington, DC 20500"),
            region: "Northeast",
            department: "Operations",
            fuelLevel: 0.35,
            fuelType: .gasoline,
            mileage: 45000,
            hoursUsed: 2500,
            assignedDriver: "John Doe",
            ownership: .owned,
            lastService: "2024-01-15",
            nextService: "2024-04-15",
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
