//
//  OptimizedRouteView.swift
//  Fleet Manager
//
//  Display optimized route results with before/after comparison
//

import SwiftUI
import MapKit

struct OptimizedRouteView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedComparison: ComparisonMode = .optimized
    @State private var showingSaveDialog = false
    @State private var routeName = ""
    @State private var mapRegion: MKCoordinateRegion

    let route: OptimizedRoute
    let viewModel: RouteOptimizationViewModel

    init(route: OptimizedRoute, viewModel: RouteOptimizationViewModel) {
        self.route = route
        self.viewModel = viewModel

        // Calculate initial map region to show all waypoints
        let coordinates = route.optimizedWaypoints.map { $0.clCoordinate }
        let center = CLLocationCoordinate2D(
            latitude: coordinates.map { $0.latitude }.reduce(0, +) / Double(coordinates.count),
            longitude: coordinates.map { $0.longitude }.reduce(0, +) / Double(coordinates.count)
        )

        _mapRegion = State(initialValue: MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        ))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Savings Summary Card
                    savingsSummaryCard

                    // Comparison Toggle
                    comparisonToggle

                    // Map View
                    mapView

                    // Route Metrics
                    routeMetricsCard

                    // Waypoint List
                    waypointListCard

                    // Actions
                    actionButtons
                }
                .padding(ModernTheme.Spacing.md)
            }
            .navigationTitle("Optimized Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingSaveDialog = true }) {
                            Label("Save Route", systemImage: "square.and.arrow.down")
                        }

                        Button(action: { viewModel.exportToNavigationApp(route: route) }) {
                            Label("Open in Maps", systemImage: "map")
                        }

                        Button(action: shareRoute) {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("Save Route", isPresented: $showingSaveDialog) {
                TextField("Route Name", text: $routeName)
                Button("Cancel", role: .cancel) { }
                Button("Save") {
                    viewModel.saveOptimizedRoute()
                    ModernTheme.Haptics.success()
                }
            } message: {
                Text("Give this optimized route a name to save it to your library")
            }
        }
    }

    // MARK: - Savings Summary Card
    private var savingsSummaryCard: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.title2)
                    .foregroundColor(.yellow)

                Text("Route Optimized!")
                    .font(ModernTheme.Typography.title3)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()
            }

            HStack(spacing: ModernTheme.Spacing.xl) {
                SavingMetric(
                    title: "Distance",
                    value: route.savings.formattedDistanceSaved,
                    icon: "road.lanes",
                    color: .green
                )

                Divider()
                    .frame(height: 40)

                SavingMetric(
                    title: "Time",
                    value: route.savings.formattedTimeSaved,
                    icon: "clock.fill",
                    color: .blue
                )

                Divider()
                    .frame(height: 40)

                if let fuelSavings = route.savings.formattedFuelCostSaved {
                    SavingMetric(
                        title: "Fuel Cost",
                        value: fuelSavings,
                        icon: "fuelpump.fill",
                        color: .orange
                    )
                }
            }

            // Improvement percentage
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(ModernTheme.Colors.success)

                Text("Overall improvement: \(route.savings.formattedImprovement)")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(ModernTheme.Colors.success)
            }
            .padding(.vertical, ModernTheme.Spacing.sm)
            .padding(.horizontal, ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.success.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .padding(ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: ModernTheme.Shadow.medium.color, radius: ModernTheme.Shadow.medium.radius)
    }

    // MARK: - Comparison Toggle
    private var comparisonToggle: some View {
        Picker("View", selection: $selectedComparison) {
            Text("Original").tag(ComparisonMode.original)
            Text("Optimized").tag(ComparisonMode.optimized)
            Text("Both").tag(ComparisonMode.both)
        }
        .pickerStyle(.segmented)
        .padding(.horizontal, ModernTheme.Spacing.lg)
    }

    // MARK: - Map View
    private var mapView: some View {
        ZStack(alignment: .topTrailing) {
            Map(coordinateRegion: $mapRegion, annotationItems: displayedWaypoints) { waypoint in
                MapAnnotation(coordinate: waypoint.clCoordinate) {
                    WaypointMarker(
                        waypoint: waypoint,
                        isOptimized: selectedComparison != .original
                    )
                }
            }
            .frame(height: 400)
            .cornerRadius(ModernTheme.CornerRadius.lg)

            // Legend
            if selectedComparison == .both {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    LegendItem(color: .red, label: "Original")
                    LegendItem(color: .green, label: "Optimized")
                }
                .padding(ModernTheme.Spacing.sm)
                .background(.ultraThinMaterial)
                .cornerRadius(ModernTheme.CornerRadius.sm)
                .padding(ModernTheme.Spacing.md)
            }
        }
    }

    // MARK: - Route Metrics Card
    private var routeMetricsCard: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Route Details")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Spacer()

                if selectedComparison != .both {
                    Text(selectedComparison == .original ? "Original" : "Optimized")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .padding(.horizontal, ModernTheme.Spacing.sm)
                        .padding(.vertical, ModernTheme.Spacing.xs)
                        .background(ModernTheme.Colors.secondaryBackground)
                        .cornerRadius(ModernTheme.CornerRadius.sm)
                }
            }

            Divider()

            VStack(spacing: ModernTheme.Spacing.sm) {
                MetricRow(
                    icon: "road.lanes",
                    label: "Total Distance",
                    value: route.formattedDistance
                )

                MetricRow(
                    icon: "clock.fill",
                    label: "Estimated Duration",
                    value: route.formattedDuration
                )

                if let fuelCost = route.formattedFuelCost {
                    MetricRow(
                        icon: "fuelpump.fill",
                        label: "Estimated Fuel Cost",
                        value: fuelCost
                    )
                }

                MetricRow(
                    icon: "mappin.and.ellipse",
                    label: "Waypoints",
                    value: "\(route.optimizedWaypoints.count)"
                )

                MetricRow(
                    icon: "sparkles",
                    label: "Optimization Strategy",
                    value: route.preferences.objective.rawValue
                )
            }
        }
        .padding(ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: ModernTheme.Shadow.medium.color, radius: ModernTheme.Shadow.medium.radius)
    }

    // MARK: - Waypoint List Card
    private var waypointListCard: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Text("Turn-by-Turn Waypoints")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            ForEach(Array(displayedWaypoints.enumerated()), id: \.element.id) { index, waypoint in
                WaypointDetailRow(
                    waypoint: waypoint,
                    index: index,
                    isLast: index == displayedWaypoints.count - 1
                )
            }
        }
        .padding(ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: ModernTheme.Shadow.medium.color, radius: ModernTheme.Shadow.medium.radius)
    }

    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Button(action: {
                viewModel.exportToNavigationApp(route: route)
            }) {
                Label("Start Navigation", systemImage: "location.fill")
                    .font(ModernTheme.Typography.bodyBold)
                    .frame(maxWidth: .infinity)
            }
            .primaryButton()

            HStack(spacing: ModernTheme.Spacing.md) {
                Button(action: { showingSaveDialog = true }) {
                    Label("Save", systemImage: "square.and.arrow.down")
                        .font(ModernTheme.Typography.bodyBold)
                        .frame(maxWidth: .infinity)
                }
                .secondaryButton()

                Button(action: shareRoute) {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(ModernTheme.Typography.bodyBold)
                        .frame(maxWidth: .infinity)
                }
                .secondaryButton()
            }
        }
    }

    // MARK: - Computed Properties
    private var displayedWaypoints: [RouteWaypoint] {
        switch selectedComparison {
        case .original:
            return route.originalWaypoints
        case .optimized:
            return route.optimizedWaypoints
        case .both:
            // Show optimized for now, in production would overlay both
            return route.optimizedWaypoints
        }
    }

    // MARK: - Actions
    private func shareRoute() {
        // Create shareable text
        var text = "Optimized Route\n\n"
        text += "Total Distance: \(route.formattedDistance)\n"
        text += "Estimated Time: \(route.formattedDuration)\n\n"
        text += "Waypoints:\n"

        for (index, waypoint) in route.optimizedWaypoints.enumerated() {
            text += "\(index + 1). \(waypoint.name ?? waypoint.address)\n"
        }

        let activityVC = UIActivityViewController(
            activityItems: [text],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootViewController = windowScene.windows.first?.rootViewController {
            rootViewController.present(activityVC, animated: true)
        }
    }
}

