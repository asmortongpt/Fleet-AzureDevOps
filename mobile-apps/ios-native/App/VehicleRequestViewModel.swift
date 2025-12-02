/**
 * Vehicle Request ViewModel
 * Manages vehicle requests, filtering, and Microsoft integration
 */

import Foundation
import SwiftUI

@MainActor
class VehicleRequestViewModel: ObservableObject {

    // MARK: - Published Properties

    @Published var vehicles: [Vehicle] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var filterStatus: FilterStatus?
    @Published var showMicrosoftIntegration: Bool = false

    // MARK: - Filter Status

    enum FilterStatus: Equatable {
        case available
        case myRequests
        case allRequests
    }

    // MARK: - Computed Properties

    var filteredVehicles: [Vehicle] {
        guard let filter = filterStatus else { return vehicles }

        switch filter {
        case .available:
            return vehicles.filter { $0.status == .available }
        case .myRequests:
            // TODO: Filter by current user's requests
            return vehicles.filter { $0.status == .reserved && $0.assignedDriver == AuthenticationManager.shared.currentUser?.id }
        case .allRequests:
            return vehicles.filter { $0.status == .reserved || $0.status == .inUse }
        }
    }

    // MARK: - Initialization

    init() {
        // Start with sample data for now
        self.vehicles = Vehicle.samples
    }

    // MARK: - Data Loading

    func loadVehicles() async {
        isLoading = true
        errorMessage = nil

        do {
            // TODO: Replace with actual API call
            // let vehicles = try await APIService.shared.getVehicles()
            // self.vehicles = vehicles

            // For now, use sample data
            try await Task.sleep(nanoseconds: 500_000_000) // Simulate network delay
            self.vehicles = Vehicle.samples

            isLoading = false
        } catch {
            errorMessage = "Failed to load vehicles: \(error.localizedDescription)"
            isLoading = false
        }
    }

    // MARK: - Request Submission

    func submitRequest(
        vehicleId: String,
        startDate: Date,
        endDate: Date,
        purpose: String,
        notes: String
    ) async {
        isLoading = true
        errorMessage = nil

        do {
            // TODO: Replace with actual API call
            // let request = VehicleRequest(
            //     vehicleId: vehicleId,
            //     startDate: startDate,
            //     endDate: endDate,
            //     purpose: purpose,
            //     notes: notes
            // )
            // try await APIService.shared.submitVehicleRequest(request)

            // For now, simulate successful submission
            try await Task.sleep(nanoseconds: 500_000_000)

            // Update vehicle status locally
            if let index = vehicles.firstIndex(where: { $0.id == vehicleId }) {
                var updatedVehicle = vehicles[index]
                updatedVehicle.status = .reserved
                updatedVehicle.assignedDriver = AuthenticationManager.shared.currentUser?.id
                vehicles[index] = updatedVehicle
            }

            isLoading = false

            // Show success message (could use a toast/alert)
            print("✅ Vehicle request submitted successfully")

        } catch {
            errorMessage = "Failed to submit request: \(error.localizedDescription)"
            isLoading = false
        }
    }

    // MARK: - Microsoft Integration

    func openTeamsIntegration() {
        // Microsoft Teams deep link format:
        // msteams://teams.microsoft.com/l/chat/0/0?users=<email>&message=<message>

        let message = "I would like to request a fleet vehicle."
        let encodedMessage = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        // Get fleet manager email from config or use default
        let fleetManagerEmail = "fleet@capitaltechalliance.com"
        let encodedEmail = fleetManagerEmail.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let teamsURL = "msteams://teams.microsoft.com/l/chat/0/0?users=\(encodedEmail)&message=\(encodedMessage)"

        if let url = URL(string: teamsURL) {
            UIApplication.shared.open(url) { success in
                if !success {
                    // Teams app not installed, open in browser
                    let webURL = "https://teams.microsoft.com"
                    if let webURL = URL(string: webURL) {
                        UIApplication.shared.open(webURL)
                    }
                }
            }
        }
    }

    func openOutlookIntegration() {
        // Microsoft Outlook deep link format:
        // ms-outlook://compose?to=<email>&subject=<subject>&body=<body>

        let fleetManagerEmail = "fleet@capitaltechalliance.com"
        let encodedEmail = fleetManagerEmail.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let subject = "Vehicle Request"
        let encodedSubject = subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let body = """
        Hello,

        I would like to request a fleet vehicle with the following details:

        Start Date: [Enter date]
        End Date: [Enter date]
        Purpose: [Enter purpose]
        Additional Notes: [Enter notes]

        Thank you.
        """
        let encodedBody = body.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        let outlookURL = "ms-outlook://compose?to=\(encodedEmail)&subject=\(encodedSubject)&body=\(encodedBody)"

        if let url = URL(string: outlookURL) {
            UIApplication.shared.open(url) { success in
                if !success {
                    // Outlook app not installed, try mailto:
                    let mailtoURL = "mailto:\(fleetManagerEmail)?subject=\(encodedSubject)&body=\(encodedBody)"
                    if let mailtoURL = URL(string: mailtoURL) {
                        UIApplication.shared.open(mailtoURL)
                    }
                }
            }
        }
    }

    // MARK: - Export

    func exportRequests() {
        // TODO: Implement export functionality
        // Could export as CSV, PDF, or share via share sheet

        let myRequests = vehicles.filter { $0.status == .reserved && $0.assignedDriver == AuthenticationManager.shared.currentUser?.id }

        print("📄 Exporting \(myRequests.count) requests...")

        // For now, just print to console
        for vehicle in myRequests {
            print("  - \(vehicle.name) (\(vehicle.status.displayName))")
        }

        // Could implement:
        // 1. Generate CSV/PDF
        // 2. Present UIActivityViewController
        // 3. Share via email/Teams/etc
    }
}

// MARK: - Vehicle Request Model

struct VehicleRequest: Codable {
    let id: String?
    let vehicleId: String
    let userId: String
    let startDate: Date
    let endDate: Date
    let purpose: String
    let notes: String?
    let status: RequestStatus
    let createdAt: Date
    let updatedAt: Date?

    enum RequestStatus: String, Codable {
        case pending = "pending"
        case approved = "approved"
        case rejected = "rejected"
        case cancelled = "cancelled"
    }

    init(
        id: String? = nil,
        vehicleId: String,
        userId: String,
        startDate: Date,
        endDate: Date,
        purpose: String,
        notes: String? = nil,
        status: RequestStatus = .pending,
        createdAt: Date = Date(),
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.vehicleId = vehicleId
        self.userId = userId
        self.startDate = startDate
        self.endDate = endDate
        self.purpose = purpose
        self.notes = notes
        self.status = status
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
