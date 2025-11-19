import Foundation
import CoreData
import Combine

/**
 * Sync Engine
 *
 * Comprehensive offline-first synchronization with:
 * - Bidirectional sync (upload pending changes, download server updates)
 * - Conflict detection and resolution
 * - Incremental sync using timestamps
 * - Retry logic for failed operations
 * - Queue management for offline operations
 */

class SyncEngine: ObservableObject {
    static let shared = SyncEngine()

    @Published var isSyncing = false
    @Published var lastSyncTime: Date?
    @Published var syncProgress: Double = 0.0
    @Published var syncError: String?
    @Published var pendingOperations: Int = 0

    private let apiClient = APIClient.shared
    private let coreData = CoreDataStack.shared
    private var cancellables = Set<AnyCancellable>()

    private let deviceId: String

    private init() {
        // Generate or retrieve device ID
        if let savedDeviceId = UserDefaults.standard.string(forKey: "deviceId") {
            self.deviceId = savedDeviceId
        } else {
            self.deviceId = UUID().uuidString
            UserDefaults.standard.set(self.deviceId, forKey: "deviceId")
        }

        loadLastSyncTime()
        updatePendingOperationsCount()
    }

    // MARK: - Main Sync

    func performSync() {
        guard !isSyncing else {
            print("⏭️ Sync already in progress")
            return
        }

        isSyncing = true
        syncProgress = 0.0
        syncError = nil

        print("🔄 Starting sync...")

        // Step 1: Upload pending changes (0-40%)
        uploadPendingChanges()
            .flatMap { _ -> AnyPublisher<SyncResponse, APIError> in
                self.syncProgress = 0.4
                // Step 2: Download server updates (40-80%)
                return self.downloadServerUpdates()
            }
            .flatMap { syncResponse -> AnyPublisher<Void, APIError> in
                self.syncProgress = 0.8
                // Step 3: Resolve conflicts (80-100%)
                return self.resolveConflicts(syncResponse.conflicts ?? [])
            }
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isSyncing = false

                    switch completion {
                    case .finished:
                        self?.syncProgress = 1.0
                        self?.lastSyncTime = Date()
                        self?.saveLastSyncTime()
                        self?.updatePendingOperationsCount()
                        print("✅ Sync completed successfully")

                    case .failure(let error):
                        self?.syncError = error.localizedDescription
                        print("❌ Sync failed: \(error.localizedDescription)")
                    }
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }

    // MARK: - Upload Pending Changes

