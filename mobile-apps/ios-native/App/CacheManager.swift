//
//  CacheManager.swift
//  Fleet Manager - iOS Native App
//
//  API response caching with Core Data persistence
//  Implements intelligent cache invalidation and offline support
//

import Foundation
import CoreData
import Combine
import CryptoKit

// MARK: - Cache Policy
public enum CachePolicy {
    case cacheFirst // Use cache if available, fallback to network
    case networkFirst // Try network first, fallback to cache
    case cacheOnly // Only use cache, no network
    case networkOnly // Only use network, no cache
    case staleWhileRevalidate // Return cache immediately, fetch in background
}

// MARK: - Cache Entry Model
public struct CacheEntry: Codable {
    let key: String
    let data: Data
    let timestamp: Date
    let expiresAt: Date?
    let etag: String?
    let contentType: String?
    var accessCount: Int
    var lastAccessed: Date

    public var isExpired: Bool {
        guard let expiresAt = expiresAt else { return false }
        return Date() > expiresAt
    }

    public var age: TimeInterval {
        Date().timeIntervalSince(timestamp)
    }
}

// MARK: - Cache Statistics
public struct CacheStatistics {
    let totalEntries: Int
    let totalSize: Int64 // in bytes
    let hitRate: Double // percentage
    let averageAge: TimeInterval
    let oldestEntry: Date?
    let newestEntry: Date?

    public var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: totalSize)
    }

    public var formattedHitRate: String {
        String(format: "%.1f%%", hitRate * 100)
    }
}

// MARK: - Cache Manager
public class CacheManager: ObservableObject {
    public static let shared = CacheManager()

    // MARK: - Published Properties
    @Published public var statistics: CacheStatistics?
    @Published public var isClearing = false

    // MARK: - Private Properties
    private let persistence = DataPersistenceManager.shared
    private let maxCacheSize: Int64 = 100 * 1024 * 1024 // 100 MB
    private let defaultExpirationInterval: TimeInterval = 3600 // 1 hour
    private var cacheHits = 0
    private var cacheMisses = 0

    // MARK: - Memory Cache
    private var memoryCache = NSCache<NSString, CachedResponse>()
    private let memoryCacheLimit = 50 // Number of items

    // MARK: - Cache Queue
    private let cacheQueue = DispatchQueue(label: "com.fleet.cacheManager", qos: .utility)

    // MARK: - Initialization
    private init() {
        memoryCache.countLimit = memoryCacheLimit
        updateStatistics()
    }

    // MARK: - Cache Operations

    /// Store data in cache with optional expiration
    public func set(_ data: Data, forKey key: String, expiresIn: TimeInterval? = nil, etag: String? = nil, contentType: String? = nil) {
        cacheQueue.async { [weak self] in
            guard let self = self else { return }

            let expiresAt = expiresIn.map { Date().addingTimeInterval($0) }

            let entry = CacheEntry(
                key: key,
                data: data,
                timestamp: Date(),
                expiresAt: expiresAt,
                etag: etag,
                contentType: contentType,
                accessCount: 0,
                lastAccessed: Date()
            )

            // Store in memory cache
            let cachedResponse = CachedResponse(data: data, timestamp: Date(), etag: etag)
            self.memoryCache.setObject(cachedResponse, forKey: key as NSString)

            // Store in Core Data
            self.saveToCoreData(entry)

            // Check cache size and evict if necessary
            self.evictIfNeeded()

            DispatchQueue.main.async {
                self.updateStatistics()
            }
        }
    }

    /// Retrieve data from cache
    public func get(forKey key: String, policy: CachePolicy = .cacheFirst) -> Data? {
        // Check memory cache first
        if let cached = memoryCache.object(forKey: key as NSString) {
            if !cached.isExpired {
                cacheHits += 1
                return cached.data
            }
        }

        // Check Core Data cache
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "key == %@", key)
        fetchRequest.fetchLimit = 1

        do {
            let entities = try persistence.viewContext.fetch(fetchRequest)

            if let entity = entities.first,
               let data = entity.data,
               let timestamp = entity.timestamp {

                // Check expiration
                if let expiresAt = entity.expiresAt, Date() > expiresAt {
                    cacheMisses += 1
                    // Expired, remove it
                    try? delete(forKey: key)
                    return nil
                }

                // Update access statistics
                entity.accessCount += 1
                entity.lastAccessed = Date()
                try? persistence.save()

                // Update memory cache
                let cachedResponse = CachedResponse(data: data, timestamp: timestamp, etag: entity.etag)
                memoryCache.setObject(cachedResponse, forKey: key as NSString)

                cacheHits += 1
                return data
            }
        } catch {
            print("Cache fetch error: \(error)")
        }

