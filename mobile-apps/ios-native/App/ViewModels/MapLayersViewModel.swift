//
//  MapLayersViewModel.swift
//  Fleet Manager
//
//  ViewModel for managing map layers with real-time traffic and weather data
//

import Foundation
import SwiftUI
import Combine
import MapKit

@MainActor
final class MapLayersViewModel: RefreshableViewModel {

    // MARK: - Published Properties

    @Published var availableLayers: [MapLayer] = []
    @Published var trafficData: TrafficData?
    @Published var weatherData: [WeatherOverlay] = []
    @Published var incidents: [IncidentMarker] = []
    @Published var currentMapType: MKMapType = .standard

    @Published var showLayerPicker = false
    @Published var showTrafficLegend = false
    @Published var showWeatherOverlay = false

    @Published var errorMessage: String?
    @Published var showError = false

    // Layer-specific loading states
    @Published var isLoadingTraffic = false
    @Published var isLoadingWeather = false
    @Published var isLoadingIncidents = false

    // Auto-refresh
    @Published var autoRefreshEnabled = true

    // MARK: - Private Properties

    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private var preferences: MapLayerPreferences
    private var refreshTimers: [MapLayerType: Timer] = [:]
    private var currentRegion: MKCoordinateRegion?

    // MARK: - Initialization

    override init() {
        self.preferences = MapLayerPreferences.load()
        super.init()
        setupLayers()
        loadCachedData()
    }

    deinit {
        stopAllAutoRefresh()
    }

    // MARK: - Layer Setup

    private func setupLayers() {
        availableLayers = MapLayerType.allCases.map { layerType in
            let isEnabled = preferences.enabledLayers.contains(layerType)
            let opacity = preferences.layerOpacities[layerType] ?? layerType.defaultOpacity

            return MapLayer(
                type: layerType,
                isEnabled: isEnabled,
                opacity: opacity,
                refreshInterval: layerType == .traffic ? 300 : 600 // 5 min traffic, 10 min others
            )
        }

        autoRefreshEnabled = preferences.autoRefreshEnabled

        // Update map type based on enabled layers
        updateMapType()
    }

    // MARK: - Layer Management

    func toggleLayer(_ layerType: MapLayerType) {
        guard let index = availableLayers.firstIndex(where: { $0.type == layerType }) else { return }

        availableLayers[index].isEnabled.toggle()
        let isEnabled = availableLayers[index].isEnabled

        ModernTheme.Haptics.selection()

        // Update preferences
        if isEnabled {
            if !preferences.enabledLayers.contains(layerType) {
                preferences.enabledLayers.append(layerType)
            }
        } else {
            preferences.enabledLayers.removeAll { $0 == layerType }
        }
        preferences.save()

        // Handle layer-specific logic
        handleLayerToggle(layerType, isEnabled: isEnabled)

        // Update map type if needed
        updateMapType()
    }

    func toggleMultipleLayers(_ layerTypes: [MapLayerType], enabled: Bool) {
        for layerType in layerTypes {
            if let index = availableLayers.firstIndex(where: { $0.type == layerType }) {
                availableLayers[index].isEnabled = enabled

                if enabled {
                    if !preferences.enabledLayers.contains(layerType) {
                        preferences.enabledLayers.append(layerType)
                    }
                } else {
                    preferences.enabledLayers.removeAll { $0 == layerType }
                }

                handleLayerToggle(layerType, isEnabled: enabled)
            }
        }

        preferences.save()
        updateMapType()
        ModernTheme.Haptics.medium()
    }

    func setLayerOpacity(_ layerType: MapLayerType, opacity: Double) {
        guard let index = availableLayers.firstIndex(where: { $0.type == layerType }) else { return }

        availableLayers[index].opacity = opacity
        preferences.layerOpacities[layerType] = opacity
        preferences.save()
    }

    func isLayerEnabled(_ layerType: MapLayerType) -> Bool {
        availableLayers.first(where: { $0.type == layerType })?.isEnabled ?? false
    }

    func getLayerOpacity(_ layerType: MapLayerType) -> Double {
        availableLayers.first(where: { $0.type == layerType })?.opacity ?? 1.0
    }

    // MARK: - Handle Layer Toggle

    private func handleLayerToggle(_ layerType: MapLayerType, isEnabled: Bool) {
        if isEnabled {
            // Fetch data for the layer if needed
            if layerType.requiresDataFetch {
                Task {
                    await fetchLayerData(layerType)
                }
            }

            // Start auto-refresh if enabled
            if autoRefreshEnabled {
                startAutoRefreshForLayer(layerType)
            }

            // Show related UI
            switch layerType {
            case .traffic:
                showTrafficLegend = true
            case .weather:
                showWeatherOverlay = true
            default:
                break
            }
        } else {
            // Stop auto-refresh
            stopAutoRefreshForLayer(layerType)

            // Hide related UI
            switch layerType {
            case .traffic:
                if !hasOtherTrafficLayersEnabled() {
                    showTrafficLegend = false
                }
            case .weather:
                showWeatherOverlay = false
            default:
                break
            }
        }
    }

