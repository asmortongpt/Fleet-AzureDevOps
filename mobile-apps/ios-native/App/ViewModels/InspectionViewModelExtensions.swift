/**
 * Inspection ViewModel Extensions
 * Enhanced capabilities for video, LiDAR, signatures, and offline support
 */

import Foundation
import SwiftUI
import CoreLocation
import Combine

// MARK: - Extended Inspection Models

struct InspectionVideo: Identifiable, Codable {
    let id: String
    let videoData: Data
    let thumbnailData: Data?
    let category: InspectionCategory
    let timestamp: Date
    let duration: TimeInterval
    let location: InspectionLocation?
    var notes: String?
}

struct InspectionLiDARScan: Identifiable, Codable {
    let id: String
    let scanData: Data
    let category: InspectionCategory
    let timestamp: Date
    let damageDetected: Int
    let location: InspectionLocation?
    var notes: String?
}

struct InspectionLocation: Codable {
    let latitude: Double
    let longitude: Double
    let address: String?
    let timestamp: Date
}

struct EnhancedVehicleInspection: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let inspectorName: String
    let inspectionDate: Date
    var status: InspectionStatus
    var items: [InspectionItem]
    var photos: [InspectionPhoto]
    var videos: [InspectionVideo]
    var lidarScans: [InspectionLiDARScan]
    var notes: String?
    var signatureData: Data?
    var mileageAtInspection: Double
    var location: InspectionLocation?
    var isOfflineQueued: Bool = false
    var syncedToServer: Bool = false

    var completionPercentage: Int {
        let completedItems = items.filter { $0.status != .pending }.count
        guard !items.isEmpty else { return 0 }
        return Int((Double(completedItems) / Double(items.count)) * 100)
    }

    var hasFailedItems: Bool {
        items.contains { $0.status == .failed }
    }

    var totalMediaCount: Int {
        photos.count + videos.count + lidarScans.count
    }
}

// MARK: - Inspection ViewModel Extensions

extension InspectionViewModel {

