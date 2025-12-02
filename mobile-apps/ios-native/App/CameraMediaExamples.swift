/**
 * Camera and Media Integration Examples
 * Real-world usage examples for Fleet Management app
 * Demonstrates how to use all camera and media features
 */

import SwiftUI

// MARK: - Example 1: Complete Vehicle Inspection
struct VehicleInspectionExampleView: View {
    @StateObject private var uploadService = ImageUploadService()
    @State private var showingCamera = false
    @State private var showingVINScanner = false
    @State private var showingDocumentScanner = false
    @State private var inspectionPhotos: [CapturedPhoto] = []
    @State private var scannedVIN: String?

    let vehicle: Vehicle

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Vehicle Info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Vehicle Inspection")
                        .font(.title)
                        .fontWeight(.bold)

                    if let vin = scannedVIN {
                        HStack {
                            Text("VIN:")
                                .foregroundColor(.secondary)
                            Text(vin)
                                .font(.system(.body, design: .monospaced))
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()

                // Scan VIN
                Button(action: { showingVINScanner = true }) {
                    Label("Scan VIN", systemImage: "barcode.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .padding(.horizontal)

                // Capture Photos
                Button(action: { showingCamera = true }) {
                    Label("Capture Inspection Photos", systemImage: "camera.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .padding(.horizontal)

                // Scan Documents
                if VNDocumentCameraViewController.isSupported {
                    DocumentScannerButton(documentType: .inspectionForm) { documents in
                        handleScannedDocuments(documents)
                    }
                    .padding(.horizontal)
                }

                // Photo Grid
                if !inspectionPhotos.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Captured Photos (\(inspectionPhotos.count))")
                            .font(.headline)
                            .padding(.horizontal)

                        PhotoGridView(photos: inspectionPhotos)
                            .frame(height: 300)
                    }
                }

                // Upload Progress
                if !uploadService.uploadProgress.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Upload Progress")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(Array(uploadService.uploadProgress.keys), id: \.self) { photoId in
                            if let progress = uploadService.uploadProgress[photoId] {
                                HStack {
                                    Text("Photo")
                                    ProgressView(value: progress)
                                    Text("\(Int(progress * 100))%")
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }

                // Submit Button
                if !inspectionPhotos.isEmpty {
                    Button(action: submitInspection) {
                        Text("Submit Inspection")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding()
                }
            }
        }
        .sheet(isPresented: $showingCamera) {
            PhotoCaptureView(
                vehicleId: vehicle.id,
                photoType: .inspection,
                maxPhotos: 20
            ) { photos in
                inspectionPhotos.append(contentsOf: photos)
            }
        }
        .sheet(isPresented: $showingVINScanner) {
            BarcodeScannerView(scanMode: .vin) { vin, type in
                scannedVIN = vin
            }
        }
    }

    func submitInspection() {
        Task {
            do {
                let results = try await uploadService.uploadImages(
                    inspectionPhotos,
                    vehicleId: vehicle.id,
                    token: "your-auth-token"
                )

                let successCount = results.filter { $0.success }.count
                print("✅ Uploaded \(successCount) photos successfully")
            } catch {
                print("❌ Upload error: \(error)")
            }
        }
    }

    func handleScannedDocuments(_ documents: [ScannedDocument]) {
        // Convert documents to photos for upload
        for document in documents {
            let photo = CapturedPhoto(
                image: document.image,
                vehicleId: vehicle.id,
                photoType: .inspection,
                timestamp: document.timestamp
            )
            inspectionPhotos.append(photo)
        }
    }
}

// MARK: - Example 2: Damage Documentation
struct DamageDocumentationView: View {
    @StateObject private var uploadService = ImageUploadService()
    @StateObject private var photoLibrary = PhotoLibraryManager()

    @State private var showingCamera = false
    @State private var showingPhotoPicker = false
    @State private var showingSourcePicker = false
    @State private var damagePhotos: [CapturedPhoto] = []
    @State private var damageLocation: String = ""
    @State private var damageNotes: String = ""

    let vehicle: Vehicle

    var body: some View {
        NavigationView {
            Form {
                Section("Damage Information") {
                    TextField("Damage Location", text: $damageLocation)
                    TextEditor(text: $damageNotes)
                        .frame(height: 100)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2))
                        )
                }

                Section("Photos") {
                    Button(action: { showingSourcePicker = true }) {
                        Label("Add Photos", systemImage: "photo.on.rectangle.angled")
                    }

                    if !damagePhotos.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(damagePhotos) { photo in
                                    PhotoThumbnail(photo: photo) {
                                        if let index = damagePhotos.firstIndex(where: { $0.id == photo.id }) {
                                            damagePhotos.remove(at: index)
                                        }
                                    }
                                }
                            }
                        }
                        .frame(height: 80)
                    }
                }

