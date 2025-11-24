/**
 * Vehicle Request View
 * Allows users to request vehicles from the mobile app or via Microsoft integration
 *
 * Features:
 * - Browse available vehicles
 * - Request vehicle with date/time
 * - View request status
 * - Microsoft Teams/Outlook deep linking
 * - Vehicle details on approval
 */

import SwiftUI

struct VehicleRequestView: View {
    @StateObject private var viewModel = VehicleRequestViewModel()
    @ObservedObject private var roleManager = RoleManager.shared
    @State private var showRequestForm = false
    @State private var selectedVehicle: Vehicle?
    @State private var searchText = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                SearchBar(text: $searchText)
                    .padding(.horizontal)
                    .padding(.vertical, 8)

                // Filter Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        FilterChip(
                            title: "All",
                            isSelected: viewModel.filterStatus == nil,
                            action: { viewModel.filterStatus = nil }
                        )
                        FilterChip(
                            title: "Available",
                            isSelected: viewModel.filterStatus == .available,
                            action: { viewModel.filterStatus = .available }
                        )
                        FilterChip(
                            title: "My Requests",
                            isSelected: viewModel.filterStatus == .myRequests,
                            action: { viewModel.filterStatus = .myRequests }
                        )
                        if roleManager.hasPermission(.vehicleViewFleet) {
                            FilterChip(
                                title: "All Requests",
                                isSelected: viewModel.filterStatus == .allRequests,
                                action: { viewModel.filterStatus = .allRequests }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                .background(Color(UIColor.systemBackground))

                if viewModel.isLoading {
                    ProgressView()
                        .padding()
                    Spacer()
                } else if viewModel.filteredVehicles.isEmpty {
                    EmptyStateView(
                        icon: "car.fill",
                        title: "No Vehicles Found",
                        message: "Try adjusting your filters or search criteria"
                    )
                    Spacer()
                } else {
                    // Vehicle List
                    List {
                        ForEach(viewModel.filteredVehicles) { vehicle in
                            VehicleRequestCard(
                                vehicle: vehicle,
                                onRequestTap: {
                                    selectedVehicle = vehicle
                                    showRequestForm = true
                                },
                                onViewTap: {
                                    selectedVehicle = vehicle
                                }
                            )
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowSeparator(.hidden)
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadVehicles()
                    }
                }
            }
            .navigationTitle("Request Vehicle")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { viewModel.showMicrosoftIntegration = true }) {
                            Label("Request via Teams", systemImage: "bubble.left.and.bubble.right.fill")
                        }
                        Button(action: { viewModel.showMicrosoftIntegration = true }) {
                            Label("Request via Outlook", systemImage: "envelope.fill")
                        }
                        Divider()
                        Button(action: { viewModel.exportRequests() }) {
                            Label("Export Requests", systemImage: "square.and.arrow.up")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showRequestForm) {
                if let vehicle = selectedVehicle {
                    VehicleRequestFormView(vehicle: vehicle, viewModel: viewModel)
                }
            }
            .sheet(item: $selectedVehicle) { vehicle in
                VehicleDetailsView(vehicle: vehicle)
            }
            .sheet(isPresented: $viewModel.showMicrosoftIntegration) {
                MicrosoftIntegrationView(viewModel: viewModel)
            }
        }
        .task {
            await viewModel.loadVehicles()
        }
    }
}

// MARK: - Vehicle Request Card

