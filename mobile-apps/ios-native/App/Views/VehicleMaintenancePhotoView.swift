//
//  VehicleMaintenancePhotoView.swift
//  Fleet Management
//
//  Specialized photo capture view for maintenance records
//  Supports odometer, fuel gauge, and damage documentation with OCR
//

import SwiftUI
import PhotosUI
import CoreLocation

struct VehicleMaintenancePhotoView: View {

    // MARK: - Properties
    let vehicleId: String
    let maintenanceType: MaintenancePhotoType

    @StateObject private var photoCaptureService = EnhancedPhotoCaptureService.shared
    @StateObject private var locationManager = TripLocationManager()

    @State private var showingCamera = false
    @State private var capturedPhotos: [PhotoMetadata] = []
    @State private var selectedPhoto: PhotoMetadata?
    @State private var showingPhotoDetail = false
    @State private var showingProcessing = false
    @State private var photoNotes = ""

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 20) {
                        // Header Card
                        headerCard

                        // Quick Capture Buttons
                        quickCaptureSection

                        // Captured Photos Grid
                        if !capturedPhotos.isEmpty {
                            capturedPhotosSection
                        }

                        // Instructions
                        instructionsSection
                    }
                    .padding()
                }

                // Processing Overlay
                if photoCaptureService.isProcessing {
                    processingOverlay
                }
            }
            .navigationTitle("Maintenance Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        savePhotos()
                    }
                    .disabled(capturedPhotos.isEmpty)
                }
            }
            .sheet(isPresented: $showingCamera) {
                modernCameraView
            }
            .sheet(isPresented: $showingPhotoDetail) {
                if let photo = selectedPhoto {
                    PhotoDetailView(metadata: photo, onDelete: {
                        deletePhoto(photo)
                    })
                }
            }
            .onAppear {
                loadExistingPhotos()
                locationManager.requestPermissions()
            }
        }
    }

    // MARK: - Header Card

    private var headerCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: maintenanceType.icon)
                    .font(.title)
                    .foregroundColor(.blue)

                VStack(alignment: .leading) {
                    Text(maintenanceType.title)
                        .font(.headline)

                    Text(maintenanceType.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            if capturedPhotos.count > 0 {
                Divider()

                HStack {
                    Text("\(capturedPhotos.count) photo\(capturedPhotos.count == 1 ? "" : "s") captured")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Spacer()

                    if let lastPhoto = capturedPhotos.last {
                        if let mileage = lastPhoto.mileage {
                            Label("\(mileage) mi", systemImage: "speedometer")
                                .font(.caption)
                                .foregroundColor(.green)
                        }

                        if let fuel = lastPhoto.fuelLevel {
                            Label("\(fuel)%", systemImage: "fuelpump.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Quick Capture Section

    private var quickCaptureSection: some View {
        VStack(spacing: 12) {
            Text("Quick Capture")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickCaptureButton(
                    icon: "speedometer",
                    title: "Odometer",
                    color: .blue,
                    action: { capturePhoto(type: .odometer) }
                )

                QuickCaptureButton(
                    icon: "fuelpump.fill",
                    title: "Fuel Gauge",
                    color: .orange,
                    action: { capturePhoto(type: .fuelGauge) }
                )

                QuickCaptureButton(
                    icon: "exclamationmark.triangle.fill",
                    title: "Damage",
                    color: .red,
                    action: { capturePhoto(type: .damage) }
                )

                QuickCaptureButton(
                    icon: "camera.fill",
                    title: "General",
                    color: .green,
                    action: { capturePhoto(type: .general) }
                )
            }
        }
    }

    // MARK: - Captured Photos Section

    private var capturedPhotosSection: some View {
        VStack(spacing: 12) {
            Text("Captured Photos")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(capturedPhotos, id: \.id) { metadata in
                    PhotoThumbnailCard(metadata: metadata) {
                        selectedPhoto = metadata
                        showingPhotoDetail = true
                    }
                }
            }
        }
    }

    // MARK: - Instructions Section

    private var instructionsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Tips for Best Results", systemImage: "lightbulb.fill")
                .font(.headline)
                .foregroundColor(.orange)

            VStack(alignment: .leading, spacing: 6) {
                InstructionRow(text: "Ensure good lighting for clear photos")
                InstructionRow(text: "Hold camera steady for odometer/gauge readings")
                InstructionRow(text: "Capture multiple angles for damage documentation")
                InstructionRow(text: "Photos are automatically analyzed with OCR")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
    }

    // MARK: - Processing Overlay

    private var processingOverlay: some View {
        ZStack {
            Color.black.opacity(0.7)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: 20) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)

                Text("Processing photo...")
                    .font(.headline)
                    .foregroundColor(.white)

                if photoCaptureService.processingProgress > 0 {
                    ProgressView(value: photoCaptureService.processingProgress)
                        .progressViewStyle(LinearProgressViewStyle(tint: .white))
                        .frame(width: 200)
                }

                if let error = photoCaptureService.lastError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            .padding(40)
            .background(Color(.systemGray6))
            .cornerRadius(20)
        }
    }

    // MARK: - Modern Camera View

    private var modernCameraView: some View {
        PhotoCaptureView(
            vehicleId: vehicleId,
            photoType: convertToPhotoType(maintenanceType),
            maxPhotos: 10
        ) { capturedImages in
            Task {
                await processPhotos(capturedImages)
            }
        }
    }

    // MARK: - Actions

    private func capturePhoto(type: PhotoCaptureType) {
        showingCamera = true
    }

    private func processPhotos(_ photos: [CapturedPhoto]) async {
        for photo in photos {
            let metadata = await photoCaptureService.capturePhoto(
                image: photo.image,
                vehicleId: vehicleId,
                photoType: convertToPhotoCaptureType(photo.photoType),
                location: locationManager.currentLocation,
                notes: photoNotes
            )

            if let metadata = metadata {
                await MainActor.run {
                    capturedPhotos.append(metadata)
                }
            }
        }
    }

    private func deletePhoto(_ metadata: PhotoMetadata) {
        if photoCaptureService.deletePhoto(metadata: metadata) {
            capturedPhotos.removeAll { $0.id == metadata.id }
        }
        showingPhotoDetail = false
    }

    private func loadExistingPhotos() {
        // Load photos for this vehicle and maintenance type
        let allPhotos = photoCaptureService.getPhotos(for: vehicleId)

        // Filter by maintenance type if specific
        capturedPhotos = allPhotos.filter { photo in
            switch maintenanceType {
            case .odometer:
                return photo.photoType == .odometer
            case .fuelLevel:
                return photo.photoType == .fuelGauge
            case .damage:
                return photo.photoType == .damage
            case .general:
                return true
            }
        }
    }

    private func savePhotos() {
        // Photos are already saved individually
        // This just dismisses the view
        dismiss()
    }

    // MARK: - Helper Conversions

    private func convertToPhotoType(_ maintenanceType: MaintenancePhotoType) -> PhotoType {
        switch maintenanceType {
        case .odometer:
            return .odometer
        case .fuelLevel:
            return .general
        case .damage:
            return .damage
        case .general:
            return .general
        }
    }

    private func convertToPhotoCaptureType(_ photoType: PhotoType) -> PhotoCaptureType {
        switch photoType {
        case .odometer:
            return .odometer
        case .damage:
            return .damage
        case .maintenance:
            return .maintenance
        case .inspection:
            return .inspection
        case .vin:
            return .vin
        default:
            return .general
        }
    }
}

// MARK: - Maintenance Photo Type

enum MaintenancePhotoType {
    case odometer
    case fuelLevel
    case damage
    case general

    var title: String {
        switch self {
        case .odometer:
            return "Odometer Reading"
        case .fuelLevel:
            return "Fuel Level"
        case .damage:
            return "Damage Documentation"
        case .general:
            return "General Maintenance"
        }
    }

    var description: String {
        switch self {
        case .odometer:
            return "Capture odometer for mileage tracking"
        case .fuelLevel:
            return "Document fuel gauge reading"
        case .damage:
            return "Photo evidence of vehicle damage"
        case .general:
            return "General maintenance documentation"
        }
    }

    var icon: String {
        switch self {
        case .odometer:
            return "speedometer"
        case .fuelLevel:
            return "fuelpump.fill"
        case .damage:
            return "exclamationmark.triangle.fill"
        case .general:
            return "camera.fill"
        }
    }
}

// MARK: - Quick Capture Button

struct QuickCaptureButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .cornerRadius(10)
        }
    }
}

