import Foundation
import Combine
import SwiftUI
import CoreLocation
import MapKit

@MainActor
class RouteViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var routes: [Route] = []
    @Published var selectedRoute: Route?
    @Published var usageHistory: [RouteUsageHistory] = []
    @Published var statistics: RouteStatistics?
    @Published var showingAddRoute = false
    @Published var showingRouteDetail = false
    @Published var filterOption: RouteFilterOption = .all
    @Published var sortOption: RouteSortOption = .nameAsc
    @Published var currentTrafficUpdates: [String: TrafficCondition] = [:]

    // Map properties
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    // MARK: - Computed Properties
    var filteredAndSortedRoutes: [Route] {
        var filtered = routes

        // Apply filter
        switch filterOption {
        case .all:
            break
        case .favorites:
            filtered = filtered.filter { $0.isFavorite }
        case .mostUsed:
            filtered = filtered.sorted { $0.usageCount > $1.usageCount }.prefix(20).map { $0 }
        case .recentlyCreated:
            filtered = filtered.sorted { $0.createdDate > $1.createdDate }.prefix(20).map { $0 }
        case .recentlyUsed:
            filtered = filtered.filter { $0.lastUsedDate != nil }
                .sorted { ($0.lastUsedDate ?? Date.distantPast) > ($1.lastUsedDate ?? Date.distantPast) }
                .prefix(20).map { $0 }
        }

        // Apply search
        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.description?.localizedCaseInsensitiveContains(searchText) ?? false ||
                $0.origin?.name.localizedCaseInsensitiveContains(searchText) ?? false ||
                $0.destination?.name.localizedCaseInsensitiveContains(searchText) ?? false
            }
        }

        // Apply sort
        return sortRoutes(filtered, by: sortOption)
    }

    var favoriteRoutes: [Route] {
        routes.filter { $0.isFavorite }
    }

    var mostUsedRoutes: [Route] {
        routes.sorted { $0.usageCount > $1.usageCount }.prefix(5).map { $0 }
    }

    var recentRoutes: [Route] {
        routes.filter { $0.lastUsedDate != nil }
            .sorted { ($0.lastUsedDate ?? Date.distantPast) > ($1.lastUsedDate ?? Date.distantPast) }
            .prefix(5).map { $0 }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        Task {
            await loadInitialData()
        }
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadRoutes() }
            group.addTask { await self.loadStatistics() }
        }

        finishRefreshing()
    }

    func loadRoutes() async {
        do {
            startLoading()

            // TODO: Replace with actual API call when backend is ready
            // let response = try await AzureNetworkManager.shared.request(
            //     endpoint: "/v1/routes",
            //     method: .get,
            //     responseType: RoutesResponse.self
            // )
            // let fetchedRoutes = response.routes

            // Simulate API call for now
            try await Task.sleep(nanoseconds: 500_000_000)
            let mockRoutes = generateMockRoutes()

            await MainActor.run {
                self.routes = mockRoutes
                self.finishLoading()
            }

            // Cache routes locally
            DataPersistenceManager.shared.save(mockRoutes, forKey: "cached_routes")

            // Update traffic for routes with traffic enabled
            await updateTrafficConditions()

        } catch {
            // Try to load from cache on error
            if let cached: [Route] = DataPersistenceManager.shared.load(forKey: "cached_routes") {
                await MainActor.run {
                    self.routes = cached
                    self.finishLoading()
                }
            } else {
                handleError(error)
            }
        }
    }

    func loadUsageHistory(for route: Route) async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockHistory = generateMockUsageHistory(for: route)

            await MainActor.run {
                self.usageHistory = mockHistory
            }
        } catch {
            print("Error loading usage history: \(error)")
        }
    }

    func loadStatistics() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockStats = generateMockStatistics()

            await MainActor.run {
                self.statistics = mockStats
            }
        } catch {
            print("Error loading statistics: \(error)")
        }
    }

    // MARK: - CRUD Operations
    func createRoute(name: String, description: String?, waypoints: [WaypointInput], trafficEnabled: Bool, tags: [String], notes: String?) async {
        do {
            startLoading()

            // Calculate route distance and duration
            let distance = calculateRouteDistance(waypoints: waypoints)
            let duration = calculateRouteDuration(distance: distance)

            let newRoute = Route(
                id: UUID().uuidString,
                tenantId: "tenant-1",
                name: name,
                description: description,
                waypoints: waypoints.enumerated().map { index, input in
                    Waypoint(
                        id: UUID().uuidString,
                        order: input.order,
                        location: input.location,
                        name: input.name,
                        address: input.address,
                        type: input.type,
                        estimatedArrival: nil,
                        notes: input.notes
                    )
                },
                distance: distance,
                estimatedDuration: duration,
                isFavorite: false,
                usageCount: 0,
                createdDate: Date(),
                createdBy: "Current User",
                lastModifiedDate: nil,
                lastModifiedBy: nil,
                lastUsedDate: nil,
                tags: tags,
                trafficEnabled: trafficEnabled,
                currentTrafficCondition: nil,
                notes: notes
            )

            // TODO: Replace with actual API call when backend is ready
            // let request = CreateRouteRequest(
            //     name: name,
            //     description: description,
            //     waypoints: waypoints,
            //     trafficEnabled: trafficEnabled,
            //     tags: tags,
            //     notes: notes
            // )
            // let response = try await AzureNetworkManager.shared.request(
            //     endpoint: "/v1/routes",
            //     method: .post,
            //     body: request,
            //     responseType: RouteResponse.self
            // )
            // let createdRoute = response.route

            // Simulate API call for now
            try await Task.sleep(nanoseconds: 500_000_000)

            await MainActor.run {
                self.routes.append(newRoute)
                self.finishLoading()
                self.showingAddRoute = false
                ModernTheme.Haptics.success()
            }

            // Update cache
            DataPersistenceManager.shared.save(routes, forKey: "cached_routes")
            await loadStatistics()

        } catch {
            handleError(error)
        }
    }

    func updateRoute(_ route: Route) async {
        do {
            startLoading()

            // TODO: Replace with actual API call when backend is ready
            // let request = UpdateRouteRequest(
            //     name: route.name,
            //     description: route.description,
            //     waypoints: route.waypoints.map { ... },
            //     isFavorite: route.isFavorite,
            //     trafficEnabled: route.trafficEnabled,
            //     tags: route.tags,
            //     notes: route.notes
            // )
            // let response = try await AzureNetworkManager.shared.request(
            //     endpoint: "/v1/routes/\(route.id)",
            //     method: .put,
            //     body: request,
            //     responseType: RouteResponse.self
            // )
            // let updatedRoute = response.route

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.routes.firstIndex(where: { $0.id == route.id }) {
                    self.routes[index] = route
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            // Update cache
            DataPersistenceManager.shared.save(routes, forKey: "cached_routes")

        } catch {
            handleError(error)
        }
    }

    func deleteRoute(_ route: Route) async {
        do {
            startLoading()

            // TODO: Replace with actual API call when backend is ready
            // try await AzureNetworkManager.shared.request(
            //     endpoint: "/v1/routes/\(route.id)",
            //     method: .delete,
            //     responseType: EmptyResponse.self
            // )

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.routes.removeAll { $0.id == route.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            // Update cache
            DataPersistenceManager.shared.save(routes, forKey: "cached_routes")
            await loadStatistics()

        } catch {
            handleError(error)
        }
    }

    func toggleFavorite(for route: Route) async {
        var updatedRoute = route
        updatedRoute.isFavorite = !route.isFavorite
        await updateRoute(updatedRoute)
    }

    func incrementUsageCount(for route: Route) async {
        var updatedRoute = route
        updatedRoute.usageCount += 1
        updatedRoute.lastUsedDate = Date()
        await updateRoute(updatedRoute)
    }

    // MARK: - Route Calculations
    private func calculateRouteDistance(waypoints: [WaypointInput]) -> Double {
        var totalDistance: Double = 0

        for i in 0..<(waypoints.count - 1) {
            let start = CLLocation(
                latitude: waypoints[i].location.latitude,
                longitude: waypoints[i].location.longitude
            )
            let end = CLLocation(
                latitude: waypoints[i + 1].location.latitude,
                longitude: waypoints[i + 1].location.longitude
            )
            totalDistance += start.distance(from: end)
        }

        return totalDistance
    }

    private func calculateRouteDuration(distance: Double) -> TimeInterval {
        // Average speed assumption: 50 km/h in city, 80 km/h on highway
        // Using 60 km/h as average
        let averageSpeedMPS = 60.0 * 1000.0 / 3600.0 // 16.67 m/s
        return distance / averageSpeedMPS
    }

    // MARK: - Traffic Updates
    func updateTrafficConditions() async {
        for route in routes where route.trafficEnabled {
            // Simulate traffic API call
            let condition = TrafficCondition.allCases.randomElement() ?? .unknown
            currentTrafficUpdates[route.id] = condition

            // Update route with traffic condition
            var updatedRoute = route
            updatedRoute.currentTrafficCondition = condition

            if let index = routes.firstIndex(where: { $0.id == route.id }) {
                routes[index] = updatedRoute
            }
        }
    }

    func getAdjustedDuration(for route: Route) -> TimeInterval {
        guard let traffic = route.currentTrafficCondition else {
            return route.estimatedDuration
        }
        return route.estimatedDuration * traffic.delayMultiplier
    }

    // MARK: - Navigation
    func startNavigation(for route: Route) {
        guard let origin = route.origin, let destination = route.destination else { return }

        // Create MKMapItems for navigation
        let originItem = MKMapItem(placemark: MKPlacemark(coordinate: origin.coordinate))
        originItem.name = origin.name

        let destinationItem = MKMapItem(placemark: MKPlacemark(coordinate: destination.coordinate))
        destinationItem.name = destination.name

        // Open in Apple Maps with all waypoints
        MKMapItem.openMaps(
            with: [originItem, destinationItem],
            launchOptions: [
                MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving,
                MKLaunchOptionsShowsTrafficKey: route.trafficEnabled
            ]
        )

        // Increment usage count
        Task {
            await incrementUsageCount(for: route)
        }

        ModernTheme.Haptics.medium()
    }

    // MARK: - Map Helpers
    func centerMapOn(route: Route) {
        guard let origin = route.origin, let destination = route.destination else { return }

        // Calculate the region that encompasses all waypoints
        var minLat = min(origin.coordinate.latitude, destination.coordinate.latitude)
        var maxLat = max(origin.coordinate.latitude, destination.coordinate.latitude)
        var minLon = min(origin.coordinate.longitude, destination.coordinate.longitude)
        var maxLon = max(origin.coordinate.longitude, destination.coordinate.longitude)

        for waypoint in route.intermediateWaypoints {
            minLat = min(minLat, waypoint.coordinate.latitude)
            maxLat = max(maxLat, waypoint.coordinate.latitude)
            minLon = min(minLon, waypoint.coordinate.longitude)
            maxLon = max(maxLon, waypoint.coordinate.longitude)
        }

        let centerLat = (minLat + maxLat) / 2
        let centerLon = (minLon + maxLon) / 2
        let spanLat = (maxLat - minLat) * 1.5 // Add padding
        let spanLon = (maxLon - minLon) * 1.5

        withAnimation {
            mapRegion = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: centerLat, longitude: centerLon),
                span: MKCoordinateSpan(latitudeDelta: max(spanLat, 0.01), longitudeDelta: max(spanLon, 0.01))
            )
        }
    }

    // MARK: - Sorting
    private func sortRoutes(_ routes: [Route], by option: RouteSortOption) -> [Route] {
        switch option {
        case .nameAsc:
            return routes.sorted { $0.name < $1.name }
        case .nameDesc:
            return routes.sorted { $0.name > $1.name }
        case .distanceAsc:
            return routes.sorted { $0.distance < $1.distance }
        case .distanceDesc:
            return routes.sorted { $0.distance > $1.distance }
        case .durationAsc:
            return routes.sorted { $0.estimatedDuration < $1.estimatedDuration }
        case .durationDesc:
            return routes.sorted { $0.estimatedDuration > $1.estimatedDuration }
        case .usageDesc:
            return routes.sorted { $0.usageCount > $1.usageCount }
        case .lastUsedDesc:
            return routes.sorted { ($0.lastUsedDate ?? Date.distantPast) > ($1.lastUsedDate ?? Date.distantPast) }
        }
    }

    // MARK: - Search
    override func performSearch() {
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        filterOption = .all
    }

    // MARK: - Mock Data Generation
    private func generateMockRoutes() -> [Route] {
        let routeNames = [
            "Downtown Delivery Route",
            "Airport Transfer Route",
            "Warehouse to Distribution Center",
            "Daily Service Route A",
            "Emergency Response Route",
            "Customer Visit Circuit",
            "Fuel Station Loop",
            "Maintenance Facility Route",
            "School Bus Route 12",
            "Garbage Collection Route"
        ]

        let tags = [["delivery", "priority"], ["airport", "express"], ["warehouse"], ["service"], ["emergency"], ["customer"], ["fuel"], ["maintenance"], ["school"], ["sanitation"]]

        return routeNames.enumerated().map { index, name in
            let numWaypoints = Int.random(in: 3...6)
            let waypoints = (0..<numWaypoints).map { waypointIndex in
                let lat = 38.9072 + Double.random(in: -0.1...0.1)
                let lon = -77.0369 + Double.random(in: -0.1...0.1)

                let type: WaypointType
                if waypointIndex == 0 {
                    type = .origin
                } else if waypointIndex == numWaypoints - 1 {
                    type = .destination
                } else {
                    type = WaypointType.allCases.filter { $0 != .origin && $0 != .destination }.randomElement()!
                }

                return Waypoint(
                    id: UUID().uuidString,
                    order: waypointIndex,
                    location: Coordinate(latitude: lat, longitude: lon),
                    name: type == .origin ? "Start Point" : type == .destination ? "End Point" : "Stop \(waypointIndex)",
                    address: "\(Int.random(in: 100...999)) Street \(waypointIndex), City, ST",
                    type: type,
                    estimatedArrival: nil,
                    notes: waypointIndex % 2 == 0 ? "Check inventory" : nil
                )
            }

            let distance = Double.random(in: 3000...50000)
            let duration = distance / 16.67 // Average 60 km/h

            return Route(
                id: "ROUTE-\(String(format: "%03d", index + 1))",
                tenantId: "tenant-1",
                name: name,
                description: "Route for \(name.lowercased())",
                waypoints: waypoints,
                distance: distance,
                estimatedDuration: duration,
                isFavorite: index % 3 == 0,
                usageCount: Int.random(in: 0...50),
                createdDate: Date().addingTimeInterval(Double(-index * 86400 * 7)),
                createdBy: "Admin",
                lastModifiedDate: index % 2 == 0 ? Date().addingTimeInterval(Double(-index * 86400)) : nil,
                lastModifiedBy: index % 2 == 0 ? "Manager" : nil,
                lastUsedDate: index % 4 != 0 ? Date().addingTimeInterval(Double(-index * 3600)) : nil,
                tags: tags[index],
                trafficEnabled: index % 2 == 0,
                currentTrafficCondition: index % 2 == 0 ? TrafficCondition.allCases.randomElement() : nil,
                notes: index % 5 == 0 ? "Avoid during rush hour" : nil
            )
        }
    }

    private func generateMockUsageHistory(for route: Route) -> [RouteUsageHistory] {
        let vehicleNumbers = ["V-12345", "V-12346", "V-12347"]
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson"]

        return (0..<Int.random(in: 5...15)).map { index in
            let duration = route.estimatedDuration * Double.random(in: 0.9...1.3)
            let distance = route.distance * Double.random(in: 0.95...1.1)

            return RouteUsageHistory(
                id: UUID().uuidString,
                routeId: route.id,
                vehicleId: "VEH-\(String(format: "%03d", index + 1))",
                vehicleNumber: vehicleNumbers.randomElement()!,
                driverId: "DRV-\(String(format: "%03d", index + 1))",
                driverName: drivers.randomElement()!,
                startTime: Date().addingTimeInterval(Double(-index * 86400)),
                endTime: Date().addingTimeInterval(Double(-index * 86400) + duration),
                actualDistance: distance,
                actualDuration: duration,
                fuelUsed: distance / 1000 * Double.random(in: 8...12), // L/100km
                deviations: Int.random(in: 0...3),
                completed: index % 10 != 0
            )
        }
    }

    private func generateMockStatistics() -> RouteStatistics {
        let totalDistance = routes.reduce(0.0) { $0 + $1.distance }
        let totalUsages = routes.reduce(0) { $0 + $1.usageCount }
        let avgDistance = routes.isEmpty ? 0 : totalDistance / Double(routes.count)
        let avgDuration = routes.isEmpty ? 0 : routes.reduce(0.0) { $0 + $1.estimatedDuration } / Double(routes.count)

        return RouteStatistics(
            totalRoutes: routes.count,
            favoriteRoutes: favoriteRoutes.count,
            totalDistance: totalDistance,
            totalUsages: totalUsages,
            averageDistance: avgDistance,
            averageDuration: avgDuration,
            mostUsedRoute: mostUsedRoutes.first
        )
    }
}
