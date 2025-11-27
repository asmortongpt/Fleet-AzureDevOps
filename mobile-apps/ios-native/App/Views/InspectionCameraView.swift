/**
 * Enhanced Inspection Camera View
 * Supports photo, video, and LiDAR scanning for vehicle inspections
 */

import SwiftUI
import AVFoundation
import ARKit

// MARK: - Inspection Camera View
struct InspectionCameraView: View {
    @StateObject private var cameraManager = CameraManager()
    @StateObject private var videoManager = VideoRecordingManager()
    @StateObject private var lidarScanner = LiDARScanner()

    @Binding var capturedMedia: InspectionMedia?
    @Binding var isPresented: Bool

    let category: InspectionCategory
    let itemName: String

    @State private var captureMode: CaptureMode = .photo
    @State private var showControls = true
    @State private var isRecording = false
    @State private var recordingDuration: TimeInterval = 0
    @State private var recordingTimer: Timer?
    @State private var showLiDARScan = false

    enum CaptureMode: String, CaseIterable {
        case photo = "Photo"
        case video = "Video"
        case lidar = "LiDAR Scan"

        var icon: String {
            switch self {
            case .photo: return "camera.fill"
            case .video: return "video.fill"
            case .lidar: return "light.beacon.max.fill"
            }
        }
    }

    var body: some View {
        ZStack {
            // Camera Preview
            if captureMode == .photo || captureMode == .video {
                CameraPreviewView(session: cameraManager.session)
                    .ignoresSafeArea()
                    .onTapGesture { location in
                        // Focus on tap
                        let point = convertToDevicePoint(location)
                        cameraManager.setFocus(at: point)
                    }
            } else if captureMode == .lidar {
                // LiDAR AR View
                LiDARScanView(scanner: lidarScanner)
                    .ignoresSafeArea()
            }

            // Controls Overlay
            if showControls {
                VStack {
                    // Top Bar
                    HStack {
                        // Close Button
                        Button(action: { isPresented = false }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title)
                                .foregroundColor(.white)
                                .background(Circle().fill(Color.black.opacity(0.5)))
                        }

                        Spacer()

                        // Item Label
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(category.rawValue)
                                .font(.caption)
                                .foregroundColor(.white)
                            Text(itemName)
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.black.opacity(0.7))
                        )

                        Spacer()

                        // Flash Toggle (Photo/Video only)
                        if captureMode != .lidar {
                            Button(action: { cameraManager.toggleFlash() }) {
                                Image(systemName: flashIcon)
                                    .font(.title2)
                                    .foregroundColor(cameraManager.flashMode == .off ? .white : .yellow)
                                    .background(Circle().fill(Color.black.opacity(0.5)))
                            }
                        }
                    }
                    .padding()

                    Spacer()

                    // Recording Timer
                    if isRecording {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 12, height: 12)
                                .opacity(recordingDuration.truncatingRemainder(dividingBy: 1.0) < 0.5 ? 1.0 : 0.3)

                            Text(formatDuration(recordingDuration))
                                .font(.system(.title3, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(Color.black.opacity(0.7))
                        )
                        .padding(.bottom, 20)
                    }

                    // Bottom Controls
                    VStack(spacing: 20) {
                        // Mode Selector
                        HStack(spacing: 16) {
                            ForEach(CaptureMode.allCases, id: \.self) { mode in
                                // Only show LiDAR if device supports it
                                if mode != .lidar || ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                                    Button(action: {
                                        withAnimation {
                                            switchToMode(mode)
                                        }
                                    }) {
                                        VStack(spacing: 4) {
                                            Image(systemName: mode.icon)
                                                .font(.title3)
                                            Text(mode.rawValue)
                                                .font(.caption2)
                                        }
                                        .foregroundColor(captureMode == mode ? .blue : .white)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(captureMode == mode ? Color.white.opacity(0.3) : Color.clear)
                                        )
                                    }
                                    .disabled(isRecording)
                                }
                            }
                        }

                        // Capture Controls
                        HStack(spacing: 40) {
                            // Camera Flip (Photo/Video only)
                            if captureMode != .lidar && !isRecording {
                                Button(action: { cameraManager.switchCamera() }) {
                                    Image(systemName: "arrow.triangle.2.circlepath.camera.fill")
                                        .font(.title)
                                        .foregroundColor(.white)
                                        .frame(width: 60, height: 60)
                                        .background(Circle().fill(Color.black.opacity(0.5)))
                                }
                            } else {
                                Spacer()
                                    .frame(width: 60, height: 60)
                            }

                            // Capture Button
                            Button(action: handleCapture) {
                                ZStack {
                                    Circle()
                                        .stroke(Color.white, lineWidth: 4)
                                        .frame(width: 80, height: 80)

                                    Circle()
                                        .fill(isRecording ? Color.red.opacity(0.8) : Color.white.opacity(0.8))
                                        .frame(width: isRecording ? 40 : 64, height: isRecording ? 40 : 64)
                                        .animation(.easeInOut(duration: 0.2), value: isRecording)

                                    if captureMode == .lidar && !isRecording {
                                        Image(systemName: "light.beacon.max.fill")
                                            .font(.title2)
                                            .foregroundColor(.blue)
                                    }
                                }
                            }

                            // Torch Toggle (Photo/Video only)
                            if captureMode != .lidar && !isRecording {
                                Button(action: { cameraManager.toggleTorch() }) {
                                    Image(systemName: cameraManager.isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill")
                                        .font(.title)
                                        .foregroundColor(cameraManager.isTorchOn ? .yellow : .white)
                                        .frame(width: 60, height: 60)
                                        .background(Circle().fill(Color.black.opacity(0.5)))
                                }
                            } else {
                                Spacer()
                                    .frame(width: 60, height: 60)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 40)
                }
            }