        cacheMisses += 1
        return nil
    }

    /// Get cache entry with metadata
    public func getEntry(forKey key: String) -> CacheEntry? {
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "key == %@", key)
        fetchRequest.fetchLimit = 1

        do {
            let entities = try persistence.viewContext.fetch(fetchRequest)

            if let entity = entities.first,
               let data = entity.data,
               let timestamp = entity.timestamp {

                return CacheEntry(
                    key: key,
                    data: data,
                    timestamp: timestamp,
                    expiresAt: entity.expiresAt,
                    etag: entity.etag,
                    contentType: entity.contentType,
                    accessCount: Int(entity.accessCount),
                    lastAccessed: entity.lastAccessed ?? timestamp
                )
            }
        } catch {
            print("Cache entry fetch error: \(error)")
        }

        return nil
    }

    /// Delete specific cache entry
    public func delete(forKey key: String) throws {
        // Remove from memory cache
        memoryCache.removeObject(forKey: key as NSString)

        // Remove from Core Data
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "key == %@", key)

        let context = persistence.viewContext
        let entities = try context.fetch(fetchRequest)

        for entity in entities {
            context.delete(entity)
        }

        try persistence.save()

        DispatchQueue.main.async {
            self.updateStatistics()
        }
    }

    /// Clear all cache entries
    public func clearAll() {
        cacheQueue.async { [weak self] in
            guard let self = self else { return }

            DispatchQueue.main.async {
                self.isClearing = true
            }

            // Clear memory cache
            self.memoryCache.removeAllObjects()

            // Clear Core Data cache
            let fetchRequest: NSFetchRequest<NSFetchRequestResult> = CachedAPIResponseEntity.fetchRequest()
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

            do {
                try self.persistence.viewContext.execute(deleteRequest)
                try self.persistence.save()
            } catch {
                print("Error clearing cache: \(error)")
            }

            // Reset hit/miss counters
            self.cacheHits = 0
            self.cacheMisses = 0

            DispatchQueue.main.async {
                self.isClearing = false
                self.updateStatistics()
            }
        }
    }

    /// Clear expired entries
    public func clearExpired() {
        cacheQueue.async { [weak self] in
            guard let self = self else { return }

            let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
            fetchRequest.predicate = NSPredicate(format: "expiresAt != nil AND expiresAt < %@", Date() as NSDate)

            do {
                let expiredEntities = try self.persistence.viewContext.fetch(fetchRequest)

                for entity in expiredEntities {
                    if let key = entity.key {
                        self.memoryCache.removeObject(forKey: key as NSString)
                    }
                    self.persistence.viewContext.delete(entity)
                }

                if !expiredEntities.isEmpty {
                    try self.persistence.save()
                }

                DispatchQueue.main.async {
                    self.updateStatistics()
                }
            } catch {
                print("Error clearing expired cache: \(error)")
            }
        }
    }

    /// Clear old entries (LRU eviction)
    public func clearOldEntries(keepCount: Int = 100) {
        cacheQueue.async { [weak self] in
            guard let self = self else { return }

            let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
            fetchRequest.sortDescriptors = [NSSortDescriptor(key: "lastAccessed", ascending: true)]

            do {
                let allEntities = try self.persistence.viewContext.fetch(fetchRequest)

                // Keep only the most recently accessed entries
                if allEntities.count > keepCount {
                    let entitiesToDelete = allEntities.prefix(allEntities.count - keepCount)

                    for entity in entitiesToDelete {
                        if let key = entity.key {
                            self.memoryCache.removeObject(forKey: key as NSString)
                        }
                        self.persistence.viewContext.delete(entity)
                    }

                    try self.persistence.save()
                }

                DispatchQueue.main.async {
                    self.updateStatistics()
                }
            } catch {
                print("Error clearing old cache entries: \(error)")
            }
        }
    }

    // MARK: - Cache Key Generation

    /// Generate cache key from URL and parameters
    public static func cacheKey(for url: URL, parameters: [String: Any]? = nil) -> String {
        var key = url.absoluteString

        if let parameters = parameters, !parameters.isEmpty {
            let sortedKeys = parameters.keys.sorted()
            let paramString = sortedKeys.map { "\($0)=\(parameters[$0] ?? "")" }.joined(separator: "&")
            key += "?\(paramString)"
        }

        // Hash the key to keep it consistent length
        let hash = SHA256.hash(data: Data(key.utf8))
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Private Methods

    private func saveToCoreData(_ entry: CacheEntry) {
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "key == %@", entry.key)
        fetchRequest.fetchLimit = 1

        let context = persistence.viewContext

        do {
            let existingEntities = try context.fetch(fetchRequest)
            let entity: CachedAPIResponseEntity

            if let existing = existingEntities.first {
                entity = existing
            } else {
                entity = CachedAPIResponseEntity(context: context)
                entity.key = entry.key
            }

            entity.data = entry.data
            entity.timestamp = entry.timestamp
            entity.expiresAt = entry.expiresAt
            entity.etag = entry.etag
            entity.contentType = entry.contentType
            entity.accessCount = Int32(entry.accessCount)
            entity.lastAccessed = entry.lastAccessed
            entity.size = Int64(entry.data.count)

            try persistence.save()
        } catch {
            print("Error saving cache entry: \(error)")
        }
    }

    private func evictIfNeeded() {
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()

        do {
            let entities = try persistence.viewContext.fetch(fetchRequest)
            let totalSize = entities.reduce(0) { $0 + $1.size }

            // If cache exceeds max size, evict least recently used
            if totalSize > maxCacheSize {
                let sortedEntities = entities.sorted { ($0.lastAccessed ?? Date.distantPast) < ($1.lastAccessed ?? Date.distantPast) }

                var currentSize = totalSize
                for entity in sortedEntities {
                    guard currentSize > maxCacheSize * 90 / 100 else { break } // Evict to 90% capacity

                    if let key = entity.key {
                        memoryCache.removeObject(forKey: key as NSString)
                    }

                    currentSize -= entity.size
                    persistence.viewContext.delete(entity)
                }

                try persistence.save()
            }
        } catch {
            print("Error evicting cache: \(error)")
        }
    }

    private func updateStatistics() {
        let fetchRequest: NSFetchRequest<CachedAPIResponseEntity> = CachedAPIResponseEntity.fetchRequest()

        do {
            let entities = try persistence.viewContext.fetch(fetchRequest)

            let totalSize = entities.reduce(0) { $0 + $1.size }
            let totalAge = entities.reduce(0.0) { $0 + (Date().timeIntervalSince($1.timestamp ?? Date())) }
            let averageAge = entities.isEmpty ? 0 : totalAge / Double(entities.count)

            let oldestEntry = entities.map { $0.timestamp ?? Date() }.min()
            let newestEntry = entities.map { $0.timestamp ?? Date() }.max()

            let totalRequests = cacheHits + cacheMisses
            let hitRate = totalRequests > 0 ? Double(cacheHits) / Double(totalRequests) : 0

            DispatchQueue.main.async {
                self.statistics = CacheStatistics(
                    totalEntries: entities.count,
                    totalSize: totalSize,
                    hitRate: hitRate,
                    averageAge: averageAge,
                    oldestEntry: oldestEntry,
                    newestEntry: newestEntry
                )
            }
        } catch {
            print("Error updating cache statistics: \(error)")
        }
    }
}

