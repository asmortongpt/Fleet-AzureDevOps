import SwiftUI
import CoreLocation

struct ClockInOutView: View {
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDriverId: String = ""
    @State private var selectedVehicleId: String = ""
    @State private var notes: String = ""
    @State private var useGPSVerification: Bool = true
    @State private var currentLocation: CLLocationCoordinate2D?
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var isProcessing = false

    @StateObject private var locationManager = LocationManager()

    // Sample data - in real app, this would come from your API
    @State private var drivers: [(id: String, name: String)] = [
        ("driver-1", "John Smith"),
        ("driver-2", "Jane Doe"),
        ("driver-3", "Bob Johnson")
    ]

    @State private var vehicles: [(id: String, name: String)] = [
        ("vehicle-1", "Truck #42"),
        ("vehicle-2", "Van #15"),
        ("vehicle-3", "Sedan #8")
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Current Shift Status
                    if let currentShift = viewModel.currentShift {
                        currentShiftCard(currentShift)
                    } else {
                        noActiveShiftCard
                    }

                    // Clock In/Out Form
                    if viewModel.currentShift == nil {
                        clockInForm
                    } else {
                        clockOutForm
                    }

                    // GPS Verification
                    gpsVerificationSection

                    // Quick Break Actions
                    if viewModel.currentShift != nil && viewModel.currentShift?.status == .started {
                        breakActionsSection
                    }
                }
                .padding()
            }
            .navigationTitle(viewModel.currentShift == nil ? "Clock In" : "Clock Out")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .task {
                await locationManager.requestPermission()
                currentLocation = locationManager.location
            }
        }
    }

    // MARK: - Current Shift Card
    private func currentShiftCard(_ shift: Shift) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.green)

                VStack(alignment: .leading) {
                    Text("Active Shift")
                        .font(.headline)

                    Text("Clocked in at \(timeFormatter.string(from: shift.startTime))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            Divider()

            if let driverName = shift.driverName {
                InfoRow(label: "Driver", value: driverName)
            }

            if let vehicleName = shift.vehicleName {
                InfoRow(label: "Vehicle", value: vehicleName)
            }

            InfoRow(label: "Duration", value: shift.formattedWorkingHours)

            if shift.overtimeHours > 0 {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Overtime: \(String(format: "%.1f", shift.overtimeHours)) hours")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var noActiveShiftCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "clock.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundColor(.gray)

            Text("No Active Shift")
                .font(.headline)

            Text("Clock in to start your shift")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Clock In Form
    private var clockInForm: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Clock In Details")
                .font(.headline)

            VStack(spacing: 12) {
                // Driver Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Driver")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Picker("Driver", selection: $selectedDriverId) {
                        Text("Select Driver").tag("")
                        ForEach(drivers, id: \.id) { driver in
                            Text(driver.name).tag(driver.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                // Vehicle Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Vehicle")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Picker("Vehicle", selection: $selectedVehicleId) {
                        Text("Select Vehicle").tag("")
                        ForEach(vehicles, id: \.id) { vehicle in
                            Text(vehicle.name).tag(vehicle.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                // Clock In Button
                Button {
                    clockIn()
                } label: {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "arrow.right.circle.fill")
                            Text("Clock In")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(canClockIn ? Color.green : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(!canClockIn || isProcessing)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5)
        }
    }

    // MARK: - Clock Out Form
    private var clockOutForm: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Clock Out")
                .font(.headline)

            VStack(spacing: 12) {
                // Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Notes (Optional)")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    TextEditor(text: $notes)
                        .frame(height: 100)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                }

                // Clock Out Button
                Button {
                    clockOut()
                } label: {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "arrow.left.circle.fill")
                            Text("Clock Out")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(isProcessing)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5)
        }
    }

    // MARK: - GPS Verification Section
    private var gpsVerificationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Location Verification")
                .font(.headline)

            VStack(spacing: 12) {
                Toggle("Use GPS Verification", isOn: $useGPSVerification)

                if useGPSVerification {
                    if let location = currentLocation {
                        HStack {
                            Image(systemName: "location.fill")
                                .foregroundColor(.green)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("Location Acquired")
                                    .font(.caption)
                                    .bold()

                                Text("Lat: \(String(format: "%.6f", location.latitude)), Lon: \(String(format: "%.6f", location.longitude))")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()
                        }
                        .padding()
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(8)
                    } else {
                        HStack {
                            ProgressView()

                            Text("Acquiring location...")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Spacer()
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5)
        }
    }

    // MARK: - Break Actions Section
    private var breakActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Break Actions")
                .font(.headline)

            HStack(spacing: 12) {
                Button {
                    startBreak(type: .lunch, isPaid: false)
                } label: {
                    VStack {
                        Image(systemName: "fork.knife")
                            .font(.title2)
                        Text("Lunch Break")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .foregroundColor(.orange)
                    .cornerRadius(12)
                }

                Button {
                    startBreak(type: .rest, isPaid: true)
                } label: {
                    VStack {
                        Image(systemName: "cup.and.saucer.fill")
                            .font(.title2)
                        Text("Rest Break")
                            .font(.caption)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(12)
                }
            }

            if viewModel.currentShift?.status == .break {
                Button {
                    endBreak()
                } label: {
                    HStack {
                        Image(systemName: "play.circle.fill")
                        Text("End Break")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5)
    }

    // MARK: - Computed Properties
    private var canClockIn: Bool {
        !selectedDriverId.isEmpty && !selectedVehicleId.isEmpty && (!useGPSVerification || currentLocation != nil)
    }

    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }()

    // MARK: - Actions
    private func clockIn() {
        isProcessing = true

        Task {
            do {
                let location = useGPSVerification ? currentLocation : nil
                try await viewModel.clockIn(
                    driverId: selectedDriverId,
                    vehicleId: selectedVehicleId,
                    location: location
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
            isProcessing = false
        }
    }

    private func clockOut() {
        isProcessing = true

        Task {
            do {
                let location = useGPSVerification ? currentLocation : nil
                try await viewModel.clockOut(
                    location: location,
                    notes: notes.isEmpty ? nil : notes
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
            isProcessing = false
        }
    }

    private func startBreak(type: BreakType, isPaid: Bool) {
        Task {
            do {
                try await viewModel.startBreak(type: type, isPaid: isPaid)
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }

    private func endBreak() {
        Task {
            do {
                try await viewModel.endBreak()
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Simple Location Manager
class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    @Published var location: CLLocationCoordinate2D?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestPermission() async {
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.first?.coordinate
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        authorizationStatus = status
    }
}

// MARK: - Preview
struct ClockInOutView_Previews: PreviewProvider {
    static var previews: some View {
        ClockInOutView(viewModel: ShiftManagementViewModel())
    }
}