    private func uploadPendingChanges() -> AnyPublisher<Void, APIError> {
        return Future<Void, APIError> { promise in
            self.coreData.performBackgroundTask { context in
                // Fetch all items needing sync
                let syncRequest = SyncQueueItem.fetchRequest()
                syncRequest.predicate = NSPredicate(format: "status == %@", "pending")
                syncRequest.sortDescriptors = [NSSortDescriptor(key: "priority", ascending: false)]

                do {
                    let items = try context.fetch(syncRequest)

                    if items.isEmpty {
                        print("📤 No pending changes to upload")
                        promise(.success(()))
                        return
                    }

                    print("📤 Uploading \(items.count) pending changes")

                    // Process items sequentially
                    self.processQueueItems(items, context: context) { result in
                        switch result {
                        case .success:
                            promise(.success(()))
                        case .failure(let error):
                            promise(.failure(error))
                        }
                    }

                } catch {
                    promise(.failure(.networkError(error)))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    private func processQueueItems(
        _ items: [SyncQueueItem],
        context: NSManagedObjectContext,
        completion: @escaping (Result<Void, APIError>) -> Void
    ) {
        var index = 0

        func processNext() {
            guard index < items.count else {
                completion(.success(()))
                return
            }

            let item = items[index]
            index += 1

            processQueueItem(item, context: context) { result in
                switch result {
                case .success:
                    processNext()
                case .failure(let error):
                    // Continue processing even if one fails
                    print("⚠️ Failed to process item: \(error.localizedDescription)")
                    processNext()
                }
            }
        }

        processNext()
    }

    private func processQueueItem(
        _ item: SyncQueueItem,
        context: NSManagedObjectContext,
        completion: @escaping (Result<Void, APIError>) -> Void
    ) {
        guard let entityType = item.entityType,
              let operation = item.operation,
              let payload = item.payload else {
            completion(.failure(.noData))
            return
        }

        let endpoint = getEndpoint(for: entityType, operation: operation, entityId: item.entityId)

        // Update status to processing
        item.status = "processing"
        try? context.save()

        // Send request based on operation
        let publisher: AnyPublisher<EmptyResponse, APIError>

        switch operation {
        case "create":
            publisher = apiClient.post(endpoint, body: payload.data(using: .utf8) ?? Data())
        case "update":
            publisher = apiClient.put(endpoint, body: payload.data(using: .utf8) ?? Data())
        case "delete":
            publisher = apiClient.delete(endpoint)
        default:
            completion(.failure(.invalidURL))
            return
        }

        publisher
            .sink(
                receiveCompletion: { pubCompletion in
                    switch pubCompletion {
                    case .finished:
                        // Mark as completed
                        item.status = "completed"
                        item.processedAt = Date()
                        try? context.save()
                        completion(.success(()))

                    case .failure(let error):
                        // Handle retry logic
                        item.retryCount += 1

                        if item.retryCount >= item.maxRetries {
                            item.status = "failed"
                            item.errorMessage = error.localizedDescription
                        } else {
                            item.status = "pending"
                            item.scheduledFor = Date().addingTimeInterval(Double(item.retryCount) * 60)
                        }

                        try? context.save()
                        completion(.failure(error))
                    }
                },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
    }

    private func getEndpoint(for entityType: String, operation: String, entityId: Int64) -> String {
        switch entityType {
        case "inspection":
            return operation == "create" ? "/mobile/inspections" : "/mobile/inspections/\(entityId)"
        case "trip":
            return operation == "create" ? "/mobile/trips" : "/mobile/trips/\(entityId)"
        case "photo":
            return "/mobile/photos/\(entityId)"
        default:
            return "/mobile/\(entityType)/\(entityId)"
        }
    }

    // MARK: - Download Server Updates

    private func downloadServerUpdates() -> AnyPublisher<SyncResponse, APIError> {
        let syncRequest = SyncRequest(
            deviceId: deviceId,
            lastSyncAt: lastSyncTime,
            data: SyncData(
                inspections: nil,
                reports: nil,
                photos: nil,
                hosLogs: nil
            )
        )

        return apiClient.post("/mobile/sync", body: syncRequest)
            .handleEvents(receiveOutput: { [weak self] response in
                self?.applyServerUpdates(response.updates)
            })
            .eraseToAnyPublisher()
    }

    private func applyServerUpdates(_ updates: SyncUpdates) {
        coreData.performBackgroundTask { context in
            // Update vehicles
            if let vehicles = updates.vehicles {
                for vehicleDTO in vehicles {
                    self.upsertVehicle(vehicleDTO, context: context)
                }
            }

            // Update drivers
            if let drivers = updates.drivers {
                for driverDTO in drivers {
                    self.upsertDriver(driverDTO, context: context)
                }
            }

            // Update inspections
            if let inspections = updates.inspections {
                for inspectionDTO in inspections {
                    self.upsertInspection(inspectionDTO, context: context)
                }
            }

            // Update trips
            if let trips = updates.trips {
                for tripDTO in trips {
                    self.upsertTrip(tripDTO, context: context)
                }
            }

            // Update messages
            if let messages = updates.messages {
                for messageDTO in messages {
                    self.upsertMessage(messageDTO, context: context)
                }
            }

            // Save all changes
            do {
                try context.save()
                print("✅ Applied server updates")
            } catch {
                print("❌ Failed to save updates: \(error)")
            }
        }
    }

    // MARK: - Conflict Resolution

    private func resolveConflicts(_ conflicts: [ConflictDTO]) -> AnyPublisher<Void, APIError> {
        return Future<Void, APIError> { promise in
            if conflicts.isEmpty {
                promise(.success(()))
                return
            }

            print("⚠️ Resolving \(conflicts.count) conflicts")

            self.coreData.performBackgroundTask { context in
                for conflict in conflicts {
                    self.resolveConflict(conflict, context: context)
                }

                do {
                    try context.save()
                    promise(.success(()))
                } catch {
                    promise(.failure(.networkError(error)))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    private func resolveConflict(_ conflict: ConflictDTO, context: NSManagedObjectContext) {
        // Create conflict record for user review
        let conflictRecord = ConflictRecord(context: context)
        conflictRecord.id = UUID()
        conflictRecord.entityType = conflict.entityType
        conflictRecord.entityId = conflict.entityId
        conflictRecord.localVersion = conflict.localVersion
        conflictRecord.remoteVersion = conflict.remoteVersion
        conflictRecord.conflictType = conflict.conflictType
        conflictRecord.detectedAt = conflict.detectedAt
        conflictRecord.isResolved = false

        // Auto-resolve simple conflicts
        if conflict.conflictType == "timestamp" {
            // Use last-write-wins strategy
            let localData = try? JSONDecoder().decode([String: Any].self, from: conflict.localVersion.data(using: .utf8)!)
            let remoteData = try? JSONDecoder().decode([String: Any].self, from: conflict.remoteVersion.data(using: .utf8)!)

            // Compare modification timestamps if available
            // For now, prefer remote version (server is source of truth)
            conflictRecord.resolution = "use_remote"
            conflictRecord.isResolved = true
            conflictRecord.resolvedAt = Date()

            // Apply remote version
            applyConflictResolution(conflict, resolution: "use_remote", context: context)
        }
    }

    private func applyConflictResolution(
        _ conflict: ConflictDTO,
        resolution: String,
        context: NSManagedObjectContext
    ) {
        // Apply the resolved version based on resolution strategy
        switch resolution {
        case "use_remote":
            // Parse and apply remote version
            if let remoteData = conflict.remoteVersion.data(using: .utf8) {
                switch conflict.entityType {
                case "vehicle":
                    if let vehicleDTO = try? JSONDecoder().decode(VehicleDTO.self, from: remoteData) {
                        upsertVehicle(vehicleDTO, context: context)
                    }
                case "inspection":
                    if let inspectionDTO = try? JSONDecoder().decode(InspectionDTO.self, from: remoteData) {
                        upsertInspection(inspectionDTO, context: context)
                    }
                default:
                    break
                }
            }
        case "use_local":
            // Local version is already in place, just mark as resolved
            break
        default:
            break
        }
    }

    // MARK: - Upsert Methods

    private func upsertVehicle(_ dto: VehicleDTO, context: NSManagedObjectContext) {
        let fetchRequest = Vehicle.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", dto.id)

        let vehicle: Vehicle
        if let existing = try? context.fetch(fetchRequest).first {
            vehicle = existing
        } else {
            vehicle = Vehicle(context: context)
            vehicle.id = Int64(dto.id)
        }

        vehicle.tenantId = Int64(dto.tenantId)
        vehicle.vin = dto.vin
        vehicle.make = dto.make
        vehicle.model = dto.model
        vehicle.year = Int32(dto.year ?? 0)
        vehicle.licensePlate = dto.licensePlate
        vehicle.status = dto.status
        vehicle.mileage = dto.mileage ?? 0
        vehicle.fuelLevel = dto.fuelLevel ?? 0
        vehicle.latitude = dto.latitude ?? 0
        vehicle.longitude = dto.longitude ?? 0
        vehicle.modifiedAt = dto.modifiedAt
        vehicle.lastSyncAt = Date()
        vehicle.needsSync = false
    }

    private func upsertDriver(_ dto: DriverDTO, context: NSManagedObjectContext) {
        let fetchRequest = Driver.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", dto.id)

        let driver: Driver
        if let existing = try? context.fetch(fetchRequest).first {
            driver = existing
        } else {
            driver = Driver(context: context)
            driver.id = Int64(dto.id)
        }

        driver.tenantId = Int64(dto.tenantId)
        driver.firstName = dto.firstName
        driver.lastName = dto.lastName
        driver.email = dto.email
        driver.phone = dto.phone
        driver.licenseNumber = dto.licenseNumber
        driver.licenseExpiryDate = dto.licenseExpiryDate
        driver.status = dto.status
        driver.modifiedAt = dto.modifiedAt
        driver.lastSyncAt = Date()
        driver.needsSync = false
    }

    private func upsertInspection(_ dto: InspectionDTO, context: NSManagedObjectContext) {
        guard let id = dto.id else { return }

        let fetchRequest = Inspection.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", id)

        let inspection: Inspection
        if let existing = try? context.fetch(fetchRequest).first {
            inspection = existing
        } else {
            inspection = Inspection(context: context)
            inspection.id = Int64(id)
        }

        inspection.tenantId = Int64(dto.tenantId)
        inspection.vehicleId = Int64(dto.vehicleId)
        inspection.driverId = Int64(dto.driverId)
        inspection.inspectionType = dto.inspectionType
        inspection.status = dto.status
        inspection.notes = dto.notes
        inspection.odometerReading = dto.odometerReading
        inspection.latitude = dto.latitude ?? 0
        inspection.longitude = dto.longitude ?? 0
        inspection.inspectedAt = dto.inspectedAt
        inspection.modifiedAt = dto.modifiedAt
        inspection.lastSyncAt = Date()
        inspection.needsSync = false

        // Handle defects as JSON
        if let defects = dto.defects,
           let defectsData = try? JSONEncoder().encode(defects),
           let defectsString = String(data: defectsData, encoding: .utf8) {
            inspection.defects = defectsString
        }
    }

    private func upsertTrip(_ dto: TripDTO, context: NSManagedObjectContext) {
        guard let id = dto.id else { return }

        let fetchRequest = Trip.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", id)

        let trip: Trip
        if let existing = try? context.fetch(fetchRequest).first {
            trip = existing
        } else {
            trip = Trip(context: context)
            trip.id = Int64(id)
        }

        trip.tenantId = Int64(dto.tenantId)
        trip.vehicleId = Int64(dto.vehicleId)
        trip.driverId = Int64(dto.driverId)
        trip.startOdometer = dto.startOdometer
        trip.endOdometer = dto.endOdometer ?? 0
        trip.startLatitude = dto.startLatitude
        trip.startLongitude = dto.startLongitude
        trip.endLatitude = dto.endLatitude ?? 0
        trip.endLongitude = dto.endLongitude ?? 0
        trip.startTime = dto.startTime
        trip.endTime = dto.endTime
        trip.purpose = dto.purpose
        trip.distance = dto.distance ?? 0
        trip.duration = Int64(dto.duration ?? 0)
        trip.modifiedAt = dto.modifiedAt
        trip.lastSyncAt = Date()
        trip.needsSync = false

        // Handle route as JSON
        if let route = dto.route,
           let routeData = try? JSONEncoder().encode(route),
           let routeString = String(data: routeData, encoding: .utf8) {
            trip.route = routeString
        }
    }

    private func upsertMessage(_ dto: MessageDTO, context: NSManagedObjectContext) {
        let fetchRequest = DispatchMessage.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", dto.id)

        let message: DispatchMessage
        if let existing = try? context.fetch(fetchRequest).first {
            message = existing
        } else {
            message = DispatchMessage(context: context)
            message.id = Int64(dto.id)
        }

        message.tenantId = Int64(dto.tenantId)
        message.channelId = Int64(dto.channelId)
        message.senderId = Int64(dto.senderId)
        message.senderName = dto.senderName
        message.messageText = dto.messageText
        message.messageType = dto.messageType
        message.priority = dto.priority
        message.sentAt = dto.sentAt
        message.receivedAt = Date()
        message.lastSyncAt = Date()
    }

    // MARK: - Helper Methods

    private func loadLastSyncTime() {
        if let timestamp = UserDefaults.standard.object(forKey: "lastSyncTime") as? Date {
            self.lastSyncTime = timestamp
        }
    }

    private func saveLastSyncTime() {
        if let time = lastSyncTime {
            UserDefaults.standard.set(time, forKey: "lastSyncTime")
        }
    }

    private func updatePendingOperationsCount() {
        coreData.performBackgroundTask { context in
            let request = SyncQueueItem.fetchRequest()
            request.predicate = NSPredicate(format: "status == %@", "pending")

            if let count = try? context.count(for: request) {
                DispatchQueue.main.async {
                    self.pendingOperations = count
                }
            }
        }
    }

    // MARK: - Queue Management

    func queueOperation(
        entityType: String,
        entityId: Int64,
        operation: String,
        payload: [String: Any],
        priority: Int16 = 1
    ) {
        coreData.performBackgroundTask { context in
            let item = SyncQueueItem(context: context)
            item.id = UUID()
            item.entityType = entityType
            item.entityId = entityId
            item.operation = operation
            item.priority = priority
            item.status = "pending"
            item.retryCount = 0
            item.maxRetries = 3
            item.createdAt = Date()

            if let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let payloadString = String(data: payloadData, encoding: .utf8) {
                item.payload = payloadString
            }

            do {
                try context.save()
                self.updatePendingOperationsCount()
                print("📝 Queued \(operation) operation for \(entityType) #\(entityId)")
            } catch {
                print("❌ Failed to queue operation: \(error)")
            }
        }
    }
}
