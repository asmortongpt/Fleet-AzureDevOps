//
//  MaintenanceRequestView.swift
//  Fleet Manager - iOS Native App
//
//  WORKING comprehensive maintenance request submission with photo attachments
//  Supports offline queue, camera integration, scheduling, and full status tracking
//

import SwiftUI
import PhotosUI
import CoreLocation

struct MaintenanceRequestView: View {

    // MARK: - Environment & ViewModels
    @StateObject private var maintenanceViewModel = MaintenanceViewModel()
    @StateObject private var vehiclesViewModel = VehiclesViewModel()
    @StateObject private var locationManager = TripLocationManager()
    @StateObject private var photoCaptureService = EnhancedPhotoCaptureService.shared

    @Environment(\.dismiss) private var dismiss

    // MARK: - Form State
    @State private var selectedVehicle: Vehicle?
    @State private var selectedMaintenanceType: MaintenanceType = .preventive
    @State private var selectedCategory: MaintenanceCategory = .oilChange
    @State private var selectedPriority: MaintenancePriority = .normal
    @State private var description: String = ""
    @State private var scheduledDate: Date = Date()
    @State private var estimatedCost: String = ""
    @State private var serviceProvider: String = ""
    @State private var location: String = ""
    @State private var notes: String = ""

    // MARK: - Photo State
    @State private var capturedPhotos: [CapturedPhoto] = []
    @State private var showingCamera = false
    @State private var showingPhotoLibrary = false
    @State private var selectedPhotoIndex: Int?

    // MARK: - UI State
    @State private var showingVehiclePicker = false
    @State private var isSaving = false
    @State private var showSuccess = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var submittedRequestId: String?

