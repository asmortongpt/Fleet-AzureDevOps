import SwiftUI
import MapKit
import CoreLocation

struct AddRouteView: View {
    @ObservedObject var viewModel: RouteViewModel
    @Environment(\.presentationMode) var presentationMode

    // Form fields
    @State private var routeName = ""
    @State private var routeDescription = ""
    @State private var waypoints: [WaypointInput] = []
    @State private var trafficEnabled = true
    @State private var tags: [String] = []
    @State private var notes = ""
    @State private var tagInput = ""

    // Map state
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var selectedWaypointIndex: Int?
    @State private var showingAddWaypoint = false
    @State private var showingSearchLocation = false

    // Location search
    @State private var searchText = ""
    @State private var searchResults: [MKMapItem] = []
    @FocusState private var isSearchFocused: Bool

    var isFormValid: Bool {
        !routeName.isEmpty && waypoints.count >= 2
    }

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        // Basic Information Section
                        basicInfoSection

                        // Interactive Map
                        mapSection

                        // Waypoints List
                        waypointsSection

                        // Settings Section
                        settingsSection

                        // Tags Section
                        tagsSection

                        // Notes Section
                        notesSection
                    }
                    .padding(.vertical)
                }
                .background(ModernTheme.Colors.groupedBackground)
            }
            .navigationTitle("Create Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveRoute()
                    }
                    .disabled(!isFormValid)
                    .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingAddWaypoint) {
                AddWaypointSheet(
                    waypoints: $waypoints,
                    mapRegion: mapRegion,
                    isPresented: $showingAddWaypoint
                )
            }
        }
    }

    // MARK: - Basic Info Section
    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Route Information")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            VStack(spacing: ModernTheme.Spacing.md) {
                TextField("Route Name *", text: $routeName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(ModernTheme.Typography.body)

                TextField("Description (optional)", text: $routeDescription)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(ModernTheme.Typography.body)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Map Section
    private var mapSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Route Map")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                if waypoints.count >= 2 {
                    Text("\(calculateDistance()) • \(calculateDuration())")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            ZStack(alignment: .bottom) {
                Map(coordinateRegion: $mapRegion, annotationItems: waypoints.indices.map { $0 }) { index in
                    MapAnnotation(coordinate: waypoints[index].location.clCoordinate) {
                        WaypointMapMarker(
                            order: waypoints[index].order,
                            type: waypoints[index].type,
                            isSelected: selectedWaypointIndex == index
                        )
                        .onTapGesture {
                            selectedWaypointIndex = index
                            ModernTheme.Haptics.light()
                        }
                    }
                }
                .frame(height: 300)
                .cornerRadius(ModernTheme.CornerRadius.md)

                // Add Waypoint Button
                Button(action: {
                    showingAddWaypoint = true
                    ModernTheme.Haptics.medium()
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Waypoint")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(ModernTheme.Colors.primary)
                    )
                    .shadow(radius: 4)
                }
                .padding(.bottom, ModernTheme.Spacing.md)
            }

            Text("Tap map markers to select, or use the button to add waypoints")
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
                .padding(.horizontal, ModernTheme.Spacing.xs)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Waypoints Section
    private var waypointsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Waypoints")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                Text("\(waypoints.count) stops")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            if waypoints.isEmpty {
                VStack(spacing: ModernTheme.Spacing.md) {
                    Image(systemName: "map")
                        .font(.system(size: 40))
                        .foregroundColor(ModernTheme.Colors.tertiaryText)

                    Text("No waypoints added yet")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    Text("Add at least 2 waypoints to create a route")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.xl)
            } else {
                ForEach(waypoints.indices, id: \.self) { index in
                    EditableWaypointRow(
                        waypoint: $waypoints[index],
                        isSelected: selectedWaypointIndex == index,
                        onTap: {
                            selectedWaypointIndex = index
                            centerMapOnWaypoint(waypoints[index])
                            ModernTheme.Haptics.selection()
                        },
                        onDelete: {
                            deleteWaypoint(at: index)
                        },
                        onMoveUp: index > 0 ? {
                            moveWaypoint(from: index, to: index - 1)
                        } : nil,
                        onMoveDown: index < waypoints.count - 1 ? {
                            moveWaypoint(from: index, to: index + 1)
                        } : nil
                    )
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Settings Section
    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Settings")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Toggle(isOn: $trafficEnabled) {
                HStack {
                    Image(systemName: "car.2.fill")
                        .foregroundColor(ModernTheme.Colors.primary)
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Traffic Updates")
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.primaryText)
                        Text("Get real-time traffic conditions")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .tint(ModernTheme.Colors.primary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Tags Section
    private var tagsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Tags")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            HStack {
                TextField("Add tag", text: $tagInput)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(ModernTheme.Typography.body)
                    .onSubmit {
                        addTag()
                    }

                Button(action: addTag) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }

            if !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(tags, id: \.self) { tag in
                            TagChip(tag: tag) {
                                removeTag(tag)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Notes Section
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Notes")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            TextEditor(text: $notes)
                .frame(height: 100)
                .padding(ModernTheme.Spacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                        .stroke(ModernTheme.Colors.separator, lineWidth: 1)
                )
                .font(ModernTheme.Typography.body)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .padding(.horizontal)
    }

    // MARK: - Helper Functions
    private func saveRoute() {
        Task {
            await viewModel.createRoute(
                name: routeName,
                description: routeDescription.isEmpty ? nil : routeDescription,
                waypoints: waypoints,
                trafficEnabled: trafficEnabled,
                tags: tags,
                notes: notes.isEmpty ? nil : notes
            )
            presentationMode.wrappedValue.dismiss()
        }
    }

    private func addTag() {
        guard !tagInput.isEmpty else { return }
        let trimmed = tagInput.trimmingCharacters(in: .whitespaces)
        if !tags.contains(trimmed) {
            tags.append(trimmed)
            ModernTheme.Haptics.light()
        }
        tagInput = ""
    }

    private func removeTag(_ tag: String) {
        tags.removeAll { $0 == tag }
        ModernTheme.Haptics.light()
    }

    private func deleteWaypoint(at index: Int) {
        waypoints.remove(at: index)
        // Reorder remaining waypoints
        for i in 0..<waypoints.count {
            waypoints[i].order = i
        }
        selectedWaypointIndex = nil
        ModernTheme.Haptics.medium()
    }

    private func moveWaypoint(from: Int, to: Int) {
        let waypoint = waypoints.remove(at: from)
        waypoints.insert(waypoint, at: to)
        // Reorder all waypoints
        for i in 0..<waypoints.count {
            waypoints[i].order = i
        }
        selectedWaypointIndex = to
        ModernTheme.Haptics.light()
    }

    private func centerMapOnWaypoint(_ waypoint: WaypointInput) {
        withAnimation {
            mapRegion.center = waypoint.location.clCoordinate
        }
    }

    private func calculateDistance() -> String {
        guard waypoints.count >= 2 else { return "0 km" }

        var totalDistance: Double = 0
        for i in 0..<(waypoints.count - 1) {
            let start = CLLocation(
                latitude: waypoints[i].location.latitude,
                longitude: waypoints[i].location.longitude
            )
            let end = CLLocation(
                latitude: waypoints[i + 1].location.latitude,
                longitude: waypoints[i + 1].location.longitude
            )
            totalDistance += start.distance(from: end)
        }

        if totalDistance >= 1000 {
            return String(format: "%.1f km", totalDistance / 1000)
        } else {
            return String(format: "%.0f m", totalDistance)
        }
    }

    private func calculateDuration() -> String {
        guard waypoints.count >= 2 else { return "0 min" }

        var totalDistance: Double = 0
        for i in 0..<(waypoints.count - 1) {
            let start = CLLocation(
                latitude: waypoints[i].location.latitude,
                longitude: waypoints[i].location.longitude
            )
            let end = CLLocation(
                latitude: waypoints[i + 1].location.latitude,
                longitude: waypoints[i + 1].location.longitude
            )
            totalDistance += start.distance(from: end)
        }

        let averageSpeedMPS = 60.0 * 1000.0 / 3600.0 // 60 km/h = 16.67 m/s
        let duration = totalDistance / averageSpeedMPS
        let minutes = Int(duration / 60)

        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }
}

// MARK: - Waypoint Map Marker
struct WaypointMapMarker: View {
    let order: Int
    let type: WaypointType
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: type.icon)
                .font(.title3)
                .foregroundColor(.white)
                .padding(8)
                .background(
                    Circle()
                        .fill(type.color)
                        .overlay(
                            Circle()
                                .stroke(isSelected ? Color.white : Color.clear, lineWidth: 3)
                        )
                )
                .shadow(radius: 3)

            Text("\(order + 1)")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(4)
                .background(Circle().fill(Color.black.opacity(0.7)))
        }
    }
}

