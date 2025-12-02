//
//  MapFeaturesView.swift
//  Fleet Manager - Map Features Configuration
//
//  Detailed view for toggling and configuring map features
//  like traffic, POIs, 3D buildings, etc.
//

import SwiftUI

// MARK: - Map Features View

struct MapFeaturesView: View {
    let features: [MapFeature]
    let onToggle: (MapFeature) -> Void

    @State private var searchText = ""
    @State private var selectedCategory: FeatureCategory = .all

    var body: some View {
        VStack(spacing: 0) {
            // Category Filter
            categoryPicker

            // Feature List
            List {
                ForEach(filteredFeatures) { feature in
                    FeatureRow(feature: feature) {
                        onToggle(feature)
                    }
                }

                if filteredFeatures.isEmpty {
                    emptyStateView
                }
            }
            .searchable(text: $searchText, prompt: "Search features")
        }
        .navigationTitle("Map Features")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Category Picker

    private var categoryPicker: some View {
        Picker("Category", selection: $selectedCategory) {
            ForEach(FeatureCategory.allCases) { category in
                Text(category.displayName).tag(category)
            }
        }
        .pickerStyle(.segmented)
        .padding()
        .background(Color(.systemBackground))
    }

    // MARK: - Filtered Features

    private var filteredFeatures: [MapFeature] {
        features.filter { feature in
            // Apply search filter
            let matchesSearch = searchText.isEmpty ||
                feature.name.localizedCaseInsensitiveContains(searchText) ||
                feature.description.localizedCaseInsensitiveContains(searchText)

            // Apply category filter
            let matchesCategory: Bool
            switch selectedCategory {
            case .all:
                matchesCategory = true
            case .display:
                matchesCategory = ["buildings3D", "pointsOfInterest", "traffic", "transit"].contains(feature.id)
            case .controls:
                matchesCategory = ["compass", "scaleBar", "zoomControls", "pitchControl", "rotationGesture"].contains(feature.id)
            case .location:
                matchesCategory = ["userLocation"].contains(feature.id)
            }

            return matchesSearch && matchesCategory
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No Features Found")
                .font(.headline)

            Text("Try adjusting your search or filter")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .listRowBackground(Color.clear)
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    let feature: MapFeature
    let onToggle: () -> Void

    var body: some View {
        Toggle(isOn: Binding(
            get: { feature.enabled },
            set: { _ in onToggle() }
        )) {
            HStack(spacing: 12) {
                // Icon
                ZStack {
                    Circle()
                        .fill(feature.enabled ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1))
                        .frame(width: 40, height: 40)

                    Image(systemName: feature.icon)
                        .foregroundColor(feature.enabled ? .blue : .secondary)
                }

                // Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(feature.name)
                        .font(.body)
                        .fontWeight(.medium)

                    Text(feature.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
        .toggleStyle(SwitchToggleStyle(tint: .blue))
    }
}

// MARK: - Feature Category

enum FeatureCategory: String, CaseIterable, Identifiable {
    case all = "all"
    case display = "display"
    case controls = "controls"
    case location = "location"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .all:
            return "All"
        case .display:
            return "Display"
        case .controls:
            return "Controls"
        case .location:
            return "Location"
        }
    }
}

// MARK: - Feature Details View

struct FeatureDetailsView: View {
    let feature: MapFeature
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                // Header Section
                Section {
                    HStack {
                        Image(systemName: feature.icon)
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                            .frame(width: 80, height: 80)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)

                        VStack(alignment: .leading, spacing: 8) {
                            Text(feature.name)
                                .font(.title2)
                                .fontWeight(.bold)

                            HStack {
                                Circle()
                                    .fill(feature.enabled ? Color.green : Color.gray)
                                    .frame(width: 8, height: 8)

                                Text(feature.enabled ? "Enabled" : "Disabled")
                                    .font(.subheadline)
                                    .foregroundColor(feature.enabled ? .green : .gray)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Description Section
                Section {
                    Text(feature.description)
                        .font(.body)
                } header: {
                    Text("Description")
                }

                // Feature Details
                Section {
                    DetailRow(label: "Feature ID", value: feature.id)
                    DetailRow(label: "Status", value: feature.enabled ? "Active" : "Inactive")
                } header: {
                    Text("Details")
                }

                // Usage Tips
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        TipRow(
                            icon: "lightbulb.fill",
                            text: getUsageTip()
                        )

                        if let requirement = getRequirement() {
                            TipRow(
                                icon: "exclamationmark.triangle.fill",
                                text: requirement,
                                color: .orange
                            )
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Tips & Requirements")
                }
            }
            .navigationTitle("Feature Info")
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

    private func getUsageTip() -> String {
        switch feature.id {
        case "traffic":
            return "Traffic data updates in real-time and shows current road conditions with color-coded overlay"
        case "buildings3D":
            return "3D buildings provide better spatial awareness in urban areas. Tilt the map to see them"
        case "pointsOfInterest":
            return "POIs include restaurants, gas stations, landmarks, and other useful locations"
        case "transit":
            return "Transit shows public transportation routes, stops, and stations"
        case "compass":
            return "The compass appears when the map is rotated. Tap it to return to north-up orientation"
        case "scaleBar":
            return "Scale bar helps estimate distances on the map at current zoom level"
        case "userLocation":
            return "Shows your current location with a blue dot. Requires location permissions"
        case "pitchControl":
            return "Use two-finger drag up/down to tilt the map for 3D perspective"
        case "rotationGesture":
            return "Use two-finger rotation to change map orientation"
        case "zoomControls":
            return "On-screen buttons for precise zoom control"
        default:
            return "Enable this feature for enhanced map functionality"
        }
    }

    private func getRequirement() -> String? {
        switch feature.id {
        case "userLocation":
            return "Requires location permissions enabled in Settings"
        case "traffic":
            return "Requires internet connection for real-time data"
        case "buildings3D":
            return "Only available in supported areas with 3D data"
        default:
            return nil
        }
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Tip Row

struct TipRow: View {
    let icon: String
    let text: String
    var color: Color = .blue

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(text)
                .font(.subheadline)
                .foregroundColor(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MapFeaturesView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            MapFeaturesView(
                features: [
                    MapFeature.traffic,
                    MapFeature.buildings3D,
                    MapFeature.pointsOfInterest,
                    MapFeature.transit,
                    MapFeature.compass,
                    MapFeature.scaleBar,
                    MapFeature.userLocation,
                    MapFeature.pitchControl,
                    MapFeature.rotationGesture,
                    MapFeature.zoomControls
                ],
                onToggle: { feature in
                    print("Toggled: \(feature.name)")
                }
            )
        }

        NavigationView {
            FeatureDetailsView(feature: MapFeature.traffic)
        }
    }
}
#endif