    private func hasOtherTrafficLayersEnabled() -> Bool {
        return isLayerEnabled(.incidents) || isLayerEnabled(.construction)
    }

    // MARK: - Map Type Management

    private func updateMapType() {
        if isLayerEnabled(.satellite) {
            currentMapType = .satellite
        } else if isLayerEnabled(.hybrid) {
            currentMapType = .hybrid
        } else if isLayerEnabled(.terrain) {
            currentMapType = .mutedStandard
        } else {
            currentMapType = .standard
        }
    }

    // MARK: - Data Fetching

    func updateRegion(_ region: MKCoordinateRegion) {
        currentRegion = region

        // Refresh visible data
        Task {
            await refreshVisibleData()
        }
    }

    private func refreshVisibleData() async {
        let enabledDataLayers = availableLayers.filter { $0.isEnabled && $0.type.requiresDataFetch }

        for layer in enabledDataLayers {
            await fetchLayerData(layer.type)
        }
    }

    private func fetchLayerData(_ layerType: MapLayerType) async {
        switch layerType {
        case .traffic:
            await fetchTrafficData()
        case .weather:
            await fetchWeatherData()
        case .incidents, .construction:
            await fetchIncidentData()
        default:
            break
        }
    }

    // MARK: - Traffic Data

    func fetchTrafficData(token: String? = nil) async {
        isLoadingTraffic = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: "/api/v1/map/traffic",
                method: .GET,
                token: token,
                responseType: TrafficDataResponse.self
            )

            if response.success {
                trafficData = response.data
                cacheTrafficData(response.data)
            } else {
                handleErrorMessage(response.message ?? "Failed to load traffic data")
            }

