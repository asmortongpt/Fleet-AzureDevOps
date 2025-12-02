//
//  FuelManagementView.swift
//  Fleet Manager
//
//  Mobile-First Fuel Tracking and Cost Management
//

import SwiftUI
import Charts

// MARK: - Fuel Entry Model
struct FuelEntry: Identifiable {
    let id = UUID()
    var vehicleId: String
    var vehicleName: String
    var date: Date
    var gallons: Double
    var costPerGallon: Double
    var totalCost: Double {
        gallons * costPerGallon
    }
    var odometer: Int
    var fuelType: FuelType
    var location: String
    var filledBy: String
}

enum FuelType: String, CaseIterable {
    case regular = "Regular"
    case midGrade = "Mid-Grade"
    case premium = "Premium"
    case diesel = "Diesel"
    case electric = "Electric"

    var icon: String {
        switch self {
        case .regular, .midGrade, .premium: return "fuelpump.fill"
        case .diesel: return "fuelpump.circle.fill"
        case .electric: return "bolt.fill"
        }
    }

    var color: Color {
        switch self {
        case .regular: return .green
        case .midGrade: return .orange
        case .premium: return .red
        case .diesel: return .purple
        case .electric: return .blue
        }
    }
}

// MARK: - Fuel Management View
struct FuelManagementView: View {
    @State private var fuelEntries: [FuelEntry] = []
    @State private var showingNewEntry = false
    @State private var selectedVehicleFilter: String?

    var totalSpent: Double {
        fuelEntries.reduce(0) { $0 + $1.totalCost }
    }

    var totalGallons: Double {
        fuelEntries.reduce(0) { $0 + $1.gallons }
    }

    var averageCostPerGallon: Double {
        guard !fuelEntries.isEmpty else { return 0 }
        return fuelEntries.reduce(0) { $0 + $1.costPerGallon } / Double(fuelEntries.count)
    }

    var filteredEntries: [FuelEntry] {
        if let filter = selectedVehicleFilter {
            return fuelEntries.filter { $0.vehicleName == filter }
        }
        return fuelEntries
    }

    var body: some View {
        VStack(spacing: 0) {
            // Stats Header
            statsHeader

            // Vehicle Filter
            vehicleFilter

            Divider()

            // Fuel Entries List
            if filteredEntries.isEmpty {
                emptyState
            } else {
                entriesList
            }
        }
        .navigationTitle("Fuel Management")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingNewEntry = true }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
        }
        .sheet(isPresented: $showingNewEntry) {
            NewFuelEntryView { newEntry in
                fuelEntries.insert(newEntry, at: 0)
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
                FuelStatCard(
                    title: "Total Spent",
                    value: String(format: "$%.2f", totalSpent),
                    icon: "dollarsign.circle.fill",
                    color: .green
                )

                FuelStatCard(
                    title: "Gallons",
                    value: String(format: "%.1f", totalGallons),
                    icon: "drop.fill",
                    color: .blue
                )

                FuelStatCard(
                    title: "Avg $/Gal",
                    value: String(format: "$%.2f", averageCostPerGallon),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .orange
                )

                FuelStatCard(
                    title: "Entries",
                    value: "\(fuelEntries.count)",
                    icon: "list.bullet.clipboard.fill",
                    color: .purple
                )
            }
            .padding()
        }
    }

    // MARK: - Vehicle Filter
    private var vehicleFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "All Vehicles", isSelected: selectedVehicleFilter == nil) {
                    selectedVehicleFilter = nil
                }

                ForEach(Array(Set(fuelEntries.map { $0.vehicleName })).sorted(), id: \.self) { vehicle in
                    FilterChip(
                        title: vehicle,
                        isSelected: selectedVehicleFilter == vehicle
                    ) {
                        selectedVehicleFilter = vehicle
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Entries List
    private var entriesList: some View {
        List {
            ForEach(filteredEntries) { entry in
                FuelEntryRowView(entry: entry)
            }
            .onDelete(perform: deleteEntries)
        }
        .listStyle(.plain)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "fuelpump.circle")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Fuel Entries")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start tracking fuel consumption")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingNewEntry = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Fuel Entry")
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

    // MARK: - Helper Functions
    private func deleteEntries(at offsets: IndexSet) {
        fuelEntries.remove(atOffsets: offsets)
    }

    private func loadSampleData() {
        if fuelEntries.isEmpty {
            fuelEntries = [
                FuelEntry(
                    vehicleId: "VEH001",
                    vehicleName: "Fleet Vehicle 001",
                    date: Date(),
                    gallons: 12.5,
                    costPerGallon: 3.45,
                    odometer: 45230,
                    fuelType: .regular,
                    location: "Shell Station - Main St",
                    filledBy: "John Doe"
                ),
                FuelEntry(
                    vehicleId: "VEH002",
                    vehicleName: "Fleet Vehicle 002",
                    date: Date().addingTimeInterval(-86400),
                    gallons: 15.2,
                    costPerGallon: 3.65,
                    odometer: 38450,
                    fuelType: .premium,
                    location: "BP Station - Oak Ave",
                    filledBy: "Jane Smith"
                ),
                FuelEntry(
                    vehicleId: "VEH003",
                    vehicleName: "Fleet Vehicle 003",
                    date: Date().addingTimeInterval(-172800),
                    gallons: 18.8,
                    costPerGallon: 3.55,
                    odometer: 52100,
                    fuelType: .diesel,
                    location: "Chevron - Highway 101",
                    filledBy: "Mike Johnson"
                )
            ]
        }
    }
}