                Section {
                    Button(action: submitDamageReport) {
                        Text("Submit Damage Report")
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(damagePhotos.isEmpty)
                }
            }
            .navigationTitle("Damage Report")
            .sheet(isPresented: $showingCamera) {
                PhotoCaptureView(
                    vehicleId: vehicle.id,
                    photoType: .damage,
                    maxPhotos: 10
                ) { photos in
                    damagePhotos.append(contentsOf: photos)
                }
            }
            .sheet(isPresented: $showingPhotoPicker) {
                if #available(iOS 14, *) {
                    PhotoPickerSheet(maxSelection: 10) { images in
                        for image in images {
                            let photo = CapturedPhoto(
                                image: image,
                                vehicleId: vehicle.id,
                                photoType: .damage,
                                timestamp: Date()
                            )
                            damagePhotos.append(photo)
                        }
                    }
                }
            }
            .sheet(isPresented: $showingSourcePicker) {
                PhotoSourcePicker(
                    onSelectCamera: {
                        showingCamera = true
                    },
                    onSelectLibrary: {
                        showingPhotoPicker = true
                    }
                )
            }
        }
    }

    func submitDamageReport() {
        // Add notes to photos
        for i in 0..<damagePhotos.count {
            damagePhotos[i].location = damageLocation
            damagePhotos[i].notes = damageNotes
        }

        Task {
            do {
                let results = try await uploadService.uploadImages(
                    damagePhotos,
                    vehicleId: vehicle.id,
                    token: "your-auth-token"
                )

                print("✅ Damage report submitted with \(results.count) photos")
            } catch {
                print("❌ Submission error: \(error)")
            }
        }
    }
}

// MARK: - Example 3: Maintenance Record Entry
struct MaintenanceRecordView: View {
    @State private var showingCamera = false
    @State private var showingDocumentScanner = false
    @State private var maintenancePhotos: [CapturedPhoto] = []
    @State private var receipts: [ScannedDocument] = []
    @State private var odometerReading: String = ""

    let vehicle: Vehicle

