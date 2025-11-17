//
//  ConflictResolver.swift
//  Fleet Manager - iOS Native App
//
//  Handles data synchronization conflicts with multiple resolution strategies
//  Supports last-write-wins, server-wins, client-wins, and manual resolution
//

import Foundation
import Combine

// MARK: - Conflict Resolution Strategy
public enum ConflictResolutionStrategy {
    case serverWins           // Remote data takes precedence
    case clientWins          // Local data takes precedence
    case lastWriteWins       // Most recent modification wins
    case manual              // Requires user intervention
    case merge               // Attempt to merge both versions
    case custom((ConflictData) -> ConflictResolution) // Custom resolver function
}

// MARK: - Conflict Type
public enum ConflictType {
    case updateConflict      // Both local and remote modified
    case deleteConflict      // One deleted, other modified
    case createConflict      // Duplicate creation
    case versionMismatch     // Version number mismatch
}

// MARK: - Conflict Resolution Result
public enum ConflictResolution {
    case useLocal            // Keep local version
    case useRemote           // Accept remote version
    case useMerged(Any)      // Use merged data
    case requiresManual      // Cannot auto-resolve
    case skip                // Skip this conflict
}

// MARK: - Conflict Data
public struct ConflictData: Identifiable {
    public let id: String
    public let conflictType: ConflictType
    public let recordType: String
    public let recordId: String
    public let localData: Any?
    public let localTimestamp: Date?
    public let localVersion: Int?
    public let remoteData: Any?
    public let remoteTimestamp: Date?
    public let remoteVersion: Int?
    public let detectedAt: Date
    public var resolvedAt: Date?
    public var resolution: ConflictResolution?
    public var strategy: ConflictResolutionStrategy?

    public init(
        id: String = UUID().uuidString,
        conflictType: ConflictType,
        recordType: String,
        recordId: String,
        localData: Any?,
        localTimestamp: Date?,
        localVersion: Int?,
        remoteData: Any?,
        remoteTimestamp: Date?,
        remoteVersion: Int?
    ) {
        self.id = id
        self.conflictType = conflictType
        self.recordType = recordType
        self.recordId = recordId
        self.localData = localData
        self.localTimestamp = localTimestamp
        self.localVersion = localVersion
        self.remoteData = remoteData
        self.remoteTimestamp = remoteTimestamp
        self.remoteVersion = remoteVersion
        self.detectedAt = Date()
        self.resolvedAt = nil
        self.resolution = nil
        self.strategy = nil
    }
}

// MARK: - Conflict Resolver
public class ConflictResolver: ObservableObject {
    public static let shared = ConflictResolver()

    // MARK: - Published Properties
    @Published public private(set) var unresolvedConflicts: [ConflictData] = []
    @Published public private(set) var conflictCount: Int = 0

    // MARK: - Publishers
    public let conflictDetected = PassthroughSubject<ConflictData, Never>()
    public let conflictResolved = PassthroughSubject<ConflictData, Never>()

    // MARK: - Configuration
    private var defaultStrategy: ConflictResolutionStrategy = .lastWriteWins
    private var strategyOverrides: [String: ConflictResolutionStrategy] = [:]

    // MARK: - Storage
    private let userDefaults = UserDefaults.standard
    private let conflictsKey = "unresolved_conflicts"
    private let conflictHistoryKey = "conflict_history"

    // MARK: - Conflict History
    private var conflictHistory: [ConflictData] = []
    private let maxHistoryCount = 100

    // MARK: - Initialization
    private init() {
        loadUnresolvedConflicts()
        loadConflictHistory()
    }

    // MARK: - Conflict Detection

