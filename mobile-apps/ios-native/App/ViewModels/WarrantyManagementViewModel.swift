//
//  WarrantyManagementViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for warranty management and claim tracking
//  Extends RefreshableViewModel for search and pagination support
//

import Foundation
import Combine
import SwiftUI

@MainActor
class WarrantyManagementViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var warranties: [Warranty] = []
    @Published var claims: [WarrantyClaim] = []
    @Published var statistics: WarrantyStatistics?
    @Published var selectedWarranty: Warranty?
    @Published var selectedClaim: WarrantyClaim?
    @Published var filterType: WarrantyFilterType = .all
    @Published var sortOption: WarrantySortOption = .expirationDate
    @Published var showExpiredWarranties = false

    // Filtered and sorted warranties
    var filteredWarranties: [Warranty] {
        var filtered = warranties

        // Apply search filter
        if !searchText.isEmpty {
            filtered = filtered.filter { warranty in
                warranty.component.localizedCaseInsensitiveContains(searchText) ||
                warranty.provider.name.localizedCaseInsensitiveContains(searchText) ||
                warranty.type.displayName.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Apply type filter
        switch filterType {
        case .all:
            break
        case .active:
            filtered = filtered.filter { $0.isActive }
        case .expiring:
            filtered = filtered.filter { $0.isExpiring }
        case .expired:
            filtered = filtered.filter { $0.isExpired }
        case .byType(let type):
            filtered = filtered.filter { $0.type == type }
        }

        // Hide expired if needed
        if !showExpiredWarranties {
            filtered = filtered.filter { !$0.isExpired }
        }

        // Apply sorting
        return sortWarranties(filtered, by: sortOption)
    }

    // Filtered claims
    var filteredClaims: [WarrantyClaim] {
        var filtered = claims

        if !searchText.isEmpty {
            filtered = filtered.filter { claim in
                claim.component.localizedCaseInsensitiveContains(searchText) ||
                claim.issueDescription.localizedCaseInsensitiveContains(searchText) ||
                claim.status.displayName.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered.sorted { $0.submittedAt > $1.submittedAt }
    }

    // Alert warranties (expiring soon)
    var expiringWarranties: [Warranty] {
        warranties.filter { $0.isExpiring && $0.isActive }
            .sorted { $0.daysRemaining < $1.daysRemaining }
    }

    // Active claims
    var activeClaims: [WarrantyClaim] {
        claims.filter { !$0.isResolved }
    }

    // MARK: - API Configuration
    private let baseURL = APIConfiguration.baseURL
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    override init() {
        super.init()
        setupNotifications()
    }

    // MARK: - Setup
    private func setupNotifications() {
        // Setup warranty expiration notifications
        NotificationCenter.default.publisher(for: .NSCalendarDayChanged)
            .sink { [weak self] _ in
                Task { @MainActor in
                    await self?.checkExpiringWarranties()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading
    override func refresh() async {
        startRefreshing()
        await loadWarranties()
        await loadClaims()
        await loadStatistics()
        finishRefreshing()
    }

    func loadWarranties() async {
        guard !isRefreshing else { return }

        do {
            startLoading()

            guard let url = URL(string: "\(baseURL)/api/v1/warranties") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            // Add authentication token if available
            if let token = UserDefaults.standard.string(forKey: "authToken") {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw NSError(domain: "WarrantyAPI", code: httpResponse.statusCode,
                            userInfo: [NSLocalizedDescriptionKey: "Failed to load warranties"])
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let warrantyResponse = try decoder.decode(WarrantiesResponse.self, from: data)

            warranties = warrantyResponse.warranties
            finishLoading()

        } catch {
            handleError(error)
            print("Error loading warranties: \(error)")
        }
    }

    func loadClaims() async {
        do {
            guard let url = URL(string: "\(baseURL)/api/v1/warranties/claims") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            if let token = UserDefaults.standard.string(forKey: "authToken") {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let claimResponse = try decoder.decode(ClaimsResponse.self, from: data)

            claims = claimResponse.claims

        } catch {
            print("Error loading claims: \(error)")
        }
    }

    func loadStatistics() async {
        do {
            guard let url = URL(string: "\(baseURL)/api/v1/warranties/statistics") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            if let token = UserDefaults.standard.string(forKey: "authToken") {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let statsResponse = try decoder.decode(WarrantyStatisticsResponse.self, from: data)

            statistics = statsResponse.statistics

        } catch {
            print("Error loading statistics: \(error)")
        }
    }

    // MARK: - Warranty Operations
    func isComponentCovered(component: String, vehicleId: String, mileage: Int?) -> Bool {
        let vehicleWarranties = warranties.filter { $0.vehicleId == vehicleId && $0.isActive }

        return vehicleWarranties.contains { warranty in
            warranty.isComponentCovered(component: component, mileage: mileage)
        }
    }

    func getWarrantiesForVehicle(vehicleId: String) -> [Warranty] {
        warranties.filter { $0.vehicleId == vehicleId }
            .sorted { $0.endDate > $1.endDate }
    }

    func getActiveWarrantiesForVehicle(vehicleId: String) -> [Warranty] {
        warranties.filter { $0.vehicleId == vehicleId && $0.isActive }
            .sorted { $0.endDate > $1.endDate }
    }

    func calculateTotalWarrantyValue() -> Double {
        warranties.filter { $0.isActive }
            .reduce(0) { $0 + $1.calculateWarrantyValue() }
    }

    // MARK: - Claim Operations
    func submitClaim(request: CreateClaimRequest) async throws -> WarrantyClaim {
        guard let url = URL(string: "\(baseURL)/api/v1/warranties/claim") else {
            throw URLError(.badURL)
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = UserDefaults.standard.string(forKey: "authToken") {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        urlRequest.httpBody = try encoder.encode(request)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard httpResponse.statusCode == 201 || httpResponse.statusCode == 200 else {
            throw NSError(domain: "WarrantyAPI", code: httpResponse.statusCode,
                        userInfo: [NSLocalizedDescriptionKey: "Failed to submit claim"])
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let claimResponse = try decoder.decode(ClaimResponse.self, from: data)

        // Add to local claims list
        claims.insert(claimResponse.claim, at: 0)

        return claimResponse.claim
    }

    func updateClaim(claimId: String, request: UpdateClaimRequest) async throws {
        guard let url = URL(string: "\(baseURL)/api/v1/warranties/claims/\(claimId)") else {
            throw URLError(.badURL)
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "PATCH"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = UserDefaults.standard.string(forKey: "authToken") {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        urlRequest.httpBody = try encoder.encode(request)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let claimResponse = try decoder.decode(ClaimResponse.self, from: data)

        // Update local claims list
        if let index = claims.firstIndex(where: { $0.id == claimId }) {
            claims[index] = claimResponse.claim
        }
    }

    func getClaimsForWarranty(warrantyId: String) -> [WarrantyClaim] {
        claims.filter { $0.warrantyId == warrantyId }
            .sorted { $0.submittedAt > $1.submittedAt }
    }

    func getClaimStatusSummary(for warrantyId: String) -> ClaimStatusSummary {
        let warrantyClaims = getClaimsForWarranty(warrantyId: warrantyId)

        return ClaimStatusSummary(
            total: warrantyClaims.count,
            pending: warrantyClaims.filter { $0.status == .submitted || $0.status == .underReview }.count,
            approved: warrantyClaims.filter { $0.status == .approved || $0.status == .paid }.count,
            denied: warrantyClaims.filter { $0.status == .denied }.count,
            totalAmount: warrantyClaims.reduce(0) { $0 + ($1.claimAmount ?? 0) },
            approvedAmount: warrantyClaims.reduce(0) { $0 + ($1.approvedAmount ?? 0) }
        )
    }

    // MARK: - Expiration Alerts
    func checkExpiringWarranties() async {
        let expiring = expiringWarranties

        for warranty in expiring {
            let days = warranty.daysRemaining

            // Send notifications at 90, 60, 30 days
            if days == 90 || days == 60 || days == 30 {
                scheduleExpirationNotification(for: warranty, days: days)
            }
        }
    }

    private func scheduleExpirationNotification(for warranty: Warranty, days: Int) {
        // TODO: Implement local notification scheduling
        print("Warranty expiring in \(days) days: \(warranty.component) for vehicle \(warranty.vehicleId)")
    }

    // MARK: - Filtering and Sorting
    func setFilter(_ filter: WarrantyFilterType) {
        filterType = filter
    }

    func setSortOption(_ option: WarrantySortOption) {
        sortOption = option
    }

    private func sortWarranties(_ warranties: [Warranty], by option: WarrantySortOption) -> [Warranty] {
        switch option {
        case .expirationDate:
            return warranties.sorted { $0.endDate < $1.endDate }
        case .startDate:
            return warranties.sorted { $0.startDate > $1.startDate }
        case .type:
            return warranties.sorted { $0.type.displayName < $1.type.displayName }
        case .provider:
            return warranties.sorted { $0.provider.name < $1.provider.name }
        case .value:
            return warranties.sorted { $0.calculateWarrantyValue() > $1.calculateWarrantyValue() }
        }
    }

    // MARK: - Search
    override func performSearch() {
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
    }

    // MARK: - Selection
    func selectWarranty(_ warranty: Warranty) {
        selectedWarranty = warranty
    }

    func selectClaim(_ claim: WarrantyClaim) {
        selectedClaim = claim
    }
}

// MARK: - Supporting Types
enum WarrantyFilterType: Equatable {
    case all
    case active
    case expiring
    case expired
    case byType(WarrantyType)

    var displayName: String {
        switch self {
        case .all: return "All"
        case .active: return "Active"
        case .expiring: return "Expiring Soon"
        case .expired: return "Expired"
        case .byType(let type): return type.displayName
        }
    }
}

enum WarrantySortOption: String, CaseIterable {
    case expirationDate = "Expiration Date"
    case startDate = "Start Date"
    case type = "Type"
    case provider = "Provider"
    case value = "Value"

    var displayName: String {
        rawValue
    }
}

struct ClaimStatusSummary {
    let total: Int
    let pending: Int
    let approved: Int
    let denied: Int
    let totalAmount: Double
    let approvedAmount: Double

    var approvalRate: Double {
        guard total > 0 else { return 0 }
        return Double(approved) / Double(total) * 100
    }
}

// MARK: - API Configuration
struct APIConfiguration {
    static var baseURL: String {
        // TODO: Configure based on environment
        return "https://api.fleet.example.com"
    }
}
