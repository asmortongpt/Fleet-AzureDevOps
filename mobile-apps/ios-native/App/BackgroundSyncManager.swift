//
//  BackgroundSyncManager.swift
//  Fleet Manager - iOS Native App
//
//  Background sync using BGTaskScheduler for iOS 13+
//  Handles background app refresh and processing tasks
//

import Foundation
import BackgroundTasks
import Combine

// MARK: - Background Sync Manager
@available(iOS 13.0, *)
public class BackgroundSyncManager: ObservableObject {
    public static let shared = BackgroundSyncManager()

    // MARK: - Task Identifiers
    private struct TaskIdentifiers {
        static let appRefresh = "com.fleet.sync.refresh"
        static let processing = "com.fleet.sync.processing"
    }

    // MARK: - Published Properties
    @Published public private(set) var lastBackgroundSync: Date?
    @Published public private(set) var nextScheduledSync: Date?
    @Published public private(set) var backgroundSyncEnabled = true
    @Published public private(set) var backgroundSyncCount = 0

    // MARK: - Dependencies
    private let syncService = SyncService.shared
    private let networkMonitor = NetworkMonitor.shared
    private let persistence = DataPersistenceManager.shared

    // MARK: - Configuration
    private let minBackgroundInterval: TimeInterval = 15 * 60 // 15 minutes
    private let maxBackgroundDuration: TimeInterval = 30 // 30 seconds
    private let processingTaskDuration: TimeInterval = 60 // 1 minute for large syncs

    // MARK: - State Management
    private var cancellables = Set<AnyCancellable>()
    private let userDefaults = UserDefaults.standard
    private let lastSyncKey = "last_background_sync"
    private let syncCountKey = "background_sync_count"

    // MARK: - Initialization
    private init() {
        loadState()
        registerBackgroundTasks()
        setupObservers()
        scheduleNextBackgroundSync()
    }

    // MARK: - Background Task Registration

    /// Register background task handlers
    public func registerBackgroundTasks() {
        // Register app refresh task (for periodic sync)
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: TaskIdentifiers.appRefresh,
            using: nil
        ) { task in
            self.handleAppRefreshTask(task: task as! BGAppRefreshTask)
        }

