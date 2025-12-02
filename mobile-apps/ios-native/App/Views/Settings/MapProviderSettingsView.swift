//
//  MapProviderSettingsView.swift
//  Fleet Manager - Map Provider Settings UI
//
//  Main configuration interface for map provider selection,
//  style customization, and feature management
//

import SwiftUI
import MapKit

// MARK: - Map Provider Settings View

struct MapProviderSettingsView: View {
    @StateObject private var viewModel = MapProviderSettingsViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showingResetConfirmation = false
    @State private var selectedProviderForAPIKey: MapProvider?

    var body: some View {
        NavigationView {
            List {
                // Provider Selection Section
                providerSelectionSection

                // Style Selection Section
                if !viewModel.availableStyles.isEmpty {
                    styleSelectionSection
                }

                // Features Section
                if !viewModel.availableFeatures.isEmpty {
                    featuresSection
                }

                // Offline Maps Section
                if viewModel.providerFeatures.supportsOfflineMaps {
                    offlineMapsSection
                }

                // Camera Settings Section
                cameraSettingsSection

                // Display Settings Section
                displaySettingsSection

                // Provider Comparison Section
                providerComparisonSection

                // Reset Section
                resetSection
            }
            .navigationTitle("Map Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .sheet(item: $selectedProviderForAPIKey) { provider in
                APIKeyInputView(provider: provider) { key in
                    viewModel.setAPIKey(key, for: provider)
                    selectedProviderForAPIKey = nil
                }
            }
            .sheet(isPresented: $viewModel.showingStylePreview) {
                MapStylePreviewView(
                    provider: viewModel.selectedProvider,
                    styles: viewModel.availableStyles,
                    selectedStyle: viewModel.selectedStyle
                ) { style in
                    viewModel.changeStyle(style)
                }
            }
            .alert("Reset to Defaults", isPresented: $showingResetConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Reset", role: .destructive) {
                    viewModel.resetToDefaults()
                }
            } message: {
                Text("This will reset all map settings to their default values. This action cannot be undone.")
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
        }
    }

    // MARK: - Provider Selection Section

