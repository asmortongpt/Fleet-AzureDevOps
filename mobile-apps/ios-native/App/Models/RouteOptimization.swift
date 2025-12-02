//
//  RouteOptimization.swift
//  Fleet Manager
//
//  Route Optimization models and data structures
//

import Foundation
import CoreLocation
import SwiftUI

// MARK: - Route Waypoint
/// Waypoint for route optimization with enhanced properties
struct RouteWaypoint: Codable, Identifiable, Equatable, Hashable {
    let id: String
    var sequenceNumber: Int
    let address: String
    let name: String?
    let coordinate: Coordinate
    var stopDuration: TimeInterval // Duration in seconds
    var arrivalTime: Date?
    var departureTime: Date?
    var completed: Bool
    let notes: String?
    let priority: WaypointPriority

    init(
        id: String = UUID().uuidString,
        sequenceNumber: Int,
        address: String,
        name: String? = nil,
        coordinate: Coordinate,
        stopDuration: TimeInterval = 300, // 5 minutes default
        arrivalTime: Date? = nil,
        departureTime: Date? = nil,
        completed: Bool = false,
        notes: String? = nil,
        priority: WaypointPriority = .normal
    ) {
        self.id = id
        self.sequenceNumber = sequenceNumber
        self.address = address
        self.name = name
        self.coordinate = coordinate
        self.stopDuration = stopDuration
        self.arrivalTime = arrivalTime
        self.departureTime = departureTime
        self.completed = completed
        self.notes = notes
        self.priority = priority
    }

    var clCoordinate: CLLocationCoordinate2D {
        coordinate.clCoordinate
    }

    var formattedStopDuration: String {
        let minutes = Int(stopDuration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins == 0 ? "\(hours) hr" : "\(hours) hr \(mins) min"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case sequenceNumber = "sequence_number"
        case address
        case name
        case coordinate
        case stopDuration = "stop_duration"
        case arrivalTime = "arrival_time"
        case departureTime = "departure_time"
        case completed
        case notes
        case priority
    }
}

// MARK: - Waypoint Priority
enum WaypointPriority: String, Codable, CaseIterable {
    case low = "Low"
    case normal = "Normal"
    case high = "High"
    case urgent = "Urgent"

    var color: Color {
        switch self {
        case .low: return .gray
        case .normal: return .blue
        case .high: return .orange
        case .urgent: return .red
        }
    }

