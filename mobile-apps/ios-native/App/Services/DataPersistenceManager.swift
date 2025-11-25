import Foundation
import Combine

// MARK: - Data Persistence Manager
class DataPersistenceManager: ObservableObject {
    static let shared = DataPersistenceManager()

    private let userDefaults = UserDefaults.standard
    private let fileManager = FileManager.default

    // MARK: - Storage Keys
    private enum StorageKeys {
        static let vehicles = "cached_vehicles"
        static let trips = "cached_trips"
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
    func cacheVehicles(_ vehicles: [Vehicle]) {
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

    func getCachedVehicles() -> [Vehicle]? {
        guard let data = userDefaults.data(forKey: StorageKeys.vehicles) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let vehicles = try decoder.decode([Vehicle].self, from: data)
            return vehicles
        } catch {
            print("Error decoding cached vehicles: \(error.localizedDescription)")
            return nil
        }
    }

    func cacheVehicle(_ vehicle: Vehicle) {
        var vehicles = getCachedVehicles() ?? []

        // Update existing vehicle or add new one
        if let index = vehicles.firstIndex(where: { $0.id == vehicle.id }) {
            vehicles[index] = vehicle
        } else {
            vehicles.append(vehicle)
        }

        cacheVehicles(vehicles)
    }

    // MARK: - Trip Caching
    func cacheTrips(_ trips: [Trip]) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(trips)
            userDefaults.set(data, forKey: StorageKeys.trips)
            updateLastSyncDate()
        } catch {
            print("Error caching trips: \(error.localizedDescription)")
        }
    }

    func getCachedTrips() -> [Trip]? {
        guard let data = userDefaults.data(forKey: StorageKeys.trips) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let trips = try decoder.decode([Trip].self, from: data)
            return trips
        } catch {
            print("Error decoding cached trips: \(error.localizedDescription)")
            return nil
        }
    }

    func cacheTrip(_ trip: Trip) {
        var trips = getCachedTrips() ?? []

        // Update existing trip or add new one
        if let index = trips.firstIndex(where: { $0.id == trip.id }) {
            trips[index] = trip
        } else {
            trips.append(trip)
        }

        cacheTrips(trips)
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
        userDefaults.removeObject(forKey: StorageKeys.trips)
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

    func clearTripCache() {
        userDefaults.removeObject(forKey: StorageKeys.trips)
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
        if let tripsData = userDefaults.data(forKey: StorageKeys.trips) {
            totalSize += Int64(tripsData.count)
        }
        if let inspectionsData = userDefaults.data(forKey: StorageKeys.inspections) {
            totalSize += Int64(inspectionsData.count)
        }

        return ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file)
    }
}
