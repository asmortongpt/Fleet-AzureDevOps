/**
 * Vehicle Idling ViewModel
 *
 * Manages data and business logic for vehicle idling monitoring
 */

import Foundation
import Combine

// MARK: - Models

struct IdlingVehicle: Identifiable, Hashable {
    let id = UUID()
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String
    let severity: String
    let idleSeconds: Int
    let estimatedFuelWaste: Double
    let estimatedCost: Double
    let driverName: String?
    let location: String?
    let latitude: Double?
    let longitude: Double?
    let startTime: String

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: IdlingVehicle, rhs: IdlingVehicle) -> Bool {
        lhs.id == rhs.id
    }
}

struct IdlingEvent: Identifiable {
    let id: Int
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String
    let driverName: String?
    let startTime: String
    let endTime: String?
    let durationSeconds: Int
    let fuelWaste: Double
    let cost: Double
}

struct FleetIdlingStats {
    let totalEvents: Int
    let totalHours: Double
    let totalFuelWaste: Double
    let totalCost: Double
    let averageIdleTimeMinutes: Double
}

struct TopOffender: Identifiable {
    let id: Int
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String
    let eventCount: Int
    let totalHours: Double
    let totalCost: Double
}

struct DriverPerformance: Identifiable {
    let id: Int
    let driverId: Int
    let driverName: String
    let eventCount: Int
    let totalHours: Double
    let avgIdleTimeMinutes: Double
    let score: Int
}

struct IdlingThresholds {
    var warningSeconds: Int
    var alertSeconds: Int
    var criticalSeconds: Int
}

// MARK: - ViewModel

class VehicleIdlingViewModel: ObservableObject {
    @Published var activeIdlingVehicles: [IdlingVehicle] = []
    @Published var idlingHistory: [IdlingEvent] = []
    @Published var fleetStats: FleetIdlingStats = FleetIdlingStats(
        totalEvents: 0,
        totalHours: 0,
        totalFuelWaste: 0,
        totalCost: 0,
        averageIdleTimeMinutes: 0
    )
    @Published var topOffenders: [TopOffender] = []
    @Published var driverPerformance: [DriverPerformance] = []
    @Published var thresholds: IdlingThresholds = IdlingThresholds(
        warningSeconds: 300,
        alertSeconds: 600,
        criticalSeconds: 1800
    )

    @Published var isLoading = false
    @Published var errorMessage: String?

    private var cancellables = Set<AnyCancellable>()
    private var refreshTimer: Timer?

    private let baseURL: String = {
        #if DEBUG
        return "http://localhost:3001/api/v1/idling"
        #else
        return "https://api.yourdomain.com/api/v1/idling"
        #endif
    }()

    // MARK: - Authentication

    private func getAuthToken() -> String? {
        return KeychainManager.shared.getToken()
    }

