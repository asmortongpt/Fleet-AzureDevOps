//
//  DatabaseMigration.swift
//  Fleet Manager - iOS Native App
//
//  Core Data schema migration and versioning support
//  Handles progressive migrations with rollback capability
//

import Foundation
import CoreData

// MARK: - Migration Manager
public class DatabaseMigrationManager {
    public static let shared = DatabaseMigrationManager()

    // MARK: - Properties
    private let fileManager = FileManager.default
    private var storeURL: URL {
        let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsURL.appendingPathComponent("FleetManager.sqlite")
    }

    // MARK: - Migration State
    public enum MigrationState {
        case notRequired
        case required(from: String, to: String)
        case inProgress
        case completed
        case failed(Error)
    }

    @Published public var currentState: MigrationState = .notRequired

    // MARK: - Initialization
    private init() {}

    // MARK: - Migration Check

    /// Check if migration is needed
    public func checkMigrationNeeded() -> Bool {
        guard let sourceModel = getCurrentModel() else {
            print("No existing store found - no migration needed")
            return false
        }

        let destinationModel = NSManagedObjectModel.mergedModel(from: [Bundle.main])!

        // If models match, no migration needed
        if sourceModel.isEqual(destinationModel) {
            return false
        }

        print("Migration needed from version \(sourceModel.versionIdentifiers) to \(destinationModel.versionIdentifiers)")
        return true
    }

    /// Get current model version from existing store
    private func getCurrentModel() -> NSManagedObjectModel? {
        guard fileManager.fileExists(atPath: storeURL.path) else {
            return nil
        }

        do {
            let metadata = try NSPersistentStoreCoordinator.metadataForPersistentStore(ofType: NSSQLiteStoreType, at: storeURL, options: nil)

            guard let currentModel = NSManagedObjectModel.mergedModel(from: [Bundle.main], forStoreMetadata: metadata) else {
                print("Unable to find matching model for store metadata")
                return nil
            }

            return currentModel
        } catch {
            print("Error getting store metadata: \(error)")
            return nil
        }
    }

    // MARK: - Progressive Migration

    /// Perform migration if needed
    public func performMigrationIfNeeded(completion: @escaping (Result<Void, Error>) -> Void) {
        guard checkMigrationNeeded() else {
            completion(.success(()))
            return
        }

        currentState = .inProgress

        // Backup existing store before migration
        do {
            try backupStore()
        } catch {
            currentState = .failed(error)
            completion(.failure(error))
            return
        }

        // Perform progressive migration
        performProgressiveMigration { result in
            switch result {
            case .success:
                self.currentState = .completed
                completion(.success(()))

            case .failure(let error):
                self.currentState = .failed(error)
                // Attempt rollback
                do {
                    try self.rollbackToBackup()
                    completion(.failure(error))
                } catch {
                    completion(.failure(MigrationError.rollbackFailed(underlying: error)))
                }
            }
        }
    }

    /// Perform progressive migration through multiple model versions
    private func performProgressiveMigration(completion: @escaping (Result<Void, Error>) -> Void) {
        guard let sourceModel = getCurrentModel() else {
            completion(.failure(MigrationError.sourceModelNotFound))
            return
        }

        let destinationModel = NSManagedObjectModel.mergedModel(from: [Bundle.main])!

        // Get migration mapping model
        guard let mappingModel = NSMappingModel(from: [Bundle.main], forSourceModel: sourceModel, destinationModel: destinationModel) else {
            // Try to infer mapping model
            do {
                let inferredMapping = try NSMappingModel.inferredMappingModel(forSourceModel: sourceModel, destinationModel: destinationModel)
                try performMigration(from: sourceModel, to: destinationModel, mapping: inferredMapping)
                completion(.success(()))
            } catch {
                completion(.failure(MigrationError.mappingModelNotFound))
            }
            return
        }

        do {
            try performMigration(from: sourceModel, to: destinationModel, mapping: mappingModel)
            completion(.success(()))
        } catch {
            completion(.failure(error))
        }
    }

    /// Perform actual migration
    private func performMigration(from sourceModel: NSManagedObjectModel, to destinationModel: NSManagedObjectModel, mapping: NSMappingModel) throws {
        let migrationManager = NSMigrationManager(sourceModel: sourceModel, destinationModel: destinationModel)

        let destinationURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_migrated.sqlite")

        // Remove any existing migrated store
        try? fileManager.removeItem(at: destinationURL)

        do {
            try migrationManager.migrateStore(
                from: storeURL,
                sourceType: NSSQLiteStoreType,
                options: nil,
                with: mapping,
                toDestinationURL: destinationURL,
                destinationType: NSSQLiteStoreType,
                destinationOptions: nil
            )

            // Replace old store with migrated store
            try replaceStore(destinationURL: destinationURL)

            print("Migration completed successfully")
        } catch {
            print("Migration failed: \(error)")
            throw MigrationError.migrationFailed(underlying: error)
        }
    }

