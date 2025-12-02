import UIKit
import Foundation
import Combine

// MARK: - Metrics Collector
/// Collects and aggregates application metrics including performance traces, events, and lifecycle data
public class MetricsCollector {

    // MARK: - Singleton
    public static let shared = MetricsCollector()

    // MARK: - Properties
    private var activeTraces: [String: Trace] = [:]
    private var completedTraces: [Trace] = []
    private var lifecycleEvents: [AppLifecycleEvent] = []
    private var customMetrics: [String: Any] = [:]

    private let maxCompletedTraces = 1000
    private let maxLifecycleEvents = 500

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    private init() {
        setupLifecycleObservers()
    }

    // MARK: - Public Methods - Trace Management

    /// Start a new performance trace
    /// - Parameter name: Name of the trace
    /// - Returns: Trace ID for stopping the trace later
    public func startTrace(name: String) -> String {
        let trace = Trace(name: name)
        activeTraces[trace.id] = trace
        return trace.id
    }

    /// Stop an active trace
    /// - Parameter traceId: ID of the trace to stop
    public func stopTrace(traceId: String) {
        guard var trace = activeTraces[traceId] else {
            print("⚠️ MetricsCollector: Attempted to stop non-existent trace: \(traceId)")
            return
        }

        trace.stop()
        activeTraces.removeValue(forKey: traceId)

        // Store completed trace
        completedTraces.append(trace)

        // Trim old traces if needed
        if completedTraces.count > maxCompletedTraces {
            completedTraces.removeFirst(completedTraces.count - maxCompletedTraces)
        }

        print("📊 MetricsCollector: Trace '\(trace.name)' completed in \(String(format: "%.2f", trace.duration))s")
    }

    /// Add attribute to an active trace
    /// - Parameters:
    ///   - traceId: ID of the trace
    ///   - key: Attribute key
    ///   - value: Attribute value
    public func addTraceAttribute(traceId: String, key: String, value: String) {
        guard var trace = activeTraces[traceId] else {
            return
        }

        trace.attributes[key] = value
        activeTraces[traceId] = trace
    }

    // MARK: - Public Methods - Lifecycle Events

    /// Record an app lifecycle event
    /// - Parameter event: The lifecycle event to record
    public func recordLifecycleEvent(_ event: AppLifecycleEvent) {
        lifecycleEvents.append(event)

        // Trim old events if needed
        if lifecycleEvents.count > maxLifecycleEvents {
            lifecycleEvents.removeFirst(lifecycleEvents.count - maxLifecycleEvents)
        }

        print("📱 MetricsCollector: Lifecycle event recorded: \(event)")
    }

    // MARK: - Public Methods - Custom Metrics

    /// Record a custom metric
    /// - Parameters:
    ///   - name: Metric name
    ///   - value: Metric value
    public func recordMetric(name: String, value: Any) {
        customMetrics[name] = value
        print("📈 MetricsCollector: Metric recorded - \(name): \(value)")
    }

    /// Increment a counter metric
    /// - Parameter name: Counter name
    public func incrementCounter(name: String) {
        let currentValue = (customMetrics[name] as? Int) ?? 0
        customMetrics[name] = currentValue + 1
    }

    /// Record a timing metric
    /// - Parameters:
    ///   - name: Metric name
    ///   - duration: Duration in seconds
    public func recordTiming(name: String, duration: TimeInterval) {
        customMetrics[name] = duration
        print("⏱️ MetricsCollector: Timing recorded - \(name): \(String(format: "%.2f", duration))s")
    }

    // MARK: - Public Methods - Data Retrieval

    /// Get all completed traces
    /// - Returns: Array of completed traces
    public func getCompletedTraces() -> [Trace] {
        return completedTraces
    }

    /// Get traces by name
    /// - Parameter name: Trace name to filter by
    /// - Returns: Array of matching traces
    public func getTraces(byName name: String) -> [Trace] {
        return completedTraces.filter { $0.name == name }
    }

    /// Get average duration for traces with a specific name
    /// - Parameter name: Trace name
    /// - Returns: Average duration in seconds, or nil if no traces found
    public func getAverageDuration(forTraceName name: String) -> TimeInterval? {
        let traces = getTraces(byName: name)
        guard !traces.isEmpty else { return nil }

        let total = traces.reduce(0.0) { $0 + $1.duration }
        return total / Double(traces.count)
    }

