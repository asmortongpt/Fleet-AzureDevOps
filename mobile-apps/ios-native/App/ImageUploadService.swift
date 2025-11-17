/**
 * Image Upload Service for Fleet Management
 * Handles image compression, upload to backend, and retry logic
 * Supports batch uploads and progress tracking
 */

import Foundation
import UIKit
import CoreLocation

// MARK: - Image Upload Service
class ImageUploadService: ObservableObject {
    @Published var uploadProgress: [UUID: Double] = [:]
    @Published var uploadStatus: [UUID: UploadStatus] = [:]

    private let session: URLSession
    private let maxRetries = 3
    private let compressionQuality: CGFloat = 0.7
    private let maxImageDimension: CGFloat = 2048

    init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 60
        configuration.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Upload Single Image
    func uploadImage(
        _ photo: CapturedPhoto,
        vehicleId: String,
        token: String
    ) async throws -> UploadResult {

        // Compress image
        guard let compressedData = compressImage(photo.image) else {
            throw UploadError.compressionFailed
        }

        // Update progress
        await MainActor.run {
            uploadProgress[photo.id] = 0.0
            uploadStatus[photo.id] = .uploading
        }

        // Create upload request
        let endpoint = "\(APIConfiguration.apiBaseURL)/vehicles/\(vehicleId)/photos"
        guard let url = URL(string: endpoint) else {
            throw UploadError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        // Create multipart form data
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        let httpBody = createMultipartBody(
            imageData: compressedData,
            photo: photo,
            boundary: boundary
        )

        request.httpBody = httpBody

        // Perform upload with retry
        return try await performUploadWithRetry(request: request, photoId: photo.id)
    }

    // MARK: - Upload Multiple Images
    func uploadImages(
        _ photos: [CapturedPhoto],
        vehicleId: String,
        token: String
    ) async throws -> [UploadResult] {

        var results: [UploadResult] = []

        for photo in photos {
            do {
                let result = try await uploadImage(photo, vehicleId: vehicleId, token: token)
                results.append(result)

                await MainActor.run {
                    uploadStatus[photo.id] = .completed
                }

            } catch {
                await MainActor.run {
                    uploadStatus[photo.id] = .failed(error.localizedDescription)
                }

                results.append(UploadResult(
                    photoId: photo.id,
                    success: false,
                    url: nil,
                    error: error.localizedDescription
                ))
            }
        }

        return results
    }

    // MARK: - Image Compression
    private func compressImage(_ image: UIImage) -> Data? {
        var compressedImage = image

        // Resize if needed
        if image.size.width > maxImageDimension || image.size.height > maxImageDimension {
            let scale = maxImageDimension / max(image.size.width, image.size.height)
            let newSize = CGSize(
                width: image.size.width * scale,
                height: image.size.height * scale
            )

            UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
            image.draw(in: CGRect(origin: .zero, size: newSize))
            compressedImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
            UIGraphicsEndImageContext()
        }

        // Compress to JPEG
        return compressedImage.jpegData(compressionQuality: compressionQuality)
    }

    // MARK: - Multipart Form Data
    private func createMultipartBody(
        imageData: Data,
        photo: CapturedPhoto,
        boundary: String
    ) -> Data {

        var body = Data()
        let lineBreak = "\r\n"

        // Add image data
        body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"photo_\(photo.id).jpg\"\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\(lineBreak)\(lineBreak)".data(using: .utf8)!)
        body.append(imageData)
        body.append(lineBreak.data(using: .utf8)!)

        // Add metadata
        if let vehicleId = photo.vehicleId {
            body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"vehicleId\"\(lineBreak)\(lineBreak)".data(using: .utf8)!)
            body.append("\(vehicleId)\(lineBreak)".data(using: .utf8)!)
        }