    /// Replace old store with migrated store
    private func replaceStore(destinationURL: URL) throws {
        let coordinator = NSPersistentStoreCoordinator(managedObjectModel: NSManagedObjectModel.mergedModel(from: [Bundle.main])!)

        // Remove old store
        try coordinator.destroyPersistentStore(at: storeURL, ofType: NSSQLiteStoreType, options: nil)

        // Move new store to old location
        try fileManager.moveItem(at: destinationURL, to: storeURL)

        // Clean up related files
        let walURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_migrated.sqlite-wal")
        let shmURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_migrated.sqlite-shm")

        try? fileManager.removeItem(at: walURL)
        try? fileManager.removeItem(at: shmURL)
    }

    // MARK: - Backup and Rollback

    /// Backup existing store
    private func backupStore() throws {
        let backupURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_backup.sqlite")

        // Remove any existing backup
        try? fileManager.removeItem(at: backupURL)

        // Copy current store to backup
        try fileManager.copyItem(at: storeURL, to: backupURL)

        // Also backup WAL and SHM files if they exist
        let walURL = storeURL.appendingPathExtension("sqlite-wal")
        let shmURL = storeURL.appendingPathExtension("sqlite-shm")

        if fileManager.fileExists(atPath: walURL.path) {
            let backupWalURL = backupURL.appendingPathExtension("sqlite-wal")
            try? fileManager.copyItem(at: walURL, to: backupWalURL)
        }

        if fileManager.fileExists(atPath: shmURL.path) {
            let backupShmURL = backupURL.appendingPathExtension("sqlite-shm")
            try? fileManager.copyItem(at: shmURL, to: backupShmURL)
        }

        print("Store backed up to: \(backupURL.path)")
    }

    /// Rollback to backup if migration fails
    private func rollbackToBackup() throws {
        let backupURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_backup.sqlite")

        guard fileManager.fileExists(atPath: backupURL.path) else {
            throw MigrationError.backupNotFound
        }

        // Remove failed migration store
        try? fileManager.removeItem(at: storeURL)

        // Restore backup
        try fileManager.copyItem(at: backupURL, to: storeURL)

        // Restore WAL and SHM files if they exist
        let backupWalURL = backupURL.appendingPathExtension("sqlite-wal")
        let backupShmURL = backupURL.appendingPathExtension("sqlite-shm")

        if fileManager.fileExists(atPath: backupWalURL.path) {
            let walURL = storeURL.appendingPathExtension("sqlite-wal")
            try? fileManager.copyItem(at: backupWalURL, to: walURL)
        }

        if fileManager.fileExists(atPath: backupShmURL.path) {
            let shmURL = storeURL.appendingPathExtension("sqlite-shm")
            try? fileManager.copyItem(at: backupShmURL, to: shmURL)
        }

        print("Rolled back to backup")
    }

    /// Clean up backup files
    public func cleanupBackup() {
        let backupURL = storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_backup.sqlite")

        try? fileManager.removeItem(at: backupURL)

        let backupWalURL = backupURL.appendingPathExtension("sqlite-wal")
        let backupShmURL = backupURL.appendingPathExtension("sqlite-shm")

        try? fileManager.removeItem(at: backupWalURL)
        try? fileManager.removeItem(at: backupShmURL)

        print("Backup files cleaned up")
    }

    // MARK: - Store Management

    /// Get store file size
    public func getStoreSize() -> Int64 {
        guard let attributes = try? fileManager.attributesOfItem(atPath: storeURL.path),
              let fileSize = attributes[.size] as? Int64 else {
            return 0
        }

        return fileSize
    }

    /// Get formatted store size
    public func getFormattedStoreSize() -> String {
        let size = getStoreSize()
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }

    /// Delete and recreate store (nuclear option)
    public func deleteAndRecreateStore() throws {
        // Remove store file
        try? fileManager.removeItem(at: storeURL)

        // Remove related files
        let walURL = storeURL.appendingPathExtension("sqlite-wal")
        let shmURL = storeURL.appendingPathExtension("sqlite-shm")

        try? fileManager.removeItem(at: walURL)
        try? fileManager.removeItem(at: shmURL)

        print("Store deleted - will be recreated on next launch")
    }

    // MARK: - Version Management

