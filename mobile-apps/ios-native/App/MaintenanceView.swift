//
//  MaintenanceView.swift
//  Fleet Manager
//
//  Maintenance view placeholder - Full implementation pending model alignment
//

import SwiftUI

struct MaintenanceView: View {
    @StateObject private var viewModel = MaintenanceViewModel()
    @State private var showingScheduleMaintenance = false

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading {
                    ProgressView("Loading maintenance records...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredRecords.isEmpty {
                    emptyState
                } else {
                    maintenanceList
                }
            }
            .navigationTitle("Maintenance")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingScheduleMaintenance = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showingScheduleMaintenance) {
                ScheduleMaintenanceView()
            }
            .onAppear {
                viewModel.loadMaintenanceRecords()
            }
            .refreshable {
                viewModel.loadMaintenanceRecords()
            }
        }
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "wrench.and.screwdriver")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Maintenance Records")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Schedule maintenance to keep your fleet running smoothly")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingScheduleMaintenance = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Schedule Maintenance")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Maintenance List
    private var maintenanceList: some View {
        List {
            ForEach(viewModel.filteredRecords) { record in
                MaintenanceRowView(record: record)
            }
        }
        .listStyle(.plain)
        .searchable(text: $viewModel.searchText, prompt: "Search maintenance")
    }
}

// MARK: - Maintenance Row View
struct MaintenanceRowView: View {
    let record: MaintenanceRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: record.type.icon)
                    .foregroundColor(.blue)

                Text(record.type.rawValue)
                    .font(.headline)

                Spacer()

                MaintenanceStatusBadge(status: record.status)
            }

            Text(record.description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack {
                if let vehicleNumber = record.vehicleNumber {
                    Label(vehicleNumber, systemImage: "car.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(record.scheduledDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Maintenance Status Badge
struct MaintenanceStatusBadge: View {
    let status: MaintenanceStatus

    var body: some View {
        Text(status.rawValue)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(statusColor)
            .cornerRadius(8)
    }

    private var statusColor: Color {
        switch status {
        case .scheduled: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .gray
        case .delayed: return .red
        case .onHold: return .yellow
        case .overdue: return .red
        }
    }
}

// MARK: - Maintenance Detail View (placeholder)
struct MaintenanceDetailView: View {
    let record: MaintenanceRecord
    @StateObject private var viewModel: MaintenanceViewModel

    init(record: MaintenanceRecord) {
        self.record = record
        self._viewModel = StateObject(wrappedValue: MaintenanceViewModel())
    }

    // Convenience initializer for navigation
    init(maintenanceId: String) {
        self.record = MaintenanceRecord(
            id: maintenanceId,
            vehicleId: "",
            type: .preventive,
            category: .oilChange,
            scheduledDate: Date(),
            description: "Loading..."
        )
        self._viewModel = StateObject(wrappedValue: MaintenanceViewModel())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(record.type.rawValue)
                    .font(.title2)
                    .fontWeight(.bold)

                Text(record.description)
                    .font(.body)

                if let cost = record.cost {
                    Text("Cost: $\(cost, specifier: "%.2f")")
                        .font(.subheadline)
                }

                Text("Scheduled: \(record.scheduledDate.formatted())")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .navigationTitle("Details")
    }
}

// MARK: - Preview
struct MaintenanceView_Previews: PreviewProvider {
    static var previews: some View {
        MaintenanceView()
    }
}