struct VehicleRequestCard: View {
    let vehicle: Vehicle
    let onRequestTap: () -> Void
    let onViewTap: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.name)
                        .font(.headline)
                    Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                StatusBadge(status: vehicle.status)
            }

            // Vehicle Info
            HStack(spacing: 16) {
                InfoItem(icon: "gauge", text: "\(Int(vehicle.mileage)) mi")
                InfoItem(icon: "fuelpump.fill", text: "\(vehicle.fuelLevelPercentage)%")
                InfoItem(icon: "location.fill", text: vehicle.displayLocation ?? "Unknown")
            }
            .font(.caption)
            .foregroundColor(.secondary)

            // Actions
            HStack(spacing: 12) {
                Button(action: onViewTap) {
                    HStack {
                        Image(systemName: "info.circle")
                        Text("View Details")
                    }
                    .font(.subheadline.weight(.medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }

                if vehicle.status == .available {
                    Button(action: onRequestTap) {
                        HStack {
                            Image(systemName: "calendar.badge.plus")
                            Text("Request")
                        }
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Vehicle Request Form

struct VehicleRequestFormView: View {
    let vehicle: Vehicle
    @ObservedObject var viewModel: VehicleRequestViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(86400) // +1 day
    @State private var purpose = ""
    @State private var notes = ""
    @State private var isSubmitting = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle")) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(vehicle.name)
                                .font(.headline)
                            Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        StatusBadge(status: vehicle.status)
                    }
                }

                Section(header: Text("Request Details")) {
                    DatePicker("Start Date", selection: $startDate, in: Date()...)
                    DatePicker("End Date", selection: $endDate, in: startDate...)

                    Picker("Purpose", selection: $purpose) {
                        Text("Select Purpose").tag("")
                        Text("Business Meeting").tag("business_meeting")
                        Text("Field Work").tag("field_work")
                        Text("Site Visit").tag("site_visit")
                        Text("Training").tag("training")
                        Text("Other").tag("other")
                    }
                }

                Section(header: Text("Additional Notes")) {
                    TextEditor(text: $notes)
                        .frame(height: 100)
                }

                Section {
                    HStack {
                        Text("Duration")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(formatDuration(start: startDate, end: endDate))
                            .fontWeight(.medium)
                    }
                }
            }
            .navigationTitle("Request Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        submitRequest()
                    }
                    .disabled(isSubmitting || purpose.isEmpty)
                }
            }
        }
    }

    private func submitRequest() {
        isSubmitting = true
        Task {
            await viewModel.submitRequest(
                vehicleId: vehicle.id,
                startDate: startDate,
                endDate: endDate,
                purpose: purpose,
                notes: notes
            )
            dismiss()
        }
    }

    private func formatDuration(start: Date, end: Date) -> String {
        let duration = end.timeIntervalSince(start)
        let days = Int(duration / 86400)
        let hours = Int((duration.truncatingRemainder(dividingBy: 86400)) / 3600)

        if days > 0 {
            return "\(days)d \(hours)h"
        } else {
            return "\(hours)h"
        }
    }
}

// MARK: - Microsoft Integration View

struct MicrosoftIntegrationView: View {
    @ObservedObject var viewModel: VehicleRequestViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Microsoft Teams")) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                                .font(.title2)
                                .foregroundColor(.purple)
                            VStack(alignment: .leading) {
                                Text("Request via Teams")
                                    .font(.headline)
                                Text("Send a request through Teams chat")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Button(action: {
                            viewModel.openTeamsIntegration()
                        }) {
                            Text("Open Teams")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.purple)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(.vertical, 8)
                }

                Section(header: Text("Microsoft Outlook")) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "envelope.fill")
                                .font(.title2)
                                .foregroundColor(.blue)
                            VStack(alignment: .leading) {
                                Text("Request via Email")
                                    .font(.headline)
                                Text("Send an email request with details")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Button(action: {
                            viewModel.openOutlookIntegration()
                        }) {
                            Text("Compose Email")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding(.vertical, 8)
                }

                Section(header: Text("How It Works")) {
                    VStack(alignment: .leading, spacing: 8) {
                        InstructionRow(
                            number: 1,
                            text: "Choose Teams or Outlook integration"
                        )
                        InstructionRow(
                            number: 2,
                            text: "Request will be sent to fleet manager"
                        )
                        InstructionRow(
                            number: 3,
                            text: "Receive approval notification"
                        )
                        InstructionRow(
                            number: 4,
                            text: "View vehicle details in the app"
                        )
                    }
                }
            }
            .navigationTitle("Microsoft Integration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Helper Views

struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            TextField("Search vehicles...", text: $text)
                .textFieldStyle(.plain)
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(10)
        .background(Color(UIColor.systemGray6))
        .cornerRadius(10)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(UIColor.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

struct StatusBadge: View {
    let status: VehicleStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(colorFromString(status.color).opacity(0.2))
            .foregroundColor(colorFromString(status.color))
            .cornerRadius(8)
    }

    private func colorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "green": return .green
        case "orange": return .orange
        case "blue": return .blue
        case "yellow": return .yellow
        case "gray": return .gray
        case "red": return .red
        default: return .gray
        }
    }
}

struct InfoItem: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(text)
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundColor(.gray)
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct InstructionRow: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.headline)
                .frame(width: 28, height: 28)
                .background(Color.blue)
                .foregroundColor(.white)
                .clipShape(Circle())
            Text(text)
                .font(.subheadline)
            Spacer()
        }
    }
}

// MARK: - Preview

#Preview {
    VehicleRequestView()
}
