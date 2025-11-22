//
//  TripsView.swift
//  Fleet Manager
//
//  Simplified Trips view - Full implementation pending model alignment
//

import SwiftUI

struct TripsView: View {
    @StateObject private var viewModel = TripsViewModel()
    @State private var showingNewTrip = false
    @State private var selectedTrip: Trip?

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.loadingState == .loading {
                    ProgressView("Loading trips...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredTrips.isEmpty {
                    emptyState
                } else {
                    tripsList
                }
            }
            .navigationTitle("Trips")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingNewTrip = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showingNewTrip) {
                NewTripSheet(viewModel: viewModel)
            }
            .refreshable {
                await viewModel.refresh()
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "map")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Trips Yet")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start tracking your trips to see them here")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingNewTrip = true }) {
                HStack {
                    Image(systemName: "play.circle.fill")
                    Text("Start a Trip")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 30)
                .padding(.vertical, 15)
                .background(Color.green)
                .cornerRadius(12)
            }
            .padding(.top, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Trips List
    private var tripsList: some View {
        List {
            // Statistics Section
            Section {
                tripStatistics
            }
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())

            // Filter Section
            Section {
                filterPicker
            }

            // Trips Section
            Section("Recent Trips") {
                ForEach(viewModel.filteredTrips) { trip in
                    SimpleTripRow(trip: trip)
                        .onTapGesture {
                            selectedTrip = trip
                        }
                }
            }
        }
        .listStyle(.insetGrouped)
        .searchable(text: $viewModel.searchText, prompt: "Search trips")
    }

    // MARK: - Statistics
    private var tripStatistics: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                TripStatCard(title: "Today", value: "\(viewModel.todayTrips)", icon: "calendar", color: .blue)
                TripStatCard(title: "This Week", value: "\(viewModel.weekTrips)", icon: "calendar.badge.clock", color: .green)
                TripStatCard(title: "Distance", value: String(format: "%.1f mi", viewModel.totalDistance), icon: "location.fill", color: .purple)
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Filter Picker
    private var filterPicker: some View {
        Picker("Filter", selection: $viewModel.selectedFilter) {
            ForEach(TripsViewModel.TripFilter.allCases, id: \.self) { filter in
                Text(filter.rawValue).tag(filter)
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: viewModel.selectedFilter) { newValue in
            viewModel.applyFilter(newValue)
        }
    }
}

// MARK: - Simple Trip Row
struct SimpleTripRow: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(trip.name)
                    .font(.headline)

                Spacer()

                Text(trip.status.displayName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(statusColor)
                    .cornerRadius(8)
            }

            HStack(spacing: 16) {
                Label(String(format: "%.1f mi", trip.totalDistance), systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label(trip.formattedDuration, systemImage: "clock.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(trip.startTime.formatted(date: .abbreviated, time: .shortened))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var statusColor: Color {
        switch trip.status {
        case .active, .inProgress: return .green
        case .paused: return .orange
        case .completed: return .blue
        case .cancelled: return .gray
        }
    }
}

// MARK: - Trip Stat Card (using TripHistoryView's TripStatCard)

// MARK: - New Trip Sheet
struct NewTripSheet: View {
    @ObservedObject var viewModel: TripsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "location.fill.viewfinder")
                    .font(.system(size: 60))
                    .foregroundColor(.green)

                Text("Start New Trip")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Trip tracking will begin when you tap start")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                Button(action: {
                    viewModel.startNewTrip(vehicleId: "")
                    dismiss()
                }) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start Trip")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .cornerRadius(12)
                }
                .padding(.top)

                Spacer()
            }
            .padding()
            .navigationTitle("New Trip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Preview
struct TripsView_Previews: PreviewProvider {
    static var previews: some View {
        TripsView()
    }
}
