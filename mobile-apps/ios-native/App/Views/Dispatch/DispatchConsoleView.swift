//
//  DispatchConsoleView.swift
//  Fleet Manager - iOS Native App
//
//  Central dispatch console for managing fleet operations
//  Real-time updates, vehicle assignment, and communication
//

import SwiftUI
import MapKit

struct DispatchConsoleView: View {
    @StateObject private var viewModel = DispatchViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @State private var showSidePanel = true
    @State private var selectedTab: DispatchTab = .vehicles
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Main Map View
                mapView
                    .ignoresSafeArea()

                // Top Status Bar
                VStack {
                    topStatusBar
                    Spacer()
                }

                // Side Panel (left side)
                if showSidePanel {
                    HStack {
                        sidePanel
                            .frame(width: sidePanelWidth(for: geometry.size))
                        Spacer()
                    }
                    .transition(.move(edge: .leading))
                }

                // Bottom Controls
                VStack {
                    Spacer()
                    bottomControls
                }

                // Loading Overlay
                if viewModel.isLoading {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                    ProgressView("Loading dispatch data...")
                        .padding()
                        .background(ModernTheme.Colors.background)
                        .cornerRadius(ModernTheme.CornerRadius.md)
                }
            }
        }
        .navigationTitle("Dispatch Console")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                toolbarButtons
            }
        }
        .task {
            await viewModel.fetchAllData()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) { }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
        .sheet(isPresented: $viewModel.showAssignmentSheet) {
            AssignmentView(viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.showFilterSheet) {
            DispatchFilterSheet(viewModel: viewModel)
        }
    }

    // MARK: - Map View
    private var mapView: some View {
        Map(coordinateRegion: $viewModel.mapRegion, annotationItems: viewModel.filteredVehicles) { vehicle in
            MapAnnotation(coordinate: CLLocationCoordinate2D(
                latitude: vehicle.location.lat,
                longitude: vehicle.location.lng
            )) {
                VehicleMapPin(vehicle: vehicle)
                    .onTapGesture {
                        viewModel.selectedVehicle = vehicle
                        ModernTheme.Haptics.light()
                    }
            }
        }
    }

    // MARK: - Top Status Bar
    private var topStatusBar: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            // Toggle side panel button
            Button {
                withAnimation {
                    showSidePanel.toggle()
                    ModernTheme.Haptics.light()
                }
            } label: {
                Image(systemName: showSidePanel ? "sidebar.left" : "sidebar.right")
                    .font(.title3)
                    .foregroundColor(.white)
                    .padding(ModernTheme.Spacing.sm)
                    .background(ModernTheme.Colors.primary)
                    .clipShape(Circle())
                    .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
            }

            // Statistics badges
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ModernTheme.Spacing.sm) {
                    StatBadge(
                        icon: "car.2.fill",
                        title: "Available",
                        count: viewModel.availableVehicles,
                        color: .green
                    )

                    StatBadge(
                        icon: "person.fill.checkmark",
                        title: "Drivers",
                        count: viewModel.availableDrivers,
                        color: .blue
                    )

                    StatBadge(
                        icon: "list.bullet.clipboard.fill",
                        title: "Active",
                        count: viewModel.activeAssignments,
                        color: .purple
                    )

                    StatBadge(
                        icon: "clock.fill",
                        title: "Pending",
                        count: viewModel.pendingCount,
                        color: .orange
                    )

                    if viewModel.overdueCount > 0 {
                        StatBadge(
                            icon: "exclamationmark.triangle.fill",
                            title: "Overdue",
                            count: viewModel.overdueCount,
                            color: .red
                        )
                    }

                    if viewModel.unreadMessages > 0 {
                        StatBadge(
                            icon: "message.fill",
                            title: "Messages",
                            count: viewModel.unreadMessages,
                            color: .teal
                        )
                    }
                }
                .padding(.horizontal, ModernTheme.Spacing.sm)
            }

            Spacer()
        }
        .padding(.horizontal, ModernTheme.Spacing.lg)
        .padding(.top, ModernTheme.Spacing.sm)
    }

    // MARK: - Side Panel
    private var sidePanel: some View {
        VStack(spacing: 0) {
            // Tab selector
            Picker("View", selection: $selectedTab) {
                Text("Vehicles").tag(DispatchTab.vehicles)
                Text("Drivers").tag(DispatchTab.drivers)
                Text("Assignments").tag(DispatchTab.assignments)
            }
            .pickerStyle(.segmented)
            .padding(ModernTheme.Spacing.md)

            // Content based on selected tab
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.md) {
                    switch selectedTab {
                    case .vehicles:
                        vehiclesList
                    case .drivers:
                        driversList
                    case .assignments:
                        assignmentsList
                    }
                }
                .padding(ModernTheme.Spacing.md)
            }
        }
        .background(ModernTheme.Colors.background.opacity(0.95))
        .cornerRadius(ModernTheme.CornerRadius.lg, corners: [.topRight, .bottomRight])
        .shadow(color: .black.opacity(0.2), radius: 12, x: 4, y: 0)
    }

    // MARK: - Vehicles List
    private var vehiclesList: some View {
        ForEach(viewModel.filteredVehicles) { vehicle in
            VehicleDispatchCard(
                vehicle: vehicle,
                onTap: {
                    viewModel.centerOnVehicle(vehicle)
                },
                onAssign: {
                    viewModel.selectedVehicle = vehicle
                    viewModel.showAssignmentSheet = true
                }
            )
        }
    }

    // MARK: - Drivers List
    private var driversList: some View {
        ForEach(viewModel.availableDriversList) { driver in
            DriverDispatchCard(
                driver: driver,
                onTap: {
                    viewModel.selectedDriver = driver
                },
                onAssign: {
                    viewModel.selectedDriver = driver
                    viewModel.showAssignmentSheet = true
                }
            )
        }
    }

    // MARK: - Assignments List
    private var assignmentsList: some View {
        ForEach(viewModel.pendingAssignments) { assignment in
            AssignmentDispatchCard(
                assignment: assignment,
                onTap: {
                    viewModel.selectedAssignment = assignment
                },
                onUpdate: {
                    // Update assignment
                    Task {
                        await viewModel.updateAssignment(assignment)
                    }
                }
            )
        }
    }

    // MARK: - Bottom Controls
    private var bottomControls: some View {
        HStack(spacing: ModernTheme.Spacing.lg) {
            Spacer()

            VStack(spacing: ModernTheme.Spacing.md) {
                // Center on all vehicles
                MapControlButton(
                    icon: "map.fill",
                    color: ModernTheme.Colors.primary
                ) {
                    viewModel.centerOnAllVehicles()
                }
                .accessibilityLabel("Center on all vehicles")

                // Refresh
                MapControlButton(
                    icon: "arrow.clockwise",
                    color: ModernTheme.Colors.success
                ) {
                    Task {
                        await viewModel.refresh()
                    }
                }
                .accessibilityLabel("Refresh data")

                // Create new assignment
                MapControlButton(
                    icon: "plus.circle.fill",
                    color: ModernTheme.Colors.warning
                ) {
                    viewModel.showAssignmentSheet = true
                }
                .accessibilityLabel("Create new assignment")
            }
        }
        .padding(.trailing, ModernTheme.Spacing.lg)
        .padding(.bottom, ModernTheme.Spacing.xxxl)
    }

    // MARK: - Toolbar Buttons
    private var toolbarButtons: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Filter button
            Button {
                viewModel.showFilterSheet = true
                ModernTheme.Haptics.light()
            } label: {
                Image(systemName: "line.3.horizontal.decrease.circle")
                    .foregroundColor(ModernTheme.Colors.primary)
            }
            .accessibilityLabel("Filter")
        }
    }

    // MARK: - Helper Methods
    private func sidePanelWidth(for size: CGSize) -> CGFloat {
        if horizontalSizeClass == .regular {
            return min(400, size.width * 0.35)
        } else {
            return min(320, size.width * 0.85)
        }
    }
}

