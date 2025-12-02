//
//  PredictiveAnalyticsViewModel.swift
//  Fleet Manager
//
//  ViewModel for Predictive Analytics with API integration and caching
//

import Foundation
import Combine
import SwiftUI

@MainActor
class PredictiveAnalyticsViewModel: RefreshableViewModel {
    // MARK: - Published Properties

    @Published var predictions: [Prediction] = []
    @Published var selectedPredictionType: PredictionType = .maintenance
    @Published var predictionSummary: PredictionSummary?
    @Published var maintenancePredictions: [MaintenancePrediction] = []
    @Published var costPredictions: [CostPrediction] = []
    @Published var utilizationPredictions: [UtilizationPrediction] = []
    @Published var driverBehaviorPredictions: [DriverBehaviorPrediction] = []
    @Published var breakdownPredictions: [BreakdownPrediction] = []

    // Filter properties
    @Published var showHighConfidenceOnly = false
    @Published var showCriticalOnly = false

    // MARK: - Private Properties

    private let apiClient = APIClient.shared
    private let persistenceManager = DataPersistenceManager.shared
    private let cacheExpirationInterval: TimeInterval = 3600 // 1 hour

    // MARK: - Computed Properties

    var filteredPredictions: [Prediction] {
        var filtered = predictions

        // Filter by selected type
        filtered = filtered.filter { $0.type == selectedPredictionType }

        // Filter by confidence if enabled
        if showHighConfidenceOnly {
            filtered = filtered.filter { $0.confidenceScore >= 0.8 }
        }

        // Filter by severity if enabled
        if showCriticalOnly {
            filtered = filtered.filter { $0.severity == .critical || $0.severity == .high }
        }

        // Sort by predicted date (earliest first)
        return filtered.sorted { $0.predictedDate < $1.predictedDate }
    }

    var highConfidenceCount: Int {
        predictions.filter { $0.confidenceScore >= 0.8 }.count
    }

    var criticalCount: Int {
        predictions.filter { $0.severity == .critical }.count
    }

    // MARK: - Initialization

    override init() {
        super.init()
        loadCachedPredictions()
    }

    // MARK: - API Methods

