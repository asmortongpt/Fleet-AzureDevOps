import SwiftUI
import PhotosUI

// MARK: - Vehicle Inspection View
struct VehicleInspectionView: View {
    let vehicle: Vehicle
    @StateObject private var viewModel = InspectionViewModel()
    @State private var inspectorName = ""
    @State private var showNamePrompt = true
    @available(iOS 16.0, *)
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var currentPhotoCategory: InspectionCategory?
    @State private var showCompletionDialog = false
    @State private var inspectionNotes = ""
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            if showNamePrompt {
                InspectorNamePrompt(
                    inspectorName: $inspectorName,
                    onStart: {
                        viewModel.createInspection(for: vehicle, inspectorName: inspectorName)
                        showNamePrompt = false
                    }
                )
            } else {
                InspectionContentView(
                    vehicle: vehicle,
                    viewModel: viewModel,
                    inspectorName: inspectorName,
                    selectedPhoto: $selectedPhoto,
                    currentPhotoCategory: $currentPhotoCategory,
                    showCompletionDialog: $showCompletionDialog,
                    inspectionNotes: $inspectionNotes,
                    onComplete: {
                        viewModel.completeInspection(notes: inspectionNotes)
                        dismiss()
                    }
                )
            }
        }
        .navigationTitle("Vehicle Inspection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
        .onChange(of: selectedPhoto) { newValue in
            Task {
                if let data = try? await newValue?.loadTransferable(type: Data.self),
                   let category = currentPhotoCategory {
                    viewModel.addPhoto(data, category: category)
                }
            }
        }
    }
}

// MARK: - Inspector Name Prompt
struct InspectorNamePrompt: View {
    @Binding var inspectorName: String
    let onStart: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Start Vehicle Inspection")
                .font(.title2)
                .fontWeight(.bold)

            Text("Please enter your name to begin the inspection process")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            TextField("Inspector Name", text: $inspectorName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding(.horizontal)

            Button(action: onStart) {
                Text("Start Inspection")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(inspectorName.isEmpty ? Color.gray : Color.blue)
                    .cornerRadius(12)
            }
            .disabled(inspectorName.isEmpty)
            .padding(.horizontal)
        }
        .padding()
    }
}

// MARK: - Inspection Content View
struct InspectionContentView: View {
    let vehicle: Vehicle
    @ObservedObject var viewModel: InspectionViewModel
    let inspectorName: String
    @Binding var selectedPhoto: PhotosPickerItem?
    @Binding var currentPhotoCategory: InspectionCategory?
    @Binding var showCompletionDialog: Bool
    @Binding var inspectionNotes: String
    let onComplete: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Progress Header
            InspectionProgressHeader(viewModel: viewModel, vehicle: vehicle)

            // Category Tabs
            ScrollView {
                VStack(spacing: 16) {
                    ForEach(InspectionCategory.allCases, id: \.self) { category in
                        InspectionCategoryCard(
                            category: category,
                            viewModel: viewModel,
                            selectedPhoto: $selectedPhoto,
                            currentPhotoCategory: $currentPhotoCategory
                        )
                    }

                    // Photos Section
                    if !viewModel.inspectionPhotos.isEmpty {
                        PhotosGallerySection(viewModel: viewModel)
                    }

                    // Notes Section
                    NotesSection(notes: $inspectionNotes)

                    // Complete Button
                    Button(action: {
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
                            viewModel.currentInspection?.completionPercentage == 100
                                ? Color.green
                                : Color.gray
                        )
                        .cornerRadius(12)
                    }
                    .disabled(viewModel.currentInspection?.completionPercentage != 100)
                    .padding(.horizontal)
                    .padding(.bottom)
                }
                .padding()
            }
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

// MARK: - Inspection Progress Header
struct InspectionProgressHeader: View {
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
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

// MARK: - Inspection Category Card
struct InspectionCategoryCard: View {
    let category: InspectionCategory
    @ObservedObject var viewModel: InspectionViewModel
    @Binding var selectedPhoto: PhotosPickerItem?
    @Binding var currentPhotoCategory: InspectionCategory?
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
                        InspectionItemRow(
                            item: item,
                            onUpdate: { status, notes in
                                viewModel.updateInspectionItem(itemId: item.id, status: status, notes: notes)
                            }
                        )
                        if item.id != items.last?.id {
                            Divider()
                        }
                    }
                }

                // Add Photo Button
                Divider()
                PhotosPicker(selection: $selectedPhoto, matching: .images) {
                    HStack {
                        Image(systemName: "camera.fill")
                        Text("Add Photo")
                    }
                    .font(.subheadline)
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding()
                }
                .onChange(of: selectedPhoto) { _ in
                    currentPhotoCategory = category
                }
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Inspection Item Row
struct InspectionItemRow: View {
    let item: InspectionItem
    let onUpdate: (InspectionItemStatus, String?) -> Void
    @State private var showNotes = false
    @State private var notes = ""
    @State private var selectedStatus: InspectionItemStatus

    init(item: InspectionItem, onUpdate: @escaping (InspectionItemStatus, String?) -> Void) {
        self.item = item
        self.onUpdate = onUpdate
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

            // Notes button
            if selectedStatus != .passed {
                Button(action: { showNotes.toggle() }) {
                    HStack {
                        Image(systemName: "note.text")
                            .font(.caption)
                        Text(notes.isEmpty ? "Add Notes" : "Edit Notes")
                            .font(.caption)
                    }
                    .foregroundColor(.blue)
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

// MARK: - Photos Gallery Section
struct PhotosGallerySection: View {
    @ObservedObject var viewModel: InspectionViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Inspection Photos (\(viewModel.inspectionPhotos.count))", systemImage: "photo.on.rectangle")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(viewModel.inspectionPhotos) { photo in
                        if let uiImage = UIImage(data: photo.imageData) {
                            VStack(alignment: .leading, spacing: 8) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 150, height: 150)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))

                                Text(photo.category.rawValue)
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                if let notes = photo.notes {
                                    Text(notes)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                        .lineLimit(2)
                                        .frame(width: 150)
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Notes Section
struct NotesSection: View {
    @Binding var notes: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("General Notes", systemImage: "note.text")
                .font(.headline)

            TextEditor(text: $notes)
                .frame(height: 100)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.systemGray4), lineWidth: 1)
                )
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Camera View (for future implementation)
struct CameraView: View {
    @Binding var capturedImage: UIImage?
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack {
            Text("Camera functionality")
                .font(.headline)

            Text("Use PhotosPicker or implement custom camera")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button("Close") {
                dismiss()
            }
            .padding()
        }
    }
}

// MARK: - Preview
#if DEBUG
struct VehicleInspectionView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleVehicle = Vehicle(
            id: "1",
            tenantId: "tenant1",
            number: "V-001",
            type: .truck,
            make: "Ford",
            model: "F-150",
            year: 2022,
            vin: "1FTFW1E54MFA12345",
            licensePlate: "ABC123",
            status: .active,
            location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "Washington, DC"),
            region: "Northeast",
            department: "Operations",
            fuelLevel: 0.75,
            fuelType: .gasoline,
            mileage: 45000,
            hoursUsed: nil,
            assignedDriver: "John Doe",
            ownership: .owned,
            lastService: "2024-01-15",
            nextService: "2024-04-15",
            alerts: ["Oil change due"],
            customFields: nil,
            tags: nil
        )

        NavigationView {
            VehicleInspectionView(vehicle: sampleVehicle)
        }
    }
}
#endif
