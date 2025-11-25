//
//  LayerPickerView.swift
//  Fleet Manager
//
//  Bottom sheet for selecting and configuring map layers
//

import SwiftUI
import MapKit

struct LayerPickerView: View {
    @ObservedObject var viewModel: MapLayersViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Quick Actions
                    QuickActionsSection(viewModel: viewModel)

                    // Base Map Type
                    BaseMapSection(viewModel: viewModel)

                    // Data Layers
                    DataLayersSection(viewModel: viewModel)

                    // Auto-Refresh Settings
                    AutoRefreshSection(viewModel: viewModel)

                    // Statistics
                    if hasActiveDataLayers {
                        StatisticsSection(viewModel: viewModel)
                    }
                }
                .padding()
            }
            .background(ModernTheme.Colors.groupedBackground.ignoresSafeArea())
            .navigationTitle("Map Layers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        viewModel.clearAllLayers()
                        ModernTheme.Haptics.medium()
                    }
                    .foregroundColor(.red)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private var hasActiveDataLayers: Bool {
        viewModel.availableLayers.contains(where: { $0.isEnabled && $0.type.requiresDataFetch })
    }
}

// MARK: - Quick Actions Section

struct QuickActionsSection: View {
    @ObservedObject var viewModel: MapLayersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Quick Actions")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: ModernTheme.Spacing.sm) {
                QuickActionButton(
                    icon: "car.fill",
                    title: "Traffic Only",
                    color: .orange,
                    action: viewModel.showTrafficOnly
                )

                QuickActionButton(
                    icon: "cloud.sun.fill",
                    title: "Weather Only",
                    color: .blue,
                    action: viewModel.showWeatherOnly
                )

                QuickActionButton(
                    icon: "exclamationmark.triangle.fill",
                    title: "All Alerts",
                    color: .red,
                    action: viewModel.showAllAlerts
                )

                QuickActionButton(
                    icon: "xmark.circle.fill",
                    title: "Clear All",
                    color: .gray,
                    action: viewModel.clearAllLayers
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(title)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(color.opacity(0.1))
            )
        }
    }
}

// MARK: - Base Map Section

struct BaseMapSection: View {
    @ObservedObject var viewModel: MapLayersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Base Map Type")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            VStack(spacing: 0) {
                LayerToggleRow(
                    layer: getLayer(.terrain),
                    isEnabled: viewModel.isLayerEnabled(.terrain),
                    onToggle: { viewModel.toggleLayer(.terrain) }
                )

                Divider().padding(.leading, 52)

                LayerToggleRow(
                    layer: getLayer(.satellite),
                    isEnabled: viewModel.isLayerEnabled(.satellite),
                    onToggle: { viewModel.toggleLayer(.satellite) }
                )

                Divider().padding(.leading, 52)

                LayerToggleRow(
                    layer: getLayer(.hybrid),
                    isEnabled: viewModel.isLayerEnabled(.hybrid),
                    onToggle: { viewModel.toggleLayer(.hybrid) }
                )
            }
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.background)
            )

            Text("Select one base map type at a time")
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .padding(.horizontal)
        }
    }

    private func getLayer(_ type: MapLayerType) -> MapLayer {
        viewModel.availableLayers.first(where: { $0.type == type })!
    }
}

// MARK: - Data Layers Section

struct DataLayersSection: View {
    @ObservedObject var viewModel: MapLayersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Data Layers")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            VStack(spacing: 0) {
                LayerToggleRow(
                    layer: getLayer(.traffic),
                    isEnabled: viewModel.isLayerEnabled(.traffic),
                    onToggle: { viewModel.toggleLayer(.traffic) },
                    showOpacitySlider: true,
                    opacity: viewModel.getLayerOpacity(.traffic),
                    onOpacityChange: { opacity in
                        viewModel.setLayerOpacity(.traffic, opacity: opacity)
                    },
                    isLoading: viewModel.isLoadingTraffic
                )

                Divider().padding(.leading, 52)

                LayerToggleRow(
                    layer: getLayer(.weather),
                    isEnabled: viewModel.isLayerEnabled(.weather),
                    onToggle: { viewModel.toggleLayer(.weather) },
                    showOpacitySlider: true,
                    opacity: viewModel.getLayerOpacity(.weather),
                    onOpacityChange: { opacity in
                        viewModel.setLayerOpacity(.weather, opacity: opacity)
                    },
                    isLoading: viewModel.isLoadingWeather
                )

                Divider().padding(.leading, 52)

                LayerToggleRow(
                    layer: getLayer(.incidents),
                    isEnabled: viewModel.isLayerEnabled(.incidents),
                    onToggle: { viewModel.toggleLayer(.incidents) },
                    isLoading: viewModel.isLoadingIncidents
                )

