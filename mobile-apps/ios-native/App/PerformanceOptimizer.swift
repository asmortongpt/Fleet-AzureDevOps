import Foundation
import UIKit

// MARK: - Performance Optimizer
/// Optimizes app performance based on device capabilities and current state
@MainActor
public class PerformanceOptimizer: ObservableObject {

    // MARK: - Singleton
    public static let shared = PerformanceOptimizer()

    // MARK: - Published Properties
    @Published public var isLowPowerModeEnabled: Bool = false
    @Published public var currentThermalState: ProcessInfo.ThermalState = .nominal

    // MARK: - Properties
    private var thermalStateObserver: NSObjectProtocol?
    private var lowPowerModeObserver: NSObjectProtocol?

    // Performance settings
    private var reduceAnimations: Bool = false
    private var reduceQuality: Bool = false

    // MARK: - Initialization
    private init() {
        setupObservers()
        updateLowPowerMode()
        updateThermalState()
    }

    deinit {
        Task { @MainActor in
            removeObservers()
        }
    }

    // MARK: - Public Methods

    /// Check if animations should be reduced
    /// - Returns: True if animations should be reduced
    public func shouldReduceAnimations() -> Bool {
        return isLowPowerModeEnabled || currentThermalState == .critical || reduceAnimations
    }

    /// Check if quality should be reduced
    /// - Returns: True if quality should be reduced
    public func shouldReduceQuality() -> Bool {
        return isLowPowerModeEnabled || currentThermalState == .serious || currentThermalState == .critical || reduceQuality
    }

    /// Get recommended image quality
    /// - Returns: Quality value between 0.0 and 1.0
    public func getRecommendedImageQuality() -> CGFloat {
        if shouldReduceQuality() {
            return 0.6
        } else {
            return 0.9
        }
    }

    /// Get recommended frame rate for animations
    /// - Returns: Frames per second
    public func getRecommendedFrameRate() -> Int {
        if shouldReduceAnimations() {
            return 30
        } else {
            return 60
        }
    }

    /// Get recommended batch size for operations
    /// - Returns: Batch size
    public func getRecommendedBatchSize() -> Int {
        if shouldReduceQuality() {
            return 25
        } else {
            return 50
        }
    }

    /// Enable manual performance reduction
    public func enablePerformanceReduction() {
        reduceAnimations = true
        reduceQuality = true
        print("⚡ PerformanceOptimizer: Performance reduction enabled")
    }

    /// Disable manual performance reduction
    public func disablePerformanceReduction() {
        reduceAnimations = false
        reduceQuality = false
        print("⚡ PerformanceOptimizer: Performance reduction disabled")
    }

    // MARK: - Private Methods

    private func setupObservers() {
        // Observe low power mode changes
        lowPowerModeObserver = NotificationCenter.default.addObserver(
            forName: .NSProcessInfoPowerStateDidChange,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateLowPowerMode()
            }
        }

        // Observe thermal state changes
        thermalStateObserver = NotificationCenter.default.addObserver(
            forName: ProcessInfo.thermalStateDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateThermalState()
            }
        }
    }

    private func removeObservers() {
        if let observer = lowPowerModeObserver {
            NotificationCenter.default.removeObserver(observer)
        }

        if let observer = thermalStateObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    private func updateLowPowerMode() {
        isLowPowerModeEnabled = ProcessInfo.processInfo.isLowPowerModeEnabled

        if isLowPowerModeEnabled {
            print("⚡ PerformanceOptimizer: Low Power Mode enabled")
            AlertManager.shared.triggerAlert(
                type: .performanceDegradation,
                priority: .low,
                title: "Low Power Mode",
                message: "Some features may be limited to preserve battery."
            )
        }
    }

    private func updateThermalState() {
        currentThermalState = ProcessInfo.processInfo.thermalState

        switch currentThermalState {
        case .serious:
            print("⚡ PerformanceOptimizer: Thermal state SERIOUS")
            AlertManager.shared.triggerAlert(
                type: .thermalStateWarning,
                priority: .high,
                title: "Device Temperature High",
                message: "Performance may be reduced to cool down the device."
            )

        case .critical:
            print("⚡ PerformanceOptimizer: Thermal state CRITICAL")
            AlertManager.shared.triggerAlert(
                type: .thermalStateWarning,
                priority: .critical,
                title: "Device Overheating",
                message: "Critical temperature reached. App performance will be significantly reduced."
            )

        default:
            break
        }
    }
}