        // Register processing task (for large syncs)
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: TaskIdentifiers.processing,
            using: nil
        ) { task in
            self.handleProcessingTask(task: task as! BGProcessingTask)
        }

        print("✅ Background tasks registered")
    }

    // MARK: - Task Handlers

    /// Handle app refresh task (quick sync)
    private func handleAppRefreshTask(task: BGAppRefreshTask) {
        print("🔄 Background app refresh task started")

        // Schedule next refresh
        scheduleNextBackgroundSync()

        // Set expiration handler
        task.expirationHandler = {
            print("⏰ Background refresh task expired")
            // Task will be completed with failure
        }

        // Perform sync with timeout
        Task {
            let success = await performBackgroundSync(maxDuration: maxBackgroundDuration)
            task.setTaskCompleted(success: success)

            if success {
                await MainActor.run {
                    self.lastBackgroundSync = Date()
                    self.backgroundSyncCount += 1
                    self.saveState()
                }
            }

            print("✅ Background refresh task completed: \(success)")
        }
    }

    /// Handle processing task (large sync)
    private func handleProcessingTask(task: BGProcessingTask) {
        print("🔄 Background processing task started")

        // Schedule next processing task
        scheduleProcessingTask()

        // Set expiration handler
        task.expirationHandler = {
            print("⏰ Background processing task expired")
        }

        // Perform extended sync
        Task {
            let success = await performBackgroundSync(maxDuration: processingTaskDuration)
            task.setTaskCompleted(success: success)

            if success {
                await MainActor.run {
                    self.lastBackgroundSync = Date()
                    self.backgroundSyncCount += 1
                    self.saveState()
                }
            }

            print("✅ Background processing task completed: \(success)")
        }
    }

    // MARK: - Background Sync Execution

    /// Perform background sync with time limit
    private func performBackgroundSync(maxDuration: TimeInterval) async -> Bool {
        let startTime = Date()

        // Check network connectivity
        guard networkMonitor.isConnected else {
            print("📡 No network - skipping background sync")
            return false
        }

        // Check if there's anything to sync
        let queueStats = SyncQueue.shared.getQueueStatistics()
        guard queueStats.pendingOperations > 0 else {
            print("✅ No pending operations - background sync not needed")
            return true
        }

        print("📦 Starting background sync - \(queueStats.pendingOperations) pending operations")

        // Perform sync with timeout
        let syncTask = Task {
            await syncService.startSync()
        }

        // Wait with timeout
        let deadline = Date().addingTimeInterval(maxDuration)
        while syncTask.isCancelled == false && Date() < deadline {
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

            // Check if sync completed
            if !syncService.isSyncing {
                break
            }
        }

        // Cancel if still running
        if syncTask.isCancelled == false && Date() >= deadline {
            syncTask.cancel()
            print("⏰ Background sync timed out after \(maxDuration)s")
            return false
        }

        let duration = Date().timeIntervalSince(startTime)
        print("✅ Background sync completed in \(String(format: "%.1f", duration))s")

        return true
    }

    // MARK: - Task Scheduling

    /// Schedule next background app refresh
    public func scheduleNextBackgroundSync() {
        let request = BGAppRefreshTaskRequest(identifier: TaskIdentifiers.appRefresh)
        request.earliestBeginDate = Date(timeIntervalSinceNow: minBackgroundInterval)

        do {
            try BGTaskScheduler.shared.submit(request)
            nextScheduledSync = request.earliestBeginDate
            print("📅 Scheduled next background sync for \(request.earliestBeginDate?.formatted() ?? "unknown")")
        } catch {
            print("⚠️ Failed to schedule background sync: \(error.localizedDescription)")
        }
    }

    /// Schedule processing task for large syncs
    public func scheduleProcessingTask() {
        let request = BGProcessingTaskRequest(identifier: TaskIdentifiers.processing)
        request.earliestBeginDate = Date(timeIntervalSinceNow: minBackgroundInterval)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false // Allow on battery

        do {
            try BGTaskScheduler.shared.submit(request)
            print("📅 Scheduled processing task")
        } catch {
            print("⚠️ Failed to schedule processing task: \(error.localizedDescription)")
        }
    }

    /// Cancel all scheduled background tasks
    public func cancelBackgroundTasks() {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: TaskIdentifiers.appRefresh)
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: TaskIdentifiers.processing)
        nextScheduledSync = nil
        print("❌ Cancelled all background tasks")
    }

    // MARK: - Background Sync Control

    /// Enable background sync
    public func enableBackgroundSync() {
        backgroundSyncEnabled = true
        scheduleNextBackgroundSync()
        saveState()
    }

    /// Disable background sync
    public func disableBackgroundSync() {
        backgroundSyncEnabled = false
        cancelBackgroundTasks()
        saveState()
    }

    /// Trigger immediate background sync (if in background)
    public func triggerImmediateBackgroundSync() {
        // Can only be called from app delegate when entering background
        print("🔄 Triggering immediate background sync")
        scheduleNextBackgroundSync()
    }

    // MARK: - Observers Setup

    private func setupObservers() {
        // Monitor sync completion
        syncService.syncCompleted
            .sink { [weak self] result in
                if result.success {
                    self?.lastBackgroundSync = Date()
                    self?.saveState()
                }
            }
            .store(in: &cancellables)

        // React to network changes
        networkMonitor.connectivityPublisher
            .sink { [weak self] isConnected in
                if isConnected && self?.backgroundSyncEnabled == true {
                    // Network restored - schedule sync
                    self?.scheduleNextBackgroundSync()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - State Persistence

    private func saveState() {
        if let lastSync = lastBackgroundSync {
            userDefaults.set(lastSync, forKey: lastSyncKey)
        }
        userDefaults.set(backgroundSyncCount, forKey: syncCountKey)
        userDefaults.synchronize()
    }

    private func loadState() {
        lastBackgroundSync = userDefaults.object(forKey: lastSyncKey) as? Date
        backgroundSyncCount = userDefaults.integer(forKey: syncCountKey)
    }

    // MARK: - Statistics

    public func getBackgroundSyncStatistics() -> BackgroundSyncStatistics {
        return BackgroundSyncStatistics(
            lastSync: lastBackgroundSync,
            nextScheduledSync: nextScheduledSync,
            totalSyncs: backgroundSyncCount,
            isEnabled: backgroundSyncEnabled,
            averageInterval: calculateAverageInterval()
        )
    }

    private func calculateAverageInterval() -> TimeInterval? {
        guard let lastSync = lastBackgroundSync, backgroundSyncCount > 0 else {
            return nil
        }

        let timeSinceFirst = Date().timeIntervalSince(lastSync)
        return timeSinceFirst / Double(backgroundSyncCount)
    }

    // MARK: - App Lifecycle Integration

    /// Call when app enters background
    public func applicationDidEnterBackground() {
        print("📱 App entered background - scheduling sync")

        // Schedule background tasks if enabled
        if backgroundSyncEnabled {
            scheduleNextBackgroundSync()

            // Schedule processing task if there's a large queue
            let queueStats = SyncQueue.shared.getQueueStatistics()
            if queueStats.pendingOperations > 50 {
                scheduleProcessingTask()
            }
        }
    }

    /// Call when app enters foreground
    public func applicationWillEnterForeground() {
        print("📱 App entered foreground")

        // Update state
        loadState()

        // Check if sync is needed
        if let lastSync = lastBackgroundSync {
            let timeSinceLastSync = Date().timeIntervalSince(lastSync)
            if timeSinceLastSync > minBackgroundInterval {
                print("🔄 Last sync was \(Int(timeSinceLastSync / 60)) minutes ago - triggering sync")
                Task {
                    await syncService.startSync()
                }
            }
        }
    }

    /// Call when app terminates
    public func applicationWillTerminate() {
        print("📱 App terminating - saving state")
        saveState()
    }
}

// MARK: - Background Sync Statistics
public struct BackgroundSyncStatistics {
    public let lastSync: Date?
    public let nextScheduledSync: Date?
    public let totalSyncs: Int
    public let isEnabled: Bool
    public let averageInterval: TimeInterval?

    public var formattedLastSync: String {
        guard let lastSync = lastSync else { return "Never" }
        let formatter = RelativeDateTimeFormatter()
        return formatter.localizedString(for: lastSync, relativeTo: Date())
    }

    public var formattedNextSync: String {
        guard let nextSync = nextScheduledSync else { return "Not scheduled" }
        let formatter = RelativeDateTimeFormatter()
        return formatter.localizedString(for: nextSync, relativeTo: Date())
    }

    public var formattedAverageInterval: String {
        guard let interval = averageInterval else { return "N/A" }

        let hours = Int(interval) / 3600
        let minutes = (Int(interval) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - App Delegate Integration Helper
@available(iOS 13.0, *)
public extension BackgroundSyncManager {
    /// Helper to register tasks in AppDelegate
    static func registerInAppDelegate() {
        shared.registerBackgroundTasks()
    }

    /// Helper for SceneDelegate/AppDelegate lifecycle events
    static func handleBackgroundEntry() {
        shared.applicationDidEnterBackground()
    }

    static func handleForegroundEntry() {
        shared.applicationWillEnterForeground()
    }

    static func handleTermination() {
        shared.applicationWillTerminate()
    }
}

// MARK: - Info.plist Configuration Helper
/*
 To enable background sync, add these entries to Info.plist:

 <key>BGTaskSchedulerPermittedIdentifiers</key>
 <array>
     <string>com.fleet.sync.refresh</string>
     <string>com.fleet.sync.processing</string>
 </array>

 <key>UIBackgroundModes</key>
 <array>
     <string>fetch</string>
     <string>processing</string>
 </array>

 Then in AppDelegate:

 func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
     if #available(iOS 13.0, *) {
         BackgroundSyncManager.registerInAppDelegate()
     }
     return true
 }

 func applicationDidEnterBackground(_ application: UIApplication) {
     if #available(iOS 13.0, *) {
         BackgroundSyncManager.handleBackgroundEntry()
     }
 }

 func applicationWillEnterForeground(_ application: UIApplication) {
     if #available(iOS 13.0, *) {
         BackgroundSyncManager.handleForegroundEntry()
     }
 }

 func applicationWillTerminate(_ application: UIApplication) {
     if #available(iOS 13.0, *) {
         BackgroundSyncManager.handleTermination()
     }
 }
 */
