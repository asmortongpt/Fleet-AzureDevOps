//
//  UIPerformanceMonitor.swift
//  Fleet Manager - iOS Native App
//
//  Real-time UI performance tracking and optimization
//  Monitors FPS, frame drops (hitches), view hierarchy depth, and render times
//  Automatically generates performance reports and alerts on degradation
//

import Foundation
import UIKit
import QuartzCore

// MARK: - Frame Performance
public struct FramePerformance {
    let timestamp: Date
    let fps: Double
    let droppedFrames: Int
    let renderTime: TimeInterval

    var isHitch: Bool {
        return droppedFrames > 2 // More than 2 dropped frames is a hitch
    }

    var quality: FrameQuality {
        if fps >= 58 {
            return .excellent
        } else if fps >= 50 {
            return .good
        } else if fps >= 40 {
            return .fair
        } else {
            return .poor
        }
    }
}

public enum FrameQuality {
    case excellent  // 58+ fps
    case good       // 50-57 fps
    case fair       // 40-49 fps
    case poor       // <40 fps
}

// MARK: - View Hierarchy Metrics
public struct ViewHierarchyMetrics {
    let depth: Int
    let viewCount: Int
    let complexViews: Int  // Views with complex rendering
    let timestamp: Date

    var isOptimal: Bool {
        return depth <= 10 && viewCount <= 100
    }

    var healthScore: Double {
        var score = 100.0

        // Penalize deep hierarchies
        if depth > 10 {
            score -= Double(depth - 10) * 5
        }

        // Penalize too many views
        if viewCount > 100 {
            score -= Double(viewCount - 100) * 0.5
        }

        // Penalize complex views
        score -= Double(complexViews) * 2

        return max(0, min(100, score))
    }
}

// MARK: - Performance Alert
public struct PerformanceAlert {
    let type: AlertType
    let message: String
    let timestamp: Date
    let severity: Severity

    public enum AlertType {
        case lowFPS
        case hitch
        case deepHierarchy
        case slowRender
        case memoryPressure
    }

    public enum Severity {
        case low
        case medium
        case high
    }
}

// MARK: - UI Performance Metrics
public struct UIPerformanceMetrics {
    var averageFPS: Double = 0
    var currentFPS: Double = 0
    var minFPS: Double = 60
    var maxFPS: Double = 0
    var totalFrames: Int = 0
    var droppedFrames: Int = 0
    var hitchCount: Int = 0
    var averageRenderTime: TimeInterval = 0
    var maxRenderTime: TimeInterval = 0
    var averageHierarchyDepth: Int = 0
    var maxHierarchyDepth: Int = 0

    public var dropRate: Double {
        return totalFrames > 0 ? Double(droppedFrames) / Double(totalFrames) : 0.0
    }

    public var hitchRate: Double {
        return totalFrames > 0 ? Double(hitchCount) / Double(totalFrames) : 0.0
    }
}

// MARK: - UI Performance Monitor
public class UIPerformanceMonitor {

    // MARK: - Singleton
    public static let shared = UIPerformanceMonitor()

    // MARK: - Dependencies
    private let logger = LoggingManager.shared

    // MARK: - Configuration
    private struct Config {
        var targetFPS: Double = 60.0
        var fpsWarningThreshold: Double = 50.0
        var hitchThreshold: Int = 2  // Dropped frames to consider a hitch
        var maxHierarchyDepth: Int = 10
        var maxViewCount: Int = 100
        var renderTimeWarning: TimeInterval = 0.016  // 16ms (60fps frame time)
        var sampleInterval: TimeInterval = 1.0  // Sample every second
    }

    private var config = Config()

    // MARK: - FPS Monitoring
    private var displayLink: CADisplayLink?
    private var lastFrameTimestamp: CFTimeInterval = 0
    private var frameCount: Int = 0
    private var droppedFrameCount: Int = 0
    private var fpsHistory: [Double] = []
    private let maxFPSHistoryCount = 60  // Keep 60 seconds of data

    // MARK: - Hitch Detection
    private var hitchEvents: [Date] = []
    private let maxHitchHistoryCount = 100
    private var currentHitchStreak: Int = 0