    /// Get all lifecycle events
    /// - Returns: Array of recorded lifecycle events
    public func getLifecycleEvents() -> [AppLifecycleEvent] {
        return lifecycleEvents
    }

    /// Get a custom metric value
    /// - Parameter name: Metric name
    /// - Returns: Metric value, or nil if not found
    public func getMetric(name: String) -> Any? {
        return customMetrics[name]
    }

    /// Get all custom metrics
    /// - Returns: Dictionary of all custom metrics
    public func getAllMetrics() -> [String: Any] {
        return customMetrics
    }

    // MARK: - Public Methods - Data Management

    /// Clear all completed traces
    public func clearTraces() {
        completedTraces.removeAll()
        print("🗑️ MetricsCollector: Cleared all completed traces")
    }

    /// Clear all lifecycle events
    public func clearLifecycleEvents() {
        lifecycleEvents.removeAll()
        print("🗑️ MetricsCollector: Cleared all lifecycle events")
    }

    /// Clear all custom metrics
    public func clearMetrics() {
        customMetrics.removeAll()
        print("🗑️ MetricsCollector: Cleared all custom metrics")
    }

    /// Clear all collected data
    public func clearAll() {
        clearTraces()
        clearLifecycleEvents()
        clearMetrics()
        activeTraces.removeAll()
        print("🗑️ MetricsCollector: Cleared all data")
    }

    // MARK: - Public Methods - Reporting

    /// Generate a metrics summary report
    /// - Returns: Dictionary containing metrics summary
    public func generateSummaryReport() -> [String: Any] {
        var report: [String: Any] = [:]

        // Trace statistics
        let traceNames = Set(completedTraces.map { $0.name })
        var traceStats: [String: [String: Any]] = [:]

        for name in traceNames {
            let traces = getTraces(byName: name)
            let durations = traces.map { $0.duration }
            let avgDuration = durations.reduce(0.0, +) / Double(durations.count)
            let minDuration = durations.min() ?? 0
            let maxDuration = durations.max() ?? 0

            traceStats[name] = [
                "count": traces.count,
                "avgDuration": avgDuration,
                "minDuration": minDuration,
                "maxDuration": maxDuration
            ]
        }

        report["traces"] = traceStats
        report["totalTraces"] = completedTraces.count
        report["activeTraces"] = activeTraces.count

        // Lifecycle events
        let eventCounts = lifecycleEvents.reduce(into: [String: Int]()) { counts, event in
            let key = String(describing: event)
            counts[key, default: 0] += 1
        }
        report["lifecycleEvents"] = eventCounts

        // Custom metrics
        report["customMetrics"] = customMetrics

        return report
    }

    /// Export metrics as JSON
    /// - Returns: JSON data, or nil if serialization fails
    public func exportAsJSON() -> Data? {
        let report = generateSummaryReport()

        do {
            return try JSONSerialization.data(withJSONObject: report, options: .prettyPrinted)
        } catch {
            print("❌ MetricsCollector: Failed to serialize metrics: \(error)")
            return nil
        }
    }

    // MARK: - Private Methods

    private func setupLifecycleObservers() {
        // Observe app lifecycle notifications
        NotificationCenter.default.publisher(for: UIApplication.didFinishLaunchingNotification)
            .sink { [weak self] _ in
                self?.recordLifecycleEvent(.didFinishLaunching)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)
            .sink { [weak self] _ in
                self?.recordLifecycleEvent(.willEnterForeground)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)
            .sink { [weak self] _ in
                self?.recordLifecycleEvent(.didEnterBackground)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIApplication.willTerminateNotification)
            .sink { [weak self] _ in
                self?.recordLifecycleEvent(.willTerminate)
            }
            .store(in: &cancellables)
    }
}

// MARK: - Convenience Extensions

extension MetricsCollector {

    /// Execute a block and measure its duration
    /// - Parameters:
    ///   - name: Name for the trace
    ///   - block: Block to execute
    /// - Returns: Result of the block execution
    public func measure<T>(name: String, block: () throws -> T) rethrows -> T {
        let traceId = startTrace(name: name)
        defer { stopTrace(traceId: traceId) }
        return try block()
    }

    /// Execute an async block and measure its duration
    /// - Parameters:
    ///   - name: Name for the trace
    ///   - block: Async block to execute
    /// - Returns: Result of the block execution
    public func measureAsync<T>(name: String, block: () async throws -> T) async rethrows -> T {
        let traceId = startTrace(name: name)
        defer { stopTrace(traceId: traceId) }
        return try await block()
    }
}
