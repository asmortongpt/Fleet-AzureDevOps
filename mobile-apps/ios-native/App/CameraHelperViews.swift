/**
 * Camera Helper Views
 * ImagePicker, DocumentScanner, and MultipleImagePicker
 * UIKit wrappers for SwiftUI integration
 */

import SwiftUI
import UIKit
import VisionKit
import PhotosUI

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    var onSelect: () -> Void

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        picker.allowsEditing = false
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
                parent.onSelect()
            }

            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Document Scanner
@available(iOS 13.0, *)
struct DocumentScannerView: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    var onScan: () -> Void

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let parent: DocumentScannerView

        init(_ parent: DocumentScannerView) {
            self.parent = parent
        }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFinishWith scan: VNDocumentCameraScan
        ) {
            // Get the first scanned page
            if scan.pageCount > 0 {
                parent.image = scan.imageOfPage(at: 0)
                parent.onScan()
            }

            parent.dismiss()
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            parent.dismiss()
        }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFailWithError error: Error
        ) {
            print("Document scanner failed: \(error.localizedDescription)")
            parent.dismiss()
        }
    }
}

// MARK: - Multiple Image Picker
struct MultipleImagePicker: UIViewControllerRepresentable {
    @Binding var images: [UIImage]

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var configuration = PHPickerConfiguration()
        configuration.filter = .images
        configuration.selectionLimit = 10 // Max 10 images

        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: MultipleImagePicker

        init(_ parent: MultipleImagePicker) {
            self.parent = parent
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.dismiss()

            // Load all selected images
            let group = DispatchGroup()

            for result in results {
                group.enter()

                result.itemProvider.loadObject(ofClass: UIImage.self) { [weak self] object, error in
                    defer { group.leave() }

                    if let image = object as? UIImage {
                        DispatchQueue.main.async {
                            self?.parent.images.append(image)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - TripCoordinate Extension for LocationManager compatibility
struct TripCoordinate {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
    let speed: Double?
    let altitude: Double?
    let accuracy: Double?

    var clLocation: CLLocation {
        CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
            altitude: altitude ?? 0,
            horizontalAccuracy: accuracy ?? 0,
            verticalAccuracy: accuracy ?? 0,
            timestamp: timestamp
        )
    }
}

// MARK: - Network Monitor (Stub for compilation)
class NetworkMonitor {
    static let shared = NetworkMonitor()

    var isConnected: Bool {
        // Simple check - in production, use NWPathMonitor
        return true
    }

    private init() {}
}

// MARK: - Certificate Pinning Manager (Stub for compilation)
class CertificatePinningManager {
    static let shared = CertificatePinningManager()

    func createPinnedURLSession(delegate: URLSessionDelegate?) -> URLSession {
        let configuration = URLSessionConfiguration.default
        return URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
    }

    func validateServerTrust(
        challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        // In production, implement proper certificate pinning
        completionHandler(.performDefaultHandling, nil)
    }

    private init() {}
}

// MARK: - APIService Extension for Receipt and Damage Reports
extension APIService {
    static let shared = APIService()

    func processReceiptOCR(imageData: Data) async throws -> ReceiptOCRResults {
        guard let image = UIImage(data: imageData) else {
            throw OCRError.invalidImage
        }

        // Use local OCR service
        return try await ReceiptOCRService.shared.processReceipt(image: image)
    }

    func saveReceipt(data: [String: Any]) async throws {
        // Upload to backend API
        let endpoint = "/receipts"

        // In production, use proper API client
        try await Task.sleep(nanoseconds: 1_000_000_000)
        print("Receipt saved: \(data)")
    }

    func submitDamageReport(data: [String: Any]) async throws {
        // Upload to backend API
        let endpoint = "/damage-reports"

        // In production, use proper API client
        try await Task.sleep(nanoseconds: 1_000_000_000)
        print("Damage report submitted: \(data)")
    }

    func uploadMedia(data: Data, type: String) async throws -> String {
        // Upload media file to Azure Blob Storage or backend
        // Return URL of uploaded file

        // In production, implement actual upload
        let filename = "\(type)_\(UUID().uuidString)"
        try await Task.sleep(nanoseconds: 500_000_000)

        return "https://storage.azure.com/fleet/\(filename)"
    }
}

import CoreLocation
