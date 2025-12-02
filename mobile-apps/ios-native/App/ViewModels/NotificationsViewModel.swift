//
//  NotificationsViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for managing in-app notifications
//  Handles notification CRUD, filtering, grouping, and push notification integration
//

import Foundation
import Combine
import SwiftUI
import UserNotifications

@MainActor
class NotificationsViewModel: RefreshableViewModel {

    // MARK: - Published Properties
    @Published var notifications: [AppNotification] = []
    @Published var filteredNotifications: [AppNotification] = []
    @Published var groupedNotifications: [NotificationGroup] = []
    @Published var selectedFilter: NotificationFilter = .all
    @Published var selectedNotification: AppNotification?
    @Published var preferences: NotificationPreferences = .default

    // Statistics
    @Published var totalCount: Int = 0
    @Published var unreadCount: Int = 0
    @Published var urgentCount: Int = 0
    @Published var flaggedCount: Int = 0

    // UI State
    @Published var showingPreferences = false
    @Published var showingDeleteAlert = false
    @Published var notificationToDelete: AppNotification?

    // MARK: - Dependencies
    private let apiConfig: APIConfiguration
    private let pushManager: PushNotificationManager
    private var cacheKey = "notifications_cache"
    private var preferencesKey = "notification_preferences"

    // MARK: - Initialization
    override init() {
        self.apiConfig = APIConfiguration.shared
        self.pushManager = PushNotificationManager.shared
        super.init()
        loadCachedData()
        loadPreferences()
        setupNotificationObservers()
    }

    // MARK: - Setup