    private var providerSelectionSection: some View {
        Section {
            ForEach(MapProvider.allCases) { provider in
                Button {
                    if provider.requiresAPIKey && !viewModel.hasValidAPIKey(for: provider) {
                        selectedProviderForAPIKey = provider
                    } else {
                        viewModel.changeProvider(provider)
                    }
                } label: {
                    HStack(spacing: 12) {
                        // Provider Icon
                        Image(systemName: provider.icon)
                            .font(.title2)
                            .foregroundColor(provider == viewModel.selectedProvider ? .blue : .secondary)
                            .frame(width: 32)

                        // Provider Info
                        VStack(alignment: .leading, spacing: 4) {
                            Text(provider.displayName)
                                .font(.headline)
                                .foregroundColor(.primary)

                            Text(provider.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }

                        Spacer()

                        // Status Indicators
                        VStack(alignment: .trailing, spacing: 4) {
                            // API Key Status
                            if provider.requiresAPIKey {
                                if viewModel.hasValidAPIKey(for: provider) {
                                    Label("Configured", systemImage: "checkmark.circle.fill")
                                        .font(.caption)
                                        .foregroundColor(.green)
                                } else {
                                    Label("API Key", systemImage: "key.fill")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                }
                            }

                            // Selection Indicator
                            if provider == viewModel.selectedProvider {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        } header: {
            Text("Map Provider")
        } footer: {
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundColor(.red)
            } else if let success = viewModel.successMessage {
                Text(success)
                    .foregroundColor(.green)
            } else {
                Text("Current: \(viewModel.selectedProvider.displayName) - \(viewModel.configurationStatus)")
            }
        }
    }

    // MARK: - Style Selection Section

    private var styleSelectionSection: some View {
        Section {
            // Current Style Display
            HStack {
                Image(systemName: viewModel.selectedStyle.icon)
                    .foregroundColor(.blue)
                Text(viewModel.selectedStyle.displayName)
                    .font(.body)
                Spacer()
                Button {
                    viewModel.showingStylePreview = true
                } label: {
                    Text("Preview")
                        .font(.subheadline)
                }
            }

            // Style Grid
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 12) {
                ForEach(viewModel.availableStyles) { style in
                    Button {
                        viewModel.changeStyle(style)
                    } label: {
                        VStack(spacing: 8) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(style == viewModel.selectedStyle ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1))
                                    .frame(height: 80)

                                Image(systemName: style.icon)
                                    .font(.title)
                                    .foregroundColor(style == viewModel.selectedStyle ? .blue : .secondary)
                            }

                            Text(style.displayName)
                                .font(.caption)
                                .foregroundColor(.primary)
                        }
                    }
                }
            }
            .padding(.vertical, 8)
        } header: {
            Text("Map Style")
        } footer: {
            Text(viewModel.selectedStyle.description)
        }
    }

    // MARK: - Features Section

    private var featuresSection: some View {
        Section {
            NavigationLink {
                MapFeaturesView(
                    features: viewModel.availableFeatures,
                    onToggle: { feature in
                        viewModel.toggleFeature(feature)
                    }
                )
            } label: {
                HStack {
                    Image(systemName: "slider.horizontal.3")
                        .foregroundColor(.blue)
                    Text("Map Features")
                    Spacer()
                    Text("\(viewModel.availableFeatures.filter(\.enabled).count)/\(viewModel.availableFeatures.count)")
                        .foregroundColor(.secondary)
                        .font(.subheadline)
                }
            }

            // Quick toggles for common features
            ForEach(viewModel.availableFeatures.prefix(3)) { feature in
                Toggle(isOn: Binding(
                    get: { feature.enabled },
                    set: { _ in viewModel.toggleFeature(feature) }
                )) {
                    HStack {
                        Image(systemName: feature.icon)
                            .foregroundColor(.blue)
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(feature.name)
                                .font(.body)
                            Text(feature.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        } header: {
            Text("Features")
        } footer: {
            Text("\(viewModel.providerFeatures.supportedFeatures.count) features available for \(viewModel.selectedProvider.displayName)")
        }
    }

    // MARK: - Offline Maps Section

    private var offlineMapsSection: some View {
        Section {
            Toggle(isOn: $viewModel.offlineMapsEnabled) {
                HStack {
                    Image(systemName: "arrow.down.circle.fill")
                        .foregroundColor(.green)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Offline Maps")
                            .font(.body)
                        Text("Download maps for offline use")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            if viewModel.offlineMapsEnabled {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Cache Size")
                            .font(.subheadline)
                        Spacer()
                        Text("\(viewModel.offlineCacheSizeMB) MB")
                            .foregroundColor(.secondary)
                    }

                    Slider(
                        value: Binding(
                            get: { Double(viewModel.offlineCacheSizeMB) },
                            set: { viewModel.offlineCacheSizeMB = Int($0) }
                        ),
                        in: 100...Double(viewModel.maxCacheSizeMB),
                        step: 50
                    )

                    HStack {
                        Text("100 MB")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(viewModel.maxCacheSizeMB) MB")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        } header: {
            Text("Offline Maps")
        } footer: {
            if viewModel.offlineMapsEnabled {
                Text("Maps will be cached up to \(viewModel.offlineCacheSizeMB) MB for offline access")
            } else {
                Text("Enable offline maps to download and use maps without internet connection")
            }
        }
    }

    // MARK: - Camera Settings Section

    private var cameraSettingsSection: some View {
        Section {
            // Zoom Level
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Default Zoom Level")
                        .font(.subheadline)
                    Spacer()
                    Text(String(format: "%.1f", viewModel.defaultZoomLevel))
                        .foregroundColor(.secondary)
                }

                Slider(value: $viewModel.defaultZoomLevel, in: 1...20, step: 0.5)
            }

            // Pitch
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Default Pitch")
                        .font(.subheadline)
                    Spacer()
                    Text("\(Int(viewModel.defaultPitch))°")
                        .foregroundColor(.secondary)
                }

                Slider(value: $viewModel.defaultPitch, in: 0...60, step: 5)
            }

            // Heading
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Default Heading")
                        .font(.subheadline)
                    Spacer()
                    Text("\(Int(viewModel.defaultHeading))°")
                        .foregroundColor(.secondary)
                }

                Slider(value: $viewModel.defaultHeading, in: 0...360, step: 15)
            }
        } header: {
            Text("Camera Settings")
        } footer: {
            Text("Default camera position when opening map views")
        }
    }

    // MARK: - Display Settings Section

    private var displaySettingsSection: some View {
        Section {
            Toggle(isOn: $viewModel.followUserLocation) {
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundColor(.blue)
                    Text("Follow User Location")
                }
            }

            Toggle(isOn: $viewModel.autoRotateEnabled) {
                HStack {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .foregroundColor(.purple)
                    Text("Auto-Rotate with Heading")
                }
            }

            Toggle(isOn: $viewModel.showsScale) {
                HStack {
                    Image(systemName: "ruler.fill")
                        .foregroundColor(.orange)
                    Text("Show Scale Bar")
                }
            }

            Toggle(isOn: $viewModel.showsCompass) {
                HStack {
                    Image(systemName: "location.north.fill")
                        .foregroundColor(.red)
                    Text("Show Compass")
                }
            }
        } header: {
            Text("Display Options")
        }
    }

    // MARK: - Provider Comparison Section

    private var providerComparisonSection: some View {
        Section {
            NavigationLink {
                ProviderComparisonView(
                    providers: viewModel.getProviderComparison(),
                    onSelectProvider: { provider in
                        if provider.requiresAPIKey && !viewModel.hasValidAPIKey(for: provider) {
                            selectedProviderForAPIKey = provider
                        } else {
                            viewModel.changeProvider(provider)
                        }
                    }
                )
            } label: {
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .foregroundColor(.purple)
                    Text("Compare Providers")
                }
            }
        } header: {
            Text("Information")
        }
    }

