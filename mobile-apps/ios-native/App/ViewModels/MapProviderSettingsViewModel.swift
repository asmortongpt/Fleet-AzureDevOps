//
//  MapProviderSettingsViewModel.swift
//  Fleet Manager - Map Provider Settings ViewModel
//
//  Manages map provider configuration UI state and business logic
//

import Foundation
import SwiftUI
import Combine

// MARK: - Map Provider Settings View Model

@MainActor
class MapProviderSettingsViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var selectedProvider: MapProvider
    @Published var selectedStyle: MapStyle
    @Published var availableStyles: [MapStyle] = []
    @Published var availableFeatures: [MapFeature] = []
    @Published var providerFeatures: ProviderFeatures
    @Published var apiKeys: [MapProvider: MapAPIKey] = [:]
    @Published var isLoading = false
    @Published var showingAPIKeyInput = false
    @Published var showingStylePreview = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    // Offline settings
    @Published var offlineMapsEnabled: Bool
    @Published var offlineCacheSizeMB: Int
    @Published var maxCacheSizeMB: Int = 500

    // Map camera settings
    @Published var defaultZoomLevel: Double
    @Published var defaultPitch: Double
    @Published var defaultHeading: Double
    @Published var followUserLocation: Bool
    @Published var autoRotateEnabled: Bool
    @Published var showsScale: Bool
    @Published var showsCompass: Bool

    // MARK: - Private Properties

    private let manager = MapProviderManager.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    init() {
        // Initialize from manager's current state
        self.selectedProvider = manager.currentProvider
        self.selectedStyle = manager.currentStyle
        self.providerFeatures = ProviderFeatures.features(for: manager.currentProvider)
        self.availableStyles = providerFeatures.availableStyles
        self.availableFeatures = manager.getAvailableFeatures()

        // Initialize offline settings
        self.offlineMapsEnabled = manager.preferences.offlineMapsEnabled
        self.offlineCacheSizeMB = manager.preferences.offlineCacheSizeMB
        self.maxCacheSizeMB = providerFeatures.maxOfflineCacheSizeMB

        // Initialize camera settings
        self.defaultZoomLevel = manager.preferences.defaultZoomLevel
        self.defaultPitch = manager.preferences.defaultPitch
        self.defaultHeading = manager.preferences.defaultHeading
        self.followUserLocation = manager.preferences.followUserLocation
        self.autoRotateEnabled = manager.preferences.autoRotateEnabled
        self.showsScale = manager.preferences.showsScale
        self.showsCompass = manager.preferences.showsCompass

        setupObservers()
    }

    // MARK: - Setup

    private func setupObservers() {
        // Monitor manager's provider changes
        manager.$currentProvider
            .sink { [weak self] provider in
                self?.selectedProvider = provider
                self?.updateProviderFeatures()
            }
            .store(in: &cancellables)

        // Monitor manager's style changes
        manager.$currentStyle
            .sink { [weak self] style in
                self?.selectedStyle = style
            }
            .store(in: &cancellables)

        // Monitor manager's API keys
        manager.$apiKeys
            .sink { [weak self] apiKeys in
                self?.apiKeys = apiKeys
            }
            .store(in: &cancellables)

        // Monitor manager's error messages
        manager.$errorMessage
            .sink { [weak self] error in
                self?.errorMessage = error
            }
            .store(in: &cancellables)

        // Auto-save offline settings
        Publishers.CombineLatest($offlineMapsEnabled, $offlineCacheSizeMB)
            .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
            .sink { [weak self] enabled, size in
                self?.saveOfflineSettings(enabled: enabled, cacheSizeMB: size)
            }
            .store(in: &cancellables)

        // Auto-save camera settings
        Publishers.CombineLatest4(
            $defaultZoomLevel,
            $defaultPitch,
            $defaultHeading,
            $followUserLocation
        )
        .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
        .sink { [weak self] zoom, pitch, heading, follow in
            self?.saveCameraSettings(
                zoom: zoom,
                pitch: pitch,
                heading: heading,
                follow: follow
            )
        }
        .store(in: &cancellables)

        // Auto-save display settings
        Publishers.CombineLatest3(
            $autoRotateEnabled,
            $showsScale,
            $showsCompass
        )
        .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
        .sink { [weak self] autoRotate, scale, compass in
            self?.saveDisplaySettings(
                autoRotate: autoRotate,
                scale: scale,
                compass: compass
            )
        }
        .store(in: &cancellables)
    }

    // MARK: - Provider Management

    /// Change the map provider
    func changeProvider(_ provider: MapProvider) {
        Task {
            isLoading = true
            errorMessage = nil

            // Check if API key is required
            if provider.requiresAPIKey && apiKeys[provider]?.isValid != true {
                showingAPIKeyInput = true
                isLoading = false
                return
            }

            await manager.switchProvider(provider)
            updateProviderFeatures()
            isLoading = false
            successMessage = "Switched to \(provider.displayName)"
            clearSuccessMessageAfterDelay()
        }
    }

    /// Change the map style
    func changeStyle(_ style: MapStyle) {
        Task {
            isLoading = true
            errorMessage = nil

            await manager.switchStyle(style)
            isLoading = false
            successMessage = "Changed to \(style.displayName) style"
            clearSuccessMessageAfterDelay()
        }
    }

    /// Update provider features when provider changes
    private func updateProviderFeatures() {
        providerFeatures = ProviderFeatures.features(for: selectedProvider)
        availableStyles = providerFeatures.availableStyles
        availableFeatures = manager.getAvailableFeatures()
        maxCacheSizeMB = providerFeatures.maxOfflineCacheSizeMB

        // Update offline settings if cache size exceeds max
        if offlineCacheSizeMB > maxCacheSizeMB {
            offlineCacheSizeMB = maxCacheSizeMB
        }

        // Disable offline maps if not supported
        if !providerFeatures.supportsOfflineMaps {
            offlineMapsEnabled = false
        }
    }

    // MARK: - API Key Management

    /// Set API key for a provider
    func setAPIKey(_ key: String, for provider: MapProvider) {
        Task {
            isLoading = true
            errorMessage = nil

            do {
                try await manager.setAPIKey(key, for: provider)
                successMessage = "API key saved for \(provider.displayName)"
                clearSuccessMessageAfterDelay()

                // If this was the selected provider, switch to it
                if provider == selectedProvider {
                    await manager.switchProvider(provider)
                }
            } catch {
                errorMessage = error.localizedDescription
            }

            isLoading = false
        }
    }

    /// Delete API key for a provider
    func deleteAPIKey(for provider: MapProvider) {
        do {
            try manager.deleteAPIKey(for: provider)
            successMessage = "API key removed for \(provider.displayName)"
            clearSuccessMessageAfterDelay()

            // If this was the current provider, switch to Apple Maps
            if provider == selectedProvider {
                Task {
                    await manager.switchProvider(.apple)
                }
            }
        } catch {
            errorMessage = "Failed to delete API key: \(error.localizedDescription)"
        }
    }

    /// Check if a provider has a valid API key
    func hasValidAPIKey(for provider: MapProvider) -> Bool {
        apiKeys[provider]?.isValid ?? false
    }

    /// Get masked API key for display
    func getMaskedAPIKey(for provider: MapProvider) -> String? {
        apiKeys[provider]?.maskedKey
    }

    // MARK: - Feature Management

    /// Toggle a map feature
    func toggleFeature(_ feature: MapFeature) {
        let newState = !manager.isFeatureEnabled(feature.id)
        manager.toggleFeature(feature.id, enabled: newState)

        // Update local feature list
        if let index = availableFeatures.firstIndex(where: { $0.id == feature.id }) {
            availableFeatures[index].enabled = newState
        }

        if let error = manager.errorMessage {
            errorMessage = error
        } else {
            successMessage = "\(feature.name) \(newState ? "enabled" : "disabled")"
            clearSuccessMessageAfterDelay()
        }
    }

    /// Check if a feature is enabled
    func isFeatureEnabled(_ featureId: String) -> Bool {
        manager.isFeatureEnabled(featureId)
    }

    /// Check if a feature is supported by current provider
    func isFeatureSupported(_ featureId: String) -> Bool {
        providerFeatures.supportedFeatures.contains(featureId)
    }

    // MARK: - Settings Persistence

    /// Save offline settings
    private func saveOfflineSettings(enabled: Bool, cacheSizeMB: Int) {
        var preferences = manager.preferences
        preferences.offlineMapsEnabled = enabled
        preferences.offlineCacheSizeMB = cacheSizeMB
        manager.preferences = preferences
    }

    /// Save camera settings
    private func saveCameraSettings(zoom: Double, pitch: Double, heading: Double, follow: Bool) {
        var preferences = manager.preferences
        preferences.defaultZoomLevel = zoom
        preferences.defaultPitch = pitch
        preferences.defaultHeading = heading
        preferences.followUserLocation = follow
        manager.preferences = preferences
    }

    /// Save display settings
    private func saveDisplaySettings(autoRotate: Bool, scale: Bool, compass: Bool) {
        var preferences = manager.preferences
        preferences.autoRotateEnabled = autoRotate
        preferences.showsScale = scale
        preferences.showsCompass = compass
        manager.preferences = preferences
    }

    // MARK: - Reset

    /// Reset all settings to defaults
    func resetToDefaults() {
        manager.resetToDefaults()

        // Update local properties
        selectedProvider = manager.currentProvider
        selectedStyle = manager.currentStyle
        updateProviderFeatures()

        offlineMapsEnabled = manager.preferences.offlineMapsEnabled
        offlineCacheSizeMB = manager.preferences.offlineCacheSizeMB
        defaultZoomLevel = manager.preferences.defaultZoomLevel
        defaultPitch = manager.preferences.defaultPitch
        defaultHeading = manager.preferences.defaultHeading
        followUserLocation = manager.preferences.followUserLocation
        autoRotateEnabled = manager.preferences.autoRotateEnabled
        showsScale = manager.preferences.showsScale
        showsCompass = manager.preferences.showsCompass

        successMessage = "Reset to default settings"
        clearSuccessMessageAfterDelay()
    }

    // MARK: - Utility Methods

    /// Clear success message after a delay
    private func clearSuccessMessageAfterDelay() {
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
            successMessage = nil
        }
    }

    /// Get configuration status text
    var configurationStatus: String {
        if !manager.isConfigured {
            if selectedProvider.requiresAPIKey {
                return "API key required"
            }
            return "Not configured"
        }
        return "Ready"
    }

    /// Check if current provider is configured
    var isProviderConfigured: Bool {
        if selectedProvider.requiresAPIKey {
            return hasValidAPIKey(for: selectedProvider)
        }
        return true
    }

    /// Get provider comparison data
    func getProviderComparison() -> [ProviderComparisonRow] {
        MapProvider.allCases.map { provider in
            let features = ProviderFeatures.features(for: provider)
            return ProviderComparisonRow(
                provider: provider,
                requiresAPIKey: provider.requiresAPIKey,
                hasValidKey: hasValidAPIKey(for: provider),
                featureCount: features.supportedFeatures.count,
                supportsOffline: features.supportsOfflineMaps,
                supportsCustomStyles: features.supportsCustomStyles,
                maxZoom: features.maxZoomLevel,
                isSelected: provider == selectedProvider
            )
        }
    }
}

// MARK: - Provider Comparison Row

struct ProviderComparisonRow: Identifiable {
    let id = UUID()
    let provider: MapProvider
    let requiresAPIKey: Bool
    let hasValidKey: Bool
    let featureCount: Int
    let supportsOffline: Bool
    let supportsCustomStyles: Bool
    let maxZoom: Int
    let isSelected: Bool

    var statusIcon: String {
        if requiresAPIKey {
            return hasValidKey ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"
        }
        return "checkmark.circle.fill"
    }

    var statusColor: Color {
        if requiresAPIKey {
            return hasValidKey ? .green : .orange
        }
        return .green
    }
}