// MARK: - Photo Thumbnail Card

struct PhotoThumbnailCard: View {
    let metadata: PhotoMetadata
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 0) {
                if let image = EnhancedPhotoCaptureService.shared.loadPhoto(metadata: metadata) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 100)
                        .clipped()
                } else {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 100)
                        .overlay(
                            Image(systemName: "photo")
                                .foregroundColor(.gray)
                        )
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: metadata.photoType.icon)
                            .font(.caption2)

                        Text(metadata.photoType.title)
                            .font(.caption2)
                            .lineLimit(1)
                    }

                    if let mileage = metadata.mileage {
                        Text("\(mileage) mi")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    } else if let fuel = metadata.fuelLevel {
                        Text("\(fuel)%")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
                .background(Color(.systemGray6))
            }
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Instruction Row

struct InstructionRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.orange)
                .font(.caption)

            Text(text)
        }
    }
}

// MARK: - Photo Detail View

struct PhotoDetailView: View {
    let metadata: PhotoMetadata
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Photo
                    if let image = EnhancedPhotoCaptureService.shared.loadPhoto(metadata: metadata) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .cornerRadius(12)
                            .shadow(radius: 5)
                    }

                    // Metadata
                    VStack(spacing: 16) {
                        MetadataRow(label: "Type", value: metadata.photoType.title, icon: metadata.photoType.icon)

                        if let mileage = metadata.mileage {
                            MetadataRow(label: "Mileage", value: "\(mileage) miles", icon: "speedometer")
                        }

                        if let fuel = metadata.fuelLevel {
                            MetadataRow(label: "Fuel Level", value: "\(fuel)%", icon: "fuelpump.fill")
                        }

                        if let text = metadata.recognizedText {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Recognized Text", systemImage: "text.viewfinder")
                                    .font(.headline)

                                Text(text)
                                    .font(.body)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(8)
                            }
                        }

                        MetadataRow(
                            label: "Captured",
                            value: formatDate(metadata.timestamp),
                            icon: "clock"
                        )

                        if let notes = metadata.notes {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Notes", systemImage: "note.text")
                                    .font(.headline)

                                Text(notes)
                                    .font(.body)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                }
                .padding()
            }
            .navigationTitle("Photo Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(role: .destructive) {
                        onDelete()
                    } label: {
                        Image(systemName: "trash")
                            .foregroundColor(.red)
                    }
                }
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Metadata Row

struct MetadataRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Preview

struct VehicleMaintenancePhotoView_Previews: PreviewProvider {
    static var previews: some View {
        VehicleMaintenancePhotoView(
            vehicleId: "vehicle-123",
            maintenanceType: .odometer
        )
    }
}
