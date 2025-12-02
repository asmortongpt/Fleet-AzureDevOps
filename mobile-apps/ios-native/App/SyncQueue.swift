//
//  SyncQueue.swift
//  Fleet Manager - iOS Native App
//
//  Persistent queue for offline operations with retry logic
//  Stores create, update, and delete operations while offline
//

import Foundation
import CoreData
import Combine

// MARK: - Sync Operation Types
public enum SyncOperationType: String, Codable {
    case create = "CREATE"
    case update = "UPDATE"
    case delete = "DELETE"
    case patch = "PATCH"
}

// MARK: - Sync Operation Priority
public enum SyncPriority: Int, Codable, Comparable {
    case low = 0
    case normal = 1
    case high = 2
    case critical = 3

    public static func < (lhs: SyncPriority, rhs: SyncPriority) -> Bool {
        return lhs.rawValue < rhs.rawValue
    }
}

// MARK: - Sync Operation Status
public enum SyncOperationStatus: String, Codable {
    case pending = "pending"
    case inProgress = "in_progress"
    case completed = "completed"
    case failed = "failed"
    case cancelled = "cancelled"
}

// MARK: - Sync Operation
public struct SyncOperation: Identifiable, Codable {
    public let id: String
    public let recordType: String
    public let recordId: String
    public let operationType: SyncOperationType
    public let payload: Data
    public let endpoint: String
    public var status: SyncOperationStatus
    public var priority: SyncPriority
    public var retryCount: Int
    public var lastError: String?
    public let createdAt: Date
    public var updatedAt: Date
    public var scheduledAt: Date?

    public init(
        id: String = UUID().uuidString,
        recordType: String,
        recordId: String,
        operationType: SyncOperationType,
        payload: Data,
        endpoint: String,
        priority: SyncPriority = .normal,
        status: SyncOperationStatus = .pending
    ) {
        self.id = id
        self.recordType = recordType
        self.recordId = recordId
        self.operationType = operationType
        self.payload = payload
        self.endpoint = endpoint
        self.status = status
        self.priority = priority
        self.retryCount = 0
        self.lastError = nil
        self.createdAt = Date()
        self.updatedAt = Date()
        self.scheduledAt = nil
    }
}

// MARK: - Sync Queue Manager
public class SyncQueue: ObservableObject {
    public static let shared = SyncQueue()

    // MARK: - Published Properties
    @Published public private(set) var pendingCount: Int = 0
    @Published public private(set) var inProgressCount: Int = 0
    @Published public private(set) var failedCount: Int = 0

    // MARK: - Publishers
    public let operationAdded = PassthroughSubject<SyncOperation, Never>()
    public let operationCompleted = PassthroughSubject<SyncOperation, Never>()
    public let operationFailed = PassthroughSubject<(SyncOperation, Error), Never>()

    // MARK: - Configuration
    private let maxRetries = 5
    private let retryBackoffMultiplier: TimeInterval = 2.0
    private let initialRetryDelay: TimeInterval = 5.0
    private let maxRetryDelay: TimeInterval = 300.0 // 5 minutes

    // MARK: - Storage
    private let persistence = DataPersistenceManager.shared
    private let userDefaults = UserDefaults.standard
    private let queueKey = "sync_queue_operations"
    private let metadataKey = "sync_queue_metadata"

    // MARK: - In-Memory Queue
    private var operations: [String: SyncOperation] = [:]
    private let queueLock = NSLock()

    // MARK: - Initialization
    private init() {
        loadFromPersistence()
        updateCounts()
    }

    // MARK: - Queue Operations

    /// Add operation to sync queue
    public func enqueue(_ operation: SyncOperation) {
        queueLock.lock()
        defer { queueLock.unlock() }

        operations[operation.id] = operation
        saveToPersistence()
        updateCounts()

        operationAdded.send(operation)

        print("📥 Enqueued \(operation.operationType.rawValue) operation for \(operation.recordType):\(operation.recordId)")
    }

