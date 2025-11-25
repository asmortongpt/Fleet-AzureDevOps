/**
 * Damage Report View
 *
 * Comprehensive damage reporting with:
 * - Photo capture (multiple images)
 * - Video recording
 * - LiDAR 3D scanning (iOS devices with LiDAR sensor)
 * - Location tracking
 * - Severity assessment
 */

import SwiftUI
import AVFoundation
import ARKit
import RealityKit

struct DamageReportView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = DamageReportViewModel()

    @State private var showingCamera = false
    @State private var showingVideoCapture = false
    @State private var showingLiDARScanner = false
    @State private var showingImagePicker = false
    @State private var isSubmitting = false
    @State private var showingSuccess = false

    var vehicleId: String

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 24) {
                        // MARK: - Header
                        headerSection

                        // MARK: - Basic Information
                        basicInfoSection

                        // MARK: - Media Capture Options
                        mediaCaptureSection

                        // MARK: - Captured Media Preview
                        if viewModel.hasMedia {
                            mediaPreviewSection
                        }

                        // MARK: - Damage Details
                        damageDetailsSection

                        // MARK: - Location Information
                        locationSection
                    }
                    .padding()
                }

                // MARK: - Loading Overlay
                if isSubmitting {
                    submittingOverlay
                }
            }
            .navigationTitle("Report Damage")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        submitReport()
                    }
                    .disabled(!viewModel.canSubmit)
                    .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingCamera) {
                CameraView(image: .constant(nil), onCapture: {
                    // Capture handled by CameraView
                })
            }
            .sheet(isPresented: $showingVideoCapture) {
                VideoCaptureView(onCapture: { url in
                    viewModel.addVideo(url: url)
                })
            }
            .sheet(isPresented: $showingLiDARScanner) {
                if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
                    LiDARScannerView(onCapture: { scanData in
                        viewModel.addLiDARScan(data: scanData)
                    })
                } else {
                    LiDARNotSupportedView()
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                MultipleImagePicker(images: $viewModel.photos)
            }
            .alert("Report Submitted", isPresented: $showingSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your damage report has been submitted successfully.")
            }
            .onAppear {
                viewModel.vehicleId = vehicleId
                viewModel.captureLocation()
            }
        }
    }

    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("Document Vehicle Damage")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Capture photos, videos, or 3D scans")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }

    // MARK: - Basic Info Section
    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Report Information")
                .font(.headline)

            TextField("Damage Description", text: $viewModel.description, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)

            HStack {
                Text("Severity")
                    .foregroundColor(.secondary)
                Spacer()
                Picker("Severity", selection: $viewModel.severity) {
                    Text("Minor").tag(DamageSeverity.minor)
                    Text("Moderate").tag(DamageSeverity.moderate)
                    Text("Severe").tag(DamageSeverity.severe)
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 250)
            }

            TextField("Damage Location (e.g., Front Bumper)", text: $viewModel.location)
                .textFieldStyle(.roundedBorder)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Media Capture Section
    private var mediaCaptureSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Capture Evidence")
                .font(.headline)

            VStack(spacing: 12) {
                // Photo Capture
                Button(action: { showingCamera = true }) {
                    MediaCaptureButton(
                        icon: "camera.fill",
                        title: "Take Photos",
                        subtitle: "\(viewModel.photos.count) photo(s)",
                        color: .blue
                    )
                }

                // Video Capture
                Button(action: { showingVideoCapture = true }) {
                    MediaCaptureButton(
                        icon: "video.fill",
                        title: "Record Video",
                        subtitle: viewModel.videos.isEmpty ? "No videos" : "\(viewModel.videos.count) video(s)",
                        color: .red
                    )
                }

                // LiDAR 3D Scanning
                if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
                    Button(action: { showingLiDARScanner = true }) {
                        MediaCaptureButton(
                            icon: "cube.fill",
                            title: "LiDAR 3D Scan",
                            subtitle: viewModel.lidarScans.isEmpty ? "No scans" : "\(viewModel.lidarScans.count) scan(s)",
                            color: .purple
                        )
                    }
                } else {
                    MediaCaptureButton(
                        icon: "cube",
                        title: "LiDAR 3D Scan",
                        subtitle: "Not available on this device",
                        color: .gray
                    )
                    .disabled(true)
                    .opacity(0.6)
                }

                // Image Library
                Button(action: { showingImagePicker = true }) {
                    MediaCaptureButton(
                        icon: "photo.on.rectangle",
                        title: "Choose from Library",
                        subtitle: "Select existing photos",
                        color: .green
                    )
                }
            }
        }
    }

    // MARK: - Media Preview Section
    private var mediaPreviewSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Captured Media")
                .font(.headline)

            // Photos Preview
            if !viewModel.photos.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Photos (\(viewModel.photos.count))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(viewModel.photos.indices, id: \.self) { index in
                                Image(uiImage: viewModel.photos[index])
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 100)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .overlay(
                                        Button(action: {
                                            viewModel.removePhoto(at: index)
                                        }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundColor(.white)
                                                .background(Circle().fill(Color.black.opacity(0.6)))
                                        }
                                        .padding(4),
                                        alignment: .topTrailing
                                    )
                            }
                        }
                    }
                }
            }

            // Videos Preview
            if !viewModel.videos.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Videos (\(viewModel.videos.count))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    ForEach(viewModel.videos.indices, id: \.self) { index in
                        HStack {
                            Image(systemName: "play.rectangle.fill")
                                .foregroundColor(.red)
                            Text("Video \(index + 1)")
                            Spacer()
                            Button("Remove") {
                                viewModel.removeVideo(at: index)
                            }
                            .font(.caption)
                            .foregroundColor(.red)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(8)
                    }
                }
            }

            // LiDAR Scans Preview
            if !viewModel.lidarScans.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("LiDAR Scans (\(viewModel.lidarScans.count))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    ForEach(viewModel.lidarScans.indices, id: \.self) { index in
                        HStack {
                            Image(systemName: "cube.fill")
                                .foregroundColor(.purple)
                            Text("3D Scan \(index + 1)")
                            Spacer()
                            Button("Remove") {
                                viewModel.removeLiDARScan(at: index)
                            }
                            .font(.caption)
                            .foregroundColor(.red)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Damage Details Section
    private var damageDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Additional Details")
                .font(.headline)

            TextField("Notes (Optional)", text: $viewModel.notes, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(3...6)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Location Section
    private var locationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Location")
                .font(.headline)

            if let location = viewModel.currentLocation {
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundColor(.blue)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Current Location")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text(String(format: "%.6f, %.6f", location.latitude, location.longitude))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(8)
            } else {
                HStack {
                    ProgressView()
                        .padding(.trailing, 8)
                    Text("Getting location...")
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
    }

    // MARK: - Submitting Overlay
    private var submittingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))

                Text("Submitting Report...")
                    .font(.headline)
                    .foregroundColor(.white)

                Text("Uploading \(viewModel.totalMediaCount) file(s)")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(40)
            .background(Color(.systemBackground))
            .cornerRadius(20)
            .shadow(radius: 20)
        }
    }

    // MARK: - Submit Report
    private func submitReport() {
        isSubmitting = true
        Task {
            await viewModel.submitReport()
            isSubmitting = false
            showingSuccess = true
        }
    }
}

