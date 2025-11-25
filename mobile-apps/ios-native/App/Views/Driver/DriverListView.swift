//
//  DriverListView.swift
//  Fleet Manager - iOS Native App
//
//  Complete driver list view with search, filters, sorting, and navigation
//  Follows ModernTheme design patterns and accessibility standards
//

import SwiftUI

// MARK: - Driver List View
struct DriverListView: View {
    @StateObject private var viewModel = DriversViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    @State private var showFilters = false
    @State private var showingAddDriver = false
    @State private var selectedDriver: Driver?
    @State private var searchText = ""
    @Namespace private var animation
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            // Main Content
            VStack(spacing: 0) {
                // Active Filters Display
                if viewModel.selectedFilter != .all || viewModel.selectedSortOption != .name {
                    ModernDriverActiveFiltersView(viewModel: viewModel)
                        .padding(.horizontal, ModernTheme.Spacing.lg)
                        .padding(.top, ModernTheme.Spacing.sm)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Statistics Bar
                ModernDriverStatsBar(viewModel: viewModel)
                    .padding(.vertical, ModernTheme.Spacing.sm)

                // Driver List
                if viewModel.isLoading && viewModel.drivers.isEmpty {
                    LoadingSpinnerView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredDrivers.isEmpty {
                    ModernEmptyDriverState(searchText: searchText)
                } else {
                    List {
                        ForEach(viewModel.filteredDrivers) { driver in
                            ModernDriverRow(driver: driver)
                                .listRowInsets(EdgeInsets(
                                    top: ModernTheme.Spacing.sm,
                                    leading: ModernTheme.Spacing.lg,
                                    bottom: ModernTheme.Spacing.sm,
                                    trailing: ModernTheme.Spacing.lg
                                ))
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        ModernTheme.Haptics.warning()
                                        deleteDriver(driver)
                                    } label: {
                                        Label("Delete", systemImage: "trash.fill")
                                    }

                                    Button {
                                        ModernTheme.Haptics.light()
                                        selectedDriver = driver
                                        viewModel.showingEditDriver = true
                                    } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }
                                    .tint(ModernTheme.Colors.primary)
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        ModernTheme.Haptics.selection()
                                        callDriver(driver)
                                    } label: {
                                        Label("Call", systemImage: "phone.fill")
                                    }
                                    .tint(ModernTheme.Colors.success)

                                    Button {
                                        ModernTheme.Haptics.selection()
                                        emailDriver(driver)
                                    } label: {
                                        Label("Email", systemImage: "envelope.fill")
                                    }
                                    .tint(ModernTheme.Colors.info)
                                }
                                .contextMenu {
                                    ModernDriverContextMenu(driver: driver)
                                }
                                .onTapGesture {
                                    ModernTheme.Haptics.light()
                                    navigationCoordinator.navigate(to: .driverDetail(id: driver.id))
                                }
                                .animatedAppearance(delay: Double(viewModel.filteredDrivers.firstIndex(of: driver) ?? 0) * 0.05)
                        }
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                    .background(ModernTheme.Colors.groupedBackground)
                    .refreshable {
                        ModernTheme.Haptics.light()
                        await viewModel.refresh()
                    }
                }
            }

            // Error Banner
            if let errorMessage = viewModel.errorMessage {
                VStack {
                    Spacer()
                    ModernErrorBanner(message: errorMessage) {
                        ModernTheme.Haptics.light()
                        viewModel.errorMessage = nil
                    }
                    .padding(ModernTheme.Spacing.lg)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .navigationTitle("Drivers")
        .navigationBarTitleDisplayMode(.large)
        .searchable(
            text: $searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Search drivers..."
        )
        .onChange(of: searchText) { newValue in
            viewModel.searchText = newValue
        }
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarLeading) {
                Button {
                    ModernTheme.Haptics.selection()
                    showFilters.toggle()
                } label: {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .symbolRenderingMode(.hierarchical)
                        if viewModel.selectedFilter != .all {
                            Circle()
                                .fill(ModernTheme.Colors.primary)
                                .frame(width: 8, height: 8)
                        }
                    }
                }
                .accessibilityLabel("Filters")
                .accessibilityHint("Double tap to show filter options")
            }

            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Menu {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Button {
                            ModernTheme.Haptics.selection()
                            viewModel.selectedSortOption = option
                            viewModel.applyFiltersAndSort()
                        } label: {
                            Label(option.rawValue, systemImage: option.icon)
                            if viewModel.selectedSortOption == option {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                } label: {
                    Image(systemName: "arrow.up.arrow.down.circle")
                        .symbolRenderingMode(.hierarchical)
                }
                .accessibilityLabel("Sort options")
                .accessibilityHint("Double tap to change sorting")

                Button {
                    ModernTheme.Haptics.medium()
                    showingAddDriver = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
                .accessibilityLabel("Add Driver")
                .accessibilityHint("Double tap to add a new driver")
            }
        }
        .sheet(isPresented: $showFilters) {
            ModernDriverFilterView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingAddDriver) {
            Text("Add Driver View - Coming Soon")
                .font(.title)
                .padding()
        }
        .task {
            if viewModel.drivers.isEmpty {
                await viewModel.loadDrivers()
            }
        }
    }

    // MARK: - Helper Methods
    private func deleteDriver(_ driver: Driver) {
        Task {
            let success = await viewModel.deleteDriver(driver)
            if success {
                ModernTheme.Haptics.success()
            } else {
                ModernTheme.Haptics.error()
            }
        }
    }

    private func callDriver(_ driver: Driver) {
        if let url = URL(string: "tel://\(driver.phone.filter { $0.isNumber })") {
            UIApplication.shared.open(url)
        }
    }

    private func emailDriver(_ driver: Driver) {
        if let url = URL(string: "mailto:\(driver.email)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Modern Driver Row
struct ModernDriverRow: View {
    let driver: Driver

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Avatar or Photo
            if let photoURL = driver.photoURL, let url = URL(string: photoURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    DriverInitialsAvatar(driver: driver)
                }
                .frame(width: 56, height: 56)
                .clipShape(Circle())
            } else {
                DriverInitialsAvatar(driver: driver)
            }

            // Driver Info
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                HStack {
                    Text(driver.fullName)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Spacer()

                    DriverStatusBadge(status: driver.status)
                }

                HStack(spacing: ModernTheme.Spacing.xs) {
                    Image(systemName: "number")
                        .font(.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Text(driver.employeeId)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                HStack(spacing: ModernTheme.Spacing.sm) {
                    // Phone
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "phone.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.info)
                        Text(formatPhone(driver.phone))
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    // Email indicator
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "envelope.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.info)
                        Text(driver.email.components(separatedBy: "@").first ?? "")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .lineLimit(1)
                    }
                }

                // Current Assignment
                if let vehicleId = driver.assignedVehicles.first {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "car.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.primary)
                        Text("Assigned to \(vehicleId)")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    }
                }

                // License Warning
                if driver.isLicenseExpiring {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.warning)
                        Text("License expiring soon")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.warning)
                    }
                } else if driver.isLicenseExpired {
                    HStack(spacing: ModernTheme.Spacing.xxs) {
                        Image(systemName: "xmark.octagon.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.error)
                        Text("License expired")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.error)
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

    private func formatPhone(_ phone: String) -> String {
        let cleaned = phone.filter { $0.isNumber }
        if cleaned.count == 10 {
            return "(\(cleaned.prefix(3))) \(cleaned.dropFirst(3).prefix(3))-\(cleaned.suffix(4))"
        }
        return phone
    }
}

// MARK: - Driver Initials Avatar
struct DriverInitialsAvatar: View {
    let driver: Driver

    var body: some View {
        ZStack {
            Circle()
                .fill(driver.status.color.opacity(0.2))

            Text(driver.initials)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(driver.status.color)
        }
        .frame(width: 56, height: 56)
    }
}

// MARK: - Driver Status Badge
struct DriverStatusBadge: View {
    let status: DriverStatus

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xxs) {
            Image(systemName: status.icon)
                .font(.caption2)
            Text(status.displayName)
                .font(ModernTheme.Typography.caption2)
        }
        .padding(.horizontal, ModernTheme.Spacing.sm)
        .padding(.vertical, ModernTheme.Spacing.xxs)
        .background(status.color.opacity(0.15))
        .foregroundColor(status.color)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Active Filters View
struct ModernDriverActiveFiltersView: View {
    @ObservedObject var viewModel: DriversViewModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                if viewModel.selectedFilter != .all {
                    FilterChipView(
                        title: viewModel.selectedFilter.rawValue,
                        icon: viewModel.selectedFilter.icon
                    ) {
                        viewModel.selectedFilter = .all
                        viewModel.applyFiltersAndSort()
                    }
                }

                if viewModel.selectedSortOption != .name {
                    FilterChipView(
                        title: "Sort: \(viewModel.selectedSortOption.rawValue)",
                        icon: viewModel.selectedSortOption.icon
                    ) {
                        viewModel.selectedSortOption = .name
                        viewModel.applyFiltersAndSort()
                    }
                }

                if viewModel.selectedFilter != .all || viewModel.selectedSortOption != .name {
                    Button(action: {
                        viewModel.selectedFilter = .all
                        viewModel.selectedSortOption = .name
                        viewModel.applyFiltersAndSort()
                    }) {
                        Text("Clear All")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.error)
                            .padding(.horizontal, ModernTheme.Spacing.md)
                            .padding(.vertical, ModernTheme.Spacing.xs)
                            .background(ModernTheme.Colors.error.opacity(0.1))
                            .cornerRadius(ModernTheme.CornerRadius.sm)
                    }
                }
            }
        }
    }
}