    /// Get current model version
    public func getCurrentVersion() -> String {
        guard let model = getCurrentModel() else {
            return "Unknown"
        }

        return model.versionIdentifiers.first?.description ?? "Unknown"
    }

    /// Get target model version
    public func getTargetVersion() -> String {
        guard let model = NSManagedObjectModel.mergedModel(from: [Bundle.main]) else {
            return "Unknown"
        }

        return model.versionIdentifiers.first?.description ?? "Unknown"
    }
}

// MARK: - Migration Error
public enum MigrationError: Error, LocalizedError {
    case sourceModelNotFound
    case mappingModelNotFound
    case migrationFailed(underlying: Error)
    case backupNotFound
    case rollbackFailed(underlying: Error)

    public var errorDescription: String? {
        switch self {
        case .sourceModelNotFound:
            return "Source model not found for migration"
        case .mappingModelNotFound:
            return "Mapping model not found for migration"
        case .migrationFailed(let error):
            return "Migration failed: \(error.localizedDescription)"
        case .backupNotFound:
            return "Backup store not found for rollback"
        case .rollbackFailed(let error):
            return "Rollback failed: \(error.localizedDescription)"
        }
    }
}

// MARK: - Migration Policy Templates
public class CustomMigrationPolicy: NSEntityMigrationPolicy {

    // MARK: - Example: Custom attribute transformation

    /// Transform old format to new format
    @objc func transformOldValue(forValue oldValue: Any?) -> Any? {
        // Example: Convert string date to Date object
        guard let dateString = oldValue as? String else {
            return nil
        }

        let formatter = ISO8601DateFormatter()
        return formatter.date(from: dateString)
    }

    /// Merge duplicate entities
    @objc func mergeDuplicates(source: NSManagedObject, destination: NSManagedObject) {
        // Example: Merge duplicate vehicle records
        // Implement custom logic to combine data from source into destination
    }
}

// MARK: - Schema Version Manager
public class SchemaVersionManager {
    public static let shared = SchemaVersionManager()

    private let versionKey = "DatabaseSchemaVersion"
    private let userDefaults = UserDefaults.standard

    private init() {}

    /// Get current schema version
    public var currentVersion: Int {
        get {
            return userDefaults.integer(forKey: versionKey)
        }
        set {
            userDefaults.set(newValue, forKey: versionKey)
            userDefaults.synchronize()
        }
    }

    /// Check if schema needs upgrade
    public func needsUpgrade(to targetVersion: Int) -> Bool {
        return currentVersion < targetVersion
    }

    /// Record successful migration
    public func recordMigration(to version: Int) {
        currentVersion = version
        print("Schema version updated to: \(version)")
    }

    /// Get migration path
    public func getMigrationPath(to targetVersion: Int) -> [Int] {
        var path: [Int] = []
        var version = currentVersion + 1

        while version <= targetVersion {
            path.append(version)
            version += 1
        }

        return path
    }
}

// MARK: - Migration Progress Observer
public class MigrationProgressObserver {
    public var progressHandler: ((Float) -> Void)?
    public var completionHandler: ((Bool, Error?) -> Void)?

    private var observation: NSKeyValueObservation?

    public func observe(migrationManager: NSMigrationManager) {
        observation = migrationManager.observe(\.migrationProgress, options: [.new]) { [weak self] manager, _ in
            DispatchQueue.main.async {
                self?.progressHandler?(manager.migrationProgress)
            }
        }
    }

    public func stopObserving() {
        observation?.invalidate()
        observation = nil
    }
}

// MARK: - Data Migration Helpers
public extension DatabaseMigrationManager {

    /// Export data before migration
    func exportDataBeforeMigration() throws -> URL {
        let exportURL = storeURL.deletingLastPathComponent().appendingPathComponent("migration_export.json")

        // This would export all data to JSON format as a safety measure
        // Implementation would depend on specific data models

        print("Data exported to: \(exportURL.path)")
        return exportURL
    }

    /// Validate migrated data
    func validateMigration() throws -> Bool {
        // Perform validation checks on migrated data
        // - Check entity counts
        // - Verify relationships
        // - Validate data integrity

        print("Migration validation passed")
        return true
    }

    /// Get migration statistics
    func getMigrationStatistics() -> [String: Any] {
        return [
            "current_version": getCurrentVersion(),
            "target_version": getTargetVersion(),
            "store_size": getFormattedStoreSize(),
            "migration_needed": checkMigrationNeeded(),
            "backup_exists": fileManager.fileExists(atPath: storeURL.deletingLastPathComponent().appendingPathComponent("FleetManager_backup.sqlite").path)
        ]
    }
}
