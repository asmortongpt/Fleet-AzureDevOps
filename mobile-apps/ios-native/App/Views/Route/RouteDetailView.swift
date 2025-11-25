import SwiftUI
import MapKit

struct RouteDetailView: View {
    let route: Route
    @ObservedObject var viewModel: RouteViewModel
    @Environment(\.presentationMode) var presentationMode
    @State private var showingDeleteConfirmation = false
    @State private var showingEditRoute = false
    @State private var showingUsageHistory = false
    @State private var showingShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                // Map showing route
                routeMapView

                // Route Information Card
                routeInfoCard

                // Waypoints List
                waypointsSection

                // Quick Actions
                quickActionsSection

                // Usage Statistics
                if route.usageCount > 0 {
                    usageStatsSection
                }

                // Notes
                if let notes = route.notes {
                    notesSection(notes)
                }
            }
            .padding(.vertical)
        }
        .background(ModernTheme.Colors.groupedBackground)
        .navigationTitle(route.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: {
                        Task {
                            await viewModel.toggleFavorite(for: route)
                        }
                    }) {
                        Label(
                            route.isFavorite ? "Remove from Favorites" : "Add to Favorites",
                            systemImage: route.isFavorite ? "star.slash" : "star"
                        )
                    }

                    Button(action: {
                        showingShareSheet = true
                    }) {
                        Label("Share Route", systemImage: "square.and.arrow.up")
                    }

                    Button(action: {
                        showingEditRoute = true
                    }) {
                        Label("Edit Route", systemImage: "pencil")
                    }

                    Divider()

                    Button(role: .destructive, action: {
                        showingDeleteConfirmation = true
                    }) {
                        Label("Delete Route", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                }
            }
        }
        .alert("Delete Route", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    await viewModel.deleteRoute(route)
                    presentationMode.wrappedValue.dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to delete '\(route.name)'? This action cannot be undone.")
        }
        .sheet(isPresented: $showingUsageHistory) {
            RouteUsageHistoryView(route: route, viewModel: viewModel)
        }
        .sheet(isPresented: $showingShareSheet) {
            RouteShareSheet(route: route)
        }
        .onAppear {
            Task {
                await viewModel.loadUsageHistory(for: route)
            }
        }
    }

    // MARK: - Route Map View
    private var routeMapView: some View {
        Map(coordinateRegion: .constant(getRouteRegion()), annotationItems: route.waypoints) { waypoint in
            MapAnnotation(coordinate: waypoint.coordinate) {
                WaypointMarker(waypoint: waypoint)
            }
        }
        .frame(height: 300)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .padding(.horizontal)
        .onTapGesture {
            viewModel.startNavigation(for: route)
        }
        .overlay(
            HStack {
                Spacer()
                VStack {
                    Button(action: {
                        viewModel.startNavigation(for: route)
                    }) {
                        Image(systemName: "location.fill")
                            .font(.title3)
                            .foregroundColor(.white)
                            .padding(12)
                            .background(Circle().fill(ModernTheme.Colors.primary))
                            .shadow(radius: 4)
                    }
                    .padding()
                    Spacer()
                }
            }
        )
    }

    // MARK: - Route Info Card
    private var routeInfoCard: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Main metrics
            HStack(spacing: ModernTheme.Spacing.xl) {
                RouteMetric(
                    icon: "road.lanes",
                    label: "Distance",
                    value: route.formattedDistance,
                    color: .blue
                )

                Divider()
                    .frame(height: 40)

                RouteMetric(
                    icon: "clock",
                    label: "Duration",
                    value: route.formattedDuration,
                    color: .green
                )

                Divider()
                    .frame(height: 40)

                RouteMetric(
                    icon: "mappin.and.ellipse",
                    label: "Waypoints",
                    value: "\(route.waypoints.count)",
                    color: .purple
                )
            }

            // Traffic condition
            if route.trafficEnabled, let traffic = route.currentTrafficCondition {
                Divider()

                HStack {
                    Image(systemName: traffic.icon)
                        .foregroundColor(traffic.color)
                    Text("Current Traffic: \(traffic.rawValue)")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Spacer()

                    let adjustedDuration = viewModel.getAdjustedDuration(for: route)
                    Text("~\(formatDuration(adjustedDuration))")
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(traffic.color)
                }
            }

            // Last used
            if let lastUsed = route.formattedLastUsed {
                Divider()

                HStack {
                    Image(systemName: "clock.arrow.circlepath")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text("Last used \(lastUsed)")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.medium.color, radius: ModernTheme.Shadow.medium.radius)
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
                Text("\(route.waypoints.count) stops")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            ForEach(route.waypoints) { waypoint in
                WaypointRow(waypoint: waypoint)
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

    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            Button(action: {
                viewModel.startNavigation(for: route)
            }) {
                HStack {
                    Image(systemName: "location.fill")
                    Text("Start Navigation")
                        .font(ModernTheme.Typography.bodyBold)
                }
                .frame(maxWidth: .infinity)
            }
            .primaryButton()

            HStack(spacing: ModernTheme.Spacing.sm) {
                Button(action: {
                    Task {
                        await viewModel.toggleFavorite(for: route)
                    }
                }) {
                    HStack {
                        Image(systemName: route.isFavorite ? "star.fill" : "star")
                        Text(route.isFavorite ? "Unfavorite" : "Favorite")
                            .font(ModernTheme.Typography.body)
                    }
                    .frame(maxWidth: .infinity)
                }
                .secondaryButton()

                Button(action: {
                    showingShareSheet = true
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Share")
                            .font(ModernTheme.Typography.body)
                    }
                    .frame(maxWidth: .infinity)
                }
                .secondaryButton()
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Usage Stats Section
    private var usageStatsSection: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Usage Statistics")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                Spacer()
                Button(action: {
                    showingUsageHistory = true
                }) {
                    Text("View History")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }

            HStack(spacing: ModernTheme.Spacing.lg) {
                UsageStatItem(
                    icon: "arrow.triangle.2.circlepath",
                    label: "Times Used",
                    value: "\(route.usageCount)",
                    color: .blue
                )

                UsageStatItem(
                    icon: "calendar",
                    label: "Created",
                    value: formatDate(route.createdDate),
                    color: .green
                )
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
    private func notesSection(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: "note.text")
                    .foregroundColor(ModernTheme.Colors.primary)
                Text("Notes")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }

            Text(notes)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
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
    private func getRouteRegion() -> MKCoordinateRegion {
        guard let origin = route.origin, let destination = route.destination else {
            return MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
                span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
            )
        }

        var minLat = min(origin.coordinate.latitude, destination.coordinate.latitude)
        var maxLat = max(origin.coordinate.latitude, destination.coordinate.latitude)
        var minLon = min(origin.coordinate.longitude, destination.coordinate.longitude)
        var maxLon = max(origin.coordinate.longitude, destination.coordinate.longitude)

        for waypoint in route.intermediateWaypoints {
            minLat = min(minLat, waypoint.coordinate.latitude)
            maxLat = max(maxLat, waypoint.coordinate.latitude)
            minLon = min(minLon, waypoint.coordinate.longitude)
            maxLon = max(maxLon, waypoint.coordinate.longitude)
        }

        let centerLat = (minLat + maxLat) / 2
        let centerLon = (minLon + maxLon) / 2
        let spanLat = (maxLat - minLat) * 1.3
        let spanLon = (maxLon - minLon) * 1.3

        return MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
            span: MKCoordinateSpan(latitudeDelta: max(spanLat, 0.01), longitudeDelta: max(spanLon, 0.01))
        )
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views
struct WaypointMarker: View {
    let waypoint: Waypoint

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: waypoint.icon)
                .font(.title3)
                .foregroundColor(.white)
                .padding(8)
                .background(Circle().fill(waypoint.color))
                .shadow(radius: 3)

            Text("\(waypoint.order + 1)")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(4)
                .background(Circle().fill(Color.black.opacity(0.7)))
        }
    }
}