    // MARK: - Reset Section

    private var resetSection: some View {
        Section {
            Button(role: .destructive) {
                showingResetConfirmation = true
            } label: {
                HStack {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Reset to Defaults")
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Provider Comparison View

struct ProviderComparisonView: View {
    let providers: [ProviderComparisonRow]
    let onSelectProvider: (MapProvider) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            ForEach(providers) { row in
                Button {
                    onSelectProvider(row.provider)
                    dismiss()
                } label: {
                    VStack(spacing: 12) {
                        // Header
                        HStack {
                            Image(systemName: row.provider.icon)
                                .font(.title2)
                                .foregroundColor(row.isSelected ? .blue : .secondary)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(row.provider.displayName)
                                    .font(.headline)
                                    .foregroundColor(.primary)

                                HStack(spacing: 4) {
                                    Image(systemName: row.statusIcon)
                                        .font(.caption)
                                    Text(row.requiresAPIKey ? (row.hasValidKey ? "Configured" : "Needs API Key") : "Ready")
                                        .font(.caption)
                                }
                                .foregroundColor(row.statusColor)
                            }

                            Spacer()

                            if row.isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }

                        // Features Grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            FeatureTag(icon: "map.fill", text: "\(row.featureCount) features")
                            FeatureTag(icon: "arrow.up.left.and.arrow.down.right", text: "Zoom: \(row.maxZoom)")
                            if row.supportsOffline {
                                FeatureTag(icon: "arrow.down.circle", text: "Offline", color: .green)
                            }
                            if row.supportsCustomStyles {
                                FeatureTag(icon: "paintbrush", text: "Custom styles", color: .purple)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .navigationTitle("Compare Providers")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Feature Tag

struct FeatureTag: View {
    let icon: String
    let text: String
    var color: Color = .blue

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
            Text(text)
                .font(.caption2)
        }
        .foregroundColor(color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Preview

#if DEBUG
struct MapProviderSettingsView_Previews: PreviewProvider {
    static var previews: some View {
        MapProviderSettingsView()
    }
}
#endif
