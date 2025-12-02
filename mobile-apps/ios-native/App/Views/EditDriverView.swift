import SwiftUI

// MARK: - Edit Driver View
struct EditDriverView: View {
    let driverId: String
    @Environment(\.dismiss) private var dismiss

    // Form fields - initialized with driver data
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var email: String = ""
    @State private var phone: String = ""
    @State private var licenseNumber: String = ""
    @State private var licenseClass: LicenseClass = .classC
    @State private var licenseState: String = "FL"
    @State private var licenseExpiration: Date = Date()
    @State private var assignedVehicleId: String = ""
    @State private var employeeId: String = ""
    @State private var department: String = ""
    @State private var region: String = ""
    @State private var status: DriverStatus = .active

    // State
    @State private var isLoading: Bool = true
    @State private var isSubmitting: Bool = false
    @State private var showAlert: Bool = false
    @State private var alertMessage: String = ""
    @State private var driver: Driver?

    // Mock data
    private let vehicles = Vehicle.samples
    private let departments = ["Operations", "Logistics", "Maintenance", "Administration"]
    private let regions = ["North", "South", "East", "West", "Central"]
    private let states = ["FL", "GA", "AL", "SC", "NC", "TN", "MS", "LA"]

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading driver information...")
                } else if driver != nil {
                    Form {
                        // Personal Information
                        Section {
                            TextField("First Name", text: $firstName)
                                .autocapitalization(.words)
                                .textContentType(.givenName)

                            TextField("Last Name", text: $lastName)
                                .autocapitalization(.words)
                                .textContentType(.familyName)

                            TextField("Email Address", text: $email)
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                                .textContentType(.emailAddress)

                            TextField("Phone Number", text: $phone)
                                .keyboardType(.phonePad)
                                .textContentType(.telephoneNumber)
                        } header: {
                            Text("Personal Information")
                        }

                        // Employment Details
                        Section {
                            TextField("Employee ID", text: $employeeId)
                                .autocapitalization(.allCharacters)
                                .disabled(true) // Employee ID should not be editable

                            Picker("Status", selection: $status) {
                                ForEach(DriverStatus.allCases, id: \.self) { driverStatus in
                                    Label(driverStatus.displayName, systemImage: driverStatus.icon)
                                        .tag(driverStatus)
                                }
                            }

                            Picker("Department", selection: $department) {
                                ForEach(departments, id: \.self) { dept in
                                    Text(dept).tag(dept)
                                }
                            }

                            Picker("Region", selection: $region) {
                                ForEach(regions, id: \.self) { reg in
                                    Text(reg).tag(reg)
                                }
                            }
                        } header: {
                            Text("Employment Details")
                        }

                        // License Information
                        Section {
                            TextField("License Number", text: $licenseNumber)
                                .autocapitalization(.allCharacters)

                            Picker("License Class", selection: $licenseClass) {
                                ForEach(LicenseClass.allCases, id: \.self) { licClass in
                                    Text(licClass.displayName).tag(licClass)
                                }
                            }

                            Picker("State", selection: $licenseState) {
                                ForEach(states, id: \.self) { state in
                                    Text(state).tag(state)
                                }
                            }

                            DatePicker("Expiration Date", selection: $licenseExpiration, in: Date()..., displayedComponents: .date)

                            // Expiration warnings
                            if isExpired {
                                HStack {
                                    Image(systemName: "exclamationmark.octagon.fill")
                                        .foregroundColor(.red)
                                    Text("License has expired!")
                                        .font(.caption)
                                        .foregroundColor(.red)
                                }
                            } else if isExpiringWithinMonth {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.orange)
                                    Text("License expires within 30 days")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                }
                            }
                        } header: {
                            Text("Driver's License")
                        } footer: {
                            Text("Ensure license information is accurate and up to date")
                        }

                        // Vehicle Assignment
                        Section {
                            Picker("Assigned Vehicle", selection: $assignedVehicleId) {
                                Text("No vehicle assigned").tag("")
                                ForEach(vehicles) { vehicle in
                                    HStack {
                                        Text(vehicle.number)
                                        Text("- \(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                            .foregroundColor(ModernTheme.Colors.secondaryText)
                                    }
                                    .tag(vehicle.id)
                                }
                            }
                            .pickerStyle(.menu)

                            if !assignedVehicleId.isEmpty, let vehicle = vehicles.first(where: { $0.id == assignedVehicleId }) {
                                VehicleAssignmentInfo(vehicle: vehicle)
                            }
                        } header: {
                            Text("Vehicle Assignment")
                        }
                    }
                } else {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        Image(systemName: "person.fill.questionmark")
                            .font(.system(size: 60))
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Text("Driver Not Found")
                            .font(ModernTheme.Typography.title2)

                        Text("Unable to load driver with ID: \(driverId)")
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        Button("Go Back") {
                            dismiss()
                        }
                        .buttonStyle(ModernTheme.PrimaryButtonStyle())
                        .padding(.horizontal)
                    }
                    .padding()
                }
            }
            .navigationTitle("Edit Driver")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        ModernTheme.Haptics.light()
                        dismiss()
                    }
                }

                if driver != nil {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Update") {
                            updateDriver()
                        }
                        .disabled(!canSubmit)
                        .fontWeight(.semibold)
                    }
                }
            }
            .disabled(isSubmitting)
            .alert("Update Driver", isPresented: $showAlert) {
                Button("OK") {
                    if alertMessage.contains("successfully") {
                        dismiss()
                    }
                }
            } message: {
                Text(alertMessage)
            }
            .task {
                await loadDriver()
            }
        }
    }

    // MARK: - Computed Properties

    private var canSubmit: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        !email.isEmpty &&
        isValidEmail(email) &&
        !phone.isEmpty &&
        !licenseNumber.isEmpty &&
        !employeeId.isEmpty
    }

    private var isExpiringWithinMonth: Bool {
        let oneMonthFromNow = Calendar.current.date(byAdding: .month, value: 1, to: Date())!
        return licenseExpiration <= oneMonthFromNow && licenseExpiration > Date()
    }

    private var isExpired: Bool {
        licenseExpiration < Date()
    }

    // MARK: - Helper Methods

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Data Loading

    private func loadDriver() async {
        isLoading = true

        // Simulate API call delay
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        // Load mock driver data
        let mockDriver = Driver.sample

        await MainActor.run {
            driver = mockDriver
            firstName = mockDriver.firstName
            lastName = mockDriver.lastName
            email = mockDriver.email
            phone = mockDriver.phone
            licenseNumber = mockDriver.license.licenseNumber
            licenseClass = mockDriver.license.licenseClass
            licenseState = mockDriver.license.state
            licenseExpiration = mockDriver.license.expirationDate ?? Date()
            assignedVehicleId = mockDriver.assignedVehicles.first ?? ""
            employeeId = mockDriver.employeeId
            department = mockDriver.department
            region = mockDriver.region
            status = mockDriver.status

            isLoading = false
        }
    }

    // MARK: - Actions

    private func updateDriver() {
        ModernTheme.Haptics.medium()
        isSubmitting = true

        // Simulate API call delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Update the driver
            print("Updating driver \(driverId):")
            print("  Name: \(firstName) \(lastName)")
            print("  Email: \(email)")
            print("  Phone: \(phone)")
            print("  Status: \(status.displayName)")
            print("  Department: \(department)")
            print("  Region: \(region)")
            print("  License: \(licenseNumber) (\(licenseClass.displayName))")
            print("  License State: \(licenseState)")
            print("  License Expires: \(licenseExpiration)")
            print("  Assigned Vehicle: \(assignedVehicleId.isEmpty ? "None" : assignedVehicleId)")

            isSubmitting = false
            alertMessage = "Driver '\(firstName) \(lastName)' updated successfully!"
            showAlert = true
            ModernTheme.Haptics.success()
        }
    }
}

// MARK: - Preview
#if DEBUG
struct EditDriverView_Previews: PreviewProvider {
    static var previews: some View {
        EditDriverView(driverId: "driver-001")
    }
}
#endif
