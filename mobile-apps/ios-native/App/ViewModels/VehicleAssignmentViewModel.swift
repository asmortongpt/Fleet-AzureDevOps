//
//  VehicleAssignmentViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for Vehicle Assignment management with conflict detection
//  Supports create, approve, track, and history management
//

import Foundation
import Combine
import SwiftUI

@MainActor
class VehicleAssignmentViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var assignments: [VehicleAssignment] = []
    @Published var requests: [AssignmentRequest] = []
    @Published var history: [AssignmentHistory] = []
    @Published var conflicts: [AssignmentConflict] = []
    @Published var selectedAssignment: VehicleAssignment?
    @Published var selectedRequest: AssignmentRequest?

    // Filter properties
    @Published var filterStatus: VehicleAssignmentStatus?
    @Published var filterType: VehicleAssignmentType?
    @Published var filterVehicleId: String?
    @Published var filterAssignedTo: String?
    @Published var showOnlyActive = false
    @Published var showOnlyConflicts = false

    // Statistics
    @Published var totalAssignments = 0
    @Published var activeAssignments = 0
    @Published var pendingRequests = 0
    @Published var totalConflicts = 0

    // MARK: - Private Properties
    private let baseURL = "https://api.ctafleet.com/api/v1"
    private var authToken: String {
        // Get from AuthenticationManager or secure storage
        return UserDefaults.standard.string(forKey: "authToken") ?? ""
    }

    // MARK: - Computed Properties
    var filteredAssignments: [VehicleAssignment] {
        var result = assignments

        if let status = filterStatus {
            result = result.filter { $0.status == status }
        }

        if let type = filterType {
            result = result.filter { $0.assignmentType == type }
        }

        if let vehicleId = filterVehicleId {
            result = result.filter { $0.vehicleId == vehicleId }
        }

        if let assignedTo = filterAssignedTo {
            result = result.filter { $0.assignedTo == assignedTo }
        }

        if showOnlyActive {
            result = result.filter { $0.isActive }
        }

        if !searchText.isEmpty {
            result = result.filter {
                $0.vehicleId.localizedCaseInsensitiveContains(searchText) ||
                $0.assignedTo.localizedCaseInsensitiveContains(searchText) ||
                ($0.purpose?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        return result.sorted { $0.startDate > $1.startDate }
    }

    var pendingRequestsList: [AssignmentRequest] {
        requests.filter { $0.isPending }
    }

    var conflictingAssignments: [VehicleAssignment] {
        let conflictedIds = Set(conflicts.flatMap { [$0.assignment1.id, $0.assignment2.id] })
        return assignments.filter { conflictedIds.contains($0.id) }
    }

    // MARK: - Initialization
    override init() {
        super.init()
        setupObservers()
    }

    private func setupObservers() {
        // Observe filter changes and refresh
        Publishers.CombineLatest4($filterStatus, $filterType, $filterVehicleId, $filterAssignedTo)
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.updateStatistics()
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading
    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchAssignments() }
            group.addTask { await self.fetchRequests() }
            group.addTask { await self.detectConflicts() }
        }

        updateStatistics()
        finishRefreshing()
    }

    func fetchAssignments(page: Int = 1) async {
        guard !isLoadingMore else { return }

        if page == 1 {
            startLoading()
        } else {
            startLoadingMore()
        }

        do {
            var urlComponents = URLComponents(string: "\(baseURL)/assignments")!
            urlComponents.queryItems = [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(itemsPerPage)")
            ]

            if let status = filterStatus {
                urlComponents.queryItems?.append(URLQueryItem(name: "status", value: status.rawValue))
            }

            if let type = filterType {
                urlComponents.queryItems?.append(URLQueryItem(name: "type", value: type.rawValue))
            }

            if let vehicleId = filterVehicleId {
                urlComponents.queryItems?.append(URLQueryItem(name: "vehicle_id", value: vehicleId))
            }

            guard let url = urlComponents.url else {
                handleErrorMessage("Invalid URL")
                return
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                handleErrorMessage("Invalid response")
                return
            }

            guard httpResponse.statusCode == 200 else {
                handleErrorMessage("Server error: \(httpResponse.statusCode)")
                return
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let assignmentsResponse = try decoder.decode(VehicleAssignmentsResponse.self, from: data)

            if page == 1 {
                assignments = assignmentsResponse.assignments
            } else {
                assignments.append(contentsOf: assignmentsResponse.assignments)
            }

            totalAssignments = assignmentsResponse.total

            if page == 1 {
                finishLoading()
            } else {
                finishLoadingMore(itemsReceived: assignmentsResponse.assignments.count)
            }

        } catch {
            handleError(error)
        }
    }

    func fetchRequests() async {
        do {
            let url = URL(string: "\(baseURL)/assignments/requests")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let requestsResponse = try decoder.decode(AssignmentRequestsResponse.self, from: data)

            requests = requestsResponse.requests
            pendingRequests = requestsResponse.requests.filter { $0.isPending }.count

        } catch {
            print("Error fetching requests: \(error)")
        }
    }

    func fetchHistory(for assignmentId: String) async {
        do {
            let url = URL(string: "\(baseURL)/assignments/\(assignmentId)/history")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let historyResponse = try decoder.decode(AssignmentHistoryResponse.self, from: data)

            history = historyResponse.history

        } catch {
            print("Error fetching history: \(error)")
        }
    }

    // MARK: - Assignment Operations
    func createAssignment(_ assignment: VehicleAssignment) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(assignment)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                handleErrorMessage("Invalid response")
                return false
            }

            guard httpResponse.statusCode == 201 else {
                handleErrorMessage("Failed to create assignment: \(httpResponse.statusCode)")
                return false
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let assignmentResponse = try decoder.decode(VehicleAssignmentResponse.self, from: data)

            assignments.insert(assignmentResponse.assignment, at: 0)
            updateStatistics()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    func updateAssignment(_ assignment: VehicleAssignment) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments/\(assignment.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(assignment)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                handleErrorMessage("Failed to update assignment")
                return false
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let assignmentResponse = try decoder.decode(VehicleAssignmentResponse.self, from: data)

            if let index = assignments.firstIndex(where: { $0.id == assignment.id }) {
                assignments[index] = assignmentResponse.assignment
            }

            updateStatistics()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    func deleteAssignment(_ assignment: VehicleAssignment) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments/\(assignment.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
                handleErrorMessage("Failed to delete assignment")
                return false
            }

            assignments.removeAll { $0.id == assignment.id }
            updateStatistics()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    // MARK: - Request Operations
    func submitRequest(_ request: AssignmentRequest) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments/requests")!
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            urlRequest.httpBody = try encoder.encode(request)

            let (_, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 201 else {
                handleErrorMessage("Failed to submit request")
                return false
            }

            await fetchRequests()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    func approveRequest(_ request: AssignmentRequest, assignmentId: String) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments/requests/\(request.id)/approve")!
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let body = ["assignment_id": assignmentId]
            urlRequest.httpBody = try JSONEncoder().encode(body)

            let (_, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                handleErrorMessage("Failed to approve request")
                return false
            }

            await fetchRequests()
            await fetchAssignments()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    func denyRequest(_ request: AssignmentRequest, reason: String) async -> Bool {
        startLoading()

        do {
            let url = URL(string: "\(baseURL)/assignments/requests/\(request.id)/deny")!
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let body = ["reason": reason]
            urlRequest.httpBody = try JSONEncoder().encode(body)

            let (_, response) = try await URLSession.shared.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                handleErrorMessage("Failed to deny request")
                return false
            }

            await fetchRequests()
            finishLoading()
            return true

        } catch {
            handleError(error)
            return false
        }
    }

    // MARK: - Conflict Detection
    func detectConflicts() async {
        // Local conflict detection
        var detectedConflicts: [AssignmentConflict] = []

        let activeAssignments = assignments.filter { $0.status == .active || $0.status == .pending }

        for (index, assignment1) in activeAssignments.enumerated() {
            for assignment2 in activeAssignments.dropFirst(index + 1) {
                // Check if same vehicle
                guard assignment1.vehicleId == assignment2.vehicleId else { continue }

                // Check date overlap
                if assignment1.dateRange.overlaps(assignment2.dateRange),
                   let overlapPeriod = assignment1.dateRange.overlap(with: assignment2.dateRange) {
                    let conflict = AssignmentConflict(
                        assignment1: assignment1,
                        assignment2: assignment2,
                        overlapPeriod: overlapPeriod,
                        conflictType: .dateOverlap
                    )
                    detectedConflicts.append(conflict)
                }
            }
        }

        conflicts = detectedConflicts
        totalConflicts = detectedConflicts.count
    }

    func checkAvailability(vehicleId: String, startDate: Date, endDate: Date?) -> Bool {
        let requestedRange = DateInterval(start: startDate, end: endDate ?? Date.distantFuture)

        let existingAssignments = assignments.filter {
            $0.vehicleId == vehicleId &&
            ($0.status == .active || $0.status == .pending)
        }

        for assignment in existingAssignments {
            if assignment.dateRange.overlaps(requestedRange) {
                return false
            }
        }

        return true
    }

    func getConflicts(for assignment: VehicleAssignment) -> [AssignmentConflict] {
        var foundConflicts: [AssignmentConflict] = []

        let existingAssignments = assignments.filter {
            $0.vehicleId == assignment.vehicleId &&
            $0.id != assignment.id &&
            ($0.status == .active || $0.status == .pending)
        }

        for existing in existingAssignments {
            if assignment.dateRange.overlaps(existing.dateRange),
               let overlapPeriod = assignment.dateRange.overlap(with: existing.dateRange) {
                let conflict = AssignmentConflict(
                    assignment1: existing,
                    assignment2: assignment,
                    overlapPeriod: overlapPeriod,
                    conflictType: .dateOverlap
                )
                foundConflicts.append(conflict)
            }
        }

        return foundConflicts
    }

    // MARK: - Statistics
    private func updateStatistics() {
        totalAssignments = assignments.count
        activeAssignments = assignments.filter { $0.isActive }.count
        pendingRequests = requests.filter { $0.isPending }.count
    }

    // MARK: - Filters
    func resetFilters() {
        filterStatus = nil
        filterType = nil
        filterVehicleId = nil
        filterAssignedTo = nil
        showOnlyActive = false
        showOnlyConflicts = false
        searchText = ""
    }

    func applyQuickFilter(_ filter: QuickFilter) {
        resetFilters()
        switch filter {
        case .active:
            showOnlyActive = true
        case .pending:
            filterStatus = .pending
        case .conflicts:
            showOnlyConflicts = true
        case .permanent:
            filterType = .permanent
        case .temporary:
            filterType = .temporary
        }
    }
}

// MARK: - Quick Filter Enum
enum QuickFilter: String, CaseIterable {
    case active = "Active"
    case pending = "Pending"
    case conflicts = "Conflicts"
    case permanent = "Permanent"
    case temporary = "Temporary"

    var icon: String {
        switch self {
        case .active: return "checkmark.circle.fill"
        case .pending: return "clock.fill"
        case .conflicts: return "exclamationmark.triangle.fill"
        case .permanent: return "person.fill.checkmark"
        case .temporary: return "clock.arrow.circlepath"
        }
    }

    var color: Color {
        switch self {
        case .active: return .green
        case .pending: return .orange
        case .conflicts: return .red
        case .permanent: return .blue
        case .temporary: return .purple
        }
    }
}
