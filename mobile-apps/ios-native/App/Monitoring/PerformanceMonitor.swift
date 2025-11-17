import Foundation
import UIKit
import Combine

// MARK: - Performance Monitor
/// Monitors app performance metrics including CPU, memory, network, and battery usage
/// Integrates with AlertManager for performance degradation alerts
@MainActor
public class PerformanceMonitor: ObservableObject {

    // MARK: - Singleton
    public static let shared = PerformanceMonitor()

    // MARK: - Published Properties
    @Published public var cpuUsage: Double = 0.0
    @Published public var memoryUsage: Double = 0.0
    @Published public var batteryLevel: Double = 0.0
    @Published public var networkLatency: TimeInterval = 0.0
    @Published public var isMonitoring: Bool = false

    // MARK: - Properties
    private var monitoringTimer: Timer?
    private let monitoringInterval: TimeInterval = 5.0 // Monitor every 5 seconds
    private var cancellables = Set<AnyCancellable>()

    // Performance thresholds
    private let cpuThreshold: Double = 80.0 // 80% CPU usage
    private let memoryThreshold: Double = 80.0 // 80% memory usage
    private let batteryLowThreshold: Double = 20.0 // 20% battery

    // MARK: - Initialization
    private init() {
        setupNotificationObservers()
    }

    deinit {
        Task { @MainActor in
            stopMonitoring()
        }
    }

    // MARK: - Public Methods

    /// Start performance monitoring
    public func startMonitoring() {
        guard !isMonitoring else { return }

        isMonitoring = true

        // Start monitoring timer
        monitoringTimer = Timer.scheduledTimer(
            withTimeInterval: monitoringInterval,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateMetrics()
            }
        }

        // Perform initial update
        updateMetrics()

        print("📊 PerformanceMonitor: Started monitoring")
    }

    /// Stop performance monitoring
    public func stopMonitoring() {
        guard isMonitoring else { return }

        isMonitoring = false
        monitoringTimer?.invalidate()
        monitoringTimer = nil

        print("📊 PerformanceMonitor: Stopped monitoring")
    }

    /// Get current performance snapshot
    public func getPerformanceSnapshot() -> PerformanceSnapshot {
        return PerformanceSnapshot(
            cpuUsage: cpuUsage,
            memoryUsage: memoryUsage,
            batteryLevel: batteryLevel,
            networkLatency: networkLatency,
            timestamp: Date()
        )
    }

    // MARK: - Private Methods

    private func setupNotificationObservers() {
        // Observe memory warnings
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )

        // Observe thermal state changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleThermalStateChange),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
    }

    @objc private func handleMemoryWarning() {
        Task { @MainActor in
            AlertManager.shared.triggerAlert(
                type: .memoryWarning,
                priority: .high,
                title: "Memory Warning",
                message: "The app is using excessive memory. Some data may be cleared to free resources."
            )
        }
    }

    @objc private func handleThermalStateChange() {
        Task { @MainActor in
            let thermalState = ProcessInfo.processInfo.thermalState

            switch thermalState {
            case .serious, .critical:
                AlertManager.shared.triggerAlert(
                    type: .thermalStateWarning,
                    priority: .critical,
                    title: "Device Overheating",
                    message: "Device temperature is too high. Performance may be reduced."
                )
            default:
                break
            }
        }
    }

    private func updateMetrics() {
        // Update CPU usage
        cpuUsage = measureCPUUsage()

        // Update memory usage
        memoryUsage = measureMemoryUsage()

        // Update battery level
        batteryLevel = measureBatteryLevel()

        // Check for performance issues
        checkPerformanceThresholds()
    }

    private func measureCPUUsage() -> Double {
        var totalUsage: Double = 0.0
        var threadsList: thread_act_array_t?
        var threadsCount: mach_msg_type_number_t = 0

        let task = mach_task_self_

        guard task_threads(task, &threadsList, &threadsCount) == KERN_SUCCESS,
              let threads = threadsList else {
            return 0.0
        }

        for index in 0..<Int(threadsCount) {
            var threadInfo = thread_basic_info()
            var threadInfoCount = mach_msg_type_number_t(THREAD_INFO_MAX)

            let infoPointer = withUnsafeMutablePointer(to: &threadInfo) {
                $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                    UnsafeMutablePointer<integer_t>($0)
                }
            }

            let result = thread_info(
                threads[index],
                thread_flavor_t(THREAD_BASIC_INFO),
                infoPointer,
                &threadInfoCount
            )

            if result == KERN_SUCCESS {
                let cpuUsagePercent = Double(threadInfo.cpu_usage) / Double(TH_USAGE_SCALE) * 100.0
                totalUsage += cpuUsagePercent
            }
        }

        vm_deallocate(
            mach_task_self_,
            vm_address_t(bitPattern: threads),
            vm_size_t(Int(threadsCount) * MemoryLayout<thread_t>.stride)
        )

        return totalUsage
    }

    private func measureMemoryUsage() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(
                    mach_task_self_,
                    task_flavor_t(MACH_TASK_BASIC_INFO),
                    $0,
                    &count
                )
            }
        }

        guard result == KERN_SUCCESS else {
            return 0.0
        }

        let usedBytes = Double(info.resident_size)
        let totalBytes = Double(ProcessInfo.processInfo.physicalMemory)

        return (usedBytes / totalBytes) * 100.0
    }

    private func measureBatteryLevel() -> Double {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let level = UIDevice.current.batteryLevel

        // batteryLevel returns -1.0 if battery state is unknown
        if level < 0 {
            return 100.0 // Assume full battery if unknown
        }

        return Double(level) * 100.0
    }

    private func checkPerformanceThresholds() {
        // Check CPU usage
        if cpuUsage > cpuThreshold {
            AlertManager.shared.triggerAlert(
                type: .performanceDegradation,
                priority: .high,
                title: "High CPU Usage",
                message: "CPU usage is at \(Int(cpuUsage))%. App performance may be affected."
            )
        }

        // Check memory usage
        if memoryUsage > memoryThreshold {
            AlertManager.shared.triggerAlert(
                type: .performanceDegradation,
                priority: .high,
                title: "High Memory Usage",
                message: "Memory usage is at \(Int(memoryUsage))%. App may slow down."
            )
        }

        // Check battery level
        if batteryLevel < batteryLowThreshold && batteryLevel > 0 {
            AlertManager.shared.triggerAlert(
                type: .performanceDegradation,
                priority: .medium,
                title: "Low Battery",
                message: "Battery level is at \(Int(batteryLevel))%. Consider charging your device."
            )
        }
    }
}

// MARK: - Performance Snapshot
public struct PerformanceSnapshot: Codable {
    public let cpuUsage: Double
    public let memoryUsage: Double
    public let batteryLevel: Double
    public let networkLatency: TimeInterval
    public let timestamp: Date

    public init(cpuUsage: Double, memoryUsage: Double, batteryLevel: Double, networkLatency: TimeInterval, timestamp: Date) {
        self.cpuUsage = cpuUsage
        self.memoryUsage = memoryUsage
        self.batteryLevel = batteryLevel
        self.networkLatency = networkLatency
        self.timestamp = timestamp
    }
}
