//
//  MapProviderManager.swift
//  Fleet Manager - Map Provider Service
//
//  Global singleton for managing map provider configuration,
//  API key validation, and preference persistence
//

import Foundation
import SwiftUI
import Combine
import CoreLocation

// MARK: - Map Provider Manager

@MainActor
class MapProviderManager: ObservableObject {
    // MARK: - Shared Instance

    static let shared = MapProviderManager()

    // MARK: - Published Properties

    @Published var currentProvider: MapProvider = .apple
    @Published var currentStyle: MapStyle = .standard
    @Published var preferences: MapPreferences = .default
    @Published var apiKeys: [MapProvider: MapAPIKey] = [:]
    @Published var isConfigured: Bool = false
    @Published var errorMessage: String?

    // MARK: - Private Properties

    private let userDefaults = UserDefaults.standard
    private let keychainManager = KeychainManager.shared
    private var cancellables = Set<AnyCancellable>()

    // UserDefaults Keys
    private enum DefaultsKeys {
        static let preferences = "map_preferences"
        static let lastProvider = "last_map_provider"
        static let lastStyle = "last_map_style"
    }

    // MARK: - Initialization

    private init() {
        loadPreferences()
        validateConfiguration()
        setupObservers()
    }

    // MARK: - Setup

    private func setupObservers() {
        // Monitor preference changes and auto-save
        $preferences
            .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
            .sink { [weak self] preferences in
                self?.savePreferences(preferences)
            }
            .store(in: &cancellables)

        // Update current provider and style when preferences change
        $preferences
            .map { $0.provider }
            .removeDuplicates()
            .assign(to: &$currentProvider)

        $preferences
            .map { $0.style }
            .removeDuplicates()
            .assign(to: &$currentStyle)

        // Validate configuration when provider changes
        $currentProvider
            .sink { [weak self] _ in
                self?.validateConfiguration()
            }
            .store(in: &cancellables)
    }

    // MARK: - Provider Management

    /// Switch to a different map provider
    func switchProvider(_ provider: MapProvider) async {
        guard provider != currentProvider else { return }

        // Check if API key is required and valid
        if provider.requiresAPIKey {
            guard let apiKey = apiKeys[provider], apiKey.isValid else {
                errorMessage = "Please configure API key for \(provider.displayName)"
                return
            }
        }

        // Update preferences
        var newPreferences = preferences
        newPreferences.provider = provider

        // Reset style if not supported by new provider
        let features = ProviderFeatures.features(for: provider)
        if !features.availableStyles.contains(preferences.style) {
            newPreferences.style = features.availableStyles.first ?? .standard
        }

        preferences = newPreferences
        currentProvider = provider
        errorMessage = nil

        await applyPreferences()
    }

    /// Switch to a different map style
    func switchStyle(_ style: MapStyle) async {
        guard style != currentStyle else { return }

        // Verify style is supported by current provider
        let features = ProviderFeatures.features(for: currentProvider)
        guard features.availableStyles.contains(style) else {
            errorMessage = "Style '\(style.displayName)' not supported by \(currentProvider.displayName)"
            return
        }

        preferences.style = style
        currentStyle = style
        errorMessage = nil

        await applyPreferences()
    }

    /// Apply current preferences to the map system
    func applyPreferences() async {
        // This method would be called by map views to apply settings
        // In a real implementation, this would configure the actual map SDK
        NotificationCenter.default.post(
            name: .mapPreferencesDidChange,
            object: nil,
            userInfo: ["preferences": preferences]
        )
    }

    // MARK: - API Key Management

    /// Set API key for a specific provider
    func setAPIKey(_ key: String, for provider: MapProvider) async throws {
        // Validate key format
        guard !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw MapProviderError.invalidAPIKey("API key cannot be empty")
        }

        // Save to keychain using the enhanced method
        try keychainManager.saveMapAPIKey(key, for: provider.rawValue)

        // Validate the key
        let isValid = await validateAPIKey(key, for: provider)

        // Update in-memory storage
        let apiKey = MapAPIKey(
            provider: provider,
            key: key,
            isValid: isValid,
            lastValidated: Date()
        )
        apiKeys[provider] = apiKey

        if !isValid {
            throw MapProviderError.invalidAPIKey("API key validation failed for \(provider.displayName)")
        }