            isLoadingTraffic = false
        } catch {
            handleTrafficError(error)
            isLoadingTraffic = false
        }
    }

    private func cacheTrafficData(_ data: TrafficData) {
        if let encoded = try? JSONEncoder().encode(data) {
            UserDefaults.standard.set(encoded, forKey: "CachedTrafficData")
        }
    }

    private func loadCachedTrafficData() {
        guard let data = UserDefaults.standard.data(forKey: "CachedTrafficData"),
              let cached = try? JSONDecoder().decode(TrafficData.self, from: data) else {
            return
        }

        // Only use cache if less than 10 minutes old
        if Date().timeIntervalSince(cached.lastUpdated) < 600 {
            trafficData = cached
        }
    }

    private func handleTrafficError(_ error: Error) {
        // Try to load cached data
        loadCachedTrafficData()

        if trafficData == nil {
            errorMessage = "Unable to load traffic data: \(error.localizedDescription)"
            showError = true
        }
    }

    // MARK: - Weather Data

    func fetchWeatherData(token: String? = nil) async {
        guard let region = currentRegion else { return }

        isLoadingWeather = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: "/api/v1/map/weather",
                method: .POST,
                body: [
                    "bounds": [
                        "northeast": ["lat": region.center.latitude + region.span.latitudeDelta/2,
                                     "lng": region.center.longitude + region.span.longitudeDelta/2],
                        "southwest": ["lat": region.center.latitude - region.span.latitudeDelta/2,
                                     "lng": region.center.longitude - region.span.longitudeDelta/2]
                    ]
                ],
                token: token,
                responseType: WeatherDataResponse.self
            )

            if response.success {
                weatherData = response.data
                cacheWeatherData(response.data)
            } else {
                handleErrorMessage(response.message ?? "Failed to load weather data")
            }

            isLoadingWeather = false
        } catch {
            handleWeatherError(error)
            isLoadingWeather = false
        }
    }

    private func cacheWeatherData(_ data: [WeatherOverlay]) {
        if let encoded = try? JSONEncoder().encode(data) {
            UserDefaults.standard.set(encoded, forKey: "CachedWeatherData")
        }
    }

    private func loadCachedWeatherData() {
        guard let data = UserDefaults.standard.data(forKey: "CachedWeatherData"),
              let cached = try? JSONDecoder().decode([WeatherOverlay].self, from: data) else {
            return
        }
        weatherData = cached
    }

    private func handleWeatherError(_ error: Error) {
        // Try to load cached data
        loadCachedWeatherData()

        if weatherData.isEmpty {
            errorMessage = "Unable to load weather data: \(error.localizedDescription)"
            showError = true
        }
    }

    // MARK: - Incident Data

    func fetchIncidentData(token: String? = nil) async {
        guard let region = currentRegion else { return }

        isLoadingIncidents = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: "/api/v1/map/incidents",
                method: .POST,
                body: [
                    "bounds": [
                        "northeast": ["lat": region.center.latitude + region.span.latitudeDelta/2,
                                     "lng": region.center.longitude + region.span.longitudeDelta/2],
                        "southwest": ["lat": region.center.latitude - region.span.latitudeDelta/2,
                                     "lng": region.center.longitude - region.span.longitudeDelta/2]
                    ]
                ],
                token: token,
                responseType: IncidentDataResponse.self
            )

            if response.success {
                incidents = response.data.filter { $0.isActive }
                cacheIncidentData(response.data)
            } else {
                handleErrorMessage(response.message ?? "Failed to load incident data")
            }

            isLoadingIncidents = false
        } catch {
            handleIncidentError(error)
            isLoadingIncidents = false
        }
    }

    private func cacheIncidentData(_ data: [IncidentMarker]) {
        if let encoded = try? JSONEncoder().encode(data) {
            UserDefaults.standard.set(encoded, forKey: "CachedIncidentData")
        }
    }

    private func loadCachedIncidentData() {
        guard let data = UserDefaults.standard.data(forKey: "CachedIncidentData"),
              let cached = try? JSONDecoder().decode([IncidentMarker].self, from: data) else {
            return
        }
        incidents = cached.filter { $0.isActive }
    }

    private func handleIncidentError(_ error: Error) {
        // Try to load cached data
        loadCachedIncidentData()

        if incidents.isEmpty {
            errorMessage = "Unable to load incident data: \(error.localizedDescription)"
            showError = true
        }
    }

    // MARK: - Auto-Refresh

    func toggleAutoRefresh() {
        autoRefreshEnabled.toggle()
        preferences.autoRefreshEnabled = autoRefreshEnabled
        preferences.save()

        if autoRefreshEnabled {
            startAllAutoRefresh()
        } else {
            stopAllAutoRefresh()
        }

        ModernTheme.Haptics.medium()
    }

    private func startAllAutoRefresh() {
        for layer in availableLayers where layer.isEnabled && layer.needsAutoRefresh {
            startAutoRefreshForLayer(layer.type)
        }
    }

    private func stopAllAutoRefresh() {
        for layerType in refreshTimers.keys {
            stopAutoRefreshForLayer(layerType)
        }
    }

    private func startAutoRefreshForLayer(_ layerType: MapLayerType) {
        guard let layer = availableLayers.first(where: { $0.type == layerType }) else { return }

        // Cancel existing timer if any
        refreshTimers[layerType]?.invalidate()

        // Create new timer
        let timer = Timer.scheduledTimer(withTimeInterval: layer.refreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.fetchLayerData(layerType)
            }
        }

        refreshTimers[layerType] = timer
    }

    private func stopAutoRefreshForLayer(_ layerType: MapLayerType) {
        refreshTimers[layerType]?.invalidate()
        refreshTimers[layerType] = nil
    }

    // MARK: - Data Loading

    private func loadCachedData() {
        loadCachedTrafficData()
        loadCachedWeatherData()
        loadCachedIncidentData()
    }

    // MARK: - Filtering

    func getVisibleIncidents(in region: MKCoordinateRegion) -> [IncidentMarker] {
        incidents.filter { incident in
            region.contains(incident.coordinate)
        }
    }

    func getVisibleWeatherData(in region: MKCoordinateRegion) -> [WeatherOverlay] {
        weatherData.filter { weather in
            region.contains(weather.location.coordinate)
        }
    }

    func getVisibleTrafficSegments(in region: MKCoordinateRegion) -> [TrafficRoadSegment] {
        trafficData?.segmentsInRegion(region) ?? []
    }

    // MARK: - Refresh Override

    override func refresh() async {
        startRefreshing()
        ModernTheme.Haptics.medium()

        await refreshVisibleData()

        finishRefreshing()
    }

    // MARK: - Error Handling

    private func handleErrorMessage(_ message: String) {
        errorMessage = message
        showError = true
    }

    // MARK: - Statistics

    var activeIncidentCount: Int {
        incidents.filter { $0.isActive && $0.severity == .high || $0.severity == .critical }.count
    }

    var severeWeatherAlertCount: Int {
        weatherData.reduce(0) { count, weather in
            count + weather.alerts.filter { $0.isActive && ($0.severity == .severe || $0.severity == .extreme) }.count
        }
    }

    var heavyTrafficSegmentCount: Int {
        trafficData?.segments.filter { $0.congestionLevel == .heavy || $0.congestionLevel == .stopped }.count ?? 0
    }

    // MARK: - Quick Actions

    func showTrafficOnly() {
        toggleMultipleLayers([.traffic], enabled: true)
        toggleMultipleLayers([.weather, .incidents, .construction], enabled: false)
    }

    func showWeatherOnly() {
        toggleMultipleLayers([.weather], enabled: true)
        toggleMultipleLayers([.traffic, .incidents, .construction], enabled: false)
    }

    func showAllAlerts() {
        toggleMultipleLayers([.incidents, .construction], enabled: true)
    }

    func clearAllLayers() {
        toggleMultipleLayers(MapLayerType.allCases, enabled: false)
    }
}
