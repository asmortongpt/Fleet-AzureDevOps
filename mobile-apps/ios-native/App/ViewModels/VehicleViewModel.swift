import Foundation
import SwiftUI
import Combine

// MARK: - Vehicle View Model
@MainActor
class VehicleViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var vehicles: [Vehicle] = []
    @Published var filteredVehicles: [Vehicle] = []
    @Published var selectedVehicle: Vehicle?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedStatus: VehicleStatus?
    @Published var selectedType: VehicleType?
    @Published var sortOption: SortOption = .number

    // MARK: - Services
    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Sort Options
    enum SortOption: String, CaseIterable {
        case number = "Number"
        case make = "Make"
        case status = "Status"
        case mileage = "Mileage"
        case fuelLevel = "Fuel Level"

        var systemImage: String {
            switch self {
            case .number: return "number"
            case .make: return "car.fill"
            case .status: return "info.circle"
            case .mileage: return "speedometer"
            case .fuelLevel: return "fuelpump.fill"
            }
        }
    }

    // MARK: - Initialization
    init() {
        setupSearchAndFilter()
        loadCachedData()
    }

    // MARK: - Search and Filter Setup
    private func setupSearchAndFilter() {
        // Combine search text, status filter, and type filter
        Publishers.CombineLatest4(
            $vehicles,
            $searchText,
            $selectedStatus,
            $selectedType
        )
        .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
        .map { vehicles, searchText, status, type in
            var filtered = vehicles

            // Apply status filter
            if let status = status {
                filtered = filtered.filter { $0.status == status }
            }

            // Apply type filter
            if let type = type {
                filtered = filtered.filter { $0.type == type }
            }

            // Apply search filter
            if !searchText.isEmpty {
                filtered = filtered.filter { vehicle in
                    vehicle.number.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.make.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.model.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.vin.localizedCaseInsensitiveContains(searchText) ||
                    vehicle.licensePlate.localizedCaseInsensitiveContains(searchText)
                }
            }

            return filtered
        }
        .assign(to: &$filteredVehicles)

        // Apply sorting
        $filteredVehicles
            .combineLatest($sortOption)
            .map { vehicles, sortOption in
                self.sortVehicles(vehicles, by: sortOption)
            }
            .assign(to: &$filteredVehicles)
    }

    // MARK: - Data Loading
    private func loadCachedData() {
        if let cachedVehicles = persistenceManager.getCachedVehicles() {
            vehicles = cachedVehicles
        }
    }

    func fetchVehicles(token: String? = nil) async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.vehicles,
                method: .GET,
                token: token,
                responseType: VehiclesResponse.self
            )

            vehicles = response.vehicles
            persistenceManager.cacheVehicles(response.vehicles)
            isLoading = false

        } catch {
            handleError(error)

            // Fall back to cached data if available
            if let cachedVehicles = persistenceManager.getCachedVehicles() {
                vehicles = cachedVehicles
                errorMessage = "Using cached data. \(error.localizedDescription)"
            }

            isLoading = false
        }
    }

    func fetchVehicle(id: String, token: String? = nil) async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await networkManager.performRequest(
                endpoint: "\(APIConfiguration.Endpoints.vehicles)/\(id)",
                method: .GET,
                token: token,
                responseType: VehicleResponse.self
            )

            selectedVehicle = response.vehicle
            persistenceManager.cacheVehicle(response.vehicle)

            // Update in the vehicles array
            if let index = vehicles.firstIndex(where: { $0.id == id }) {
                vehicles[index] = response.vehicle
            }

            isLoading = false

        } catch {
            handleError(error)
            isLoading = false
        }
    }

    // MARK: - Sorting
    private func sortVehicles(_ vehicles: [Vehicle], by option: SortOption) -> [Vehicle] {
        switch option {
        case .number:
            return vehicles.sorted { $0.number < $1.number }
        case .make:
            return vehicles.sorted { $0.make < $1.make }
        case .status:
            return vehicles.sorted { $0.status.rawValue < $1.status.rawValue }
        case .mileage:
            return vehicles.sorted { $0.mileage > $1.mileage }
        case .fuelLevel:
            return vehicles.sorted { $0.fuelLevel < $1.fuelLevel }
        }
    }

    // MARK: - Filtering Helpers
    func getVehiclesByStatus(_ status: VehicleStatus) -> [Vehicle] {
        vehicles.filter { $0.status == status }
    }

    func getVehiclesByType(_ type: VehicleType) -> [Vehicle] {
        vehicles.filter { $0.type == type }
    }

    func getLowFuelVehicles() -> [Vehicle] {
        vehicles.filter { $0.isLowFuel }
    }

    func getServiceDueVehicles() -> [Vehicle] {
        vehicles.filter { $0.isServiceDue }
    }

    // MARK: - Statistics
    func getVehicleCount() -> Int {
        vehicles.count
    }

    func getActiveVehiclesCount() -> Int {
        vehicles.filter { $0.status == .active }.count
    }

    func getAverageMileage() -> Double {
        guard !vehicles.isEmpty else { return 0 }
        let total = vehicles.reduce(0.0) { $0 + $1.mileage }
        return total / Double(vehicles.count)
    }

    func getAverageFuelLevel() -> Double {
        guard !vehicles.isEmpty else { return 0 }
        let total = vehicles.reduce(0.0) { $0 + $1.fuelLevel }
        return total / Double(vehicles.count)
    }

    // MARK: - Error Handling
    private func handleError(_ error: Error) {
        if let apiError = error as? APIError {
            errorMessage = apiError.errorDescription
        } else {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Refresh
    func refresh(token: String? = nil) async {
        await fetchVehicles(token: token)
    }

    // MARK: - Clear Filters
    func clearFilters() {
        searchText = ""
        selectedStatus = nil
        selectedType = nil
    }
}

// MARK: - Inspection View Model
@MainActor
class InspectionViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var currentInspection: VehicleInspection?
    @Published var inspectionItems: [InspectionItem] = []
    @Published var inspectionPhotos: [InspectionPhoto] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showCamera = false
    @Published var selectedCategory: InspectionCategory?

    // MARK: - Services
    private let persistenceManager = DataPersistenceManager.shared

    // MARK: - Create New Inspection
    func createInspection(for vehicle: Vehicle, inspectorName: String) {
        let inspection = VehicleInspection(
            id: UUID().uuidString,
            vehicleId: vehicle.id,
            inspectorName: inspectorName,
            inspectionDate: Date(),
            status: .inProgress,
            items: createDefaultInspectionItems(),
            photos: [],
            notes: nil,
            signature: nil,
            mileageAtInspection: vehicle.mileage
        )

        currentInspection = inspection
        inspectionItems = inspection.items
        inspectionPhotos = []
    }

    // MARK: - Default Inspection Items
    private func createDefaultInspectionItems() -> [InspectionItem] {
        return [
            // Exterior
            InspectionItem(id: UUID().uuidString, category: .exterior, name: "Body Condition", description: "Check for dents, scratches, or damage", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .exterior, name: "Paint Condition", description: "Check paint quality and damage", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .exterior, name: "Windshield", description: "Check for cracks or chips", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .exterior, name: "Mirrors", description: "Check all mirrors are intact and functional", status: .pending, notes: nil, photoIds: nil),

            // Interior
            InspectionItem(id: UUID().uuidString, category: .interior, name: "Seats", description: "Check seat condition and adjustments", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .interior, name: "Dashboard", description: "Check all gauges and indicators", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .interior, name: "Climate Control", description: "Test AC and heating", status: .pending, notes: nil, photoIds: nil),

            // Tires
            InspectionItem(id: UUID().uuidString, category: .tires, name: "Tire Pressure", description: "Check all tire pressures", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .tires, name: "Tire Tread", description: "Measure tread depth", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .tires, name: "Spare Tire", description: "Check spare tire condition", status: .pending, notes: nil, photoIds: nil),

            // Lights
            InspectionItem(id: UUID().uuidString, category: .lights, name: "Headlights", description: "Test high and low beams", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .lights, name: "Tail Lights", description: "Test brake and tail lights", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .lights, name: "Turn Signals", description: "Test all turn signals", status: .pending, notes: nil, photoIds: nil),

            // Fluids
            InspectionItem(id: UUID().uuidString, category: .fluids, name: "Engine Oil", description: "Check oil level and condition", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .fluids, name: "Coolant", description: "Check coolant level", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .fluids, name: "Brake Fluid", description: "Check brake fluid level", status: .pending, notes: nil, photoIds: nil),

            // Safety
            InspectionItem(id: UUID().uuidString, category: .safety, name: "Seat Belts", description: "Test all seat belts", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .safety, name: "Airbags", description: "Check airbag indicators", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .safety, name: "Fire Extinguisher", description: "Check fire extinguisher presence and expiry", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .safety, name: "Emergency Kit", description: "Verify emergency kit contents", status: .pending, notes: nil, photoIds: nil),

            // Engine
            InspectionItem(id: UUID().uuidString, category: .engine, name: "Engine Sound", description: "Listen for unusual noises", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .engine, name: "Battery", description: "Check battery terminals and charge", status: .pending, notes: nil, photoIds: nil),

            // Brakes
            InspectionItem(id: UUID().uuidString, category: .brakes, name: "Brake Performance", description: "Test brake responsiveness", status: .pending, notes: nil, photoIds: nil),
            InspectionItem(id: UUID().uuidString, category: .brakes, name: "Parking Brake", description: "Test parking brake", status: .pending, notes: nil, photoIds: nil),
        ]
    }

    // MARK: - Update Inspection Item
    func updateInspectionItem(itemId: String, status: InspectionItemStatus, notes: String? = nil) {
        if let index = inspectionItems.firstIndex(where: { $0.id == itemId }) {
            var item = inspectionItems[index]
            item.status = status
            if let notes = notes {
                item.notes = notes
            }
            inspectionItems[index] = item

            // Update current inspection
            if var inspection = currentInspection {
                inspection.items = inspectionItems
                currentInspection = inspection
            }
        }
    }

    // MARK: - Photo Management
    func addPhoto(_ imageData: Data, category: InspectionCategory, notes: String? = nil) {
        let photo = InspectionPhoto(
            id: UUID().uuidString,
            imageData: imageData,
            category: category,
            timestamp: Date(),
            notes: notes
        )

        inspectionPhotos.append(photo)

        // Save to disk
        _ = persistenceManager.saveInspectionPhoto(photo)

        // Update current inspection
        if var inspection = currentInspection {
            inspection.photos = inspectionPhotos
            currentInspection = inspection
        }
    }

    func deletePhoto(photoId: String) {
        inspectionPhotos.removeAll { $0.id == photoId }
        persistenceManager.deleteInspectionPhoto(photoId)

        if var inspection = currentInspection {
            inspection.photos = inspectionPhotos
            currentInspection = inspection
        }
    }

    // MARK: - Complete Inspection
    func completeInspection(signature: String? = nil, notes: String? = nil) {
        guard var inspection = currentInspection else { return }

        let hasFailures = inspectionItems.contains { $0.status == .failed }
        inspection.status = hasFailures ? .failed : .completed
        inspection.signature = signature
        inspection.notes = notes
        inspection.items = inspectionItems
        inspection.photos = inspectionPhotos

        currentInspection = inspection
        Task {
            try? await persistenceManager.cacheInspection(inspection)
        }
    }

    // MARK: - Category Progress
    func getProgress(for category: InspectionCategory) -> Double {
        let categoryItems = inspectionItems.filter { $0.category == category }
        guard !categoryItems.isEmpty else { return 0 }

        let completedItems = categoryItems.filter { $0.status != .pending }.count
        return Double(completedItems) / Double(categoryItems.count)
    }

    func getCategoryItems(for category: InspectionCategory) -> [InspectionItem] {
        inspectionItems.filter { $0.category == category }
    }
}
