//
//  AddGeofenceView.swift
//  Fleet Manager - iOS Native App
//
//  Create/Edit geofence with interactive map for drawing zones
//  Follows ModernTheme design patterns and accessibility standards
//

import SwiftUI
import MapKit

// MARK: - Add Geofence View
struct AddGeofenceView: View {
    @ObservedObject var viewModel: GeofenceViewModel
    let existingGeofence: Geofence?

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var description = ""
    @State private var selectedType: GeofenceType = .custom
    @State private var shapeType: ShapeType = .circle
    @State private var radius: Double = 500 // meters
    @State private var centerCoordinate = CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369)
    @State private var polygonPoints: [CLLocationCoordinate2D] = []
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    @State private var alertOnEntry = true
    @State private var alertOnExit = true
    @State private var alertOnDwell = false
    @State private var dwellTimeMinutes = 30

    @State private var searchText = ""
    @State private var showingValidationError = false
    @State private var validationMessage = ""

    enum ShapeType: String, CaseIterable {
        case circle = "Circle"
        case polygon = "Polygon"
    }

    init(viewModel: GeofenceViewModel, existingGeofence: Geofence? = nil) {
        self.viewModel = viewModel
        self.existingGeofence = existingGeofence

        if let existing = existingGeofence {
            _name = State(initialValue: existing.name)
            _description = State(initialValue: existing.description ?? "")
            _selectedType = State(initialValue: existing.type)
            _alertOnEntry = State(initialValue: existing.notifications.onEntry)
            _alertOnExit = State(initialValue: existing.notifications.onExit)
            _alertOnDwell = State(initialValue: existing.notifications.onDwell)
            _dwellTimeMinutes = State(initialValue: existing.notifications.dwellTimeMinutes ?? 30)

            switch existing.shape {
            case .circle(let circle):
                _shapeType = State(initialValue: .circle)
                _centerCoordinate = State(initialValue: circle.coordinate)
                _radius = State(initialValue: circle.radius)
                _region = State(initialValue: MKCoordinateRegion(
                    center: circle.coordinate,
                    latitudinalMeters: circle.radius * 4,
                    longitudinalMeters: circle.radius * 4
                ))
            case .polygon(let polygon):
                _shapeType = State(initialValue: .polygon)
                _polygonPoints = State(initialValue: polygon.clCoordinates)
                if let first = polygon.coordinates.first {
                    _region = State(initialValue: MKCoordinateRegion(
                        center: first.clCoordinate,
                        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                    ))
                }
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                // Interactive Map
                MapSection

                // Basic Information
                BasicInfoSection

                // Shape Configuration
                ShapeConfigSection

                // Alert Configuration
                AlertConfigSection

                // Save Button
                SaveButton
            }
            .padding(.horizontal)
            .padding(.bottom, ModernTheme.Spacing.xxl)
        }
        .navigationTitle(existingGeofence == nil ? "Add Geofence" : "Edit Geofence")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
        .alert("Validation Error", isPresented: $showingValidationError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(validationMessage)
        }
    }

    // MARK: - Map Section
    private var MapSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Location & Shape")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            ZStack(alignment: .topTrailing) {
                // Map with geofence preview
                InteractiveMapView(
                    region: $region,
                    centerCoordinate: $centerCoordinate,
                    radius: $radius,
                    shapeType: shapeType,
                    polygonPoints: $polygonPoints
                )
                .frame(height: 300)
                .cornerRadius(ModernTheme.CornerRadius.md)

                // Map controls
                VStack(spacing: ModernTheme.Spacing.sm) {
                    // Reset center button
                    Button {
                        ModernTheme.Haptics.light()
                        centerCoordinate = region.center
                    } label: {
                        Image(systemName: "scope")
                            .font(.title3)
                            .foregroundColor(.white)
                            .padding(ModernTheme.Spacing.sm)
                            .background(ModernTheme.Colors.primary)
                            .clipShape(Circle())
                            .shadow(radius: 3)
                    }

                    // Clear polygon points (if polygon mode)
                    if shapeType == .polygon && !polygonPoints.isEmpty {
                        Button {
                            ModernTheme.Haptics.light()
                            polygonPoints.removeAll()
                        } label: {
                            Image(systemName: "trash.fill")
                                .font(.title3)
                                .foregroundColor(.white)
                                .padding(ModernTheme.Spacing.sm)
                                .background(ModernTheme.Colors.error)
                                .clipShape(Circle())
                                .shadow(radius: 3)
                        }
                    }
                }
                .padding(ModernTheme.Spacing.md)
            }

            // Map instructions
            Text(shapeType == .circle ?
                 "Drag the map to set the center, adjust radius below" :
                 "Tap on the map to add polygon points")
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Basic Info Section
    private var BasicInfoSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Basic Information")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            // Name field
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                Text("Name *")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                TextField("Enter geofence name", text: $name)
                    .textFieldStyle(.roundedBorder)
            }

            // Description field
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                Text("Description")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                TextField("Enter description (optional)", text: $description)
                    .textFieldStyle(.roundedBorder)
            }

            // Type picker
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                Text("Type *")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(GeofenceType.allCases, id: \.self) { type in
                            TypeChip(
                                type: type,
                                isSelected: selectedType == type
                            ) {
                                ModernTheme.Haptics.selection()
                                selectedType = type
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Shape Config Section
    private var ShapeConfigSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Shape Configuration")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            // Shape type picker
            Picker("Shape Type", selection: $shapeType) {
                ForEach(ShapeType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: shapeType) { _ in
                polygonPoints.removeAll()
            }

            if shapeType == .circle {
                // Radius slider
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    HStack {
                        Text("Radius")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                        Spacer()
                        Text(formatRadius(radius))
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primary)
                    }

                    Slider(value: $radius, in: 100...5000, step: 50) {
                        Text("Radius")
                    } minimumValueLabel: {
                        Text("100m")
                            .font(ModernTheme.Typography.caption2)
                    } maximumValueLabel: {
                        Text("5km")
                            .font(ModernTheme.Typography.caption2)
                    }
                    .tint(ModernTheme.Colors.primary)
                }
            } else {
                // Polygon points info
                HStack {
                    Image(systemName: "pentagon.fill")
                        .foregroundColor(ModernTheme.Colors.info)
                    Text("\(polygonPoints.count) points defined")
                        .font(ModernTheme.Typography.body)
                    Spacer()
                    if polygonPoints.count >= 3 {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(ModernTheme.Colors.success)
                    }
                }
            }

            // Coordinates display
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                Text("Center Coordinates")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                Text(String(format: "%.6f, %.6f", centerCoordinate.latitude, centerCoordinate.longitude))
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .fontWeight(.medium)
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Alert Config Section
    private var AlertConfigSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Alert Configuration")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Toggle("Alert on Entry", isOn: $alertOnEntry)
            Toggle("Alert on Exit", isOn: $alertOnExit)
            Toggle("Alert on Dwell", isOn: $alertOnDwell)

            if alertOnDwell {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    HStack {
                        Text("Dwell Time")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                        Spacer()
                        Text("\(dwellTimeMinutes) minutes")
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primary)
                    }

                    Slider(value: Binding(
                        get: { Double(dwellTimeMinutes) },
                        set: { dwellTimeMinutes = Int($0) }
                    ), in: 5...120, step: 5) {
                        Text("Dwell Time")
                    }
                    .tint(ModernTheme.Colors.primary)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Save Button
    private var SaveButton: some View {
        Button {
            ModernTheme.Haptics.medium()
            saveGeofence()
        } label: {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                Text(existingGeofence == nil ? "Create Geofence" : "Update Geofence")
            }
            .font(ModernTheme.Typography.bodyBold)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(ModernTheme.Colors.primary)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .disabled(!isValid)
        .opacity(isValid ? 1.0 : 0.5)
    }

    // MARK: - Helper Methods
    private var isValid: Bool {
        !name.isEmpty && (shapeType == .circle || polygonPoints.count >= 3)
    }

    private func formatRadius(_ meters: Double) -> String {
        if meters >= 1000 {
            return String(format: "%.1f km", meters / 1000)
        } else {
            return String(format: "%.0f m", meters)
        }
    }

    private func saveGeofence() {
        guard isValid else {
            validationMessage = shapeType == .polygon && polygonPoints.count < 3 ?
                "Polygon must have at least 3 points" :
                "Please enter a name"
            showingValidationError = true
            return
        }

        let shape: GeofenceShape
        if shapeType == .circle {
            shape = .circle(GeofenceCircle(center: centerCoordinate, radius: radius))
        } else {
            shape = .polygon(GeofencePolygon(
                coordinates: polygonPoints.map { Coordinate(latitude: $0.latitude, longitude: $0.longitude) }
            ))
        }

        let geofence = Geofence(
            id: existingGeofence?.id ?? UUID().uuidString,
            name: name,
            description: description.isEmpty ? nil : description,
            type: selectedType,
            shape: shape,
            isActive: existingGeofence?.isActive ?? true,
            createdDate: existingGeofence?.createdDate ?? Date(),
            createdBy: existingGeofence?.createdBy ?? "Current User",
            lastModifiedDate: existingGeofence == nil ? nil : Date(),
            lastModifiedBy: existingGeofence == nil ? nil : "Current User",
            assignedVehicles: existingGeofence?.assignedVehicles ?? [],
            assignedDrivers: existingGeofence?.assignedDrivers ?? [],
            notifications: GeofenceNotifications(
                onEntry: alertOnEntry,
                onExit: alertOnExit,
                onDwell: alertOnDwell,
                dwellTimeMinutes: alertOnDwell ? dwellTimeMinutes : nil
            ),
            schedule: existingGeofence?.schedule,
            tags: existingGeofence?.tags ?? []
        )

        Task {
            if existingGeofence != nil {
                await viewModel.updateGeofence(geofence)
            } else {
                await viewModel.createGeofence(geofence)
            }
            dismiss()
        }
    }
}