    // MARK: - Initialization with Location
    func setupLocationTracking() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        locationManager.delegate = self
    }

    func stopLocationTracking() {
        locationManager.stopUpdatingLocation()
    }

    // MARK: - Video Management
    func addVideo(_ media: InspectionMedia, category: InspectionCategory, notes: String? = nil) {
        guard media.type == .video else { return }

        let video = InspectionVideo(
            id: UUID().uuidString,
            videoData: media.data,
            thumbnailData: media.thumbnail,
            category: category,
            timestamp: media.timestamp,
            duration: 0, // Calculate from video metadata
            location: currentLocation != nil ? InspectionLocation(
                latitude: currentLocation!.coordinate.latitude,
                longitude: currentLocation!.coordinate.longitude,
                address: nil,
                timestamp: Date()
            ) : nil,
            notes: notes
        )

        inspectionVideos.append(video)

        // Save to disk
        _ = persistenceManager.saveInspectionVideo(video)
    }

    func deleteVideo(videoId: String) {
        inspectionVideos.removeAll { $0.id == videoId }
        persistenceManager.deleteInspectionVideo(videoId)
    }

    // MARK: - LiDAR Scan Management
    func addLiDARScan(_ media: InspectionMedia, category: InspectionCategory, notes: String? = nil) {
        guard media.type == .lidarScan else { return }

        // Parse scan data to count damage areas
        var damageCount = 0
        if let scanResult = try? JSONDecoder().decode(LiDARScanResult.self, from: media.data) {
            damageCount = scanResult.detectedDamage.count
        }

        let scan = InspectionLiDARScan(
            id: UUID().uuidString,
            scanData: media.data,
            category: category,
            timestamp: media.timestamp,
            damageDetected: damageCount,
            location: currentLocation != nil ? InspectionLocation(
                latitude: currentLocation!.coordinate.latitude,
                longitude: currentLocation!.coordinate.longitude,
                address: nil,
                timestamp: Date()
            ) : nil,
            notes: notes
        )

        lidarScans.append(scan)

        // Save to disk
        _ = persistenceManager.saveLiDARScan(scan)
    }

    func deleteLiDARScan(scanId: String) {
        lidarScans.removeAll { $0.id == scanId }
        persistenceManager.deleteLiDARScan(scanId)
    }

    // MARK: - Signature Management
    func setSignature(_ image: UIImage) {
        signatureImage = image
    }

    func clearSignature() {
        signatureImage = nil
    }

    // MARK: - Enhanced Completion
    func completeInspectionEnhanced(notes: String? = nil) async {
        guard var inspection = currentInspection else { return }

        // Convert signature to data
        var signatureData: Data? = nil
        if let signatureImage = signatureImage {
            signatureData = signatureImage.jpegData(compressionQuality: 0.8)
        }

        // Create enhanced inspection object
        let enhancedInspection = EnhancedVehicleInspection(
            id: inspection.id,
            vehicleId: inspection.vehicleId,
            inspectorName: inspection.inspectorName,
            inspectionDate: inspection.inspectionDate,
            status: inspectionItems.contains { $0.status == .failed } ? .failed : .completed,
            items: inspectionItems,
            photos: inspectionPhotos,
            videos: inspectionVideos,
            lidarScans: lidarScans,
            notes: notes,
            signatureData: signatureData,
            mileageAtInspection: inspection.mileageAtInspection,
            location: currentLocation != nil ? InspectionLocation(
                latitude: currentLocation!.coordinate.latitude,
                longitude: currentLocation!.coordinate.longitude,
                address: nil,
                timestamp: Date()
            ) : nil,
            isOfflineQueued: !NetworkMonitor.shared.isConnected,
            syncedToServer: false
        )

        // Save locally
        persistenceManager.saveEnhancedInspection(enhancedInspection)

        // Try to sync if online
        if NetworkMonitor.shared.isConnected {
            await syncInspectionToServer(enhancedInspection)
        } else {
            // Queue for offline sync
            queueInspectionForOfflineSync(enhancedInspection)
        }

        // Update current inspection
        inspection.status = enhancedInspection.status
        inspection.notes = notes
        inspection.items = inspectionItems
        inspection.photos = inspectionPhotos
        currentInspection = inspection
    }

    // MARK: - Server Sync
    private func syncInspectionToServer(_ inspection: EnhancedVehicleInspection) async {
        isLoading = true

        do {
            // Upload media files first
            var uploadedPhotoURLs: [String] = []
            var uploadedVideoURLs: [String] = []
            var uploadedScanURLs: [String] = []

            // Upload photos
            for photo in inspection.photos {
                if let url = try await uploadMediaToServer(
                    data: photo.imageData,
                    type: "photo",
                    inspectionId: inspection.id,
                    category: photo.category
                ) {
                    uploadedPhotoURLs.append(url)
                }
            }

            // Upload videos
            for video in inspection.videos {
                if let url = try await uploadMediaToServer(
                    data: video.videoData,
                    type: "video",
                    inspectionId: inspection.id,
                    category: video.category
                ) {
                    uploadedVideoURLs.append(url)
                }
            }

            // Upload LiDAR scans
            for scan in inspection.lidarScans {
                if let url = try await uploadMediaToServer(
                    data: scan.scanData,
                    type: "lidar",
                    inspectionId: inspection.id,
                    category: scan.category
                ) {
                    uploadedScanURLs.append(url)
                }
            }

            // Create inspection payload
            let payload: [String: Any] = [
                "id": inspection.id,
                "vehicleId": inspection.vehicleId,
                "inspectorName": inspection.inspectorName,
                "inspectionDate": ISO8601DateFormatter().string(from: inspection.inspectionDate),
                "status": inspection.status.rawValue,
                "items": inspection.items.map { item in
                    [
                        "id": item.id,
                        "category": item.category.rawValue,
                        "name": item.name,
                        "description": item.description,
                        "status": item.status.rawValue,
                        "notes": item.notes as Any
                    ]
                },
                "photoURLs": uploadedPhotoURLs,
                "videoURLs": uploadedVideoURLs,
                "scanURLs": uploadedScanURLs,
                "notes": inspection.notes as Any,
                "mileage": inspection.mileageAtInspection,
                "location": inspection.location != nil ? [
                    "latitude": inspection.location!.latitude,
                    "longitude": inspection.location!.longitude,
                    "timestamp": ISO8601DateFormatter().string(from: inspection.location!.timestamp)
                ] as Any : NSNull()
            ]

            // Submit inspection
            let _ = try await networkManager.performRequest(
                endpoint: "/api/inspections",
                method: .POST,
                body: payload,
                token: nil,
                responseType: [String: String].self
            )

            // Mark as synced
            var syncedInspection = inspection
            syncedInspection.syncedToServer = true
            syncedInspection.isOfflineQueued = false
            persistenceManager.saveEnhancedInspection(syncedInspection)

            isLoading = false

        } catch {
            errorMessage = "Failed to sync inspection: \(error.localizedDescription)"
            isLoading = false

            // Queue for retry
            queueInspectionForOfflineSync(inspection)
        }
    }

    private func uploadMediaToServer(
        data: Data,
        type: String,
        inspectionId: String,
        category: InspectionCategory
    ) async throws -> String? {
        // Implement multipart upload
        // This is a placeholder - actual implementation would use multipart form data
        let endpoint = "/api/inspections/\(inspectionId)/media/upload"

        // For now, return a mock URL
        return "https://fleet.blob.core.windows.net/inspections/\(inspectionId)/\(UUID().uuidString).\(type)"
    }

    // MARK: - Offline Queue
    private func queueInspectionForOfflineSync(_ inspection: EnhancedVehicleInspection) {
        var queuedInspection = inspection
        queuedInspection.isOfflineQueued = true
        queuedInspection.syncedToServer = false

        persistenceManager.saveEnhancedInspection(queuedInspection)
        persistenceManager.addToOfflineQueue(inspectionId: queuedInspection.id)
    }

    func syncOfflineInspections() async {
        guard NetworkMonitor.shared.isConnected else { return }

        let queuedInspections = persistenceManager.getQueuedInspections()

        for inspection in queuedInspections {
            await syncInspectionToServer(inspection)
        }
    }

    // MARK: - Media Handling
    func addMedia(_ media: InspectionMedia, category: InspectionCategory, notes: String? = nil) {
        switch media.type {
        case .photo:
            addPhoto(media.data, category: category, notes: notes)
        case .video:
            addVideo(media, category: category, notes: notes)
        case .lidarScan:
            addLiDARScan(media, category: category, notes: notes)
        }
    }

    // MARK: - Statistics
    func getTotalMediaCount() -> Int {
        return inspectionPhotos.count + inspectionVideos.count + lidarScans.count
    }

    func getMediaCount(for category: InspectionCategory) -> Int {
        let photoCount = inspectionPhotos.filter { $0.category == category }.count
        let videoCount = inspectionVideos.filter { $0.category == category }.count
        let scanCount = lidarScans.filter { $0.category == category }.count
        return photoCount + videoCount + scanCount
    }
}

