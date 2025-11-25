//
//  GeofenceDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Detailed geofence view with map, info, vehicles, and event history
//  Follows ModernTheme design patterns and accessibility standards
//

import SwiftUI
import MapKit

// MARK: - Geofence Detail View
struct GeofenceDetailView: View {
    let geofenceId: String
    @StateObject private var viewModel = GeofenceViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @Environment(\.dismiss) private var dismiss

    @State private var geofence: Geofence?
    @State private var showingEditGeofence = false
    @State private var selectedSection: DetailSection = .overview
    @State private var region: MKCoordinateRegion?

    enum DetailSection: String, CaseIterable {
        case overview = "Overview"
        case vehicles = "Vehicles"
        case events = "Events"
        case alerts = "Alerts"
    }

    var body: some View {
        ScrollView {
            if let geofence = geofence {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Map Header
                    GeofenceMapView(geofence: geofence, region: $region)
                        .frame(height: 250)
                        .cornerRadius(ModernTheme.CornerRadius.md)
                        .padding(.horizontal)

                    // Quick Info Card
                    QuickInfoCard(geofence: geofence)
                        .padding(.horizontal)

                    // Quick Actions
                    QuickActionsView(geofence: geofence, viewModel: viewModel)
                        .padding(.horizontal)

                    // Section Picker
                    SectionPicker(selectedSection: $selectedSection)
                        .padding(.horizontal)

                    // Content Sections
                    switch selectedSection {
                    case .overview:
                        OverviewSection(geofence: geofence)
                    case .vehicles:
                        VehiclesSection(geofence: geofence)
                    case .events:
                        EventsSection(geofenceId: geofenceId)
                    case .alerts:
                        AlertsSection(geofence: geofence)
                    }
                }
                .padding(.bottom, ModernTheme.Spacing.xxl)
            } else if viewModel.isLoading {
                LoadingSpinnerView(message: "Loading geofence...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .frame(minHeight: 400)
            } else {
                ErrorStateView(message: "Geofence not found")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .frame(minHeight: 400)
            }
        }
        .navigationTitle("Geofence Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        showingEditGeofence = true
                    } label: {
                        Label("Edit Geofence", systemImage: "pencil")
                    }

                    Button {
                        if let geofence = geofence {
                            Task {
                                await viewModel.toggleGeofenceActive(geofence)
                                self.geofence?.isActive.toggle()
                            }
                        }
                    } label: {
                        Label(
                            geofence?.isActive == true ? "Deactivate" : "Activate",
                            systemImage: geofence?.isActive == true ? "pause.fill" : "play.fill"
                        )
                    }

                    Divider()

                    Button(role: .destructive) {
                        if let geofence = geofence {
                            Task {
                                await viewModel.deleteGeofence(geofence)
                                dismiss()
                            }
                        }
                    } label: {
                        Label("Delete", systemImage: "trash.fill")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingEditGeofence) {
            NavigationView {
                if let geofence = geofence {
                    AddGeofenceView(viewModel: viewModel, existingGeofence: geofence)
                }
            }
        }
        .task {
            await loadGeofence()
        }
    }

    // MARK: - Helper Methods
    private func loadGeofence() async {
        let allGeofences = viewModel.geofences
        if allGeofences.isEmpty {
            await viewModel.loadGeofences()
        }
        geofence = viewModel.geofences.first { $0.id == geofenceId }
        if let geofence = geofence {
            setupMapRegion(for: geofence)
        }
    }

    private func setupMapRegion(for geofence: Geofence) {
        switch geofence.shape {
        case .circle(let circle):
            region = MKCoordinateRegion(
                center: circle.coordinate,
                latitudinalMeters: circle.radius * 4,
                longitudinalMeters: circle.radius * 4
            )
        case .polygon(let polygon):
            if let firstCoord = polygon.coordinates.first {
                region = MKCoordinateRegion(
                    center: firstCoord.clCoordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                )
            }
        }
    }
}

// MARK: - Geofence Map View
struct GeofenceMapView: View {
    let geofence: Geofence
    @Binding var region: MKCoordinateRegion?

    var body: some View {
        ZStack {
            if let region = region {
                Map(coordinateRegion: .constant(region), annotationItems: [geofence]) { fence in
                    MapAnnotation(coordinate: getCenter(for: fence)) {
                        ZStack {
                            Circle()
                                .fill(fence.color.opacity(0.3))
                                .frame(width: 40, height: 40)

                            Image(systemName: fence.icon)
                                .font(.title3)
                                .foregroundColor(fence.color)
                        }
                    }
                }
                .disabled(true)
            } else {
                ProgressView()
            }
        }
    }

