//
//  VINLicensePlateScanner.swift
//  Fleet Management
//
//  Comprehensive VIN and License Plate scanning using Vision framework
//

import Foundation
import AVFoundation
import Vision
import UIKit

// MARK: - Scan Types
enum ScanType {
    case vin
    case licensePlate
    case both

    var displayName: String {
        switch self {
        case .vin: return "VIN Number"
        case .licensePlate: return "License Plate"
        case .both: return "VIN or License Plate"
        }
    }
}

// MARK: - Scan Result
struct ScanResult: Identifiable {
    let id = UUID()
    let type: ScanType
    let text: String
    let confidence: Float
    let timestamp: Date
    let image: UIImage?

    var isValid: Bool {
        switch type {
        case .vin:
            return VINLicensePlateScanner.isValidVIN(text)
        case .licensePlate:
            return VINLicensePlateScanner.isValidLicensePlate(text)
        case .both:
            return VINLicensePlateScanner.isValidVIN(text) || VINLicensePlateScanner.isValidLicensePlate(text)
        }
    }
}

// MARK: - VIN & License Plate Scanner Service
@MainActor
class VINLicensePlateScanner: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var isScanning = false
    @Published var scannedResults: [ScanResult] = []
    @Published var currentResult: ScanResult?
    @Published var errorMessage: String?
    @Published var cameraPermissionGranted = false

    // MARK: - Private Properties
    private var captureSession: AVCaptureSession?
    private var videoPreviewLayer: AVCaptureVideoPreviewLayer?
    private var scanType: ScanType = .both
    private var textRecognitionRequest: VNRecognizeTextRequest?

    // MARK: - Singleton
    static let shared = VINLicensePlateScanner()

    // MARK: - Initialization
    override init() {
        super.init()
        setupTextRecognition()
    }

    // MARK: - Camera Setup
    func requestCameraPermission() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraPermissionGranted = true
            return true

        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            cameraPermissionGranted = granted
            return granted

        case .denied, .restricted:
            errorMessage = "Camera access denied. Please enable in Settings."
            cameraPermissionGranted = false
            return false

        @unknown default:
            errorMessage = "Unknown camera permission status"
            cameraPermissionGranted = false
            return false
        }
    }

    func setupCaptureSession(scanType: ScanType = .both) -> AVCaptureSession? {
        self.scanType = scanType

        let session = AVCaptureSession()
        session.sessionPreset = .high

        guard let videoCaptureDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            errorMessage = "Unable to access camera"
            return nil
        }

        do {
            let videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)

            if session.canAddInput(videoInput) {
                session.addInput(videoInput)
            } else {
                errorMessage = "Could not add video input"
                return nil
            }

            let videoOutput = AVCaptureVideoDataOutput()
            videoOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "videoQueue"))

            if session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)
            } else {
                errorMessage = "Could not add video output"
                return nil
            }

            captureSession = session
            return session

        } catch {
            errorMessage = "Error setting up camera: \(error.localizedDescription)"
            return nil
        }
    }

    // MARK: - Text Recognition Setup
    private func setupTextRecognition() {
        textRecognitionRequest = VNRecognizeTextRequest { [weak self] request, error in
            guard let self = self else { return }

            if let error = error {
                Task { @MainActor in
                    self.errorMessage = "Text recognition error: \(error.localizedDescription)"
                }
                return
            }

            guard let observations = request.results as? [VNRecognizedTextObservation] else { return }

            self.processTextObservations(observations)
        }

        textRecognitionRequest?.recognitionLevel = .accurate
        textRecognitionRequest?.recognitionLanguages = ["en-US"]
        textRecognitionRequest?.usesLanguageCorrection = false
    }

    // MARK: - Process Text Observations
    private func processTextObservations(_ observations: [VNRecognizedTextObservation]) {
        var detectedTexts: [(text: String, confidence: Float)] = []

        for observation in observations {
            guard let topCandidate = observation.topCandidates(1).first else { continue }

            let text = topCandidate.string.uppercased()
                .replacingOccurrences(of: " ", with: "")
                .replacingOccurrences(of: "-", with: "")

            detectedTexts.append((text, topCandidate.confidence))
        }

        // Process based on scan type
        Task { @MainActor in
            for (text, confidence) in detectedTexts {
                switch self.scanType {
                case .vin:
                    if Self.isValidVIN(text) {
                        self.addScanResult(type: .vin, text: text, confidence: confidence)
                    }

                case .licensePlate:
                    if Self.isValidLicensePlate(text) {
                        self.addScanResult(type: .licensePlate, text: text, confidence: confidence)
                    }

                case .both:
                    if Self.isValidVIN(text) {
                        self.addScanResult(type: .vin, text: text, confidence: confidence)
                    } else if Self.isValidLicensePlate(text) {
                        self.addScanResult(type: .licensePlate, text: text, confidence: confidence)
                    }
                }
            }
        }
    }

    // MARK: - Add Scan Result
    private func addScanResult(type: ScanType, text: String, confidence: Float) {
        // Avoid duplicates within 2 seconds
        if let lastResult = scannedResults.last,
           lastResult.text == text,
           Date().timeIntervalSince(lastResult.timestamp) < 2.0 {
            return
        }

        let result = ScanResult(
            type: type,
            text: text,
            confidence: confidence,
            timestamp: Date(),
            image: nil
        )

        scannedResults.append(result)
        currentResult = result

        // Provide haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    // MARK: - Scanning Control
    func startScanning(type: ScanType = .both) {
        scanType = type
        isScanning = true
        captureSession?.startRunning()
    }

    func stopScanning() {
        isScanning = false
        captureSession?.stopRunning()
    }

    func clearResults() {
        scannedResults.removeAll()
        currentResult = nil
        errorMessage = nil
    }

    // MARK: - Manual Image Processing
    func scanImage(_ image: UIImage, type: ScanType = .both) async -> [ScanResult] {
        self.scanType = type

        guard let cgImage = image.cgImage else { return [] }

        let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        var results: [ScanResult] = []

        let request = VNRecognizeTextRequest { request, error in
            guard error == nil,
                  let observations = request.results as? [VNRecognizedTextObservation] else {
                return
            }

            for observation in observations {
                guard let topCandidate = observation.topCandidates(1).first else { continue }

                let text = topCandidate.string.uppercased()
                    .replacingOccurrences(of: " ", with: "")
                    .replacingOccurrences(of: "-", with: "")

                let result: ScanResult?

                switch type {
                case .vin:
                    if Self.isValidVIN(text) {
                        result = ScanResult(type: .vin, text: text, confidence: topCandidate.confidence, timestamp: Date(), image: image)
                    } else {
                        result = nil
                    }

                case .licensePlate:
                    if Self.isValidLicensePlate(text) {
                        result = ScanResult(type: .licensePlate, text: text, confidence: topCandidate.confidence, timestamp: Date(), image: image)
                    } else {
                        result = nil
                    }

                case .both:
                    if Self.isValidVIN(text) {
                        result = ScanResult(type: .vin, text: text, confidence: topCandidate.confidence, timestamp: Date(), image: image)
                    } else if Self.isValidLicensePlate(text) {
                        result = ScanResult(type: .licensePlate, text: text, confidence: topCandidate.confidence, timestamp: Date(), image: image)
                    } else {
                        result = nil
                    }
                }

                if let result = result {
                    results.append(result)
                }
            }
        }

        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["en-US"]
        request.usesLanguageCorrection = false

        do {
            try requestHandler.perform([request])
        } catch {
            await MainActor.run {
                self.errorMessage = "Image processing error: \(error.localizedDescription)"
            }
        }

        return results
    }

    // MARK: - Validation Methods
    static func isValidVIN(_ text: String) -> Bool {
        // VIN must be exactly 17 characters
        guard text.count == 17 else { return false }

        // VIN uses alphanumeric characters except I, O, Q
        let vinPattern = "^[A-HJ-NPR-Z0-9]{17}$"
        let vinTest = NSPredicate(format: "SELF MATCHES %@", vinPattern)

        return vinTest.evaluate(with: text)
    }

    static func isValidLicensePlate(_ text: String) -> Bool {
        // License plates vary by state, typically 2-8 characters
        guard text.count >= 2 && text.count <= 8 else { return false }

        // Must contain at least one letter and one number (most common pattern)
        let hasLetter = text.rangeOfCharacter(from: .letters) != nil
        let hasNumber = text.rangeOfCharacter(from: .decimalDigits) != nil

        // Must be alphanumeric
        let alphanumericTest = text.rangeOfCharacter(from: CharacterSet.alphanumerics.inverted) == nil

        return alphanumericTest && (hasLetter || hasNumber)
    }

    // MARK: - VIN Decoder
    static func decodeVIN(_ vin: String) -> VINInfo? {
        guard isValidVIN(vin) else { return nil }

        // Basic VIN decoding (positions are 1-indexed in VIN standard)
        let wmi = String(vin.prefix(3)) // World Manufacturer Identifier
        let vds = String(vin.dropFirst(3).prefix(6)) // Vehicle Descriptor Section
        let vis = String(vin.suffix(8)) // Vehicle Identifier Section

        let year = decodeYear(vin)
        let manufacturer = decodeManufacturer(wmi)

        return VINInfo(
            vin: vin,
            wmi: wmi,
            vds: vds,
            vis: vis,
            year: year,
            manufacturer: manufacturer
        )
    }

    private static func decodeYear(_ vin: String) -> String {
        let index = vin.index(vin.startIndex, offsetBy: 9)
        let yearCode = String(vin[index])

        // Simplified year decoding (10th character)
        let yearMap: [Character: String] = [
            "A": "2010", "B": "2011", "C": "2012", "D": "2013", "E": "2014",
            "F": "2015", "G": "2016", "H": "2017", "J": "2018", "K": "2019",
            "L": "2020", "M": "2021", "N": "2022", "P": "2023", "R": "2024",
            "S": "2025", "T": "2026", "V": "2027", "W": "2028", "X": "2029",
            "Y": "2030"
        ]

        return yearMap[Character(yearCode)] ?? "Unknown"
    }

    private static func decodeManufacturer(_ wmi: String) -> String {
        // Simplified manufacturer lookup
        let manufacturers: [String: String] = [
            "1G1": "Chevrolet (USA)",
            "1FA": "Ford (USA)",
            "1FT": "Ford Truck (USA)",
            "1GB": "Chevrolet Truck (USA)",
            "1HC": "Honda (USA)",
            "1J4": "Jeep (USA)",
            "2T1": "Toyota (Canada)",
            "3VW": "Volkswagen (Mexico)",
            "4T1": "Toyota (USA)",
            "5N1": "Nissan (USA)",
            "JM1": "Mazda (Japan)",
            "KM8": "Hyundai (Korea)",
            "WBA": "BMW (Germany)",
            "WDB": "Mercedes-Benz (Germany)",
            "YV1": "Volvo (Sweden)"
        ]

        return manufacturers[wmi] ?? "Unknown Manufacturer"
    }
}

// MARK: - VIN Info
struct VINInfo {
    let vin: String
    let wmi: String // World Manufacturer Identifier
    let vds: String // Vehicle Descriptor Section
    let vis: String // Vehicle Identifier Section
    let year: String
    let manufacturer: String
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate
extension VINLicensePlateScanner: AVCaptureVideoDataOutputSampleBufferDelegate {
    nonisolated func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
              let request = textRecognitionRequest else { return }

        let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])

        do {
            try requestHandler.perform([request])
        } catch {
            print("Text recognition error: \(error)")
        }
    }
}
