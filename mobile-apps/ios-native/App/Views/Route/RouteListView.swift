import SwiftUI
import MapKit

struct RouteListView: View {
    @StateObject private var viewModel = RouteViewModel()
    @State private var showingFilterSheet = false
    @State private var showingSortSheet = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading && viewModel.routes.isEmpty {
                    ProgressView("Loading routes...")
                } else if viewModel.routes.isEmpty {
                    emptyStateView
                } else {
                    routeListContent
                }
            }
            .navigationTitle("Routes")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    filterButton
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        sortButton
                        addButton
                    }
                }
            }
            .searchable(text: $viewModel.searchText, prompt: "Search routes...")
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $viewModel.showingAddRoute) {
                AddRouteView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilterSheet) {
                filterSheet
            }
            .sheet(isPresented: $showingSortSheet) {
                sortSheet
            }
        }
    }

    // MARK: - Route List Content
    private var routeListContent: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                // Statistics Card
                if let stats = viewModel.statistics {
                    statisticsCard(stats)
                }

                // Quick Filters
                quickFiltersRow

                // Routes List
                LazyVStack(spacing: ModernTheme.Spacing.md) {
                    ForEach(viewModel.filteredAndSortedRoutes) { route in
                        NavigationLink(destination: RouteDetailView(route: route, viewModel: viewModel)) {
                            RouteCard(route: route, viewModel: viewModel)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .background(ModernTheme.Colors.groupedBackground)
    }

    // MARK: - Statistics Card
    private func statisticsCard(_ stats: RouteStatistics) -> some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                Text("Route Statistics")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                Spacer()
            }

            HStack(spacing: ModernTheme.Spacing.lg) {
                StatItem(
                    icon: "map.fill",
                    value: "\(stats.totalRoutes)",
                    label: "Total",
                    color: .blue
                )

                Divider()

                StatItem(
                    icon: "star.fill",
                    value: "\(stats.favoriteRoutes)",
                    label: "Favorites",
                    color: .orange
                )

                Divider()

                StatItem(
                    icon: "arrow.triangle.2.circlepath",
                    value: "\(stats.totalUsages)",
                    label: "Usages",
                    color: .green
                )

                Divider()

                StatItem(
                    icon: "road.lanes",
                    value: stats.formattedTotalDistance,
                    label: "Total",
                    color: .purple
                )
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

    // MARK: - Quick Filters Row
    private var quickFiltersRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(RouteFilterOption.allCases, id: \.self) { option in
                    FilterChip(
                        title: option.rawValue,
                        icon: option.icon,
                        isSelected: viewModel.filterOption == option
                    ) {
                        withAnimation {
                            viewModel.filterOption = option
                        }
                        ModernTheme.Haptics.selection()
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: ModernTheme.Spacing.xl) {
            Image(systemName: "map.fill")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Routes Yet")
                .font(ModernTheme.Typography.title2)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text("Create your first route to start planning efficient trips")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: {
                viewModel.showingAddRoute = true
            }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Create Route")
                }
                .font(ModernTheme.Typography.bodyBold)
            }
            .primaryButton()
            .padding(.horizontal, 40)
        }
    }

    // MARK: - Toolbar Buttons
    private var filterButton: some View {
        Button(action: {
            showingFilterSheet = true
            ModernTheme.Haptics.light()
        }) {
            Image(systemName: "line.3.horizontal.decrease.circle")
                .font(.title3)
        }
    }

    private var sortButton: some View {
        Button(action: {
            showingSortSheet = true
            ModernTheme.Haptics.light()
        }) {
            Image(systemName: "arrow.up.arrow.down.circle")
                .font(.title3)
        }
    }

    private var addButton: some View {
        Button(action: {
            viewModel.showingAddRoute = true
            ModernTheme.Haptics.medium()
        }) {
            Image(systemName: "plus.circle.fill")
                .font(.title3)
        }
    }

    // MARK: - Filter Sheet
    private var filterSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Filter By")) {
                    ForEach(RouteFilterOption.allCases, id: \.self) { option in
                        Button(action: {
                            viewModel.filterOption = option
                            showingFilterSheet = false
                            ModernTheme.Haptics.selection()
                        }) {
                            HStack {
                                Image(systemName: option.icon)
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .frame(width: 30)
                                Text(option.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                Spacer()
                                if viewModel.filterOption == option {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filter Routes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilterSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Sort Sheet
    private var sortSheet: some View {
        NavigationView {
            List {
                Section(header: Text("Sort By")) {
                    ForEach(RouteSortOption.allCases, id: \.self) { option in
                        Button(action: {
                            viewModel.sortOption = option
                            showingSortSheet = false
                            ModernTheme.Haptics.selection()
                        }) {
                            HStack {
                                Image(systemName: option.icon)
                                    .foregroundColor(ModernTheme.Colors.primary)
                                    .frame(width: 30)
                                Text(option.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                Spacer()
                                if viewModel.sortOption == option {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Sort Routes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingSortSheet = false
                    }
                }
            }
        }
    }
}

// MARK: - Route Card
struct RouteCard: View {
    let route: Route
    @ObservedObject var viewModel: RouteViewModel

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(route.name)
                            .font(ModernTheme.Typography.headline)
                            .foregroundColor(ModernTheme.Colors.primaryText)

                        if route.isFavorite {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                        }
                    }

                    if let description = route.description {
                        Text(description)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .lineLimit(1)
                    }
                }

                Spacer()

                // Quick actions
                Button(action: {
                    Task {
                        await viewModel.toggleFavorite(for: route)
                    }
                }) {
                    Image(systemName: route.isFavorite ? "star.fill" : "star")
                        .foregroundColor(route.isFavorite ? .yellow : ModernTheme.Colors.secondaryText)
                        .font(.title3)
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Route info
            HStack(spacing: ModernTheme.Spacing.lg) {
                InfoBadge(icon: "mappin.circle.fill", text: route.origin?.name ?? "Unknown", color: .green)
                Image(systemName: "arrow.right")
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .font(.caption)
                InfoBadge(icon: "flag.checkered", text: route.destination?.name ?? "Unknown", color: .red)
            }
            .font(ModernTheme.Typography.caption1)

            // Metrics
            HStack(spacing: ModernTheme.Spacing.xl) {
                MetricItem(icon: "road.lanes", value: route.formattedDistance)
                MetricItem(icon: "clock", value: route.formattedDuration)
                MetricItem(icon: "mappin.and.ellipse", value: "\(route.waypoints.count) stops")

                if route.usageCount > 0 {
                    MetricItem(icon: "arrow.triangle.2.circlepath", value: "\(route.usageCount)x")
                }
            }

            // Traffic condition if enabled
            if route.trafficEnabled, let traffic = route.currentTrafficCondition {
                HStack(spacing: ModernTheme.Spacing.sm) {
                    Image(systemName: traffic.icon)
                        .foregroundColor(traffic.color)
                    Text("Traffic: \(traffic.rawValue)")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    Spacer()

                    if let lastUsed = route.formattedLastUsed {
                        Text("Used \(lastUsed)")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    }
                }
            } else if let lastUsed = route.formattedLastUsed {
                HStack {
                    Spacer()
                    Text("Used \(lastUsed)")
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
        .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
    }
}

// MARK: - Supporting Views
struct StatItem: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Text(label)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
    }
}

struct FilterChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(ModernTheme.Typography.caption1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                    .fill(isSelected ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryBackground)
            )
            .foregroundColor(isSelected ? .white : ModernTheme.Colors.primaryText)
        }
    }
}

struct InfoBadge: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(text)
                .foregroundColor(ModernTheme.Colors.primaryText)
        }
        .lineLimit(1)
    }
}

struct MetricItem: View {
    let icon: String
    let value: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(ModernTheme.Colors.primary)
            Text(value)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .font(ModernTheme.Typography.caption1)
    }
}

#Preview {
    RouteListView()
}
