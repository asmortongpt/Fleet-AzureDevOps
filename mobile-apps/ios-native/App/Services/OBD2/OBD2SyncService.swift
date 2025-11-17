//
//  OBD2SyncService.swift
//  Fleet Manager
//
//  Service for syncing OBD2 data to Azure backend
//

import Foundation
import Combine

@MainActor
class OBD2SyncService: ObservableObject {

    // MARK: - Published Properties
    @Published var isSyncing: Bool = false
    @Published var lastSyncTime: Date?
    @Published var syncProgress: Double = 0.0
    @Published var offlineQueueCount: Int = 0

    // MARK: - Private Properties
    private var offlineQueue: [SyncItem] = []
    private var autoSyncTimer: Timer?
    private var cancellables = Set<AnyCancellable>()

    // Azure configuration
    private let baseURL = "https://your-azure-backend.azurewebsites.net/api"
    private let autoSyncInterval: TimeInterval = 300 // 5 minutes

    // Batch configuration
    private let maxBatchSize = 100
    private let maxRetries = 3

    // MARK: - Singleton
    static let shared = OBD2SyncService()

    private init() {
        loadOfflineQueue()
        startAutoSync()
    }

    // MARK: - Public Methods

    /// Upload OBD2 diagnostic data to Azure
    func syncDiagnosticData(_ data: [OBD2DataPoint], vehicleId: String) async throws {
        let payload = DiagnosticDataPayload(
            vehicleId: vehicleId,
            dataPoints: data,
            timestamp: Date()
        )

        do {
            try await uploadToAzure(endpoint: "/obd2/diagnostic-data", payload: payload)
            print("Synced \(data.count) diagnostic data points")
        } catch {
            // Add to offline queue
            queueForOfflineSync(payload)
            throw error
        }
    }

    /// Upload diagnostic trouble codes
    func syncDTCs(_ codes: [DiagnosticTroubleCode], vehicleId: String) async throws {
        let payload = DTCPayload(
            vehicleId: vehicleId,
            codes: codes,
            timestamp: Date()
        )

        do {
            try await uploadToAzure(endpoint: "/obd2/dtc-codes", payload: payload)
            print("Synced \(codes.count) DTC codes")
        } catch {
            queueForOfflineSync(payload)
            throw error
        }
    }

    /// Batch upload for offline data
    func syncOfflineQueue() async throws {
        guard !offlineQueue.isEmpty else {
            print("No offline data to sync")
            return
        }

        isSyncing = true
        defer { isSyncing = false }

        let batches = offlineQueue.chunked(into: maxBatchSize)
        var successCount = 0
        var failCount = 0

        for (index, batch) in batches.enumerated() {
            syncProgress = Double(index) / Double(batches.count)

            do {
                try await uploadBatch(batch)
                successCount += batch.count

                // Remove successful items from queue
                offlineQueue.removeAll { item in
                    batch.contains { $0.id == item.id }
                }

            } catch {
                failCount += batch.count
                print("Batch upload failed: \(error)")
            }
        }

        saveOfflineQueue()
        offlineQueueCount = offlineQueue.count
        syncProgress = 1.0

        print("Sync complete: \(successCount) succeeded, \(failCount) failed")
    }

    /// Upload data for fleet-wide analytics
    func uploadForFleetAnalytics(_ vehicleId: String, data: [OBD2DataPoint]) async throws {
        // Aggregate data for analytics
        let analytics = generateAnalytics(data: data)

        let payload = FleetAnalyticsPayload(
            vehicleId: vehicleId,
            analytics: analytics,
            timestamp: Date()
        )

        try await uploadToAzure(endpoint: "/fleet/analytics", payload: payload)
        print("Uploaded fleet analytics data")
    }

    /// Sync recording session
    func syncRecordingSession(_ session: RecordingSession) async throws {
        let payload = RecordingSessionPayload(
            session: session,
            timestamp: Date()
        )

        do {
            try await uploadToAzure(endpoint: "/obd2/recording-session", payload: payload)
            print("Synced recording session: \(session.name)")
        } catch {
            queueForOfflineSync(payload)
            throw error
        }
    }

    /// Sync maintenance predictions
    func syncMaintenancePredictions(_ predictions: [MaintenancePrediction], vehicleId: String) async throws {
        let payload = PredictionsPayload(
            vehicleId: vehicleId,
            predictions: predictions,
            timestamp: Date()
        )

        try await uploadToAzure(endpoint: "/maintenance/predictions", payload: payload)
        print("Synced \(predictions.count) maintenance predictions")
    }

    /// Sync driver behavior events
    func syncDriverBehavior(_ events: [DrivingEvent], driverId: String) async throws {
        let payload = DriverBehaviorPayload(
            driverId: driverId,
            events: events,
            timestamp: Date()
        )

        try await uploadToAzure(endpoint: "/safety/driver-behavior", payload: payload)
        print("Synced \(events.count) driving events")
    }

    // MARK: - Auto Sync

