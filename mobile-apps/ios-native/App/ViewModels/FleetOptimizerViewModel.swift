import Foundation
import Combine
import SwiftUI

// MARK: - Fleet Optimizer ViewModel
@MainActor
class FleetOptimizerViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var metrics: FleetMetrics?
    @Published var recommendations: [OptimizationRecommendation] = []
    @Published var utilizationAnalysis: [UtilizationAnalysis] = []
    @Published var selectedGoal: OptimizationGoal = .reduceCosts
    @Published var vehicles: [Vehicle] = []
    @Published var showingRecommendationDetail: OptimizationRecommendation?
    @Published var implementedRecommendations: Set<String> = []

    // MARK: - Private Properties
    private let apiService = APIService.shared
    private var optimizationTask: Task<Void, Never>?

    // MARK: - Cache Keys
    private let metricsKey = "optimizer_metrics"
    private let recommendationsKey = "optimizer_recommendations"
    private let utilizationKey = "optimizer_utilization"

    // MARK: - Initialization
    override init() {
        super.init()
        loadCachedData()
        loadImplementedRecommendations()
    }

    deinit {
        optimizationTask?.cancel()
    }

    // MARK: - Public Methods

    /// Analyze the fleet and generate comprehensive metrics
    func analyzeFleet() async {
        guard !loadingState.isLoading else { return }

        startLoading()

        do {
            // Fetch vehicles first
            let vehiclesResponse = try await apiService.request(
                endpoint: "/api/v1/vehicles",
                method: "GET",
                responseType: VehiclesResponse.self
            )

            await MainActor.run {
                self.vehicles = vehiclesResponse.vehicles
            }

            // Calculate metrics
            let calculatedMetrics = calculateMetrics(from: vehiclesResponse.vehicles)

            await MainActor.run {
                self.metrics = calculatedMetrics
                cacheObject(calculatedMetrics as AnyObject, forKey: metricsKey)
                finishLoading()
            }
        } catch {
            await MainActor.run {
                handleError(error)
            }
        }
    }

    /// Generate recommendations based on selected optimization goal
    func generateRecommendations(goal: OptimizationGoal) async {
        guard !loadingState.isLoading else { return }

        startLoading()
        selectedGoal = goal

        do {
            let request = OptimizationRequest(goal: goal)

            let response = try await apiService.request(
                endpoint: "/api/v1/fleet/optimize",
                method: "POST",
                body: request,
                responseType: OptimizationResponse.self
            )

            await MainActor.run {
                self.recommendations = response.recommendations.sorted { $0.priority.sortOrder < $1.priority.sortOrder }
                self.metrics = response.metrics
                self.utilizationAnalysis = response.utilizationAnalysis

                cacheObject(response.recommendations as AnyObject, forKey: recommendationsKey)
                cacheObject(response.metrics as AnyObject, forKey: metricsKey)
                cacheObject(response.utilizationAnalysis as AnyObject, forKey: utilizationKey)

                finishLoading()
            }
        } catch {
            // Fallback to local calculation if API fails
            await MainActor.run {
                let localRecommendations = generateLocalRecommendations(for: goal)
                self.recommendations = localRecommendations.sorted { $0.priority.sortOrder < $1.priority.sortOrder }
                finishLoading()
            }
        }
    }

    /// Calculate optimal fleet size based on demand patterns
    func calculateOptimalFleetSize() -> Int {
        guard !vehicles.isEmpty else { return 0 }

        let avgDailyDemand = calculateAverageDemand()
        let peakDemand = calculatePeakDemand()
        let utilizationTarget = 0.75 // 75% utilization target

        let optimalSize = Int(ceil(peakDemand / utilizationTarget))

        return max(optimalSize, Int(ceil(avgDailyDemand / utilizationTarget)))
    }

    /// Identify underutilized vehicles (less than 40% utilization)
    func identifyUnderutilizedVehicles() -> [Vehicle] {
        vehicles.filter { vehicle in
            let utilization = calculateUtilization(for: vehicle)
            return utilization < 0.40
        }
    }

    /// Suggest vehicle replacements based on cost and efficiency
    func suggestReplacements() -> [OptimizationRecommendation] {
        var suggestions: [OptimizationRecommendation] = []

        for vehicle in vehicles {
            let age = calculateVehicleAge(vehicle)
            let maintenanceCost = calculateMaintenanceCost(for: vehicle)
            let avgCost = metrics?.avgMaintenanceCost ?? 5000

            // High maintenance cost vehicles (2x average) that are old
            if maintenanceCost > avgCost * 2.0 && age > 8 {
                let estimatedSavings = (maintenanceCost - avgCost) * 0.7

                suggestions.append(OptimizationRecommendation(
                    type: .replaceVehicle,
                    title: "Replace High-Cost Vehicle \(vehicle.number)",
                    description: "Vehicle \(vehicle.number) has maintenance costs \(Int((maintenanceCost / avgCost) * 100))% above fleet average. Consider replacement with newer model.",
                    estimatedSavings: estimatedSavings,
                    priority: maintenanceCost > avgCost * 3.0 ? .high : .medium,
                    implementationSteps: [
                        "Review vehicle total cost of ownership",
                        "Compare with new vehicle lease/purchase options",
                        "Plan transition timeline",
                        "Dispose of old vehicle"
                    ],
                    affectedVehicles: [vehicle.id],
                    timeframe: "2-3 months",
                    confidence: 0.85
                ))
            }
        }

        return suggestions
    }

    /// Mark recommendation as implemented
    func markAsImplemented(_ recommendation: OptimizationRecommendation) {
        implementedRecommendations.insert(recommendation.id)
        saveImplementedRecommendations()

        if let index = recommendations.firstIndex(where: { $0.id == recommendation.id }) {
            var updated = recommendation
            updated.implemented = true
            recommendations[index] = updated
        }
    }

    /// Calculate total projected savings from all recommendations
    func totalProjectedSavings() -> Double {
        recommendations.reduce(0) { $0 + $1.estimatedSavings }
    }

    /// Calculate savings for implemented recommendations
    func implementedSavings() -> Double {
        recommendations
            .filter { implementedRecommendations.contains($0.id) }
            .reduce(0) { $0 + $1.estimatedSavings }
    }

    // MARK: - RefreshableViewModel Override
    override func refresh() async {
        await analyzeFleet()
        await generateRecommendations(goal: selectedGoal)
    }

    // MARK: - Private Methods

    private func calculateMetrics(from vehicles: [Vehicle]) -> FleetMetrics {
        let total = vehicles.count
        let active = vehicles.filter { $0.status == .active }.count

        let totalMileage = vehicles.reduce(0.0) { $0 + $1.mileage }
        let totalCosts = Double(total) * 25000 // Estimated annual cost per vehicle

        let utilization = calculateAverageUtilization()
        let downtime = calculateDowntimePercentage()
        let idleTime = calculateIdleTimePercentage()

        let costPerMile = totalMileage > 0 ? totalCosts / totalMileage : 0
        let costPerVehicle = total > 0 ? totalCosts / Double(total) : 0

        let optimal = calculateOptimalFleetSize()
        let excess = max(0, total - optimal)
        let underutilized = identifyUnderutilizedVehicles().count

        return FleetMetrics(
            totalVehicles: total,
            activeVehicles: active,
            utilizationRate: utilization,
            costPerMile: costPerMile,
            costPerVehicle: costPerVehicle,
            downtimePercentage: downtime,
            emissionsPerMile: 0.4, // kg CO2 - estimated
            totalMileage: totalMileage,
            totalCosts: totalCosts,
            avgMaintenanceCost: 5000,
            avgFuelCost: 3500,
            idleTimePercentage: idleTime,
            optimalFleetSize: optimal,
            excessVehicles: excess,
            underutilizedVehicles: underutilized
        )
    }

    private func generateLocalRecommendations(for goal: OptimizationGoal) -> [OptimizationRecommendation] {
        var recommendations: [OptimizationRecommendation] = []

        // Add underutilization recommendations
        let underutilized = identifyUnderutilizedVehicles()
        for vehicle in underutilized.prefix(5) {
            let utilization = calculateUtilization(for: vehicle)
            recommendations.append(OptimizationRecommendation(
                type: .reassignVehicle,
                title: "Reassign or Retire Vehicle \(vehicle.number)",
                description: "Vehicle is only \(Int(utilization * 100))% utilized. Consider reassigning to high-demand area or retiring.",
                estimatedSavings: 8000,
                priority: utilization < 0.20 ? .high : .medium,
                implementationSteps: [
                    "Analyze usage patterns",
                    "Identify high-demand areas",
                    "Reassign or retire vehicle",
                    "Monitor utilization"
                ],
                affectedVehicles: [vehicle.id],
                timeframe: "2-4 weeks",
                confidence: 0.78
            ))
        }

        // Add replacement recommendations
        recommendations.append(contentsOf: suggestReplacements())

        // Goal-specific recommendations
        switch goal {
        case .reduceCosts:
            recommendations.append(OptimizationRecommendation(
                type: .consolidateRoutes,
                title: "Consolidate Low-Efficiency Routes",
                description: "Combine overlapping routes to reduce total vehicle hours and fuel consumption.",
                estimatedSavings: 12000,
                priority: .high,
                implementationSteps: [
                    "Analyze route patterns",
                    "Identify overlapping coverage",
                    "Create consolidated schedule",
                    "Train drivers on new routes"
                ],
                affectedVehicles: vehicles.prefix(3).map { $0.id },
                timeframe: "3-4 weeks",
                confidence: 0.82
            ))

        case .improveUtilization:
            recommendations.append(OptimizationRecommendation(
                type: .optimizeScheduling,
                title: "Optimize Vehicle Scheduling",
                description: "Implement dynamic scheduling to maximize vehicle usage during peak hours.",
                estimatedSavings: 15000,
                priority: .high,
                implementationSteps: [
                    "Analyze demand patterns",
                    "Implement flexible scheduling system",
                    "Train dispatch team",
                    "Monitor and adjust"
                ],
                affectedVehicles: vehicles.map { $0.id },
                timeframe: "4-6 weeks",
                confidence: 0.75
            ))

        case .minimizeDowntime:
            recommendations.append(OptimizationRecommendation(
                type: .preventiveMaintenance,
                title: "Implement Predictive Maintenance",
                description: "Use data-driven approach to prevent breakdowns and reduce unplanned downtime.",
                estimatedSavings: 18000,
                priority: .critical,
                implementationSteps: [
                    "Install telematics on all vehicles",
                    "Set up predictive maintenance alerts",
                    "Schedule proactive maintenance",
                    "Track downtime reduction"
                ],
                affectedVehicles: vehicles.map { $0.id },
                timeframe: "6-8 weeks",
                confidence: 0.88
            ))

        case .reduceEmissions:
            recommendations.append(OptimizationRecommendation(
                type: .replaceVehicle,
                title: "Transition to Electric Vehicles",
                description: "Replace aging vehicles with electric alternatives to reduce emissions and fuel costs.",
                estimatedSavings: 25000,
                priority: .medium,
                implementationSteps: [
                    "Evaluate EV options",
                    "Install charging infrastructure",
                    "Plan gradual replacement",
                    "Train drivers on EV operation"
                ],
                affectedVehicles: vehicles.filter { $0.fuelType == .gasoline || $0.fuelType == .diesel }.prefix(5).map { $0.id },
                timeframe: "6-12 months",
                confidence: 0.70
            ))
        }

        // Add driver training recommendation
        recommendations.append(OptimizationRecommendation(
            type: .driverTraining,
            title: "Implement Eco-Driving Training",
            description: "Train drivers on fuel-efficient driving techniques to reduce costs and emissions.",
            estimatedSavings: 6500,
            priority: .medium,
            implementationSteps: [
                "Develop training program",
                "Schedule driver sessions",
                "Implement driver scorecards",
                "Monitor fuel efficiency improvements"
            ],
            affectedVehicles: [],
            timeframe: "3-4 weeks",
            confidence: 0.72
        ))

        return recommendations
    }

    private func calculateUtilization(for vehicle: Vehicle) -> Double {
        // Estimate based on hours used and status
        // In production, this would use real trip/usage data
        switch vehicle.status {
        case .active:
            return 0.65 + Double.random(in: -0.15...0.25)
        case .idle:
            return 0.35 + Double.random(in: -0.15...0.15)
        case .charging:
            return 0.50 + Double.random(in: -0.10...0.20)
        case .service:
            return 0.0
        case .emergency:
            return 0.85 + Double.random(in: -0.05...0.10)
        case .offline:
            return 0.0
        }
    }

    private func calculateAverageUtilization() -> Double {
        guard !vehicles.isEmpty else { return 0 }

        let total = vehicles.reduce(0.0) { acc, vehicle in
            acc + calculateUtilization(for: vehicle)
        }

        return total / Double(vehicles.count)
    }

    private func calculateDowntimePercentage() -> Double {
        guard !vehicles.isEmpty else { return 0 }

        let downtime = vehicles.filter { $0.status == .service || $0.status == .offline }.count
        return Double(downtime) / Double(vehicles.count)
    }

    private func calculateIdleTimePercentage() -> Double {
        guard !vehicles.isEmpty else { return 0 }

        let idle = vehicles.filter { $0.status == .idle }.count
        return Double(idle) / Double(vehicles.count)
    }

    private func calculateAverageDemand() -> Double {
        // Simplified demand calculation
        // In production, this would analyze historical usage data
        Double(vehicles.count) * 0.60
    }

    private func calculatePeakDemand() -> Double {
        // Simplified peak demand calculation
        // In production, this would analyze historical peak usage
        Double(vehicles.count) * 0.85
    }

    private func calculateVehicleAge(_ vehicle: Vehicle) -> Int {
        let currentYear = Calendar.current.component(.year, from: Date())
        return currentYear - vehicle.year
    }

    private func calculateMaintenanceCost(for vehicle: Vehicle) -> Double {
        // Estimate based on age and mileage
        let age = calculateVehicleAge(vehicle)
        let baseCost = 3000.0
        let ageFactor = Double(age) * 200
        let mileageFactor = (vehicle.mileage / 10000) * 100

        return baseCost + ageFactor + mileageFactor
    }

    // MARK: - Cache Management

    private func loadCachedData() {
        if let cachedMetrics = getCachedObject(forKey: metricsKey, type: FleetMetrics.self as! AnyObject.Type) as? FleetMetrics {
            self.metrics = cachedMetrics
        }

        if let cachedRecs = getCachedObject(forKey: recommendationsKey, type: [OptimizationRecommendation].self as! AnyObject.Type) as? [OptimizationRecommendation] {
            self.recommendations = cachedRecs
        }

        if let cachedUtil = getCachedObject(forKey: utilizationKey, type: [UtilizationAnalysis].self as! AnyObject.Type) as? [UtilizationAnalysis] {
            self.utilizationAnalysis = cachedUtil
        }
    }

    // MARK: - Persistence

    private func loadImplementedRecommendations() {
        if let data = UserDefaults.standard.data(forKey: "implementedRecommendations"),
           let decoded = try? JSONDecoder().decode(Set<String>.self, from: data) {
            implementedRecommendations = decoded
        }
    }

    private func saveImplementedRecommendations() {
        if let encoded = try? JSONEncoder().encode(implementedRecommendations) {
            UserDefaults.standard.set(encoded, forKey: "implementedRecommendations")
        }
    }
}
