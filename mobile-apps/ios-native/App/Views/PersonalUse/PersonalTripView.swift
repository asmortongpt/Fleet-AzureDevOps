//
//  PersonalTripView.swift
//  Fleet Manager
//
//  View for logging and managing personal trips
//

import SwiftUI
import MapKit

struct PersonalTripView: View {
    @StateObject private var viewModel = PersonalUseViewModel()
    @State private var showingAddTrip = false
    @State private var showingTripDetail = false
    @State private var selectedTrip: PersonalTrip?

    var body: some View {
        VStack(spacing: 0) {
            // Filter Bar
            filterBar

            // Trips List
            if viewModel.loadingState.isLoading {
                ProgressView("Loading trips...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredTrips.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(viewModel.filteredTrips) { trip in
                        tripCard(trip: trip)
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowSeparator(.hidden)
                            .onTapGesture {
                                selectedTrip = trip
                                showingTripDetail = true
                            }
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Personal Trips")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddTrip = true }) {
                    Image(systemName: "plus.circle.fill")
                }
            }
        }
        .sheet(isPresented: $showingAddTrip) {
            AddPersonalTripView(viewModel: viewModel)
        }
        .sheet(isPresented: $showingTripDetail) {
            if let trip = selectedTrip {
                TripDetailView(trip: trip, viewModel: viewModel)
            }
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Filter Bar
    private var filterBar: some View {
        VStack(spacing: 12) {
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search trips...", text: $viewModel.searchText)
                    .textFieldStyle(.plain)

                if !viewModel.searchText.isEmpty {
                    Button(action: { viewModel.searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)

            // Date Range Picker
            Picker("Date Range", selection: $viewModel.dateRange) {
                ForEach(DateRange.allCases, id: \.self) { range in
                    Text(range.rawValue).tag(range)
                }
            }
            .pickerStyle(.segmented)
        }
        .padding()
        .background(Color(.systemBackground))
    }

    // MARK: - Trip Card
    private func tripCard(trip: PersonalTrip) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trip.purpose)
                        .font(.headline)

                    Text(trip.driverName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(trip.formattedMiles)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.purple)

                    Label(trip.vehicleNumber, systemImage: "car.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Location Info
            VStack(alignment: .leading, spacing: 8) {
                locationRow(
                    icon: "location.circle.fill",
                    color: .green,
                    label: "Start",
                    address: trip.startLocation.fullAddress
                )

                if let endLocation = trip.endLocation {
                    locationRow(
                        icon: "location.fill",
                        color: .red,
                        label: "End",
                        address: endLocation.fullAddress
                    )
                }
            }

            // Trip Stats
            HStack(spacing: 20) {
                statItem(
                    icon: "calendar",
                    value: trip.formattedDate
                )

                statItem(
                    icon: "clock",
                    value: trip.formattedDuration
                )

                statItem(
                    icon: "speedometer",
                    value: "\(String(format: "%.0f", trip.startOdometer))"
                )
            }
            .font(.caption)
            .foregroundColor(.secondary)

            // Status Badge
            HStack {
                Spacer()

                Label(
                    trip.isCompleted ? "Completed" : "In Progress",
                    systemImage: trip.isCompleted ? "checkmark.circle.fill" : "clock.fill"
                )
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(Color(trip.statusColor))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color(trip.statusColor).opacity(0.2))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    private func locationRow(icon: String, color: Color, label: String, address: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)

                Text(address)
                    .font(.subheadline)
                    .lineLimit(1)
            }
        }
    }

    private func statItem(icon: String, value: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(value)
        }
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "car.circle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Personal Trips")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start logging your personal vehicle use to track mileage for reimbursement")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button(action: { showingAddTrip = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Log First Trip")
                        .fontWeight(.semibold)
                }
                .padding()
                .background(Color.purple)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Add Personal Trip View
