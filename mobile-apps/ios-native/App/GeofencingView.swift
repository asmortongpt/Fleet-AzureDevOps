import SwiftUI
import MapKit

struct GeofencingView: View {
    @StateObject private var viewModel = GeofenceViewModel()
    @State private var selectedTab: GeofenceTab = .map
    @State private var showingFilters = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    ForEach(GeofenceTab.allCases, id: \.self) { tab in
                        Label(tab.rawValue, systemImage: tab.icon)
                            .tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                TabView(selection: $selectedTab) {
                    mapView
                        .tag(GeofenceTab.map)

                    geofencesListView
                        .tag(GeofenceTab.geofences)

                    violationsView
                        .tag(GeofenceTab.violations)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Geofencing")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            viewModel.showingCreateGeofence = true
                        } label: {
                            Label("Create Geofence", systemImage: "plus.circle")
                        }

                        Button {
                            showingFilters = true
                        } label: {
                            Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button {
                            viewModel.requestLocationPermissions()
                        } label: {
                            Label("Location Permissions", systemImage: "location.fill")
                        }

                        Button {
                            Task {
                                await viewModel.refresh()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingCreateGeofence) {
                CreateGeofenceView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                GeofenceFiltersView(viewModel: viewModel)
            }
            .sheet(item: $viewModel.selectedGeofence) { geofence in
                GeofenceDetailView(geofence: geofence, viewModel: viewModel)
            }
            .sheet(item: $viewModel.selectedViolation) { violation in
                ViolationDetailView(violation: violation, viewModel: viewModel)
            }
        }
    }

    // MARK: - Map View
    private var mapView: View {
        ZStack(alignment: .topTrailing) {
            Map(position: .constant(.region(viewModel.mapRegion))) {
                // Geofence overlays
                ForEach(viewModel.filteredGeofences) { geofence in
                    switch geofence.shape {
                    case .circle(let circle):
                        MapCircle(center: circle.coordinate, radius: circle.radius)
                            .foregroundStyle(geofence.color.opacity(0.2))
                            .stroke(geofence.color, lineWidth: 2)

                        Annotation(geofence.name, coordinate: circle.coordinate) {
                            ZStack {
                                Circle()
                                    .fill(geofence.color)
                                    .frame(width: 30, height: 30)

                                Image(systemName: geofence.icon)
                                    .foregroundColor(.white)
                                    .font(.caption)
                            }
                            .onTapGesture {
                                viewModel.selectedGeofence = geofence
                            }
                        }

                    case .polygon(let polygon):
                        MapPolygon(coordinates: polygon.clCoordinates)
                            .foregroundStyle(geofence.color.opacity(0.2))
                            .stroke(geofence.color, lineWidth: 2)
                    }
                }

                // Violation markers
                ForEach(viewModel.unacknowledgedViolations.prefix(10)) { violation in
                    Annotation("", coordinate: violation.location.clCoordinate) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(ModernTheme.Colors.error)
                            .font(.title2)
                            .onTapGesture {
                                viewModel.selectedViolation = violation
                            }
                    }
                }
            }
            .mapStyle(.standard)

            // Map Controls
            VStack(spacing: ModernTheme.Spacing.sm) {
                if !viewModel.unacknowledgedViolations.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(viewModel.unacknowledgedViolations.count)")
                            .font(ModernTheme.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(ModernTheme.Colors.error)

                        Text("Violations")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                    .padding()
                    .background(ModernTheme.Colors.background)
                    .cornerRadius(ModernTheme.CornerRadius.md)
                    .shadow(radius: 4)
                }
            }
            .padding()
        }
    }