// MARK: - Comparison Mode
enum ComparisonMode {
    case original
    case optimized
    case both
}

// MARK: - Supporting Views
struct SavingMetric: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.xs) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(ModernTheme.Typography.title3)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

struct LegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text(label)
                .font(ModernTheme.Typography.caption2)
        }
    }
}

struct MetricRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(ModernTheme.Colors.primary)
                .frame(width: 24)

            Text(label)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(ModernTheme.Colors.primaryText)
        }
    }
}

struct WaypointMarker: View {
    let waypoint: RouteWaypoint
    let isOptimized: Bool

    var body: some View {
        VStack(spacing: 2) {
            ZStack {
                Circle()
                    .fill(isOptimized ? Color.green : Color.red)
                    .frame(width: 32, height: 32)

                Text("\(waypoint.sequenceNumber + 1)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            .shadow(radius: 3)

            if let name = waypoint.name {
                Text(name)
                    .font(.system(size: 9))
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(.white)
                    .cornerRadius(4)
                    .shadow(radius: 2)
            }
        }
    }
}

struct WaypointDetailRow: View {
    let waypoint: RouteWaypoint
    let index: Int
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: ModernTheme.Spacing.md) {
            // Timeline
            VStack(spacing: 0) {
                Circle()
                    .fill(waypoint.priority.color)
                    .frame(width: 24, height: 24)
                    .overlay {
                        Text("\(index + 1)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }

                if !isLast {
                    Rectangle()
                        .fill(ModernTheme.Colors.separator)
                        .frame(width: 2, height: 40)
                }
            }

            // Content
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                if let name = waypoint.name {
                    Text(name)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }

                Text(waypoint.address)
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                HStack(spacing: ModernTheme.Spacing.sm) {
                    Label(waypoint.formattedStopDuration, systemImage: "clock.fill")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)

                    if let notes = waypoint.notes {
                        Label(notes, systemImage: "note.text")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                            .lineLimit(1)
                    }
                }
            }
            .padding(.bottom, isLast ? 0 : ModernTheme.Spacing.md)

            Spacer()
        }
    }
}

#Preview {
    OptimizedRouteView(
        route: .sample,
        viewModel: RouteOptimizationViewModel()
    )
}