// MARK: - Editable Waypoint Row
struct EditableWaypointRow: View {
    @Binding var waypoint: WaypointInput
    let isSelected: Bool
    let onTap: () -> Void
    let onDelete: () -> Void
    let onMoveUp: (() -> Void)?
    let onMoveDown: (() -> Void)?

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Order controls
            VStack(spacing: 4) {
                if let moveUp = onMoveUp {
                    Button(action: moveUp) {
                        Image(systemName: "chevron.up.circle.fill")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }

                Text("\(waypoint.order + 1)")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(.white)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(waypoint.type.color))

                if let moveDown = onMoveDown {
                    Button(action: moveDown) {
                        Image(systemName: "chevron.down.circle.fill")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
            }

            // Icon and details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: waypoint.type.icon)
                        .foregroundColor(waypoint.type.color)

                    Text(waypoint.name)
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }

                if let address = waypoint.address {
                    Text(address)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .lineLimit(1)
                }
            }

            Spacer()

            // Delete button
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.secondaryBackground)
        )
        .overlay(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .stroke(isSelected ? ModernTheme.Colors.primary : Color.clear, lineWidth: 2)
        )
        .onTapGesture(perform: onTap)
    }
}

// MARK: - Tag Chip
struct TagChip: View {
    let tag: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(tag)
                .font(ModernTheme.Typography.caption1)

            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .foregroundColor(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(ModernTheme.Colors.primary)
        )
    }
}

