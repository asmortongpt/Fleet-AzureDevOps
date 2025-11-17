/**
 * Photo Capture View for Fleet Management
 * Camera UI for capturing vehicle photos and documentation
 * Supports multiple photos, preview, and metadata
 */

import SwiftUI
import AVFoundation

struct PhotoCaptureView: View {
    @StateObject private var cameraManager = CameraManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showingImagePreview = false
    @State private var capturedImages: [CapturedPhoto] = []
    @State private var showingError = false
    @State private var focusLocation: CGPoint?

    let vehicleId: String?
    let photoType: PhotoType
    let maxPhotos: Int
    let onComplete: ([CapturedPhoto]) -> Void

    init(
        vehicleId: String? = nil,
        photoType: PhotoType = .general,
        maxPhotos: Int = 10,
        onComplete: @escaping ([CapturedPhoto]) -> Void
    ) {
        self.vehicleId = vehicleId
        self.photoType = photoType
        self.maxPhotos = maxPhotos
        self.onComplete = onComplete
    }

    var body: some View {
        ZStack {
            // Camera preview
            CameraPreviewView(session: cameraManager.session)
                .edgesIgnoringSafeArea(.all)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onEnded { value in
                            // Focus on tap
                            let point = CGPoint(
                                x: value.location.x / UIScreen.main.bounds.width,
                                y: value.location.y / UIScreen.main.bounds.height
                            )
                            cameraManager.setFocus(at: point)

                            // Show focus indicator
                            focusLocation = value.location

                            // Hide after animation
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                focusLocation = nil
                            }
                        }
                )

            // Focus indicator
            if let location = focusLocation {
                Circle()
                    .stroke(Color.yellow, lineWidth: 2)
                    .frame(width: 80, height: 80)
                    .position(location)
                    .transition(.scale.combined(with: .opacity))
            }

