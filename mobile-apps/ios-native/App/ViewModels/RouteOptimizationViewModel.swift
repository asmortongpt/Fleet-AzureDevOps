//
//  RouteOptimizationViewModel.swift
//  Fleet Manager
//
//  Route optimization with TSP algorithm and API integration
//

import Foundation
import CoreLocation
import Combine
import SwiftUI

@MainActor
class RouteOptimizationViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var waypoints: [RouteWaypoint] = []
    @Published var optimizedRoute: OptimizedRoute?
    @Published var preferences: OptimizationPreferences = .default
    @Published var isOptimizing = false
    @Published var savedRoutes: [OptimizedRoute] = []
    @Published var selectedVehicleId: String?
    @Published var showingSaveDialog = false

    // Cache keys
    private let savedRoutesKey = "saved_optimized_routes"
    private let apiEndpoint = "/api/v1/routes/optimize"

    // MARK: - Initialization
    override init() {
        super.init()
        loadSavedRoutes()
        loadMockWaypoints()
    }

    // MARK: - Waypoint Management
    func addWaypoint(_ waypoint: RouteWaypoint) {
        var newWaypoint = waypoint
        newWaypoint.sequenceNumber = waypoints.count
        waypoints.append(newWaypoint)
        ModernTheme.Haptics.light()
    }

    func removeWaypoint(at index: Int) {
        guard index < waypoints.count else { return }
        waypoints.remove(at: index)
        reorderWaypoints()
        ModernTheme.Haptics.medium()
    }

    func moveWaypoint(from source: IndexSet, to destination: Int) {
        waypoints.move(fromOffsets: source, toOffset: destination)
        reorderWaypoints()
        ModernTheme.Haptics.selection()
    }

    func updateWaypoint(_ waypoint: RouteWaypoint) {
        if let index = waypoints.firstIndex(where: { $0.id == waypoint.id }) {
            waypoints[index] = waypoint
        }
    }

    private func reorderWaypoints() {
        for (index, _) in waypoints.enumerated() {
            waypoints[index].sequenceNumber = index
        }
    }

    func clearWaypoints() {
        waypoints.removeAll()
        optimizedRoute = nil
        ModernTheme.Haptics.medium()
    }

    // MARK: - Route Optimization
    func optimizeRoute() async {
        guard waypoints.count >= 2 else {
            handleErrorMessage("Please add at least 2 waypoints to optimize a route")
            return
        }

        isOptimizing = true
        startLoading()

        // Try API first, fallback to local algorithm
        do {
            if let route = try await optimizeWithAPI() {
                optimizedRoute = route
                ModernTheme.Haptics.success()
            } else {
                // Fallback to local algorithm
                let route = await optimizeLocally()
                optimizedRoute = route
                ModernTheme.Haptics.success()
            }
        } catch {
            // Fallback to local algorithm on error
            let route = await optimizeLocally()
            optimizedRoute = route
            ModernTheme.Haptics.success()
        }

        isOptimizing = false
        finishLoading()
    }

    // MARK: - API Optimization
    private func optimizeWithAPI() async throws -> OptimizedRoute? {
        let request = OptimizeRouteRequest(
            waypoints: waypoints,
            preferences: preferences,
            vehicleId: selectedVehicleId
        )

        guard let url = URL(string: "\(APIConfig.baseURL)\(apiEndpoint)") else {
            return nil
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add authentication token
        if let token = await AuthenticationManager.shared.getAccessToken() {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        urlRequest.httpBody = try JSONEncoder().encode(request)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            return nil
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let result = try decoder.decode(OptimizeRouteResponse.self, from: data)

        return result.success ? result.optimizedRoute : nil
    }

    // MARK: - Local Optimization (TSP Algorithm)
    private func optimizeLocally() async -> OptimizedRoute {
        let originalWaypoints = waypoints

        // Separate fixed start/end points from stops that can be reordered
        let fixedStart = waypoints.first!
        let fixedEnd = waypoints.count > 2 ? waypoints.last! : nil
        let reorderableWaypoints = Array(waypoints.dropFirst(fixedEnd != nil ? 1 : 0).dropLast(fixedEnd != nil ? 1 : 0))

        // Optimize the reorderable waypoints using TSP
        let optimizedMiddle = await tspOptimization(
            waypoints: reorderableWaypoints,
            startPoint: fixedStart,
            objective: preferences.objective
        )

        // Construct the final optimized waypoint list
        var optimizedWaypoints: [RouteWaypoint] = [fixedStart]
        optimizedWaypoints.append(contentsOf: optimizedMiddle)
        if let end = fixedEnd {
            optimizedWaypoints.append(end)
        }

        // Update sequence numbers
        for (index, _) in optimizedWaypoints.enumerated() {
            optimizedWaypoints[index].sequenceNumber = index
        }

        // Calculate route metrics
        let (distance, duration) = calculateRouteMetrics(waypoints: optimizedWaypoints)
        let originalMetrics = calculateRouteMetrics(waypoints: originalWaypoints)
        let fuelCost = calculateFuelCost(distance: distance)

        // Calculate savings
        let distanceSaved = originalMetrics.distance - distance
        let timeSaved = originalMetrics.duration - duration
        let fuelCostSaved = (calculateFuelCost(distance: originalMetrics.distance) - fuelCost)
        let improvementPercentage = (distanceSaved / originalMetrics.distance) * 100

        let savings = RouteSavings(
            distanceSaved: distanceSaved,
            timeSaved: timeSaved,
            fuelCostSaved: fuelCostSaved,
            improvementPercentage: improvementPercentage
        )

        // Create route segments
        let segments = createRouteSegments(waypoints: optimizedWaypoints)

        return OptimizedRoute(
            originalWaypoints: originalWaypoints,
            optimizedWaypoints: optimizedWaypoints,
            totalDistance: distance,
            totalDuration: duration,
            estimatedFuelCost: fuelCost,
            preferences: preferences,
            routeSegments: segments,
            savings: savings
        )
    }

    // MARK: - TSP Algorithm (Nearest Neighbor Heuristic)
    private func tspOptimization(
        waypoints: [RouteWaypoint],
        startPoint: RouteWaypoint,
        objective: OptimizationObjective
    ) async -> [RouteWaypoint] {
        guard !waypoints.isEmpty else { return [] }

        var remaining = waypoints
        var optimized: [RouteWaypoint] = []
        var currentPoint = startPoint

        // Nearest neighbor algorithm
        while !remaining.isEmpty {
            let (nearest, index) = findNearestWaypoint(
                from: currentPoint,
                in: remaining,
                objective: objective
            )

            optimized.append(nearest)
            remaining.remove(at: index)
            currentPoint = nearest
        }

        // Try 2-opt improvement
        if preferences.objective == .minimizeDistance || preferences.objective == .balancedDistanceTime {
            return twoOptImprovement(route: optimized)
        }

        return optimized
    }

    // MARK: - Nearest Neighbor Selection
    private func findNearestWaypoint(
        from current: RouteWaypoint,
        in waypoints: [RouteWaypoint],
        objective: OptimizationObjective
    ) -> (RouteWaypoint, Int) {
        var bestWaypoint = waypoints[0]
        var bestIndex = 0
        var bestScore = Double.infinity

        for (index, waypoint) in waypoints.enumerated() {
            let score = calculateScore(
                from: current,
                to: waypoint,
                objective: objective
            )

            if score < bestScore {
                bestScore = score
                bestWaypoint = waypoint
                bestIndex = index
            }
        }

        return (bestWaypoint, bestIndex)
    }

    // MARK: - 2-Opt Improvement
    private func twoOptImprovement(route: [RouteWaypoint]) -> [RouteWaypoint] {
        var improved = route
        var improvement = true

        while improvement {
            improvement = false

            for i in 1..<improved.count - 1 {
                for j in (i + 1)..<improved.count {
                    let currentDistance = calculateSegmentDistance(improved, i - 1, i) +
                                        calculateSegmentDistance(improved, j, j == improved.count - 1 ? 0 : j + 1)

                    // Reverse segment [i...j]
                    var newRoute = improved
                    newRoute[i...j].reverse()

                    let newDistance = calculateSegmentDistance(newRoute, i - 1, i) +
                                    calculateSegmentDistance(newRoute, j, j == improved.count - 1 ? 0 : j + 1)

                    if newDistance < currentDistance {
                        improved = newRoute
                        improvement = true
                    }
                }
            }
        }

        return improved
    }

    // MARK: - Distance Calculations
    private func calculateSegmentDistance(_ waypoints: [RouteWaypoint], _ from: Int, _ to: Int) -> Double {
        let fromLocation = CLLocation(
            latitude: waypoints[from].coordinate.latitude,
            longitude: waypoints[from].coordinate.longitude
        )
        let toLocation = CLLocation(
            latitude: waypoints[to].coordinate.latitude,
            longitude: waypoints[to].coordinate.longitude
        )
        return fromLocation.distance(from: toLocation)
    }

    private func calculateScore(
        from: RouteWaypoint,
        to: RouteWaypoint,
        objective: OptimizationObjective
    ) -> Double {
        let distance = calculateDistance(from: from, to: to)

        switch objective {
        case .minimizeDistance:
            // Prioritize shorter distances, but factor in waypoint priority
            let priorityWeight = 1.0 / Double(to.priority == .urgent ? 0.5 : to.priority == .high ? 0.75 : 1.0)
            return distance * priorityWeight

        case .minimizeTime:
            // Estimate time based on distance (simplified)
            let estimatedSpeed = preferences.avoidHighways ? 50.0 : 80.0 // km/h
            let timeHours = (distance / 1000.0) / estimatedSpeed
            return timeHours * 3600 // Convert to seconds

        case .minimizeFuel:
            // Estimate fuel consumption (simplified)
            let fuelPerKm = preferences.vehicleConstraints?.averageFuelConsumption ?? 8.0 // L/100km
            return (distance / 1000.0) * (fuelPerKm / 100.0)

        case .balancedDistanceTime:
            let time = (distance / 1000.0) / 60.0 // Assume 60 km/h average
            return (distance / 1000.0) + (time * 60) // Balance distance (km) and time (min as km equivalent)
        }
    }

    private func calculateDistance(from: RouteWaypoint, to: RouteWaypoint) -> Double {
        let fromLocation = CLLocation(
            latitude: from.coordinate.latitude,
            longitude: from.coordinate.longitude
        )
        let toLocation = CLLocation(
            latitude: to.coordinate.latitude,
            longitude: to.coordinate.longitude
        )
        return fromLocation.distance(from: toLocation)
    }

    // MARK: - Route Metrics Calculation
    private func calculateRouteMetrics(waypoints: [RouteWaypoint]) -> (distance: Double, duration: TimeInterval) {
        var totalDistance: Double = 0
        var totalDuration: TimeInterval = 0

        for i in 0..<waypoints.count - 1 {
            let distance = calculateDistance(from: waypoints[i], to: waypoints[i + 1])
            totalDistance += distance

            // Estimate duration (simplified)
            let avgSpeed = preferences.avoidHighways ? 50.0 : 80.0 // km/h
            let segmentDuration = (distance / 1000.0) / avgSpeed * 3600 // seconds
            totalDuration += segmentDuration + waypoints[i].stopDuration
        }

        // Add last waypoint stop duration
        if let last = waypoints.last {
            totalDuration += last.stopDuration
        }

        return (totalDistance, totalDuration)
    }

    private func calculateFuelCost(distance: Double) -> Double {
        let fuelPerKm = preferences.vehicleConstraints?.averageFuelConsumption ?? 8.0 // L/100km
        let fuelPrice = 1.50 // $ per liter (simplified)
        let distanceKm = distance / 1000.0
        return (distanceKm / 100.0) * fuelPerKm * fuelPrice
    }

    // MARK: - Route Segments Creation
    private func createRouteSegments(waypoints: [RouteWaypoint]) -> [RouteSegment] {
        var segments: [RouteSegment] = []

        for i in 0..<waypoints.count - 1 {
            let from = waypoints[i]
            let to = waypoints[i + 1]
            let distance = calculateDistance(from: from, to: to)
            let avgSpeed = preferences.avoidHighways ? 50.0 : 80.0
            let duration = (distance / 1000.0) / avgSpeed * 3600

            let segment = RouteSegment(
                id: UUID().uuidString,
                fromWaypoint: from,
                toWaypoint: to,
                distance: distance,
                duration: duration,
                polyline: nil,
                instructions: nil
            )
            segments.append(segment)
        }

        return segments
    }

    // MARK: - Save & Load Routes
    func saveOptimizedRoute() {
        guard let route = optimizedRoute else { return }

        savedRoutes.insert(route, at: 0)
        persistSavedRoutes()
        ModernTheme.Haptics.success()
    }

    func deleteRoute(_ route: OptimizedRoute) {
        savedRoutes.removeAll { $0.id == route.id }
        persistSavedRoutes()
        ModernTheme.Haptics.medium()
    }

    private func persistSavedRoutes() {
        if let encoded = try? JSONEncoder().encode(savedRoutes) {
            UserDefaults.standard.set(encoded, forKey: savedRoutesKey)
        }
    }

    private func loadSavedRoutes() {
        if let data = UserDefaults.standard.data(forKey: savedRoutesKey),
           let decoded = try? JSONDecoder().decode([OptimizedRoute].self, from: data) {
            savedRoutes = decoded
        }
    }

    // MARK: - Mock Data
    private func loadMockWaypoints() {
        #if DEBUG
        // Load sample waypoints for testing
        waypoints = RouteWaypoint.samples
        #endif
    }

    // MARK: - Export
    func exportToNavigationApp(route: OptimizedRoute) {
        // Create Apple Maps URL with waypoints
        var urlComponents = URLComponents()
        urlComponents.scheme = "http"
        urlComponents.host = "maps.apple.com"

        var queryItems: [URLQueryItem] = []

        for (index, waypoint) in route.optimizedWaypoints.enumerated() {
            queryItems.append(URLQueryItem(
                name: index == 0 ? "saddr" : "daddr",
                value: "\(waypoint.coordinate.latitude),\(waypoint.coordinate.longitude)"
            ))
        }

        urlComponents.queryItems = queryItems

        if let url = urlComponents.url {
            UIApplication.shared.open(url)
            ModernTheme.Haptics.success()
        }
    }

    // MARK: - Refresh Override
    override func refresh() async {
        await optimizeRoute()
    }
}

// MARK: - API Config
private struct APIConfig {
    static let baseURL = "https://api.fleetmanager.com" // Replace with actual API URL
}