                Divider().padding(.leading, 52)

                LayerToggleRow(
                    layer: getLayer(.construction),
                    isEnabled: viewModel.isLayerEnabled(.construction),
                    onToggle: { viewModel.toggleLayer(.construction) },
                    isLoading: viewModel.isLoadingIncidents
                )
            }
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.background)
            )
        }
    }

    private func getLayer(_ type: MapLayerType) -> MapLayer {
        viewModel.availableLayers.first(where: { $0.type == type })!
    }
}

// MARK: - Layer Toggle Row

struct LayerToggleRow: View {
    let layer: MapLayer
    let isEnabled: Bool
    let onToggle: () -> Void
    var showOpacitySlider: Bool = false
    var opacity: Double = 1.0
    var onOpacityChange: ((Double) -> Void)? = nil
    var isLoading: Bool = false

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Icon
                Image(systemName: layer.type.icon)
                    .font(.title3)
                    .foregroundColor(iconColor)
                    .frame(width: 32, height: 32)

                // Name and Description
                VStack(alignment: .leading, spacing: 2) {
                    Text(layer.name)
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    if layer.type.requiresDataFetch {
                        Text("Auto-refreshes every \(Int(layer.refreshInterval / 60)) min")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                // Loading Indicator
                if isLoading && isEnabled {
                    ProgressView()
                        .scaleEffect(0.8)
                }

                // Toggle
                Toggle("", isOn: Binding(
                    get: { isEnabled },
                    set: { _ in onToggle() }
                ))
                .labelsHidden()
            }
            .padding(ModernTheme.Spacing.md)

            // Opacity Slider
            if showOpacitySlider && isEnabled {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Opacity")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Spacer()

                        Text("\(Int(opacity * 100))%")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.primary)
                            .fontWeight(.semibold)
                    }

                    Slider(
                        value: Binding(
                            get: { opacity },
                            set: { newValue in
                                onOpacityChange?(newValue)
                            }
                        ),
                        in: 0.1...1.0,
                        step: 0.1
                    )
                    .tint(ModernTheme.Colors.primary)
                }
                .padding(.horizontal, ModernTheme.Spacing.md)
                .padding(.bottom, ModernTheme.Spacing.sm)
            }
        }
        .background(ModernTheme.Colors.background)
    }

    private var iconColor: Color {
        if !isEnabled {
            return ModernTheme.Colors.tertiaryText
        }

        switch layer.type {
        case .traffic:
            return .orange
        case .weather:
            return .blue
        case .terrain:
            return .green
        case .satellite:
            return .purple
        case .hybrid:
            return .indigo
        case .incidents:
            return .red
        case .construction:
            return .yellow
        }
    }
}

// MARK: - Auto-Refresh Section

struct AutoRefreshSection: View {
    @ObservedObject var viewModel: MapLayersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack(spacing: ModernTheme.Spacing.md) {
                Image(systemName: "arrow.clockwise.circle.fill")
                    .font(.title3)
                    .foregroundColor(viewModel.autoRefreshEnabled ? .green : .gray)
                    .frame(width: 32, height: 32)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Auto-Refresh")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text("Automatically update traffic and weather data")
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                Toggle("", isOn: Binding(
                    get: { viewModel.autoRefreshEnabled },
                    set: { _ in viewModel.toggleAutoRefresh() }
                ))
                .labelsHidden()
            }
            .padding(ModernTheme.Spacing.md)
        }
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
        )
    }
}

// MARK: - Statistics Section

struct StatisticsSection: View {
    @ObservedObject var viewModel: MapLayersViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Current Conditions")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            VStack(spacing: ModernTheme.Spacing.xs) {
                if viewModel.isLayerEnabled(.traffic) {
                    StatisticRow(
                        icon: "car.fill",
                        label: "Heavy Traffic Segments",
                        value: "\(viewModel.heavyTrafficSegmentCount)",
                        color: .orange
                    )
                }

                if viewModel.isLayerEnabled(.weather) {
                    StatisticRow(
                        icon: "exclamationmark.triangle.fill",
                        label: "Severe Weather Alerts",
                        value: "\(viewModel.severeWeatherAlertCount)",
                        color: .red
                    )
                }

                if viewModel.isLayerEnabled(.incidents) || viewModel.isLayerEnabled(.construction) {
                    StatisticRow(
                        icon: "exclamationmark.octagon.fill",
                        label: "Active Incidents",
                        value: "\(viewModel.activeIncidentCount)",
                        color: .red
                    )
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.background)
            )
        }
    }
}

struct StatisticRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(label)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(color)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview

#if DEBUG
struct LayerPickerView_Previews: PreviewProvider {
    static var previews: some View {
        LayerPickerView(viewModel: MapLayersViewModel())
    }
}
#endif