        // Add photo type
        body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photoType\"\(lineBreak)\(lineBreak)".data(using: .utf8)!)
        body.append("\(photo.photoType.title)\(lineBreak)".data(using: .utf8)!)

        // Add timestamp
        body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"timestamp\"\(lineBreak)\(lineBreak)".data(using: .utf8)!)
        body.append("\(ISO8601DateFormatter().string(from: photo.timestamp))\(lineBreak)".data(using: .utf8)!)

        // Add location if available
        if let location = photo.location {
            body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"location\"\(lineBreak)\(lineBreak)".data(using: .utf8)!)
            body.append("\(location)\(lineBreak)".data(using: .utf8)!)
        }

        // Add notes if available
        if let notes = photo.notes {
            body.append("--\(boundary)\(lineBreak)".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"notes\"\(lineBreak)\(lineBreak)".data(using: .utf8)!)
            body.append("\(notes)\(lineBreak)".data(using: .utf8)!)
        }

        // End boundary
        body.append("--\(boundary)--\(lineBreak)".data(using: .utf8)!)

        return body
    }

    // MARK: - Upload with Retry
    private func performUploadWithRetry(
        request: URLRequest,
        photoId: UUID,
        attempt: Int = 1
    ) async throws -> UploadResult {

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw UploadError.invalidResponse
            }

            // Update progress
            await MainActor.run {
                uploadProgress[photoId] = 1.0
            }

            // Handle response
            switch httpResponse.statusCode {
            case 200...299:
                let result = try JSONDecoder().decode(UploadResponse.self, from: data)
                return UploadResult(
                    photoId: photoId,
                    success: true,
                    url: result.url,
                    error: nil
                )

            case 401:
                throw UploadError.unauthorized

            case 413:
                throw UploadError.fileTooLarge

            case 500...599:
                // Retry on server errors
                if attempt < maxRetries {
                    try await Task.sleep(nanoseconds: UInt64(attempt * 1_000_000_000))
                    return try await performUploadWithRetry(
                        request: request,
                        photoId: photoId,
                        attempt: attempt + 1
                    )
                }
                throw UploadError.serverError

            default:
                throw UploadError.uploadFailed("HTTP \(httpResponse.statusCode)")
            }

        } catch let error as UploadError {
            throw error
        } catch {
            // Retry on network errors
            if attempt < maxRetries {
                try await Task.sleep(nanoseconds: UInt64(attempt * 1_000_000_000))
                return try await performUploadWithRetry(
                    request: request,
                    photoId: photoId,
                    attempt: attempt + 1
                )
            }
            throw UploadError.networkError(error.localizedDescription)
        }
    }

    // MARK: - Clear Progress
    func clearProgress(for photoId: UUID) {
        uploadProgress.removeValue(forKey: photoId)
        uploadStatus.removeValue(forKey: photoId)
    }
}

// MARK: - Upload Status
enum UploadStatus {
    case pending
    case uploading
    case completed
    case failed(String)

    var description: String {
        switch self {
        case .pending: return "Pending"
        case .uploading: return "Uploading..."
        case .completed: return "Completed"
        case .failed(let error): return "Failed: \(error)"
        }
    }
}

// MARK: - Upload Result
struct UploadResult {
    let photoId: UUID
    let success: Bool
    let url: String?
    let error: String?
}

// MARK: - Upload Response
struct UploadResponse: Codable {
    let url: String
    let id: String
    let vehicleId: String
    let timestamp: String
}

// MARK: - Upload Error
enum UploadError: Error, LocalizedError {
    case compressionFailed
    case invalidURL
    case invalidResponse
    case unauthorized
    case fileTooLarge
    case serverError
    case uploadFailed(String)
    case networkError(String)

    var errorDescription: String? {
        switch self {
        case .compressionFailed:
            return "Failed to compress image"
        case .invalidURL:
            return "Invalid upload URL"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .fileTooLarge:
            return "File too large. Maximum size exceeded."
        case .serverError:
            return "Server error. Please try again."
        case .uploadFailed(let message):
            return "Upload failed: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        }
    }
}
