import Foundation
import Vision
import UIKit

// MARK: - OCR Service
class OCRService {
    static let shared = OCRService()
    private init() {}

    func extractText(from image: UIImage) async throws -> String {
        guard let cgImage = image.cgImage else {
            throw OCRError.invalidImage
        }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: OCRError.recognitionFailed(error))
                    return
                }

                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    continuation.resume(throwing: OCRError.noTextFound)
                    return
                }

                let recognizedStrings = observations.compactMap { observation in
                    observation.topCandidates(1).first?.string
                }

                let fullText = recognizedStrings.joined(separator: "\n")
                continuation.resume(returning: fullText)
            }

            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: OCRError.processingFailed(error))
            }
        }
    }

    func extractInsuranceInfo(from image: UIImage) async throws -> InsuranceInfo {
        let text = try await extractText(from: image)
        var info = InsuranceInfo()
        // Parse insurance info from text
        return info
    }

    func extractRegistrationInfo(from image: UIImage) async throws -> RegistrationInfo {
        let text = try await extractText(from: image)
        var info = RegistrationInfo()
        // Parse registration info
        return info
    }

    func extractDriverLicense(from image: UIImage) async throws -> DriverLicenseInfo {
        let text = try await extractText(from: image)
        var info = DriverLicenseInfo()
        // Parse license info
        return info
    }

    func extractVIN(from image: UIImage) async throws -> String {
        let text = try await extractText(from: image)
        let pattern = "[A-HJ-NPR-Z0-9]{17}"
        if let regex = try? NSRegularExpression(pattern: pattern),
           let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
           let matchRange = Range(match.range, in: text) {
            return String(text[matchRange])
        }
        throw OCRError.vinNotFound
    }
}

struct InsuranceInfo: Codable {
    var policyNumber: String?
    var provider: String?
    var expirationDate: Date?
    var coverage: String?
}

struct RegistrationInfo: Codable {
    var plateNumber: String?
    var vin: String?
    var expirationDate: Date?
    var state: String?
}

struct DriverLicenseInfo: Codable {
    var licenseNumber: String?
    var name: String?
    var expirationDate: Date?
    var state: String?
    var licenseClass: String?
}

enum OCRError: LocalizedError {
    case invalidImage
    case recognitionFailed(Error)
    case processingFailed(Error)
    case noTextFound
    case vinNotFound

    var errorDescription: String? {
        switch self {
        case .invalidImage: return "Invalid image format"
        case .recognitionFailed(let error): return "Recognition failed: \(error.localizedDescription)"
        case .processingFailed(let error): return "Processing failed: \(error.localizedDescription)"
        case .noTextFound: return "No text found"
        case .vinNotFound: return "VIN not found"
        }
    }
}