    /// Detect conflict between local and remote data
    public func detectConflict<T: SyncableRecord>(
        local: T?,
        remote: T?,
        recordType: String,
        recordId: String
    ) -> ConflictData? {
        // No conflict if only one version exists
        guard let local = local, let remote = remote else {
            return nil
        }

        // Compare timestamps
        if let localTimestamp = local.lastModified,
           let remoteTimestamp = remote.lastModified {

            // Check if both modified after last sync
            if localTimestamp != remoteTimestamp {
                let conflictType: ConflictType

                // Determine conflict type
                if local.isDeleted && !remote.isDeleted {
                    conflictType = .deleteConflict
                } else if !local.isDeleted && remote.isDeleted {
                    conflictType = .deleteConflict
                } else if let localVersion = local.version,
                          let remoteVersion = remote.version,
                          localVersion != remoteVersion {
                    conflictType = .versionMismatch
                } else {
                    conflictType = .updateConflict
                }

                let conflict = ConflictData(
                    conflictType: conflictType,
                    recordType: recordType,
                    recordId: recordId,
                    localData: local,
                    localTimestamp: localTimestamp,
                    localVersion: local.version,
                    remoteData: remote,
                    remoteTimestamp: remoteTimestamp,
                    remoteVersion: remote.version
                )

                registerConflict(conflict)
                return conflict
            }
        }

        return nil
    }

    /// Detect conflict from dictionary data (for API responses)
    public func detectConflictFromDictionaries(
        local: [String: Any]?,
        remote: [String: Any]?,
        recordType: String,
        recordId: String
    ) -> ConflictData? {
        guard let local = local, let remote = remote else {
            return nil
        }

        let localTimestamp = extractTimestamp(from: local)
        let remoteTimestamp = extractTimestamp(from: remote)

        // Check if timestamps differ
        if let localTime = localTimestamp,
           let remoteTime = remoteTimestamp,
           localTime != remoteTime {

            let conflict = ConflictData(
                conflictType: .updateConflict,
                recordType: recordType,
                recordId: recordId,
                localData: local,
                localTimestamp: localTime,
                localVersion: local["version"] as? Int,
                remoteData: remote,
                remoteTimestamp: remoteTime,
                remoteVersion: remote["version"] as? Int
            )

            registerConflict(conflict)
            return conflict
        }

        return nil
    }

    // MARK: - Conflict Resolution

    /// Resolve conflict using specified strategy
    public func resolveConflict(
        _ conflict: ConflictData,
        strategy strategyParam: ConflictResolutionStrategy? = nil
    ) -> ConflictResolution {
        let resolutionStrategy = strategyParam ?? getStrategy(for: conflict.recordType)

        let resolution: ConflictResolution

        switch resolutionStrategy {
        case .serverWins:
            resolution = .useRemote

        case .clientWins:
            resolution = .useLocal

        case .lastWriteWins:
            resolution = resolveLastWriteWins(conflict)

        case .manual:
            resolution = .requiresManual

        case .merge:
            resolution = attemptMerge(conflict)

        case .custom(let resolver):
            resolution = resolver(conflict)
        }

        // Mark as resolved
        markResolved(conflict, resolution: resolution, strategy: resolutionStrategy)

        return resolution
    }

    /// Resolve using last-write-wins strategy
    private func resolveLastWriteWins(_ conflict: ConflictData) -> ConflictResolution {
        // Compare timestamps
        guard let localTime = conflict.localTimestamp,
              let remoteTime = conflict.remoteTimestamp else {
            return .requiresManual
        }

        // Most recent wins
        return localTime > remoteTime ? .useLocal : .useRemote
    }

    /// Attempt to merge conflicting data
    private func attemptMerge(_ conflict: ConflictData) -> ConflictResolution {
        // Simple merge strategy - could be enhanced per record type
        guard let localDict = conflict.localData as? [String: Any],
              let remoteDict = conflict.remoteData as? [String: Any] else {
            return .requiresManual
        }

        // Merge dictionaries - remote values take precedence for conflicts
        var merged = localDict
        for (key, value) in remoteDict {
            // Use remote value if it exists
            merged[key] = value
        }

        // Check if merge actually changed anything
        let hasChanges = merged != localDict && merged != remoteDict

        return hasChanges ? .useMerged(merged) : .useRemote
    }

