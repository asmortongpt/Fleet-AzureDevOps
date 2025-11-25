//
//  RouteOptimizerView.swift
//  Fleet Manager
//
//  Main route optimization interface
//

import SwiftUI
import MapKit

struct RouteOptimizerView: View {
    @StateObject private var viewModel = RouteOptimizationViewModel()
    @State private var showingWaypointEditor = false
    @State private var showingOptimizedRoute = false
    @State private var showingPreferences = false
    @State private var editingWaypoint: RouteWaypoint?
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.8977, longitude: -77.0365),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    var body: some View {
        ZStack {
            if viewModel.waypoints.isEmpty {
                emptyStateView
            } else {
                mainContentView
            }

            if viewModel.isOptimizing {
                optimizingOverlay
            }
        }
        .navigationTitle("Route Optimizer")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingPreferences = true }) {
                        Label("Optimization Settings", systemImage: "slider.horizontal.3")
                    }

                    Button(action: { showingWaypointEditor = true }) {
                        Label("Add Waypoint", systemImage: "mappin.and.ellipse")
                    }

                    if !viewModel.waypoints.isEmpty {
                        Button(role: .destructive, action: viewModel.clearWaypoints) {
                            Label("Clear All", systemImage: "trash")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                }
            }
        }
        .sheet(isPresented: $showingWaypointEditor) {
            WaypointEditorView(
                waypoint: editingWaypoint,
                onSave: { waypoint in
                    if let existing = editingWaypoint {
                        viewModel.updateWaypoint(waypoint)
                    } else {
                        viewModel.addWaypoint(waypoint)
                    }
                    editingWaypoint = nil
                }
            )
        }
        .sheet(isPresented: $showingOptimizedRoute) {
            if let route = viewModel.optimizedRoute {
                OptimizedRouteView(route: route, viewModel: viewModel)
            }
        }
        .sheet(isPresented: $showingPreferences) {
            PreferencesView(preferences: $viewModel.preferences)
        }
        .onChange(of: viewModel.optimizedRoute) { _, newValue in
            if newValue != nil {
                showingOptimizedRoute = true
            }
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: ModernTheme.Spacing.xl) {
            Image(systemName: "map.fill")
                .font(.system(size: 80))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            VStack(spacing: ModernTheme.Spacing.sm) {
                Text("No Waypoints Added")
                    .font(ModernTheme.Typography.title2)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Text("Add waypoints to create and optimize a route")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .multilineTextAlignment(.center)
            }

            Button(action: { showingWaypointEditor = true }) {
                Label("Add First Waypoint", systemImage: "plus.circle.fill")
                    .font(ModernTheme.Typography.bodyBold)
            }
            .primaryButton()
            .padding(.horizontal, ModernTheme.Spacing.xxxl)
        }
        .padding(ModernTheme.Spacing.xxxl)
    }

    // MARK: - Main Content
    private var mainContentView: some View {
        VStack(spacing: 0) {
            // Map Preview
            mapPreviewSection
                .frame(height: 250)

            // Waypoint List
            waypointListSection
        }
    }

    // MARK: - Map Preview
    private var mapPreviewSection: some View {
        ZStack(alignment: .bottom) {
            Map(coordinateRegion: .constant(mapRegion), annotationItems: viewModel.waypoints) { waypoint in
                MapAnnotation(coordinate: waypoint.clCoordinate) {
                    waypointMarker(waypoint)
                }
            }
            .allowsHitTesting(false)

            // Map Overlay Info
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("\(viewModel.waypoints.count) Waypoints")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(.white)

                    if let distance = estimatedDistance {
                        Text(distance)
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }

                Spacer()

                Button(action: {
                    Task {
                        await viewModel.optimizeRoute()
                    }
                }) {
                    HStack(spacing: ModernTheme.Spacing.xs) {
                        Image(systemName: "sparkles")
                        Text("Optimize")
                    }
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .padding(.horizontal, ModernTheme.Spacing.lg)
                    .padding(.vertical, ModernTheme.Spacing.sm)
                    .background(ModernTheme.Colors.primary)
                    .cornerRadius(ModernTheme.CornerRadius.md)
                }
                .disabled(viewModel.waypoints.count < 2)
            }
            .padding(ModernTheme.Spacing.md)
            .background(.ultraThinMaterial)
        }
    }

    // MARK: - Waypoint List
    private var waypointListSection: some View {
        List {
            Section {
                ForEach(Array(viewModel.waypoints.enumerated()), id: \.element.id) { index, waypoint in
                    WaypointRow(
                        waypoint: waypoint,
                        index: index,
                        onTap: {
                            editingWaypoint = waypoint
                            showingWaypointEditor = true
                        },
                        onDelete: {
                            viewModel.removeWaypoint(at: index)
                        }
                    )
                }
                .onMove(perform: viewModel.moveWaypoint)
                .onDelete { indexSet in
                    indexSet.forEach { viewModel.removeWaypoint(at: $0) }
                }

                Button(action: { showingWaypointEditor = true }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(ModernTheme.Colors.primary)
                        Text("Add Waypoint")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
            } header: {
                HStack {
                    Text("Waypoints")
                    Spacer()
                    Text("Drag to reorder")
                        .font(ModernTheme.Typography.caption2)
                        .textCase(.none)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Optimizing Overlay
    private var optimizingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: ModernTheme.Spacing.lg) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)

                Text("Optimizing Route...")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(.white)

                Text("Finding the best path through \(viewModel.waypoints.count) waypoints")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
            }
            .padding(ModernTheme.Spacing.xxxl)
            .background(.ultraThinMaterial)
            .cornerRadius(ModernTheme.CornerRadius.lg)
            .shadow(color: .black.opacity(0.3), radius: 20)
        }
    }

    // MARK: - Waypoint Marker
    private func waypointMarker(_ waypoint: RouteWaypoint) -> some View {
        VStack(spacing: 2) {
            ZStack {
                Circle()
                    .fill(waypoint.priority.color)
                    .frame(width: 30, height: 30)

                Text("\(waypoint.sequenceNumber + 1)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
            }
            .shadow(radius: 3)

            if let name = waypoint.name {
                Text(name)
                    .font(.system(size: 8))
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(.white)
                    .cornerRadius(4)
                    .shadow(radius: 2)
            }
        }
    }

    // MARK: - Computed Properties
    private var estimatedDistance: String? {
        guard viewModel.waypoints.count >= 2 else { return nil }

        var totalDistance: Double = 0
        for i in 0..<viewModel.waypoints.count - 1 {
            let from = CLLocation(
                latitude: viewModel.waypoints[i].coordinate.latitude,
                longitude: viewModel.waypoints[i].coordinate.longitude
            )
            let to = CLLocation(
                latitude: viewModel.waypoints[i + 1].coordinate.latitude,
                longitude: viewModel.waypoints[i + 1].coordinate.longitude
            )
            totalDistance += from.distance(from: to)
        }

        return String(format: "~%.1f km", totalDistance / 1000)
    }
}

