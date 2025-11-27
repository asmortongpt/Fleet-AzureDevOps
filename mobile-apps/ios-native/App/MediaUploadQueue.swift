/**
 * Media Upload Queue
 * Handles offline storage and background upload of photos, videos, and LiDAR scans
 * Queues media when offline and uploads when connection restored
 */

import Foundation
import UIKit
import CoreData

// MARK: - Media Upload Queue
class MediaUploadQueue: ObservableObject {
    static let shared = MediaUploadQueue()

    @Published var queuedItems: [QueuedMediaItem] = []
    @Published var uploadProgress: [UUID: Double] = [:]
    @Published var isUploading = false

    private let fileManager = FileManager.default
    private let userDefaults = UserDefaults.standard
    private let queueKey = "com.fleet.mediaUploadQueue"

    private var uploadTask: Task<Void, Never>?

    private init() {
        loadQueue()
    }

    // MARK: - Queue Management

    /// Add photo to upload queue
    func queuePhoto(_ photo: CapturedPhoto, vehicleId: String) {
        let item = QueuedMediaItem(
            id: UUID(),
            type: .photo,
            vehicleId: vehicleId,
            timestamp: Date(),
            metadata: [
                "photoType": photo.photoType.title,
                "location": photo.location ?? "",
                "notes": photo.notes ?? ""
            ]
        )

        // Save image to local storage
        if let imageData = photo.image.jpegData(compressionQuality: 0.8) {
            saveToLocalStorage(data: imageData, for: item.id, type: "photo")
            queuedItems.append(item)
            saveQueue()

            // Attempt upload if online
            startUploadIfNeeded()
        }
    }

    /// Add video to upload queue
    func queueVideo(url: URL, vehicleId: String, metadata: [String: String] = [:]) {
        let item = QueuedMediaItem(
            id: UUID(),
            type: .video,
            vehicleId: vehicleId,
            timestamp: Date(),
            metadata: metadata
        )

        // Copy video to local storage
        if let videoData = try? Data(contentsOf: url) {
            saveToLocalStorage(data: videoData, for: item.id, type: "video")
            queuedItems.append(item)
            saveQueue()

            // Attempt upload if online
            startUploadIfNeeded()
        }
    }

    /// Add LiDAR scan to upload queue
    func queueLiDARScan(data: Data, vehicleId: String, format: String, metadata: [String: String] = [:]) {
        var combinedMetadata = metadata
        combinedMetadata["format"] = format

        let item = QueuedMediaItem(
            id: UUID(),
            type: .lidarScan,
            vehicleId: vehicleId,
            timestamp: Date(),
            metadata: combinedMetadata
        )

        saveToLocalStorage(data: data, for: item.id, type: "lidar")
        queuedItems.append(item)
        saveQueue()

        // Attempt upload if online
        startUploadIfNeeded()
    }

    /// Add receipt to upload queue
    func queueReceipt(image: UIImage, ocrResults: ReceiptOCRResults, metadata: [String: String] = [:]) {
        var combinedMetadata = metadata
        combinedMetadata["merchant"] = ocrResults.merchant
        combinedMetadata["amount"] = String(ocrResults.totalAmount)
        combinedMetadata["date"] = ocrResults.date
        combinedMetadata["category"] = ocrResults.category

        let item = QueuedMediaItem(
            id: UUID(),
            type: .receipt,
            vehicleId: metadata["vehicleId"] ?? "",
            timestamp: Date(),
            metadata: combinedMetadata
        )

        if let imageData = image.jpegData(compressionQuality: 0.8) {
            saveToLocalStorage(data: imageData, for: item.id, type: "receipt")
            queuedItems.append(item)
            saveQueue()

            // Attempt upload if online
            startUploadIfNeeded()
        }
    }

    // MARK: - Upload Processing

    private func startUploadIfNeeded() {
        guard !isUploading, !queuedItems.isEmpty else {
            return
        }

        // Check network connectivity
        guard NetworkMonitor.shared.isConnected else {
            print("Offline - media queued for later upload")
            return
        }

        uploadTask = Task {
            await processQueue()
        }
    }

    @MainActor
    private func processQueue() async {
        isUploading = true

        var itemsToRemove: [UUID] = []

        for item in queuedItems {
            do {
                // Load data from local storage
                guard let data = loadFromLocalStorage(for: item.id, type: item.type.fileExtension) else {
                    print("Failed to load data for item \(item.id)")
                    itemsToRemove.append(item.id)
                    continue
                }

                // Upload to server
                uploadProgress[item.id] = 0.0

                let url = try await uploadMediaToServer(data: data, item: item)

                uploadProgress[item.id] = 1.0
                print("Uploaded \(item.type) successfully: \(url)")

                // Mark for removal
                itemsToRemove.append(item.id)

                // Delete local file
                deleteFromLocalStorage(for: item.id, type: item.type.fileExtension)

            } catch {
                print("Upload failed for item \(item.id): \(error.localizedDescription)")
                uploadProgress[item.id] = nil
            }
        }

        // Remove uploaded items
        queuedItems.removeAll { itemsToRemove.contains($0.id) }
        saveQueue()

        isUploading = false
    }