// MARK: - Filter Chip View
struct FilterChipView: View {
    let title: String
    let icon: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            Image(systemName: icon)
                .font(ModernTheme.Typography.caption2)
            Text(title)
                .font(ModernTheme.Typography.caption1)
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(ModernTheme.Typography.caption2)
            }
        }
        .padding(.horizontal, ModernTheme.Spacing.md)
        .padding(.vertical, ModernTheme.Spacing.xs)
        .background(ModernTheme.Colors.primary.opacity(0.15))
        .foregroundColor(ModernTheme.Colors.primary)
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Statistics Bar
struct ModernDriverStatsBar: View {
    @ObservedObject var viewModel: DriversViewModel

    var body: some View {
        HStack(spacing: 0) {
            StatItemView(
                value: "\(viewModel.totalDrivers)",
                label: "Total",
                color: ModernTheme.Colors.primary
            )

            Divider().frame(height: 30)

            StatItemView(
                value: "\(viewModel.activeDrivers)",
                label: "Active",
                color: ModernTheme.Colors.success
            )

            Divider().frame(height: 30)

            StatItemView(
                value: String(format: "%.0f", viewModel.averageSafetyScore),
                label: "Avg Safety",
                color: ModernTheme.Colors.info
            )

            Divider().frame(height: 30)

            StatItemView(
                value: "\(viewModel.driversWithIncidents)",
                label: "Incidents",
                color: ModernTheme.Colors.warning
            )
        }
        .padding(.horizontal)
        .padding(.vertical, ModernTheme.Spacing.sm)
        .background(Color(.systemGray6))
    }
}

