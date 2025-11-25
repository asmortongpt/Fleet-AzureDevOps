import SwiftUI

/// AddVehicleView - Complete form for adding new vehicles to the fleet
/// Features:
/// - Comprehensive form with all vehicle fields
/// - Real-time validation and feedback
/// - API integration with error handling
/// - Loading states and success/error alerts
/// - Modern UI with ModernTheme styling
struct AddVehicleView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddVehicleViewModel()

    // Form fields
    @State private var vehicleNumber: String = ""
    @State private var selectedType: VehicleType = .sedan
    @State private var make: String = ""
    @State private var model: String = ""
    @State private var year: Int = Calendar.current.component(.year, from: Date())
    @State private var vin: String = ""
    @State private var licensePlate: String = ""
    @State private var department: String = ""
    @State private var region: String = ""
    @State private var selectedFuelType: FuelType = .gasoline
    @State private var selectedOwnership: OwnershipType = .owned

    // UI State
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var alertType: AlertType = .error
    @State private var validationErrors: [ValidationError] = []

    var body: some View {
        if #available(iOS 16.0, *) {
            NavigationStack {
                formContent
            }
        } else {
            NavigationView {
                formContent
            }
            .navigationViewStyle(.stack)
        }
    }

    @ViewBuilder
    private var formContent: some View {
        ZStack {
            Form {
                // Basic Information Section
                Section {
                    vehicleNumberField
                    vehicleTypeField
                } header: {
                    Text("Basic Information")
                        .font(ModernTheme.Typography.headline)
                } footer: {
                    if let error = validationErrors.first(where: { $0.field == .vehicleNumber }) {
                        Text(error.message)
                            .foregroundColor(ModernTheme.Colors.error)
                            .font(ModernTheme.Typography.caption1)
                    }
                }

                // Vehicle Details Section
                Section {
                    makeField
                    modelField
                    yearPicker
                } header: {
                    Text("Vehicle Details")
                        .font(ModernTheme.Typography.headline)
                }

                // Identification Section
                Section {
                    vinField
                    licensePlateField
                } header: {
                    Text("Identification")
                        .font(ModernTheme.Typography.headline)
                } footer: {
                    if let error = validationErrors.first(where: { $0.field == .vin }) {
                        Text(error.message)
                            .foregroundColor(ModernTheme.Colors.error)
                            .font(ModernTheme.Typography.caption1)
                    }
                }

                // Assignment Section
                Section {
                    departmentField
                    regionField
                } header: {
                    Text("Assignment")
                        .font(ModernTheme.Typography.headline)
                }

                // Specifications Section
                Section {
                    fuelTypeField
                    ownershipField
                } header: {
                    Text("Specifications")
                        .font(ModernTheme.Typography.headline)
                }
            }
            .disabled(viewModel.isLoading)
            .scrollContentBackground(.hidden)
            .background(ModernTheme.Colors.groupedBackground)

            // Loading overlay
            if viewModel.isLoading {
                LoadingOverlay()
            }
        }
        .navigationTitle("Add Vehicle")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    ModernTheme.Haptics.light()
                    dismiss()
                }
                .disabled(viewModel.isLoading)
            }

            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    saveVehicle()
                }
                .disabled(!isFormValid || viewModel.isLoading)
                .font(ModernTheme.Typography.bodyBold)
            }
        }
        .alert(alertMessage, isPresented: $showingAlert) {
            Button("OK") {
                if alertType == .success {
                    dismiss()
                }
            }
        }
        .onChange(of: vehicleNumber) { _ in validateField(.vehicleNumber) }
        .onChange(of: vin) { _ in validateField(.vin) }
    }

    // MARK: - Form Fields

    private var vehicleNumberField: some View {
        HStack {
            Image(systemName: "number.circle.fill")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("Vehicle Number *", text: $vehicleNumber)
                .textContentType(.none)
                .autocapitalization(.allCharacters)
        }
    }

    private var vehicleTypeField: some View {
        Picker("Type *", selection: $selectedType) {
            ForEach(VehicleType.allCases, id: \.self) { type in
                HStack {
                    Image(systemName: type.icon)
                    Text(type.displayName)
                }
                .tag(type)
            }
        }
    }

    private var makeField: some View {
        HStack {
            Image(systemName: "building.2.fill")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("Make *", text: $make)
                .textContentType(.none)
        }
    }

    private var modelField: some View {
        HStack {
            Image(systemName: "car.fill")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("Model *", text: $model)
                .textContentType(.none)
        }
    }

    private var yearPicker: some View {
        Picker("Year *", selection: $year) {
            ForEach(1990...2025, id: \.self) { year in
                Text(String(year)).tag(year)
            }
        }
    }

    private var vinField: some View {
        HStack {
            Image(systemName: "barcode.viewfinder")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("VIN *", text: $vin)
                .textContentType(.none)
                .autocapitalization(.allCharacters)
        }
    }

    private var licensePlateField: some View {
        HStack {
            Image(systemName: "rectangle.and.text.magnifyingglass")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("License Plate *", text: $licensePlate)
                .textContentType(.none)
                .autocapitalization(.allCharacters)
        }
    }

    private var departmentField: some View {
        HStack {
            Image(systemName: "building.columns.fill")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("Department", text: $department)
                .textContentType(.organizationName)
        }
    }

    private var regionField: some View {
        HStack {
            Image(systemName: "map.fill")
                .foregroundColor(ModernTheme.Colors.primary)
            TextField("Region", text: $region)
                .textContentType(.addressState)
        }
    }

    private var fuelTypeField: some View {
        Picker("Fuel Type *", selection: $selectedFuelType) {
            ForEach(FuelType.allCases, id: \.self) { fuelType in
                Text(fuelType.displayName).tag(fuelType)
            }
        }
    }

    private var ownershipField: some View {
        Picker("Ownership *", selection: $selectedOwnership) {
            ForEach(OwnershipType.allCases, id: \.self) { ownership in
                Text(ownership.displayName).tag(ownership)
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        !vehicleNumber.isEmpty &&
        !make.isEmpty &&
        !model.isEmpty &&
        !vin.isEmpty &&
        !licensePlate.isEmpty &&
        validationErrors.isEmpty
    }

    private func validateField(_ field: ValidationField) {
        // Remove existing errors for this field
        validationErrors.removeAll { $0.field == field }

        switch field {
        case .vehicleNumber:
            if vehicleNumber.isEmpty {
                validationErrors.append(ValidationError(field: .vehicleNumber, message: "Vehicle number is required"))
            } else if vehicleNumber.count < 2 {
                validationErrors.append(ValidationError(field: .vehicleNumber, message: "Vehicle number must be at least 2 characters"))
            }

        case .vin:
            if vin.isEmpty {
                validationErrors.append(ValidationError(field: .vin, message: "VIN is required"))
            } else if !isValidVIN(vin) {
                validationErrors.append(ValidationError(field: .vin, message: "VIN must be 17 characters (letters and numbers only)"))
            }
        }
    }

    private func isValidVIN(_ vin: String) -> Bool {
        let cleanedVIN = vin.uppercased().replacingOccurrences(of: " ", with: "")
        let vinPattern = "^[A-HJ-NPR-Z0-9]{17}$" // VIN standard: no I, O, Q
        let vinPredicate = NSPredicate(format: "SELF MATCHES %@", vinPattern)
        return cleanedVIN.count == 17 && vinPredicate.evaluate(with: cleanedVIN)
    }

    // MARK: - Save Action

    private func saveVehicle() {
        ModernTheme.Haptics.medium()

        // Validate all required fields
        validateField(.vehicleNumber)
        validateField(.vin)

        guard isFormValid else {
            alertType = .error
            alertMessage = "Please correct the validation errors before saving."
            showingAlert = true
            ModernTheme.Haptics.error()
            return
        }

        // Create vehicle payload
        let vehicleData: [String: Any] = [
            "number": vehicleNumber.trimmingCharacters(in: .whitespaces),
            "type": selectedType.rawValue,
            "make": make.trimmingCharacters(in: .whitespaces),
            "model": model.trimmingCharacters(in: .whitespaces),
            "year": year,
            "vin": vin.uppercased().trimmingCharacters(in: .whitespaces),
            "licensePlate": licensePlate.uppercased().trimmingCharacters(in: .whitespaces),
            "department": department.trimmingCharacters(in: .whitespaces),
            "region": region.trimmingCharacters(in: .whitespaces),
            "fuelType": selectedFuelType.rawValue,
            "ownership": selectedOwnership.rawValue
        ]

        Task {
            do {
                try await viewModel.addVehicle(vehicleData: vehicleData)

                await MainActor.run {
                    ModernTheme.Haptics.success()
                    alertType = .success
                    alertMessage = "Vehicle '\(vehicleNumber)' has been added successfully!"
                    showingAlert = true
                }
            } catch {
                await MainActor.run {
                    ModernTheme.Haptics.error()
                    alertType = .error
                    alertMessage = error.localizedDescription
                    showingAlert = true
                }
            }
        }
    }
}

// MARK: - Supporting Types

enum ValidationField {
    case vehicleNumber
    case vin
}

struct ValidationError: Identifiable {
    let id = UUID()
    let field: ValidationField
    let message: String
}

enum AlertType {
    case success
    case error
}

// MARK: - Loading Overlay

private struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: ModernTheme.Spacing.lg) {
                LoadingSpinnerView()

                Text("Saving Vehicle...")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(.white)
            }
            .padding(ModernTheme.Spacing.xxl)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                    .fill(Color(uiColor: .systemBackground))
            )
            .shadow(
                color: ModernTheme.Shadow.large.color,
                radius: ModernTheme.Shadow.large.radius,
                x: ModernTheme.Shadow.large.x,
                y: ModernTheme.Shadow.large.y
            )
        }
    }
}