    private func uploadMediaToServer(data: Data, item: QueuedMediaItem) async throws -> String {
        // In production, use ImageUploadService or APIService
        // This is a placeholder implementation

        // Simulate network delay
        try await Task.sleep(nanoseconds: 2_000_000_000)

        // Call appropriate API endpoint
        let endpoint: String
        switch item.type {
        case .photo:
            endpoint = "/vehicles/\(item.vehicleId)/photos"
        case .video:
            endpoint = "/vehicles/\(item.vehicleId)/videos"
        case .lidarScan:
            endpoint = "/vehicles/\(item.vehicleId)/scans"
        case .receipt:
            endpoint = "/receipts"
        case .damageReport:
            endpoint = "/damage-reports"
        }

        // Simulate successful upload
        return "https://storage.azure.com/fleet/\(item.id.uuidString)"
    }

    // MARK: - Local Storage

    private func saveToLocalStorage(data: Data, for id: UUID, type: String) {
        let url = getLocalStorageURL(for: id, type: type)

        do {
            // Create directory if needed
            let directory = url.deletingLastPathComponent()
            try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)

            // Write data
            try data.write(to: url)
        } catch {
            print("Failed to save to local storage: \(error)")
        }
    }

    private func loadFromLocalStorage(for id: UUID, type: String) -> Data? {
        let url = getLocalStorageURL(for: id, type: type)
        return try? Data(contentsOf: url)
    }

    private func deleteFromLocalStorage(for id: UUID, type: String) {
        let url = getLocalStorageURL(for: id, type: type)
        try? fileManager.removeItem(at: url)
    }

    private func getLocalStorageURL(for id: UUID, type: String) -> URL {
        let directory = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let mediaDirectory = directory.appendingPathComponent("QueuedMedia", isDirectory: true)
        return mediaDirectory.appendingPathComponent("\(id.uuidString).\(type)")
    }

    // MARK: - Queue Persistence

    private func saveQueue() {
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(queuedItems) {
            userDefaults.set(encoded, forKey: queueKey)
        }
    }

    private func loadQueue() {
        guard let data = userDefaults.data(forKey: queueKey),
              let items = try? JSONDecoder().decode([QueuedMediaItem].self, from: data) else {
            return
        }

        queuedItems = items
    }

    // MARK: - Queue Info

    var queuedCount: Int {
        queuedItems.count
    }

    var totalQueueSize: Int64 {
        var size: Int64 = 0

        for item in queuedItems {
            let url = getLocalStorageURL(for: item.id, type: item.type.fileExtension)
            if let attributes = try? fileManager.attributesOfItem(atPath: url.path),
               let fileSize = attributes[.size] as? Int64 {
                size += fileSize
            }
        }

        return size
    }

    var queuedCountByType: [MediaType: Int] {
        var counts: [MediaType: Int] = [:]

        for item in queuedItems {
            counts[item.type, default: 0] += 1
        }

        return counts
    }

    // MARK: - Manual Actions

    func retryAll() {
        startUploadIfNeeded()
    }

    func clearQueue() {
        // Delete all local files
        for item in queuedItems {
            deleteFromLocalStorage(for: item.id, type: item.type.fileExtension)
        }

        queuedItems.removeAll()
        uploadProgress.removeAll()
        saveQueue()
    }

    func removeItem(_ id: UUID) {
        if let item = queuedItems.first(where: { $0.id == id }) {
            deleteFromLocalStorage(for: item.id, type: item.type.fileExtension)
            queuedItems.removeAll { $0.id == id }
            uploadProgress.removeValue(forKey: id)
            saveQueue()
        }
    }
}

// MARK: - Queued Media Item
struct QueuedMediaItem: Identifiable, Codable {
    let id: UUID
    let type: MediaType
    let vehicleId: String
    let timestamp: Date
    let metadata: [String: String]

    var displayName: String {
        "\(type.rawValue.capitalized) - \(timestamp.formatted(.dateTime.month().day().hour().minute()))"
    }

    var sizeDescription: String {
        // Calculate from local storage
        return "Unknown"
    }
}

// MARK: - Media Type
enum MediaType: String, Codable {
    case photo
    case video
    case lidarScan
    case receipt
    case damageReport

    var fileExtension: String {
        switch self {
        case .photo, .receipt:
            return "jpg"
        case .video:
            return "mp4"
        case .lidarScan:
            return "usdz"
        case .damageReport:
            return "json"
        }
    }

    var iconName: String {
        switch self {
        case .photo:
            return "photo"
        case .video:
            return "video"
        case .lidarScan:
            return "cube"
        case .receipt:
            return "doc.text"
        case .damageReport:
            return "exclamationmark.triangle"
        }
    }
}
