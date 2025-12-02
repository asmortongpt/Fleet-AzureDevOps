import Foundation
import UserNotifications

class DocumentReminderService {
    static let shared = DocumentReminderService()
    private init() {}

    func scheduleReminder(for document: FleetDocument, daysBefore: Int) async {
        guard let expirationDate = document.expirationDate else { return }
        
        let reminderDate = Calendar.current.date(byAdding: .day, value: -daysBefore, to: expirationDate) ?? expirationDate
        guard reminderDate > Date() else { return }
        
        await requestNotificationPermissions()
        
        let content = UNMutableNotificationContent()
        content.title = "Document Expiring Soon"
        content.body = "\(document.name) expires in \(daysBefore) day\(daysBefore == 1 ? "" : "s")"
        content.sound = .default
        
        let dateComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: reminderDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        
        let identifier = "doc_reminder_\(document.id)_\(daysBefore)"
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        try? await UNUserNotificationCenter.current().add(request)
    }

    func cancelReminder(for documentId: String, daysBefore: Int) {
        let identifier = "doc_reminder_\(documentId)_\(daysBefore)"
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }

    func checkExpiringDocuments(within days: Int = 30) async -> [FleetDocument] {
        return []
    }

    private func requestNotificationPermissions() async {
        try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
    }
}