    // MARK: - Render Time Tracking
    private var renderTimes: [String: [TimeInterval]] = [:]  // Screen name -> render times
    private var currentScreen: String?

    // MARK: - View Hierarchy Tracking
    private var hierarchyMetricsHistory: [ViewHierarchyMetrics] = []
    private let maxHierarchyHistoryCount = 50
    private var hierarchyCheckTimer: Timer?

    // MARK: - Performance Alerts
    private var alerts: [PerformanceAlert] = []
    private let maxAlertHistoryCount = 100
    private var alertCallbacks: [(PerformanceAlert) -> Void] = []

    // MARK: - State
    private var isMonitoring = false
    private var metrics = UIPerformanceMetrics()
    private let metricsLock = NSRecursiveLock()

    // MARK: - Initialization
    private init() {
        setupConfiguration()
    }

    deinit {
        stopMonitoring()
    }

    // MARK: - Configuration

    private func setupConfiguration() {
        #if DEBUG
        // More detailed monitoring in debug
        config.fpsWarningThreshold = 55.0
        config.hitchThreshold = 2
        #else
        // Production monitoring
        config.fpsWarningThreshold = 50.0
        config.hitchThreshold = 3
        #endif
    }

    // MARK: - Monitoring Control

    /// Start UI performance monitoring
    public func startMonitoring() {
        guard !isMonitoring else { return }

        logger.log(.info, "Starting UI performance monitoring")

        isMonitoring = true

        // Start FPS monitoring with CADisplayLink
        startFPSMonitoring()

        // Start view hierarchy monitoring
        startHierarchyMonitoring()

        logger.log(.info, "UI performance monitoring started")
    }

    /// Stop UI performance monitoring
    public func stopMonitoring() {
        guard isMonitoring else { return }

        logger.log(.info, "Stopping UI performance monitoring")

        stopFPSMonitoring()
        hierarchyCheckTimer?.invalidate()
        hierarchyCheckTimer = nil

        isMonitoring = false

        logger.log(.info, "UI performance monitoring stopped")
    }

    // MARK: - FPS Monitoring with CADisplayLink

    private func startFPSMonitoring() {
        displayLink = CADisplayLink(target: self, selector: #selector(displayLinkTick))
        displayLink?.add(to: .main, forMode: .common)
        lastFrameTimestamp = CACurrentMediaTime()
    }

    private func stopFPSMonitoring() {
        displayLink?.invalidate()
        displayLink = nil
    }

    @objc private func displayLinkTick(_ displayLink: CADisplayLink) {
        let currentTimestamp = displayLink.timestamp
        let elapsed = currentTimestamp - lastFrameTimestamp

        // Calculate expected frames based on display refresh rate
        let expectedFrames = Int(elapsed * config.targetFPS)
        let actualFrames = 1

        // Detect dropped frames
        let dropped = max(0, expectedFrames - actualFrames)
        if dropped > 0 {
            droppedFrameCount += dropped

            // Detect hitches (significant frame drops)
            if dropped >= config.hitchThreshold {
                detectHitch(droppedFrames: dropped)
            }
        }

        frameCount += 1

        // Calculate FPS every second
        if elapsed >= config.sampleInterval {
            let fps = Double(frameCount) / elapsed

            // Update metrics
            metricsLock.lock()
            metrics.currentFPS = fps
            metrics.totalFrames += frameCount
            metrics.droppedFrames += droppedFrameCount

            // Update FPS statistics
            let totalSamples = Double(fpsHistory.count + 1)
            metrics.averageFPS = (metrics.averageFPS * (totalSamples - 1) + fps) / totalSamples
            metrics.minFPS = min(metrics.minFPS, fps)
            metrics.maxFPS = max(metrics.maxFPS, fps)
            metricsLock.unlock()

            // Store in history
            fpsHistory.append(fps)
            if fpsHistory.count > maxFPSHistoryCount {
                fpsHistory.removeFirst()
            }

            // Check for performance issues
            if fps < config.fpsWarningThreshold {
                raiseAlert(.lowFPS, message: "FPS dropped to \(String(format: "%.1f", fps))", severity: .medium)
            }

            // Reset counters
            frameCount = 0
            droppedFrameCount = 0
            lastFrameTimestamp = currentTimestamp

            // Log performance
            logger.log(.debug, "UI Performance", metadata: [
                "fps": String(format: "%.1f", fps),
                "dropped": String(droppedFrameCount),
                "hitches": String(metrics.hitchCount)
            ])
        }
    }

    /// Get current FPS
    public func getCurrentFPS() -> Double {
        metricsLock.lock()
        defer { metricsLock.unlock() }
        return metrics.currentFPS
    }

    /// Get average FPS
    public func getAverageFPS() -> Double {
        metricsLock.lock()
        defer { metricsLock.unlock() }
        return metrics.averageFPS
    }

    /// Get FPS history for charting
    public func getFPSHistory() -> [Double] {
        return fpsHistory
    }

    // MARK: - Hitch Detection

    private func detectHitch(droppedFrames: Int) {
        metricsLock.lock()
        metrics.hitchCount += 1
        metricsLock.unlock()

        hitchEvents.append(Date())
        if hitchEvents.count > maxHitchHistoryCount {
            hitchEvents.removeFirst()
        }

        currentHitchStreak += 1

        raiseAlert(.hitch, message: "Frame hitch detected: \(droppedFrames) frames dropped", severity: .medium)

        logger.log(.warning, "Frame hitch detected", metadata: [
            "droppedFrames": String(droppedFrames),
            "hitchStreak": String(currentHitchStreak),
            "screen": currentScreen ?? "unknown"
        ])

        // Reset streak after successful frame
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.currentHitchStreak = 0
        }
    }

