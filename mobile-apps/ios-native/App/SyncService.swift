//
//  SyncService.swift
//  Fleet Manager - iOS Native App
//
//  Bidirectional sync orchestrator for offline-first operations
//  Manages sync queue, conflict resolution, and background sync coordination
//

import Foundation
import Combine
import BackgroundTasks

// MARK: - Sync Status
public enum SyncStatus: String, Codable {
    case synced = "synced"
    case syncing = "syncing"
    case error = "error"
    case pending = "pending"

    public var displayName: String {
        switch self {
        case .synced: return "Synced"
        case .syncing: return "Syncing..."
        case .error: return "Sync Error"
        case .pending: return "Pending"
        }
    }
}

// MARK: - Sync Service
public class SyncService: ObservableObject {
    public static let shared = SyncService()

    // MARK: - Published Properties
    @Published public private(set) var isSyncing = false
    @Published public private(set) var syncStatus: SyncStatus = .synced
    @Published public private(set) var syncProgress: Double = 0.0
    @Published public private(set) var lastSyncDate: Date?
    @Published public private(set) var syncError: String?

    // MARK: - Dependencies
    private let networkMonitor = NetworkMonitor.shared
    private let syncQueue = SyncQueue.shared
    private let conflictResolver = ConflictResolver.shared
    private let persistence = DataPersistenceManager.shared
    private let networkManager = AzureNetworkManager()

    // MARK: - Publishers
    public let syncStarted = PassthroughSubject<Void, Never>()
    public let syncCompleted = PassthroughSubject<SyncResult, Never>()
    public let syncProgressPublisher = PassthroughSubject<SyncProgress, Never>()

    // MARK: - Configuration
    private let maxConcurrentSyncs = 3
    private let syncBatchSize = 20
    private let largeSyncThreshold = 100
    private let partialSyncBatchSize = 50

    // MARK: - State Management
    private var cancellables = Set<AnyCancellable>()
    private var currentSyncTask: Task<Void, Never>?
    private var syncTimer: Timer?
    private let syncLock = NSLock()

    // MARK: - Initialization
    private init() {
        setupNetworkMonitoring()
        setupConflictResolution()
        startPeriodicSync()
        setupSyncQueueObservers()
    }

    // MARK: - Network Monitoring
    private func setupNetworkMonitoring() {
        // React to network status changes
        networkMonitor.connectivityPublisher
            .sink { [weak self] isConnected in
                guard let self = self else { return }

                if isConnected {
                    print("📡 Network connected - initiating sync")
                    Task {
                        await self.startSync()
                    }
                } else {
                    print("📡 Network disconnected - sync paused")
                    self.cancelCurrentSync()
                }
            }
            .store(in: &cancellables)
    }

    private func setupConflictResolution() {
        // Handle conflict detection
        conflictResolver.conflictDetected
            .sink { [weak self] conflict in
                print("⚠️ Conflict detected during sync: \(conflict.recordType):\(conflict.recordId)")
                // Automatically resolve based on strategy
                let resolution = self?.conflictResolver.resolveConflict(conflict)
                if case .requiresManual = resolution {
                    self?.conflictResolver.requiresManualResolution(conflict)
                }
            }
            .store(in: &cancellables)
    }