struct AddPersonalTripView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: PersonalUseViewModel

    @State private var vehicleId = "VEH-001"
    @State private var vehicleNumber = "V-12345"
    @State private var startOdometer = ""
    @State private var endOdometer = ""
    @State private var purpose = ""
    @State private var notes = ""
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var isCompleted = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle Information")) {
                    Picker("Vehicle", selection: $vehicleId) {
                        Text("V-12345 (VEH-001)").tag("VEH-001")
                        Text("V-67890 (VEH-002)").tag("VEH-002")
                    }
                }

                Section(header: Text("Trip Details")) {
                    TextField("Purpose", text: $purpose)
                    TextField("Notes (optional)", text: $notes)

                    DatePicker("Start Time", selection: $startDate)

                    Toggle("Trip Completed", isOn: $isCompleted)

                    if isCompleted {
                        DatePicker("End Time", selection: $endDate)
                    }
                }

                Section(header: Text("Odometer Readings")) {
                    TextField("Start Odometer", text: $startOdometer)
                        .keyboardType(.decimalPad)

                    if isCompleted {
                        TextField("End Odometer", text: $endOdometer)
                            .keyboardType(.decimalPad)
                    }
                }

                if isCompleted && !startOdometer.isEmpty && !endOdometer.isEmpty {
                    Section(header: Text("Trip Summary")) {
                        let miles = (Double(endOdometer) ?? 0) - (Double(startOdometer) ?? 0)
                        HStack {
                            Text("Total Miles")
                            Spacer()
                            Text(String(format: "%.1f mi", miles))
                                .fontWeight(.semibold)
                                .foregroundColor(.purple)
                        }

                        if let rate = viewModel.currentPolicy?.ratePerMile {
                            HStack {
                                Text("Reimbursement")
                                Spacer()
                                Text(String(format: "$%.2f", miles * rate))
                                    .fontWeight(.semibold)
                                    .foregroundColor(.green)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Log Personal Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveTrip()
                    }
                    .disabled(!isFormValid)
                }
            }
        }
    }

    private var isFormValid: Bool {
        !purpose.isEmpty && !startOdometer.isEmpty &&
        (!isCompleted || !endOdometer.isEmpty)
    }

    private func saveTrip() {
        let trip = PersonalTrip(
            id: UUID().uuidString,
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            driverId: "DRV-001",
            driverName: "Current User",
            startDate: startDate,
            endDate: isCompleted ? endDate : nil,
            startLocation: TripLocation.sample,
            endLocation: isCompleted ? TripLocation.sample : nil,
            startOdometer: Double(startOdometer) ?? 0,
            endOdometer: isCompleted ? Double(endOdometer) : nil,
            purpose: purpose,
            notes: notes.isEmpty ? nil : notes,
            isCompleted: isCompleted,
            createdAt: Date(),
            updatedAt: Date()
        )

        Task {
            await viewModel.addTrip(trip)
            dismiss()
        }
    }
}

// MARK: - Trip Detail View
struct TripDetailView: View {
    @Environment(\.dismiss) var dismiss
    let trip: PersonalTrip
    @ObservedObject var viewModel: PersonalUseViewModel
    @State private var showingDeleteAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text(trip.purpose)
                            .font(.title2)
                            .fontWeight(.bold)

                        Label(trip.vehicleNumber, systemImage: "car.fill")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    // Mileage
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Total Miles")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(trip.formattedMiles)
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.purple)
                        }

                        Spacer()

                        if let rate = viewModel.currentPolicy?.ratePerMile {
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("Reimbursement")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(String(format: "$%.2f", trip.totalMiles * rate))
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Locations
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Route")
                            .font(.headline)

                        locationDetail(
                            icon: "location.circle.fill",
                            color: .green,
                            label: "Start",
                            address: trip.startLocation.fullAddress,
                            odometer: trip.startOdometer
                        )

                        if let endLocation = trip.endLocation, let endOdometer = trip.endOdometer {
                            locationDetail(
                                icon: "location.fill",
                                color: .red,
                                label: "End",
                                address: endLocation.fullAddress,
                                odometer: endOdometer
                            )
                        }
                    }

                    // Time Info
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Time")
                            .font(.headline)

                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.blue)
                            Text(trip.formattedDate)
                                .font(.subheadline)
                        }

                        HStack {
                            Image(systemName: "clock")
                                .foregroundColor(.blue)
                            Text(trip.formattedDuration)
                                .font(.subheadline)
                        }
                    }

                    // Notes
                    if let notes = trip.notes {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)

                            Text(notes)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Actions
                    VStack(spacing: 12) {
                        Button(action: { showingDeleteAlert = true }) {
                            HStack {
                                Image(systemName: "trash.fill")
                                Text("Delete Trip")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                    .padding(.top, 20)
                }
                .padding()
            }
            .navigationTitle("Trip Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Delete Trip", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    Task {
                        await viewModel.deleteTrip(trip)
                        dismiss()
                    }
                }
            } message: {
                Text("Are you sure you want to delete this trip? This action cannot be undone.")
            }
        }
    }

    private func locationDetail(icon: String, color: Color, label: String, address: String, odometer: Double) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)

                Text(address)
                    .font(.subheadline)

                Text("Odometer: \(String(format: "%.0f", odometer)) mi")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

#Preview {
    NavigationView {
        PersonalTripView()
    }
}
