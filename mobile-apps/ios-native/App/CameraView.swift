/**
 * CameraView - Base camera functionality for Fleet Management
 * Provides full-featured camera with photo capture
 * Integrated with CameraManager for AVFoundation operations
 */

import SwiftUI
import AVFoundation
import CoreLocation

struct CameraView: View {
    @Binding var image: UIImage?
    var onCapture: () -> Void

    @StateObject private var cameraManager = CameraManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showingError = false
    @State private var focusLocation: CGPoint?
    @State private var showingPreview = false
    @State private var capturedPhoto: UIImage?

    var body: some View {
        ZStack {
            // Camera preview layer
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
                // Top controls
                topControls

                Spacer()

                // Bottom capture button
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
            if let capturedImage = newImage {
                self.capturedPhoto = capturedImage
                self.showingPreview = true
                cameraManager.capturedImage = nil
            }
        }
        .fullScreenCover(isPresented: $showingPreview) {
            if let photo = capturedPhoto {
                CameraPhotoPreview(
                    image: photo,
                    onKeep: {
                        image = photo
                        showingPreview = false
                        onCapture()
                        dismiss()
                    },
                    onRetake: {
                        capturedPhoto = nil
                        showingPreview = false
                    }
                )
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

            // Flash control
            Button(action: { cameraManager.toggleFlash() }) {
                Image(systemName: flashIcon)
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }

            // Switch camera
            Button(action: { cameraManager.switchCamera() }) {
                Image(systemName: "camera.rotate.fill")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }
        }
        .background(Color.black.opacity(0.7))
    }

    // MARK: - Bottom Controls
    private var bottomControls: some View {
        HStack(spacing: 60) {
            Spacer()

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

            Spacer()
        }
        .padding(.bottom, 40)
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

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Photo Preview
struct CameraPhotoPreview: View {
    let image: UIImage
    let onKeep: () -> Void
    let onRetake: () -> Void

    var body: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)

            VStack {
                Spacer()

                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()

                Spacer()

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
                            Text("Use Photo")
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