    // MARK: - Strategy Configuration

    /// Set default resolution strategy
    public func setDefaultStrategy(_ strategy: ConflictResolutionStrategy) {
        defaultStrategy = strategy
    }

    /// Set strategy for specific record type
    public func setStrategy(_ strategy: ConflictResolutionStrategy, forRecordType recordType: String) {
        strategyOverrides[recordType] = strategy
    }

    /// Get strategy for record type
    private func getStrategy(for recordType: String) -> ConflictResolutionStrategy {
        return strategyOverrides[recordType] ?? defaultStrategy
    }

    // MARK: - Manual Resolution

    /// Present conflict for manual resolution
    public func requiresManualResolution(_ conflict: ConflictData) {
        // Add to unresolved list
        if !unresolvedConflicts.contains(where: { $0.id == conflict.id }) {
            DispatchQueue.main.async {
                self.unresolvedConflicts.append(conflict)
                self.conflictCount = self.unresolvedConflicts.count
            }
            saveUnresolvedConflicts()
        }
    }

    /// Manually resolve conflict
    public func manuallyResolve(
        _ conflictId: String,
        resolution: ConflictResolution
    ) {
        guard let index = unresolvedConflicts.firstIndex(where: { $0.id == conflictId }) else {
            return
        }

        var conflict = unresolvedConflicts[index]
        markResolved(conflict, resolution: resolution, strategy: .manual)

        DispatchQueue.main.async {
            self.unresolvedConflicts.remove(at: index)
            self.conflictCount = self.unresolvedConflicts.count
        }
        saveUnresolvedConflicts()
    }

    // MARK: - Conflict Management

    private func registerConflict(_ conflict: ConflictData) {
        DispatchQueue.main.async {
            self.conflictDetected.send(conflict)
        }

        addToHistory(conflict)

        print("⚠️ Conflict detected: \(conflict.recordType):\(conflict.recordId) - \(conflict.conflictType)")
    }

    private func markResolved(
        _ conflict: ConflictData,
        resolution: ConflictResolution,
        strategy: ConflictResolutionStrategy
    ) {
        var resolvedConflict = conflict
        resolvedConflict.resolvedAt = Date()
        resolvedConflict.resolution = resolution
        resolvedConflict.strategy = strategy

        DispatchQueue.main.async {
            self.conflictResolved.send(resolvedConflict)
        }

        addToHistory(resolvedConflict)

        print("✅ Conflict resolved: \(conflict.recordType):\(conflict.recordId) - \(resolution)")
    }

    // MARK: - History Management

    private func addToHistory(_ conflict: ConflictData) {
        conflictHistory.append(conflict)

        // Limit history size
        if conflictHistory.count > maxHistoryCount {
            conflictHistory.removeFirst()
        }

        saveConflictHistory()
    }

    public func getConflictHistory(limit: Int? = nil) -> [ConflictData] {
        if let limit = limit {
            return Array(conflictHistory.suffix(limit))
        }
        return conflictHistory
    }

    public func clearHistory() {
        conflictHistory.removeAll()
        saveConflictHistory()
    }

    // MARK: - Statistics

    public func getConflictStatistics() -> ConflictStatistics {
        let resolved = conflictHistory.filter { $0.resolvedAt != nil }
        let unresolved = unresolvedConflicts

        let strategyUsage = Dictionary(grouping: resolved) { $0.strategy?.description ?? "unknown" }
            .mapValues { $0.count }

        return ConflictStatistics(
            totalConflicts: conflictHistory.count,
            resolvedConflicts: resolved.count,
            unresolvedConflicts: unresolved.count,
            autoResolvedConflicts: resolved.filter { $0.strategy != .manual }.count,
            manuallyResolvedConflicts: resolved.filter { $0.strategy == .manual }.count,
            strategyUsage: strategyUsage,
            oldestUnresolved: unresolved.min(by: { $0.detectedAt < $1.detectedAt })
        )
    }