    /// Add operation with auto-serialization
    public func enqueue<T: Encodable>(
        recordType: String,
        recordId: String,
        operationType: SyncOperationType,
        data: T,
        endpoint: String,
        priority: SyncPriority = .normal
    ) throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let payload = try encoder.encode(data)

        let operation = SyncOperation(
            recordType: recordType,
            recordId: recordId,
            operationType: operationType,
            payload: payload,
            endpoint: endpoint,
            priority: priority
        )

        enqueue(operation)
    }

    /// Get pending operations (ordered by priority and creation time)
    public func getPendingOperations(limit: Int? = nil) -> [SyncOperation] {
        queueLock.lock()
        defer { queueLock.unlock() }

        var pending = operations.values
            .filter { $0.status == .pending }
            .sorted { operation1, operation2 in
                // Sort by priority first, then by creation time
                if operation1.priority != operation2.priority {
                    return operation1.priority > operation2.priority
                }
                return operation1.createdAt < operation2.createdAt
            }

        if let limit = limit {
            pending = Array(pending.prefix(limit))
        }

        return pending
    }

    /// Get all operations with specific status
    public func getOperations(withStatus status: SyncOperationStatus) -> [SyncOperation] {
        queueLock.lock()
        defer { queueLock.unlock() }

        return operations.values.filter { $0.status == status }
    }

    /// Get operation by ID
    public func getOperation(id: String) -> SyncOperation? {
        queueLock.lock()
        defer { queueLock.unlock() }

        return operations[id]
    }

    /// Update operation status
    public func updateStatus(_ operationId: String, status: SyncOperationStatus) {
        queueLock.lock()
        defer { queueLock.unlock() }

        guard var operation = operations[operationId] else { return }

        operation.status = status
        operation.updatedAt = Date()
        operations[operationId] = operation

        saveToPersistence()
        updateCounts()

        if status == .completed {
            operationCompleted.send(operation)
        }
    }

    /// Mark operation as in progress
    public func markInProgress(_ operationId: String) {
        updateStatus(operationId, status: .inProgress)
    }

    /// Mark operation as completed and remove from queue
    public func markCompleted(_ operationId: String) {
        queueLock.lock()
        defer { queueLock.unlock() }

        guard let operation = operations[operationId] else { return }

        operations.removeValue(forKey: operationId)
        saveToPersistence()
        updateCounts()

        operationCompleted.send(operation)

        print("✅ Completed \(operation.operationType.rawValue) operation for \(operation.recordType):\(operation.recordId)")
    }

    /// Mark operation as failed with error
    public func markFailed(_ operationId: String, error: Error) {
        queueLock.lock()
        defer { queueLock.unlock() }

        guard var operation = operations[operationId] else { return }

        operation.status = .failed
        operation.retryCount += 1
        operation.lastError = error.localizedDescription
        operation.updatedAt = Date()

        // Calculate exponential backoff for retry
        if operation.retryCount < maxRetries {
            let delay = min(
                initialRetryDelay * pow(retryBackoffMultiplier, Double(operation.retryCount - 1)),
                maxRetryDelay
            )
            operation.scheduledAt = Date().addingTimeInterval(delay)
            operation.status = .pending // Reset to pending for retry
        }

        operations[operationId] = operation
        saveToPersistence()
        updateCounts()

        operationFailed.send((operation, error))

        print("❌ Failed \(operation.operationType.rawValue) operation for \(operation.recordType):\(operation.recordId) - Retry \(operation.retryCount)/\(maxRetries)")
    }

    /// Remove operation from queue
    public func remove(_ operationId: String) {
        queueLock.lock()
        defer { queueLock.unlock() }

        operations.removeValue(forKey: operationId)
        saveToPersistence()
        updateCounts()
    }

    /// Get operations ready to sync (considering scheduled retry times)
    public func getOperationsReadyToSync(limit: Int? = nil) -> [SyncOperation] {
        let now = Date()
        var ready = getPendingOperations(limit: nil)
            .filter { operation in
                // Check if operation is ready (no scheduled time or scheduled time has passed)
                guard let scheduledAt = operation.scheduledAt else { return true }
                return scheduledAt <= now
            }

        if let limit = limit {
            ready = Array(ready.prefix(limit))
        }

        return ready
    }

    // MARK: - Queue Management

    /// Clear all completed operations
    public func clearCompleted() {
        queueLock.lock()
        defer { queueLock.unlock() }

        let completedIds = operations.values
            .filter { $0.status == .completed }
            .map { $0.id }

        completedIds.forEach { operations.removeValue(forKey: $0) }

        saveToPersistence()
        updateCounts()
    }

    /// Clear all failed operations that exceeded retry limit
    public func clearFailedOperations() {
        queueLock.lock()
        defer { queueLock.unlock() }

        let failedIds = operations.values
            .filter { $0.status == .failed && $0.retryCount >= maxRetries }
            .map { $0.id }

        failedIds.forEach { operations.removeValue(forKey: $0) }

        saveToPersistence()
        updateCounts()
    }

    /// Clear all operations (use with caution)
    public func clearAll() {
        queueLock.lock()
        defer { queueLock.unlock() }

        operations.removeAll()
        saveToPersistence()
        updateCounts()
    }

    /// Cancel specific operation
    public func cancel(_ operationId: String) {
        queueLock.lock()
        defer { queueLock.unlock() }

        guard var operation = operations[operationId] else { return }

        operation.status = .cancelled
        operation.updatedAt = Date()
        operations[operationId] = operation

        saveToPersistence()
        updateCounts()
    }

    // MARK: - Statistics

    public func getQueueStatistics() -> SyncQueueStatistics {
        queueLock.lock()
        defer { queueLock.unlock() }

        let allOps = Array(operations.values)

        return SyncQueueStatistics(
            totalOperations: allOps.count,
            pendingOperations: allOps.filter { $0.status == .pending }.count,
            inProgressOperations: allOps.filter { $0.status == .inProgress }.count,
            failedOperations: allOps.filter { $0.status == .failed }.count,
            completedOperations: allOps.filter { $0.status == .completed }.count,
            oldestOperation: allOps.min(by: { $0.createdAt < $1.createdAt }),
            highPriorityCount: allOps.filter { $0.priority == .high || $0.priority == .critical }.count
        )
    }

    // MARK: - Persistence

    private func saveToPersistence() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(Array(operations.values))
            userDefaults.set(data, forKey: queueKey)
            userDefaults.synchronize()

            // Save metadata
            let metadata = SyncQueueMetadata(
                lastUpdated: Date(),
                operationCount: operations.count
            )
            let metadataData = try encoder.encode(metadata)
            userDefaults.set(metadataData, forKey: metadataKey)
        } catch {
            print("⚠️ Failed to save sync queue: \(error)")
        }
    }

    private func loadFromPersistence() {
        guard let data = userDefaults.data(forKey: queueKey) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let loadedOperations = try decoder.decode([SyncOperation].self, from: data)

            queueLock.lock()
            defer { queueLock.unlock() }

            operations = Dictionary(uniqueKeysWithValues: loadedOperations.map { ($0.id, $0) })

            print("📦 Loaded \(operations.count) operations from persistence")
        } catch {
            print("⚠️ Failed to load sync queue: \(error)")
        }
    }

    private func updateCounts() {
        let allOps = Array(operations.values)
        DispatchQueue.main.async {
            self.pendingCount = allOps.filter { $0.status == .pending }.count
            self.inProgressCount = allOps.filter { $0.status == .inProgress }.count
            self.failedCount = allOps.filter { $0.status == .failed }.count
        }
    }
}

// MARK: - Supporting Types

public struct SyncQueueStatistics {
    public let totalOperations: Int
    public let pendingOperations: Int
    public let inProgressOperations: Int
    public let failedOperations: Int
    public let completedOperations: Int
    public let oldestOperation: SyncOperation?
    public let highPriorityCount: Int

    public var hasFailures: Bool {
        return failedOperations > 0
    }

    public var isIdle: Bool {
        return inProgressOperations == 0 && pendingOperations == 0
    }
}

private struct SyncQueueMetadata: Codable {
    let lastUpdated: Date
    let operationCount: Int
}
