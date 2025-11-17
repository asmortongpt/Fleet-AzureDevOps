import SwiftUI

// MARK: - Trip History View
struct TripHistoryView: View {
    @StateObject private var persistenceManager = DataPersistenceManager.shared
    @StateObject private var trackingService = TripTrackingService.shared
    
    @State private var trips: [Trip] = []
    @State private var selectedTrip: Trip?
    @State private var showingTripDetail = false
    @State private var showingStartTrip = false
    @State private var showingDeleteAlert = false
    @State private var tripToDelete: Trip?
    @State private var searchText = ""
    @State private var filterStatus: TripStatus?
    
    var filteredTrips: [Trip] {
        var filtered = trips
        
        // Filter by status
        if let status = filterStatus {
            filtered = filtered.filter { $0.status == status }
        }
        
        // Filter by search text
        if !searchText.isEmpty {
            filtered = filtered.filter { trip in
                trip.name.localizedCaseInsensitiveContains(searchText) ||
                trip.vehicleId?.localizedCaseInsensitiveContains(searchText) == true ||
                trip.driverId?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
        
        return filtered.sorted { $0.startTime > $1.startTime }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Statistics Header
                statisticsHeader
                
                // Trip List
                if filteredTrips.isEmpty {
                    emptyState
                } else {
                    tripList
                }
            }
            .navigationTitle("Trip History")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingStartTrip = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search trips")
            .sheet(isPresented: $showingStartTrip) {
                Text("Start Trip View - Coming Soon")
                    .font(.title)
                    .padding()
            }
            .sheet(isPresented: $showingTripDetail) {
                if let trip = selectedTrip {
                    Text("Trip Detail View - Coming Soon")
                        .font(.title)
                        .padding()
                }
            }
            .alert("Delete Trip", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    if let trip = tripToDelete {
                        deleteTrip(trip)
                    }
                }
            } message: {
                Text("Are you sure you want to delete this trip? This action cannot be undone.")
            }
            .onAppear {
                loadTrips()
            }
            .refreshable {
                loadTrips()
            }
        }
    }
    
    // MARK: - Statistics Header
    
    private var statisticsHeader: some View {
        let stats = persistenceManager.getTripStatistics() ?? TripStatistics()

        return VStack(spacing: 0) {
            HStack(spacing: 20) {
                StatCard(
                    title: "Total Trips",
                    value: "\(stats.totalTrips)",
                    icon: "car.fill",
                    color: .blue
                )

                StatCard(
                    title: "Distance",
                    value: stats.formattedTotalDistance,
                    icon: "road.lanes",
                    color: .green
                )
                
                StatCard(
                    title: "Duration",
                    value: stats.formattedTotalDuration,
                    icon: "clock.fill",
                    color: .orange
                )
            }
            .padding()
            
            // Filter Chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    FilterChip(title: "All", isSelected: filterStatus == nil) {
                        filterStatus = nil
                    }
                    
                    FilterChip(title: "Active", isSelected: filterStatus == .active) {
                        filterStatus = .active
                    }
                    
                    FilterChip(title: "Completed", isSelected: filterStatus == .completed) {
                        filterStatus = .completed
                    }
                    
                    FilterChip(title: "Paused", isSelected: filterStatus == .paused) {
                        filterStatus = .paused
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom, 10)
            
            Divider()
        }
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Trip List
    
    private var tripList: some View {
        List {
            ForEach(filteredTrips) { trip in
                TripRowView(trip: trip)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedTrip = trip
                        showingTripDetail = true
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            tripToDelete = trip
                            showingDeleteAlert = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                        
                        Button {
                            shareTrip(trip)
                        } label: {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }
                        .tint(.blue)
                    }
            }
        }
        .listStyle(.plain)
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
            
            Text("Start tracking your first trip to see it here")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: { showingStartTrip = true }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Start New Trip")
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
    
    // MARK: - Helper Functions
    
    private func loadTrips() {
        trips = persistenceManager.getAllTrips()
    }
    
    private func deleteTrip(_ trip: Trip) {
        do {
            try persistenceManager.deleteTrip(trip)
            loadTrips()
        } catch {
            print("Error deleting trip: \(error)")
        }
    }
    
    private func shareTrip(_ trip: Trip) {
        do {
            let url = try persistenceManager.exportTrip(trip, format: .gpx)
            let activityVC = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                rootVC.present(activityVC, animated: true)
            }
        } catch {
            print("Error exporting trip: \(error)")
        }
    }
}

// MARK: - Trip Row View
struct TripRowView: View {
    let trip: Trip
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(trip.name)
                    .font(.headline)
                
                Spacer()
                
                StatusBadge(status: trip.status)
            }
            
            HStack(spacing: 20) {
                Label(trip.formattedDistance, systemImage: "road.lanes")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Label(trip.formattedDuration, systemImage: "clock")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if trip.averageSpeed > 0 {
                    Label(trip.formattedAverageSpeed, systemImage: "speedometer")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(trip.startTime.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: TripStatus
    
    var body: some View {
        Text(status.displayName)
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
        case .active:
            return .green
        case .paused:
            return .orange
        case .completed:
            return .blue
        case .cancelled:
            return .gray
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
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
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .cornerRadius(20)
        }
    }
}

// MARK: - Preview
struct TripHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        TripHistoryView()
    }
}