    func fetchPredictions() async {
        startLoading()

        do {
            let response: PredictionsResponse? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions",
                queryItems: [
                    URLQueryItem(name: "type", value: selectedPredictionType.rawValue)
                ]
            )

            if let response = response {
                predictions = response.predictions
                predictionSummary = response.summary

                // Cache the predictions
                cachePredictions(response.predictions)

                // Fetch type-specific predictions
                await fetchTypeSpecificPredictions()

                finishLoading()
            } else {
                handleErrorMessage("No predictions available")
            }
        } catch {
            handleError(error)
            // Load cached data on error
            loadCachedPredictions()
        }
    }

    func fetchPredictionDetail(id: String) async -> Prediction? {
        do {
            let prediction: Prediction? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/\(id)"
            )
            return prediction
        } catch {
            handleError(error)
            return nil
        }
    }

    func generatePredictions(
        type: PredictionType,
        vehicleId: String? = nil,
        driverId: String? = nil,
        period: TimePeriod? = nil
    ) async -> Bool {
        startLoading()

        let request = GeneratePredictionRequest(
            predictionType: type,
            vehicleId: vehicleId,
            driverId: driverId,
            period: period
        )

        do {
            let response: PredictionsResponse? = try await apiClient.post(
                endpoint: "/v1/analytics/predictions/generate",
                body: request
            )

            if let response = response {
                predictions = response.predictions
                predictionSummary = response.summary
                cachePredictions(response.predictions)
                finishLoading()
                return true
            } else {
                handleErrorMessage("Failed to generate predictions")
                return false
            }
        } catch {
            handleError(error)
            return false
        }
    }

    private func fetchTypeSpecificPredictions() async {
        switch selectedPredictionType {
        case .maintenance:
            await fetchMaintenancePredictions()
        case .cost:
            await fetchCostPredictions()
        case .utilization:
            await fetchUtilizationPredictions()
        case .driverBehavior:
            await fetchDriverBehaviorPredictions()
        case .breakdown:
            await fetchBreakdownPredictions()
        }
    }

    private func fetchMaintenancePredictions() async {
        do {
            let predictions: [MaintenancePrediction]? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/maintenance"
            )
            if let predictions = predictions {
                maintenancePredictions = predictions
            }
        } catch {
            print("Error fetching maintenance predictions: \(error.localizedDescription)")
        }
    }

    private func fetchCostPredictions() async {
        do {
            let predictions: [CostPrediction]? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/cost"
            )
            if let predictions = predictions {
                costPredictions = predictions
            }
        } catch {
            print("Error fetching cost predictions: \(error.localizedDescription)")
        }
    }

    private func fetchUtilizationPredictions() async {
        do {
            let predictions: [UtilizationPrediction]? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/utilization"
            )
            if let predictions = predictions {
                utilizationPredictions = predictions
            }
        } catch {
            print("Error fetching utilization predictions: \(error.localizedDescription)")
        }
    }

    private func fetchDriverBehaviorPredictions() async {
        do {
            let predictions: [DriverBehaviorPrediction]? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/driver-behavior"
            )
            if let predictions = predictions {
                driverBehaviorPredictions = predictions
            }
        } catch {
            print("Error fetching driver behavior predictions: \(error.localizedDescription)")
        }
    }

    private func fetchBreakdownPredictions() async {
        do {
            let predictions: [BreakdownPrediction]? = try await apiClient.get(
                endpoint: "/v1/analytics/predictions/breakdown"
            )
            if let predictions = predictions {
                breakdownPredictions = predictions
            }
        } catch {
            print("Error fetching breakdown predictions: \(error.localizedDescription)")
        }
    }

    // MARK: - Refresh Override

    override func refresh() async {
        startRefreshing()
        await fetchPredictions()
        finishRefreshing()
    }

    func refreshPredictions() async {
        await refresh()
    }

    // MARK: - Cache Management

    private func cachePredictions(_ predictions: [Prediction]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(predictions)
            UserDefaults.standard.set(data, forKey: getCacheKey())
            UserDefaults.standard.set(Date(), forKey: getCacheTimestampKey())
        } catch {
            print("Error caching predictions: \(error.localizedDescription)")
        }
    }

    private func loadCachedPredictions() {
        guard let data = UserDefaults.standard.data(forKey: getCacheKey()) else {
            return
        }

        // Check if cache is expired
        if let timestamp = UserDefaults.standard.object(forKey: getCacheTimestampKey()) as? Date {
            let elapsed = Date().timeIntervalSince(timestamp)
            if elapsed > cacheExpirationInterval {
                clearCache()
                return
            }
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let cachedPredictions = try decoder.decode([Prediction].self, from: data)
            predictions = cachedPredictions
        } catch {
            print("Error loading cached predictions: \(error.localizedDescription)")
        }
    }

    private func clearCache() {
        UserDefaults.standard.removeObject(forKey: getCacheKey())
        UserDefaults.standard.removeObject(forKey: getCacheTimestampKey())
    }

    private func getCacheKey() -> String {
        "cached_predictions_\(selectedPredictionType.rawValue)"
    }

    private func getCacheTimestampKey() -> String {
        "cached_predictions_timestamp_\(selectedPredictionType.rawValue)"
    }

    // MARK: - Helper Methods

    func getPredictionById(_ id: String) -> Prediction? {
        predictions.first { $0.id == id }
    }

    func toggleConfidenceFilter() {
        showHighConfidenceOnly.toggle()
    }

    func toggleCriticalFilter() {
        showCriticalOnly.toggle()
    }

    func selectPredictionType(_ type: PredictionType) {
        selectedPredictionType = type
        loadCachedPredictions() // Load cached data for new type
        Task {
            await fetchPredictions()
        }
    }

    // MARK: - Export Methods

    func exportPredictions() async -> Data? {
        // Generate CSV data from predictions
        var csvString = "ID,Type,Vehicle,Confidence,Predicted Date,Severity,Description\n"

        for prediction in predictions {
            let vehicle = prediction.vehicleNumber ?? "N/A"
            let date = prediction.formattedPredictedDate
            csvString += "\(prediction.id),\(prediction.type.rawValue),\(vehicle),\(prediction.confidencePercentage)%,\(date),\(prediction.severity.rawValue),\"\(prediction.description)\"\n"
        }

        return csvString.data(using: .utf8)
    }

    func sharePredictionReport() -> String {
        var report = "Predictive Analytics Report\n"
        report += "Generated: \(Date().formatted())\n"
        report += "Type: \(selectedPredictionType.rawValue)\n\n"

        if let summary = predictionSummary {
            report += "Summary:\n"
            report += "Total Predictions: \(summary.totalPredictions)\n"
            report += "High Confidence: \(summary.highConfidencePredictions)\n"
            report += "Critical: \(summary.criticalPredictions)\n"
            report += "Average Confidence: \(summary.formattedAverageConfidence)\n\n"
        }

        report += "Predictions:\n"
        for (index, prediction) in filteredPredictions.enumerated() {
            report += "\n\(index + 1). \(prediction.type.rawValue) - \(prediction.vehicleNumber ?? "N/A")\n"
            report += "   Confidence: \(prediction.confidencePercentage)%\n"
            report += "   Date: \(prediction.formattedPredictedDate)\n"
            report += "   Severity: \(prediction.severity.rawValue)\n"
            report += "   \(prediction.description)\n"
        }

        return report
    }
}