// MARK: - Stat Item View
struct StatItemView: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.xxs) {
            Text(value)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(color)

            Text(label)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Filter View
struct ModernDriverFilterView: View {
    @ObservedObject var viewModel: DriversViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Filter By")) {
                    ForEach(DriverFilter.allCases, id: \.self) { filter in
                        Button(action: {
                            viewModel.selectedFilter = filter
                            viewModel.applyFiltersAndSort()
                        }) {
                            HStack {
                                Image(systemName: filter.icon)
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .frame(width: 30)
                                Text(filter.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                Spacer()
                                if viewModel.selectedFilter == filter {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                Section(header: Text("Sort By")) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Button(action: {
                            viewModel.selectedSortOption = option
                            viewModel.applyFiltersAndSort()
                        }) {
                            HStack {
                                Image(systemName: option.icon)
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .frame(width: 30)
                                Text(option.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                Spacer()
                                if viewModel.selectedSortOption == option {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                Section {
                    Button(action: {
                        viewModel.selectedFilter = .all
                        viewModel.selectedSortOption = .name
                        viewModel.applyFiltersAndSort()
                        dismiss()
                    }) {
                        HStack {
                            Spacer()
                            Text("Reset Filters")
                                .foregroundColor(ModernTheme.Colors.error)
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Filters & Sort")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Empty State
struct ModernEmptyDriverState: View {
    let searchText: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(searchText.isEmpty ? "No Drivers" : "No Results")
                .font(ModernTheme.Typography.title2)

            Text(searchText.isEmpty ?
                 "Add your first driver to get started." :
                 "No drivers match your search criteria.")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Context Menu
struct ModernDriverContextMenu: View {
    let driver: Driver

    var body: some View {
        Button(action: {
            if let url = URL(string: "tel://\(driver.phone.filter { $0.isNumber })") {
                UIApplication.shared.open(url)
            }
        }) {
            Label("Call", systemImage: "phone.fill")
        }

        Button(action: {
            if let url = URL(string: "mailto:\(driver.email)") {
                UIApplication.shared.open(url)
            }
        }) {
            Label("Email", systemImage: "envelope.fill")
        }

        Divider()

        Button(action: {}) {
            Label("Assign Vehicle", systemImage: "car.fill")
        }

        Button(action: {}) {
            Label("View Trips", systemImage: "location.fill")
        }

        Button(action: {}) {
            Label("View Performance", systemImage: "chart.bar.fill")
        }
    }
}

// MARK: - Loading Spinner
struct LoadingSpinnerView: View {
    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            ProgressView()
            Text("Loading drivers...")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

// MARK: - Error Banner
struct ModernErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)

            Text(message)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(.white)
                .lineLimit(2)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(ModernTheme.Colors.error)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .shadow(radius: 5)
    }
}

// MARK: - Animated Appearance Modifier
extension View {
    func animatedAppearance(delay: Double) -> some View {
        modifier(AnimatedAppearanceModifier(delay: delay))
    }
}

struct AnimatedAppearanceModifier: ViewModifier {
    let delay: Double
    @State private var appeared = false

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 20)
            .onAppear {
                withAnimation(.easeOut(duration: 0.3).delay(delay)) {
                    appeared = true
                }
            }
    }
}

// MARK: - Preview
#if DEBUG
struct DriverListView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DriverListView()
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