// MARK: - Cached Response (Memory Cache)
private class CachedResponse {
    let data: Data
    let timestamp: Date
    let etag: String?

    init(data: Data, timestamp: Date, etag: String? = nil) {
        self.data = data
        self.timestamp = timestamp
        self.etag = etag
    }

    var isExpired: Bool {
        // Memory cache expires after 5 minutes
        return Date().timeIntervalSince(timestamp) > 300
    }
}

// MARK: - Cache-Aware Network Layer
public extension CacheManager {
    /// Fetch with cache support
    func fetch<T: Codable>(
        url: URL,
        parameters: [String: Any]? = nil,
        policy: CachePolicy = .staleWhileRevalidate,
        expiresIn: TimeInterval? = nil,
        responseType: T.Type
    ) async throws -> T {

        let cacheKey = CacheManager.cacheKey(for: url, parameters: parameters)

        // Handle cache policy
        switch policy {
        case .cacheOnly:
            if let data = get(forKey: cacheKey) {
                return try JSONDecoder().decode(T.self, from: data)
            }
            throw PersistenceError.fetchError("No cached data available")

        case .cacheFirst:
            if let data = get(forKey: cacheKey) {
                return try JSONDecoder().decode(T.self, from: data)
            }
            // Fall through to network

        case .networkOnly:
            break // Skip cache check

        case .networkFirst:
            break // Try network first

        case .staleWhileRevalidate:
            // Return cache immediately if available, fetch in background
            if let data = get(forKey: cacheKey) {
                Task {
                    try? await fetchFromNetwork(url: url, cacheKey: cacheKey, expiresIn: expiresIn, responseType: T.self)
                }
                return try JSONDecoder().decode(T.self, from: data)
            }
        }

        // Fetch from network
        return try await fetchFromNetwork(url: url, cacheKey: cacheKey, expiresIn: expiresIn, responseType: T.self)
    }

    private func fetchFromNetwork<T: Codable>(
        url: URL,
        cacheKey: String,
        expiresIn: TimeInterval?,
        responseType: T.Type
    ) async throws -> T {

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw PersistenceError.syncError("Network request failed")
        }

        // Cache the response
        let etag = httpResponse.value(forHTTPHeaderField: "ETag")
        let contentType = httpResponse.value(forHTTPHeaderField: "Content-Type")
        let expiration = expiresIn ?? defaultExpirationInterval

        set(data, forKey: cacheKey, expiresIn: expiration, etag: etag, contentType: contentType)

        return try JSONDecoder().decode(T.self, from: data)
    }
}