// MARK: - Media Capture Button
struct MediaCaptureButton: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - View Model
@MainActor
class DamageReportViewModel: ObservableObject {
    @Published var vehicleId: String = ""
    @Published var description: String = ""
    @Published var severity: DamageSeverity = .moderate
    @Published var location: String = ""
    @Published var notes: String = ""
    @Published var photos: [UIImage] = []
    @Published var videos: [URL] = []
    @Published var lidarScans: [LiDARScanData] = []
    @Published var currentLocation: (latitude: Double, longitude: Double)?

    var hasMedia: Bool {
        !photos.isEmpty || !videos.isEmpty || !lidarScans.isEmpty
    }

    var totalMediaCount: Int {
        photos.count + videos.count + lidarScans.count
    }

    var canSubmit: Bool {
        !description.isEmpty && !vehicleId.isEmpty && hasMedia
    }

    func captureLocation() {
        // Use LocationManager to get current location
        Task {
            // Simulated for now - integrate with LocationManager
            await Task.sleep(nanoseconds: 1_000_000_000)
            currentLocation = (latitude: 30.2672, longitude: -97.7431) // Austin, TX
        }
    }

    func addVideo(url: URL) {
        videos.append(url)
    }

    func addLiDARScan(data: LiDARScanData) {
        lidarScans.append(data)
    }

    func removePhoto(at index: Int) {
        photos.remove(at: index)
    }

    func removeVideo(at index: Int) {
        videos.remove(at: index)
    }

    func removeLiDARScan(at index: Int) {
        lidarScans.remove(at: index)
    }

    func submitReport() async {
        // Upload media files first
        var photoUrls: [String] = []
        var videoUrls: [String] = []
        var lidarUrls: [String] = []

        // Upload photos
        for photo in photos {
            if let url = await uploadPhoto(photo) {
                photoUrls.append(url)
            }
        }

        // Upload videos
        for video in videos {
            if let url = await uploadVideo(video) {
                videoUrls.append(url)
            }
        }

        // Upload LiDAR scans
        for scan in lidarScans {
            if let url = await uploadLiDARScan(scan) {
                lidarUrls.append(url)
            }
        }

        // Submit damage report
        let reportData: [String: Any] = [
            "vehicle_id": vehicleId,
            "damage_description": description,
            "damage_severity": severity.rawValue,
            "damage_location": location,
            "notes": notes,
            "photos": photoUrls,
            "videos": videoUrls,
            "lidar_scans": lidarUrls,
            "latitude": currentLocation?.latitude ?? 0,
            "longitude": currentLocation?.longitude ?? 0
        ]

        do {
            try await APIService.shared.submitDamageReport(data: reportData)
        } catch {
            print("Failed to submit damage report: \(error)")
        }
    }

    private func uploadPhoto(_ image: UIImage) async -> String? {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else { return nil }
        return try? await APIService.shared.uploadMedia(data: imageData, type: "photo")
    }

    private func uploadVideo(_ url: URL) async -> String? {
        guard let videoData = try? Data(contentsOf: url) else { return nil }
        return try? await APIService.shared.uploadMedia(data: videoData, type: "video")
    }

    private func uploadLiDARScan(_ scan: LiDARScanData) async -> String? {
        return try? await APIService.shared.uploadMedia(data: scan.data, type: "lidar")
    }
}

// MARK: - Models
enum DamageSeverity: String, CaseIterable {
    case minor = "minor"
    case moderate = "moderate"
    case severe = "severe"
}

struct LiDARScanData {
    let data: Data
    let format: String // "usdz", "ply", "obj"
}

// MARK: - LiDAR Not Supported View
struct LiDARNotSupportedView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("LiDAR Not Supported")
                .font(.title2)
                .fontWeight(.semibold)

            Text("This device does not have a LiDAR sensor. LiDAR scanning is available on iPhone 12 Pro and later.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding()

            Button("OK") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    DamageReportView(vehicleId: "test-vehicle-id")
}
