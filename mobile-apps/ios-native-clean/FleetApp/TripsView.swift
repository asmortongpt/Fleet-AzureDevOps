import SwiftUI

struct TripsView: View {
    @State private var trips: [Trip] = []
    @State private var isLoading = true

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading trips...")
                } else if trips.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "map.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.gray)
                        Text("No trips found")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List(trips) { trip in
                        TripRow(trip: trip)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Trips")
            .task {
                await loadTrips()
            }
        }
    }

    private func loadTrips() async {
        // Simulate loading
        try? await Task.sleep(nanoseconds: 500_000_000)

        // Mock data
        trips = [
            Trip(
                id: "1",
                vehicleId: "1",
                driverId: "driver1",
                startTime: Date().addingTimeInterval(-7200),
                endTime: nil,
                startLocation: Location(latitude: 30.4383, longitude: -84.2807, address: "Tallahassee, FL"),
                endLocation: nil,
                distance: nil,
                status: .active
            ),
            Trip(
                id: "2",
                vehicleId: "2",
                driverId: "driver2",
                startTime: Date().addingTimeInterval(-86400),
                endTime: Date().addingTimeInterval(-82800),
                startLocation: Location(latitude: 25.7617, longitude: -80.1918, address: "Miami, FL"),
                endLocation: Location(latitude: 26.1224, longitude: -80.1373, address: "Fort Lauderdale, FL"),
                distance: 28.5,
                status: .completed
            )
        ]

        isLoading = false
    }
}

struct TripRow: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(trip.status == .active ? "Active Trip" : "Completed")
                    .font(.headline)
                Spacer()
                TripStatusBadge(status: trip.status)
            }

            HStack {
                VStack(alignment: .leading) {
                    Label("Start", systemImage: "circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                    if let address = trip.startLocation.address {
                        Text(address)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "arrow.right")
                    .foregroundColor(.secondary)

                Spacer()

                VStack(alignment: .trailing) {
                    Label("End", systemImage: trip.status == .active ? "circle" : "circle.fill")
                        .font(.caption)
                        .foregroundColor(trip.status == .active ? .gray : .red)
                    if let endLocation = trip.endLocation,
                       let address = endLocation.address {
                        Text(address)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            HStack(spacing: 16) {
                Label(trip.startTime, style: .time)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if let distance = trip.distance {
                    Label("\(String(format: "%.1f", distance)) mi", systemImage: "ruler")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

struct TripStatusBadge: View {
    let status: Trip.TripStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(6)
    }

    private var statusColor: Color {
        switch status {
        case .active: return .green
        case .completed: return .blue
        case .cancelled: return .red
        }
    }
}

#Preview {
    TripsView()
}
