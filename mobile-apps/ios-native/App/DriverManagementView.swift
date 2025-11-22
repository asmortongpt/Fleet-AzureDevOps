//
//  DriverManagementView.swift
//  Fleet Manager
//
//  Complete driver management with list, details, and assignments
//

import SwiftUI

// MARK: - Driver Model
struct Driver: Identifiable, Codable {
    let id: String
    var firstName: String
    var lastName: String
    var email: String
    var phone: String
    var licenseNumber: String
    var licenseExpiry: Date
    var status: DriverStatus
    var assignedVehicleId: String?
    var department: String
    var hireDate: Date
    var totalTrips: Int
    var totalMiles: Double
    var safetyScore: Double // 0-100
    var profileImageUrl: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let first = firstName.first.map(String.init) ?? ""
        let last = lastName.first.map(String.init) ?? ""
        return "\(first)\(last)"
    }

    init(
        id: String = UUID().uuidString,
        firstName: String,
        lastName: String,
        email: String = "",
        phone: String = "",
        licenseNumber: String = "",
        licenseExpiry: Date = Date().addingTimeInterval(365*24*60*60),
        status: DriverStatus = .available,
        assignedVehicleId: String? = nil,
        department: String = "Operations",
        hireDate: Date = Date(),
        totalTrips: Int = 0,
        totalMiles: Double = 0,
        safetyScore: Double = 100,
        profileImageUrl: String? = nil
    ) {
        self.id = id
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phone = phone
        self.licenseNumber = licenseNumber
        self.licenseExpiry = licenseExpiry
        self.status = status
        self.assignedVehicleId = assignedVehicleId
        self.department = department
        self.hireDate = hireDate
        self.totalTrips = totalTrips
        self.totalMiles = totalMiles
        self.safetyScore = safetyScore
        self.profileImageUrl = profileImageUrl
    }
}

enum DriverStatus: String, Codable, CaseIterable {
    case available = "Available"
    case onTrip = "On Trip"
    case offDuty = "Off Duty"
    case onBreak = "On Break"
    case inactive = "Inactive"

    var color: Color {
        switch self {
        case .available: return .green
        case .onTrip: return .blue
        case .offDuty: return .gray
        case .onBreak: return .orange
        case .inactive: return .red
        }
    }
}

// MARK: - Driver Management View
struct DriverManagementView: View {
    @State private var drivers: [Driver] = []
    @State private var searchText = ""
    @State private var selectedFilter: DriverStatus?
    @State private var showingAddDriver = false
    @State private var selectedDriver: Driver?
    @State private var isLoading = true

    var filteredDrivers: [Driver] {
        var filtered = drivers

        if let filter = selectedFilter {
            filtered = filtered.filter { $0.status == filter }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.fullName.localizedCaseInsensitiveContains(searchText) ||
                $0.email.localizedCaseInsensitiveContains(searchText) ||
                $0.department.localizedCaseInsensitiveContains(searchText)
            }
        }

        return filtered.sorted { $0.lastName < $1.lastName }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Statistics Header
            statisticsHeader

            // Filter Chips
            filterChips

            Divider()