// MARK: - Dispatch Tab
enum DispatchTab {
    case vehicles
    case drivers
    case assignments
}

// MARK: - Stat Badge
struct StatBadge: View {
    let icon: String
    let title: String
    let count: Int
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.9))
                Text("\(count)")
                    .font(.caption.weight(.bold))
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Vehicle Dispatch Card
struct VehicleDispatchCard: View {
    let vehicle: Vehicle
    let onTap: () -> Void
    let onAssign: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                HStack {
                    Image(systemName: vehicle.type.icon)
                        .foregroundColor(vehicle.status.themeColor)
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(vehicle.number)
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)

                        Text("\(vehicle.make) \(vehicle.model)")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    Spacer()

                    Circle()
                        .fill(vehicle.status.themeColor)
                        .frame(width: 12, height: 12)
                }

                if let driver = vehicle.assignedDriver {
                    HStack {
                        Image(systemName: "person.fill")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.info)
                        Text(driver)
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                } else {
                    Button(action: onAssign) {
                        HStack {
                            Image(systemName: "person.fill.badge.plus")
                            Text("Assign Driver")
                        }
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.primary)
                    }
                    .buttonStyle(.plain)
                }

                // Quick stats
                HStack(spacing: ModernTheme.Spacing.md) {
                    QuickStatItem(icon: "fuelpump.fill", value: "\(vehicle.fuelLevelPercentage)%")
                    QuickStatItem(icon: "speedometer", value: String(format: "%.0fmi", vehicle.mileage))
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Driver Dispatch Card
struct DriverDispatchCard: View {
    let driver: Driver
    let onTap: () -> Void
    let onAssign: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                HStack {
                    // Driver initials
                    Circle()
                        .fill(driver.status.color)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Text(driver.initials)
                                .font(.caption.weight(.bold))
                                .foregroundColor(.white)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(driver.fullName)
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)

                        Text(driver.department)
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    Spacer()

                    if let availability = driver.schedule?.availability {
                        Text(availability.displayName)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(availability.color.opacity(0.2))
                            .foregroundColor(availability.color)
                            .cornerRadius(8)
                    }
                }

                if !driver.assignedVehicles.isEmpty {
                    HStack {
                        Image(systemName: "car.fill")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.info)
                        Text("\(driver.assignedVehicles.count) vehicle(s)")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                } else {
                    Button(action: onAssign) {
                        HStack {
                            Image(systemName: "car.fill.badge.plus")
                            Text("Assign Vehicle")
                        }
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.primary)
                    }
                    .buttonStyle(.plain)
                }

                // Performance score
                HStack(spacing: ModernTheme.Spacing.sm) {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundColor(driver.performanceMetrics.safetyGradeColor)
                    Text("Safety: \(driver.performanceMetrics.safetyGrade)")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Assignment Dispatch Card
struct AssignmentDispatchCard: View {
    let assignment: Assignment
    let onTap: () -> Void
    let onUpdate: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                HStack {
                    Image(systemName: assignment.type.icon)
                        .foregroundColor(assignment.type.color)
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(assignment.type.displayName)
                            .font(ModernTheme.Typography.bodyBold)
                            .foregroundColor(ModernTheme.Colors.primaryText)

                        if let description = assignment.description {
                            Text(description)
                                .font(.caption)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                                .lineLimit(2)
                        }
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: assignment.priority.icon)
                                .font(.caption2)
                            Text(assignment.priority.displayName)
                                .font(.caption2)
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(assignment.priority.color)
                        .cornerRadius(6)

                        HStack(spacing: 4) {
                            Image(systemName: assignment.status.icon)
                                .font(.caption2)
                            Text(assignment.status.displayName)
                                .font(.caption2)
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(assignment.status.color)
                        .cornerRadius(6)
                    }
                }

                // Time info
                HStack {
                    Image(systemName: "clock")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text(assignment.scheduledStart, style: .time)
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if assignment.isOverdue {
                        Text("OVERDUE")
                            .font(.caption2.weight(.bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .cornerRadius(4)
                    }
                }

                // Progress
                if !assignment.checkpoints.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Progress: \(assignment.completionPercentage)%")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        ProgressView(value: Double(assignment.completionPercentage), total: 100)
                            .tint(assignment.priority.color)
                    }
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quick Stat Item
struct QuickStatItem: View {
    let icon: String
    let value: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
            Text(value)
                .font(.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

// MARK: - Rounded Corners Extension
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - Preview
#if DEBUG
struct DispatchConsoleView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DispatchConsoleView()
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