// MARK: - CLLocationManagerDelegate
extension InspectionViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }
}

// MARK: - Network Monitor (Simple implementation)
class NetworkMonitor {
    static let shared = NetworkMonitor()

    var isConnected: Bool {
        // Simple check - in production, use NWPathMonitor
        return true
    }

    private init() {}
}

// MARK: - DataPersistenceManager Extensions
extension DataPersistenceManager {

    func saveInspectionVideo(_ video: InspectionVideo) -> Bool {
        // Save video to local storage
        let key = "inspection_video_\(video.id)"
        return saveToDisk(video, key: key)
    }

    func deleteInspectionVideo(_ videoId: String) {
        let key = "inspection_video_\(videoId)"
        deleteFromDisk(key: key)
    }

    func saveLiDARScan(_ scan: InspectionLiDARScan) -> Bool {
        let key = "lidar_scan_\(scan.id)"
        return saveToDisk(scan, key: key)
    }

    func deleteLiDARScan(_ scanId: String) {
        let key = "lidar_scan_\(scanId)"
        deleteFromDisk(key: key)
    }

    func saveEnhancedInspection(_ inspection: EnhancedVehicleInspection) {
        let key = "enhanced_inspection_\(inspection.id)"
        _ = saveToDisk(inspection, key: key)
    }

    func getEnhancedInspection(_ inspectionId: String) -> EnhancedVehicleInspection? {
        let key = "enhanced_inspection_\(inspectionId)"
        return loadFromDisk(key: key)
    }

    func addToOfflineQueue(inspectionId: String) {
        var queue = getOfflineQueue()
        if !queue.contains(inspectionId) {
            queue.append(inspectionId)
            UserDefaults.standard.set(queue, forKey: "offline_inspection_queue")
        }
    }

    func getOfflineQueue() -> [String] {
        return UserDefaults.standard.stringArray(forKey: "offline_inspection_queue") ?? []
    }

    func getQueuedInspections() -> [EnhancedVehicleInspection] {
        let queue = getOfflineQueue()
        return queue.compactMap { getEnhancedInspection($0) }
    }

    func removeFromOfflineQueue(inspectionId: String) {
        var queue = getOfflineQueue()
        queue.removeAll { $0 == inspectionId }
        UserDefaults.standard.set(queue, forKey: "offline_inspection_queue")
    }

    private func saveToDisk<T: Codable>(_ object: T, key: String) -> Bool {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(object)
            UserDefaults.standard.set(data, forKey: key)
            return true
        } catch {
            print("Save error: \(error)")
            return false
        }
    }

    private func loadFromDisk<T: Codable>(key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else {
            return nil
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            print("Load error: \(error)")
            return nil
        }
    }

    private func deleteFromDisk(key: String) {
        UserDefaults.standard.removeObject(forKey: key)
    }
}
