//
//  OfflineSyncTests.swift
//  Fleet Manager - Offline Sync Tests
//
//  Comprehensive offline synchronization testing
//  Queue operations, conflict resolution, background sync, data integrity
//

import XCTest
@testable import App
import Foundation
import Combine

class OfflineSyncTests: XCTestCase {

    var syncQueue: SyncQueue!
    var backgroundSyncManager: BackgroundSyncManager!
    var conflictResolver: ConflictResolver!
    var dataPersistence: DataPersistenceManager!
    var cancellables = Set<AnyCancellable>()

    override func setUp() {
        super.setUp()
        syncQueue = SyncQueue.shared
        conflictResolver = ConflictResolver.shared
        dataPersistence = DataPersistenceManager.shared

        // Clear queue before each test
        syncQueue.clearAll()
    }

    override func tearDown() {
        syncQueue.clearAll()
        cancellables.removeAll()
        super.tearDown()
    }

    // MARK: - Queue Operation Tests

    func testQueueOperationCreation() throws {
        let vehicleData = [
            "id": "VEH-001",
            "make": "Ford",
            "model": "F-150"
        ]

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .create,
            data: vehicleData,
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 1)

        let operation = operations.first!
        XCTAssertEqual(operation.recordType, "vehicle")
        XCTAssertEqual(operation.recordId, "VEH-001")
        XCTAssertEqual(operation.operationType, .create)
        XCTAssertEqual(operation.status, .pending)
    }

    func testQueueOperationUpdate() throws {
        let initialData = ["status": "inactive"]
        let updatedData = ["status": "active"]

        // Create initial operation
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .create,
            data: initialData,
            endpoint: "/api/vehicles",
            priority: .normal
        )

        // Add update operation
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .update,
            data: updatedData,
            endpoint: "/api/vehicles/VEH-001",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 2, "Both operations should be queued")

        // Verify operations
        let createOp = operations.first { $0.operationType == .create }
        let updateOp = operations.first { $0.operationType == .update }

        XCTAssertNotNil(createOp)
        XCTAssertNotNil(updateOp)
    }

    func testQueueOperationDelete() throws {
        // Create operation
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-DELETE",
            operationType: .delete,
            data: [:],
            endpoint: "/api/vehicles/VEH-DELETE",
            priority: .high
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 1)
        XCTAssertEqual(operations.first?.operationType, .delete)
        XCTAssertEqual(operations.first?.priority, .high)
    }

    func testQueueOperationOrdering() throws {
        // Enqueue operations with different priorities
        let testOps = [
            ("VEH-001", SyncPriority.low),
            ("VEH-002", SyncPriority.high),
            ("VEH-003", SyncPriority.critical),
            ("VEH-004", SyncPriority.normal),
            ("VEH-005", SyncPriority.high)
        ]

        for (id, priority) in testOps {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: id,
                operationType: .create,
                data: ["id": id],
                endpoint: "/api/vehicles",
                priority: priority
            )
        }

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 5)

        // Verify priority ordering
        XCTAssertEqual(operations[0].priority, .critical)
        XCTAssertTrue(operations[1].priority == .high)
        XCTAssertTrue(operations[operations.count - 1].priority == .low)
    }

    // MARK: - Conflict Resolution Tests

    func testConflictDetection() {
        let localVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "1FTFW1E89PFA12345",
            status: "active",
            lastUpdated: Date().addingTimeInterval(-100)
        )

        let serverVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "1FTFW1E89PFA12345",
            status: "maintenance",
            lastUpdated: Date()
        )

        let hasConflict = conflictResolver.detectConflict(
            local: localVersion,
            remote: serverVersion
        )

        XCTAssertTrue(hasConflict, "Should detect conflict when data differs")
    }

    func testConflictResolutionServerWins() {
        let localVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "active",
            lastUpdated: Date().addingTimeInterval(-100)
        )

        let serverVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "maintenance",
            lastUpdated: Date()
        )

        let resolved = conflictResolver.resolve(
            local: localVersion,
            remote: serverVersion,
            strategy: .serverWins
        )

        XCTAssertEqual(resolved.status, "maintenance", "Server version should win")
        XCTAssertEqual(resolved.lastUpdated, serverVersion.lastUpdated)
    }

    func testConflictResolutionClientWins() {
        let localVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "active",
            lastUpdated: Date()
        )

        let serverVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "maintenance",
            lastUpdated: Date().addingTimeInterval(-100)
        )

        let resolved = conflictResolver.resolve(
            local: localVersion,
            remote: serverVersion,
            strategy: .clientWins
        )

        XCTAssertEqual(resolved.status, "active", "Client version should win")
    }

    func testConflictResolutionNewerWins() {
        let olderVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "inactive",
            lastUpdated: Date().addingTimeInterval(-200)
        )

        let newerVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "active",
            lastUpdated: Date()
        )

        let resolved = conflictResolver.resolve(
            local: olderVersion,
            remote: newerVersion,
            strategy: .newerWins
        )

        XCTAssertEqual(resolved.status, "active", "Newer version should win")
        XCTAssertEqual(resolved.lastUpdated, newerVersion.lastUpdated)
    }

    func testConflictMergeStrategy() {
        // Test field-level merging
        let localVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "active",
            lastUpdated: Date().addingTimeInterval(-50)
        )

        let serverVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-250",  // Different model
            year: 2024,
            vin: "VIN123",
            status: "maintenance",
            lastUpdated: Date()
        )

        let resolved = conflictResolver.resolve(
            local: localVersion,
            remote: serverVersion,
            strategy: .merge
        )

        // Verify merge took server's newer data
        XCTAssertNotNil(resolved)
        XCTAssertEqual(resolved.model, "F-250", "Should use server's model")
    }

    // MARK: - Background Sync Tests

    func testBackgroundSyncTriggering() {
        let expectation = self.expectation(description: "Background sync triggered")

        // Subscribe to sync events
        syncQueue.operationAdded
            .sink { _ in
                expectation.fulfill()
            }
            .store(in: &cancellables)

        // Enqueue operation
        try? syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-BG",
            operationType: .create,
            data: ["test": "background"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        waitForExpectations(timeout: 2.0)
    }

    func testBackgroundSyncBatching() throws {
        // Enqueue multiple operations
        for i in 1...10 {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: "VEH-\(i)",
                operationType: .create,
                data: ["index": i],
                endpoint: "/api/vehicles",
                priority: .normal
            )
        }

        // Get batch of operations
        let batch = syncQueue.getOperationsReadyToSync(limit: 5)
        XCTAssertEqual(batch.count, 5, "Should return batch of 5")

        let remaining = syncQueue.getPendingOperations()
        XCTAssertEqual(remaining.count, 10, "All operations should still be pending")
    }

    func testBackgroundSyncRetryDelay() throws {
        // Enqueue operation
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-RETRY",
            operationType: .update,
            data: ["test": "retry"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        guard let operation = operations.first else {
            XCTFail("Operation not found")
            return
        }

        // Simulate failure
        let error = NSError(domain: "Test", code: 500)
        syncQueue.markFailed(operation.id, error: error)

        // Check that retry is scheduled
        if let failedOp = syncQueue.getOperation(id: operation.id) {
            XCTAssertNotNil(failedOp.scheduledAt, "Retry should be scheduled")
            XCTAssertGreaterThan(
                failedOp.scheduledAt!,
                Date(),
                "Retry should be scheduled in future"
            )
        }
    }

    func testBackgroundSyncMaxRetries() throws {
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-MAX-RETRY",
            operationType: .create,
            data: ["test": "max retry"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        guard let operation = operations.first else {
            XCTFail("Operation not found")
            return
        }

        let error = NSError(domain: "Test", code: 500)

        // Fail 5 times (max retries)
        for _ in 1...5 {
            syncQueue.markFailed(operation.id, error: error)
        }

        // After max retries, operation should be marked as failed
        if let failedOp = syncQueue.getOperation(id: operation.id) {
            XCTAssertEqual(failedOp.retryCount, 5, "Should have 5 retry attempts")
            XCTAssertEqual(failedOp.status, .failed, "Should be marked as failed")
        }
    }

    // MARK: - Data Integrity Tests

    func testDataPersistenceIntegrity() throws {
        // Test that queued operations persist across app restarts
        let testData = [
            "vehicle_id": "VEH-PERSIST",
            "status": "active",
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-PERSIST",
            operationType: .create,
            data: testData,
            endpoint: "/api/vehicles",
            priority: .high
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 1)

        // Verify operation data
        let operation = operations.first!
        XCTAssertNotNil(operation.payload)
        XCTAssertGreaterThan(operation.payload.count, 0)

        // Decode payload
        let decoder = JSONDecoder()
        let decodedData = try decoder.decode([String: AnyCodable].self, from: operation.payload)
        XCTAssertEqual(decodedData["vehicle_id"]?.value as? String, "VEH-PERSIST")
    }

    func testQueuePersistence() throws {
        // Enqueue multiple operations
        for i in 1...5 {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: "VEH-\(i)",
                operationType: .create,
                data: ["index": i],
                endpoint: "/api/vehicles",
                priority: .normal
            )
        }

        let beforeCount = syncQueue.getPendingOperations().count
        XCTAssertEqual(beforeCount, 5)

        // Simulate saving to persistence
        // (SyncQueue automatically persists to UserDefaults)

        // Verify operations are still available
        let afterCount = syncQueue.getPendingOperations().count
        XCTAssertEqual(afterCount, 5, "Operations should persist")
    }

    func testOperationTimestamps() throws {
        let beforeTime = Date()

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-TIME",
            operationType: .create,
            data: ["test": "timestamp"],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        let afterTime = Date()

        let operations = syncQueue.getPendingOperations()
        let operation = operations.first!

        XCTAssertGreaterThanOrEqual(operation.createdAt, beforeTime)
        XCTAssertLessThanOrEqual(operation.createdAt, afterTime)
        XCTAssertEqual(operation.updatedAt, operation.createdAt)
    }

    func testOperationIDUniqueness() throws {
        var operationIds: Set<String> = []

        // Create 100 operations
        for i in 1...100 {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: "VEH-\(i)",
                operationType: .create,
                data: ["index": i],
                endpoint: "/api/vehicles",
                priority: .normal
            )
        }

        let operations = syncQueue.getPendingOperations()

        for operation in operations {
            operationIds.insert(operation.id)
        }

        // All IDs should be unique
        XCTAssertEqual(operationIds.count, 100, "All operation IDs should be unique")
    }

    // MARK: - Sync State Management Tests

    func testSyncQueueStatistics() throws {
        syncQueue.clearAll()

        // Add various operations
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-001",
            operationType: .create,
            data: [:],
            endpoint: "/api/vehicles",
            priority: .high
        )

        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-002",
            operationType: .update,
            data: [:],
            endpoint: "/api/vehicles",
            priority: .critical
        )

        let stats = syncQueue.getQueueStatistics()

        XCTAssertEqual(stats.totalOperations, 2)
        XCTAssertEqual(stats.pendingOperations, 2)
        XCTAssertEqual(stats.inProgressOperations, 0)
        XCTAssertEqual(stats.highPriorityCount, 2)
        XCTAssertFalse(stats.isIdle)
    }

    func testSyncQueueCounts() throws {
        syncQueue.clearAll()

        // Initially should be 0
        XCTAssertEqual(syncQueue.pendingCount, 0)
        XCTAssertEqual(syncQueue.inProgressCount, 0)
        XCTAssertEqual(syncQueue.failedCount, 0)

        // Add pending operation
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-COUNT",
            operationType: .create,
            data: [:],
            endpoint: "/api/vehicles",
            priority: .normal
        )

        // Wait for published update
        Thread.sleep(forTimeInterval: 0.1)

        XCTAssertEqual(syncQueue.pendingCount, 1)
    }

    // MARK: - Edge Cases Tests

    func testEmptyQueueOperations() {
        syncQueue.clearAll()

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 0)

        let stats = syncQueue.getQueueStatistics()
        XCTAssertEqual(stats.totalOperations, 0)
        XCTAssertTrue(stats.isIdle)
    }

    func testQueueOperationWithEmptyData() throws {
        try syncQueue.enqueue(
            recordType: "vehicle",
            recordId: "VEH-EMPTY",
            operationType: .delete,
            data: [:],
            endpoint: "/api/vehicles/VEH-EMPTY",
            priority: .normal
        )

        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, 1)

        // Verify empty data is handled
        let operation = operations.first!
        XCTAssertNotNil(operation.payload)
    }

    func testConcurrentQueueAccess() throws {
        syncQueue.clearAll()

        let group = DispatchGroup()
        let iterations = 50

        // Enqueue from multiple threads
        for i in 1...iterations {
            group.enter()
            DispatchQueue.global().async {
                do {
                    try self.syncQueue.enqueue(
                        recordType: "vehicle",
                        recordId: "VEH-\(i)",
                        operationType: .create,
                        data: ["index": i],
                        endpoint: "/api/vehicles",
                        priority: .normal
                    )
                } catch {
                    XCTFail("Concurrent enqueue failed: \(error)")
                }
                group.leave()
            }
        }

        group.wait()

        // Verify all operations were enqueued
        let operations = syncQueue.getPendingOperations()
        XCTAssertEqual(operations.count, iterations, "All concurrent operations should be enqueued")
    }

    // MARK: - Performance Tests

    func testQueueEnqueuePerformance() {
        syncQueue.clearAll()

        measure {
            for i in 0..<100 {
                try? syncQueue.enqueue(
                    recordType: "vehicle",
                    recordId: "VEH-\(i)",
                    operationType: .create,
                    data: ["index": i],
                    endpoint: "/api/vehicles",
                    priority: .normal
                )
            }
        }

        syncQueue.clearAll()
    }

    func testQueueRetrievalPerformance() throws {
        syncQueue.clearAll()

        // Enqueue 1000 operations
        for i in 0..<1000 {
            try syncQueue.enqueue(
                recordType: "vehicle",
                recordId: "VEH-\(i)",
                operationType: .create,
                data: ["index": i],
                endpoint: "/api/vehicles",
                priority: .normal
            )
        }

        measure {
            _ = syncQueue.getPendingOperations(limit: 100)
        }

        syncQueue.clearAll()
    }

    func testConflictResolutionPerformance() {
        let localVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "active",
            lastUpdated: Date()
        )

        let serverVersion = Vehicle(
            id: "VEH-001",
            make: "Ford",
            model: "F-150",
            year: 2024,
            vin: "VIN123",
            status: "maintenance",
            lastUpdated: Date()
        )

        measure {
            for _ in 0..<100 {
                _ = conflictResolver.resolve(
                    local: localVersion,
                    remote: serverVersion,
                    strategy: .newerWins
                )
            }
        }
    }
}

// MARK: - Helper Types

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let intVal = try? container.decode(Int.self) {
            value = intVal
        } else if let doubleVal = try? container.decode(Double.self) {
            value = doubleVal
        } else if let stringVal = try? container.decode(String.self) {
            value = stringVal
        } else if let boolVal = try? container.decode(Bool.self) {
            value = boolVal
        } else {
            value = ""
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        if let intVal = value as? Int {
            try container.encode(intVal)
        } else if let doubleVal = value as? Double {
            try container.encode(doubleVal)
        } else if let stringVal = value as? String {
            try container.encode(stringVal)
        } else if let boolVal = value as? Bool {
            try container.encode(boolVal)
        }
    }
}
