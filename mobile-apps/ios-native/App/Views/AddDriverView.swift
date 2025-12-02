import SwiftUI

// MARK: - Add Driver View
struct AddDriverView: View {
    @Environment(\.dismiss) private var dismiss

    // Form fields
    @State private var firstName: String = ""
    @State private var lastName: String = ""
    @State private var email: String = ""
    @State private var phone: String = ""
    @State private var licenseNumber: String = ""
    @State private var licenseClass: LicenseClass = .classC
    @State private var licenseState: String = "FL"
    @State private var licenseExpiration: Date = Calendar.current.date(byAdding: .year, value: 1, to: Date())!
    @State private var assignedVehicleId: String = ""
    @State private var employeeId: String = ""
    @State private var department: String = "Operations"
    @State private var region: String = "North"

    // State
    @State private var isSubmitting: Bool = false
    @State private var showAlert: Bool = false
    @State private var alertMessage: String = ""

    // Mock data
    private let vehicles = Vehicle.samples
    private let departments = ["Operations", "Logistics", "Maintenance", "Administration"]
    private let regions = ["North", "South", "East", "West", "Central"]
    private let states = ["FL", "GA", "AL", "SC", "NC", "TN", "MS", "LA"]

    var body: some View {
        NavigationView {
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
                } footer: {
                    Text("This information will be used for driver identification and communication")
                }

                // Employment Details
                Section {
                    TextField("Employee ID", text: $employeeId)
                        .autocapitalization(.allCharacters)

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

                    // Expiration warning
                    if isExpiringWithinYear {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("License expires within one year")
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
                    Picker("Assigned Vehicle (Optional)", selection: $assignedVehicleId) {
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
                } footer: {
                    Text("You can assign a vehicle now or later")
                }
            }
            .navigationTitle("Add New Driver")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        ModernTheme.Haptics.light()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        submitDriver()
                    }
                    .disabled(!canSubmit)
                    .fontWeight(.semibold)
                }
            }
            .disabled(isSubmitting)
            .alert("Driver Registration", isPresented: $showAlert) {
                Button("OK") {
                    if alertMessage.contains("successfully") {
                        dismiss()
                    }
                }
            } message: {
                Text(alertMessage)
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

    private var isExpiringWithinYear: Bool {
        let oneYearFromNow = Calendar.current.date(byAdding: .year, value: 1, to: Date())!
        return licenseExpiration <= oneYearFromNow
    }

    // MARK: - Helper Methods

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Actions

    private func submitDriver() {
        ModernTheme.Haptics.medium()
        isSubmitting = true

        // Simulate API call delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Create the driver
            print("Creating driver:")
            print("  Name: \(firstName) \(lastName)")
            print("  Email: \(email)")
            print("  Phone: \(phone)")
            print("  Employee ID: \(employeeId)")
            print("  Department: \(department)")
            print("  Region: \(region)")
            print("  License: \(licenseNumber) (\(licenseClass.displayName))")
            print("  License State: \(licenseState)")
            print("  License Expires: \(licenseExpiration)")
            print("  Assigned Vehicle: \(assignedVehicleId.isEmpty ? "None" : assignedVehicleId)")

            isSubmitting = false
            alertMessage = "Driver '\(firstName) \(lastName)' registered successfully!"
            showAlert = true
            ModernTheme.Haptics.success()
        }
    }
}

// MARK: - Vehicle Assignment Info
struct VehicleAssignmentInfo: View {
    let vehicle: Vehicle

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                    .font(.subheadline)

                HStack(spacing: 8) {
                    Label(vehicle.status.displayName, systemImage: vehicle.status.icon)
                        .font(.caption)
                        .foregroundColor(vehicle.status.themeColor)

                    if let currentDriver = vehicle.assignedDriver {
                        Text("• Currently: \(currentDriver)")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.warning)
                    }
                }
            }

            Spacer()

            Image(systemName: vehicle.type.icon)
                .font(.title2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview
#if DEBUG
struct AddDriverView_Previews: PreviewProvider {
    static var previews: some View {
        AddDriverView()
    }
}
#endif