    private func getCenter(for geofence: Geofence) -> CLLocationCoordinate2D {
        switch geofence.shape {
        case .circle(let circle):
            return circle.coordinate
        case .polygon(let polygon):
            return polygon.coordinates.first?.clCoordinate ?? CLLocationCoordinate2D()
        }
    }
}

// MARK: - Quick Info Card
struct QuickInfoCard: View {
    let geofence: Geofence

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text(geofence.name)
                        .font(ModernTheme.Typography.title2)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(geofence.type.rawValue)
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                GeofenceStatusBadge(isActive: geofence.isActive)
            }

            if let description = geofence.description {
                Text(description)
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Divider()

            HStack(spacing: ModernTheme.Spacing.lg) {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Shape")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text(geofence.shape.displayName)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }

                Divider()
                    .frame(height: 30)

                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Size")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    switch geofence.shape {
                    case .circle(let circle):
                        Text(circle.formattedRadius)
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)
                    case .polygon(let polygon):
                        Text("\(polygon.coordinates.count) points")
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)
                    }
                }

                Divider()
                    .frame(height: 30)

                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Created")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text(geofence.createdDate.formatted(date: .abbreviated, time: .omitted))
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Quick Actions View
struct QuickActionsView: View {
    let geofence: Geofence
    let viewModel: GeofenceViewModel

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            QuickActionButton(
                icon: geofence.isActive ? "pause.fill" : "play.fill",
                label: geofence.isActive ? "Deactivate" : "Activate",
                color: geofence.isActive ? ModernTheme.Colors.warning : ModernTheme.Colors.success
            ) {
                Task {
                    await viewModel.toggleGeofenceActive(geofence)
                }
            }

            QuickActionButton(
                icon: "map.fill",
                label: "View Map",
                color: ModernTheme.Colors.primary
            ) {
                viewModel.centerMapOn(geofence: geofence)
            }

            QuickActionButton(
                icon: "car.2.fill",
                label: "Vehicles",
                color: ModernTheme.Colors.info
            ) {
                // View vehicles action
            }

            QuickActionButton(
                icon: "clock.arrow.circlepath",
                label: "Events",
                color: ModernTheme.Colors.secondary
            ) {
                // View events action
            }
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: {
            ModernTheme.Haptics.light()
            action()
        }) {
            VStack(spacing: ModernTheme.Spacing.xs) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)

                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, ModernTheme.Spacing.md)
            .background(color.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
    }
}

// MARK: - Section Picker
struct SectionPicker: View {
    @Binding var selectedSection: GeofenceDetailView.DetailSection

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(GeofenceDetailView.DetailSection.allCases, id: \.self) { section in
                    Button(action: {
                        ModernTheme.Haptics.selection()
                        withAnimation {
                            selectedSection = section
                        }
                    }) {
                        Text(section.rawValue)
                            .font(ModernTheme.Typography.subheadline)
                            .foregroundColor(selectedSection == section ?
                                           .white : ModernTheme.Colors.primaryText)
                            .padding(.horizontal, ModernTheme.Spacing.lg)
                            .padding(.vertical, ModernTheme.Spacing.sm)
                            .background(selectedSection == section ?
                                      ModernTheme.Colors.primary : Color.clear)
                            .cornerRadius(ModernTheme.CornerRadius.md)
                    }
                }
            }
        }
    }
}

// MARK: - Overview Section
struct OverviewSection: View {
    let geofence: Geofence

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            // Location Information
            SectionCard(title: "Location", icon: "mappin.circle.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    switch geofence.shape {
                    case .circle(let circle):
                        InfoRow(
                            icon: "location.fill",
                            label: "Center",
                            value: String(format: "%.6f, %.6f", circle.center.latitude, circle.center.longitude)
                        )
                        InfoRow(
                            icon: "circle.circle",
                            label: "Radius",
                            value: circle.formattedRadius
                        )
                    case .polygon(let polygon):
                        InfoRow(
                            icon: "pentagon.fill",
                            label: "Points",
                            value: "\(polygon.coordinates.count)"
                        )
                    }

                    InfoRow(
                        icon: "calendar",
                        label: "Created",
                        value: geofence.createdDate.formatted(date: .long, time: .shortened)
                    )
                    InfoRow(
                        icon: "person.fill",
                        label: "Created By",
                        value: geofence.createdBy
                    )