    /// Get recent hitch events
    public func getRecentHitches(since date: Date) -> [Date] {
        return hitchEvents.filter { $0 > date }
    }

    /// Get hitch count in last N seconds
    public func getHitchCount(inLastSeconds seconds: TimeInterval) -> Int {
        let cutoff = Date().addingTimeInterval(-seconds)
        return hitchEvents.filter { $0 > cutoff }.count
    }

    // MARK: - Render Time Measurement

    /// Track screen view and start render measurement
    public func trackScreenView(_ screenName: String) {
        currentScreen = screenName

        // Measure initial render time
        let startTime = CACurrentMediaTime()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            let renderTime = CACurrentMediaTime() - startTime
            self?.recordRenderTime(screenName, time: renderTime)
        }
    }

    private func recordRenderTime(_ screenName: String, time: TimeInterval) {
        if renderTimes[screenName] == nil {
            renderTimes[screenName] = []
        }

        renderTimes[screenName]?.append(time)

        // Keep only recent measurements
        if let count = renderTimes[screenName]?.count, count > 20 {
            renderTimes[screenName]?.removeFirst()
        }

        // Update metrics
        metricsLock.lock()
        let totalTimes = renderTimes.values.flatMap { $0 }
        if !totalTimes.isEmpty {
            metrics.averageRenderTime = totalTimes.reduce(0, +) / Double(totalTimes.count)
            metrics.maxRenderTime = totalTimes.max() ?? 0
        }
        metricsLock.unlock()

        // Alert on slow render
        if time > config.renderTimeWarning {
            raiseAlert(.slowRender, message: "Slow render on \(screenName): \(String(format: "%.3f", time))s", severity: .low)
        }

        logger.log(.debug, "Screen render time: \(screenName)", metadata: [
            "renderTime": String(format: "%.3f", time)
        ])
    }

    /// Get average render time for screen
    public func getAverageRenderTime(for screenName: String) -> TimeInterval? {
        guard let times = renderTimes[screenName], !times.isEmpty else {
            return nil
        }
        return times.reduce(0, +) / Double(times.count)
    }

    // MARK: - View Hierarchy Tracking

    private func startHierarchyMonitoring() {
        hierarchyCheckTimer = Timer.scheduledTimer(
            withTimeInterval: 5.0,  // Check every 5 seconds
            repeats: true
        ) { [weak self] _ in
            self?.checkViewHierarchy()
        }

        // Initial check
        checkViewHierarchy()
    }

    private func checkViewHierarchy() {
        guard let window = UIApplication.shared.windows.first else { return }

        let metrics = analyzeViewHierarchy(view: window)

        hierarchyMetricsHistory.append(metrics)
        if hierarchyMetricsHistory.count > maxHierarchyHistoryCount {
            hierarchyMetricsHistory.removeFirst()
        }

        // Update metrics
        metricsLock.lock()
        let avgDepth = hierarchyMetricsHistory.reduce(0) { $0 + $1.depth } / hierarchyMetricsHistory.count
        metrics.averageHierarchyDepth = avgDepth
        metrics.maxHierarchyDepth = max(metrics.maxHierarchyDepth, metrics.depth)
        metricsLock.unlock()

        // Alert on issues
        if metrics.depth > config.maxHierarchyDepth {
            raiseAlert(.deepHierarchy, message: "View hierarchy depth: \(metrics.depth)", severity: .medium)
        }

        logger.log(.debug, "View hierarchy", metadata: [
            "depth": String(metrics.depth),
            "viewCount": String(metrics.viewCount),
            "complexViews": String(metrics.complexViews),
            "healthScore": String(format: "%.1f", metrics.healthScore)
        ])
    }

    private func analyzeViewHierarchy(view: UIView, currentDepth: Int = 0) -> ViewHierarchyMetrics {
        var maxDepth = currentDepth
        var viewCount = 1
        var complexViews = 0

        // Check if view is complex (has shadows, masks, or transformations)
        if isComplexView(view) {
            complexViews += 1
        }

        // Recursively analyze subviews
        for subview in view.subviews {
            let subMetrics = analyzeViewHierarchy(view: subview, currentDepth: currentDepth + 1)
            maxDepth = max(maxDepth, subMetrics.depth)
            viewCount += subMetrics.viewCount
            complexViews += subMetrics.complexViews
        }

        return ViewHierarchyMetrics(
            depth: maxDepth,
            viewCount: viewCount,
            complexViews: complexViews,
            timestamp: Date()
        )
    }

    private func isComplexView(_ view: UIView) -> Bool {
        let layer = view.layer

        // Check for expensive rendering properties
        let hasShadow = layer.shadowOpacity > 0
        let hasMask = layer.mask != nil
        let hasTransform = !CATransform3DIsIdentity(layer.transform)
        let hasCornerRadius = layer.cornerRadius > 0 && !layer.masksToBounds
        let isRasterized = layer.shouldRasterize

        return hasShadow || hasMask || hasTransform || hasCornerRadius || isRasterized
    }

    /// Get current view hierarchy metrics
    public func getCurrentHierarchyMetrics() -> ViewHierarchyMetrics? {
        return hierarchyMetricsHistory.last
    }

    /// Get view hierarchy health score
    public func getHierarchyHealthScore() -> Double {
        guard let metrics = hierarchyMetricsHistory.last else { return 100.0 }
        return metrics.healthScore
    }

    // MARK: - Performance Alerts

    private func raiseAlert(_ type: PerformanceAlert.AlertType, message: String, severity: PerformanceAlert.Severity) {
        let alert = PerformanceAlert(type: type, message: message, timestamp: Date(), severity: severity)

        alerts.append(alert)
        if alerts.count > maxAlertHistoryCount {
            alerts.removeFirst()
        }

        // Notify callbacks
        alertCallbacks.forEach { $0(alert) }

        // Log based on severity
        switch severity {
        case .low:
            logger.log(.debug, "Performance alert: \(message)")
        case .medium:
            logger.log(.warning, "Performance alert: \(message)")
        case .high:
            logger.log(.error, "Performance alert: \(message)")
        }
    }

    /// Register callback for performance alerts
    public func onAlert(_ callback: @escaping (PerformanceAlert) -> Void) {
        alertCallbacks.append(callback)
    }

    /// Get recent alerts
    public func getRecentAlerts(count: Int = 10) -> [PerformanceAlert] {
        return Array(alerts.suffix(count))
    }

    // MARK: - Metrics & Reporting

    /// Get current UI performance metrics
    public func getMetrics() -> UIPerformanceMetrics {
        metricsLock.lock()
        defer { metricsLock.unlock() }
        return metrics
    }

    /// Reset metrics
    public func resetMetrics() {
        metricsLock.lock()
        defer { metricsLock.unlock() }

        metrics = UIPerformanceMetrics()
        fpsHistory.removeAll()
        hitchEvents.removeAll()
        renderTimes.removeAll()
        hierarchyMetricsHistory.removeAll()
        alerts.removeAll()
    }

    /// Generate automatic performance report
    public func generatePerformanceReport() -> String {
        let metrics = getMetrics()

        var report = "UI Performance Report\n"
        report += "====================\n\n"

        // FPS Analysis
        report += "Frame Rate Analysis:\n"
        report += "  Current FPS: \(String(format: "%.1f", metrics.currentFPS))\n"
        report += "  Average FPS: \(String(format: "%.1f", metrics.averageFPS))\n"
        report += "  Min FPS: \(String(format: "%.1f", metrics.minFPS))\n"
        report += "  Max FPS: \(String(format: "%.1f", metrics.maxFPS))\n"
        report += "  Target: \(config.targetFPS) FPS\n"
        report += "  Target Met: \(metrics.averageFPS >= config.fpsWarningThreshold ? "✓" : "✗")\n\n"

        // Frame Drops
        report += "Frame Performance:\n"
        report += "  Total Frames: \(metrics.totalFrames)\n"
        report += "  Dropped Frames: \(metrics.droppedFrames)\n"
        report += "  Drop Rate: \(String(format: "%.2f%%", metrics.dropRate * 100))\n"
        report += "  Hitch Count: \(metrics.hitchCount)\n"
        report += "  Hitch Rate: \(String(format: "%.2f%%", metrics.hitchRate * 100))\n\n"

        // Render Times
        report += "Render Performance:\n"
        report += "  Average Render Time: \(String(format: "%.3f", metrics.averageRenderTime))s\n"
        report += "  Max Render Time: \(String(format: "%.3f", metrics.maxRenderTime))s\n"
        report += "  Target: <\(String(format: "%.3f", config.renderTimeWarning))s\n\n"

        // View Hierarchy
        report += "View Hierarchy:\n"
        report += "  Average Depth: \(metrics.averageHierarchyDepth)\n"
        report += "  Max Depth: \(metrics.maxHierarchyDepth)\n"
        report += "  Target: <\(config.maxHierarchyDepth)\n"
        if let currentMetrics = getCurrentHierarchyMetrics() {
            report += "  Current View Count: \(currentMetrics.viewCount)\n"
            report += "  Complex Views: \(currentMetrics.complexViews)\n"
            report += "  Health Score: \(String(format: "%.1f", currentMetrics.healthScore))/100\n"
        }
        report += "\n"

        // Recent Alerts
        report += "Recent Alerts:\n"
        let recentAlerts = getRecentAlerts(count: 5)
        if recentAlerts.isEmpty {
            report += "  None\n"
        } else {
            for alert in recentAlerts {
                let severityEmoji = alert.severity == .high ? "🔴" : (alert.severity == .medium ? "🟡" : "🟢")
                report += "  \(severityEmoji) \(alert.message)\n"
            }
        }

        return report
    }

    /// Export detailed performance data for analysis
    public func exportPerformanceData() -> [String: Any] {
        let metrics = getMetrics()

        return [
            "fps": [
                "current": metrics.currentFPS,
                "average": metrics.averageFPS,
                "min": metrics.minFPS,
                "max": metrics.maxFPS,
                "history": fpsHistory
            ],
            "frames": [
                "total": metrics.totalFrames,
                "dropped": metrics.droppedFrames,
                "dropRate": metrics.dropRate
            ],
            "hitches": [
                "count": metrics.hitchCount,
                "rate": metrics.hitchRate,
                "events": hitchEvents.map { $0.timeIntervalSince1970 }
            ],
            "rendering": [
                "averageTime": metrics.averageRenderTime,
                "maxTime": metrics.maxRenderTime,
                "byScreen": renderTimes.mapValues { times in
                    times.reduce(0, +) / Double(times.count)
                }
            ],
            "hierarchy": [
                "averageDepth": metrics.averageHierarchyDepth,
                "maxDepth": metrics.maxHierarchyDepth,
                "currentHealthScore": getHierarchyHealthScore()
            ],
            "alerts": alerts.map { [
                "type": String(describing: $0.type),
                "message": $0.message,
                "timestamp": $0.timestamp.timeIntervalSince1970,
                "severity": String(describing: $0.severity)
            ]}
        ]
    }
}
