//
//  ChecklistService.swift
//  Fleet Manager
//
//  Service for managing checklists with location-based triggers
//  Integrates with geofencing, trip tracking, and notifications
//

import Foundation
import CoreLocation
import Combine
import UserNotifications

@MainActor
class ChecklistService: ObservableObject {
    static let shared = ChecklistService()

    @Published var templates: [ChecklistTemplate] = []
    @Published var activeChecklists: [ChecklistInstance] = []
    @Published var completedChecklists: [ChecklistInstance] = []
    @Published var pendingChecklists: [ChecklistInstance] = []

    private let locationManager: LocationManager
    private var cancellables = Set<AnyCancellable>()
    private let userDefaults = UserDefaults.standard

    init(locationManager: LocationManager = LocationManager.shared) {
        self.locationManager = locationManager
        loadTemplates()
        loadChecklists()
        setupLocationTriggers()
        setupExpirationTimer()
    }

    // MARK: - Template Management

    func loadTemplates() {
        // Load predefined templates
        templates = [] // TODO: PredefinedTemplates.allTemplates() - currently commented out

        // TODO: Load custom templates from API
        // loadCustomTemplates()
    }

    private func loadCustomTemplates() async {
        // Load from API
        // let customTemplates = try? await APIService.shared.fetchChecklistTemplates()
        // templates.append(contentsOf: customTemplates ?? [])
    }

    func createTemplate(_ template: ChecklistTemplate) async throws {
        // Save template to API
        // try await APIService.shared.createChecklistTemplate(template)
        templates.append(template)
        saveTemplatesLocally()
    }

    func updateTemplate(_ template: ChecklistTemplate) async throws {
        // Update template via API
        // try await APIService.shared.updateChecklistTemplate(template)
        if let index = templates.firstIndex(where: { $0.id == template.id }) {
            templates[index] = template
            saveTemplatesLocally()
        }
    }

    func deleteTemplate(_ id: String) async throws {
        // Delete from API
        // try await APIService.shared.deleteChecklistTemplate(id)
        templates.removeAll { $0.id == id }
        saveTemplatesLocally()
    }

    private func saveTemplatesLocally() {
        if let encoded = try? JSONEncoder().encode(templates) {
            userDefaults.set(encoded, forKey: "checklist_templates")
        }
    }

    // MARK: - Checklist Triggering

    private func setupLocationTriggers() {
        // Monitor geofence entries/exits
        NotificationCenter.default.publisher(for: .geofenceEntered)
            .sink { [weak self] notification in
                guard let geofence = notification.object as? Geofence else { return }
                Task { await self?.handleGeofenceEntry(geofence) }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .geofenceExited)
            .sink { [weak self] notification in
                guard let geofence = notification.object as? Geofence else { return }
                Task { await self?.handleGeofenceExit(geofence) }
            }
            .store(in: &cancellables)

        // Monitor trip events
        NotificationCenter.default.publisher(for: .tripStarted)
            .sink { [weak self] notification in
                guard let tripId = notification.object as? String else { return }
                Task { await self?.handleTaskStart(taskId: tripId) }
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .tripEnded)
            .sink { [weak self] notification in
                guard let tripId = notification.object as? String else { return }
                Task { await self?.handleTaskComplete(taskId: tripId) }
            }
            .store(in: &cancellables)
    }

    func handleGeofenceEntry(_ geofence: Geofence) async {
        print("📍 Geofence entry detected: \(geofence.name)")

        // Find templates with geofence entry triggers
        let matchingTemplates = templates.filter { template in
            template.triggers.contains { $0.type == .geofenceEntry && $0.isEnabled }
        }

        for template in matchingTemplates {
            await triggerChecklist(
                template: template,
                triggerType: .geofenceEntry,
                geofenceId: geofence.id,
                geofenceName: geofence.name
            )
        }
    }

    func handleGeofenceExit(_ geofence: Geofence) async {
        print("📍 Geofence exit detected: \(geofence.name)")

        let matchingTemplates = templates.filter { template in
            template.triggers.contains { $0.type == .geofenceExit && $0.isEnabled }
        }

        for template in matchingTemplates {
            await triggerChecklist(
                template: template,
                triggerType: .geofenceExit,
                geofenceId: geofence.id,
                geofenceName: geofence.name
            )
        }
    }

