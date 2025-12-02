import SwiftUI
import PhotosUI

struct AddAssetView: View {
    @ObservedObject var viewModel: AssetViewModel
    @Environment(\.presentationMode) var presentationMode

    // Form Fields
    @State private var number = ""
    @State private var name = ""
    @State private var description = ""
    @State private var selectedType: AssetType = .equipment
    @State private var selectedStatus: AssetStatus = .available
    @State private var selectedCondition: AssetCondition = .good
    @State private var serialNumber = ""
    @State private var make = ""
    @State private var model = ""
    @State private var facility = ""
    @State private var address = ""
    @State private var purchaseDate = Date()
    @State private var purchaseCost = ""
    @State private var showingPhotoPicker = false
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var photoData: Data?

    // Validation
    @State private var showingValidationError = false
    @State private var validationMessage = ""

    // Loading
    @State private var isSaving = false

    var body: some View {
        NavigationView {
            Form {
                // Basic Information Section
                Section(header: Text("Basic Information")) {
                    TextField("Asset Number *", text: $number)
                        .autocapitalization(.allCharacters)

                    TextField("Asset Name *", text: $name)

                    Picker("Type *", selection: $selectedType) {
                        ForEach(AssetType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.displayName)
                            }
                            .tag(type)
                        }
                    }

                    TextEditor(text: $description)
                        .frame(height: 80)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                }

                // Details Section
                Section(header: Text("Details")) {
                    TextField("Serial Number", text: $serialNumber)
                    TextField("Make", text: $make)
                    TextField("Model", text: $model)
                }

                // Status Section
                Section(header: Text("Status & Condition")) {
                    Picker("Status", selection: $selectedStatus) {
                        ForEach(AssetStatus.allCases, id: \.self) { status in
                            HStack {
                                Image(systemName: status.icon)
                                Text(status.displayName)
                            }
                            .tag(status)
                        }
                    }

                    Picker("Condition", selection: $selectedCondition) {
                        ForEach(AssetCondition.allCases, id: \.self) { condition in
                            HStack {
                                Image(systemName: condition.icon)
                                Text(condition.displayName)
                            }
                            .tag(condition)
                        }
                    }
                }

                // Location Section
                Section(header: Text("Location")) {
                    TextField("Facility/Yard", text: $facility)
                        .textContentType(.location)

                    TextField("Address", text: $address)
                        .textContentType(.fullStreetAddress)
                }

                // Purchase Information Section
                Section(header: Text("Purchase Information")) {
                    DatePicker("Purchase Date", selection: $purchaseDate, displayedComponents: .date)

                    HStack {
                        Text("$")
                        TextField("Purchase Cost", text: $purchaseCost)
                            .keyboardType(.decimalPad)
                    }
                }

                // Photo Section
                Section(header: Text("Photo")) {
                    if let photoData = photoData,
                       let uiImage = UIImage(data: photoData) {
                        HStack {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFit()
                                .frame(height: 100)
                                .cornerRadius(8)

                            Spacer()

                            Button("Remove") {
                                self.photoData = nil
                                self.selectedPhoto = nil
                            }
                            .foregroundColor(.red)
                        }
                    } else {
                        PhotosPicker(selection: $selectedPhoto, matching: .images) {
                            HStack {
                                Image(systemName: "camera.fill")
                                Text("Add Photo")
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .onChange(of: selectedPhoto) { newItem in
                            Task {
                                if let data = try? await newItem?.loadTransferable(type: Data.self) {
                                    photoData = data
                                }
                            }
                        }
                    }
                }

                // Required Fields Note
                Section {
                    Text("* Required fields")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Add Asset")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .disabled(isSaving)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Save") {
                            saveAsset()
                        }
                    }
                }
            }
            .alert("Validation Error", isPresented: $showingValidationError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(validationMessage)
            }
        }
    }

    // MARK: - Validation
    private func validateForm() -> Bool {
        if number.trimmingCharacters(in: .whitespaces).isEmpty {
            validationMessage = "Asset number is required"
            showingValidationError = true
            return false
        }

        if name.trimmingCharacters(in: .whitespaces).isEmpty {
            validationMessage = "Asset name is required"
            showingValidationError = true
            return false
        }

        // Validate purchase cost if provided
        if !purchaseCost.isEmpty {
            if Double(purchaseCost) == nil {
                validationMessage = "Purchase cost must be a valid number"
                showingValidationError = true
                return false
            }
        }

        return true
    }

    // MARK: - Save Asset
    private func saveAsset() {
        guard validateForm() else { return }

        isSaving = true

        // Create location
        let location = AssetLocation(
            lat: nil,
            lng: nil,
            address: address.isEmpty ? nil : address,
            facility: facility.isEmpty ? nil : facility
        )

        // Parse purchase cost
        let cost = purchaseCost.isEmpty ? nil : Double(purchaseCost)

        // Format date
        let dateFormatter = ISO8601DateFormatter()
        let purchaseDateString = dateFormatter.string(from: purchaseDate)

        // Create request
        let request = AssetCreateRequest(
            number: number.trimmingCharacters(in: .whitespaces),
            type: selectedType,
            name: name.trimmingCharacters(in: .whitespaces),
            description: description.isEmpty ? nil : description,
            serialNumber: serialNumber.isEmpty ? nil : serialNumber,
            make: make.isEmpty ? nil : make,
            model: model.isEmpty ? nil : model,
            status: selectedStatus,
            condition: selectedCondition,
            location: location,
            purchaseDate: purchaseDateString,
            purchaseCost: cost
        )

        Task {
            do {
                try await viewModel.addAsset(request)
                await MainActor.run {
                    isSaving = false
                    presentationMode.wrappedValue.dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    validationMessage = "Failed to create asset: \(error.localizedDescription)"
                    showingValidationError = true
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    AddAssetView(viewModel: AssetViewModel())
}