    private func startAutoSync() {
        autoSyncTimer = Timer.scheduledTimer(withTimeInterval: autoSyncInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                try? await self?.syncOfflineQueue()
            }
        }
    }

    func stopAutoSync() {
        autoSyncTimer?.invalidate()
        autoSyncTimer = nil
    }

    // MARK: - Network Operations

    private func uploadToAzure<T: Encodable>(endpoint: String, payload: T) async throws {
        guard let url = URL(string: baseURL + endpoint) else {
            throw SyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add authentication token
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Encode payload
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(payload)

        // Send request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SyncError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SyncError.serverError(httpResponse.statusCode)
        }

        lastSyncTime = Date()
    }

    private func uploadBatch(_ batch: [SyncItem]) async throws {
        let payload = BatchPayload(items: batch, timestamp: Date())

        try await uploadToAzure(endpoint: "/obd2/batch-upload", payload: payload)
    }

    // MARK: - Offline Queue Management

    private func queueForOfflineSync<T: Encodable>(_ data: T) {
        let item = SyncItem(
            id: UUID().uuidString,
            data: data,
            timestamp: Date(),
            retryCount: 0
        )

        offlineQueue.append(item)
        offlineQueueCount = offlineQueue.count
        saveOfflineQueue()

        print("Added item to offline sync queue. Queue size: \(offlineQueue.count)")
    }

    private func saveOfflineQueue() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        if let data = try? encoder.encode(offlineQueue) {
            UserDefaults.standard.set(data, forKey: "obd2SyncQueue")
        }
    }

    private func loadOfflineQueue() {
        guard let data = UserDefaults.standard.data(forKey: "obd2SyncQueue") else {
            return
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        if let queue = try? decoder.decode([SyncItem].self, from: data) {
            offlineQueue = queue
            offlineQueueCount = queue.count
        }
    }

    func clearOfflineQueue() {
        offlineQueue.removeAll()
        offlineQueueCount = 0
        saveOfflineQueue()
    }

    // MARK: - Analytics

    private func generateAnalytics(data: [OBD2DataPoint]) -> OBD2Analytics {
        let rpmData = data.filter { $0.pid == .rpm }.map { $0.value }
        let speedData = data.filter { $0.speed != nil }.compactMap { $0.speed }
        let fuelData = data.filter { $0.pid == .fuelLevel }.map { $0.value }

        return OBD2Analytics(
            averageRPM: rpmData.isEmpty ? 0 : rpmData.reduce(0, +) / Double(rpmData.count),
            maxRPM: rpmData.max() ?? 0,
            averageSpeed: speedData.isEmpty ? 0 : speedData.reduce(0, +) / Double(speedData.count),
            maxSpeed: speedData.max() ?? 0,
            averageFuelLevel: fuelData.isEmpty ? 0 : fuelData.reduce(0, +) / Double(fuelData.count),
            dataPointCount: data.count,
            timeRange: data.last?.timestamp.timeIntervalSince(data.first?.timestamp ?? Date()) ?? 0
        )
    }

    // MARK: - Helper Methods

    private func getAuthToken() -> String? {
        // Get auth token from Azure AD or keychain
        return nil // Implement authentication
    }
}

// MARK: - Sync Models

struct SyncItem: Codable, Identifiable {
    let id: String
    let data: Data
    let timestamp: Date
    var retryCount: Int

    init<T: Encodable>(id: String, data: T, timestamp: Date, retryCount: Int) {
        self.id = id
        self.timestamp = timestamp
        self.retryCount = retryCount

        // Encode data
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.data = (try? encoder.encode(data)) ?? Data()
    }
}

struct DiagnosticDataPayload: Codable {
    let vehicleId: String
    let dataPoints: [OBD2DataPoint]
    let timestamp: Date
}

struct DTCPayload: Codable {
    let vehicleId: String
    let codes: [DiagnosticTroubleCode]
    let timestamp: Date
}

struct FleetAnalyticsPayload: Codable {
    let vehicleId: String
    let analytics: OBD2Analytics
    let timestamp: Date
}

struct RecordingSessionPayload: Codable {
    let session: RecordingSession
    let timestamp: Date
}

struct PredictionsPayload: Codable {
    let vehicleId: String
    let predictions: [MaintenancePrediction]
    let timestamp: Date
}

struct DriverBehaviorPayload: Codable {
    let driverId: String
    let events: [DrivingEvent]
    let timestamp: Date
}

struct BatchPayload: Codable {
    let items: [SyncItem]
    let timestamp: Date
}

struct OBD2Analytics: Codable {
    let averageRPM: Double
    let maxRPM: Double
    let averageSpeed: Double
    let maxSpeed: Double
    let averageFuelLevel: Double
    let dataPointCount: Int
    let timeRange: TimeInterval
}

// MARK: - Sync Error

enum SyncError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(Int)
    case networkError
    case encodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL"
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let code):
            return "Server error: \(code)"
        case .networkError:
            return "Network connection failed"
        case .encodingFailed:
            return "Failed to encode data"
        }
    }
}

// MARK: - Array Extension
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0 ..< Swift.min($0 + size, count)])
        }
    }
}