    var body: some View {
        NavigationView {
            Form {
                Section("Odometer Reading") {
                    HStack {
                        TextField("Enter reading", text: $odometerReading)
                            .keyboardType(.numberPad)

                        Button(action: { showingCamera = true }) {
                            Image(systemName: "camera.fill")
                        }
                    }
                }

                Section("Photos") {
                    Button(action: {
                        showingCamera = true
                    }) {
                        Label("Capture Maintenance Photos", systemImage: "camera.fill")
                    }

                    if !maintenancePhotos.isEmpty {
                        Text("\(maintenancePhotos.count) photos captured")
                            .foregroundColor(.secondary)
                    }
                }

                Section("Receipts") {
                    if VNDocumentCameraViewController.isSupported {
                        DocumentScannerButton(documentType: .maintenanceReceipt) { documents in
                            receipts.append(contentsOf: documents)
                        }

                        if !receipts.isEmpty {
                            Text("\(receipts.count) receipts scanned")
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Section {
                    Button(action: submitMaintenanceRecord) {
                        Text("Submit Maintenance Record")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle("Maintenance Record")
            .sheet(isPresented: $showingCamera) {
                PhotoCaptureView(
                    vehicleId: vehicle.id,
                    photoType: .maintenance,
                    maxPhotos: 5
                ) { photos in
                    maintenancePhotos.append(contentsOf: photos)
                }
            }
        }
    }

    func submitMaintenanceRecord() {
        print("✅ Submitting maintenance record")
        print("   Odometer: \(odometerReading)")
        print("   Photos: \(maintenancePhotos.count)")
        print("   Receipts: \(receipts.count)")
    }
}

// MARK: - Example 4: Quick Photo Actions
struct QuickPhotoActionsView: View {
    @State private var showingCamera = false
    @State private var showingScanner = false
    @State private var photoType: PhotoType = .general

    let vehicle: Vehicle

    var body: some View {
        VStack(spacing: 16) {
            Text("Quick Actions")
                .font(.headline)

            // Photo action buttons
            VStack(spacing: 12) {
                PhotoActionButton(
                    title: "Capture Damage",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                ) {
                    photoType = .damage
                    showingCamera = true
                }

                PhotoActionButton(
                    title: "Capture Interior",
                    icon: "car.fill",
                    color: .blue
                ) {
                    photoType = .interior
                    showingCamera = true
                }

                PhotoActionButton(
                    title: "Capture Exterior",
                    icon: "car.side.fill",
                    color: .green
                ) {
                    photoType = .exterior
                    showingCamera = true
                }

                PhotoActionButton(
                    title: "Scan VIN",
                    icon: "barcode.viewfinder",
                    color: .orange
                ) {
                    showingScanner = true
                }
            }
        }
        .padding()
        .sheet(isPresented: $showingCamera) {
            PhotoCaptureView(
                vehicleId: vehicle.id,
                photoType: photoType,
                maxPhotos: 5
            ) { photos in
                print("Captured \(photos.count) \(photoType.title) photos")
            }
        }
        .sheet(isPresented: $showingScanner) {
            BarcodeScannerView(scanMode: .vin) { vin, type in
                print("Scanned VIN: \(vin)")
            }
        }
    }
}

struct PhotoActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .frame(width: 30)
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(color.opacity(0.1))
            .cornerRadius(10)
        }
        .foregroundColor(.primary)
    }
}

// MARK: - Example 5: Asset Tag Scanner
struct AssetTagScannerView: View {
    @State private var showingScanner = false
    @State private var scannedAssets: [ScannedAsset] = []

    var body: some View {
        NavigationView {
            VStack {
                List {
                    ForEach(scannedAssets) { asset in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(asset.assetTag)
                                .font(.headline)
                                .fontDesign(.monospaced)

                            Text(asset.timestamp.formatted())
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Button(action: { showingScanner = true }) {
                    Label("Scan Asset Tag", systemImage: "qrcode.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .padding()
            }
            .navigationTitle("Asset Scanner")
            .sheet(isPresented: $showingScanner) {
                BarcodeScannerView(scanMode: .assetTag) { tag, type in
                    let asset = ScannedAsset(
                        assetTag: tag,
                        barcodeType: type,
                        timestamp: Date()
                    )
                    scannedAssets.append(asset)
                }
            }
        }
    }
}

struct ScannedAsset: Identifiable {
    let id = UUID()
    let assetTag: String
    let barcodeType: String
    let timestamp: Date
}

// MARK: - Example 6: Photo Upload Monitor
struct PhotoUploadMonitorView: View {
    @ObservedObject var uploadService: ImageUploadService

    var body: some View {
        List {
            ForEach(Array(uploadService.uploadStatus.keys), id: \.self) { photoId in
                if let status = uploadService.uploadStatus[photoId] {
                    HStack {
                        Image(systemName: statusIcon(for: status))
                            .foregroundColor(statusColor(for: status))

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Photo \(photoId.uuidString.prefix(8))")
                                .font(.caption)
                                .fontDesign(.monospaced)

                            Text(status.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        if case .uploading = status,
                           let progress = uploadService.uploadProgress[photoId] {
                            CircularProgressView(progress: progress)
                        }
                    }
                }
            }
        }
        .navigationTitle("Upload Status")
    }

    func statusIcon(for status: UploadStatus) -> String {
        switch status {
        case .pending: return "clock"
        case .uploading: return "arrow.up.circle"
        case .completed: return "checkmark.circle.fill"
        case .failed: return "xmark.circle.fill"
        }
    }

    func statusColor(for status: UploadStatus) -> Color {
        switch status {
        case .pending: return .gray
        case .uploading: return .blue
        case .completed: return .green
        case .failed: return .red
        }
    }
}

struct CircularProgressView: View {
    let progress: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.gray.opacity(0.3), lineWidth: 2)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.blue, lineWidth: 2)
                .rotationEffect(.degrees(-90))
        }
        .frame(width: 24, height: 24)
    }
}

// MARK: - Mock Vehicle Model removed - using real Vehicle model from App/Models/Vehicle.swift

// MARK: - Example Preview
#Preview("Vehicle Inspection") {
    VehicleInspectionView(vehicle: Vehicle(
        id: "VEH-12345",
        tenantId: "TENANT-001",
        number: "V-123",
        type: .sedan,
        make: "Honda",
        model: "Accord",
        year: 2021,
        vin: "1HGBH41JXMN109186",
        licensePlate: "ABC123",
        status: .active,
        location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Tallahassee, FL"),
        region: "North",
        department: "Fleet",
        fuelLevel: 0.75,
        fuelType: .gasoline,
        mileage: 45000,
        ownership: .owned,
        lastService: "2024-01-15",
        nextService: "2024-07-15",
        alerts: []
    ))
}

#Preview("Damage Documentation") {
    DamageDocumentationView(vehicle: Vehicle(
        id: "VEH-12345",
        tenantId: "TENANT-001",
        number: "V-123",
        type: .sedan,
        make: "Honda",
        model: "Accord",
        year: 2021,
        vin: "1HGBH41JXMN109186",
        licensePlate: "ABC123",
        status: .active,
        location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Tallahassee, FL"),
        region: "North",
        department: "Fleet",
        fuelLevel: 0.75,
        fuelType: .gasoline,
        mileage: 45000,
        ownership: .owned,
        lastService: "2024-01-15",
        nextService: "2024-07-15",
        alerts: []
    ))
}

#Preview("Quick Actions") {
    QuickPhotoActionsView(vehicle: Vehicle(
        id: "VEH-12345",
        tenantId: "TENANT-001",
        number: "V-123",
        type: .sedan,
        make: "Honda",
        model: "Accord",
        year: 2021,
        vin: "1HGBH41JXMN109186",
        licensePlate: "ABC123",
        status: .active,
        location: VehicleLocation(lat: 30.4383, lng: -84.2807, address: "Tallahassee, FL"),
        region: "North",
        department: "Fleet",
        fuelLevel: 0.75,
        fuelType: .gasoline,
        mileage: 45000,
        ownership: .owned,
        lastService: "2024-01-15",
        nextService: "2024-07-15",
        alerts: []
    ))
}