    // MARK: - Geofences List
    private var geofencesListView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.md) {
                // Statistics
                if let stats = viewModel.statistics {
                    HStack(spacing: ModernTheme.Spacing.md) {
                        StatsCard(title: "Total", value: "\(stats.totalGeofences)", color: ModernTheme.Colors.primary)
                        StatsCard(title: "Active", value: "\(stats.activeGeofences)", color: ModernTheme.Colors.success)
                    }
                }

                // Geofences by type
                ForEach(GeofenceType.allCases, id: \.self) { type in
                    if let geofences = viewModel.geofencesByType[type], !geofences.isEmpty {
                        Section {
                            ForEach(geofences) { geofence in
                                GeofenceCard(geofence: geofence, viewModel: viewModel)
                            }
                        } header: {
                            HStack {
                                Label(type.rawValue, systemImage: type.icon)
                                    .font(ModernTheme.Typography.headline)
                                    .foregroundColor(type.color)
                                Spacer()
                                Text("\(geofences.count)")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            }
                            .padding(.vertical, ModernTheme.Spacing.xs)
                        }
                    }
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Violations View
    private var violationsView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.md) {
                // Statistics
                if let stats = viewModel.statistics {
                    HStack(spacing: ModernTheme.Spacing.md) {
                        StatsCard(title: "Total", value: "\(stats.totalViolations)", color: ModernTheme.Colors.error)
                        StatsCard(title: "Pending", value: "\(stats.unacknowledgedViolations)", color: ModernTheme.Colors.warning)
                    }
                }

                // Unacknowledged violations
                if !viewModel.unacknowledgedViolations.isEmpty {
                    Section {
                        ForEach(viewModel.unacknowledgedViolations) { violation in
                            ViolationCard(violation: violation)
                                .onTapGesture {
                                    viewModel.selectedViolation = violation
                                }
                        }
                    } header: {
                        Label("Pending Acknowledgment", systemImage: "exclamationmark.triangle.fill")
                            .font(ModernTheme.Typography.headline)
                            .foregroundColor(ModernTheme.Colors.error)
                    }
                }

                // All violations
                Section {
                    ForEach(viewModel.violations) { violation in
                        ViolationCard(violation: violation)
                            .onTapGesture {
                                viewModel.selectedViolation = violation
                            }
                            .contextMenu {
                                Button(role: .destructive) {
                                    Task {
                                        await viewModel.deleteViolation(violation)
                                    }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                    }
                } header: {
                    Label("Violation History", systemImage: "clock.fill")
                        .font(ModernTheme.Typography.headline)
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
}

// MARK: - Supporting Views
struct StatsCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(ModernTheme.Typography.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

struct GeofenceCard: View {
    let geofence: Geofence
    @ObservedObject var viewModel: GeofenceViewModel

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Icon
            ZStack {
                Circle()
                    .fill(geofence.color.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: geofence.icon)
                    .foregroundColor(geofence.color)
                    .font(.title3)
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(geofence.name)
                    .font(ModernTheme.Typography.bodyBold)

                HStack(spacing: ModernTheme.Spacing.xs) {
                    Label(geofence.type.rawValue, systemImage: "tag.fill")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if case .circle(let circle) = geofence.shape {
                        Label(circle.formattedRadius, systemImage: "circle")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Label("\(geofence.assignedVehicles.count) vehicles", systemImage: "car.fill")
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }

            Spacer()

            // Status
            VStack(alignment: .trailing, spacing: 4) {
                Circle()
                    .fill(geofence.statusColor)
                    .frame(width: 12, height: 12)

                Text(geofence.isActive ? "Active" : "Inactive")
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                Button {
                    viewModel.centerMapOn(geofence: geofence)
                } label: {
                    Image(systemName: "location.circle")
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        .onTapGesture {
            viewModel.selectedGeofence = geofence
        }
    }
}

struct ViolationCard: View {
    let violation: GeofenceViolation

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: violation.violationType.icon)
                .font(.title2)
                .foregroundColor(violation.statusColor)

            VStack(alignment: .leading, spacing: 4) {
                Text(violation.geofenceName)
                    .font(ModernTheme.Typography.bodyBold)

                HStack(spacing: ModernTheme.Spacing.xs) {
                    Label(violation.vehicleNumber, systemImage: "car.fill")
                        .font(ModernTheme.Typography.caption1)

                    if let driver = violation.driverName {
                        Label(driver, systemImage: "person.fill")
                            .font(ModernTheme.Typography.caption1)
                    }
                }
                .foregroundColor(ModernTheme.Colors.secondaryText)

                Text(violation.formattedTimestamp)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(violation.violationType.rawValue)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(violation.statusColor)

                if violation.acknowledged {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.success)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(violation.acknowledged ? ModernTheme.Colors.background : ModernTheme.Colors.error.opacity(0.1))
        )
    }
}

// MARK: - Create Geofence View
struct CreateGeofenceView: View {
    @ObservedObject var viewModel: GeofenceViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var description = ""
    @State private var selectedType: GeofenceType = .serviceArea
    @State private var radius = 1000.0
    @State private var latitude = ""
    @State private var longitude = ""
    @State private var notifyOnEntry = true
    @State private var notifyOnExit = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Geofence Details") {
                    TextField("Name", text: $name)
                    TextField("Description", text: $description)

                    Picker("Type", selection: $selectedType) {
                        ForEach(GeofenceType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                }

                Section("Location") {
                    TextField("Latitude", text: $latitude)
                        .keyboardType(.decimalPad)

                    TextField("Longitude", text: $longitude)
                        .keyboardType(.decimalPad)

                    HStack {
                        Text("Radius")
                        Spacer()
                        Text("\(Int(radius))m")
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    Slider(value: $radius, in: 100...5000, step: 100)
                }

                Section("Notifications") {
                    Toggle("Notify on Entry", isOn: $notifyOnEntry)
                    Toggle("Notify on Exit", isOn: $notifyOnExit)
                }
            }
            .navigationTitle("Create Geofence")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createGeofence()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }

    private var isValid: Bool {
        !name.isEmpty && !latitude.isEmpty && !longitude.isEmpty
    }

    private func createGeofence() {
        guard let lat = Double(latitude), let lon = Double(longitude) else { return }

        let geofence = Geofence(
            id: UUID().uuidString,
            name: name,
            description: description.isEmpty ? nil : description,
            type: selectedType,
            shape: .circle(GeofenceCircle(
                center: CLLocationCoordinate2D(latitude: lat, longitude: lon),
                radius: radius
            )),
            isActive: true,
            createdDate: Date(),
            createdBy: "Current User",
            assignedVehicles: [],
            assignedDrivers: [],
            notifications: GeofenceNotifications(
                onEntry: notifyOnEntry,
                onExit: notifyOnExit,
                onDwell: false,
                dwellTimeMinutes: nil
            ),
            schedule: nil,
            tags: []
        )

        Task {
            await viewModel.createGeofence(geofence)
            dismiss()
        }
    }
}

// MARK: - Detail Views
struct GeofenceDetailView: View {
    let geofence: Geofence
    @ObservedObject var viewModel: GeofenceViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    // Map preview
                    if case .circle(let circle) = geofence.shape {
                        Map(position: .constant(.region(MKCoordinateRegion(
                            center: circle.coordinate,
                            latitudinalMeters: circle.radius * 4,
                            longitudinalMeters: circle.radius * 4
                        )))) {
                            MapCircle(center: circle.coordinate, radius: circle.radius)
                                .foregroundStyle(geofence.color.opacity(0.2))
                                .stroke(geofence.color, lineWidth: 2)

                            Marker(geofence.name, coordinate: circle.coordinate)
                                .tint(geofence.color)
                        }
                        .frame(height: 200)
                        .cornerRadius(ModernTheme.CornerRadius.md)
                    }

                    // Details
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        DetailRow(label: "Name", value: geofence.name)
                        DetailRow(label: "Type", value: geofence.type.rawValue)
                        DetailRow(label: "Status", value: geofence.isActive ? "Active" : "Inactive", valueColor: geofence.statusColor)

                        if case .circle(let circle) = geofence.shape {
                            DetailRow(label: "Radius", value: circle.formattedRadius)
                        }

                        DetailRow(label: "Assigned Vehicles", value: "\(geofence.assignedVehicles.count)")
                        DetailRow(label: "Notify on Entry", value: geofence.notifications.onEntry ? "Yes" : "No")
                        DetailRow(label: "Notify on Exit", value: geofence.notifications.onExit ? "Yes" : "No")

                        if let description = geofence.description {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Description")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)

                                Text(description)
                                    .font(ModernTheme.Typography.body)
                            }
                        }
                    }
                    .modernCard()
                }
                .padding()
            }
            .navigationTitle("Geofence Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct ViolationDetailView: View {
    let violation: GeofenceViolation
    @ObservedObject var viewModel: GeofenceViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        DetailRow(label: "Geofence", value: violation.geofenceName)
                        DetailRow(label: "Type", value: violation.violationType.rawValue, valueColor: ModernTheme.Colors.error)
                        DetailRow(label: "Vehicle", value: violation.vehicleNumber)
                        if let driver = violation.driverName {
                            DetailRow(label: "Driver", value: driver)
                        }
                        DetailRow(label: "Time", value: violation.formattedTimestamp)

                        if let duration = violation.formattedDuration {
                            DetailRow(label: "Duration", value: duration)
                        }

                        if violation.acknowledged {
                            Divider()
                            DetailRow(label: "Acknowledged By", value: violation.acknowledgedBy ?? "Unknown")
                            if let ackDate = violation.acknowledgedDate {
                                let formatter = DateFormatter()
                                formatter.dateStyle = .medium
                                formatter.timeStyle = .short
                                DetailRow(label: "Acknowledged Date", value: formatter.string(from: ackDate))
                            }
                        }
                    }
                    .modernCard()

                    if !violation.acknowledged {
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                            Text("Acknowledgment Notes")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            TextEditor(text: $notes)
                                .frame(minHeight: 100)
                                .padding(ModernTheme.Spacing.sm)
                                .background(ModernTheme.Colors.secondaryBackground)
                                .cornerRadius(ModernTheme.CornerRadius.sm)

                            Button {
                                Task {
                                    await viewModel.acknowledgeViolation(violation, notes: notes.isEmpty ? nil : notes)
                                    dismiss()
                                }
                            } label: {
                                Text("Acknowledge Violation")
                            }
                            .primaryButton()
                        }
                        .modernCard()
                    }
                }
                .padding()
            }
            .navigationTitle("Violation Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Filters View
struct GeofenceFiltersView: View {
    @ObservedObject var viewModel: GeofenceViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Show") {
                    Toggle("Active Only", isOn: $viewModel.showActiveOnly)
                }

                Section("Filter by Type") {
                    Picker("Type", selection: $viewModel.filterByType) {
                        Text("All").tag(nil as GeofenceType?)
                        ForEach(GeofenceType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type as GeofenceType?)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Tab Enum
enum GeofenceTab: String, CaseIterable {
    case map = "Map"
    case geofences = "Geofences"
    case violations = "Violations"

    var icon: String {
        switch self {
        case .map: return "map.fill"
        case .geofences: return "mappin.circle.fill"
        case .violations: return "exclamationmark.triangle.fill"
        }
    }
}

#Preview {
    GeofencingView()
}