    func handleTaskStart(taskId: String) async {
        print("🚀 Task started: \(taskId)")

        let matchingTemplates = templates.filter { template in
            template.triggers.contains { $0.type == .taskStart && $0.isEnabled }
        }

        for template in matchingTemplates {
            await triggerChecklist(
                template: template,
                triggerType: .taskStart,
                taskId: taskId
            )
        }
    }

    func handleTaskComplete(taskId: String) async {
        print("✅ Task completed: \(taskId)")

        let matchingTemplates = templates.filter { template in
            template.triggers.contains { $0.type == .taskComplete && $0.isEnabled }
        }

        for template in matchingTemplates {
            await triggerChecklist(
                template: template,
                triggerType: .taskComplete,
                taskId: taskId
            )
        }
    }

    func handleManualTrigger(templateId: String) async {
        guard let template = templates.first(where: { $0.id == templateId }) else { return }
        await triggerChecklist(template: template, triggerType: .manual)
    }

    // MARK: - Checklist Instance Management

    func triggerChecklist(
        template: ChecklistTemplate,
        triggerType: TriggerType,
        geofenceId: String? = nil,
        geofenceName: String? = nil,
        taskId: String? = nil
    ) async {
        // Check if already triggered recently (prevent duplicates)
        let recentDuplicate = pendingChecklists.contains { checklist in
            checklist.templateId == template.id &&
            abs(checklist.triggeredAt.timeIntervalSinceNow) < 60 // Within 1 minute
        }

        guard !recentDuplicate else {
            print("⚠️ Checklist already triggered recently: \(template.name)")
            return
        }

        // Get current user info (mock for now)
        let currentUserId = "current_driver_id"
        let currentUserName = "Current Driver"

        let currentLocation = locationManager.location
        let locationCoordinate = currentLocation.map {
            Coordinate(latitude: $0.coordinate.latitude, longitude: $0.coordinate.longitude)
        }

        let instance = ChecklistInstance(
            id: UUID().uuidString,
            templateId: template.id,
            templateName: template.name,
            category: template.category,
            status: .pending,
            triggeredBy: triggerType,
            triggeredAt: Date(),
            startedAt: nil,
            completedAt: nil,
            expiresAt: template.timeoutMinutes != nil ? Date().addingTimeInterval(TimeInterval(template.timeoutMinutes! * 60)) : nil,
            driverId: currentUserId,
            driverName: currentUserName,
            vehicleId: nil,
            vehicleNumber: nil,
            locationCoordinate: locationCoordinate,
            locationName: geofenceName,
            tripId: taskId,
            taskId: taskId,
            items: template.items.map { itemTemplate in
                ChecklistItemInstance(
                    id: UUID().uuidString,
                    templateItemId: itemTemplate.id,
                    text: itemTemplate.text,
                    type: itemTemplate.type,
                    response: nil,
                    completedAt: nil,
                    isRequired: itemTemplate.isRequired,
                    validationPassed: false
                )
            },
            attachments: [],
            signature: nil,
            notes: nil,
            submittedAt: nil,
            approvedBy: nil,
            approvedAt: nil
        )

        pendingChecklists.append(instance)
        saveChecklistsLocally()

        print("✅ Checklist triggered: \(template.name)")

        // Send notification
        await sendChecklistNotification(instance)
    }

    func startChecklist(_ id: String) async {
        guard let index = pendingChecklists.firstIndex(where: { $0.id == id }) else { return }

        var checklist = pendingChecklists[index]
        checklist.status = .inProgress
        checklist.startedAt = Date()

        activeChecklists.append(checklist)
        pendingChecklists.remove(at: index)
        saveChecklistsLocally()

        print("▶️ Checklist started: \(checklist.templateName)")
    }

