/**
 * Vehicle Reservation View
 *
 * Comprehensive vehicle booking interface:
 * - Browse available vehicles
 * - Select date/time range
 * - View vehicle details and availability
 * - Calendar integration
 * - Booking confirmation
 */

import SwiftUI

struct VehicleReservationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = VehicleReservationViewModel()

    @State private var selectedVehicle: ReservableVehicle?
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(3600 * 24) // Default: 1 day
    @State private var purpose: String = ""
    @State private var notes: String = ""
    @State private var showingConfirmation = false
    @State private var showingSuccess = false
    @State private var isSubmitting = false

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 24) {
                        // MARK: - Header
                        headerSection

                        // MARK: - Date/Time Selection
                        dateTimeSection

                        // MARK: - Vehicle Selection
                        vehicleSelectionSection

                        // MARK: - Reservation Details
                        if selectedVehicle != nil {
                            reservationDetailsSection
                        }

                        // MARK: - Submit Button
                        if selectedVehicle != nil {
                            submitButton
                        }
                    }
                    .padding()
                }

                // MARK: - Loading Overlay
                if isSubmitting {
                    submittingOverlay
                }
            }
            .navigationTitle("Reserve Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Confirm Reservation", isPresented: $showingConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Confirm") {
                    submitReservation()
                }
            } message: {
                if let vehicle = selectedVehicle {
                    Text("Reserve \(vehicle.make) \(vehicle.model) from \(formattedDate(startDate)) to \(formattedDate(endDate))?")
                }
            }
            .alert("Reservation Confirmed", isPresented: $showingSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your vehicle reservation has been confirmed. Check your email for details.")
            }
            .onAppear {
                viewModel.loadAvailableVehicles(startDate: startDate, endDate: endDate)
            }
        }
    }

    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "car.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Book a Vehicle")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Select dates and choose from available vehicles")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }

    // MARK: - Date/Time Section
    private var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Reservation Period")
                .font(.headline)

            VStack(spacing: 16) {
                // Start Date/Time
                VStack(alignment: .leading, spacing: 8) {
                    Label("Start", systemImage: "calendar")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    DatePicker(
                        "",
                        selection: $startDate,
                        in: Date()...,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .datePickerStyle(.compact)
                    .onChange(of: startDate) { _, newValue in
                        // Ensure end date is after start date
                        if endDate <= newValue {
                            endDate = newValue.addingTimeInterval(3600) // Add 1 hour
                        }
                        viewModel.loadAvailableVehicles(startDate: newValue, endDate: endDate)
                    }
                }

                Divider()

                // End Date/Time
                VStack(alignment: .leading, spacing: 8) {
                    Label("End", systemImage: "calendar")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    DatePicker(
                        "",
                        selection: $endDate,
                        in: startDate.addingTimeInterval(3600)...,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .datePickerStyle(.compact)
                    .onChange(of: endDate) { _, newValue in
                        viewModel.loadAvailableVehicles(startDate: startDate, endDate: newValue)
                    }
                }

                // Duration Display
                HStack {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.blue)
                    Text("Duration: \(formattedDuration)")
                        .font(.subheadline)
                    Spacer()
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Vehicle Selection Section
    private var vehicleSelectionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Available Vehicles")
                    .font(.headline)
                Spacer()
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            if viewModel.availableVehicles.isEmpty && !viewModel.isLoading {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 40))
                        .foregroundColor(.orange)
                    Text("No vehicles available for selected dates")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                ForEach(viewModel.availableVehicles) { vehicle in
                    VehicleCard(
                        vehicle: vehicle,
                        isSelected: selectedVehicle?.id == vehicle.id,
                        onSelect: {
                            selectedVehicle = vehicle
                        }
                    )
                }
            }
        }
    }

    // MARK: - Reservation Details Section
    private var reservationDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Reservation Details")
                .font(.headline)

            VStack(spacing: 12) {
                TextField("Purpose of Use", text: $purpose)
                    .textFieldStyle(.roundedBorder)

                TextField("Additional Notes (Optional)", text: $notes, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)

                // Estimated Mileage
                HStack {
                    Text("Estimated Mileage")
                        .foregroundColor(.secondary)
                    Spacer()
                    TextField("Miles", value: $viewModel.estimatedMiles, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                        .frame(width: 100)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Submit Button
    private var submitButton: some View {
        Button(action: {
            showingConfirmation = true
        }) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                Text("Reserve Vehicle")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(purpose.isEmpty)
    }

    // MARK: - Submitting Overlay
    private var submittingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))

                Text("Confirming Reservation...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(40)
            .background(Color(.systemBackground))
            .cornerRadius(20)
            .shadow(radius: 20)
        }
    }

    // MARK: - Computed Properties
    private var formattedDuration: String {
        let duration = endDate.timeIntervalSince(startDate)
        let hours = Int(duration / 3600)
        let days = hours / 24

        if days > 0 {
            return "\(days) day(s) \(hours % 24) hour(s)"
        } else {
            return "\(hours) hour(s)"
        }
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    // MARK: - Submit Reservation
    private func submitReservation() {
        guard let vehicle = selectedVehicle else { return }

        isSubmitting = true
        Task {
            await viewModel.submitReservation(
                vehicleId: vehicle.id,
                startDate: startDate,
                endDate: endDate,
                purpose: purpose,
                notes: notes
            )
            isSubmitting = false
            showingSuccess = true
        }
    }
}

