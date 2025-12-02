//
//  TripDetailViewWrapper.swift
//  Fleet Manager
//
//  Wrapper to display TripDetailView by ID
//

import SwiftUI

struct TripDetailViewWrapper: View {
    let tripId: String
    @StateObject private var persistenceManager = DataPersistenceManager.shared
    @State private var trip: Trip?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading trip...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let trip = trip {
                TripDetailView(trip: trip)
            } else if let error = errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)

                    Text("Failed to Load Trip")
                        .font(.title2.bold())

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    Button("Retry") {
                        loadTrip()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "map")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)

                    Text("Trip Not Found")
                        .font(.title2.bold())

                    Text("Unable to load trip with ID: \(tripId)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onAppear {
            loadTrip()
        }
        .navigationTitle("Trip Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func loadTrip() {
        isLoading = true
        errorMessage = nil

        // Try to find trip from cached trips
        if let trips = persistenceManager.getCachedTrips() {
            trip = trips.first { String(describing: $0.id) == tripId }
            if trip == nil {
                errorMessage = "Trip not found in local cache"
            }
        } else {
            errorMessage = "No cached trips available"
        }

        isLoading = false
    }
}