            // LiDAR Scan Progress Overlay
            if showLiDARScan {
                VStack {
                    Spacer()

                    VStack(spacing: 16) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.5)

                        Text("Scanning for damage...")
                            .font(.headline)
                            .foregroundColor(.white)

                        Text("\(Int(lidarScanner.scanProgress * 100))% complete")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(24)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.black.opacity(0.8))
                    )
                    .padding(.bottom, 100)
                }
            }
        }
        .statusBar(hidden: true)
        .task {
            await setupCamera()
        }
        .onDisappear {
            cleanup()
        }
        .alert("Camera Error", isPresented: .constant(cameraManager.error != nil)) {
            Button("OK") {
                cameraManager.error = nil
                isPresented = false
            }
        } message: {
            Text(cameraManager.error?.localizedDescription ?? "Unknown error")
        }
    }

    // MARK: - Helper Functions

    private var flashIcon: String {
        switch cameraManager.flashMode {
        case .off: return "bolt.slash.fill"
        case .on: return "bolt.fill"
        case .auto: return "bolt.badge.automatic.fill"
        @unknown default: return "bolt.slash.fill"
        }
    }

    private func setupCamera() async {
        await cameraManager.checkAuthorization()

        if cameraManager.isAuthorized {
            cameraManager.setupSession()
            cameraManager.startSession()
        }
    }

    private func switchToMode(_ mode: CaptureMode) {
        captureMode = mode

        if mode == .video {
            videoManager.setupSession()
        } else if mode == .lidar {
            lidarScanner.startSession()
        }
    }

    private func handleCapture() {
        switch captureMode {
        case .photo:
            capturePhoto()
        case .video:
            if isRecording {
                stopVideoRecording()
            } else {
                startVideoRecording()
            }
        case .lidar:
            if !isRecording {
                startLiDARScan()
            } else {
                stopLiDARScan()
            }
        }
    }

    private func capturePhoto() {
        cameraManager.capturePhoto()

        // Wait for image to be captured
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let image = cameraManager.capturedImage {
                if let imageData = image.jpegData(compressionQuality: 0.8) {
                    capturedMedia = InspectionMedia(
                        type: .photo,
                        data: imageData,
                        thumbnail: image.jpegData(compressionQuality: 0.3),
                        location: nil,
                        timestamp: Date()
                    )
                    isPresented = false
                }
            }
        }
    }

    private func startVideoRecording() {
        isRecording = true
        recordingDuration = 0

        videoManager.startRecording { url in
            // Handle video saved
        }

        // Start timer
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            recordingDuration += 0.1
        }
    }

    private func stopVideoRecording() {
        isRecording = false
        recordingTimer?.invalidate()
        recordingTimer = nil

        videoManager.stopRecording { result in
            switch result {
            case .success(let url):
                if let videoData = try? Data(contentsOf: url) {
                    // Generate thumbnail
                    let thumbnail = generateThumbnail(for: url)

                    capturedMedia = InspectionMedia(
                        type: .video,
                        data: videoData,
                        thumbnail: thumbnail,
                        location: nil,
                        timestamp: Date()
                    )
                    isPresented = false
                }
            case .failure(let error):
                print("Video recording error: \(error)")
            }
        }
    }

    private func startLiDARScan() {
        isRecording = true
        showLiDARScan = true

        lidarScanner.startScanning { result in
            switch result {
            case .success(let scanData):
                capturedMedia = InspectionMedia(
                    type: .lidarScan,
                    data: scanData,
                    thumbnail: nil,
                    location: nil,
                    timestamp: Date()
                )
                isRecording = false
                showLiDARScan = false
                isPresented = false

            case .failure(let error):
                print("LiDAR scan error: \(error)")
                isRecording = false
                showLiDARScan = false
            }
        }
    }

    private func stopLiDARScan() {
        lidarScanner.stopScanning()
        isRecording = false
        showLiDARScan = false
    }

    private func convertToDevicePoint(_ location: CGPoint) -> CGPoint {
        // Convert screen coordinates to device coordinates
        return location
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func generateThumbnail(for videoURL: URL) -> Data? {
        let asset = AVAsset(url: videoURL)
        let imageGenerator = AVAssetImageGenerator(asset: asset)
        imageGenerator.appliesPreferredTrackTransform = true

        do {
            let cgImage = try imageGenerator.copyCGImage(at: .zero, actualTime: nil)
            let image = UIImage(cgImage: cgImage)
            return image.jpegData(compressionQuality: 0.3)
        } catch {
            return nil
        }
    }

    private func cleanup() {
        cameraManager.stopSession()
        videoManager.cleanup()
        lidarScanner.stopSession()
        recordingTimer?.invalidate()
    }
}

// MARK: - Inspection Media Model
struct InspectionMedia: Identifiable {
    let id = UUID()
    let type: MediaType
    let data: Data
    let thumbnail: Data?
    let location: CLLocation?
    let timestamp: Date

    enum MediaType: String, Codable {
        case photo
        case video
        case lidarScan
    }
}
