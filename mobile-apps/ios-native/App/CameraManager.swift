/**
 * Camera Manager for iOS Fleet Management
 * AVFoundation wrapper for camera operations
 * Handles photo capture, video preview, and camera configuration
 */

import SwiftUI
import AVFoundation
import CoreLocation

// MARK: - Camera Manager
class CameraManager: NSObject, ObservableObject {
    @Published var isAuthorized = false
    @Published var isSessionRunning = false
    @Published var capturedImage: UIImage?
    @Published var error: CameraError?
    @Published var isTorchOn = false
    @Published var flashMode: AVCaptureDevice.FlashMode = .auto
    @Published var cameraPosition: AVCaptureDevice.Position = .back

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private var videoDevice: AVCaptureDevice?
    private let sessionQueue = DispatchQueue(label: "com.fleet.camera.session")

    // Location for metadata
    private let locationManager = CLLocationManager()
    private var currentLocation: CLLocation?

    override init() {
        super.init()
        locationManager.delegate = self
    }

    // MARK: - Authorization
    func checkAuthorization() async {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            await MainActor.run {
                self.isAuthorized = true
            }

        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            await MainActor.run {
                self.isAuthorized = granted
            }

        default:
            await MainActor.run {
                self.isAuthorized = false
                self.error = .notAuthorized
            }
        }
    }

    // MARK: - Session Setup
    func setupSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            self.session.beginConfiguration()
            self.session.sessionPreset = .photo

            // Add video input
            guard let videoDevice = AVCaptureDevice.default(
                .builtInWideAngleCamera,
                for: .video,
                position: self.cameraPosition
            ) else {
                DispatchQueue.main.async {
                    self.error = .setupFailed("No camera available")
                }
                return
            }

            self.videoDevice = videoDevice

            do {
                let videoInput = try AVCaptureDeviceInput(device: videoDevice)

                if self.session.canAddInput(videoInput) {
                    self.session.addInput(videoInput)
                }

                // Add photo output
                if self.session.canAddOutput(self.photoOutput) {
                    self.session.addOutput(self.photoOutput)

                    // Configure photo output
                    self.photoOutput.isHighResolutionCaptureEnabled = true
                    self.photoOutput.maxPhotoQualityPrioritization = .quality
                }

                self.session.commitConfiguration()

            } catch {
                DispatchQueue.main.async {
                    self.error = .setupFailed(error.localizedDescription)
                }
                self.session.commitConfiguration()
            }
        }
    }

    // MARK: - Session Control
    func startSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            if !self.session.isRunning {
                self.session.startRunning()

                DispatchQueue.main.async {
                    self.isSessionRunning = true
                }
            }
        }

        // Request location for metadata
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }

    func stopSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            if self.session.isRunning {
                self.session.stopRunning()

                DispatchQueue.main.async {
                    self.isSessionRunning = false
                }
            }
        }

        locationManager.stopUpdatingLocation()
    }

    // MARK: - Photo Capture
    func capturePhoto() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            var photoSettings = AVCapturePhotoSettings()

            // Configure flash
            if self.photoOutput.supportedFlashModes.contains(self.flashMode) {
                photoSettings.flashMode = self.flashMode
            }

            // Enable high resolution
            photoSettings.isHighResolutionPhotoEnabled = true

            // Add location metadata if available
            if let location = self.currentLocation {
                photoSettings.metadata = [
                    kCGImagePropertyGPSLatitude as String: location.coordinate.latitude,
                    kCGImagePropertyGPSLongitude as String: location.coordinate.longitude,
                    kCGImagePropertyGPSTimeStamp as String: Date()
                ]
            }

            // Capture photo
            let photoCaptureDelegate = PhotoCaptureDelegate { [weak self] result in
                switch result {
                case .success(let imageData):
                    if let image = UIImage(data: imageData) {
                        DispatchQueue.main.async {
                            self?.capturedImage = image

                            // Haptic feedback
                            let generator = UINotificationFeedbackGenerator()
                            generator.notificationOccurred(.success)
                        }
                    }

                case .failure(let error):
                    DispatchQueue.main.async {
                        self?.error = .captureFailed(error.localizedDescription)
                    }
                }
            }

            self.photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)
        }
    }

    // MARK: - Camera Controls
    func toggleFlash() {
        switch flashMode {
        case .off:
            flashMode = .auto
        case .auto:
            flashMode = .on
        case .on:
            flashMode = .off
        @unknown default:
            flashMode = .off
        }
    }

    func toggleTorch() {
        guard let device = videoDevice, device.hasTorch else { return }

        sessionQueue.async {
            do {
                try device.lockForConfiguration()

                if self.isTorchOn {
                    device.torchMode = .off
                    DispatchQueue.main.async {
                        self.isTorchOn = false
                    }
                } else {
                    try device.setTorchModeOn(level: 1.0)
                    DispatchQueue.main.async {
                        self.isTorchOn = true
                    }
                }

                device.unlockForConfiguration()
            } catch {
                print("❌ Torch error: \(error)")
            }
        }
    }

    func switchCamera() {
        let newPosition: AVCaptureDevice.Position = cameraPosition == .back ? .front : .back

        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            self.session.beginConfiguration()

            // Remove existing inputs
            self.session.inputs.forEach { input in
                self.session.removeInput(input)
            }

            // Add new camera input
            guard let newDevice = AVCaptureDevice.default(
                .builtInWideAngleCamera,
                for: .video,
                position: newPosition
            ) else {
                self.session.commitConfiguration()
                return
            }

            do {
                let newInput = try AVCaptureDeviceInput(device: newDevice)

                if self.session.canAddInput(newInput) {
                    self.session.addInput(newInput)
                    self.videoDevice = newDevice

                    DispatchQueue.main.async {
                        self.cameraPosition = newPosition
                    }
                }

                self.session.commitConfiguration()

            } catch {
                print("❌ Camera switch error: \(error)")
                self.session.commitConfiguration()
            }
        }
    }

    func setFocus(at point: CGPoint) {
        guard let device = videoDevice else { return }

        sessionQueue.async {
            do {
                try device.lockForConfiguration()

                if device.isFocusPointOfInterestSupported {
                    device.focusPointOfInterest = point
                    device.focusMode = .autoFocus
                }

                if device.isExposurePointOfInterestSupported {
                    device.exposurePointOfInterest = point
                    device.exposureMode = .autoExpose
                }

                device.unlockForConfiguration()

            } catch {
                print("❌ Focus error: \(error)")
            }
        }
    }

    // MARK: - Cleanup
    func cleanup() {
        stopSession()
        capturedImage = nil
        error = nil
    }
}

// MARK: - Location Manager Delegate
extension CameraManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }
}

// MARK: - Photo Capture Delegate
private class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (Result<Data, Error>) -> Void

    init(completion: @escaping (Result<Data, Error>) -> Void) {
        self.completion = completion
    }

    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        if let error = error {
            completion(.failure(error))
            return
        }

        guard let imageData = photo.fileDataRepresentation() else {
            completion(.failure(CameraError.captureFailed("No image data")))
            return
        }

        completion(.success(imageData))
    }
}

// MARK: - Camera Error
enum CameraError: Error, LocalizedError {
    case notAuthorized
    case setupFailed(String)
    case captureFailed(String)

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Camera access not authorized. Please enable in Settings."
        case .setupFailed(let message):
            return "Camera setup failed: \(message)"
        case .captureFailed(let message):
            return "Photo capture failed: \(message)"
        }
    }
}

// MARK: - Camera Preview UIViewRepresentable
struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .black

        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)

        context.coordinator.previewLayer = previewLayer

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.async {
            if let previewLayer = context.coordinator.previewLayer {
                previewLayer.frame = uiView.bounds
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        var previewLayer: AVCaptureVideoPreviewLayer?
    }
}