// MARK: - Vehicle Card
struct VehicleCard: View {
    let vehicle: Vehicle
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                // Vehicle Icon
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.blue : Color.gray.opacity(0.2))
                        .frame(width: 60, height: 60)

                    Image(systemName: "car.fill")
                        .font(.title2)
                        .foregroundColor(isSelected ? .white : .gray)
                }

                // Vehicle Info
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(vehicle.make) \(vehicle.model)")
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(vehicle.year)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    HStack(spacing: 12) {
                        Label("\(vehicle.mileage) mi", systemImage: "speedometer")
                        Label(vehicle.fuelType, systemImage: "fuelpump.fill")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                }

                Spacer()

                // Selection Indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color(.secondarySystemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - View Model
@MainActor
class VehicleReservationViewModel: ObservableObject {
    @Published var availableVehicles: [ReservableVehicle] = []
    @Published var isLoading = false
    @Published var estimatedMiles: Int = 0

    func loadAvailableVehicles(startDate: Date, endDate: Date) {
        isLoading = true
        Task {
            do {
                let vehicles = try await APIService.shared.getAvailableVehicles(
                    startDate: startDate,
                    endDate: endDate
                )
                await MainActor.run {
                    self.availableVehicles = vehicles
                    self.isLoading = false
                }
            } catch {
                print("Failed to load available vehicles: \(error)")
                await MainActor.run {
                    self.availableVehicles = []
                    self.isLoading = false
                }
            }
        }
    }

    func submitReservation(
        vehicleId: String,
        startDate: Date,
        endDate: Date,
        purpose: String,
        notes: String
    ) async {
        let reservationData: [String: Any] = [
            "vehicle_id": vehicleId,
            "start_time": ISO8601DateFormatter().string(from: startDate),
            "end_time": ISO8601DateFormatter().string(from: endDate),
            "purpose": purpose,
            "notes": notes,
            "estimated_miles": estimatedMiles
        ]

        do {
            try await APIService.shared.createReservation(data: reservationData)
        } catch {
            print("Failed to submit reservation: \(error)")
        }
    }
}

// MARK: - Models
struct ReservableVehicle: Identifiable {
    let id: String
    let make: String
    let model: String
    let year: String
    let mileage: Int
    let fuelType: String
    let licensePlate: String
}

#Preview {
    VehicleReservationView()
}
