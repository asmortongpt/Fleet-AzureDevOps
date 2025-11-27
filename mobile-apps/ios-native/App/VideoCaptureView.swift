/**
 * VideoCaptureView - Video recording for Fleet Management
 * Records video for incident reports and damage documentation
 * Integrated with AVFoundation for high-quality video capture
 */

import SwiftUI
import AVFoundation
import CoreLocation

struct VideoCaptureView: View {
    var onCapture: (URL) -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = VideoCaptureViewModel()

    @State private var showingError = false
    @State private var showingPreview = false

    var body: some View {
        ZStack {
            // Camera preview
            VideoPreviewView(session: viewModel.session)
                .edgesIgnoringSafeArea(.all)

            VStack {
                // Top controls
                topControls

                Spacer()

                // Recording controls
                recordingControls
            }

            // Recording indicator
            if viewModel.isRecording {
                VStack {
                    HStack {
                        Spacer()
                        recordingIndicator
                            .padding()
                    }
                    Spacer()
                }
            }
        }
        .task {
            await viewModel.setupCamera()
        }
        .onDisappear {
            viewModel.cleanup()
        }
        .alert("Camera Error", isPresented: $showingError) {
            Button("Settings", action: openSettings)
            Button("Cancel", role: .cancel) {
                dismiss()
            }
        } message: {
            Text(viewModel.errorMessage ?? "Camera access required")
        }
        .fullScreenCover(isPresented: $showingPreview) {
            if let videoURL = viewModel.capturedVideoURL {
                VideoPreviewScreen(
                    videoURL: videoURL,
                    onKeep: {
                        onCapture(videoURL)
                        dismiss()
                    },
                    onRetake: {
                        viewModel.capturedVideoURL = nil
                        showingPreview = false
                    }
                )
            }
        }
        .onChange(of: viewModel.capturedVideoURL) { newURL in
            if newURL != nil {
                showingPreview = true
            }
        }
        .onChange(of: viewModel.errorMessage) { error in
            if error != nil {
                showingError = true
            }
        }
    }

    // MARK: - Top Controls
    private var topControls: some View {
        HStack {
            // Close button
            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }

            Spacer()

            // Timer
            if viewModel.isRecording {
                Text(viewModel.recordingDuration)
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.red.opacity(0.8))
                    .cornerRadius(8)
            }

            Spacer()

            // Torch toggle
            Button(action: { viewModel.toggleTorch() }) {
                Image(systemName: viewModel.isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }
        }
        .background(Color.black.opacity(0.7))
    }

    // MARK: - Recording Controls
    private var recordingControls: some View {
        VStack(spacing: 20) {
            // Recording duration info
            if !viewModel.isRecording {
                Text("Tap to start recording")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.7))
                    .cornerRadius(8)
            }

            // Capture button
            Button(action: {
                if viewModel.isRecording {
                    viewModel.stopRecording()
                } else {
                    viewModel.startRecording()
                }
            }) {
                ZStack {
                    Circle()
                        .fill(viewModel.isRecording ? Color.red : Color.white)
                        .frame(width: 70, height: 70)

                    if viewModel.isRecording {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white)
                            .frame(width: 30, height: 30)
                    }

                    Circle()
                        .stroke(Color.white, lineWidth: 3)
                        .frame(width: 80, height: 80)
                }
            }
            .padding(.bottom, 40)
        }
    }

    // MARK: - Recording Indicator
    private var recordingIndicator: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.red)
                .frame(width: 12, height: 12)
                .opacity(viewModel.isRecording ? 1.0 : 0.0)
                .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: viewModel.isRecording)

            Text("REC")
                .font(.caption)
                .foregroundColor(.white)
                .fontWeight(.bold)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.7))
        .cornerRadius(8)
    }

    // MARK: - Actions
    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Video Capture View Model
