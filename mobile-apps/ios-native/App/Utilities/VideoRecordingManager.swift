/**
 * Video Recording Manager
 * Handles video capture for vehicle inspections
 */

import Foundation
import AVFoundation
import CoreLocation

// MARK: - Video Recording Manager
class VideoRecordingManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var error: VideoError?

    private var movieOutput: AVCaptureMovieFileOutput?
    private let session = AVCaptureSession()
    private var videoDevice: AVCaptureDevice?
    private var currentOutputURL: URL?
    private var completionHandler: ((URL) -> Void)?

    private let sessionQueue = DispatchQueue(label: "com.fleet.video.session")
    private let locationManager = CLLocationManager()

    override init() {
        super.init()
        locationManager.requestWhenInUseAuthorization()
    }

    // MARK: - Session Setup
    func setupSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            self.session.beginConfiguration()
            self.session.sessionPreset = .high

            // Add video input
            guard let videoDevice = AVCaptureDevice.default(
                .builtInWideAngleCamera,
                for: .video,
                position: .back
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

                // Add audio input
                if let audioDevice = AVCaptureDevice.default(for: .audio) {
                    let audioInput = try AVCaptureDeviceInput(device: audioDevice)
                    if self.session.canAddInput(audioInput) {
                        self.session.addInput(audioInput)
                    }
                }

                // Add movie output
                let movieOutput = AVCaptureMovieFileOutput()
                if self.session.canAddOutput(movieOutput) {
                    self.session.addOutput(movieOutput)
                    self.movieOutput = movieOutput

                    // Configure output
                    if let connection = movieOutput.connection(with: .video) {
                        if connection.isVideoStabilizationSupported {
                            connection.preferredVideoStabilizationMode = .auto
                        }
                    }
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

    // MARK: - Recording Control
    func startRecording(completion: @escaping (URL) -> Void) {
        guard let movieOutput = movieOutput else {
            error = .recordingFailed("Movie output not configured")
            return
        }

        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            // Generate output URL
            let outputURL = self.generateOutputURL()
            self.currentOutputURL = outputURL
            self.completionHandler = completion

            // Start recording
            movieOutput.startRecording(to: outputURL, recordingDelegate: self)

            DispatchQueue.main.async {
                self.isRecording = true
            }
        }
    }

    func stopRecording(completion: @escaping (Result<URL, Error>) -> Void) {
        sessionQueue.async { [weak self] in
            guard let self = self, let movieOutput = self.movieOutput else {
                completion(.failure(VideoError.recordingFailed("Movie output not available")))
                return
            }

            if movieOutput.isRecording {
                movieOutput.stopRecording()

                // Wait for file to be finalized
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    if let outputURL = self.currentOutputURL, FileManager.default.fileExists(atPath: outputURL.path) {
                        completion(.success(outputURL))
                    } else {
                        completion(.failure(VideoError.recordingFailed("Video file not saved")))
                    }

                    self.isRecording = false
                }
            }
        }
    }

    // MARK: - Helpers
    private func generateOutputURL() -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let timestamp = Int(Date().timeIntervalSince1970)
        return documentsPath.appendingPathComponent("inspection_video_\(timestamp).mov")
    }

    func cleanup() {
        sessionQueue.async { [weak self] in
            self?.session.stopRunning()
        }
    }
}

// MARK: - AVCaptureFileOutputRecordingDelegate
extension VideoRecordingManager: AVCaptureFileOutputRecordingDelegate {
    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        if let error = error {
            DispatchQueue.main.async {
                self.error = .recordingFailed(error.localizedDescription)
            }
            return
        }

        // Add metadata
        addMetadata(to: outputFileURL)

        // Call completion handler
        if let completionHandler = completionHandler {
            DispatchQueue.main.async {
                completionHandler(outputFileURL)
            }
        }
    }

    func fileOutput(_ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
        print("Started recording to: \(fileURL)")
    }

    private func addMetadata(to videoURL: URL) {
        let asset = AVURLAsset(url: videoURL)
        let composition = AVMutableComposition()

        // Add video and audio tracks
        guard let videoTrack = asset.tracks(withMediaType: .video).first,
              let compositionVideoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
            return
        }

        do {
            try compositionVideoTrack.insertTimeRange(
                CMTimeRange(start: .zero, duration: asset.duration),
                of: videoTrack,
                at: .zero
            )

            // Add location metadata if available
            if let location = locationManager.location {
                let metadataItem = AVMutableMetadataItem()
                metadataItem.identifier = .commonIdentifierLocation
                metadataItem.value = "\(location.coordinate.latitude),\(location.coordinate.longitude)" as NSString
                metadataItem.dataType = kCMMetadataBaseDataType_UTF8 as String

                composition.metadata = [metadataItem]
            }
        } catch {
            print("Error adding metadata: \(error)")
        }
    }
}

// MARK: - Video Error
enum VideoError: Error, LocalizedError {
    case setupFailed(String)
    case recordingFailed(String)
    case permissionDenied

    var errorDescription: String? {
        switch self {
        case .setupFailed(let message):
            return "Video setup failed: \(message)"
        case .recordingFailed(let message):
            return "Recording failed: \(message)"
        case .permissionDenied:
            return "Camera or microphone access denied"
        }
    }
}
