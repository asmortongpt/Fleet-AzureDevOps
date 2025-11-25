//
//  GISViewModel.swift
//  Fleet Manager
//
//  ViewModel for GIS Command Center with heatmaps, clusters, and boundaries
//

import Foundation
import Combine
import MapKit
import CoreLocation

@MainActor
class GISViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var layers: [GISLayer] = []
    @Published var heatmapData: HeatmapData?
    @Published var clusters: [ClusterPoint] = []
    @Published var boundaries: [GeographicBoundary] = []
    @Published var filter: GISFilter = GISFilter()
    @Published var selectedTimeframe: TimeframeOption = .today
    @Published var mapRegion: MKCoordinateRegion?
    @Published var selectedCluster: ClusterPoint?
    @Published var isExporting: Bool = false
    @Published var showLegend: Bool = true
    @Published var autoRefresh: Bool = true
    @Published var refreshInterval: TimeInterval = 30.0

    // Heatmap settings
    @Published var heatmapRadius: Double = 30.0
    @Published var heatmapGradient: HeatmapGradient = .default
    @Published var heatmapOpacity: Double = 0.6

    // Cluster settings
    @Published var clusterRadius: Double = 100.0
    @Published var minimumClusterSize: Int = 2

    // Layer visibility
    @Published var showHeatmap: Bool = true
    @Published var showClusters: Bool = true
    @Published var showBoundaries: Bool = false
    @Published var showRoutes: Bool = false

    // Statistics
    @Published var statistics: GISStatistics?

    // Timer for auto-refresh
    private var refreshTimer: Timer?

    // MARK: - Initialization
    override init() {
        super.init()
        setupDefaultLayers()
        startAutoRefresh()
    }

    deinit {
        stopAutoRefresh()
    }

    // MARK: - Setup
    private func setupDefaultLayers() {
        layers = [
            GISLayer(name: "Vehicle Heatmap", type: .heatmap, visible: true, opacity: 0.6, zIndex: 1),
            GISLayer(name: "Vehicle Clusters", type: .cluster, visible: true, opacity: 1.0, zIndex: 2),
            GISLayer(name: "Service Boundaries", type: .boundary, visible: false, opacity: 0.3, zIndex: 0),
            GISLayer(name: "Trip Routes", type: .route, visible: false, opacity: 0.8, zIndex: 1),
            GISLayer(name: "Geofences", type: .geofence, visible: false, opacity: 0.5, zIndex: 1),
            GISLayer(name: "Incidents", type: .incident, visible: true, opacity: 1.0, zIndex: 3)
        ]
    }

    // MARK: - Data Loading
    override func refresh() async {
        await loadAllData()
    }

    func loadAllData() async {
        startRefreshing()

        do {
            async let layersTask = loadLayers()
            async let heatmapTask = loadHeatmap()
            async let clustersTask = loadClusters()
            async let boundariesTask = loadBoundaries()

            _ = try await (layersTask, heatmapTask, clustersTask, boundariesTask)

            await calculateStatistics()
            finishRefreshing()
        } catch {
            handleError(error)
        }
    }

    func loadLayers() async throws {
        let endpoint = "/api/v1/gis/layers"
        let queryItems = buildFilterQueryItems()

        guard let response: GISLayersResponse = try await APIClient.shared.get(endpoint: endpoint, queryItems: queryItems) else {
            throw APIError.invalidResponse
        }

        await MainActor.run {
            // Merge server layers with local settings
            for serverLayer in response.layers {
                if let index = layers.firstIndex(where: { $0.id == serverLayer.id }) {
                    layers[index] = serverLayer
                } else {
                    layers.append(serverLayer)
                }
            }
        }
    }

    func loadHeatmap() async throws {
        guard showHeatmap else { return }

        let endpoint = "/api/v1/gis/heatmap"
        var queryItems = buildFilterQueryItems()
        queryItems.append(URLQueryItem(name: "radius", value: String(heatmapRadius)))

        guard let response: HeatmapResponse = try await APIClient.shared.get(endpoint: endpoint, queryItems: queryItems) else {
            throw APIError.invalidResponse
        }

        await MainActor.run {
            var data = response.heatmap
            data.radius = heatmapRadius
            data.gradient = heatmapGradient
            heatmapData = data
        }
    }

    func loadClusters() async throws {
        guard showClusters else { return }

        let endpoint = "/api/v1/gis/clusters"
        var queryItems = buildFilterQueryItems()
        queryItems.append(URLQueryItem(name: "radius", value: String(clusterRadius)))
        queryItems.append(URLQueryItem(name: "minSize", value: String(minimumClusterSize)))

        guard let response: ClusterResponse = try await APIClient.shared.get(endpoint: endpoint, queryItems: queryItems) else {
            throw APIError.invalidResponse
        }

        await MainActor.run {
            clusters = response.clusters
        }
    }

    func loadBoundaries() async throws {
        guard showBoundaries else { return }

        let endpoint = "/api/v1/gis/boundaries"
        let queryItems = buildFilterQueryItems()

        guard let response: BoundaryResponse = try await APIClient.shared.get(endpoint: endpoint, queryItems: queryItems) else {
            throw APIError.invalidResponse
        }

        await MainActor.run {
            boundaries = response.boundaries
        }
    }

    // MARK: - Layer Management
    func toggleLayer(_ layer: GISLayer) {
        if let index = layers.firstIndex(where: { $0.id == layer.id }) {
            layers[index].visible.toggle()

            // Update corresponding visibility flags
            switch layers[index].type {
            case .heatmap:
                showHeatmap = layers[index].visible
            case .cluster:
                showClusters = layers[index].visible
            case .boundary:
                showBoundaries = layers[index].visible
            case .route:
                showRoutes = layers[index].visible
            default:
                break
            }

            Task {
                await loadAllData()
            }
        }
    }

    func updateLayerOpacity(_ layer: GISLayer, opacity: Double) {
        if let index = layers.firstIndex(where: { $0.id == layer.id }) {
            layers[index].opacity = opacity
        }
    }

    func reorderLayers(from source: IndexSet, to destination: Int) {
        layers.move(fromOffsets: source, toOffset: destination)

        // Update z-indices based on new order
        for (index, _) in layers.enumerated() {
            layers[index].zIndex = layers.count - index
        }
    }

    // MARK: - Filter Management
    func applyTimeframe(_ timeframe: TimeframeOption) {
        selectedTimeframe = timeframe

        switch timeframe {
        case .lastHour:
            filter.dateRange = .lastHour
        case .today:
            filter.dateRange = .today
        case .thisWeek:
            filter.dateRange = .thisWeek
        case .thisMonth:
            filter.dateRange = .thisMonth
        case .custom:
            // Custom date range should be set separately
            break
        }

        Task {
            await loadAllData()
        }
    }

    func setCustomDateRange(start: Date, end: Date) {
        selectedTimeframe = .custom
        filter.dateRange = DateRange(startDate: start, endDate: end)

        Task {
            await loadAllData()
        }
    }

    func clearFilters() {
        filter = GISFilter()
        selectedTimeframe = .today
        filter.dateRange = .today

        Task {
            await loadAllData()
        }
    }

    private func buildFilterQueryItems() -> [URLQueryItem] {
        var items: [URLQueryItem] = []

        if let dateRange = filter.dateRange {
            let formatter = ISO8601DateFormatter()
            items.append(URLQueryItem(name: "startDate", value: formatter.string(from: dateRange.startDate)))
            items.append(URLQueryItem(name: "endDate", value: formatter.string(from: dateRange.endDate)))
        }

        if let vehicleTypes = filter.vehicleTypes, !vehicleTypes.isEmpty {
            items.append(URLQueryItem(name: "vehicleTypes", value: vehicleTypes.joined(separator: ",")))
        }

        if let statuses = filter.statusFilters, !statuses.isEmpty {
            items.append(URLQueryItem(name: "statuses", value: statuses.joined(separator: ",")))
        }

        if let boundingBox = filter.boundingBox {
            items.append(URLQueryItem(name: "minLat", value: String(boundingBox.minLatitude)))
            items.append(URLQueryItem(name: "maxLat", value: String(boundingBox.maxLatitude)))
            items.append(URLQueryItem(name: "minLon", value: String(boundingBox.minLongitude)))
            items.append(URLQueryItem(name: "maxLon", value: String(boundingBox.maxLongitude)))
        }

        return items
    }

    // MARK: - Cluster Interaction
    func selectCluster(_ cluster: ClusterPoint) {
        selectedCluster = cluster

        // Zoom to cluster
        let region = MKCoordinateRegion(
            center: cluster.coordinate,
            latitudinalMeters: cluster.radius * 4,
            longitudinalMeters: cluster.radius * 4
        )
        mapRegion = region
    }

    func deselectCluster() {
        selectedCluster = nil
    }

    // MARK: - Statistics
    func calculateStatistics() async {
        let totalVehicles = clusters.reduce(0) { $0 + $1.itemCount }
        let totalHeatmapPoints = heatmapData?.coordinates.count ?? 0
        let averageIntensity = heatmapData?.coordinates.reduce(0.0) { $0 + $1.intensity } ?? 0.0 / Double(max(totalHeatmapPoints, 1))

        let hotspots = heatmapData?.coordinates.filter { $0.intensity > 0.7 }.count ?? 0

        await MainActor.run {
            statistics = GISStatistics(
                totalVehicles: totalVehicles,
                totalClusters: clusters.count,
                totalHeatmapPoints: totalHeatmapPoints,
                averageIntensity: averageIntensity,
                hotspots: hotspots,
                visibleLayers: layers.filter { $0.visible }.count,
                boundariesCount: boundaries.count
            )
        }
    }

    // MARK: - Export
    func exportMapAsImage(from view: MKMapView) async throws -> UIImage {
        await MainActor.run {
            isExporting = true
        }

        defer {
            Task { @MainActor in
                isExporting = false
            }
        }

        let options = MKMapSnapshotter.Options()
        options.region = view.region
        options.size = CGSize(width: 1920, height: 1080)
        options.scale = UIScreen.main.scale
        options.mapType = view.mapType

        let snapshotter = MKMapSnapshotter(options: options)

        return try await withCheckedThrowingContinuation { continuation in
            snapshotter.start { snapshot, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let snapshot = snapshot else {
                    continuation.resume(throwing: APIError.invalidResponse)
                    return
                }

                continuation.resume(returning: snapshot.image)
            }
        }
    }

    func saveExportedImage(_ image: UIImage) {
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
    }

    // MARK: - Auto Refresh
    func startAutoRefresh() {
        guard autoRefresh else { return }

        stopAutoRefresh()

        refreshTimer = Timer.scheduledTimer(withTimeInterval: refreshInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.loadAllData()
            }
        }
    }

    func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    func toggleAutoRefresh() {
        autoRefresh.toggle()

        if autoRefresh {
            startAutoRefresh()
        } else {
            stopAutoRefresh()
        }
    }

    func setRefreshInterval(_ interval: TimeInterval) {
        refreshInterval = interval

        if autoRefresh {
            startAutoRefresh()
        }
    }

    // MARK: - Heatmap Settings
    func updateHeatmapRadius(_ radius: Double) {
        heatmapRadius = radius

        if let data = heatmapData {
            var updatedData = data
            updatedData.radius = radius
            heatmapData = updatedData
        }
    }

    func updateHeatmapGradient(_ gradient: HeatmapGradient) {
        heatmapGradient = gradient

        if let data = heatmapData {
            var updatedData = data
            updatedData.gradient = gradient
            heatmapData = updatedData
        }
    }

    func updateHeatmapOpacity(_ opacity: Double) {
        heatmapOpacity = opacity

        if let index = layers.firstIndex(where: { $0.type == .heatmap }) {
            layers[index].opacity = opacity
        }
    }
}

// MARK: - Supporting Types
enum TimeframeOption: String, CaseIterable {
    case lastHour = "Last Hour"
    case today = "Today"
    case thisWeek = "This Week"
    case thisMonth = "This Month"
    case custom = "Custom"

    var iconName: String {
        switch self {
        case .lastHour: return "clock.fill"
        case .today: return "sun.max.fill"
        case .thisWeek: return "calendar.badge.clock"
        case .thisMonth: return "calendar"
        case .custom: return "calendar.badge.plus"
        }
    }
}

struct GISStatistics {
    let totalVehicles: Int
    let totalClusters: Int
    let totalHeatmapPoints: Int
    let averageIntensity: Double
    let hotspots: Int
    let visibleLayers: Int
    let boundariesCount: Int
}