// MARK: - Fuel Stat Card
struct FuelStatCard: View {
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
        .frame(width: 90)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5)
    }
}

// MARK: - Fuel Entry Row View
struct FuelEntryRowView: View {
    let entry: FuelEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.vehicleName)
                        .font(.headline)

                    Text(entry.location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(String(format: "$%.2f", entry.totalCost))
                        .font(.headline)
                        .foregroundColor(entry.fuelType.color)

                    FuelTypeBadge(fuelType: entry.fuelType)
                }
            }

            HStack(spacing: 16) {
                Label(entry.date.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label(String(format: "%.1f gal", entry.gallons), systemImage: "drop.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label(String(format: "$%.2f/gal", entry.costPerGallon), systemImage: "dollarsign")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack {
                Label("\(entry.odometer) mi", systemImage: "gauge")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Spacer()

                Text("By \(entry.filledBy)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}

// MARK: - Fuel Type Badge
struct FuelTypeBadge: View {
    let fuelType: FuelType

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: fuelType.icon)
                .font(.caption2)
            Text(fuelType.rawValue)
                .font(.caption2)
                .fontWeight(.semibold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(fuelType.color)
        .cornerRadius(6)
    }
}

// MARK: - New Fuel Entry View
struct NewFuelEntryView: View {
    let onCreate: (FuelEntry) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var selectedVehicle = "Fleet Vehicle 001"
    @State private var fillDate = Date()
    @State private var gallons = ""
    @State private var costPerGallon = ""
    @State private var odometer = ""
    @State private var fuelType: FuelType = .regular
    @State private var location = ""

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

                Section("Fuel Details") {
                    DatePicker("Fill Date", selection: $fillDate)

                    Picker("Fuel Type", selection: $fuelType) {
                        ForEach(FuelType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type)
                        }
                    }

                    HStack {
                        Text("Gallons")
                        Spacer()
                        TextField("0.0", text: $gallons)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }

                    HStack {
                        Text("Cost per Gallon")
                        Spacer()
                        TextField("$0.00", text: $costPerGallon)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }

                    if let gal = Double(gallons), let cost = Double(costPerGallon) {
                        HStack {
                            Text("Total Cost")
                            Spacer()
                            Text(String(format: "$%.2f", gal * cost))
                                .foregroundColor(.green)
                                .fontWeight(.bold)
                        }
                    }
                }

                Section("Odometer & Location") {
                    HStack {
                        Text("Odometer Reading")
                        Spacer()
                        TextField("0", text: $odometer)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                    }

                    TextField("Gas Station / Location", text: $location)
                }
            }
            .navigationTitle("New Fuel Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        let entry = FuelEntry(
                            vehicleId: "VEH001",
                            vehicleName: selectedVehicle,
                            date: fillDate,
                            gallons: Double(gallons) ?? 0,
                            costPerGallon: Double(costPerGallon) ?? 0,
                            odometer: Int(odometer) ?? 0,
                            fuelType: fuelType,
                            location: location,
                            filledBy: "Current User"
                        )
                        onCreate(entry)
                        dismiss()
                    }
                    .font(.headline)
                    .disabled(!isFormValid)
                }
            }
        }
    }

    private var isFormValid: Bool {
        !gallons.isEmpty &&
        !costPerGallon.isEmpty &&
        !odometer.isEmpty &&
        !location.isEmpty &&
        Double(gallons) != nil &&
        Double(costPerGallon) != nil &&
        Int(odometer) != nil
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        FuelManagementView()
    }
}
