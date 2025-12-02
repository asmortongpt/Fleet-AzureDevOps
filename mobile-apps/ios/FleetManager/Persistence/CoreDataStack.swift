import Foundation
import CoreData

/**
 * Core Data Stack Manager
 *
 * Manages the Core Data persistent container and provides
 * context for data operations with proper error handling.
 */

class CoreDataStack {
    static let shared = CoreDataStack()

    private init() {}

    // MARK: - Core Data Stack

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "FleetManager")

        // Configure persistent store description
        let storeDescription = container.persistentStoreDescriptions.first
        storeDescription?.shouldMigrateStoreAutomatically = true
        storeDescription?.shouldInferMappingModelAutomatically = true

        // Enable persistent history tracking for sync
        storeDescription?.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
        storeDescription?.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)

        container.loadPersistentStores { description, error in
            if let error = error {
                // In production, handle this error appropriately
                fatalError("Unable to load persistent stores: \(error)")
            }

            print("Core Data stack loaded successfully from: \(description.url?.absoluteString ?? "unknown")")
        }

        // Configure view context
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        return container
    }()

    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    // MARK: - Background Context

    func newBackgroundContext() -> NSManagedObjectContext {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }

    // MARK: - Save Context

    func saveContext() {
        saveContext(viewContext)
    }

    func saveContext(_ context: NSManagedObjectContext) {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                print("Error saving context: \(nsError), \(nsError.userInfo)")
                // In production, handle this appropriately
            }
        }
    }

    // MARK: - Clear All Data (for testing/logout)

    func clearAllData() {
        let entities = persistentContainer.managedObjectModel.entities
        entities.forEach { entity in
            if let entityName = entity.name {
                let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entityName)
                let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

                do {
                    try viewContext.execute(deleteRequest)
                    saveContext()
                } catch {
                    print("Error clearing \(entityName): \(error)")
                }
            }
        }
    }

    // MARK: - Performance Optimization

    func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
        persistentContainer.performBackgroundTask(block)
    }
}

// MARK: - Batch Operations

extension CoreDataStack {
    /// Delete all entities of a given type
    func deleteAll<T: NSManagedObject>(_ type: T.Type) throws {
        let context = newBackgroundContext()
        let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: String(describing: type))
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        try context.execute(deleteRequest)
        try context.save()
    }

    /// Count entities
    func count<T: NSManagedObject>(_ type: T.Type, predicate: NSPredicate? = nil) throws -> Int {
        let fetchRequest = NSFetchRequest<T>(entityName: String(describing: type))
        fetchRequest.predicate = predicate
        return try viewContext.count(for: fetchRequest)
    }
}

// MARK: - Migration Helpers

extension CoreDataStack {
    var storeURL: URL? {
        return persistentContainer.persistentStoreDescriptions.first?.url
    }

    func destroyPersistentStore() throws {
        guard let storeURL = storeURL else { return }

        let coordinator = persistentContainer.persistentStoreCoordinator

        for store in coordinator.persistentStores {
            try coordinator.remove(store)
        }

        try FileManager.default.removeItem(at: storeURL)
    }
}