    // MARK: - Persistence

    private func saveUnresolvedConflicts() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            // Note: Can't directly encode 'Any' type, would need custom encoding
            // For now, store just metadata
            let metadata = unresolvedConflicts.map { ConflictMetadata(from: $0) }
            let data = try encoder.encode(metadata)
            userDefaults.set(data, forKey: conflictsKey)
            userDefaults.synchronize()
        } catch {
            print("⚠️ Failed to save unresolved conflicts: \(error)")
        }
    }

    private func loadUnresolvedConflicts() {
        // Load metadata only - actual conflict data will be recreated during sync
        guard let data = userDefaults.data(forKey: conflictsKey) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let metadata = try decoder.decode([ConflictMetadata].self, from: data)

            DispatchQueue.main.async {
                self.conflictCount = metadata.count
            }

            print("📦 Loaded \(metadata.count) unresolved conflicts")
        } catch {
            print("⚠️ Failed to load unresolved conflicts: \(error)")
        }
    }

    private func saveConflictHistory() {
        // Save limited history metadata
        let recentHistory = conflictHistory.suffix(maxHistoryCount)
        let metadata = recentHistory.map { ConflictMetadata(from: $0) }

        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(metadata)
            userDefaults.set(data, forKey: conflictHistoryKey)
            userDefaults.synchronize()
        } catch {
            print("⚠️ Failed to save conflict history: \(error)")
        }
    }

    private func loadConflictHistory() {
        guard let data = userDefaults.data(forKey: conflictHistoryKey) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let metadata = try decoder.decode([ConflictMetadata].self, from: data)

            print("📦 Loaded \(metadata.count) conflicts from history")
        } catch {
            print("⚠️ Failed to load conflict history: \(error)")
        }
    }

    // MARK: - Helper Methods

    private func extractTimestamp(from data: [String: Any]) -> Date? {
        // Try common timestamp field names
        let timestampKeys = ["lastModified", "last_modified", "updatedAt", "updated_at", "modifiedAt"]

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
}

// MARK: - Supporting Types

/// Protocol for records that can be synced
public protocol SyncableRecord {
    var lastModified: Date? { get }
    var version: Int? { get }
    var isDeleted: Bool { get }
}

/// Conflict metadata for persistence
private struct ConflictMetadata: Codable {
    let id: String
    let recordType: String
    let recordId: String
    let detectedAt: Date
    let resolvedAt: Date?

    init(from conflict: ConflictData) {
        self.id = conflict.id
        self.recordType = conflict.recordType
        self.recordId = conflict.recordId
        self.detectedAt = conflict.detectedAt
        self.resolvedAt = conflict.resolvedAt
    }
}

/// Conflict statistics
public struct ConflictStatistics {
    public let totalConflicts: Int
    public let resolvedConflicts: Int
    public let unresolvedConflicts: Int
    public let autoResolvedConflicts: Int
    public let manuallyResolvedConflicts: Int
    public let strategyUsage: [String: Int]
    public let oldestUnresolved: ConflictData?

    public var resolutionRate: Double {
        guard totalConflicts > 0 else { return 1.0 }
        return Double(resolvedConflicts) / Double(totalConflicts)
    }

    public var autoResolutionRate: Double {
        guard resolvedConflicts > 0 else { return 0.0 }
        return Double(autoResolvedConflicts) / Double(resolvedConflicts)
    }
}

// MARK: - Strategy Description
extension ConflictResolutionStrategy {
    var description: String {
        switch self {
        case .serverWins: return "server_wins"
        case .clientWins: return "client_wins"
        case .lastWriteWins: return "last_write_wins"
        case .manual: return "manual"
        case .merge: return "merge"
        case .custom: return "custom"
        }
    }
}