    func updateChecklistItem(_ checklistId: String, itemId: String, response: ChecklistResponse) async {
        guard let checklistIndex = activeChecklists.firstIndex(where: { $0.id == checklistId }),
              let itemIndex = activeChecklists[checklistIndex].items.firstIndex(where: { $0.id == itemId }) else {
            return
        }

        activeChecklists[checklistIndex].items[itemIndex].response = response
        activeChecklists[checklistIndex].items[itemIndex].completedAt = Date()
        activeChecklists[checklistIndex].items[itemIndex].validationPassed = validateResponse(
            response,
            for: activeChecklists[checklistIndex].items[itemIndex],
            template: templates.first { $0.id == activeChecklists[checklistIndex].templateId }
        )

        saveChecklistsLocally()
    }

    func completeChecklist(_ id: String, signature: Data?, notes: String?) async throws {
        guard let index = activeChecklists.firstIndex(where: { $0.id == id }) else {
            throw ChecklistError.checklistNotFound
        }

        var checklist = activeChecklists[index]

        // Validate all required items
        let allRequiredCompleted = checklist.items.filter { $0.isRequired }.allSatisfy {
            $0.response != nil && $0.validationPassed
        }

        guard allRequiredCompleted else {
            throw ChecklistError.incompleteRequiredItems
        }

        checklist.status = .completed
        checklist.completedAt = Date()
        checklist.signature = signature
        checklist.notes = notes
        checklist.submittedAt = Date()

        // Submit to API
        try await submitChecklistToAPI(checklist)

        completedChecklists.insert(checklist, at: 0)
        activeChecklists.remove(at: index)
        saveChecklistsLocally()

        print("✅ Checklist completed: \(checklist.templateName)")
    }

    func skipChecklist(_ id: String, reason: String) async throws {
        // Check in pending first
        if let index = pendingChecklists.firstIndex(where: { $0.id == id }) {
            let template = templates.first { $0.id == pendingChecklists[index].templateId }
            guard template?.allowSkip == true else {
                throw ChecklistError.skipNotAllowed
            }

            var checklist = pendingChecklists[index]
            checklist.status = .skipped
            checklist.notes = reason
            pendingChecklists.remove(at: index)
            saveChecklistsLocally()
            return
        }

        // Check in active
        if let activeIndex = activeChecklists.firstIndex(where: { $0.id == id }) {
            let template = templates.first { $0.id == activeChecklists[activeIndex].templateId }
            guard template?.allowSkip == true else {
                throw ChecklistError.skipNotAllowed
            }

            var checklist = activeChecklists[activeIndex]
            checklist.status = .skipped
            checklist.notes = reason
            activeChecklists.remove(at: activeIndex)
            saveChecklistsLocally()
        }
    }

    func addAttachment(_ checklistId: String, attachment: ChecklistAttachment) async {
        guard let index = activeChecklists.firstIndex(where: { $0.id == checklistId }) else { return }
        activeChecklists[index].attachments.append(attachment)
        saveChecklistsLocally()
    }

    // MARK: - Validation

    private func validateResponse(
        _ response: ChecklistResponse,
        for item: ChecklistItemInstance,
        template: ChecklistTemplate?
    ) -> Bool {
        guard let template = template,
              let itemTemplate = template.items.first(where: { $0.id == item.templateItemId }),
              let rules = itemTemplate.validationRules else {
            return true
        }

        switch response {
        case .text(let text):
            if let minLength = rules.minLength, text.count < minLength { return false }
            if let maxLength = rules.maxLength, text.count > maxLength { return false }
            if let pattern = rules.pattern {
                // Validate regex pattern
                let regex = try? NSRegularExpression(pattern: pattern)
                let range = NSRange(location: 0, length: text.utf16.count)
                if regex?.firstMatch(in: text, range: range) == nil { return false }
            }
            return true

        case .number(let value):
            if let min = rules.minValue, value < min { return false }
            if let max = rules.maxValue, value > max { return false }
            return true

        case .boolean, .singleChoice, .multipleChoice, .signature, .photo, .locationData, .dateTime, .barcode:
            return true
        }
    }

    // MARK: - Expiration Handling

