import Foundation
import UIKit
import Combine

// MARK: - UI Performance Monitor
/// Monitors UI-specific performance metrics including FPS and render times
@MainActor
public class UIPerformanceMonitor: ObservableObject {

    // MARK: - Singleton
    public static let shared = UIPerformanceMonitor()

    // MARK: - Published Properties
    @Published public var currentFPS: Double = 60.0
    @Published public var averageFPS: Double = 60.0
    @Published public var isMonitoring: Bool = false

    // MARK: - Properties
    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0
    private var frameCount: Int = 0
    private var fpsValues: [Double] = []

    private let maxFPSValues = 60 // Keep last 60 FPS measurements

    // MARK: - Initialization
    private init() {}

    deinit {
        Task { @MainActor in
            stopMonitoring()
        }
    }

    // MARK: - Public Methods

    /// Start monitoring UI performance
    public func startMonitoring() {
        guard !isMonitoring else { return }

        isMonitoring = true

        displayLink = CADisplayLink(target: self, selector: #selector(displayLinkTick))
        displayLink?.add(to: .main, forMode: .common)

        print("📊 UIPerformanceMonitor: Started monitoring")
    }

    /// Stop monitoring UI performance
    public func stopMonitoring() {
        guard isMonitoring else { return }

        isMonitoring = false

        displayLink?.invalidate()
        displayLink = nil

        print("📊 UIPerformanceMonitor: Stopped monitoring")
    }

    /// Get current FPS measurement
    /// - Returns: Current frames per second
    public func getCurrentFPS() -> Double {
        return currentFPS
    }

    /// Get average FPS over recent measurements
    /// - Returns: Average frames per second
    public func getAverageFPS() -> Double {
        return averageFPS
    }

    /// Check if FPS is below acceptable threshold
    /// - Returns: True if FPS is low
    public func isPerformanceDegraded() -> Bool {
        return currentFPS < 50.0 // Below 50 FPS is considered degraded
    }

    // MARK: - Private Methods

    @objc private func displayLinkTick(_ displayLink: CADisplayLink) {
        if lastTimestamp == 0 {
            lastTimestamp = displayLink.timestamp
            return
        }

        frameCount += 1

        let elapsed = displayLink.timestamp - lastTimestamp

        // Update FPS every second
        if elapsed >= 1.0 {
            let fps = Double(frameCount) / elapsed
            currentFPS = fps
            frameCount = 0
            lastTimestamp = displayLink.timestamp

            // Store FPS value
            fpsValues.append(fps)
            if fpsValues.count > maxFPSValues {
                fpsValues.removeFirst()
            }

            // Calculate average
            averageFPS = fpsValues.reduce(0, +) / Double(fpsValues.count)

            // Alert if performance is degraded
            if isPerformanceDegraded() {
                AlertManager.shared.triggerAlert(
                    type: .performanceDegradation,
                    priority: .medium,
                    title: "Low Frame Rate",
                    message: "UI performance is degraded. Current FPS: \(Int(currentFPS))"
                )
            }
        }
    }
}