// MARK: - Interactive Map View
struct InteractiveMapView: View {
    @Binding var region: MKCoordinateRegion
    @Binding var centerCoordinate: CLLocationCoordinate2D
    @Binding var radius: Double
    let shapeType: AddGeofenceView.ShapeType
    @Binding var polygonPoints: [CLLocationCoordinate2D]

    var body: some View {
        Map(coordinateRegion: $region, interactionModes: .all, annotationItems: [MapMarker(coordinate: centerCoordinate)]) { marker in
            MapAnnotation(coordinate: marker.coordinate) {
                ZStack {
                    // Circle preview
                    if shapeType == .circle {
                        Circle()
                            .stroke(ModernTheme.Colors.primary, lineWidth: 2)
                            .background(Circle().fill(ModernTheme.Colors.primary.opacity(0.2)))
                            .frame(width: 40, height: 40)
                    }

                    // Center marker
                    Image(systemName: "mappin.circle.fill")
                        .font(.title)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
        }
        .onChange(of: region.center) { newCenter in
            centerCoordinate = newCenter
        }
    }
}

struct MapMarker: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
}

// MARK: - Type Chip
struct TypeChip: View {
    let type: GeofenceType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: ModernTheme.Spacing.xs) {
                Image(systemName: type.icon)
                    .font(ModernTheme.Typography.caption1)
                Text(type.rawValue)
                    .font(ModernTheme.Typography.caption1)
            }
            .padding(.horizontal, ModernTheme.Spacing.md)
            .padding(.vertical, ModernTheme.Spacing.sm)
            .background(isSelected ? type.color : type.color.opacity(0.2))
            .foregroundColor(isSelected ? .white : type.color)
            .cornerRadius(ModernTheme.CornerRadius.sm)
        }
    }
}

// MARK: - Preview
#if DEBUG
struct AddGeofenceView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            AddGeofenceView(viewModel: GeofenceViewModel())
        }
    }
}
#endif
