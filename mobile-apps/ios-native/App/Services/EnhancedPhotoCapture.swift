//
//  EnhancedPhotoCapture.swift
//  Fleet Management
//
//  Advanced photo capture service with OCR text recognition
//  For reading odometer, fuel gauge, VIN, and damage documentation
//

import Foundation
import UIKit
import CoreLocation
import Vision
import VisionKit

// MARK: - Photo Metadata

struct PhotoMetadata: Codable {
    let id: UUID
    let vehicleId: String?
    let photoType: PhotoCaptureType
    let timestamp: Date
    let location: CLLocationCoordinate2D?
    let recognizedText: String?
    let mileage: Int?
    let fuelLevel: Int?
    let notes: String?
    let fileName: String

    enum CodingKeys: String, CodingKey {
        case id, vehicleId, photoType, timestamp, recognizedText, mileage, fuelLevel, notes, fileName
        case latitude, longitude
    }

    init(id: UUID = UUID(), vehicleId: String?, photoType: PhotoCaptureType, timestamp: Date, location: CLLocationCoordinate2D?, recognizedText: String?, mileage: Int?, fuelLevel: Int?, notes: String?, fileName: String) {
        self.id = id
        self.vehicleId = vehicleId
        self.photoType = photoType
        self.timestamp = timestamp
        self.location = location
        self.recognizedText = recognizedText
        self.mileage = mileage
        self.fuelLevel = fuelLevel
        self.notes = notes
        self.fileName = fileName
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        vehicleId = try container.decodeIfPresent(String.self, forKey: .vehicleId)
        photoType = try container.decode(PhotoCaptureType.self, forKey: .photoType)
        timestamp = try container.decode(Date.self, forKey: .timestamp)
        recognizedText = try container.decodeIfPresent(String.self, forKey: .recognizedText)
        mileage = try container.decodeIfPresent(Int.self, forKey: .mileage)
        fuelLevel = try container.decodeIfPresent(Int.self, forKey: .fuelLevel)
        notes = try container.decodeIfPresent(String.self, forKey: .notes)
        fileName = try container.decode(String.self, forKey: .fileName)

        // Decode location if present
        if let lat = try container.decodeIfPresent(Double.self, forKey: .latitude),
           let lon = try container.decodeIfPresent(Double.self, forKey: .longitude) {
            location = CLLocationCoordinate2D(latitude: lat, longitude: lon)
        } else {
            location = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(vehicleId, forKey: .vehicleId)
        try container.encode(photoType, forKey: .photoType)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encodeIfPresent(recognizedText, forKey: .recognizedText)
        try container.encodeIfPresent(mileage, forKey: .mileage)
        try container.encodeIfPresent(fuelLevel, forKey: .fuelLevel)
        try container.encodeIfPresent(notes, forKey: .notes)
        try container.encode(fileName, forKey: .fileName)

        // Encode location if present
        if let location = location {
            try container.encode(location.latitude, forKey: .latitude)
            try container.encode(location.longitude, forKey: .longitude)
        }
    }
}

// MARK: - Photo Capture Types

enum PhotoCaptureType: String, Codable, CaseIterable {
    case odometer
    case fuelGauge
    case damage
    case vin
    case inspection
    case maintenance
    case general

    var title: String {
        switch self {
        case .odometer:
            return "Odometer Reading"
        case .fuelGauge:
            return "Fuel Gauge"
        case .damage:
            return "Damage Documentation"
        case .vin:
            return "VIN Number"
        case .inspection:
            return "Vehicle Inspection"
        case .maintenance:
            return "Maintenance Record"
        case .general:
            return "General Photo"
        }
    }

    var icon: String {
        switch self {
        case .odometer:
            return "speedometer"
        case .fuelGauge:
            return "fuelpump.fill"
        case .damage:
            return "exclamationmark.triangle.fill"
        case .vin:
            return "barcode.viewfinder"
        case .inspection:
            return "checkmark.shield.fill"
        case .maintenance:
            return "wrench.and.screwdriver.fill"
        case .general:
            return "camera.fill"
        }
    }

    var requiresOCR: Bool {
        switch self {
        case .odometer, .fuelGauge, .vin:
            return true
        case .damage, .inspection, .maintenance, .general:
            return false
        }
    }
}

// MARK: - Enhanced Photo Capture Service

@MainActor
class EnhancedPhotoCaptureService: ObservableObject {

