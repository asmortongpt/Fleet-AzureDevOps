import UIKit
import Foundation

// MARK: - Cache Entry
/// Generic cache entry with expiration support
public struct CacheEntry<T> {
    public let value: T
    public let expirationDate: Date
    public let createdAt: Date

    public init(value: T, ttl: TimeInterval = 3600) {
        self.value = value
        self.createdAt = Date()
        self.expirationDate = Date().addingTimeInterval(ttl)
    }

    public var isExpired: Bool {
        return Date() > expirationDate
    }
}

// MARK: - Advanced Cache Manager
/// Thread-safe cache manager with TTL support and memory management
public class AdvancedCacheManager {

    // MARK: - Singleton
    public static let shared = AdvancedCacheManager()

    // MARK: - Properties
    private var cache: [String: Any] = [:]
    private let cacheQueue = DispatchQueue(label: "com.fleet.cache", attributes: .concurrent)
    private let maxCacheSize: Int = 100
    private var accessCount: [String: Int] = [:]

    // Statistics
    private var hitCount: Int = 0
    private var missCount: Int = 0

    // MARK: - Initialization
    private init() {
        setupMemoryWarningObserver()
    }

    // MARK: - Public Methods

    /// Store a value in the cache
    /// - Parameters:
    ///   - value: Value to cache
    ///   - key: Cache key
    ///   - ttl: Time to live in seconds (default: 1 hour)
    public func set<T>(_ value: T, forKey key: String, ttl: TimeInterval = 3600) {
        let entry = CacheEntry(value: value, ttl: ttl)

        cacheQueue.async(flags: .barrier) {
            self.cache[key] = entry
            self.accessCount[key] = 0

            // Evict if cache is too large
            if self.cache.count > self.maxCacheSize {
                self.evictLeastRecentlyUsed()
            }
        }
    }

    /// Retrieve a value from the cache
    /// - Parameter key: Cache key
    /// - Returns: Cached value if exists and not expired, nil otherwise
    public func get<T>(forKey key: String) -> T? {
        var result: T?

        cacheQueue.sync {
            guard let entry = cache[key] as? CacheEntry<T> else {
                self.missCount += 1
                return
            }

            if entry.isExpired {
                // Remove expired entry
                cache.removeValue(forKey: key)
                accessCount.removeValue(forKey: key)
                self.missCount += 1
                return
            }

            // Update access count
            accessCount[key, default: 0] += 1
            self.hitCount += 1
            result = entry.value
        }

        return result
    }

    /// Remove a value from the cache
    /// - Parameter key: Cache key
    public func remove(forKey key: String) {
        cacheQueue.async(flags: .barrier) {
            self.cache.removeValue(forKey: key)
            self.accessCount.removeValue(forKey: key)
        }
    }

    /// Clear all cached values
    public func clearAll() {
        cacheQueue.async(flags: .barrier) {
            self.cache.removeAll()
            self.accessCount.removeAll()
        }
    }

    /// Get cache statistics
    /// - Returns: Dictionary containing cache stats
    public func getStatistics() -> [String: Any] {
        var stats: [String: Any] = [:]

        cacheQueue.sync {
            let total = hitCount + missCount
            let hitRate = total > 0 ? Double(hitCount) / Double(total) : 0.0

            stats["size"] = cache.count
            stats["maxSize"] = maxCacheSize
            stats["hitCount"] = hitCount
            stats["missCount"] = missCount
            stats["hitRate"] = hitRate
        }

        return stats
    }

    // MARK: - Private Methods

    private func setupMemoryWarningObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }

    @objc private func handleMemoryWarning() {
        clearAll()
        print("💾 AdvancedCacheManager: Cache cleared due to memory warning")
    }

    private func evictLeastRecentlyUsed() {
        // Find key with lowest access count
        guard let lruKey = accessCount.min(by: { $0.value < $1.value })?.key else {
            return
        }

        cache.removeValue(forKey: lruKey)
        accessCount.removeValue(forKey: lruKey)

        print("💾 AdvancedCacheManager: Evicted LRU entry: \(lruKey)")
    }
}