// MARK: - Waypoint Row
struct WaypointRow: View {
    let waypoint: RouteWaypoint
    let index: Int
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Sequence number
                ZStack {
                    Circle()
                        .fill(waypoint.priority.color)
                        .frame(width: 36, height: 36)

                    Text("\(index + 1)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                }

                // Waypoint info
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    if let name = waypoint.name {
                        Text(name)
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)
                    }

                    Text(waypoint.address)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .lineLimit(2)

                    HStack(spacing: ModernTheme.Spacing.sm) {
                        Label(waypoint.formattedStopDuration, systemImage: "clock.fill")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)

                        if waypoint.priority != .normal {
                            Label(waypoint.priority.rawValue, systemImage: waypoint.priority.icon)
                                .font(ModernTheme.Typography.caption2)
                                .foregroundColor(waypoint.priority.color)
                        }
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }
            .padding(.vertical, ModernTheme.Spacing.xs)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Preferences View
struct PreferencesView: View {
    @Binding var preferences: OptimizationPreferences
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Optimization Goal") {
                    Picker("Objective", selection: $preferences.objective) {
                        ForEach(OptimizationObjective.allCases, id: \.self) { objective in
                            HStack {
                                Image(systemName: objective.icon)
                                VStack(alignment: .leading) {
                                    Text(objective.rawValue)
                                    Text(objective.description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .tag(objective)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section("Route Preferences") {
                    Toggle("Avoid Tolls", isOn: $preferences.avoidTolls)
                    Toggle("Avoid Highways", isOn: $preferences.avoidHighways)
                    Toggle("Respect Time Windows", isOn: $preferences.respectTimeWindows)
                }

                Section("Traffic") {
                    Picker("Traffic Consideration", selection: $preferences.trafficConsideration) {
                        ForEach(TrafficConsideration.allCases, id: \.self) { traffic in
                            Text(traffic.rawValue).tag(traffic)
                        }
                    }
                }
            }
            .navigationTitle("Preferences")
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

#Preview {
    NavigationView {
        RouteOptimizerView()
    }
}