    private func setupExpirationTimer() {
        Timer.publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.checkExpiredChecklists()
            }
            .store(in: &cancellables)
    }

    private func checkExpiredChecklists() {
        let now = Date()

        // Expire pending checklists
        pendingChecklists = pendingChecklists.compactMap { checklist in
            var mutableChecklist = checklist
            if let expiresAt = mutableChecklist.expiresAt, now > expiresAt {
                mutableChecklist.status = .expired
                print("⏰ Checklist expired: \(mutableChecklist.templateName)")
                return nil
            }
            return mutableChecklist
        }

        // Expire active checklists
        activeChecklists = activeChecklists.compactMap { checklist in
            var mutableChecklist = checklist
            if let expiresAt = mutableChecklist.expiresAt, now > expiresAt {
                mutableChecklist.status = .expired
                print("⏰ Checklist expired: \(mutableChecklist.templateName)")
                return nil
            }
            return mutableChecklist
        }

        saveChecklistsLocally()
    }

    // MARK: - Persistence

    private func loadChecklists() {
        if let data = userDefaults.data(forKey: "active_checklists"),
           let decoded = try? JSONDecoder().decode([ChecklistInstance].self, from: data) {
            activeChecklists = decoded
        }

        if let data = userDefaults.data(forKey: "pending_checklists"),
           let decoded = try? JSONDecoder().decode([ChecklistInstance].self, from: data) {
            pendingChecklists = decoded
        }

        if let data = userDefaults.data(forKey: "completed_checklists"),
           let decoded = try? JSONDecoder().decode([ChecklistInstance].self, from: data) {
            completedChecklists = decoded
        }
    }

    private func saveChecklistsLocally() {
        if let encoded = try? JSONEncoder().encode(activeChecklists) {
            userDefaults.set(encoded, forKey: "active_checklists")
        }

        if let encoded = try? JSONEncoder().encode(pendingChecklists) {
            userDefaults.set(encoded, forKey: "pending_checklists")
        }

        if let encoded = try? JSONEncoder().encode(completedChecklists) {
            userDefaults.set(encoded, forKey: "completed_checklists")
        }
    }

    // MARK: - API Integration

    private func submitChecklistToAPI(_ checklist: ChecklistInstance) async throws {
        // TODO: Implement API submission
        // try await APIService.shared.submitChecklist(checklist)
        print("📤 Checklist submitted to API: \(checklist.templateName)")
    }

    // MARK: - Notifications

    private func sendChecklistNotification(_ checklist: ChecklistInstance) async {
        let content = UNMutableNotificationContent()
        content.title = "Checklist Required"
        content.body = "\(checklist.templateName) must be completed"
        content.sound = .default
        content.categoryIdentifier = "CHECKLIST_NOTIFICATION"
        content.userInfo = ["checklistId": checklist.id]

        // Add badge
        content.badge = NSNumber(value: pendingChecklists.count)

        let request = UNNotificationRequest(
            identifier: checklist.id,
            content: content,
            trigger: nil
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
            print("🔔 Notification sent for checklist: \(checklist.templateName)")
        } catch {
            print("❌ Failed to send notification: \(error.localizedDescription)")
        }
    }

    // MARK: - Search & Filter

    func searchChecklists(_ query: String) -> [ChecklistInstance] {
        let allChecklists = completedChecklists + activeChecklists + pendingChecklists
        guard !query.isEmpty else { return allChecklists }

        return allChecklists.filter {
            $0.templateName.localizedCaseInsensitiveContains(query) ||
            $0.driverName.localizedCaseInsensitiveContains(query)
        }
    }

    func filterChecklists(by category: ChecklistCategory) -> [ChecklistInstance] {
        completedChecklists.filter { $0.category == category }
    }
}

// MARK: - Errors

enum ChecklistError: LocalizedError {
    case incompleteRequiredItems
    case skipNotAllowed
    case validationFailed
    case checklistNotFound

    var errorDescription: String? {
        switch self {
        case .incompleteRequiredItems:
            return "All required items must be completed"
        case .skipNotAllowed:
            return "This checklist cannot be skipped"
        case .validationFailed:
            return "Validation failed for one or more items"
        case .checklistNotFound:
            return "Checklist not found"
        }
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let geofenceEntered = Notification.Name("geofenceEntered")
    static let geofenceExited = Notification.Name("geofenceExited")
    static let tripStarted = Notification.Name("tripStarted")
    static let tripEnded = Notification.Name("tripEnded")
    static let checklistTriggered = Notification.Name("checklistTriggered")
    static let checklistCompleted = Notification.Name("checklistCompleted")
}