    // MARK: - Singleton
    static let shared = EnhancedPhotoCaptureService()

    // MARK: - Published Properties
    @Published var isProcessing: Bool = false
    @Published var processingProgress: Double = 0.0
    @Published var lastError: String?

    // MARK: - Private Properties
    private let fileManager = FileManager.default
    private var photosDirectory: URL {
        let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let photosURL = documentsURL.appendingPathComponent("VehiclePhotos", isDirectory: true)

        // Create directory if it doesn't exist
        if !fileManager.fileExists(atPath: photosURL.path) {
            try? fileManager.createDirectory(at: photosURL, withIntermediateDirectories: true)
        }

        return photosURL
    }

    private init() {}

    // MARK: - Public Methods

    /// Capture and process photo with OCR if needed
    func capturePhoto(
        image: UIImage,
        vehicleId: String?,
        photoType: PhotoCaptureType,
        location: CLLocation?,
        notes: String? = nil
    ) async -> PhotoMetadata? {

        await MainActor.run {
            isProcessing = true
            processingProgress = 0.1
            lastError = nil
        }

        // Generate filename
        let fileName = generateFileName(vehicleId: vehicleId, photoType: photoType)
        let fileURL = photosDirectory.appendingPathComponent(fileName)

        // Save image to disk
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            await MainActor.run {
                lastError = "Failed to compress image"
                isProcessing = false
            }
            return nil
        }

        do {
            try imageData.write(to: fileURL)
            await MainActor.run { processingProgress = 0.3 }
            print("✅ Photo saved: \(fileName)")
        } catch {
            await MainActor.run {
                lastError = "Failed to save photo: \(error.localizedDescription)"
                isProcessing = false
            }
            return nil
        }

        // Perform OCR if required
        var recognizedText: String?
        var mileage: Int?
        var fuelLevel: Int?

        if photoType.requiresOCR {
            recognizedText = await performOCR(on: image)
            await MainActor.run { processingProgress = 0.7 }

            // Extract specific data based on photo type
            switch photoType {
            case .odometer:
                mileage = extractMileage(from: recognizedText)
            case .fuelGauge:
                fuelLevel = extractFuelLevel(from: recognizedText)
            case .vin:
                // VIN is the recognized text
                break
            default:
                break
            }
        }

        await MainActor.run { processingProgress = 0.9 }

        // Create metadata
        let metadata = PhotoMetadata(
            vehicleId: vehicleId,
            photoType: photoType,
            timestamp: Date(),
            location: location?.coordinate,
            recognizedText: recognizedText,
            mileage: mileage,
            fuelLevel: fuelLevel,
            notes: notes,
            fileName: fileName
        )

        // Save metadata
        saveMetadata(metadata)

        await MainActor.run {
            processingProgress = 1.0
            isProcessing = false
        }

        print("✅ Photo processed: \(photoType.title)")
        if let text = recognizedText {
            print("   Recognized text: \(text)")
        }
        if let miles = mileage {
            print("   Mileage: \(miles)")
        }
        if let fuel = fuelLevel {
            print("   Fuel level: \(fuel)%")
        }

        return metadata
    }

    /// Load photo from disk
    func loadPhoto(metadata: PhotoMetadata) -> UIImage? {
        let fileURL = photosDirectory.appendingPathComponent(metadata.fileName)

        guard let imageData = try? Data(contentsOf: fileURL),
              let image = UIImage(data: imageData) else {
            print("❌ Failed to load photo: \(metadata.fileName)")
            return nil
        }

        return image
    }

    /// Get all photos for a vehicle
    func getPhotos(for vehicleId: String) -> [PhotoMetadata] {
        let allMetadata = loadAllMetadata()
        return allMetadata.filter { $0.vehicleId == vehicleId }
    }

    /// Get photos by type
    func getPhotos(for vehicleId: String, type: PhotoCaptureType) -> [PhotoMetadata] {
        let allMetadata = loadAllMetadata()
        return allMetadata.filter { $0.vehicleId == vehicleId && $0.photoType == type }
    }