        validateConfiguration()
    }

    /// Retrieve API key for a provider from keychain
    func getAPIKey(for provider: MapProvider) async throws -> String? {
        return try await keychainManager.getMapAPIKey(for: provider.rawValue)
    }

    /// Delete API key for a provider
    func deleteAPIKey(for provider: MapProvider) throws {
        try keychainManager.deleteMapAPIKey(for: provider.rawValue)
        apiKeys.removeValue(forKey: provider)
        validateConfiguration()
    }

    /// Validate API key with the provider's API
    private func validateAPIKey(_ key: String, for provider: MapProvider) async -> Bool {
        // In a real implementation, this would make an API call to validate the key
        // For now, we'll do basic format validation

        switch provider {
        case .google:
            // Google API keys typically start with "AIza" and are 39 characters
            return key.hasPrefix("AIza") && key.count == 39
        case .mapbox:
            // Mapbox tokens start with "pk." or "sk."
            return (key.hasPrefix("pk.") || key.hasPrefix("sk.")) && key.count > 80
        case .apple, .openstreetmap:
            // These don't require API keys
            return true
        }
    }

    /// Load all API keys from keychain
    func loadAPIKeys() async {
        for provider in MapProvider.allCases where provider.requiresAPIKey {
            do {
                if let key = try await getAPIKey(for: provider) {
                    let isValid = await validateAPIKey(key, for: provider)
                    let apiKey = MapAPIKey(
                        provider: provider,
                        key: key,
                        isValid: isValid,
                        lastValidated: Date()
                    )
                    apiKeys[provider] = apiKey
                }
            } catch {
                print("Failed to load API key for \(provider.displayName): \(error)")
            }
        }
    }

    // MARK: - Feature Management

    /// Toggle a specific map feature
    func toggleFeature(_ featureId: String, enabled: Bool) {
        // Check if feature is supported by current provider
        let features = ProviderFeatures.features(for: currentProvider)
        guard features.supportedFeatures.contains(featureId) else {
            errorMessage = "Feature not supported by \(currentProvider.displayName)"
            return
        }

        preferences.enabledFeatures[featureId] = enabled
        errorMessage = nil
    }

    /// Check if a feature is enabled
    func isFeatureEnabled(_ featureId: String) -> Bool {
        preferences.enabledFeatures[featureId] ?? false
    }

    /// Get all available features for current provider
    func getAvailableFeatures() -> [MapFeature] {
        let features = ProviderFeatures.features(for: currentProvider)
        var availableFeatures: [MapFeature] = []

        // Create feature instances based on supported features
        if features.supportedFeatures.contains("traffic") {
            var feature = MapFeature.traffic
            feature.enabled = isFeatureEnabled("traffic")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("buildings3D") {
            var feature = MapFeature.buildings3D
            feature.enabled = isFeatureEnabled("buildings3D")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("pointsOfInterest") {
            var feature = MapFeature.pointsOfInterest
            feature.enabled = isFeatureEnabled("pointsOfInterest")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("transit") {
            var feature = MapFeature.transit
            feature.enabled = isFeatureEnabled("transit")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("compass") {
            var feature = MapFeature.compass
            feature.enabled = isFeatureEnabled("compass")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("scaleBar") {
            var feature = MapFeature.scaleBar
            feature.enabled = isFeatureEnabled("scaleBar")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("userLocation") {
            var feature = MapFeature.userLocation
            feature.enabled = isFeatureEnabled("userLocation")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("pitchControl") {
            var feature = MapFeature.pitchControl
            feature.enabled = isFeatureEnabled("pitchControl")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("rotationGesture") {
            var feature = MapFeature.rotationGesture
            feature.enabled = isFeatureEnabled("rotationGesture")
            availableFeatures.append(feature)
        }
        if features.supportedFeatures.contains("zoomControls") {
            var feature = MapFeature.zoomControls
            feature.enabled = isFeatureEnabled("zoomControls")
            availableFeatures.append(feature)
        }

        return availableFeatures
    }

    // MARK: - Persistence

    /// Save preferences to UserDefaults
    private func savePreferences(_ preferences: MapPreferences) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(preferences)
            userDefaults.set(data, forKey: DefaultsKeys.preferences)
            userDefaults.set(preferences.provider.rawValue, forKey: DefaultsKeys.lastProvider)
            userDefaults.set(preferences.style.rawValue, forKey: DefaultsKeys.lastStyle)
        } catch {
            print("Failed to save map preferences: \(error)")
            errorMessage = "Failed to save preferences"
        }
    }

    /// Load preferences from UserDefaults
    private func loadPreferences() {
        if let data = userDefaults.data(forKey: DefaultsKeys.preferences) {
            do {
                let decoder = JSONDecoder()
                preferences = try decoder.decode(MapPreferences.self, from: data)
                currentProvider = preferences.provider
                currentStyle = preferences.style
            } catch {
                print("Failed to load map preferences: \(error)")
                // Use default preferences
                preferences = .default
            }
        } else {
            // First launch - use defaults
            preferences = .default
        }

        // Load API keys asynchronously
        Task {
            await loadAPIKeys()
        }
    }

    /// Reset to default preferences
    func resetToDefaults() {
        preferences = .default
        currentProvider = .apple
        currentStyle = .standard
        errorMessage = nil
        savePreferences(preferences)
    }

    // MARK: - Configuration Validation

    /// Validate that the current configuration is complete and valid
    private func validateConfiguration() {
        if currentProvider.requiresAPIKey {
            if let apiKey = apiKeys[currentProvider], apiKey.isValid {
                isConfigured = true
            } else {
                isConfigured = false
            }
        } else {
            isConfigured = true
        }
    }

    /// Get current map configuration
    func getCurrentConfiguration() -> MapConfiguration {
        MapConfiguration.create(
            from: preferences,
            apiKey: apiKeys[currentProvider]
        )
    }
}

// MARK: - Map Provider Error

enum MapProviderError: LocalizedError {
    case invalidAPIKey(String)
    case providerNotConfigured
    case featureNotSupported
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidAPIKey(let message):
            return message
        case .providerNotConfigured:
            return "Map provider is not properly configured"
        case .featureNotSupported:
            return "Feature is not supported by this provider"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let mapPreferencesDidChange = Notification.Name("mapPreferencesDidChange")
    static let mapProviderDidChange = Notification.Name("mapProviderDidChange")
}
