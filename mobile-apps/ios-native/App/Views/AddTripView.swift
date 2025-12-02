import SwiftUI
import CoreLocation

// MARK: - Add Trip View
struct AddTripView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    // Form fields
    @State private var selectedVehicleId: String = ""
    @State private var selectedDriverId: String = ""
    @State private var startLocation: String = ""
    @State private var destination: String = ""
    @State private var purpose: String = ""
    @State private var selectedPurpose: TripPurpose = .other
    @State private var startDate: Date = Date()
    @State private var estimatedEndTime: Date = Date().addingTimeInterval(3600) // 1 hour from now
    @State private var useEstimatedEndTime: Bool = false
    @State private var notes: String = ""

    // State
    @State private var isSubmitting: Bool = false
    @State private var showAlert: Bool = false
    @State private var alertMessage: String = ""

    // Mock data
    private let vehicles = Vehicle.samples
    private let drivers = [
        Driver.sample,
        Driver(
            id: "driver-002",
            tenantId: "tenant-001",
            employeeId: "EMP-67890",
            firstName: "Jane",
            lastName: "Doe",
            email: "jane.doe@fleet.com",
            phone: "+1 (555) 987-6543",
            photoURL: nil,
            status: .active,
            license: DriverLicense.sample,
            assignedVehicles: [],
            department: "Logistics",
            region: "South",
            hireDate: Calendar.current.date(byAdding: .year, value: -2, to: Date())!,
            performanceMetrics: PerformanceMetrics.sample,
            schedule: DriverSchedule.sample,
            certifications: [],
            address: DriverAddress.sample,
            emergencyContact: EmergencyContact.sample,
            notes: nil,
            tags: [],
            createdAt: Date(),
            updatedAt: Date()
        )
    ]

    var body: some View {
        NavigationView {
            Form {
                // Vehicle Selection
                Section {
                    Picker("Vehicle", selection: $selectedVehicleId) {
                        Text("Select a vehicle").tag("")
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

                    if !selectedVehicleId.isEmpty, let vehicle = vehicles.first(where: { $0.id == selectedVehicleId }) {
                        VehicleQuickInfo(vehicle: vehicle)
                    }
                } header: {
                    Text("Vehicle")
                }

                // Driver Selection
                Section {
                    Picker("Driver (Optional)", selection: $selectedDriverId) {
                        Text("Not assigned").tag("")
                        ForEach(drivers) { driver in
                            Text(driver.fullName).tag(driver.id)
                        }
                    }
                    .pickerStyle(.menu)
                } header: {
                    Text("Driver")
                }

                // Trip Details
                Section {
                    TextField("Start Location", text: $startLocation)
                        .autocapitalization(.words)

                    TextField("Destination", text: $destination)
                        .autocapitalization(.words)
                } header: {
                    Text("Locations")
                } footer: {
                    Text("Enter street addresses or landmark names")
                }

                // Purpose Selection
                Section {
                    Picker("Purpose", selection: $selectedPurpose) {
                        ForEach(TripPurpose.allCases, id: \.self) { purpose in
                            HStack {
                                Image(systemName: purpose.icon)
                                Text(purpose.displayName)
                            }
                            .tag(purpose)
                        }
                    }
                    .pickerStyle(.menu)

                    if selectedPurpose == .other {
                        TextField("Specify Purpose", text: $purpose)
                            .autocapitalization(.sentences)
                    }
                } header: {
                    Text("Trip Purpose")
                }

                // Timing
                Section {
                    DatePicker("Start Time", selection: $startDate, displayedComponents: [.date, .hourAndMinute])

                    Toggle("Set Estimated End Time", isOn: $useEstimatedEndTime)

                    if useEstimatedEndTime {
                        DatePicker("Estimated End Time", selection: $estimatedEndTime, in: startDate..., displayedComponents: [.date, .hourAndMinute])
                    }
                } header: {
                    Text("Schedule")
                }

                // Notes
                Section {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                } header: {
                    Text("Additional Notes (Optional)")
                }
            }
            .navigationTitle("Start New Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        ModernTheme.Haptics.light()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Start Trip") {
                        submitTrip()
                    }
                    .disabled(!canSubmit)
                    .fontWeight(.semibold)
                }
            }
            .disabled(isSubmitting)
            .alert("Trip Status", isPresented: $showAlert) {
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
        !selectedVehicleId.isEmpty &&
        !startLocation.isEmpty &&
        !destination.isEmpty &&
        (selectedPurpose != .other || !purpose.isEmpty)
    }

    // MARK: - Actions

    private func submitTrip() {
        ModernTheme.Haptics.medium()
        isSubmitting = true

        // Simulate API call delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Create the trip
            let tripPurpose = selectedPurpose == .other ? purpose : selectedPurpose.displayName

            // In a real app, this would call the API and create the trip
            print("Creating trip:")
            print("  Vehicle: \(selectedVehicleId)")
            print("  Driver: \(selectedDriverId.isEmpty ? "None" : selectedDriverId)")
            print("  From: \(startLocation)")
            print("  To: \(destination)")
            print("  Purpose: \(tripPurpose)")
            print("  Start: \(startDate)")
            print("  Estimated End: \(useEstimatedEndTime ? "\(estimatedEndTime)" : "Not set")")
            print("  Notes: \(notes.isEmpty ? "None" : notes)")

            isSubmitting = false
            alertMessage = "Trip started successfully!"
            showAlert = true
            ModernTheme.Haptics.success()
        }
    }
}

// MARK: - Vehicle Quick Info
struct VehicleQuickInfo: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Image(systemName: vehicle.type.icon)
                    .foregroundColor(vehicle.status.themeColor)

                VStack(alignment: .leading, spacing: 2) {
                    Text(vehicle.status.displayName)
                        .font(.caption)
                        .foregroundColor(vehicle.status.themeColor)

                    if let driver = vehicle.assignedDriver {
                        Text("Currently assigned to: \(driver)")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: "fuelpump.fill")
                            .font(.caption2)
                        Text("\(vehicle.fuelLevelPercentage)%")
                            .font(.caption)
                    }
                    .foregroundColor(vehicle.isLowFuel ? ModernTheme.Colors.warning : ModernTheme.Colors.success)

                    Text(String(format: "%.0f mi", vehicle.mileage))
                        .font(.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Trip Purpose Enum
enum TripPurpose: String, CaseIterable {
    case businessMeeting = "Business Meeting"
    case siteVisit = "Site Visit"
    case delivery = "Delivery"
    case inspection = "Inspection"
    case emergency = "Emergency"
    case maintenance = "Maintenance"
    case other = "Other"

    var displayName: String {
        rawValue
    }

    var icon: String {
        switch self {
        case .businessMeeting: return "briefcase.fill"
        case .siteVisit: return "building.2.fill"
        case .delivery: return "shippingbox.fill"
        case .inspection: return "checkmark.seal.fill"
        case .emergency: return "exclamationmark.triangle.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Preview
#if DEBUG
struct AddTripView_Previews: PreviewProvider {
    static var previews: some View {
        AddTripView()
            .environmentObject(NavigationCoordinator())
    }
}
#endif