            VStack {
                // Top bar
                topBar

                Spacer()

                // Bottom controls
                bottomControls
            }
        }
        .task {
            await cameraManager.checkAuthorization()
            if cameraManager.isAuthorized {
                cameraManager.setupSession()
                cameraManager.startSession()
            } else {
                showingError = true
            }
        }
        .onDisappear {
            cameraManager.cleanup()
        }
        .alert("Camera Error", isPresented: $showingError) {
            Button("Settings", action: openSettings)
            Button("Cancel", role: .cancel) {
                dismiss()
            }
        } message: {
            Text(cameraManager.error?.errorDescription ?? "Camera access required")
        }
        .onChange(of: cameraManager.capturedImage) { newImage in
            if let image = newImage {
                addCapturedPhoto(image)
                cameraManager.capturedImage = nil
            }
        }
        .fullScreenCover(isPresented: $showingImagePreview) {
            if let lastImage = capturedImages.last {
                PhotoPreviewView(
                    photo: lastImage,
                    onKeep: {
                        showingImagePreview = false
                        checkCompletion()
                    },
                    onRetake: {
                        capturedImages.removeLast()
                        showingImagePreview = false
                    }
                )
            }
        }
    }

    // MARK: - Top Bar
    private var topBar: some View {
        HStack {
            // Cancel button
            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }

            Spacer()

            // Photo type label
            VStack(spacing: 4) {
                Text(photoType.title)
                    .font(.headline)
                    .foregroundColor(.white)

                Text("\(capturedImages.count)/\(maxPhotos)")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }

            Spacer()

            // Flash toggle
            Button(action: { cameraManager.toggleFlash() }) {
                Image(systemName: flashIcon)
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }
        }
        .background(Color.black.opacity(0.7))
    }

    // MARK: - Bottom Controls
    private var bottomControls: some View {
        VStack(spacing: 20) {
            // Captured photos thumbnail strip
            if !capturedImages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(capturedImages) { photo in
                            PhotoThumbnail(photo: photo) {
                                if let index = capturedImages.firstIndex(where: { $0.id == photo.id }) {
                                    capturedImages.remove(at: index)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .frame(height: 80)
                .background(Color.black.opacity(0.5))
            }

            // Camera controls
            HStack(spacing: 40) {
                // Thumbnail preview
                if let lastPhoto = capturedImages.last {
                    Button(action: { showingImagePreview = true }) {
                        Image(uiImage: lastPhoto.image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 60, height: 60)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white, lineWidth: 2)
                            )
                    }
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(width: 60, height: 60)
                }

                // Capture button
                Button(action: capturePhoto) {
                    ZStack {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 70, height: 70)

                        Circle()
                            .stroke(Color.white, lineWidth: 3)
                            .frame(width: 80, height: 80)
                    }
                }
                .disabled(capturedImages.count >= maxPhotos)
                .opacity(capturedImages.count >= maxPhotos ? 0.5 : 1.0)

                // Switch camera
                Button(action: { cameraManager.switchCamera() }) {
                    Image(systemName: "camera.rotate.fill")
                        .font(.title)
                        .foregroundColor(.white)
                        .frame(width: 60, height: 60)
                }
            }
            .padding(.bottom, 30)

            // Done button
            if capturedImages.count >= 1 {
                Button(action: {
                    onComplete(capturedImages)
                    dismiss()
                }) {
                    Text("Done (\(capturedImages.count))")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 40)
                        .padding(.vertical, 12)
                        .background(Color.blue)
                        .cornerRadius(10)
                }
                .padding(.bottom, 20)
            }
        }
    }

    // MARK: - Flash Icon
    private var flashIcon: String {
        switch cameraManager.flashMode {
        case .off:
            return "bolt.slash.fill"
        case .auto:
            return "bolt.badge.automatic.fill"
        case .on:
            return "bolt.fill"
        @unknown default:
            return "bolt.fill"
        }
    }

    // MARK: - Actions
    private func capturePhoto() {
        cameraManager.capturePhoto()
    }

    private func addCapturedPhoto(_ image: UIImage) {
        let photo = CapturedPhoto(
            image: image,
            vehicleId: vehicleId,
            photoType: photoType,
            timestamp: Date()
        )
        capturedImages.append(photo)
        showingImagePreview = true
    }

    private func checkCompletion() {
        if capturedImages.count >= maxPhotos {
            onComplete(capturedImages)
            dismiss()
        }
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Photo Thumbnail
struct PhotoThumbnail: View {
    let photo: CapturedPhoto
    let onDelete: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(uiImage: photo.image)
                .resizable()
                .scaledToFill()
                .frame(width: 70, height: 70)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.white)
                    .background(Circle().fill(Color.black.opacity(0.5)))
            }
            .offset(x: 8, y: -8)
        }
    }
}

// MARK: - Photo Preview View
struct PhotoPreviewView: View {
    let photo: CapturedPhoto
    let onKeep: () -> Void
    let onRetake: () -> Void

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            VStack {
                Spacer()

                Image(uiImage: photo.image)
                    .resizable()
                    .scaledToFit()

                Spacer()

                HStack(spacing: 40) {
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
                            Text("Keep Photo")
                                .font(.caption)
                        }
                        .foregroundColor(.green)
                    }
                }
                .padding(.bottom, 40)
            }
        }
    }
}

// MARK: - Captured Photo Model
struct CapturedPhoto: Identifiable {
    let id = UUID()
    let image: UIImage
    let vehicleId: String?
    let photoType: PhotoType
    let timestamp: Date
    var location: String?
    var notes: String?
}

// MARK: - Photo Type
enum PhotoType {
    case general
    case damage
    case inspection
    case maintenance
    case vin
    case odometer
    case interior
    case exterior

    var title: String {
        switch self {
        case .general: return "General Photo"
        case .damage: return "Damage Documentation"
        case .inspection: return "Vehicle Inspection"
        case .maintenance: return "Maintenance Record"
        case .vin: return "VIN Number"
        case .odometer: return "Odometer Reading"
        case .interior: return "Interior Photo"
        case .exterior: return "Exterior Photo"
        }
    }
}