            // Drivers List
            if isLoading {
                ProgressView("Loading drivers...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredDrivers.isEmpty {
                emptyState
            } else {
                driversList
            }
        }
        .navigationTitle("Drivers")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $searchText, prompt: "Search drivers")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddDriver = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
        }
        .sheet(isPresented: $showingAddDriver) {
            AddDriverView { newDriver in
                drivers.append(newDriver)
            }
        }
        .sheet(item: $selectedDriver) { driver in
            DriverDetailView(driver: driver) { updatedDriver in
                if let index = drivers.firstIndex(where: { $0.id == updatedDriver.id }) {
                    drivers[index] = updatedDriver
                }
            }
        }
        .onAppear {
            loadDrivers()
        }
        .refreshable {
            loadDrivers()
        }
    }

    // MARK: - Statistics Header
    private var statisticsHeader: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                DriverStatCard(
                    title: "Total",
                    value: "\(drivers.count)",
                    icon: "person.3.fill",
                    color: .blue
                )

                DriverStatCard(
                    title: "Available",
                    value: "\(drivers.filter { $0.status == .available }.count)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                DriverStatCard(
                    title: "On Trip",
                    value: "\(drivers.filter { $0.status == .onTrip }.count)",
                    icon: "car.fill",
                    color: .orange
                )

                DriverStatCard(
                    title: "Avg Safety",
                    value: String(format: "%.0f%%", drivers.isEmpty ? 0 : drivers.map { $0.safetyScore }.reduce(0, +) / Double(drivers.count)),
                    icon: "shield.checkered",
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
                DriverFilterChip(title: "All", isSelected: selectedFilter == nil) {
                    selectedFilter = nil
                }

                ForEach(DriverStatus.allCases, id: \.self) { status in
                    DriverFilterChip(
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

    // MARK: - Drivers List
    private var driversList: some View {
        List {
            ForEach(filteredDrivers) { driver in
                DriverRowView(driver: driver)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedDriver = driver
                    }
            }
            .onDelete(perform: deleteDrivers)
        }
        .listStyle(.plain)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Drivers")
                .font(.title2)
                .fontWeight(.semibold)

            Text(searchText.isEmpty ? "Add drivers to manage your fleet team" : "No drivers match your search")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if searchText.isEmpty {
                Button(action: { showingAddDriver = true }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Driver")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 15)
                    .background(Color.blue)
                    .cornerRadius(12)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Helper Functions
    private func loadDrivers() {
        isLoading = true

        // Simulate loading - in production, fetch from API
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if drivers.isEmpty {
                // Sample data for demonstration
                drivers = []
            }
            isLoading = false
        }
    }

    private func deleteDrivers(at offsets: IndexSet) {
        let driversToDelete = offsets.map { filteredDrivers[$0] }
        drivers.removeAll { driver in driversToDelete.contains { $0.id == driver.id } }
    }
}

// MARK: - Driver Stat Card
struct DriverStatCard: View {
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

// MARK: - Driver Filter Chip
struct DriverFilterChip: View {
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

// MARK: - Driver Row View
struct DriverRowView: View {
    let driver: Driver

    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(driver.status.color.opacity(0.2))
                    .frame(width: 50, height: 50)

                Text(driver.initials)
                    .font(.headline)
                    .foregroundColor(driver.status.color)
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(driver.fullName)
                        .font(.headline)

                    Spacer()

                    DriverStatusBadge(status: driver.status)
                }

                Text(driver.department)
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 16) {
                    Label("\(driver.totalTrips) trips", systemImage: "car.fill")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Label(String(format: "%.0f mi", driver.totalMiles), systemImage: "road.lanes")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    HStack(spacing: 2) {
                        Image(systemName: "shield.fill")
                            .font(.caption2)
                        Text(String(format: "%.0f%%", driver.safetyScore))
                            .font(.caption2)
                    }
                    .foregroundColor(safetyScoreColor)
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var safetyScoreColor: Color {
        switch driver.safetyScore {
        case 90...100: return .green
        case 70..<90: return .orange
        default: return .red
        }
    }
}

// MARK: - Driver Status Badge
struct DriverStatusBadge: View {
    let status: DriverStatus

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

// MARK: - Add Driver View
struct AddDriverView: View {
    let onSave: (Driver) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var licenseNumber = ""
    @State private var licenseExpiry = Date().addingTimeInterval(365*24*60*60)
    @State private var department = "Operations"

    var body: some View {
        NavigationView {
            Form {
                Section("Personal Information") {
                    TextField("First Name", text: $firstName)
                    TextField("Last Name", text: $lastName)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }

                Section("License Information") {
                    TextField("License Number", text: $licenseNumber)
                    DatePicker("License Expiry", selection: $licenseExpiry, displayedComponents: .date)
                }

                Section("Assignment") {
                    TextField("Department", text: $department)
                }
            }
            .navigationTitle("Add Driver")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        let driver = Driver(
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            phone: phone,
                            licenseNumber: licenseNumber,
                            licenseExpiry: licenseExpiry,
                            department: department
                        )
                        onSave(driver)
                        dismiss()
                    }
                    .font(.headline)
                    .disabled(firstName.isEmpty || lastName.isEmpty)
                }
            }
        }
    }
}

// MARK: - Driver Detail View
struct DriverDetailView: View {
    let driver: Driver
    let onUpdate: (Driver) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var editedDriver: Driver
    @State private var isEditing = false

    init(driver: Driver, onUpdate: @escaping (Driver) -> Void) {
        self.driver = driver
        self.onUpdate = onUpdate
        _editedDriver = State(initialValue: driver)
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(driver.status.color.opacity(0.2))
                                .frame(width: 100, height: 100)

                            Text(driver.initials)
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(driver.status.color)
                        }

                        Text(driver.fullName)
                            .font(.title2)
                            .fontWeight(.bold)

                        DriverStatusBadge(status: driver.status)
                    }
                    .padding()

                    // Stats
                    HStack(spacing: 20) {
                        DriverDetailStat(title: "Trips", value: "\(driver.totalTrips)", icon: "car.fill")
                        DriverDetailStat(title: "Miles", value: String(format: "%.0f", driver.totalMiles), icon: "road.lanes")
                        DriverDetailStat(title: "Safety", value: String(format: "%.0f%%", driver.safetyScore), icon: "shield.fill")
                    }
                    .padding(.horizontal)

                    // Details
                    VStack(spacing: 0) {
                        DriverDetailRow(icon: "envelope.fill", label: "Email", value: driver.email)
                        Divider().padding(.leading, 44)
                        DriverDetailRow(icon: "phone.fill", label: "Phone", value: driver.phone)
                        Divider().padding(.leading, 44)
                        DriverDetailRow(icon: "creditcard.fill", label: "License", value: driver.licenseNumber)
                        Divider().padding(.leading, 44)
                        DriverDetailRow(icon: "calendar", label: "License Expiry", value: driver.licenseExpiry.formatted(date: .abbreviated, time: .omitted))
                        Divider().padding(.leading, 44)
                        DriverDetailRow(icon: "building.2.fill", label: "Department", value: driver.department)
                        Divider().padding(.leading, 44)
                        DriverDetailRow(icon: "calendar.badge.clock", label: "Hire Date", value: driver.hireDate.formatted(date: .abbreviated, time: .omitted))
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)

                    // Actions
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            HStack {
                                Image(systemName: "car.fill")
                                Text("Assign Vehicle")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                        }

                        Button(action: {}) {
                            HStack {
                                Image(systemName: "message.fill")
                                Text("Send Message")
                            }
                            .font(.headline)
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Driver Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Driver Detail Stat
struct DriverDetailStat: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Driver Detail Row
struct DriverDetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            Text(label)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .fontWeight(.medium)
        }
        .padding()
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        DriverManagementView()
    }
}