// MARK: - Add Waypoint Sheet
struct AddWaypointSheet: View {
    @Binding var waypoints: [WaypointInput]
    let mapRegion: MKCoordinateRegion
    @Binding var isPresented: Bool

    @State private var waypointName = ""
    @State private var waypointAddress = ""
    @State private var waypointType: WaypointType = .stop
    @State private var waypointNotes = ""
    @State private var selectedCoordinate: CLLocationCoordinate2D?

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Location")) {
                    TextField("Name *", text: $waypointName)
                    TextField("Address", text: $waypointAddress)

                    // Simple coordinate selection
                    Button("Use Current Map Center") {
                        selectedCoordinate = mapRegion.center
                        ModernTheme.Haptics.light()
                    }

                    if let coord = selectedCoordinate {
                        Text("Lat: \(coord.latitude, specifier: "%.4f"), Lon: \(coord.longitude, specifier: "%.4f")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section(header: Text("Type")) {
                    Picker("Waypoint Type", selection: $waypointType) {
                        ForEach(WaypointType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type)
                        }
                    }
                }

                Section(header: Text("Notes (Optional)")) {
                    TextEditor(text: $waypointNotes)
                        .frame(height: 80)
                }
            }
            .navigationTitle("Add Waypoint")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addWaypoint()
                    }
                    .disabled(waypointName.isEmpty || selectedCoordinate == nil)
                }
            }
        }
    }

    private func addWaypoint() {
        guard let coordinate = selectedCoordinate else { return }

        let newWaypoint = WaypointInput(
            order: waypoints.count,
            location: Coordinate(latitude: coordinate.latitude, longitude: coordinate.longitude),
            name: waypointName,
            address: waypointAddress.isEmpty ? nil : waypointAddress,
            type: determineWaypointType(),
            notes: waypointNotes.isEmpty ? nil : waypointNotes
        )

        waypoints.append(newWaypoint)
        ModernTheme.Haptics.success()
        isPresented = false
    }

    private func determineWaypointType() -> WaypointType {
        if waypoints.isEmpty {
            return .origin
        } else {
            return waypointType
        }
    }
}

#Preview {
    AddRouteView(viewModel: RouteViewModel())
}
