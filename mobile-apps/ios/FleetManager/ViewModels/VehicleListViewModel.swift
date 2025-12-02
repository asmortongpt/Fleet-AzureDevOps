import Foundation
import CoreData
import Combine

/**
 * Vehicle List ViewModel
 *
 * Manages vehicle list display with:
 * - Core Data integration
 * - Real-time sync status
 * - Search and filtering
 * - Pull-to-refresh
 */

class VehicleListViewModel: NSObject, ObservableObject {
    @Published var vehicles: [Vehicle] = []
    @Published var filteredVehicles: [Vehicle] = []
    @Published var searchText: String = "" {
        didSet {
            filterVehicles()
        }
    }
    @Published var selectedStatus: String? = nil {
        didSet {
            filterVehicles()
        }
    }
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let coreData = CoreDataStack.shared
    private let syncEngine = SyncEngine.shared
    private var fetchedResultsController: NSFetchedResultsController<Vehicle>?
    private var cancellables = Set<AnyCancellable>()

    override init() {
        super.init()
        setupFetchedResultsController()
        observeSyncStatus()
    }

    // MARK: - Core Data Setup

    private func setupFetchedResultsController() {
        let fetchRequest = Vehicle.fetchRequest()
        fetchRequest.sortDescriptors = [
            NSSortDescriptor(key: "status", ascending: true),
            NSSortDescriptor(key: "make", ascending: true),
            NSSortDescriptor(key: "model", ascending: true)
        ]

        fetchedResultsController = NSFetchedResultsController(
            fetchRequest: fetchRequest,
            managedObjectContext: coreData.viewContext,
            sectionNameKeyPath: "status",
            cacheName: nil
        )

        fetchedResultsController?.delegate = self

        do {
            try fetchedResultsController?.performFetch()
            updateVehicles()
        } catch {
            errorMessage = "Failed to fetch vehicles: \(error.localizedDescription)"
        }
    }

    private func updateVehicles() {
        vehicles = fetchedResultsController?.fetchedObjects ?? []
        filterVehicles()
    }

    // MARK: - Filtering

    private func filterVehicles() {
        var results = vehicles

        // Filter by search text
        if !searchText.isEmpty {
            results = results.filter { vehicle in
                let searchFields = [
                    vehicle.make,
                    vehicle.model,
                    vehicle.licensePlate,
                    vehicle.vin
                ].compactMap { $0?.lowercased() }

                return searchFields.contains { $0.contains(searchText.lowercased()) }
            }
        }

        // Filter by status
        if let status = selectedStatus {
            results = results.filter { $0.status == status }
        }

        filteredVehicles = results
    }

    // MARK: - Actions

    func refresh() {
        isLoading = true
        errorMessage = nil

        syncEngine.performSync()

        // Observe sync completion
        syncEngine.$isSyncing
            .sink { [weak self] isSyncing in
                if !isSyncing {
                    self?.isLoading = false
                }
            }
            .store(in: &cancellables)
    }

    func deleteVehicle(_ vehicle: Vehicle) {
        coreData.viewContext.delete(vehicle)

        do {
            try coreData.viewContext.save()

            // Queue deletion for sync
            syncEngine.queueOperation(
                entityType: "vehicle",
                entityId: vehicle.id,
                operation: "delete",
                payload: [:],
                priority: 1
            )
        } catch {
            errorMessage = "Failed to delete vehicle: \(error.localizedDescription)"
        }
    }

    // MARK: - Sync Status

    private func observeSyncStatus() {
        syncEngine.$isSyncing
            .sink { [weak self] isSyncing in
                self?.isLoading = isSyncing
            }
            .store(in: &cancellables)

        syncEngine.$syncError
            .sink { [weak self] error in
                self?.errorMessage = error
            }
            .store(in: &cancellables)
    }

    // MARK: - Computed Properties

    var statusOptions: [String] {
        let statuses = vehicles.compactMap { $0.status }
        return Array(Set(statuses)).sorted()
    }

    var activeVehiclesCount: Int {
        vehicles.filter { $0.status == "active" }.count
    }

    var maintenanceVehiclesCount: Int {
        vehicles.filter { $0.status == "maintenance" }.count
    }
}

// MARK: - NSFetchedResultsControllerDelegate

extension VehicleListViewModel: NSFetchedResultsControllerDelegate {
    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        updateVehicles()
    }
}