// MARK: - View Model

@MainActor
class AddVehicleViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let networkManager = AzureNetworkManager()
    private let persistenceManager = DataPersistenceManager.shared
    private let logger = LoggingManager.shared

    /// Add a new vehicle to the fleet
    /// - Parameter vehicleData: Dictionary containing vehicle information
    /// - Throws: APIError if the request fails
    func addVehicle(vehicleData: [String: Any]) async throws {
        isLoading = true
        errorMessage = nil

        defer {
            isLoading = false
        }

        do {
            logger.log(.info, "Adding new vehicle: \(vehicleData["number"] ?? "unknown")", category: .api)

            // Get authentication token
            let token = try await KeychainManager.shared.getAccessToken()

            // Make API request
            let response = try await networkManager.performRequest(
                endpoint: APIConfiguration.Endpoints.vehicles,
                method: .POST,
                body: vehicleData,
                token: token,
                responseType: VehicleResponse.self
            )

            // Cache the new vehicle
            persistenceManager.cacheVehicle(response.vehicle)

            logger.log(.info, "Vehicle added successfully: \(response.vehicle.number)", category: .api)

            // Post notification to refresh vehicle list
            NotificationCenter.default.post(name: .vehicleAdded, object: response.vehicle)

        } catch let error as APIError {
            logger.log(.error, "Failed to add vehicle: \(error.localizedDescription)", category: .api)
            errorMessage = error.errorDescription
            throw error
        } catch {
            logger.log(.error, "Unexpected error adding vehicle: \(error.localizedDescription)", category: .api)
            errorMessage = "An unexpected error occurred. Please try again."
            throw APIError.unknown(0)
        }
    }
}

// MARK: - Notification Extension

extension Notification.Name {
    static let vehicleAdded = Notification.Name("vehicleAdded")
}

// MARK: - Preview

#Preview {
    AddVehicleView()
}
