//
//  TripRepository.swift
//  Fleet Manager - iOS Native App
//
//  Repository for Trip data persistence and retrieval
//  Supports offline-first architecture
//

import Foundation

// MARK: - Trip Repository
public class TripRepository {
    private let persistence = DataPersistenceManager.shared

    // MARK: - CRUD Operations

    /// Fetch all trips
    public func fetchAll() throws -> [TripModels.Trip] {
        // For now, return from cache
        return persistence.getCachedTrips() ?? []
    }

    /// Fetch trip by ID
    public func fetch(byId id: UUID) throws -> TripModels.Trip? {
        let allTrips = fetchAll()
        return allTrips.first { $0.id == id }
    }

    /// Fetch trips by status
    public func fetch(byStatus status: TripModels.TripStatus) throws -> [TripModels.Trip] {
        let allTrips = fetchAll()
        return allTrips.filter { $0.status == status }
    }

    /// Fetch trips by vehicle
    public func fetch(byVehicleId vehicleId: String) throws -> [TripModels.Trip] {
        let allTrips = fetchAll()
        return allTrips.filter { $0.vehicleId == vehicleId }
    }

    /// Save or update trip
    public func save(_ trip: TripModels.Trip) throws {
        persistence.cacheTrip(trip)
    }

    /// Save multiple trips (batch operation)
    public func saveAll(_ trips: [TripModels.Trip]) throws {
        persistence.cacheTrips(trips)
    }

    /// Delete trip
    public func delete(_ trip: TripModels.Trip) throws {
        var trips = fetchAll()
        trips.removeAll { $0.id == trip.id }
        persistence.cacheTrips(trips)
    }

    /// Delete all trips
    public func deleteAll() throws {
        persistence.clearTripCache()
    }

    // MARK: - Statistics

    /// Get trip count by status
    public func countByStatus() throws -> [TripModels.TripStatus: Int] {
        var counts: [TripModels.TripStatus: Int] = [:]
        let allTrips = fetchAll()

        for status in [TripModels.TripStatus.active, .paused, .completed, .cancelled] {
            counts[status] = allTrips.filter { $0.status == status }.count
        }

        return counts
    }

    /// Get total distance across all trips
    public func totalDistance() throws -> Double {
        let allTrips = fetchAll()
        return allTrips.reduce(0.0) { $0 + $1.totalDistance }
    }

    /// Get average trip duration
    public func averageDuration() throws -> TimeInterval {
        let allTrips = fetchAll()
        guard !allTrips.isEmpty else { return 0 }

        let totalDuration = allTrips.reduce(0.0) { $0 + $1.duration }
        return totalDuration / Double(allTrips.count)
    }
}

// MARK: - Trip Search
public extension TripRepository {
    /// Search trips by query (name, vehicle, driver)
    func search(query: String) throws -> [TripModels.Trip] {
        let allTrips = fetchAll()

        return allTrips.filter { trip in
            trip.name.localizedCaseInsensitiveContains(query) ||
            (trip.vehicleNumber?.localizedCaseInsensitiveContains(query) ?? false) ||
            (trip.vehicleId?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }
}