    /// Setup notification observers for push notifications
    private func setupNotificationObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePushNotification(_:)),
            name: .messageReceived,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePushNotification(_:)),
            name: .maintenanceReminderReceived,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePushNotification(_:)),
            name: .vehicleAlertReceived,
            object: nil
        )
    }

    @objc private func handlePushNotification(_ notification: Notification) {
        Task {
            await loadNotifications()
        }
    }

    // MARK: - Data Loading

    /// Load notifications from API
    func loadNotifications() async {
        startLoading()

        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications")!
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                throw NetworkError.statusCode(httpResponse.statusCode)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let notificationsResponse = try decoder.decode(NotificationsResponse.self, from: data)

            await MainActor.run {
                self.notifications = notificationsResponse.notifications
                self.totalCount = notificationsResponse.total
                self.unreadCount = notificationsResponse.unreadCount
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
                self.updateBadgeCount()
                self.finishLoading()
            }

        } catch {
            await MainActor.run {
                self.handleError(error)
            }
        }
    }

    /// Refresh data from API
    override func refresh() async {
        startRefreshing()
        await loadNotifications()
        finishRefreshing()
    }

    // MARK: - CRUD Operations

    /// Mark notification as read
    func markAsRead(_ notification: AppNotification) async -> Bool {
        guard !notification.isRead else { return true }

        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications/\(notification.id)/read")!
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return false
            }

            await MainActor.run {
                if let index = self.notifications.firstIndex(where: { $0.id == notification.id }) {
                    self.notifications[index].isRead = true
                }
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
                self.updateBadgeCount()
            }

            return true

        } catch {
            print("Error marking notification as read: \(error)")
            return false
        }
    }

    /// Mark all notifications as read
    func markAllAsRead() async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications/read-all")!
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return false
            }

            await MainActor.run {
                for index in self.notifications.indices {
                    self.notifications[index].isRead = true
                }
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
                self.updateBadgeCount()
            }

            return true

        } catch {
            print("Error marking all as read: \(error)")
            return false
        }
    }

    /// Toggle flag status
    func toggleFlag(_ notification: AppNotification) async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications/\(notification.id)/flag")!
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let body: [String: Bool] = ["is_flagged": !notification.isFlagged]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return false
            }

            await MainActor.run {
                if let index = self.notifications.firstIndex(where: { $0.id == notification.id }) {
                    self.notifications[index].isFlagged.toggle()
                }
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
            }

            return true

        } catch {
            print("Error toggling flag: \(error)")
            return false
        }
    }

    /// Delete notification
    func deleteNotification(_ notification: AppNotification) async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications/\(notification.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
                return false
            }

            await MainActor.run {
                self.notifications.removeAll { $0.id == notification.id }
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
                self.updateBadgeCount()
            }

            return true

        } catch {
            print("Error deleting notification: \(error)")
            return false
        }
    }

    /// Delete all read notifications
    func deleteAllRead() async -> Bool {
        do {
            let url = URL(string: "\(apiConfig.baseURL)/api/notifications/delete-read")!
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
                return false
            }

            await MainActor.run {
                self.notifications.removeAll { $0.isRead }
                self.updateStatistics()
                self.applyFiltersAndGroup()
                self.cacheNotifications()
                self.updateBadgeCount()
            }

            return true

        } catch {
            print("Error deleting read notifications: \(error)")
            return false
        }
    }

    // MARK: - Filtering & Grouping

    /// Apply current filters and group notifications
    func applyFiltersAndGroup() {
        var result = notifications

        // Apply filter
        result = result.filter { selectedFilter.applies(to: $0) }

        // Apply search
        if !searchText.isEmpty {
            result = result.filter { notification in
                notification.title.localizedCaseInsensitiveContains(searchText) ||
                notification.message.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Apply preferences
        result = result.filter { notification in
            preferences.enabledCategories.contains(notification.category) &&
            !preferences.mutedTypes.contains(notification.type) &&
            notification.priority.rawValue >= preferences.minimumPriority.rawValue
        }

        // Sort by timestamp (newest first)
        result.sort { $0.timestamp > $1.timestamp }

        filteredNotifications = result

        // Group notifications
        if preferences.groupByCategory {
            groupByCategory()
        } else {
            groupByDate()
        }
    }

    /// Group notifications by date
    private func groupByDate() {
        let calendar = Calendar.current

        var todayNotifications: [AppNotification] = []
        var yesterdayNotifications: [AppNotification] = []
        var thisWeekNotifications: [AppNotification] = []
        var olderNotifications: [AppNotification] = []

        for notification in filteredNotifications {
            if calendar.isDateInToday(notification.timestamp) {
                todayNotifications.append(notification)
            } else if calendar.isDateInYesterday(notification.timestamp) {
                yesterdayNotifications.append(notification)
            } else if calendar.isDate(notification.timestamp, equalTo: Date(), toGranularity: .weekOfYear) {
                thisWeekNotifications.append(notification)
            } else {
                olderNotifications.append(notification)
            }
        }

        groupedNotifications = []

        if !todayNotifications.isEmpty {
            groupedNotifications.append(NotificationGroup(
                id: "today",
                title: "Today",
                notifications: todayNotifications,
                isExpanded: true
            ))
        }

        if !yesterdayNotifications.isEmpty {
            groupedNotifications.append(NotificationGroup(
                id: "yesterday",
                title: "Yesterday",
                notifications: yesterdayNotifications,
                isExpanded: true
            ))
        }

        if !thisWeekNotifications.isEmpty {
            groupedNotifications.append(NotificationGroup(
                id: "this-week",
                title: "This Week",
                notifications: thisWeekNotifications,
                isExpanded: false
            ))
        }

        if !olderNotifications.isEmpty {
            groupedNotifications.append(NotificationGroup(
                id: "older",
                title: "Older",
                notifications: olderNotifications,
                isExpanded: false
            ))
        }
    }

    /// Group notifications by category
    private func groupByCategory() {
        var categoryGroups: [NotificationCategory: [AppNotification]] = [:]

        for notification in filteredNotifications {
            categoryGroups[notification.category, default: []].append(notification)
        }

        groupedNotifications = categoryGroups.map { category, notifications in
            NotificationGroup(
                id: category.rawValue,
                title: category.displayName,
                notifications: notifications.sorted { $0.timestamp > $1.timestamp },
                isExpanded: true
            )
        }.sorted { $0.notifications.count > $1.notifications.count }
    }

    override func performSearch() {
        applyFiltersAndGroup()
    }

    // MARK: - Statistics

    /// Update notification statistics
    private func updateStatistics() {
        totalCount = notifications.count
        unreadCount = notifications.filter { !$0.isRead }.count
        urgentCount = notifications.filter { $0.priority == .urgent }.count
        flaggedCount = notifications.filter { $0.isFlagged }.count
    }

    // MARK: - Badge Management

    /// Update app badge count
    private func updateBadgeCount() {
        if preferences.showBadges {
            pushManager.setBadgeCount(unreadCount)
        }
    }

    /// Clear badge count
    func clearBadge() {
        pushManager.clearBadge()
    }

    // MARK: - Preferences

    /// Load notification preferences
    private func loadPreferences() {
        guard let data = UserDefaults.standard.data(forKey: preferencesKey) else { return }

        do {
            let decoder = JSONDecoder()
            preferences = try decoder.decode(NotificationPreferences.self, from: data)
        } catch {
            print("Failed to load preferences: \(error)")
        }
    }

    /// Save notification preferences
    func savePreferences() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(preferences)
            UserDefaults.standard.set(data, forKey: preferencesKey)
            applyFiltersAndGroup()
        } catch {
            print("Failed to save preferences: \(error)")
        }
    }

    /// Reset preferences to default
    func resetPreferences() {
        preferences = .default
        savePreferences()
    }

    // MARK: - Caching

    /// Cache notifications to local storage
    private func cacheNotifications() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(notifications)
            UserDefaults.standard.set(data, forKey: cacheKey)
        } catch {
            print("Failed to cache notifications: \(error)")
        }
    }

    /// Load cached notifications
    private func loadCachedData() {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            notifications = try decoder.decode([AppNotification].self, from: data)
            updateStatistics()
            applyFiltersAndGroup()
        } catch {
            print("Failed to load cached notifications: \(error)")
        }
    }

    /// Clear cache
    func clearCache() {
        UserDefaults.standard.removeObject(forKey: cacheKey)
        super.clearCache()
    }

    // MARK: - Actions

    /// Handle notification action
    func handleAction(_ action: NotificationAction, for notification: AppNotification) {
        // Mark as read when action is taken
        Task {
            _ = await markAsRead(notification)
        }

        // Handle deep link if present
        if let deepLink = action.deepLink {
            handleDeepLink(deepLink)
        }
    }

    /// Handle deep link navigation
    private func handleDeepLink(_ deepLink: String) {
        guard let url = URL(string: deepLink) else { return }

        NotificationCenter.default.post(
            name: .handleDeepLink,
            object: nil,
            userInfo: ["url": url]
        )
    }

    // MARK: - Utility Methods

    /// Get notifications by type
    func getNotifications(ofType type: NotificationType) -> [AppNotification] {
        notifications.filter { $0.type == type }
    }

    /// Get notifications by category
    func getNotifications(inCategory category: NotificationCategory) -> [AppNotification] {
        notifications.filter { $0.category == category }
    }

    /// Get notifications by priority
    func getNotifications(withPriority priority: NotificationPriority) -> [AppNotification] {
        notifications.filter { $0.priority == priority }
    }

    /// Check if there are unread urgent notifications
    var hasUnreadUrgent: Bool {
        notifications.contains { !$0.isRead && $0.priority == .urgent }
    }
}

// MARK: - Network Error
enum NetworkError: Error {
    case invalidResponse
    case statusCode(Int)
    case decodingError
}
