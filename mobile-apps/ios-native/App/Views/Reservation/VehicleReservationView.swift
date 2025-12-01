//
//  VehicleReservationView.swift
//  Fleet Manager
//
//  Mobile-First Vehicle Reservation System
//

import SwiftUI

// MARK: - Reservation Model
struct VehicleReservation: Identifiable {
    let id = UUID()
    var vehicleId: String
    var vehicleName: String
    var startDate: Date
    var endDate: Date
    var purpose: String
    var destination: String
    var estimatedMileage: Int
    var reservedBy: String
    var status: ReservationStatus
}

enum ReservationStatus: String {
    case pending = "Pending"
    case approved = "Approved"
    case active = "Active"
    case completed = "Completed"
    case cancelled = "Cancelled"

    var color: Color {
        switch self {
        case .pending: return .orange
        case .approved: return .green
        case .active: return .blue
        case .completed: return .gray
        case .cancelled: return .red
        }
    }
}

// MARK: - Vehicle Reservation View
struct VehicleReservationView: View {
    @State private var showingNewReservation = false
    @State private var reservations: [VehicleReservation] = []
    @State private var selectedFilter: ReservationStatus?

    var filteredReservations: [VehicleReservation] {
        if let filter = selectedFilter {
            return reservations.filter { $0.status == filter }
        }
        return reservations
    }

    var body: some View {
        VStack(spacing: 0) {
            // Stats Header
            statsHeader

            // Filter Chips
            filterChips

            Divider()

            // Reservations List
            if reservations.isEmpty {
                emptyState
            } else if filteredReservations.isEmpty {
                noResultsState
            } else {
                reservationsList
            }
        }
        .navigationTitle("Reservations")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingNewReservation = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
        }
        .sheet(isPresented: $showingNewReservation) {
            NewReservationView { newReservation in
                reservations.insert(newReservation, at: 0)
            }
        }
        .onAppear {
            loadSampleData()
        }
    }

    // MARK: - Stats Header
    private var statsHeader: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ReservationStatCard(
                    title: "Upcoming",
                    value: "\(reservations.filter { $0.status == .approved }.count)",
                    icon: "clock.fill",
                    color: .green
                )

                ReservationStatCard(
                    title: "Active",
                    value: "\(reservations.filter { $0.status == .active }.count)",
                    icon: "car.fill",
                    color: .blue
                )

                ReservationStatCard(
                    title: "Pending",
                    value: "\(reservations.filter { $0.status == .pending }.count)",
                    icon: "hourglass",
                    color: .orange
                )

                ReservationStatCard(
                    title: "This Month",
                    value: "\(reservations.filter { Calendar.current.isDate($0.startDate, equalTo: Date(), toGranularity: .month) }.count)",
                    icon: "calendar",
                    color: .purple
                )
            }
            .padding()
        }
    }

    // MARK: - Filter Chips
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "All", isSelected: selectedFilter == nil) {
                    selectedFilter = nil
                }

                ForEach([ReservationStatus.pending, .approved, .active, .completed], id: \.self) { status in
                    FilterChip(
                        title: status.rawValue,
                        color: status.color,
                        isSelected: selectedFilter == status
                    ) {
                        selectedFilter = status
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Reservations List
    private var reservationsList: some View {
        List {
            ForEach(filteredReservations) { reservation in
                ReservationRowView(reservation: reservation)
            }
            .onDelete(perform: deleteReservations)
        }
        .listStyle(.plain)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Reservations")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Book a vehicle for your next trip")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingNewReservation = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("New Reservation")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.blue)
                .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - No Results State
    private var noResultsState: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 40))
                .foregroundColor(.gray)

            Text("No \(selectedFilter?.rawValue ?? "") Reservations")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Helper Functions
    private func deleteReservations(at offsets: IndexSet) {
        reservations.remove(atOffsets: offsets)
    }

    private func loadSampleData() {
        if reservations.isEmpty {
            reservations = [
                VehicleReservation(
                    vehicleId: "VEH001",
                    vehicleName: "Fleet Vehicle 001",
                    startDate: Date().addingTimeInterval(86400),
                    endDate: Date().addingTimeInterval(172800),
                    purpose: "Client Meeting",
                    destination: "Downtown Office",
                    estimatedMileage: 25,
                    reservedBy: "John Doe",
                    status: .approved
                ),
                VehicleReservation(
                    vehicleId: "VEH002",
                    vehicleName: "Fleet Vehicle 002",
                    startDate: Date(),
                    endDate: Date().addingTimeInterval(28800),
                    purpose: "Site Inspection",
                    destination: "Construction Site A",
                    estimatedMileage: 45,
                    reservedBy: "Jane Smith",
                    status: .active
                ),
                VehicleReservation(
                    vehicleId: "VEH003",
                    vehicleName: "Fleet Vehicle 003",
                    startDate: Date().addingTimeInterval(259200),
                    endDate: Date().addingTimeInterval(345600),
                    purpose: "Equipment Delivery",
                    destination: "Warehouse",
                    estimatedMileage: 60,
                    reservedBy: "Mike Johnson",
                    status: .pending
                )
            ]
        }
    }
}

// MARK: - Reservation Stat Card
struct ReservationStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 80)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    var color: Color = .blue
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : Color(.secondarySystemGroupedBackground))
                .cornerRadius(16)
        }
    }
}

// MARK: - Reservation Row View
struct ReservationRowView: View {
    let reservation: VehicleReservation

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(reservation.vehicleName)
                        .font(.headline)

                    Text(reservation.purpose)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                ReservationStatusBadge(status: reservation.status)
            }

            HStack(spacing: 16) {
                Label(reservation.startDate.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label(reservation.destination, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            HStack {
                Label("\(reservation.estimatedMileage) mi", systemImage: "road.lanes")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Spacer()

                Text("Reserved by \(reservation.reservedBy)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Reservation Status Badge
struct ReservationStatusBadge: View {
    let status: ReservationStatus

    var body: some View {
        Text(status.rawValue)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(status.color)
            .cornerRadius(6)
    }
}

// MARK: - New Reservation View
struct NewReservationView: View {
    let onCreate: (VehicleReservation) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var selectedVehicle = "Fleet Vehicle 001"
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(3600)
    @State private var purpose = ""
    @State private var destination = ""
    @State private var estimatedMileage = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Vehicle") {
                    Picker("Select Vehicle", selection: $selectedVehicle) {
                        Text("Fleet Vehicle 001").tag("Fleet Vehicle 001")
                        Text("Fleet Vehicle 002").tag("Fleet Vehicle 002")
                        Text("Fleet Vehicle 003").tag("Fleet Vehicle 003")
                    }
                }

                Section("Schedule") {
                    DatePicker("Start", selection: $startDate)
                    DatePicker("End", selection: $endDate)
                }

                Section("Trip Details") {
                    TextField("Purpose", text: $purpose)
                    TextField("Destination", text: $destination)
                    TextField("Estimated Mileage", text: $estimatedMileage)
                        .keyboardType(.numberPad)
                }
            }
            .navigationTitle("New Reservation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        let reservation = VehicleReservation(
                            vehicleId: "VEH001",
                            vehicleName: selectedVehicle,
                            startDate: startDate,
                            endDate: endDate,
                            purpose: purpose,
                            destination: destination,
                            estimatedMileage: Int(estimatedMileage) ?? 0,
                            reservedBy: "Current User",
                            status: .pending
                        )
                        onCreate(reservation)
                        dismiss()
                    }
                    .font(.headline)
                    .disabled(purpose.isEmpty || destination.isEmpty)
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        VehicleReservationView()
    }
}