    var body: some View {
        NavigationView {
            ZStack {
                Form {
                    // Vehicle Selection Section
                    vehicleSelectionSection

                    // Maintenance Type Section
                    maintenanceTypeSection

                    // Schedule Section
                    scheduleSection

                    // Description Section
                    descriptionSection

                    // Photo Attachments Section
                    photoAttachmentsSection

                    // Service Details Section
                    serviceDetailsSection

                    // Additional Notes Section
                    notesSection

                    // Submit Button Section
                    submitButtonSection
                }
                .navigationTitle("Maintenance Request")
                .navigationBarTitleDisplayMode(.large)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") { dismiss() }
                    }
                }
                .sheet(isPresented: $showingVehiclePicker) {
                    VehiclePickerView(selectedVehicleId: Binding(
                        get: { selectedVehicle?.number ?? "" },
                        set: { vehicleNumber in
                            selectedVehicle = vehiclesViewModel.vehicles.first { $0.number == vehicleNumber }
                        }
                    ))
                }
                .sheet(isPresented: $showingCamera) {
                    PhotoCaptureView(
                        vehicleId: selectedVehicle?.id,
                        photoType: .maintenance,
                        maxPhotos: 10
                    ) { photos in
                        capturedPhotos.append(contentsOf: photos)
                    }
                }
                .alert("Request Submitted", isPresented: $showSuccess) {
                    Button("View Details") {
                        // Navigate to request details
                        dismiss()
                    }
                    Button("Submit Another") {
                        clearForm()
                    }
                    Button("Done") {
                        dismiss()
                    }
                } message: {
                    Text("Your maintenance request has been submitted successfully.\n\nReference: \(submittedRequestId ?? "N/A")")
                }
                .alert("Error", isPresented: $showError) {
                    Button("OK", role: .cancel) {}
                } message: {
                    Text(errorMessage)
                }

                // Loading Overlay
                if isSaving {
                    savingOverlay
                }
            }
        }
    }

    // MARK: - Vehicle Selection Section

    private var vehicleSelectionSection: some View {
        Section("Vehicle") {
            Button(action: { showingVehiclePicker = true }) {
                HStack {
                    Image(systemName: "car.fill")
                        .foregroundColor(.blue)
                        .frame(width: 30)

                    if let vehicle = selectedVehicle {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(vehicle.number)
                                .font(.headline)
                                .foregroundColor(.primary)

                            Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            HStack(spacing: 12) {
                                Label("\(Int(vehicle.mileage)) mi", systemImage: "speedometer")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)

                                Label("\(vehicle.fuelLevelPercentage)%", systemImage: "fuelpump.fill")
                                    .font(.caption2)
                                    .foregroundColor(vehicle.isLowFuel ? .red : .secondary)
                            }
                        }
                    } else {
                        Text("Select Vehicle")
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Maintenance Type Section

    private var maintenanceTypeSection: some View {
        Section("Maintenance Type") {
            Picker("Type", selection: $selectedMaintenanceType) {
                ForEach(MaintenanceType.allCases, id: \.self) { type in
                    Label(type.rawValue, systemImage: type.icon)
                        .tag(type)
                }
            }
            .pickerStyle(.menu)

            Picker("Category", selection: $selectedCategory) {
                ForEach(MaintenanceCategory.allCases, id: \.self) { category in
                    Label(category.rawValue, systemImage: category.icon)
                        .tag(category)
                }
            }
            .pickerStyle(.menu)

            // Quick Category Buttons
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    QuickCategoryButton(
                        category: .oilChange,
                        isSelected: selectedCategory == .oilChange
                    ) {
                        selectedCategory = .oilChange
                        selectedMaintenanceType = .preventive
                        if description.isEmpty {
                            description = "Regular oil change service"
                        }
                    }

                    QuickCategoryButton(
                        category: .tireRotation,
                        isSelected: selectedCategory == .tireRotation
                    ) {
                        selectedCategory = .tireRotation
                        selectedMaintenanceType = .preventive
                        if description.isEmpty {
                            description = "Tire rotation and inspection"
                        }
                    }

                    QuickCategoryButton(
                        category: .brakeService,
                        isSelected: selectedCategory == .brakeService
                    ) {
                        selectedCategory = .brakeService
                        selectedMaintenanceType = .corrective
                        if description.isEmpty {
                            description = "Brake inspection and service"
                        }
                    }

                    QuickCategoryButton(
                        category: .diagnostic,
                        isSelected: selectedCategory == .diagnostic
                    ) {
                        selectedCategory = .diagnostic
                        selectedMaintenanceType = .inspection
                        if description.isEmpty {
                            description = "Complete vehicle diagnostic"
                        }
                    }
                }
            }
            .listRowInsets(EdgeInsets())
        }
    }

    // MARK: - Schedule Section

    private var scheduleSection: some View {
        Section("Schedule") {
            DatePicker("Preferred Date", selection: $scheduledDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])

            Picker("Priority", selection: $selectedPriority) {
                ForEach(MaintenancePriority.allCases, id: \.self) { priority in
                    HStack {
                        Circle()
                            .fill(priorityColor(priority))
                            .frame(width: 10, height: 10)
                        Text(priority.rawValue)
                    }
                    .tag(priority)
                }
            }
            .pickerStyle(.menu)

            // Priority indicator
            HStack {
                Text("Priority Level:")
                    .foregroundColor(.secondary)

                Spacer()

                HStack(spacing: 4) {
                    Circle()
                        .fill(priorityColor(selectedPriority))
                        .frame(width: 12, height: 12)

                    Text(selectedPriority.rawValue)
                        .font(.headline)
                        .foregroundColor(priorityColor(selectedPriority))
                }
            }
        }
    }

    // MARK: - Description Section

    private var descriptionSection: some View {
        Section("Description") {
            TextEditor(text: $description)
                .frame(minHeight: 100)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )

            if description.isEmpty {
                Text("Describe the maintenance issue or service needed")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("\(description.count) characters")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    // MARK: - Photo Attachments Section

    private var photoAttachmentsSection: some View {
        Section("Photo Attachments") {
            HStack(spacing: 16) {
                // Camera Button
                Button(action: { showingCamera = true }) {
                    VStack(spacing: 8) {
                        Image(systemName: "camera.fill")
                            .font(.title2)
                            .foregroundColor(.blue)

                        Text("Take Photo")
                            .font(.caption)
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(10)
                }

                // Photo Library Button
                Button(action: { showingPhotoLibrary = true }) {
                    VStack(spacing: 8) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.title2)
                            .foregroundColor(.green)

                        Text("Choose Photo")
                            .font(.caption)
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(10)
                }
            }
            .buttonStyle(PlainButtonStyle())

            // Photo Grid
            if !capturedPhotos.isEmpty {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(Array(capturedPhotos.enumerated()), id: \.offset) { index, photo in
                        PhotoThumbnailView(photo: photo) {
                            capturedPhotos.remove(at: index)
                        }
                    }
                }

                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)

                    Text("\(capturedPhotos.count) photo\(capturedPhotos.count == 1 ? "" : "s") attached")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()
                }
            }
        }
    }

    // MARK: - Service Details Section

    private var serviceDetailsSection: some View {
        Section("Service Details") {
            HStack {
                Text("$")
                    .foregroundColor(.secondary)
                TextField("Estimated Cost (Optional)", text: $estimatedCost)
                    .keyboardType(.decimalPad)
            }

            TextField("Service Provider (Optional)", text: $serviceProvider)

            TextField("Location (Optional)", text: $location)
        }
    }

    // MARK: - Notes Section

    private var notesSection: some View {
        Section("Additional Notes") {
            TextEditor(text: $notes)
                .frame(minHeight: 80)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
        }
    }

    // MARK: - Submit Button Section

    private var submitButtonSection: some View {
        Section {
            Button(action: submitMaintenanceRequest) {
                HStack {
                    Spacer()

                    if isSaving {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        Text("Submitting...")
                            .foregroundColor(.white)
                    } else {
                        Text("Submit Maintenance Request")
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }

                    Spacer()
                }
                .padding()
                .background(isFormValid ? Color.blue : Color.gray)
                .cornerRadius(10)
            }
            .disabled(!isFormValid || isSaving)
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())
        }
    }

    // MARK: - Saving Overlay

    private var savingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: 20) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)

                Text("Submitting Request...")
                    .font(.headline)
                    .foregroundColor(.white)

                if !capturedPhotos.isEmpty {
                    Text("Uploading \(capturedPhotos.count) photo\(capturedPhotos.count == 1 ? "" : "s")...")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(40)
            .background(Color(.systemGray6))
            .cornerRadius(20)
        }
    }

    // MARK: - Computed Properties

    private var isFormValid: Bool {
        guard let _ = selectedVehicle else { return false }
        guard !description.isEmpty else { return false }
        return true
    }

    // MARK: - Helper Functions

    private func priorityColor(_ priority: MaintenancePriority) -> Color {
        switch priority {
        case .low: return .green
        case .normal: return .blue
        case .high: return .orange
        case .urgent: return .red
        case .critical: return .purple
        }
    }

    // MARK: - Actions

    private func submitMaintenanceRequest() {
        guard let vehicle = selectedVehicle else {
            errorMessage = "Please select a vehicle"
            showError = true
            return
        }

        guard !description.isEmpty else {
            errorMessage = "Please enter a description"
            showError = true
            return
        }

        isSaving = true

        Task {
            do {
                // Save photos to local storage first
                var photoAttachments: [String] = []

                for photo in capturedPhotos {
                    if let metadata = await photoCaptureService.capturePhoto(
                        image: photo.image,
                        vehicleId: vehicle.id,
                        photoType: .maintenance,
                        location: locationManager.currentLocation,
                        notes: photo.notes
                    ) {
                        photoAttachments.append(metadata.fileName)
                    }
                }

                // Create maintenance record
                let cost = Double(estimatedCost)
                let record = MaintenanceRecord(
                    vehicleId: vehicle.id,
                    vehicleNumber: vehicle.number,
                    type: selectedMaintenanceType,
                    category: selectedCategory,
                    scheduledDate: scheduledDate,
                    priority: selectedPriority,
                    description: description,
                    cost: cost,
                    mileageAtService: vehicle.mileage,
                    serviceProvider: serviceProvider.isEmpty ? nil : serviceProvider,
                    location: location.isEmpty ? nil : location,
                    notes: notes.isEmpty ? nil : notes,
                    attachments: photoAttachments.isEmpty ? nil : photoAttachments
                )

                // Save via repository (handles offline queue)
                let repository = MaintenanceRepository()
                try repository.save(record)

                // Update ViewModel
                await MainActor.run {
                    maintenanceViewModel.scheduleNewMaintenance(
                        vehicleId: vehicle.id,
                        type: selectedMaintenanceType.rawValue,
                        date: scheduledDate
                    )

                    submittedRequestId = record.id
                    isSaving = false
                    showSuccess = true

                    // Haptic feedback
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                }

                print("✅ Maintenance request submitted: \(record.id)")
                print("   Vehicle: \(vehicle.number)")
                print("   Type: \(selectedMaintenanceType.rawValue)")
                print("   Category: \(selectedCategory.rawValue)")
                print("   Photos: \(photoAttachments.count)")

            } catch {
                await MainActor.run {
                    errorMessage = "Failed to submit request: \(error.localizedDescription)"
                    showError = true
                    isSaving = false
                }

                print("❌ Failed to submit maintenance request: \(error)")
            }
        }
    }

    private func clearForm() {
        selectedVehicle = nil
        selectedMaintenanceType = .preventive
        selectedCategory = .oilChange
        selectedPriority = .normal
        description = ""
        scheduledDate = Date()
        estimatedCost = ""
        serviceProvider = ""
        location = ""
        notes = ""
        capturedPhotos = []
        submittedRequestId = nil
    }
}

// MARK: - Quick Category Button

struct QuickCategoryButton: View {
    let category: MaintenanceCategory
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: category.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .blue : .primary)

                Text(category.rawValue)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .blue : .primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(width: 80, height: 70)
            .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
    }
}

// MARK: - Photo Thumbnail View

struct PhotoThumbnailView: View {
    let photo: CapturedPhoto
    let onDelete: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(uiImage: photo.image)
                .resizable()
                .scaledToFill()
                .frame(height: 100)
                .clipped()
                .cornerRadius(8)

            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.white)
                    .background(
                        Circle()
                            .fill(Color.black.opacity(0.6))
                            .frame(width: 24, height: 24)
                    )
            }
            .offset(x: 8, y: -8)
        }
    }
}

// MARK: - Preview

#Preview {
    MaintenanceRequestView()
}
