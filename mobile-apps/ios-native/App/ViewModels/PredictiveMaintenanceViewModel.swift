//
//  PredictiveMaintenanceViewModel.swift
//  Fleet Manager
//
//  ViewModel for predictive maintenance with ML-based failure prediction
//

import Foundation
import Combine
import SwiftUI

@MainActor
class PredictiveMaintenanceViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var predictions: [MaintenancePrediction] = []
    @Published var componentHealth: [ComponentHealth] = []
    @Published var recommendations: [MaintenanceRecommendance] = []
    @Published var trends: [TrendData] = []
    @Published var summary: PredictionSummary?
    @Published var selectedVehicleId: String?
    @Published var selectedComponent: ComponentType?
    @Published var filterRiskLevel: RiskLevel?
    @Published var sortOption: SortOption = .riskLevel
    @Published var showOnlyCritical = false

    // MARK: - Private Properties
    private let apiClient: APIClient
    private let cacheKey = "predictive_maintenance_cache"
    private var predictionCache: [String: CachedPredictions] = [:]

    // MARK: - Computed Properties
    var filteredPredictions: [MaintenancePrediction] {
        var filtered = predictions

        // Filter by risk level
        if let riskFilter = filterRiskLevel {
            filtered = filtered.filter { $0.riskLevel == riskFilter }
        }

        // Show only critical if enabled
        if showOnlyCritical {
            filtered = filtered.filter { $0.riskLevel == .critical || $0.riskLevel == .high }
        }

        // Filter by component
        if let component = selectedComponent {
            filtered = filtered.filter { $0.component == component }
        }

        // Sort
        return sortPredictions(filtered)
    }

    var criticalPredictions: [MaintenancePrediction] {
        predictions.filter { $0.riskLevel == .critical }
    }

    var urgentRecommendations: [MaintenanceRecommendation] {
        recommendations
            .filter { $0.priority == .critical || $0.priority == .high }
            .filter { !$0.isScheduled }
    }

    var totalEstimatedMaintenanceCost: Double {
        predictions.reduce(0) { $0 + $1.estimatedCost }
    }

    var averageVehicleHealth: Double {
        guard !componentHealth.isEmpty else { return 0 }
        return componentHealth.reduce(0) { $0 + $1.healthScore } / Double(componentHealth.count)
    }

    // MARK: - Initialization
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
        super.init()
        loadCachedData()
    }

    // MARK: - Data Loading
    override func refresh() async {
        guard let vehicleId = selectedVehicleId else {
            handleErrorMessage("No vehicle selected")
            return
        }

        await loadPredictions(for: vehicleId, forceRefresh: true)
    }

    func loadPredictions(for vehicleId: String, forceRefresh: Bool = false) async {
        // Check cache first
        if !forceRefresh, let cached = predictionCache[vehicleId],
           !cached.isExpired {
            self.predictions = cached.predictions
            self.summary = cached.summary
            self.recommendations = cached.recommendations
            self.trends = cached.trends
            return
        }

        startLoading()

        do {
            let request = PredictionRequest(
                vehicleId: vehicleId,
                components: nil,
                includeHistorical: true
            )

            let response: PredictionResponse? = try await apiClient.post(
                endpoint: "/api/v1/maintenance/predict",
                body: request
            )

            if let response = response {
                self.predictions = response.predictions
                self.summary = response.summary
                self.recommendations = response.recommendations
                self.trends = response.trends

                // Cache the results
                cachePredictions(for: vehicleId, response: response)

                // Load component health
                await loadComponentHealth(for: vehicleId)
            }

            finishLoading()
        } catch {
            handleError(error)
        }
    }

    func loadComponentHealth(for vehicleId: String) async {
        do {
            let request = ComponentHealthRequest(
                vehicleId: vehicleId,
                component: selectedComponent
            )

            let response: ComponentHealthResponse? = try await apiClient.post(
                endpoint: "/api/v1/maintenance/health",
                body: request
            )

            if let response = response {
                self.componentHealth = response.health
            }
        } catch {
            print("Failed to load component health: \(error)")
        }
    }

    // MARK: - Prediction Algorithm
    func predictFailure(component: ComponentType, vehicle: Vehicle, health: ComponentHealth) -> MaintenancePrediction {
        // Calculate age-based factors
        let daysSinceReplacement = health.ageInDays
        let averageLifespan = component.averageLifespanDays
        let ageRatio = Double(daysSinceReplacement) / Double(averageLifespan)

        // Calculate mileage-based factors
        let mileageSinceReplacement = health.currentMileage - (health.lastReplacementMileage ?? 0)
        let averageMileageLifespan = Double(averageLifespan) * 50.0 // Assume 50 miles/day average
        let mileageRatio = mileageSinceReplacement / averageMileageLifespan

        // Calculate degradation rate from historical data
        let degradationRate = calculateDegradationRate(component: component, vehicle: vehicle)

        // Predict remaining lifespan (weighted average of age and mileage)
        let combinedRatio = (ageRatio * 0.4) + (mileageRatio * 0.6)
        let remainingLifespanRatio = max(0, 1.0 - combinedRatio)
        let remainingDays = Int(Double(averageLifespan) * remainingLifespanRatio)

        // Calculate health score
        let currentHealth = max(0, min(100, 100 * remainingLifespanRatio * (1 - degradationRate)))

        // Calculate confidence based on data availability
        let confidence = calculateConfidence(
            hasHistoricalData: !health.issuesDetected.isEmpty,
            ageInDays: daysSinceReplacement,
            inspectionRecency: health.lastInspectionDate
        )

        // Determine risk level
        let riskLevel = calculateRiskLevel(
            remainingDays: remainingDays,
            healthScore: currentHealth,
            componentCategory: component.category
        )

        // Determine recommended action
        let action = determineMaintenanceAction(
            riskLevel: riskLevel,
            remainingDays: remainingDays,
            healthScore: currentHealth
        )

        // Calculate estimated cost with risk multiplier
        let baseCost = component.averageReplacementCost
        let riskMultiplier = riskLevel == .critical ? 1.5 : 1.0
        let estimatedCost = baseCost * riskMultiplier

        // Create prediction
        let predictedDate = Calendar.current.date(
            byAdding: .day,
            value: remainingDays,
            to: Date()
        ) ?? Date()

        return MaintenancePrediction(
            id: UUID().uuidString,
            vehicleId: vehicle.id,
            component: component,
            predictedFailureDate: predictedDate,
            confidence: confidence,
            riskLevel: riskLevel,
            currentHealth: currentHealth,
            degradationRate: degradationRate,
            estimatedCost: estimatedCost,
            daysUntilFailure: remainingDays,
            recommendedAction: action,
            basedOnMileage: mileageSinceReplacement,
            basedOnAge: daysSinceReplacement,
            historicalFailureCount: 0 // Would come from API
        )
    }

    // MARK: - ML/Analytics Functions
    private func calculateDegradationRate(component: ComponentType, vehicle: Vehicle) -> Double {
        // In a real implementation, this would use historical trend data
        // For now, use simplified calculation based on usage patterns

        // Heavy usage multiplier
        let dailyMileage = vehicle.mileage / max(1, Double(vehicle.year))
        let usageIntensity = min(2.0, dailyMileage / 50.0) // Normalized to 50 miles/day

        // Component-specific degradation rates
        let baseRate: Double
        switch component.category {
        case .consumable:
            baseRate = 0.5 // 0.5% per day
        case .safety:
            baseRate = 0.2
        case .electrical:
            baseRate = 0.15
        case .powertrain:
            baseRate = 0.1
        case .maintenance:
            baseRate = 0.3
        }

        return baseRate * usageIntensity / 100.0
    }

    private func calculateConfidence(hasHistoricalData: Bool, ageInDays: Int, inspectionRecency: Date?) -> Double {
        var confidence = 0.5 // Base confidence

        // Boost confidence with historical data
        if hasHistoricalData {
            confidence += 0.2
        }

        // Boost confidence for older components (more data points)
        if ageInDays > 180 {
            confidence += 0.1
        }

        // Boost confidence with recent inspection
        if let lastInspection = inspectionRecency {
            let daysSinceInspection = Calendar.current.dateComponents([.day], from: lastInspection, to: Date()).day ?? 999
            if daysSinceInspection < 30 {
                confidence += 0.2
            } else if daysSinceInspection < 90 {
                confidence += 0.1
            }
        }

        return min(0.95, confidence)
    }

    private func calculateRiskLevel(remainingDays: Int, healthScore: Double, componentCategory: ComponentCategory) -> RiskLevel {
        // Safety-critical components get higher risk rating
        let isSafetyCritical = componentCategory == .safety || componentCategory == .powertrain

        if healthScore < 20 || (isSafetyCritical && healthScore < 30) {
            return .critical
        }

        if remainingDays < 7 || healthScore < 40 {
            return .critical
        }

        if remainingDays < 30 || healthScore < 60 {
            return .high
        }

        if remainingDays < 90 || healthScore < 80 {
            return .moderate
        }

        return .low
    }

    private func determineMaintenanceAction(riskLevel: RiskLevel, remainingDays: Int, healthScore: Double) -> MaintenanceAction {
        switch riskLevel {
        case .critical:
            return healthScore < 30 ? .replace : .service
        case .high:
            return remainingDays < 14 ? .service : .inspect
        case .moderate:
            return .inspect
        case .low:
            return .monitor
        }
    }

    // MARK: - Recommendations
    func generateRecommendations(for vehicle: Vehicle) -> [MaintenanceRecommendation] {
        var recommendations: [MaintenanceRecommendation] = []

        for prediction in predictions.sorted(by: { $0.riskLevel.priority > $1.riskLevel.priority }) {
            let scheduledDate: Date
            let benefits: [String]

            switch prediction.riskLevel {
            case .critical:
                scheduledDate = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()
                benefits = [
                    "Prevent unexpected breakdown",
                    "Avoid safety hazards",
                    "Minimize emergency repair costs"
                ]
            case .high:
                scheduledDate = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
                benefits = [
                    "Prevent component failure",
                    "Maintain vehicle reliability",
                    "Save on emergency repairs"
                ]
            case .moderate:
                scheduledDate = Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date()
                benefits = [
                    "Extend component lifespan",
                    "Optimize maintenance schedule",
                    "Reduce long-term costs"
                ]
            case .low:
                scheduledDate = Calendar.current.date(byAdding: .day, value: 90, to: Date()) ?? Date()
                benefits = [
                    "Maintain optimal performance",
                    "Track component health",
                    "Plan maintenance budget"
                ]
            }

            let recommendation = MaintenanceRecommendation(
                id: UUID().uuidString,
                vehicleId: vehicle.id,
                component: prediction.component,
                action: prediction.recommendedAction,
                priority: prediction.riskLevel,
                scheduledDate: scheduledDate,
                estimatedCost: prediction.estimatedCost,
                estimatedDuration: estimateDuration(for: prediction.component, action: prediction.recommendedAction),
                description: generateDescription(for: prediction),
                benefits: benefits,
                isScheduled: false
            )

            recommendations.append(recommendation)
        }

        return recommendations
    }

    private func estimateDuration(for component: ComponentType, action: MaintenanceAction) -> Int {
        let baseTime: Int
        switch component.category {
        case .consumable: baseTime = 30
        case .electrical: baseTime = 60
        case .safety: baseTime = 120
        case .powertrain: baseTime = 240
        case .maintenance: baseTime = 45
        }

        let multiplier: Double
        switch action {
        case .inspect: multiplier = 0.5
        case .service: multiplier = 1.0
        case .replace: multiplier = 1.5
        case .monitor: multiplier = 0.25
        }

        return Int(Double(baseTime) * multiplier)
    }

    private func generateDescription(for prediction: MaintenancePrediction) -> String {
        let component = prediction.component.displayName
        let action = prediction.recommendedAction.displayName
        let days = prediction.daysUntilFailure

        switch prediction.riskLevel {
        case .critical:
            return "\(component) requires immediate attention. \(action) recommended within \(days) days to prevent failure."
        case .high:
            return "\(component) showing signs of wear. \(action) recommended within \(days) days."
        case .moderate:
            return "\(component) approaching service interval. \(action) recommended within \(days) days."
        case .low:
            return "\(component) in good condition. \(action) recommended as preventive maintenance."
        }
    }

    // MARK: - Cost-Benefit Analysis
    func calculateCostBenefit(for prediction: MaintenancePrediction) -> CostBenefitAnalysis {
        let baseCost = prediction.estimatedCost
        let delayCost = baseCost * 1.5 // 50% increase if delayed
        let downTimeRisk = baseCost * 0.3 // 30% additional cost for downtime

        let safetyRiskScore: Double
        switch prediction.component.category {
        case .safety: safetyRiskScore = 8.0
        case .powertrain: safetyRiskScore = 6.0
        case .electrical: safetyRiskScore = 4.0
        default: safetyRiskScore = 2.0
        }

        let recommendation: String
        if prediction.riskLevel == .critical || prediction.riskLevel == .high {
            recommendation = "Repair immediately to avoid higher costs and safety risks."
        } else if prediction.daysUntilFailure < 30 {
            recommendation = "Schedule repair soon to optimize costs."
        } else {
            recommendation = "Monitor and schedule during next maintenance window."
        }

        return CostBenefitAnalysis(
            componentType: prediction.component,
            costToRepairNow: baseCost,
            costToRepairLater: delayCost,
            downTimeRiskCost: downTimeRisk,
            safetyRiskScore: safetyRiskScore,
            recommendation: recommendation
        )
    }

    // MARK: - Sorting
    private func sortPredictions(_ predictions: [MaintenancePrediction]) -> [MaintenancePrediction] {
        switch sortOption {
        case .riskLevel:
            return predictions.sorted { $0.riskLevel.priority > $1.riskLevel.priority }
        case .dateAscending:
            return predictions.sorted { $0.predictedFailureDate < $1.predictedFailureDate }
        case .dateDescending:
            return predictions.sorted { $0.predictedFailureDate > $1.predictedFailureDate }
        case .cost:
            return predictions.sorted { $0.estimatedCost > $1.estimatedCost }
        case .component:
            return predictions.sorted { $0.component.displayName < $1.component.displayName }
        case .confidence:
            return predictions.sorted { $0.confidence > $1.confidence }
        }
    }

    // MARK: - Caching
    private func cachePredictions(for vehicleId: String, response: PredictionResponse) {
        let cached = CachedPredictions(
            predictions: response.predictions,
            summary: response.summary,
            recommendations: response.recommendations,
            trends: response.trends,
            timestamp: Date()
        )
        predictionCache[vehicleId] = cached
        saveCacheToStorage()
    }

    private func loadCachedData() {
        // Load from persistent storage if available
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let cache = try? JSONDecoder().decode([String: CachedPredictions].self, from: data) {
            predictionCache = cache
        }
    }

    private func saveCacheToStorage() {
        if let data = try? JSONEncoder().encode(predictionCache) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }

    // MARK: - Export
    func exportReport(for vehicle: Vehicle) -> PredictionReport {
        let vehicleInfo = PredictionReport.VehicleInfo(
            number: vehicle.number,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage,
            vin: vehicle.vin
        )

        let costBenefitAnalyses = predictions.map { calculateCostBenefit(for: $0) }

        return PredictionReport(
            generatedDate: Date(),
            vehicleId: vehicle.id,
            vehicleInfo: vehicleInfo,
            predictions: predictions,
            recommendations: recommendations,
            summary: summary ?? PredictionSummary(
                vehicleId: vehicle.id,
                totalPredictions: 0,
                criticalCount: 0,
                highRiskCount: 0,
                moderateRiskCount: 0,
                lowRiskCount: 0,
                totalEstimatedCost: 0,
                nextMaintenanceDate: nil,
                overallVehicleHealth: 0
            ),
            costBenefitAnalyses: costBenefitAnalyses
        )
    }
}

// MARK: - Supporting Types

enum SortOption: String, CaseIterable {
    case riskLevel = "Risk Level"
    case dateAscending = "Date (Earliest)"
    case dateDescending = "Date (Latest)"
    case cost = "Cost"
    case component = "Component"
    case confidence = "Confidence"
}

struct CachedPredictions: Codable {
    let predictions: [MaintenancePrediction]
    let summary: PredictionSummary
    let recommendations: [MaintenanceRecommendation]
    let trends: [TrendData]
    let timestamp: Date

    var isExpired: Bool {
        Date().timeIntervalSince(timestamp) > 3600 // 1 hour cache
    }
}
