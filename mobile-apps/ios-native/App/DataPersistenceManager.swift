import Foundation
import Combine
import CoreData

// MARK: - Export Format
public enum ExportFormat {
    case gpx
    case csv
    case json
}

// MARK: - Data Persistence Manager
class DataPersistenceManager: ObservableObject {
    static let shared = DataPersistenceManager()

    private let userDefaults = UserDefaults.standard
    private let fileManager = FileManager.default

    // MARK: - Core Data (Stub)
    lazy var viewContext: NSManagedObjectContext = {
        // Stub implementation - create an in-memory context
        let container = NSPersistentContainer(name: "FleetManager")
        container.loadPersistentStores { _, error in
            if let error = error {
                print("Core Data error (stub): \(error)")
            }
        }
        return container.viewContext
    }()

    func save() throws {
        if viewContext.hasChanges {
            try viewContext.save()
        }
    }

    func delete(_ object: NSManagedObject) throws {
        viewContext.delete(object)
        try save()
    }

    func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
        // Stub implementation
        viewContext.perform {
            block(self.viewContext)
        }
    }

    // MARK: - Storage Keys
    private enum StorageKeys {
        static let vehicles = "cached_vehicles"
        static let inspections = "cached_inspections"
        static let lastSyncDate = "last_sync_date"
        static let offlineMode = "offline_mode"
    }

    // MARK: - Published Properties
    @Published var isOfflineMode: Bool = false
    @Published var lastSyncDate: Date?

    private init() {
        loadSettings()
    }

    // MARK: - Settings Management
    private func loadSettings() {
        isOfflineMode = userDefaults.bool(forKey: StorageKeys.offlineMode)
        if let timestamp = userDefaults.object(forKey: StorageKeys.lastSyncDate) as? Date {
            lastSyncDate = timestamp
        }
    }

    func enableOfflineMode(_ enabled: Bool) {
        isOfflineMode = enabled
        userDefaults.set(enabled, forKey: StorageKeys.offlineMode)
    }

    func updateLastSyncDate() {
        let now = Date()
        lastSyncDate = now
        userDefaults.set(now, forKey: StorageKeys.lastSyncDate)
    }

    // MARK: - Vehicle Caching
    // Note: Using the Vehicle type from Models/Vehicle.swift
    func cacheVehicles<T: Codable & Identifiable>(_ vehicles: [T]) where T.ID == String {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(vehicles)
            userDefaults.set(data, forKey: StorageKeys.vehicles)
            updateLastSyncDate()
        } catch {
            print("Error caching vehicles: \(error.localizedDescription)")
        }
    }

    func getCachedVehicles<T: Codable>() -> [T]? {
        guard let data = userDefaults.data(forKey: StorageKeys.vehicles) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let vehicles = try decoder.decode([T].self, from: data)
            return vehicles
        } catch {
            print("Error decoding cached vehicles: \(error.localizedDescription)")
            return nil
        }
    }

    func cacheVehicle<T: Codable & Identifiable>(_ vehicle: T) where T.ID == String {
        var vehicles: [T] = getCachedVehicles() ?? []

        // Update existing vehicle or add new one
        if let index = vehicles.firstIndex(where: { $0.id == vehicle.id }) {
            vehicles[index] = vehicle
        } else {
            vehicles.append(vehicle)
        }

        cacheVehicles(vehicles)
    }

    // MARK: - Inspection Caching
    func cacheInspections(_ inspections: [VehicleInspection]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(inspections)
            userDefaults.set(data, forKey: StorageKeys.inspections)
        } catch {
            print("Error caching inspections: \(error.localizedDescription)")
        }
    }

    func getCachedInspections() -> [VehicleInspection]? {
        guard let data = userDefaults.data(forKey: StorageKeys.inspections) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let inspections = try decoder.decode([VehicleInspection].self, from: data)
            return inspections
        } catch {
            print("Error decoding cached inspections: \(error.localizedDescription)")
            return nil
        }
    }

    func cacheInspection(_ inspection: VehicleInspection) {
        var inspections = getCachedInspections() ?? []

        if let index = inspections.firstIndex(where: { $0.id == inspection.id }) {
            inspections[index] = inspection
        } else {
            inspections.append(inspection)
        }

        cacheInspections(inspections)
    }

    func getInspectionsForVehicle(_ vehicleId: String) -> [VehicleInspection] {
        guard let inspections = getCachedInspections() else {
            return []
        }

        return inspections.filter { $0.vehicleId == vehicleId }
    }

    // MARK: - File Storage for Images
    private func getDocumentsDirectory() -> URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }

    func saveInspectionPhoto(_ photo: InspectionPhoto) -> Bool {
        let filename = "\(photo.id).jpg"
        let fileURL = getDocumentsDirectory().appendingPathComponent(filename)

        do {
            try photo.imageData.write(to: fileURL)
            return true
        } catch {
            print("Error saving inspection photo: \(error.localizedDescription)")
            return false
        }
    }

    func loadInspectionPhoto(_ photoId: String) -> Data? {
        let filename = "\(photoId).jpg"
        let fileURL = getDocumentsDirectory().appendingPathComponent(filename)

        return try? Data(contentsOf: fileURL)
    }

    func deleteInspectionPhoto(_ photoId: String) {
        let filename = "\(photoId).jpg"
        let fileURL = getDocumentsDirectory().appendingPathComponent(filename)

        try? fileManager.removeItem(at: fileURL)
    }

    // MARK: - Clear Cache
    func clearAllCache() {
        userDefaults.removeObject(forKey: StorageKeys.vehicles)
        userDefaults.removeObject(forKey: StorageKeys.inspections)
        userDefaults.removeObject(forKey: StorageKeys.lastSyncDate)

        // Clear all inspection photos
        let documentsURL = getDocumentsDirectory()
        if let files = try? fileManager.contentsOfDirectory(at: documentsURL, includingPropertiesForKeys: nil) {
            for file in files where file.pathExtension == "jpg" {
                try? fileManager.removeItem(at: file)
            }
        }

        lastSyncDate = nil
    }

    func clearVehicleCache() {
        userDefaults.removeObject(forKey: StorageKeys.vehicles)
    }

    func clearInspectionCache() {
        userDefaults.removeObject(forKey: StorageKeys.inspections)
    }

    // MARK: - Sync Status
    func needsSync() -> Bool {
        guard let lastSync = lastSyncDate else { return true }

        let hoursSinceLastSync = Date().timeIntervalSince(lastSync) / 3600
        return hoursSinceLastSync > 24 // Sync if more than 24 hours
    }

    func getCacheSize() -> String {
        let documentsURL = getDocumentsDirectory()
        var totalSize: Int64 = 0

        if let files = try? fileManager.contentsOfDirectory(at: documentsURL, includingPropertiesForKeys: [.fileSizeKey]) {
            for file in files {
                if let fileSize = try? file.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        }

        // Add UserDefaults data size estimate
        if let vehiclesData = userDefaults.data(forKey: StorageKeys.vehicles) {
            totalSize += Int64(vehiclesData.count)
        }
        if let inspectionsData = userDefaults.data(forKey: StorageKeys.inspections) {
            totalSize += Int64(inspectionsData.count)
        }

        return ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file)
    }

    // MARK: - Inspection Photo Methods (Stubs)
    func saveInspectionPhoto(_ photo: InspectionPhoto, for vehicleId: String) -> String {
        // Stub implementation - return mock photo ID
        return "photo_\(UUID().uuidString)"
    }

    func deleteInspectionPhoto(_ photoId: String) async throws {
        // Stub implementation
        print("DataPersistenceManager: deleteInspectionPhoto called (stub)")
    }

    func cacheInspection(_ inspection: VehicleInspection) async throws {
        // Stub implementation
        print("DataPersistenceManager: cacheInspection called (stub)")
    }

    // MARK: - Fleet Metrics Methods (Stubs)
    func loadFleetMetrics() -> FleetMetrics? {
        // Stub implementation - return nil for now
        return nil
    }

    func saveFleetMetrics(_ metrics: FleetMetrics) {
        // Stub implementation
        print("DataPersistenceManager: saveFleetMetrics called (stub)")
    }

    func getLastSyncTime() -> Date? {
        // Stub implementation - return nil for now
        return nil
    }

    func isCacheValid() -> Bool {
        // Stub implementation - always return false for now
        return false
    }

    func clearCache() {
        // Stub implementation
        print("DataPersistenceManager: clearCache called (stub)")
    }

    // MARK: - Trip Export Methods (Stubs)
    func exportTrip(_ trip: Trip, format: ExportFormat) throws -> URL {
        // Stub implementation - create a temporary file
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "trip_\(trip.id).\(format == .gpx ? "gpx" : format == .csv ? "csv" : "json")"
        let fileURL = tempDir.appendingPathComponent(fileName)

        // Create empty file for stub
        try "Stub export data".write(to: fileURL, atomically: true, encoding: .utf8)

        print("DataPersistenceManager: exportTrip called (stub) - created \(fileURL)")
        return fileURL
    }

    // MARK: - Trip Management Methods (Stubs)
    func getAllTrips() -> [Trip] {
        // Stub implementation - return empty array
        return []
    }

    func deleteTrip(_ trip: Trip) {
        // Stub implementation
        print("DataPersistenceManager: deleteTrip called (stub)")
    }

    func getTripStatistics() -> TripStatistics? {
        // Stub implementation - return nil
        return nil
    }

    func getActiveTrip() -> Trip? {
        // Stub implementation - return nil for now
        return nil
    }

    func saveTrip(_ trip: Trip) throws {
        // Stub implementation
        print("DataPersistenceManager: saveTrip called (stub)")
    }

    func clearActiveTrip() {
        // Stub implementation
        print("DataPersistenceManager: clearActiveTrip called (stub)")
    }

    func saveActiveTrip(_ trip: Trip) throws {
        // Stub implementation
        print("DataPersistenceManager: saveActiveTrip called (stub)")
    }

    func getTripSettings() -> TripSettings {
        // Stub implementation - return default settings
        return TripSettings.default
    }
}
