/**
 * Enhanced Vehicle Inspection View
 * Full-featured inspection with camera, video, LiDAR, signature, and offline support
 */

import SwiftUI
import PhotosUI
import CoreLocation

// MARK: - Enhanced Vehicle Inspection View
struct EnhancedVehicleInspectionView: View {
    let vehicle: Vehicle
    @StateObject private var viewModel = InspectionViewModel()
    @State private var inspectorName = ""
    @State private var showNamePrompt = true
    @State private var showCompletionDialog = false
    @State private var inspectionNotes = ""
    @State private var showCamera = false
    @State private var selectedCameraCategory: InspectionCategory?
    @State private var selectedItemForMedia: InspectionItem?
    @State private var showSignaturePad = false
    @State private var showOfflineWarning = false
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            if showNamePrompt {
                InspectorNamePrompt(
                    inspectorName: $inspectorName,
                    onStart: {
                        viewModel.createInspection(for: vehicle, inspectorName: inspectorName)
                        viewModel.setupLocationTracking()
                        showNamePrompt = false
                    }
                )
            } else {
                EnhancedInspectionContentView(
                    vehicle: vehicle,
                    viewModel: viewModel,
                    inspectorName: inspectorName,
                    showCamera: $showCamera,
                    selectedCameraCategory: $selectedCameraCategory,
                    selectedItemForMedia: $selectedItemForMedia,
                    showSignaturePad: $showSignaturePad,
                    showCompletionDialog: $showCompletionDialog,
                    inspectionNotes: $inspectionNotes,
                    showOfflineWarning: $showOfflineWarning,
                    onComplete: {
                        Task {
                            await viewModel.completeInspectionEnhanced(notes: inspectionNotes)
                            viewModel.stopLocationTracking()
                            dismiss()
                        }
                    }
                )
            }
        }
        .navigationTitle("Vehicle Inspection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    viewModel.stopLocationTracking()
                    dismiss()
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                if !NetworkMonitor.shared.isConnected {
                    Label("Offline", systemImage: "wifi.slash")
                        .foregroundColor(.orange)
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            if let category = selectedCameraCategory, let item = selectedItemForMedia {
                InspectionCameraView(
                    capturedMedia: Binding(
                        get: { nil },
                        set: { media in
                            if let media = media {
                                viewModel.addMedia(media, category: category, notes: item.name)
                            }
                        }
                    ),
                    isPresented: $showCamera,
                    category: category,
                    itemName: item.name
                )
            }
        }
        .sheet(isPresented: $showSignaturePad) {
            SignaturePadView(
                signatureImage: $viewModel.signatureImage,
                isPresented: $showSignaturePad
            )
        }
        .alert("Offline Mode", isPresented: $showOfflineWarning) {
            Button("OK") {}
        } message: {
            Text("You're currently offline. This inspection will be saved locally and synced when you're back online.")
        }
    }
}

// MARK: - Enhanced Inspection Content View
struct EnhancedInspectionContentView: View {
    let vehicle: Vehicle
    @ObservedObject var viewModel: InspectionViewModel
    let inspectorName: String
    @Binding var showCamera: Bool
    @Binding var selectedCameraCategory: InspectionCategory?
    @Binding var selectedItemForMedia: InspectionItem?
    @Binding var showSignaturePad: Bool
    @Binding var showCompletionDialog: Bool
    @Binding var inspectionNotes: String
    @Binding var showOfflineWarning: Bool
    let onComplete: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Progress Header
                EnhancedInspectionProgressHeader(
                    viewModel: viewModel,
                    vehicle: vehicle
                )

                // Category Sections
                ForEach(InspectionCategory.allCases, id: \.self) { category in
                    EnhancedInspectionCategoryCard(
                        category: category,
                        viewModel: viewModel,
                        showCamera: $showCamera,
                        selectedCameraCategory: $selectedCameraCategory,
                        selectedItemForMedia: $selectedItemForMedia
                    )
                }

                // Media Gallery
                if viewModel.getTotalMediaCount() > 0 {
                    MediaGallerySection(viewModel: viewModel)
                }

                // Signature Section
                SignatureDisplayView(
                    signatureImage: viewModel.signatureImage,
                    onEdit: {
                        showSignaturePad = true
                    }
                )
                .padding(.horizontal)

                // Location Info
                if let location = viewModel.currentLocation {
                    LocationInfoCard(location: location)
                        .padding(.horizontal)
                }

                // Notes Section
                NotesSection(notes: $inspectionNotes)
                    .padding(.horizontal)