@MainActor
class VideoCaptureViewModel: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var recordingDuration = "00:00"
    @Published var isTorchOn = false
    @Published var capturedVideoURL: URL?
    @Published var errorMessage: String?

    let session = AVCaptureSession()
    private var videoOutput: AVCaptureMovieFileOutput?
    private var videoDevice: AVCaptureDevice?
    private var recordingTimer: Timer?
    private var recordingStartTime: Date?

    private let locationManager = LocationManager.shared

    override init() {
        super.init()
    }

    // MARK: - Camera Setup
    func setupCamera() async {
        // Check authorization
        let status = AVCaptureDevice.authorizationStatus(for: .video)

        switch status {
        case .authorized:
            configureSession()
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if granted {
                configureSession()
            } else {
                errorMessage = "Camera access denied"
            }
        default:
            errorMessage = "Camera access not authorized"
        }
    }

    private func configureSession() {
        session.beginConfiguration()
        session.sessionPreset = .high

        // Add video input
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            errorMessage = "No camera available"
            session.commitConfiguration()
            return
        }

        self.videoDevice = videoDevice

        do {
            let videoInput = try AVCaptureDeviceInput(device: videoDevice)
            if session.canAddInput(videoInput) {
                session.addInput(videoInput)
            }

            // Add audio input
            if let audioDevice = AVCaptureDevice.default(for: .audio) {
                let audioInput = try AVCaptureDeviceInput(device: audioDevice)
                if session.canAddInput(audioInput) {
                    session.addInput(audioInput)
                }
            }

            // Add movie file output
            let movieOutput = AVCaptureMovieFileOutput()
            if session.canAddOutput(movieOutput) {
                session.addOutput(movieOutput)
                self.videoOutput = movieOutput

                // Configure max duration (5 minutes)
                movieOutput.maxRecordedDuration = CMTime(seconds: 300, preferredTimescale: 1)

                // Configure connection
                if let connection = movieOutput.connection(with: .video) {
                    if connection.isVideoStabilizationSupported {
                        connection.preferredVideoStabilizationMode = .auto
                    }
                }
            }

            session.commitConfiguration()
            session.startRunning()

        } catch {
            errorMessage = "Failed to setup camera: \(error.localizedDescription)"
            session.commitConfiguration()
        }
    }

    // MARK: - Recording Control
    func startRecording() {
        guard let videoOutput = videoOutput, !videoOutput.isRecording else {
            return
        }

        // Create temp file URL
        let outputPath = NSTemporaryDirectory() + "video_\(UUID().uuidString).mp4"
        let outputURL = URL(fileURLWithPath: outputPath)

        // Start recording
        videoOutput.startRecording(to: outputURL, recordingDelegate: self)

        isRecording = true
        recordingStartTime = Date()

        // Start timer
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateRecordingDuration()
        }

        // Request location
        locationManager.startUpdatingLocation()
    }

    func stopRecording() {
        guard let videoOutput = videoOutput, videoOutput.isRecording else {
            return
        }

        videoOutput.stopRecording()
        isRecording = false

        // Stop timer
        recordingTimer?.invalidate()
        recordingTimer = nil

        // Stop location updates
        locationManager.stopUpdatingLocation()
    }

    private func updateRecordingDuration() {
        guard let startTime = recordingStartTime else { return }

        let duration = Date().timeIntervalSince(startTime)
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60

        recordingDuration = String(format: "%02d:%02d", minutes, seconds)
    }

    // MARK: - Torch Control
    func toggleTorch() {
        guard let device = videoDevice, device.hasTorch else { return }

        do {
            try device.lockForConfiguration()

            if isTorchOn {
                device.torchMode = .off
                isTorchOn = false
            } else {
                try device.setTorchModeOn(level: 1.0)
                isTorchOn = true
            }

            device.unlockForConfiguration()
        } catch {
            print("Torch error: \(error)")
        }
    }

    // MARK: - Cleanup
    func cleanup() {
        if isRecording {
            stopRecording()
        }
        session.stopRunning()
        recordingTimer?.invalidate()
    }
}

// MARK: - AVCaptureFileOutputRecordingDelegate
extension VideoCaptureViewModel: AVCaptureFileOutputRecordingDelegate {
    nonisolated func fileOutput(
        _ output: AVCaptureFileOutput,
        didFinishRecordingTo outputFileURL: URL,
        from connections: [AVCaptureConnection],
        error: Error?
    ) {
        Task { @MainActor in
            if let error = error {
                self.errorMessage = "Recording failed: \(error.localizedDescription)"
            } else {
                self.capturedVideoURL = outputFileURL
            }
        }
    }
}

// MARK: - Video Preview UIViewRepresentable
struct VideoPreviewView: UIViewRepresentable {
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

// MARK: - Video Preview Screen
struct VideoPreviewScreen: View {
    let videoURL: URL
    let onKeep: () -> Void
    let onRetake: () -> Void

    @State private var player: AVPlayer?

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            VStack {
                Spacer()

                // Video player
                if let player = player {
                    VideoPlayer(player: player)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .aspectRatio(contentMode: .fit)
                } else {
                    ProgressView()
                        .tint(.white)
                }

                Spacer()

                // Controls
                HStack(spacing: 60) {
                    Button(action: onRetake) {
                        VStack {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.title)
                            Text("Retake")
                                .font(.caption)
                        }
                        .foregroundColor(.white)
                    }

                    Button(action: onKeep) {
                        VStack {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title)
                            Text("Use Video")
                                .font(.caption)
                        }
                        .foregroundColor(.green)
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .onAppear {
            player = AVPlayer(url: videoURL)
            player?.play()
        }
        .onDisappear {
            player?.pause()
            player = nil
        }
    }
}

// MARK: - Video Player Wrapper
import AVKit

struct VideoPlayer: UIViewControllerRepresentable {
    let player: AVPlayer

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = player
        controller.showsPlaybackControls = true
        controller.videoGravity = .resizeAspect
        return controller
    }

    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {
        // No updates needed
    }
}
