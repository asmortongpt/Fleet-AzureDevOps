/**
 * Receipt OCR Service
 * Uses Vision framework for text recognition from receipt images
 * Extracts merchant, amount, date, and category information
 */

import Foundation
import UIKit
import Vision
import CoreLocation

class ReceiptOCRService {
    static let shared = ReceiptOCRService()

    private init() {}

    // MARK: - Process Receipt
    func processReceipt(image: UIImage) async throws -> ReceiptOCRResults {
        guard let cgImage = image.cgImage else {
            throw OCRError.invalidImage
        }

        // Perform text recognition
        let recognizedText = try await recognizeText(from: cgImage)

        // Parse receipt data
        let results = parseReceiptData(from: recognizedText)

        return results
    }

    // MARK: - Text Recognition
    private func recognizeText(from image: CGImage) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
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

            // Configure request for best accuracy
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            // Perform request
            let handler = VNImageRequestHandler(cgImage: image, options: [:])

            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    // MARK: - Parse Receipt Data
    private func parseReceiptData(from text: String) -> ReceiptOCRResults {
        var date = ""
        var merchant = ""
        var totalAmount: Double = 0.0
        var category = "other"
        var confidenceScores: [String: Double] = [:]

        let lines = text.components(separatedBy: "\n")

        // Extract date
        if let detectedDate = extractDate(from: lines) {
            date = detectedDate.dateString
            confidenceScores["date"] = detectedDate.confidence
        }

        // Extract merchant (usually first line or near total)
        if let detectedMerchant = extractMerchant(from: lines) {
            merchant = detectedMerchant.value
            confidenceScores["merchant"] = detectedMerchant.confidence
        }

        // Extract total amount
        if let detectedAmount = extractAmount(from: lines) {
            totalAmount = detectedAmount.value
            confidenceScores["amount"] = detectedAmount.confidence
        }

        // Determine category
        let detectedCategory = determineCategory(from: text, merchant: merchant)
        category = detectedCategory.value
        confidenceScores["category"] = detectedCategory.confidence

        return ReceiptOCRResults(
            date: date,
            merchant: merchant,
            totalAmount: totalAmount,
            category: category,
            confidenceScores: confidenceScores
        )
    }

    // MARK: - Date Extraction
    private func extractDate(from lines: [String]) -> (dateString: String, confidence: Double)? {
        let dateFormatter = DateFormatter()
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")

        // Common date formats on receipts
        let dateFormats = [
            "MM/dd/yyyy",
            "MM-dd-yyyy",
            "dd/MM/yyyy",
            "yyyy-MM-dd",
            "MMM dd, yyyy",
            "MMM dd yyyy",
            "MM/dd/yy"
        ]

        for line in lines {
            for format in dateFormats {
                dateFormatter.dateFormat = format

                // Try to find date pattern in line
                let pattern = createDatePattern(for: format)
                if let regex = try? NSRegularExpression(pattern: pattern),
                   let match = regex.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)),
                   let range = Range(match.range, in: line) {

                    let dateString = String(line[range])
                    if let date = dateFormatter.date(from: dateString) {
                        dateFormatter.dateFormat = "yyyy-MM-dd"
                        return (dateFormatter.string(from: date), 0.9)
                    }
                }
            }
        }

        // Fallback: use today's date with low confidence
        dateFormatter.dateFormat = "yyyy-MM-dd"
        return (dateFormatter.string(from: Date()), 0.3)
    }

    private func createDatePattern(for format: String) -> String {
        var pattern = format
        pattern = pattern.replacingOccurrences(of: "yyyy", with: "\\d{4}")
        pattern = pattern.replacingOccurrences(of: "yy", with: "\\d{2}")
        pattern = pattern.replacingOccurrences(of: "MM", with: "\\d{1,2}")
        pattern = pattern.replacingOccurrences(of: "dd", with: "\\d{1,2}")
        pattern = pattern.replacingOccurrences(of: "MMM", with: "[A-Za-z]{3}")
        return pattern
    }

    // MARK: - Merchant Extraction
    private func extractMerchant(from lines: [String]) -> (value: String, confidence: Double)? {
        // Merchant is typically in the first few lines
        let candidateLines = Array(lines.prefix(5))

        for line in candidateLines {
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)

            // Skip very short lines or lines with numbers/symbols
            guard trimmed.count >= 3,
                  !trimmed.contains(where: { "0123456789$#".contains($0) }),
                  trimmed.range(of: "[A-Za-z]{3,}", options: .regularExpression) != nil else {
                continue
            }

            return (trimmed, 0.8)
        }

        return ("Unknown Merchant", 0.2)
    }

    // MARK: - Amount Extraction
    private func extractAmount(from lines: [String]) -> (value: Double, confidence: Double)? {
        // Look for patterns like "Total: $XX.XX", "TOTAL XX.XX", etc.
        let totalKeywords = ["total", "amount", "balance", "due"]

        var bestMatch: (value: Double, confidence: Double)?

        for line in lines {
            let lowercased = line.lowercased()

            // Check if line contains total keyword
            let hasKeyword = totalKeywords.contains { lowercased.contains($0) }

            // Extract all currency amounts from line
            let pattern = "\\$?\\d+\\.\\d{2}"
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)),
               let range = Range(match.range, in: line) {

                let amountString = String(line[range])
                    .replacingOccurrences(of: "$", with: "")

                if let amount = Double(amountString) {
                    let confidence = hasKeyword ? 0.95 : 0.6

                    // Prefer amounts with keywords and reasonable values
                    if bestMatch == nil || (hasKeyword && amount > 0 && amount < 10000) {
                        bestMatch = (amount, confidence)
                    }
                }
            }
        }

        return bestMatch ?? (0.0, 0.1)
    }

    // MARK: - Category Detection
    private func determineCategory(from text: String, merchant: String) -> (value: String, confidence: Double) {
        let lowercased = text.lowercased()
        let merchantLower = merchant.lowercased()

        // Fuel keywords
        let fuelKeywords = ["shell", "exxon", "chevron", "bp", "mobil", "valero", "fuel", "gas", "petrol", "diesel"]
        if fuelKeywords.contains(where: { merchantLower.contains($0) || lowercased.contains($0) }) {
            return ("fuel", 0.9)
        }

        // Maintenance keywords
        let maintenanceKeywords = ["auto", "repair", "service", "tire", "oil change", "mechanic", "parts"]
        if maintenanceKeywords.contains(where: { merchantLower.contains($0) || lowercased.contains($0) }) {
            return ("maintenance", 0.85)
        }

        // Parking keywords
        let parkingKeywords = ["parking", "park", "garage"]
        if parkingKeywords.contains(where: { lowercased.contains($0) }) {
            return ("parking", 0.9)
        }

        // Toll keywords
        let tollKeywords = ["toll", "turnpike", "ez pass", "ezpass"]
        if tollKeywords.contains(where: { lowercased.contains($0) }) {
            return ("toll", 0.9)
        }

        return ("other", 0.5)
    }
}

// MARK: - OCR Error
enum OCRError: Error, LocalizedError {
    case invalidImage
    case noTextFound
    case processingFailed

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Invalid image format"
        case .noTextFound:
            return "No text found in image"
        case .processingFailed:
            return "OCR processing failed"
        }
    }
}
