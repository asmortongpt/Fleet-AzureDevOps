import Foundation
import Combine
import SwiftUI
import CoreLocation

@MainActor
class IncidentViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var incidents: [IncidentReport] = []
    @Published var statistics: IncidentStatistics?
    @Published var selectedIncident: IncidentReport?
    @Published var showingCreateIncident = false
    @Published var showingPhotoCapture = false
    @Published var capturedPhotos: [UIImage] = []
    @Published var currentLocation: CLLocation?
    @Published var filterByStatus: IncidentStatus?
    @Published var filterBySeverity: IncidentSeverity?
    @Published var filterByType: IncidentType?
    @Published var sortOption: IncidentSortOption = .dateDescending

    // Location manager
    private let locationManager = CLLocationManager()

    // MARK: - Computed Properties
    var filteredIncidents: [IncidentReport] {
        var filtered = incidents

        if let status = filterByStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if let severity = filterBySeverity {
            filtered = filtered.filter { $0.severity == severity }
        }

        if let type = filterByType {
            filtered = filtered.filter { $0.type == type }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.incidentNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.vehicleNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.driverName.localizedCaseInsensitiveContains(searchText) ||
                $0.description.localizedCaseInsensitiveContains(searchText)
            }
        }

        return sortIncidents(filtered, by: sortOption)
    }

    var openIncidents: [IncidentReport] {
        incidents.filter { $0.status != .closed && $0.status != .rejected }
    }

    var criticalIncidents: [IncidentReport] {
        incidents.filter { $0.severity == .critical || $0.severity == .major }
    }

    var incidentsByType: [IncidentType: [IncidentReport]] {
        Dictionary(grouping: incidents) { $0.type }
    }

    var recentIncidents: [IncidentReport] {
        incidents.filter {
            $0.incidentDate > Date().addingTimeInterval(-30 * 86400)
        }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupLocationManager()
        Task {
            await loadInitialData()
        }
    }

    private func setupLocationManager() {
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadIncidents() }
            group.addTask { await self.loadStatistics() }
        }

        finishRefreshing()
    }

    func loadIncidents() async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            let mockIncidents = generateMockIncidents()

            await MainActor.run {
                self.incidents = mockIncidents
                self.finishLoading()
            }
        } catch {
            handleError(error)
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
    func createIncident(_ request: IncidentReportRequest) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 800_000_000)

            let newIncident = IncidentReport(
                id: UUID().uuidString,
                incidentNumber: "INC-2025-\(String(format: "%03d", incidents.count + 1))",
                vehicleId: request.vehicleId,
                vehicleNumber: request.vehicleNumber,
                driverName: request.driverName,
                driverId: request.driverId,
                incidentDate: request.incidentDate,
                reportedDate: Date(),
                reportedBy: request.driverName,
                type: request.type,
                severity: request.severity,
                status: .submitted,
                location: request.location,
                description: request.description,
                weatherConditions: request.weatherConditions,
                roadConditions: request.roadConditions,
                witnesses: request.witnesses,
                photos: request.photos.enumerated().map { index, data in
                    IncidentPhoto(
                        id: UUID().uuidString,
                        photoUrl: nil,
                        photoData: data,
                        caption: nil,
                        timestamp: Date(),
                        photoType: .damage,
                        uploadedBy: request.driverName
                    )
                },
                damageEstimate: request.damageEstimate,
                injuries: request.injuries,
                policeReport: request.policeReport,
                insuranceClaim: nil,
                notes: request.notes,
                lastUpdated: Date(),
                assignedTo: nil
            )

            await MainActor.run {
                self.incidents.insert(newIncident, at: 0)
                self.finishLoading()
                self.showingCreateIncident = false
                self.capturedPhotos.removeAll()
                ModernTheme.Haptics.success()
            }

            await loadStatistics()
        } catch {
            handleError(error)
        }
    }

    func updateIncident(_ incident: IncidentReport) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.incidents.firstIndex(where: { $0.id == incident.id }) {
                    self.incidents[index] = incident
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func deleteIncident(_ incident: IncidentReport) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.incidents.removeAll { $0.id == incident.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            await loadStatistics()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Status Management
    func updateStatus(_ incident: IncidentReport, to status: IncidentStatus) async {
        var updated = incident
        updated.status = status
        await updateIncident(updated)
    }

    func closeIncident(_ incident: IncidentReport) async {
        await updateStatus(incident, to: .closed)
    }

    // MARK: - Insurance Claims
    func fileInsuranceClaim(_ incident: IncidentReport, claim: InsuranceClaim) async {
        var updated = incident
        updated.insuranceClaim = claim
        await updateIncident(updated)
    }

    func updateClaimStatus(_ incident: IncidentReport, status: InsuranceClaim.ClaimStatus) async {
        guard var claim = incident.insuranceClaim else { return }
        // Would update claim status here
        await updateIncident(incident)
    }

    // MARK: - Photo Management
    func capturePhoto(_ image: UIImage) {
        capturedPhotos.append(image)
        ModernTheme.Haptics.light()
    }

    func removePhoto(at index: Int) {
        guard capturedPhotos.indices.contains(index) else { return }
        capturedPhotos.remove(at: index)
        ModernTheme.Haptics.light()
    }

    func clearPhotos() {
        capturedPhotos.removeAll()
    }

    // MARK: - Location
    func requestCurrentLocation() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.requestLocation()
    }

    func createLocationFromCurrent() -> IncidentLocation? {
        guard let location = currentLocation else { return nil }

        // In a real app, reverse geocode to get address
        return IncidentLocation(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            address: "Current Location",
            city: "City",
            state: "State",
            zipCode: "00000",
            country: "USA"
        )
    }

    // MARK: - Sorting
    private func sortIncidents(_ incidents: [IncidentReport], by option: IncidentSortOption) -> [IncidentReport] {
        switch option {
        case .dateDescending:
            return incidents.sorted { $0.incidentDate > $1.incidentDate }
        case .dateAscending:
            return incidents.sorted { $0.incidentDate < $1.incidentDate }
        case .severityDescending:
            return incidents.sorted { $0.severity.rawValue > $1.severity.rawValue }
        case .status:
            return incidents.sorted { $0.status.rawValue < $1.status.rawValue }
        case .incidentNumber:
            return incidents.sorted { $0.incidentNumber < $1.incidentNumber }
        }
    }

    // MARK: - Search
    override func performSearch() {
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        filterByStatus = nil
        filterBySeverity = nil
        filterByType = nil
    }

    // MARK: - Mock Data Generation
    private func generateMockIncidents() -> [IncidentReport] {
        let vehicleIds = ["VEH-001", "VEH-002", "VEH-003", "VEH-004", "VEH-005"]
        let drivers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]
        let types = IncidentType.allCases
        let severities = IncidentSeverity.allCases
        let statuses = IncidentStatus.allCases

        return (0..<20).map { index in
            let incidentDate = Date().addingTimeInterval(Double(-index * 86400 * 3))

            return IncidentReport(
                id: "INC-\(UUID().uuidString.prefix(8))",
                incidentNumber: "INC-2025-\(String(format: "%03d", index + 1))",
                vehicleId: vehicleIds.randomElement()!,
                vehicleNumber: "V-\(Int.random(in: 10000...99999))",
                driverName: drivers.randomElement()!,
                driverId: "DRV-00\(Int.random(in: 1...5))",
                incidentDate: incidentDate,
                reportedDate: incidentDate.addingTimeInterval(3600),
                reportedBy: drivers.randomElement()!,
                type: types.randomElement()!,
                severity: severities.randomElement()!,
                status: statuses.randomElement()!,
                location: IncidentLocation(
                    latitude: 38.9072 + Double.random(in: -0.1...0.1),
                    longitude: -77.0369 + Double.random(in: -0.1...0.1),
                    address: "\(Int.random(in: 100...999)) Main St",
                    city: "Washington",
                    state: "DC",
                    zipCode: "20001",
                    country: "USA"
                ),
                description: "Incident occurred at intersection. \(["Minor damage", "Moderate damage", "Significant damage"].randomElement()!)",
                weatherConditions: WeatherCondition.allCases.randomElement()!,
                roadConditions: RoadCondition.allCases.randomElement()!,
                witnesses: [],
                photos: [],
                damageEstimate: index % 3 == 0 ? Double.random(in: 500...10000) : nil,
                injuries: [],
                policeReport: index % 4 == 0 ? PoliceReport(
                    reportNumber: "PR-\(Int.random(in: 10000...99999))",
                    officerName: "Officer Smith",
                    officerBadge: "BADGE-\(Int.random(in: 100...999))",
                    department: "Metro Police",
                    filedDate: incidentDate,
                    reportUrl: nil
                ) : nil,
                insuranceClaim: index % 5 == 0 ? InsuranceClaim(
                    claimNumber: "CLM-\(Int.random(in: 100000...999999))",
                    insuranceProvider: "State Farm",
                    policyNumber: "POL-\(Int.random(in: 100000...999999))",
                    filedDate: incidentDate.addingTimeInterval(86400),
                    claimAmount: Double.random(in: 1000...15000),
                    status: InsuranceClaim.ClaimStatus.allCases.randomElement()!,
                    adjusterName: "Claims Adjuster",
                    adjusterPhone: "(555) 123-4567",
                    approvedAmount: nil,
                    settlementDate: nil,
                    notes: nil
                ) : nil,
                notes: index % 2 == 0 ? "Additional notes about the incident" : nil,
                lastUpdated: Date(),
                assignedTo: index % 3 == 0 ? "Safety Manager" : nil
            )
        }
    }

    private func generateMockStatistics() -> IncidentStatistics {
        let byType = Dictionary(grouping: incidents) { $0.type.rawValue }
            .mapValues { $0.count }

        let bySeverity = Dictionary(grouping: incidents) { $0.severity.rawValue }
            .mapValues { $0.count }

        let totalDamage = incidents.compactMap { $0.damageEstimate }.reduce(0, +)
        let totalClaims = incidents.compactMap { $0.insuranceClaim?.claimAmount }.reduce(0, +)

        return IncidentStatistics(
            totalIncidents: incidents.count,
            openIncidents: openIncidents.count,
            closedIncidents: incidents.filter { $0.status == .closed }.count,
            incidentsByType: byType,
            incidentsBySeverity: bySeverity,
            totalDamageEstimate: totalDamage,
            totalClaimAmount: totalClaims,
            averageResolutionDays: 7.5,
            incidentTrend: []
        )
    }
}

// MARK: - Supporting Types
enum IncidentSortOption: String, CaseIterable {
    case dateDescending = "Date (Newest)"
    case dateAscending = "Date (Oldest)"
    case severityDescending = "Severity (High to Low)"
    case status = "Status"
    case incidentNumber = "Incident Number"

    var icon: String {
        switch self {
        case .dateDescending, .dateAscending:
            return "calendar"
        case .severityDescending:
            return "exclamationmark.triangle"
        case .status:
            return "flag"
        case .incidentNumber:
            return "number"
        }
    }
}

// MARK: - CLLocationManagerDelegate
extension IncidentViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error)")
    }
}