                    if let lastModified = geofence.lastModifiedDate {
                        InfoRow(
                            icon: "clock.arrow.circlepath",
                            label: "Last Modified",
                            value: lastModified.formatted(date: .abbreviated, time: .shortened)
                        )
                    }
                }
            }

            // Tags
            if !geofence.tags.isEmpty {
                SectionCard(title: "Tags", icon: "tag.fill") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: ModernTheme.Spacing.sm) {
                            ForEach(geofence.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(ModernTheme.Typography.caption1)
                                    .padding(.horizontal, ModernTheme.Spacing.md)
                                    .padding(.vertical, ModernTheme.Spacing.xs)
                                    .background(ModernTheme.Colors.primary.opacity(0.15))
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .cornerRadius(ModernTheme.CornerRadius.sm)
                            }
                        }
                    }
                }
            }

            // Schedule
            if let schedule = geofence.schedule {
                SectionCard(title: "Schedule", icon: "calendar.badge.clock") {
                    VStack(spacing: ModernTheme.Spacing.md) {
                        InfoRow(icon: "sunrise.fill", label: "Start Time", value: schedule.startTime)
                        InfoRow(icon: "sunset.fill", label: "End Time", value: schedule.endTime)
                        InfoRow(
                            icon: "calendar",
                            label: "Days",
                            value: schedule.daysOfWeek.map { "\($0)" }.joined(separator: ", ")
                        )
                        InfoRow(icon: "clock.fill", label: "Timezone", value: schedule.timezone)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Vehicles Section
struct VehiclesSection: View {
    let geofence: Geofence

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if geofence.assignedVehicles.isEmpty {
                Text("No vehicles assigned to this geofence")
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, ModernTheme.Spacing.xxl)
            } else {
                SectionCard(title: "Assigned Vehicles", icon: "car.2.fill") {
                    VStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(geofence.assignedVehicles, id: \.self) { vehicleId in
                            HStack {
                                Image(systemName: "car.fill")
                                    .foregroundColor(ModernTheme.Colors.primary)
                                Text(vehicleId)
                                    .font(ModernTheme.Typography.body)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                            }
                            .padding(.vertical, ModernTheme.Spacing.xs)
                        }
                    }
                }
            }

            if !geofence.assignedDrivers.isEmpty {
                SectionCard(title: "Assigned Drivers", icon: "person.2.fill") {
                    VStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(geofence.assignedDrivers, id: \.self) { driverId in
                            HStack {
                                Image(systemName: "person.fill")
                                    .foregroundColor(ModernTheme.Colors.info)
                                Text(driverId)
                                    .font(ModernTheme.Typography.body)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                            }
                            .padding(.vertical, ModernTheme.Spacing.xs)
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Events Section
struct EventsSection: View {
    let geofenceId: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Text("Recent events will appear here")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.xxl)
        }
        .padding(.horizontal)
    }
}

// MARK: - Alerts Section
struct AlertsSection: View {
    let geofence: Geofence

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            SectionCard(title: "Alert Settings", icon: "bell.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    AlertSettingRow(
                        icon: "arrow.right.circle.fill",
                        label: "Entry Alerts",
                        isEnabled: geofence.notifications.onEntry,
                        color: ModernTheme.Colors.success
                    )

                    AlertSettingRow(
                        icon: "arrow.left.circle.fill",
                        label: "Exit Alerts",
                        isEnabled: geofence.notifications.onExit,
                        color: ModernTheme.Colors.warning
                    )

                    AlertSettingRow(
                        icon: "clock.fill",
                        label: "Dwell Alerts",
                        isEnabled: geofence.notifications.onDwell,
                        color: ModernTheme.Colors.info
                    )

                    if let dwellTime = geofence.notifications.dwellTimeMinutes {
                        InfoRow(
                            icon: "hourglass",
                            label: "Dwell Time",
                            value: "\(dwellTime) minutes"
                        )
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Alert Setting Row
struct AlertSettingRow: View {
    let icon: String
    let label: String
    let isEnabled: Bool
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(label)
                .foregroundColor(ModernTheme.Colors.primaryText)
            Spacer()
            Image(systemName: isEnabled ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isEnabled ? ModernTheme.Colors.success : ModernTheme.Colors.idle)
        }
        .font(ModernTheme.Typography.subheadline)
    }
}

// MARK: - Section Card
struct SectionCard<Content: View>: View {
    let title: String
    let icon: String
    let content: Content

    init(title: String, icon: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.icon = icon
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(ModernTheme.Colors.primary)
                Text(title)
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }

            content
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(ModernTheme.Colors.info)
            Text(label)
                .foregroundColor(ModernTheme.Colors.secondaryText)
            Spacer()
            Text(value)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .fontWeight(.semibold)
        }
        .font(ModernTheme.Typography.subheadline)
    }
}

// MARK: - Error State View
struct ErrorStateView: View {
    let message: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.warning)

            Text("Error")
                .font(ModernTheme.Typography.title2)

            Text(message)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
    }
}

// MARK: - Preview
#if DEBUG
struct GeofenceDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GeofenceDetailView(geofenceId: "GEO-001")
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