                // Complete Button
                Button(action: {
                    if !NetworkMonitor.shared.isConnected {
                        showOfflineWarning = true
                    }
                    showCompletionDialog = true
                }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Complete Inspection")
                            .fontWeight(.semibold)
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        viewModel.currentInspection?.completionPercentage == 100 && viewModel.signatureImage != nil
                            ? Color.green
                            : Color.gray
                    )
                    .cornerRadius(12)
                }
                .disabled(viewModel.currentInspection?.completionPercentage != 100 || viewModel.signatureImage == nil)
                .padding(.horizontal)
                .padding(.bottom)
            }
            .padding(.vertical)
        }
        .alert("Complete Inspection", isPresented: $showCompletionDialog) {
            Button("Cancel", role: .cancel) {}
            Button("Complete") {
                onComplete()
            }
        } message: {
            if viewModel.currentInspection?.hasFailedItems == true {
                Text("This inspection has failed items. A work order will be created for repairs.")
            } else {
                Text("Are you sure you want to complete this inspection?")
            }
        }
    }
}

// MARK: - Enhanced Progress Header
struct EnhancedInspectionProgressHeader: View {
    @ObservedObject var viewModel: InspectionViewModel
    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.number)
                        .font(.headline)
                    Text("\(vehicle.make) \(vehicle.model)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Progress")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(viewModel.currentInspection?.completionPercentage ?? 0)%")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }

            ProgressView(value: Double(viewModel.currentInspection?.completionPercentage ?? 0) / 100.0)
                .tint(.blue)

            // Media Counter
            HStack(spacing: 20) {
                MediaCountBadge(
                    icon: "photo.fill",
                    count: viewModel.inspectionPhotos.count,
                    label: "Photos"
                )

                MediaCountBadge(
                    icon: "video.fill",
                    count: viewModel.inspectionVideos.count,
                    label: "Videos"
                )

                MediaCountBadge(
                    icon: "light.beacon.max.fill",
                    count: viewModel.lidarScans.count,
                    label: "Scans"
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

// MARK: - Media Count Badge
struct MediaCountBadge: View {
    let icon: String
    let count: Int
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text("\(count)")
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            .foregroundColor(count > 0 ? .blue : .secondary)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Enhanced Category Card
struct EnhancedInspectionCategoryCard: View {
    let category: InspectionCategory
    @ObservedObject var viewModel: InspectionViewModel
    @Binding var showCamera: Bool
    @Binding var selectedCameraCategory: InspectionCategory?
    @Binding var selectedItemForMedia: InspectionItem?
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Category Header
            Button(action: {
                withAnimation {
                    isExpanded.toggle()
                }
            }) {
                HStack {
                    Image(systemName: category.icon)
                        .foregroundColor(.blue)
                        .frame(width: 30)

                    Text(category.rawValue)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Spacer()

                    // Media count badge
                    let mediaCount = viewModel.getMediaCount(for: category)
                    if mediaCount > 0 {
                        Text("\(mediaCount)")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.blue))
                    }

                    // Progress indicator
                    let progress = viewModel.getProgress(for: category)
                    Circle()
                        .fill(progress == 1.0 ? Color.green : Color.orange)
                        .frame(width: 12, height: 12)

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                }
                .padding()
            }

            if isExpanded {
                Divider()

                // Items List
                VStack(spacing: 0) {
                    let items = viewModel.getCategoryItems(for: category)
                    ForEach(items) { item in
                        EnhancedInspectionItemRow(
                            item: item,
                            onUpdate: { status, notes in
                                viewModel.updateInspectionItem(itemId: item.id, status: status, notes: notes)
                            },
                            onAddMedia: {
                                selectedCameraCategory = category
                                selectedItemForMedia = item
                                showCamera = true
                            }
                        )
                        if item.id != items.last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
        .padding(.horizontal)
    }
}

// MARK: - Enhanced Inspection Item Row
struct EnhancedInspectionItemRow: View {
    let item: InspectionItem
    let onUpdate: (InspectionItemStatus, String?) -> Void
    let onAddMedia: () -> Void

    @State private var showNotes = false
    @State private var notes = ""
    @State private var selectedStatus: InspectionItemStatus

    init(item: InspectionItem, onUpdate: @escaping (InspectionItemStatus, String?) -> Void, onAddMedia: @escaping () -> Void) {
        self.item = item
        self.onUpdate = onUpdate
        self.onAddMedia = onAddMedia
        _selectedStatus = State(initialValue: item.status)
        _notes = State(initialValue: item.notes ?? "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.name)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Text(item.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Status Selector
                Menu {
                    ForEach([InspectionItemStatus.passed, .failed, .needsAttention], id: \.self) { status in
                        Button(action: {
                            selectedStatus = status
                            onUpdate(status, notes.isEmpty ? nil : notes)
                        }) {
                            Label(status.rawValue.capitalized, systemImage: statusIcon(status))
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: statusIcon(selectedStatus))
                            .foregroundColor(statusColor(selectedStatus))
                        Image(systemName: "chevron.down")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(statusColor(selectedStatus).opacity(0.15))
                    .cornerRadius(8)
                }
            }

            // Action Buttons
            HStack(spacing: 12) {
                // Add Media Button
                Button(action: onAddMedia) {
                    HStack(spacing: 4) {
                        Image(systemName: "camera.fill")
                        Text("Add Photo/Video")
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
                }

                // Notes button
                if selectedStatus != .passed {
                    Button(action: { showNotes.toggle() }) {
                        HStack(spacing: 4) {
                            Image(systemName: "note.text")
                            Text(notes.isEmpty ? "Add Notes" : "Edit Notes")
                        }
                        .font(.caption)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
            }

            if showNotes {
                TextEditor(text: $notes)
                    .frame(height: 60)
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .onChange(of: notes) { newValue in
                        onUpdate(selectedStatus, newValue.isEmpty ? nil : newValue)
                    }
            }
        }
        .padding()
    }

    private func statusIcon(_ status: InspectionItemStatus) -> String {
        switch status {
        case .pending: return "circle"
        case .passed: return "checkmark.circle.fill"
        case .failed: return "xmark.circle.fill"
        case .needsAttention: return "exclamationmark.circle.fill"
        }
    }

    private func statusColor(_ status: InspectionItemStatus) -> Color {
        switch status {
        case .pending: return .gray
        case .passed: return .green
        case .failed: return .red
        case .needsAttention: return .orange
        }
    }
}

// MARK: - Media Gallery Section
struct MediaGallerySection: View {
    @ObservedObject var viewModel: InspectionViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Inspection Media (\(viewModel.getTotalMediaCount()))", systemImage: "photo.on.rectangle.angled")
                .font(.headline)
                .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // Photos
                    ForEach(viewModel.inspectionPhotos) { photo in
                        MediaThumbnail(
                            type: .photo,
                            imageData: photo.imageData,
                            category: photo.category,
                            timestamp: photo.timestamp
                        )
                    }

                    // Videos
                    ForEach(viewModel.inspectionVideos) { video in
                        MediaThumbnail(
                            type: .video,
                            imageData: video.thumbnailData,
                            category: video.category,
                            timestamp: video.timestamp
                        )
                    }

                    // LiDAR Scans
                    ForEach(viewModel.lidarScans) { scan in
                        LiDARScanThumbnail(
                            scan: scan,
                            category: scan.category,
                            timestamp: scan.timestamp
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
        .padding(.horizontal)
    }
}

// MARK: - Media Thumbnail
struct MediaThumbnail: View {
    let type: InspectionMedia.MediaType
    let imageData: Data?
    let category: InspectionCategory
    let timestamp: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                if let imageData = imageData, let uiImage = UIImage(data: imageData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: type == .video ? "video.fill" : "photo.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        )
                }

                // Video badge
                if type == .video {
                    VStack {
                        Spacer()
                        HStack {
                            Spacer()
                            Image(systemName: "play.circle.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                                .shadow(radius: 2)
                                .padding(8)
                        }
                    }
                }
            }
            .frame(width: 150, height: 150)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(category.rawValue)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(timestamp, style: .time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(width: 150)
    }
}

// MARK: - LiDAR Scan Thumbnail
struct LiDARScanThumbnail: View {
    let scan: InspectionLiDARScan
    let category: InspectionCategory
    let timestamp: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.blue, Color.purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                VStack(spacing: 8) {
                    Image(systemName: "light.beacon.max.fill")
                        .font(.largeTitle)
                        .foregroundColor(.white)

                    if scan.damageDetected > 0 {
                        Text("\(scan.damageDetected) issues")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.red))
                    } else {
                        Text("No damage")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
            .frame(width: 150, height: 150)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(category.rawValue)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(timestamp, style: .time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(width: 150)
    }
}

// MARK: - Location Info Card
struct LocationInfoCard: View {
    let location: CLLocation

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Inspection Location", systemImage: "location.fill")
                .font(.headline)

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latitude: \(location.coordinate.latitude, specifier: "%.6f")")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("Longitude: \(location.coordinate.longitude, specifier: "%.6f")")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if let timestamp = location.timestamp.formatted(.dateTime.hour().minute()) as String? {
                        Text("Captured: \(timestamp)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Preview
#if DEBUG
struct EnhancedVehicleInspectionView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            EnhancedVehicleInspectionView(vehicle: Vehicle.sampleAvailable)
        }
    }
}
#endif