    private func setupSyncQueueObservers() {
        // Monitor queue changes
        syncQueue.operationAdded
            .sink { [weak self] _ in
                // Auto-sync if online and not already syncing
                if self?.networkMonitor.isConnected == true && self?.isSyncing == false {
                    Task {
                        await self?.startSync()
                    }
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Periodic Sync
    private func startPeriodicSync() {
        // Sync every 60 seconds when online
        syncTimer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: true) { [weak self] _ in
            guard let self = self,
                  self.networkMonitor.isConnected,
                  !self.isSyncing else { return }

            Task {
                await self.startSync()
            }
        }
    }

    // MARK: - Sync Operations

    /// Start sync process
    @MainActor
    public func startSync() async {
        // Prevent concurrent syncs
        syncLock.lock()
        guard !isSyncing else {
            syncLock.unlock()
            return
        }
        isSyncing = true
        syncStatus = .syncing
        syncLock.unlock()

        syncStarted.send()

        do {
            let result = await performSync()
            await handleSyncCompletion(result)
        } catch {
            await handleSyncError(error)
        }
    }

    /// Force sync now (manual trigger)
    @MainActor
    public func forceSyncNow() async {
        guard networkMonitor.isConnected else {
            syncError = "Cannot sync while offline"
            return
        }

        await startSync()
    }

    /// Perform the actual sync operation
    private func performSync() async -> SyncResult {
        let operations = syncQueue.getOperationsReadyToSync(limit: syncBatchSize)

        guard !operations.isEmpty else {
            print("✅ No pending operations to sync")
            return SyncResult(
                success: true,
                totalOperations: 0,
                successCount: 0,
                failureCount: 0,
                conflictCount: 0,
                duration: 0
            )
        }

        print("🔄 Syncing \(operations.count) operations...")

        let startTime = Date()
        var successCount = 0
        var failureCount = 0
        var conflictCount = 0

        // Check if this is a large sync that needs partial processing
        let shouldUsePartialSync = operations.count > largeSyncThreshold

        if shouldUsePartialSync {
            print("📦 Large sync detected - using partial sync mode")
            return await performPartialSync(operations: operations)
        }

        // Use concurrent processing with semaphore for rate limiting
        await withTaskGroup(of: SyncOperationResult.self) { group in
            let semaphore = AsyncSemaphore(value: maxConcurrentSyncs)

            for (index, operation) in operations.enumerated() {
                group.addTask {
                    await semaphore.wait()

                    let result = await self.syncOperation(operation)

                    // Update progress
                    let progress = Double(index + 1) / Double(operations.count)
                    await self.updateProgress(progress)

                    // Signal after all async work is done
                    await semaphore.signal()

                    return result
                }
            }

            // Collect results
            for await result in group {
                switch result {
                case .success:
                    successCount += 1
                case .failure:
                    failureCount += 1
                case .conflict:
                    conflictCount += 1
                }
            }
        }

        let duration = Date().timeIntervalSince(startTime)

        return SyncResult(
            success: failureCount == 0,
            totalOperations: operations.count,
            successCount: successCount,
            failureCount: failureCount,
            conflictCount: conflictCount,
            duration: duration
        )
    }

    /// Perform partial sync for large datasets
    private func performPartialSync(operations: [SyncOperation]) async -> SyncResult {
        var totalSuccess = 0
        var totalFailure = 0
        var totalConflict = 0
        let startTime = Date()

        // Process in batches
        let batches = operations.chunked(into: partialSyncBatchSize)
        let totalBatches = batches.count

        for (batchIndex, batch) in batches.enumerated() {
            print("📦 Processing batch \(batchIndex + 1)/\(totalBatches)")

            for operation in batch {
                let result = await syncOperation(operation)

                switch result {
                case .success: totalSuccess += 1
                case .failure: totalFailure += 1
                case .conflict: totalConflict += 1
                }

                // Update overall progress
                let completedOps = totalSuccess + totalFailure + totalConflict
                let progress = Double(completedOps) / Double(operations.count)
                await updateProgress(progress)
            }

            // Small delay between batches to avoid overwhelming server
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }

        let duration = Date().timeIntervalSince(startTime)

        return SyncResult(
            success: totalFailure == 0,
            totalOperations: operations.count,
            successCount: totalSuccess,
            failureCount: totalFailure,
            conflictCount: totalConflict,
            duration: duration
        )
    }

    /// Sync individual operation
    private func syncOperation(_ operation: SyncOperation) async -> SyncOperationResult {
        // Mark as in progress
        syncQueue.markInProgress(operation.id)

        do {
            // Perform network request
            let response = try await performNetworkRequest(for: operation)

            // Check for conflicts
            if let conflict = detectConflict(operation: operation, response: response) {
                let resolution = conflictResolver.resolveConflict(conflict)

                switch resolution {
                case .useLocal:
                    // Retry with force flag
                    try await forceUpdateRemote(operation: operation)
                    syncQueue.markCompleted(operation.id)
                    return .success

                case .useRemote:
                    // Update local with remote data
                    try await applyRemoteData(operation: operation, data: response)
                    syncQueue.markCompleted(operation.id)
                    return .conflict

                case .useMerged(let mergedData):
                    // Apply merged data both locally and remotely
                    try await applyMergedData(operation: operation, data: mergedData)
                    syncQueue.markCompleted(operation.id)
                    return .conflict

                case .requiresManual:
                    // Keep in queue for manual resolution
                    return .conflict

                case .skip:
                    syncQueue.markCompleted(operation.id)
                    return .success
                }
            }

            // No conflict - mark as completed
            syncQueue.markCompleted(operation.id)
            return .success

        } catch {
            // Handle failure
            syncQueue.markFailed(operation.id, error: error)
            print("❌ Sync failed for \(operation.recordType):\(operation.recordId) - \(error.localizedDescription)")
            return .failure
        }
    }

    // MARK: - Network Requests

    private func performNetworkRequest(for operation: SyncOperation) async throws -> [String: Any] {
        let endpoint = operation.endpoint

        // Decode payload to dictionary
        let payload = try JSONSerialization.jsonObject(with: operation.payload) as? [String: Any]

        // Determine HTTP method
        let method: HTTPMethod
        switch operation.operationType {
        case .create: method = .POST
        case .update: method = .PUT
        case .delete: method = .DELETE
        case .patch: method = .PATCH
        }

        // Get auth token
        guard let token = await getAuthToken() else {
            throw SyncError.authenticationRequired
        }

        // Perform request
        let response: GenericAPIResponse = try await networkManager.performRequest(
            endpoint: endpoint,
            method: method,
            body: payload,
            token: token,
            responseType: GenericAPIResponse.self
        )

        guard response.success else {
            throw SyncError.serverError(response.error ?? "Unknown error")
        }

        return response.data ?? [:]
    }

    private func forceUpdateRemote(operation: SyncOperation) async throws {
        // Implement force update with conflict override flag
        print("🔄 Force updating remote: \(operation.recordType):\(operation.recordId)")
        // Implementation would add a force flag to the request
    }

    private func applyRemoteData(operation: SyncOperation, data: [String: Any]) async throws {
        // Update local database with remote data
        print("📥 Applying remote data: \(operation.recordType):\(operation.recordId)")
        // Implementation depends on record type
    }

    private func applyMergedData(operation: SyncOperation, data: Any) async throws {
        // Apply merged data to both local and remote
        print("🔀 Applying merged data: \(operation.recordType):\(operation.recordId)")
        // Implementation depends on record type
    }

    // MARK: - Conflict Detection

    private func detectConflict(operation: SyncOperation, response: [String: Any]) -> ConflictData? {
        // Extract timestamps
        guard let remoteTimestamp = extractTimestamp(from: response) else {
            return nil
        }

        // Decode local data
        guard let localData = try? JSONSerialization.jsonObject(with: operation.payload) as? [String: Any],
              let localTimestamp = extractTimestamp(from: localData) else {
            return nil
        }

        // Check for conflict
        if remoteTimestamp != localTimestamp {
            return conflictResolver.detectConflictFromDictionaries(
                local: localData,
                remote: response,
                recordType: operation.recordType,
                recordId: operation.recordId
            )
        }

        return nil
    }

    private func extractTimestamp(from data: [String: Any]) -> Date? {
        let timestampKeys = ["lastModified", "last_modified", "updatedAt", "updated_at"]

        for key in timestampKeys {
            if let timestamp = data[key] as? TimeInterval {
                return Date(timeIntervalSince1970: timestamp)
            } else if let timestampString = data[key] as? String {
                let formatter = ISO8601DateFormatter()
                return formatter.date(from: timestampString)
            }
        }

        return nil
    }

    // MARK: - Progress Reporting

    @MainActor
    private func updateProgress(_ progress: Double) {
        syncProgress = progress

        let syncProgress = SyncProgress(
            current: Int(progress * 100),
            total: 100,
            percentage: progress
        )

        syncProgressPublisher.send(syncProgress)
    }

    // MARK: - Completion Handling

    @MainActor
    private func handleSyncCompletion(_ result: SyncResult) {
        isSyncing = false
        syncProgress = 0.0
        lastSyncDate = Date()

        if result.success {
            syncStatus = .synced
            syncError = nil
            print("✅ Sync completed successfully - \(result.successCount)/\(result.totalOperations) operations")
        } else {
            syncStatus = .error
            syncError = "Sync completed with \(result.failureCount) failures"
            print("⚠️ Sync completed with errors - \(result.failureCount) failures")
        }

        syncCompleted.send(result)
    }

    @MainActor
    private func handleSyncError(_ error: Error) {
        isSyncing = false
        syncProgress = 0.0
        syncStatus = .error
        syncError = error.localizedDescription

        print("❌ Sync failed: \(error.localizedDescription)")

        let result = SyncResult(
            success: false,
            totalOperations: 0,
            successCount: 0,
            failureCount: 1,
            conflictCount: 0,
            duration: 0
        )

        syncCompleted.send(result)
    }

    // MARK: - Cancel Sync

    private func cancelCurrentSync() {
        currentSyncTask?.cancel()
        currentSyncTask = nil

        DispatchQueue.main.async {
            self.isSyncing = false
            self.syncProgress = 0.0
        }
    }

    // MARK: - Helper Methods

    private func getAuthToken() async -> String? {
        return try? await KeychainManager.shared.getAccessToken()
    }

    // MARK: - Public API

    /// Get current sync status
    public func getSyncStatus() -> SyncStatusInfo {
        let queueStats = syncQueue.getQueueStatistics()
        let conflictStats = conflictResolver.getConflictStatistics()

        return SyncStatusInfo(
            isSyncing: isSyncing,
            status: syncStatus,
            lastSyncDate: lastSyncDate,
            pendingOperations: queueStats.pendingOperations,
            failedOperations: queueStats.failedOperations,
            unresolvedConflicts: conflictStats.unresolvedConflicts,
            isOnline: networkMonitor.isConnected
        )
    }

    /// Clear sync queue (use with caution)
    public func clearSyncQueue() {
        syncQueue.clearAll()
    }

    /// Retry failed operations
    @MainActor
    public func retryFailedOperations() async {
        let failedOps = syncQueue.getOperations(withStatus: .failed)

        // Reset status to pending
        for operation in failedOps {
            syncQueue.updateStatus(operation.id, status: .pending)
        }

        // Start sync
        await startSync()
    }
}

// MARK: - Supporting Types

public enum SyncError: Error, LocalizedError {
    case authenticationRequired
    case serverError(String)
    case networkError
    case conflictResolutionFailed

    public var errorDescription: String? {
        switch self {
        case .authenticationRequired:
            return "Authentication required"
        case .serverError(let message):
            return "Server error: \(message)"
        case .networkError:
            return "Network error"
        case .conflictResolutionFailed:
            return "Failed to resolve conflict"
        }
    }
}

private enum SyncOperationResult {
    case success
    case failure
    case conflict
}

public struct SyncResult {
    public let success: Bool
    public let totalOperations: Int
    public let successCount: Int
    public let failureCount: Int
    public let conflictCount: Int
    public let duration: TimeInterval
}

public struct SyncProgress {
    public let current: Int
    public let total: Int
    public let percentage: Double
}

public struct SyncStatusInfo {
    public let isSyncing: Bool
    public let status: SyncStatus
    public let lastSyncDate: Date?
    public let pendingOperations: Int
    public let failedOperations: Int
    public let unresolvedConflicts: Int
    public let isOnline: Bool
}

struct GenericAPIResponse: Codable {
    let success: Bool
    let data: [String: Any]?
    let error: String?

    enum CodingKeys: String, CodingKey {
        case success, data, error
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        success = try container.decode(Bool.self, forKey: .success)
        error = try container.decodeIfPresent(String.self, forKey: .error)

        if let dataContainer = try? container.nestedContainer(keyedBy: JSONCodingKeys.self, forKey: .data) {
            data = try dataContainer.decode([String: Any].self)
        } else {
            data = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(success, forKey: .success)
        try container.encodeIfPresent(error, forKey: .error)
        if let data = data {
            var dataContainer = container.nestedContainer(keyedBy: JSONCodingKeys.self, forKey: .data)
            try dataContainer.encode(data)
        }
    }
}

// Helper for dynamic JSON keys
private struct JSONCodingKeys: CodingKey {
    var stringValue: String
    var intValue: Int?

    init?(stringValue: String) {
        self.stringValue = stringValue
    }

    init?(intValue: Int) {
        self.intValue = intValue
        self.stringValue = "\(intValue)"
    }
}

// Helper extensions
extension KeyedDecodingContainer where K == JSONCodingKeys {
    func decode(_ type: [String: Any].Type) throws -> [String: Any] {
        var dictionary = [String: Any]()

        for key in allKeys {
            if let boolValue = try? decode(Bool.self, forKey: key) {
                dictionary[key.stringValue] = boolValue
            } else if let intValue = try? decode(Int.self, forKey: key) {
                dictionary[key.stringValue] = intValue
            } else if let doubleValue = try? decode(Double.self, forKey: key) {
                dictionary[key.stringValue] = doubleValue
            } else if let stringValue = try? decode(String.self, forKey: key) {
                dictionary[key.stringValue] = stringValue
            }
        }

        return dictionary
    }
}

extension KeyedEncodingContainer where K == JSONCodingKeys {
    mutating func encode(_ value: [String: Any]) throws {
        for (key, val) in value {
            let codingKey = JSONCodingKeys(stringValue: key)!

            if let boolValue = val as? Bool {
                try encode(boolValue, forKey: codingKey)
            } else if let intValue = val as? Int {
                try encode(intValue, forKey: codingKey)
            } else if let doubleValue = val as? Double {
                try encode(doubleValue, forKey: codingKey)
            } else if let stringValue = val as? String {
                try encode(stringValue, forKey: codingKey)
            }
        }
    }
}

// Async semaphore for concurrency control
private actor AsyncSemaphore {
    private var value: Int
    private var waiters: [CheckedContinuation<Void, Never>] = []

    init(value: Int) {
        self.value = value
    }

    func wait() async {
        value -= 1
        if value < 0 {
            await withCheckedContinuation { continuation in
                waiters.append(continuation)
            }
        }
    }

    func signal() {
        value += 1
        if !waiters.isEmpty {
            let waiter = waiters.removeFirst()
            waiter.resume()
        }
    }
}

// Array chunking extension
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