    var icon: String {
        switch self {
        case .low: return "circle"
        case .normal: return "circle.fill"
        case .high: return "exclamationmark.circle.fill"
        case .urgent: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Optimization Preferences
struct OptimizationPreferences: Codable, Equatable {
    var objective: OptimizationObjective
    var avoidTolls: Bool
    var avoidHighways: Bool
    var respectTimeWindows: Bool
    var vehicleConstraints: VehicleConstraints?
    var trafficConsideration: TrafficConsideration
    var maxRouteDistance: Double? // in meters
    var maxRouteDuration: TimeInterval? // in seconds
    var startTime: Date?

    init(
        objective: OptimizationObjective = .minimizeDistance,
        avoidTolls: Bool = false,
        avoidHighways: Bool = false,
        respectTimeWindows: Bool = true,
        vehicleConstraints: VehicleConstraints? = nil,
        trafficConsideration: TrafficConsideration = .current,
        maxRouteDistance: Double? = nil,
        maxRouteDuration: TimeInterval? = nil,
        startTime: Date? = nil
    ) {
        self.objective = objective
        self.avoidTolls = avoidTolls
        self.avoidHighways = avoidHighways
        self.respectTimeWindows = respectTimeWindows
        self.vehicleConstraints = vehicleConstraints
        self.trafficConsideration = trafficConsideration
        self.maxRouteDistance = maxRouteDistance
        self.maxRouteDuration = maxRouteDuration
        self.startTime = startTime
    }

    enum CodingKeys: String, CodingKey {
        case objective
        case avoidTolls = "avoid_tolls"
        case avoidHighways = "avoid_highways"
        case respectTimeWindows = "respect_time_windows"
        case vehicleConstraints = "vehicle_constraints"
        case trafficConsideration = "traffic_consideration"
        case maxRouteDistance = "max_route_distance"
        case maxRouteDuration = "max_route_duration"
        case startTime = "start_time"
    }

    static var `default`: OptimizationPreferences {
        OptimizationPreferences()
    }
}

// MARK: - Optimization Objective
enum OptimizationObjective: String, Codable, CaseIterable {
    case minimizeDistance = "Minimize Distance"
    case minimizeTime = "Minimize Time"
    case minimizeFuel = "Minimize Fuel Cost"
    case balancedDistanceTime = "Balanced"

    var description: String {
        switch self {
        case .minimizeDistance:
            return "Find the shortest route by distance"
        case .minimizeTime:
            return "Find the fastest route by time"
        case .minimizeFuel:
            return "Optimize for lowest fuel consumption"
        case .balancedDistanceTime:
            return "Balance distance and time equally"
        }
    }

    var icon: String {
        switch self {
        case .minimizeDistance: return "road.lanes"
        case .minimizeTime: return "clock.fill"
        case .minimizeFuel: return "fuelpump.fill"
        case .balancedDistanceTime: return "chart.bar.fill"
        }
    }
}

// MARK: - Traffic Consideration
enum TrafficConsideration: String, Codable, CaseIterable {
    case none = "None"
    case current = "Current Traffic"
    case historical = "Historical Traffic"
    case predictive = "Predictive Traffic"

    var description: String {
        switch self {
        case .none: return "Don't consider traffic"
        case .current: return "Use current traffic conditions"
        case .historical: return "Use historical traffic patterns"
        case .predictive: return "Predict traffic at arrival time"
        }
    }
}

// MARK: - Vehicle Constraints
struct VehicleConstraints: Codable, Equatable {
    var maxWeight: Double? // in kg
    var maxHeight: Double? // in meters
    var maxWidth: Double? // in meters
    var maxLength: Double? // in meters
    var fuelCapacity: Double? // in liters
    var averageFuelConsumption: Double? // liters per 100km
    var requiredFacilities: [String]? // e.g., "loading dock", "overhead clearance"

    enum CodingKeys: String, CodingKey {
        case maxWeight = "max_weight"
        case maxHeight = "max_height"
        case maxWidth = "max_width"
        case maxLength = "max_length"
        case fuelCapacity = "fuel_capacity"
        case averageFuelConsumption = "average_fuel_consumption"
        case requiredFacilities = "required_facilities"
    }
}

// MARK: - Optimized Route
struct OptimizedRoute: Codable, Identifiable, Equatable {
    let id: String
    let originalWaypoints: [RouteWaypoint]
    let optimizedWaypoints: [RouteWaypoint]
    let totalDistance: Double // in meters
    let totalDuration: TimeInterval // in seconds
    let estimatedFuelCost: Double?
    let optimizedAt: Date
    let preferences: OptimizationPreferences
    let routeSegments: [RouteSegment]
    let savings: RouteSavings

    init(
        id: String = UUID().uuidString,
        originalWaypoints: [RouteWaypoint],
        optimizedWaypoints: [RouteWaypoint],
        totalDistance: Double,
        totalDuration: TimeInterval,
        estimatedFuelCost: Double? = nil,
        optimizedAt: Date = Date(),
        preferences: OptimizationPreferences,
        routeSegments: [RouteSegment],
        savings: RouteSavings
    ) {
        self.id = id
        self.originalWaypoints = originalWaypoints
        self.optimizedWaypoints = optimizedWaypoints
        self.totalDistance = totalDistance
        self.totalDuration = totalDuration
        self.estimatedFuelCost = estimatedFuelCost
        self.optimizedAt = optimizedAt
        self.preferences = preferences
        self.routeSegments = routeSegments
        self.savings = savings
    }

    var formattedDistance: String {
        if totalDistance >= 1000 {
            return String(format: "%.1f km", totalDistance / 1000)
        } else {
            return String(format: "%.0f m", totalDistance)
        }
    }

    var formattedDuration: String {
        let minutes = Int(totalDuration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins == 0 ? "\(hours) hr" : "\(hours) hr \(mins) min"
        }
    }

    var formattedFuelCost: String? {
        guard let cost = estimatedFuelCost else { return nil }
        return String(format: "$%.2f", cost)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case originalWaypoints = "original_waypoints"
        case optimizedWaypoints = "optimized_waypoints"
        case totalDistance = "total_distance"
        case totalDuration = "total_duration"
        case estimatedFuelCost = "estimated_fuel_cost"
        case optimizedAt = "optimized_at"
        case preferences
        case routeSegments = "route_segments"
        case savings
    }
}

// MARK: - Route Segment
struct RouteSegment: Codable, Identifiable, Equatable {
    let id: String
    let fromWaypoint: RouteWaypoint
    let toWaypoint: RouteWaypoint
    let distance: Double // in meters
    let duration: TimeInterval // in seconds
    let polyline: String? // Encoded polyline for map display
    let instructions: [TurnInstruction]?

    var formattedDistance: String {
        if distance >= 1000 {
            return String(format: "%.1f km", distance / 1000)
        } else {
            return String(format: "%.0f m", distance)
        }
    }

    var formattedDuration: String {
        let minutes = Int(duration / 60)
        return "\(minutes) min"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case fromWaypoint = "from_waypoint"
        case toWaypoint = "to_waypoint"
        case distance
        case duration
        case polyline
        case instructions
    }
}

// MARK: - Turn Instruction
struct TurnInstruction: Codable, Identifiable, Equatable {
    let id: String
    let maneuver: String
    let instruction: String
    let distance: Double // Distance to next instruction
    let duration: TimeInterval

    enum CodingKeys: String, CodingKey {
        case id
        case maneuver
        case instruction
        case distance
        case duration
    }
}

// MARK: - Route Savings
struct RouteSavings: Codable, Equatable {
    let distanceSaved: Double // in meters
    let timeSaved: TimeInterval // in seconds
    let fuelCostSaved: Double?
    let improvementPercentage: Double

    var formattedDistanceSaved: String {
        let km = distanceSaved / 1000
        let sign = distanceSaved >= 0 ? "-" : "+"
        return String(format: "%@%.1f km", sign, abs(km))
    }

    var formattedTimeSaved: String {
        let minutes = Int(abs(timeSaved) / 60)
        let sign = timeSaved >= 0 ? "-" : "+"
        return String(format: "%@%d min", sign, minutes)
    }

    var formattedFuelCostSaved: String? {
        guard let cost = fuelCostSaved else { return nil }
        let sign = cost >= 0 ? "-" : "+"
        return String(format: "%@$%.2f", sign, abs(cost))
    }

    var formattedImprovement: String {
        return String(format: "%.1f%%", improvementPercentage)
    }

    enum CodingKeys: String, CodingKey {
        case distanceSaved = "distance_saved"
        case timeSaved = "time_saved"
        case fuelCostSaved = "fuel_cost_saved"
        case improvementPercentage = "improvement_percentage"
    }
}

// MARK: - Coordinate Extension
extension Coordinate {
    var clCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - API Request Models
struct OptimizeRouteRequest: Codable {
    let waypoints: [RouteWaypoint]
    let preferences: OptimizationPreferences
    let vehicleId: String?

    enum CodingKeys: String, CodingKey {
        case waypoints
        case preferences
        case vehicleId = "vehicle_id"
    }
}

// MARK: - API Response Models
struct OptimizeRouteResponse: Codable {
    let optimizedRoute: OptimizedRoute
    let success: Bool
    let message: String?

    enum CodingKeys: String, CodingKey {
        case optimizedRoute = "optimized_route"
        case success
        case message
    }
}

// MARK: - Multi-Vehicle Route Optimization
struct MultiVehicleOptimization: Codable, Identifiable {
    let id: String
    let vehicleRoutes: [VehicleRoute]
    let totalDistance: Double
    let totalDuration: TimeInterval
    let totalVehicles: Int
    let optimizedAt: Date

    var formattedDistance: String {
        String(format: "%.1f km", totalDistance / 1000)
    }

    var formattedDuration: String {
        let hours = Int(totalDuration / 3600)
        let minutes = Int((totalDuration.truncatingRemainder(dividingBy: 3600)) / 60)
        return "\(hours) hr \(minutes) min"
    }

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleRoutes = "vehicle_routes"
        case totalDistance = "total_distance"
        case totalDuration = "total_duration"
        case totalVehicles = "total_vehicles"
        case optimizedAt = "optimized_at"
    }
}

// MARK: - Vehicle Route
struct VehicleRoute: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let route: OptimizedRoute
    let utilizationPercentage: Double

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case route
        case utilizationPercentage = "utilization_percentage"
    }
}

// MARK: - Sample Data
extension RouteWaypoint {
    static var samples: [RouteWaypoint] {
        [
            RouteWaypoint(
                sequenceNumber: 0,
                address: "1600 Pennsylvania Avenue NW, Washington, DC 20500",
                name: "Start Point",
                coordinate: Coordinate(latitude: 38.8977, longitude: -77.0365),
                priority: .high
            ),
            RouteWaypoint(
                sequenceNumber: 1,
                address: "1 Capitol St NE, Washington, DC 20002",
                name: "Capitol Building",
                coordinate: Coordinate(latitude: 38.8899, longitude: -77.0091),
                stopDuration: 600,
                priority: .urgent
            ),
            RouteWaypoint(
                sequenceNumber: 2,
                address: "2 Lincoln Memorial Cir NW, Washington, DC 20037",
                name: "Lincoln Memorial",
                coordinate: Coordinate(latitude: 38.8893, longitude: -77.0502),
                stopDuration: 300,
                priority: .normal
            ),
            RouteWaypoint(
                sequenceNumber: 3,
                address: "900 Ohio Dr SW, Washington, DC 20024",
                name: "Jefferson Memorial",
                coordinate: Coordinate(latitude: 38.8814, longitude: -77.0365),
                stopDuration: 300,
                priority: .normal
            ),
            RouteWaypoint(
                sequenceNumber: 4,
                address: "1000 Jefferson Dr SW, Washington, DC 20560",
                name: "Smithsonian",
                coordinate: Coordinate(latitude: 38.8886, longitude: -77.0259),
                stopDuration: 900,
                priority: .low
            )
        ]
    }
}

extension OptimizedRoute {
    static var sample: OptimizedRoute {
        let waypoints = RouteWaypoint.samples
        return OptimizedRoute(
            originalWaypoints: waypoints,
            optimizedWaypoints: waypoints.sorted { $0.priority.rawValue > $1.priority.rawValue },
            totalDistance: 15420,
            totalDuration: 2700,
            estimatedFuelCost: 3.75,
            preferences: .default,
            routeSegments: [],
            savings: RouteSavings(
                distanceSaved: 2340,
                timeSaved: 420,
                fuelCostSaved: 0.85,
                improvementPercentage: 15.2
            )
        )
    }
}