    /// Delete photo
    func deletePhoto(metadata: PhotoMetadata) -> Bool {
        let fileURL = photosDirectory.appendingPathComponent(metadata.fileName)

        do {
            try fileManager.removeItem(at: fileURL)
            deleteMetadata(metadata)
            print("✅ Deleted photo: \(metadata.fileName)")
            return true
        } catch {
            print("❌ Failed to delete photo: \(error.localizedDescription)")
            return false
        }
    }

    // MARK: - OCR Processing

    private func performOCR(on image: UIImage) async -> String? {
        guard let cgImage = image.cgImage else {
            print("❌ Failed to get CGImage for OCR")
            return nil
        }

        return await withCheckedContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    print("❌ OCR error: \(error.localizedDescription)")
                    continuation.resume(returning: nil)
                    return
                }

                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    continuation.resume(returning: nil)
                    return
                }

                let recognizedStrings = observations.compactMap { observation in
                    observation.topCandidates(1).first?.string
                }

                let fullText = recognizedStrings.joined(separator: " ")
                print("📝 OCR recognized: \(fullText)")
                continuation.resume(returning: fullText.isEmpty ? nil : fullText)
            }

            // Configure for accurate text recognition
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

            do {
                try handler.perform([request])
            } catch {
                print("❌ Failed to perform OCR: \(error.localizedDescription)")
                continuation.resume(returning: nil)
            }
        }
    }

    // MARK: - Data Extraction

    private func extractMileage(from text: String?) -> Int? {
        guard let text = text else { return nil }

        // Look for patterns like "123456", "123,456", "123 456"
        let pattern = #"(\d[\d,\s]{2,8}\d)"#

        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) else {
            return nil
        }

        if let range = Range(match.range, in: text) {
            let mileageString = String(text[range])
                .replacingOccurrences(of: ",", with: "")
                .replacingOccurrences(of: " ", with: "")

            if let mileage = Int(mileageString), mileage > 0 && mileage < 1_000_000 {
                return mileage
            }
        }

        return nil
    }

    private func extractFuelLevel(from text: String?) -> Int? {
        guard let text = text else { return nil }

        // Look for percentages or fractions
        let patterns = [
            #"(\d{1,3})\s*%"#,           // "75%"
            #"(\d{1,3})\s*/\s*100"#,     // "75/100"
            #"(\d{1,3})\s*percent"#      // "75 percent"
        ]

        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
                  let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
                  match.numberOfRanges > 1 else {
                continue
            }

            if let range = Range(match.range(at: 1), in: text),
               let level = Int(String(text[range])),
               level >= 0 && level <= 100 {
                return level
            }
        }

        return nil
    }

    // MARK: - File Management

    private func generateFileName(vehicleId: String?, photoType: PhotoCaptureType) -> String {
        let timestamp = ISO8601DateFormatter().string(from: Date())
            .replacingOccurrences(of: ":", with: "-")

        let vehiclePrefix = vehicleId ?? "unknown"
        return "\(vehiclePrefix)_\(photoType.rawValue)_\(timestamp).jpg"
    }

    private func saveMetadata(_ metadata: PhotoMetadata) {
        var allMetadata = loadAllMetadata()
        allMetadata.append(metadata)

        let metadataURL = photosDirectory.appendingPathComponent("metadata.json")

        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(allMetadata)
            try data.write(to: metadataURL)
        } catch {
            print("❌ Failed to save metadata: \(error.localizedDescription)")
        }
    }

    private func loadAllMetadata() -> [PhotoMetadata] {
        let metadataURL = photosDirectory.appendingPathComponent("metadata.json")

        guard let data = try? Data(contentsOf: metadataURL) else {
            return []
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode([PhotoMetadata].self, from: data)
        } catch {
            print("❌ Failed to load metadata: \(error.localizedDescription)")
            return []
        }
    }

    private func deleteMetadata(_ metadata: PhotoMetadata) {
        var allMetadata = loadAllMetadata()
        allMetadata.removeAll { $0.id == metadata.id }

        let metadataURL = photosDirectory.appendingPathComponent("metadata.json")

        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(allMetadata)
            try data.write(to: metadataURL)
        } catch {
            print("❌ Failed to update metadata: \(error.localizedDescription)")
        }
    }
}