    private func makeAuthenticatedRequest(url: URL, method: String = "GET", body: Data? = nil) -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = body
        }

        return request
    }

    // MARK: - Data Loading

    func startMonitoring() {
        refreshData()

        // Refresh every 30 seconds
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.refreshData()
        }
    }

    func stopMonitoring() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }

    func refreshData() {
        loadActiveIdling()
        loadFleetStats()
        loadTopOffenders()
        loadDriverPerformance()
    }

    // MARK: - Active Idling

    func loadActiveIdling() {
        guard let url = URL(string: "\(baseURL)/active") else { return }

        isLoading = true

        URLSession.shared.dataTaskPublisher(for: makeAuthenticatedRequest(url: url))
            .map(\.data)
            .decode(type: ActiveIdlingResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false

                    if case .failure(let error) = completion {
                        self?.errorMessage = "Failed to load active idling: \(error.localizedDescription)"
                        print("Error loading active idling: \(error)")
                    }
                },
                receiveValue: { [weak self] response in
                    self?.activeIdlingVehicles = response.vehicles.map { vehicle in
                        IdlingVehicle(
                            vehicleId: vehicle.vehicleId,
                            vehicleName: vehicle.vehicleName,
                            licensePlate: vehicle.licensePlate ?? "N/A",
                            severity: vehicle.severity,
                            idleSeconds: vehicle.idleSeconds,
                            estimatedFuelWaste: vehicle.estimatedFuelWaste,
                            estimatedCost: vehicle.estimatedCost,
                            driverName: vehicle.driverName,
                            location: vehicle.location,
                            latitude: vehicle.latitude,
                            longitude: vehicle.longitude,
                            startTime: vehicle.startTime
                        )
                    }
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - History

    func loadHistory(days: Int = 30) {
        guard let url = URL(string: "\(baseURL)/history?days=\(days)&limit=100") else { return }

        URLSession.shared.dataTaskPublisher(for: makeAuthenticatedRequest(url: url))
            .map(\.data)
            .decode(type: HistoryResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = "Failed to load history: \(error.localizedDescription)"
                        print("Error loading history: \(error)")
                    }
                },
                receiveValue: { [weak self] response in
                    self?.idlingHistory = response.events.map { event in
                        IdlingEvent(
                            id: event.id,
                            vehicleId: event.vehicleId,
                            vehicleName: event.vehicleName,
                            licensePlate: event.licensePlate ?? "N/A",
                            driverName: event.driverName,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            durationSeconds: event.durationSeconds ?? 0,
                            fuelWaste: event.fuelWaste ?? 0,
                            cost: event.cost ?? 0
                        )
                    }
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - Fleet Statistics

    func loadFleetStats() {
        guard let url = URL(string: "\(baseURL)/fleet/stats?days=30") else { return }

        URLSession.shared.dataTaskPublisher(for: makeAuthenticatedRequest(url: url))
            .map(\.data)
            .decode(type: FleetStatsResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Error loading fleet stats: \(error)")
                    }
                },
                receiveValue: { [weak self] response in
                    self?.fleetStats = FleetIdlingStats(
                        totalEvents: response.totalEvents,
                        totalHours: response.totalHours,
                        totalFuelWaste: response.totalFuelWaste,
                        totalCost: response.totalCost,
                        averageIdleTimeMinutes: response.avgIdleTimeMinutes
                    )
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - Top Offenders

    func loadTopOffenders() {
        guard let url = URL(string: "\(baseURL)/top-offenders?days=30&limit=10") else { return }

        URLSession.shared.dataTaskPublisher(for: makeAuthenticatedRequest(url: url))
            .map(\.data)
            .decode(type: TopOffendersResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Error loading top offenders: \(error)")
                    }
                },
                receiveValue: { [weak self] response in
                    self?.topOffenders = response.vehicles.map { vehicle in
                        TopOffender(
                            id: vehicle.vehicleId,
                            vehicleId: vehicle.vehicleId,
                            vehicleName: vehicle.vehicleName,
                            licensePlate: vehicle.licensePlate ?? "N/A",
                            eventCount: vehicle.eventCount,
                            totalHours: vehicle.totalHours,
                            totalCost: vehicle.totalCost
                        )
                    }
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - Driver Performance

    func loadDriverPerformance() {
        guard let url = URL(string: "\(baseURL)/drivers/performance?days=30&limit=10") else { return }

        URLSession.shared.dataTaskPublisher(for: makeAuthenticatedRequest(url: url))
            .map(\.data)
            .decode(type: DriverPerformanceResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Error loading driver performance: \(error)")
                    }
                },
                receiveValue: { [weak self] response in
                    self?.driverPerformance = response.drivers.map { driver in
                        DriverPerformance(
                            id: driver.driverId,
                            driverId: driver.driverId,
                            driverName: driver.driverName,
                            eventCount: driver.eventCount,
                            totalHours: driver.totalHours,
                            avgIdleTimeMinutes: driver.avgIdleTimeMinutes,
                            score: self?.calculateDriverScore(avgIdleMinutes: driver.avgIdleTimeMinutes) ?? 50
                        )
                    }
                }
            )
            .store(in: &cancellables)
    }

    // MARK: - Threshold Management

    func updateThresholds(warning: Int, alert: Int, critical: Int) {
        // In a real app, this would call the API to update thresholds
        thresholds = IdlingThresholds(
            warningSeconds: warning,
            alertSeconds: alert,
            criticalSeconds: critical
        )

        // TODO: Make API call to update thresholds
        // PUT /api/v1/idling/thresholds/:vehicleId
    }

    // MARK: - Actions

    func sendAlertToDriver(vehicleId: Int) {
        print("Sending alert to driver for vehicle \(vehicleId)")

        // TODO: Implement alert sending via push notification or SMS
        // This would integrate with your notification service
    }

    func callDriver(vehicleId: Int) {
        print("Initiating call to driver for vehicle \(vehicleId)")

        // TODO: Implement driver calling functionality
        // This would use tel:// URL scheme or integrate with a calling service
    }

    // MARK: - Helper Methods

    private func calculateDriverScore(avgIdleMinutes: Double) -> Int {
        // Score from 0-100 based on average idle time
        // Lower idle time = higher score
        let maxMinutes = 30.0
        let score = max(0, min(100, Int((1 - (avgIdleMinutes / maxMinutes)) * 100)))
        return score
    }
}

// MARK: - API Response Models

private struct ActiveIdlingResponse: Codable {
    let vehicles: [ActiveIdlingVehicleDTO]
}

private struct ActiveIdlingVehicleDTO: Codable {
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String?
    let severity: String
    let idleSeconds: Int
    let estimatedFuelWaste: Double
    let estimatedCost: Double
    let driverName: String?
    let location: String?
    let latitude: Double?
    let longitude: Double?
    let startTime: String

    enum CodingKeys: String, CodingKey {
        case vehicleId = "vehicle_id"
        case vehicleName = "vehicle_name"
        case licensePlate = "license_plate"
        case severity
        case idleSeconds = "idle_seconds"
        case estimatedFuelWaste = "estimated_fuel_waste"
        case estimatedCost = "estimated_cost"
        case driverName = "driver_name"
        case location
        case latitude
        case longitude
        case startTime = "start_time"
    }
}

private struct HistoryResponse: Codable {
    let events: [HistoryEventDTO]
}

private struct HistoryEventDTO: Codable {
    let id: Int
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String?
    let driverName: String?
    let startTime: String
    let endTime: String?
    let durationSeconds: Int?
    let fuelWaste: Double?
    let cost: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case vehicleId = "vehicle_id"
        case vehicleName = "vehicle_name"
        case licensePlate = "license_plate"
        case driverName = "driver_name"
        case startTime = "start_time"
        case endTime = "end_time"
        case durationSeconds = "duration_seconds"
        case fuelWaste = "fuel_waste_gallons"
        case cost = "estimated_cost"
    }
}

private struct FleetStatsResponse: Codable {
    let totalEvents: Int
    let totalHours: Double
    let totalFuelWaste: Double
    let totalCost: Double
    let avgIdleTimeMinutes: Double

    enum CodingKeys: String, CodingKey {
        case totalEvents = "total_events"
        case totalHours = "total_hours"
        case totalFuelWaste = "total_fuel_waste"
        case totalCost = "total_cost"
        case avgIdleTimeMinutes = "avg_idle_time_minutes"
    }
}

private struct TopOffendersResponse: Codable {
    let vehicles: [TopOffenderDTO]
}

private struct TopOffenderDTO: Codable {
    let vehicleId: Int
    let vehicleName: String
    let licensePlate: String?
    let eventCount: Int
    let totalHours: Double
    let totalCost: Double

    enum CodingKeys: String, CodingKey {
        case vehicleId = "vehicle_id"
        case vehicleName = "vehicle_name"
        case licensePlate = "license_plate"
        case eventCount = "event_count"
        case totalHours = "total_hours"
        case totalCost = "total_cost"
    }
}

private struct DriverPerformanceResponse: Codable {
    let drivers: [DriverPerformanceDTO]
}

private struct DriverPerformanceDTO: Codable {
    let driverId: Int
    let driverName: String
    let eventCount: Int
    let totalHours: Double
    let avgIdleTimeMinutes: Double

    enum CodingKeys: String, CodingKey {
        case driverId = "driver_id"
        case driverName = "driver_name"
        case eventCount = "event_count"
        case totalHours = "total_hours"
        case avgIdleTimeMinutes = "avg_idle_time_minutes"
    }
}
