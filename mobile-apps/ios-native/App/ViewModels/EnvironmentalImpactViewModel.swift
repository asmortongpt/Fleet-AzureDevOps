//
//  EnvironmentalImpactViewModel.swift
//  Fleet Manager
//
//  Environmental Impact Tracking ViewModel
//  Emissions calculations, sustainability metrics, and reporting
//

import Foundation
import Combine
import SwiftUI

@MainActor
class EnvironmentalImpactViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var emissionsData: [EmissionsData] = []
    @Published var carbonFootprint: CarbonFootprint?
    @Published var sustainabilityMetrics: [SustainabilityMetrics] = []
    @Published var emissionReport: EmissionReport?
    @Published var offsetPrograms: [OffsetProgram] = []
    @Published var selectedPeriod: DatePeriod = DatePeriod(
        startDate: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date(),
        endDate: Date()
    )
    @Published var selectedVehicleId: String?
    @Published var selectedFuelType: FuelType?
    @Published var totalCO2Savings: Double = 0
    @Published var totalCostSavings: Double = 0

    // Industry benchmarks (2024 EPA data)
    private let industryBenchmarks: [VehicleType: IndustryBenchmark] = [
        .sedan: IndustryBenchmark(category: "Sedan", averageMPG: 27.5, averageEmissionsPerMile: 0.32, averageIdlePercentage: 12.0, year: 2024),
        .suv: IndustryBenchmark(category: "SUV", averageMPG: 22.8, averageEmissionsPerMile: 0.39, averageIdlePercentage: 15.0, year: 2024),
        .truck: IndustryBenchmark(category: "Truck", averageMPG: 19.5, averageEmissionsPerMile: 0.46, averageIdlePercentage: 18.0, year: 2024),
        .van: IndustryBenchmark(category: "Van", averageMPG: 21.0, averageEmissionsPerMile: 0.42, averageIdlePercentage: 16.0, year: 2024)
    ]

    // MARK: - Computed Properties
    var totalEmissions: Double {
        emissionsData.reduce(0) { $0 + $1.co2Emissions }
    }

    var averageMPG: Double {
        let totalFuel = emissionsData.reduce(0) { $0 + $1.fuelConsumed }
        let totalDistance = emissionsData.reduce(0) { $0 + $1.distanceTraveled }
        guard totalFuel > 0 else { return 0 }
        return totalDistance / totalFuel
    }

    var totalIdleTime: Double {
        emissionsData.reduce(0) { $0 + $1.idleTime }
    }

    var averageIdlePercentage: Double {
        guard !emissionsData.isEmpty else { return 0 }
        let sum = emissionsData.reduce(0) { $0 + $1.idlePercentage }
        return sum / Double(emissionsData.count)
    }

    var fleetSustainabilityScore: Double {
        guard !sustainabilityMetrics.isEmpty else { return 0 }
        let sum = sustainabilityMetrics.reduce(0) { $0 + $1.sustainabilityScore }
        return sum / Double(sustainabilityMetrics.count)
    }

    var carbonOffsetNeeded: Double {
        guard let footprint = carbonFootprint else { return 0 }
        return max(0, footprint.totalCO2Emissions - footprint.offsetCredits)
    }

    var filteredEmissionsData: [EmissionsData] {
        var filtered = emissionsData

        if let vehicleId = selectedVehicleId {
            filtered = filtered.filter { $0.vehicleId == vehicleId }
        }

        if let fuelType = selectedFuelType {
            filtered = filtered.filter { $0.fuelType == fuelType }
        }

        return filtered
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupMockData()
    }

    // MARK: - API Methods
    override func refresh() async {
        startRefreshing()

        await loadEmissionsData()
        await loadCarbonFootprint()
        await loadSustainabilityMetrics()
        await loadOffsetPrograms()

        finishRefreshing()
    }

    func loadEmissionsData() async {
        do {
            startLoading()

            // API call would go here
            // let emissions = try await APIManager.shared.fetchEmissions(period: selectedPeriod)

            // Using mock data for now
            try await Task.sleep(nanoseconds: 500_000_000)

            finishLoading()
        } catch {
            handleError(error)
        }
    }

    func loadCarbonFootprint() async {
        do {
            // API call would go here
            // let footprint = try await APIManager.shared.fetchCarbonFootprint(period: selectedPeriod)

            // Calculate from emissions data
            calculateCarbonFootprint()
        } catch {
            handleError(error)
        }
    }

    func loadSustainabilityMetrics() async {
        do {
            // API call would go here
            // let metrics = try await APIManager.shared.fetchSustainabilityMetrics()

            // Calculate from emissions data
            calculateSustainabilityMetrics()
        } catch {
            handleError(error)
        }
    }

    func loadOffsetPrograms() async {
        do {
            // API call would go here
            // let programs = try await APIManager.shared.fetchOffsetPrograms()

            // Using mock data for now
        } catch {
            handleError(error)
        }
    }

    func generateReport(type: ReportType) async -> EmissionReport? {
        do {
            startLoading()

            // API call would go here
            // let report = try await APIManager.shared.generateEmissionReport(type: type, period: selectedPeriod)

            let report = createEmissionReport(type: type)
            emissionReport = report

            finishLoading()
            return report
        } catch {
            handleError(error)
            return nil
        }
    }

    // MARK: - Emissions Calculations
    func calculateEmissions(fuelConsumed: Double, fuelType: FuelType) -> (co2: Double, nox: Double, pm25: Double) {
        let co2 = fuelConsumed * fuelType.co2EmissionFactor
        let nox = fuelConsumed * fuelType.noxEmissionFactor
        let pm25 = fuelConsumed * fuelType.pm25EmissionFactor

        return (co2, nox, pm25)
    }

    func calculateSustainabilityScore(for vehicle: SustainabilityMetrics) -> Double {
        var score = 100.0

        // MPG penalty (0-30 points)
        if vehicle.mpg < 15 {
            score -= 30
        } else if vehicle.mpg < 20 {
            score -= 20
        } else if vehicle.mpg < 25 {
            score -= 10
        } else if vehicle.mpg >= 35 {
            score += 10 // Bonus for high MPG
        }

        // Idle time penalty (0-20 points)
        score -= vehicle.idleTimePercentage * 0.8

        // Age penalty (0-15 points)
        let currentYear = Calendar.current.component(.year, from: Date())
        let age = currentYear - vehicle.year
        score -= min(15, Double(age) * 1.5)

        // Emission standard bonus (+10 for new standards)
        if vehicle.year >= 2020 {
            score += 10
        }

        // Fuel type adjustment
        score += vehicle.fuelType.sustainabilityScore * 0.2

        return max(0, min(100, score))
    }

    func calculateCarbonFootprint() {
        let totalCO2 = emissionsData.reduce(0) { $0 + $1.co2Emissions }
        let totalNOx = emissionsData.reduce(0) { $0 + $1.noxEmissions }
        let totalPM25 = emissionsData.reduce(0) { $0 + $1.pm25Emissions }
        let totalFuel = emissionsData.reduce(0) { $0 + $1.fuelConsumed }
        let totalDistance = emissionsData.reduce(0) { $0 + $1.distanceTraveled }

        let uniqueVehicles = Set(emissionsData.map { $0.vehicleId })
        let totalOffsets = offsetPrograms.reduce(0) { $0 + $1.co2Offset }

        carbonFootprint = CarbonFootprint(
            id: UUID().uuidString,
            tenantId: "default",
            period: selectedPeriod,
            totalCO2Emissions: totalCO2,
            totalNOxEmissions: totalNOx,
            totalPM25Emissions: totalPM25,
            totalFuelConsumed: totalFuel,
            totalDistanceTraveled: totalDistance,
            vehicleCount: uniqueVehicles.count,
            offsetCredits: totalOffsets,
            netImpact: totalCO2 - totalOffsets
        )
    }

    func calculateSustainabilityMetrics() {
        // Group emissions by vehicle
        let groupedByVehicle = Dictionary(grouping: emissionsData) { $0.vehicleId }

        sustainabilityMetrics = groupedByVehicle.compactMap { (vehicleId, emissions) in
            guard let firstEmission = emissions.first else { return nil }

            let totalCO2 = emissions.reduce(0) { $0 + $1.co2Emissions }
            let totalFuel = emissions.reduce(0) { $0 + $1.fuelConsumed }
            let totalDistance = emissions.reduce(0) { $0 + $1.distanceTraveled }
            let totalIdleTime = emissions.reduce(0) { $0 + $1.idleTime }
            let totalRuntime = emissions.reduce(0) { $0 + $1.totalRuntime }

            let mpg = totalFuel > 0 ? totalDistance / totalFuel : 0
            let emissionsPerMile = totalDistance > 0 ? totalCO2 / totalDistance : 0
            let idlePercentage = totalRuntime > 0 ? (totalIdleTime / totalRuntime) * 100 : 0

            // Create temporary metrics for score calculation
            let tempMetrics = SustainabilityMetrics(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                vehicleNumber: firstEmission.vehicleNumber,
                vehicleType: .sedan, // Would come from vehicle data
                fuelType: firstEmission.fuelType,
                year: 2020, // Would come from vehicle data
                mpg: mpg,
                emissionsPerMile: emissionsPerMile,
                idleTimePercentage: idlePercentage,
                totalCO2: totalCO2,
                totalMiles: totalDistance,
                sustainabilityScore: 0
            )

            let score = calculateSustainabilityScore(for: tempMetrics)

            return SustainabilityMetrics(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                vehicleNumber: firstEmission.vehicleNumber,
                vehicleType: .sedan,
                fuelType: firstEmission.fuelType,
                year: 2020,
                mpg: mpg,
                emissionsPerMile: emissionsPerMile,
                idleTimePercentage: idlePercentage,
                totalCO2: totalCO2,
                totalMiles: totalDistance,
                sustainabilityScore: score
            )
        }
    }

    func createEmissionReport(type: ReportType) -> EmissionReport {
        // Calculate vehicle breakdown
        let vehicleBreakdown = Dictionary(grouping: emissionsData) { $0.vehicleId }
            .map { (vehicleId, emissions) -> VehicleEmissions in
                let totalCO2 = emissions.reduce(0) { $0 + $1.co2Emissions }
                let totalNOx = emissions.reduce(0) { $0 + $1.noxEmissions }
                let totalPM25 = emissions.reduce(0) { $0 + $1.pm25Emissions }
                let totalDistance = emissions.reduce(0) { $0 + $1.distanceTraveled }
                let totalFuel = emissions.reduce(0) { $0 + $1.fuelConsumed }

                return VehicleEmissions(
                    id: UUID().uuidString,
                    vehicleNumber: emissions.first?.vehicleNumber ?? "",
                    vehicleType: .sedan,
                    fuelType: emissions.first?.fuelType ?? .gasoline,
                    co2: totalCO2,
                    nox: totalNOx,
                    pm25: totalPM25,
                    distance: totalDistance,
                    fuel: totalFuel
                )
            }

        // Calculate fuel type breakdown
        let totalCO2 = emissionsData.reduce(0) { $0 + $1.co2Emissions }
        let fuelTypeBreakdown = Dictionary(grouping: emissionsData) { $0.fuelType }
            .map { (fuelType, emissions) -> FuelTypeEmissions in
                let fuelTypeCO2 = emissions.reduce(0) { $0 + $1.co2Emissions }
                let percentage = totalCO2 > 0 ? (fuelTypeCO2 / totalCO2) * 100 : 0

                return FuelTypeEmissions(
                    id: UUID().uuidString,
                    fuelType: fuelType,
                    vehicleCount: Set(emissions.map { $0.vehicleId }).count,
                    totalCO2: fuelTypeCO2,
                    totalFuel: emissions.reduce(0) { $0 + $1.fuelConsumed },
                    totalDistance: emissions.reduce(0) { $0 + $1.distanceTraveled },
                    percentage: percentage
                )
            }

        // Generate recommendations
        let recommendations = generateRecommendations()

        // Calculate trends
        let trends = calculateTrends()

        return EmissionReport(
            id: UUID().uuidString,
            tenantId: "default",
            reportType: type,
            period: selectedPeriod,
            generatedDate: Date(),
            totalCO2: totalCO2,
            totalNOx: emissionsData.reduce(0) { $0 + $1.noxEmissions },
            totalPM25: emissionsData.reduce(0) { $0 + $1.pm25Emissions },
            totalFuel: emissionsData.reduce(0) { $0 + $1.fuelConsumed },
            totalDistance: emissionsData.reduce(0) { $0 + $1.distanceTraveled },
            vehicleBreakdown: vehicleBreakdown,
            fuelTypeBreakdown: fuelTypeBreakdown,
            trends: trends,
            recommendations: recommendations
        )
    }

    func calculateTrends() -> EmissionTrends {
        // This would compare current period to previous period
        // Using simplified mock data for now

        return EmissionTrends(
            co2Trend: TrendData(currentValue: totalEmissions, previousValue: totalEmissions * 1.1, percentageChange: -9.1, direction: .down),
            fuelTrend: TrendData(currentValue: averageMPG, previousValue: averageMPG * 0.95, percentageChange: 5.3, direction: .up),
            mpgTrend: TrendData(currentValue: averageMPG, previousValue: averageMPG * 0.95, percentageChange: 5.3, direction: .up),
            idleTimeTrend: TrendData(currentValue: averageIdlePercentage, previousValue: averageIdlePercentage * 1.15, percentageChange: -13.0, direction: .down)
        )
    }

    func generateRecommendations() -> [String] {
        var recommendations: [String] = []

        // High idle time recommendation
        if averageIdlePercentage > 15 {
            recommendations.append("Reduce idle time by implementing idle reduction policies. Current average: \(String(format: "%.1f", averageIdlePercentage))%")
        }

        // Low MPG recommendation
        if averageMPG < 20 {
            recommendations.append("Consider fleet modernization. Average MPG (\(String(format: "%.1f", averageMPG))) is below industry standard")
        }

        // EV adoption recommendation
        let evCount = emissionsData.filter { $0.fuelType == .electric }.count
        if evCount < emissionsData.count / 4 {
            recommendations.append("Increase EV adoption to reduce emissions. Current: \(evCount) electric vehicles")
        }

        // Carbon offset recommendation
        if carbonOffsetNeeded > 0 {
            recommendations.append("Purchase \(String(format: "%.0f", carbonOffsetNeeded)) kg of carbon offsets to achieve net-zero emissions")
        }

        // High emissions vehicles
        let highEmitters = sustainabilityMetrics.filter { $0.sustainabilityScore < 40 }
        if !highEmitters.isEmpty {
            recommendations.append("Replace or retire \(highEmitters.count) high-emission vehicles with sustainability score < 40")
        }

        return recommendations
    }

    func getBenchmark(for vehicleType: VehicleType) -> IndustryBenchmark? {
        return industryBenchmarks[vehicleType]
    }

    func compareToIndustry(metrics: SustainabilityMetrics) -> BenchmarkComparison? {
        guard let benchmark = industryBenchmarks[metrics.vehicleType] else { return nil }
        return benchmark.comparison(with: metrics)
    }

    // MARK: - Export Methods
    func exportReport() async -> URL? {
        guard let report = emissionReport else { return nil }

        // Generate CSV or PDF
        let csvContent = generateCSV(from: report)

        let tempDir = FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent("emissions_report_\(Date().timeIntervalSince1970).csv")

        do {
            try csvContent.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            handleError(error)
            return nil
        }
    }

    private func generateCSV(from report: EmissionReport) -> String {
        var csv = "Environmental Impact Report\n"
        csv += "Generated: \(report.generatedDate)\n"
        csv += "Period: \(report.period.displayString)\n\n"

        csv += "Summary\n"
        csv += "Total CO2,\(report.totalCO2) kg\n"
        csv += "Total NOx,\(report.totalNOx) kg\n"
        csv += "Total PM2.5,\(report.totalPM25) kg\n"
        csv += "Total Fuel,\(report.totalFuel) gallons\n"
        csv += "Total Distance,\(report.totalDistance) miles\n\n"

        csv += "Vehicle Breakdown\n"
        csv += "Vehicle,Type,Fuel Type,CO2 (kg),Distance (mi),MPG\n"
        for vehicle in report.vehicleBreakdown {
            csv += "\(vehicle.vehicleNumber),\(vehicle.vehicleType.rawValue),\(vehicle.fuelType.rawValue),\(vehicle.co2),\(vehicle.distance),\(vehicle.mpg)\n"
        }

        return csv
    }

    // MARK: - Mock Data Setup
    private func setupMockData() {
        // Create mock emissions data for demonstration
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()

        for i in 0..<15 {
            let vehicleNum = String(format: "V-%03d", i + 1)
            let fuelTypes: [FuelType] = [.gasoline, .diesel, .electric, .hybrid]
            let fuelType = fuelTypes[i % 4]

            let fuelConsumed = fuelType == .electric ? 0 : Double.random(in: 50...150)
            let distance = Double.random(in: 800...2000)
            let emissions = calculateEmissions(fuelConsumed: fuelConsumed, fuelType: fuelType)

            let emission = EmissionsData(
                id: UUID().uuidString,
                vehicleId: "vehicle-\(i)",
                vehicleNumber: vehicleNum,
                period: DatePeriod(startDate: startDate, endDate: Date()),
                co2Emissions: emissions.co2,
                noxEmissions: emissions.nox,
                pm25Emissions: emissions.pm25,
                fuelConsumed: fuelConsumed,
                fuelType: fuelType,
                distanceTraveled: distance,
                idleTime: Double.random(in: 5...30),
                totalRuntime: Double.random(in: 50...150)
            )

            emissionsData.append(emission)
        }

        calculateCarbonFootprint()
        calculateSustainabilityMetrics()

        // Mock offset programs
        offsetPrograms = [
            OffsetProgram(
                id: UUID().uuidString,
                tenantId: "default",
                name: "Renewable Energy Credits",
                description: "Wind and solar energy certificates",
                provider: "Green Energy Solutions",
                purchaseDate: Date(),
                co2Offset: 5000,
                cost: 150.0,
                certificateUrl: nil,
                status: .verified
            ),
            OffsetProgram(
                id: UUID().uuidString,
                tenantId: "default",
                name: "Reforestation Project",
                description: "Amazon rainforest conservation",
                provider: "Forest Carbon",
                purchaseDate: Calendar.current.date(byAdding: .month, value: -2, to: Date()) ?? Date(),
                co2Offset: 10000,
                cost: 350.0,
                certificateUrl: nil,
                status: .active
            )
        ]
    }
}