struct WaypointRow: View {
    let waypoint: Waypoint

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Order number
            Text("\(waypoint.order + 1)")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(.white)
                .frame(width: 32, height: 32)
                .background(Circle().fill(waypoint.color))

            // Icon
            Image(systemName: waypoint.icon)
                .foregroundColor(waypoint.color)
                .frame(width: 24)

            // Details
            VStack(alignment: .leading, spacing: 2) {
                Text(waypoint.name)
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                if let address = waypoint.address {
                    Text(address)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .lineLimit(1)
                }

                if let notes = waypoint.notes {
                    HStack(spacing: 4) {
                        Image(systemName: "note.text")
                            .font(.caption2)
                        Text(notes)
                            .font(ModernTheme.Typography.caption2)
                    }
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                    .lineLimit(1)
                }
            }

            Spacer()

            // Type badge
            Text(waypoint.type.rawValue)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(waypoint.color)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 4)
                        .fill(waypoint.color.opacity(0.2))
                )
        }
        .padding(.vertical, ModernTheme.Spacing.sm)
    }
}

struct RouteMetric: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(label)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

struct UsageStatItem: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()
        }
    }
}

// MARK: - Usage History View
struct RouteUsageHistoryView: View {
    let route: Route
    @ObservedObject var viewModel: RouteViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.usageHistory) { history in
                    UsageHistoryRow(history: history)
                }
            }
            .navigationTitle("Usage History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct UsageHistoryRow: View {
    let history: RouteUsageHistory

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text(history.vehicleNumber)
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                if history.completed {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.red)
                }
            }

            if let driverName = history.driverName {
                Text("Driver: \(driverName)")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Text(history.formattedStartTime)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            if let duration = history.formattedDuration, let distance = history.actualDistance {
                HStack(spacing: ModernTheme.Spacing.lg) {
                    Label(duration, systemImage: "clock")
                    Label(String(format: "%.1f km", distance / 1000), systemImage: "road.lanes")
                }
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
            }
        }
        .padding(.vertical, ModernTheme.Spacing.xs)
    }
}

// MARK: - Share Sheet
struct RouteShareSheet: View {
    let route: Route
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            VStack(spacing: ModernTheme.Spacing.xl) {
                Text("Share '\(route.name)'")
                    .font(ModernTheme.Typography.title2)

                Text("Share route details with other users")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .multilineTextAlignment(.center)

                // Share options would go here
                Text("Sharing functionality coming soon")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)

                Spacer()
            }
            .padding()
            .navigationTitle("Share Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        RouteDetailView(route: Route.sample, viewModel: RouteViewModel())
    }
}
