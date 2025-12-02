//
//  CommunicationViewModel.swift
//  Fleet Manager - iOS Native App
//
//  ViewModel for Communication Center with messaging, email, and push notifications
//  Handles real-time messaging, email management, and notification campaigns
//

import Foundation
import SwiftUI
import Combine

@MainActor
class CommunicationViewModel: RefreshableViewModel {
    // MARK: - Published Properties

    // Messages
    @Published var conversations: [Conversation] = []
    @Published var selectedConversation: Conversation?
    @Published var messages: [ChatMessage] = []
    @Published var messageText: String = ""
    @Published var isTyping: Bool = false

    // Email
    @Published var emails: [Email] = []
    @Published var selectedEmail: Email?
    @Published var selectedFolder: EmailFolder = .inbox
    @Published var emailTemplates: [EmailTemplate] = []
    @Published var composeEmail: Email?
    @Published var showComposeSheet: Bool = false

    // Notifications
    @Published var campaigns: [NotificationCampaign] = []
    @Published var selectedCampaign: NotificationCampaign?
    @Published var notificationTemplates: [NotificationTemplate] = []
    @Published var showCampaignSheet: Bool = false

    // Stats
    @Published var unreadMessageCount: Int = 0
    @Published var unreadEmailCount: Int = 0

    // Filter
    @Published var messageFilter: MessageFilter = .all
    @Published var emailSearchText: String = ""

    // MARK: - Private Properties
    private var typingTimer: Timer?
    private var messageRefreshTimer: Timer?

    // MARK: - Initialization
    override init() {
        super.init()
        setupMessageRefresh()
    }

    deinit {
        stopMessageRefresh()
    }

    // MARK: - Message Management

    func loadConversations() async {
        startLoading()

        // Simulate API call
        try? await Task.sleep(nanoseconds: 500_000_000)

        // Sample conversations
        conversations = [
            Conversation(
                id: "conv-001",
                tenantId: "tenant-001",
                conversationType: .direct,
                title: "John Smith",
                participants: [
                    ConversationParticipant(
                        id: "part-001",
                        userId: "user-001",
                        userName: "John Smith",
                        userAvatar: nil,
                        isOnline: true,
                        lastSeen: Date(),
                        isTyping: false
                    )
                ],
                lastMessage: ChatMessage(
                    id: "msg-001",
                    tenantId: "tenant-001",
                    conversationId: "conv-001",
                    senderId: "user-001",
                    senderName: "John Smith",
                    senderAvatar: nil,
                    content: "Can you check vehicle V-123?",
                    messageType: .text,
                    timestamp: Date().addingTimeInterval(-300),
                    isRead: false,
                    readBy: [],
                    attachments: nil,
                    replyTo: nil,
                    reactions: nil,
                    metadata: nil
                ),
                unreadCount: 2,
                isPinned: false,
                isMuted: false,
                createdAt: Date().addingTimeInterval(-86400),
                updatedAt: Date()
            ),
            Conversation(
                id: "conv-002",
                tenantId: "tenant-001",
                conversationType: .group,
                title: "Fleet Managers",
                participants: [
                    ConversationParticipant(
                        id: "part-002",
                        userId: "user-002",
                        userName: "Jane Doe",
                        userAvatar: nil,
                        isOnline: false,
                        lastSeen: Date().addingTimeInterval(-3600),
                        isTyping: false
                    ),
                    ConversationParticipant(
                        id: "part-003",
                        userId: "user-003",
                        userName: "Mike Johnson",
                        userAvatar: nil,
                        isOnline: true,
                        lastSeen: Date(),
                        isTyping: false
                    )
                ],
                lastMessage: ChatMessage(
                    id: "msg-002",
                    tenantId: "tenant-001",
                    conversationId: "conv-002",
                    senderId: "user-002",
                    senderName: "Jane Doe",
                    senderAvatar: nil,
                    content: "Meeting at 3 PM today",
                    messageType: .text,
                    timestamp: Date().addingTimeInterval(-1800),
                    isRead: true,
                    readBy: ["current-user"],
                    attachments: nil,
                    replyTo: nil,
                    reactions: nil,
                    metadata: nil
                ),
                unreadCount: 0,
                isPinned: true,
                isMuted: false,
                createdAt: Date().addingTimeInterval(-172800),
                updatedAt: Date().addingTimeInterval(-1800)
            )
        ]

        updateUnreadCount()
        finishLoading()
    }

    func loadMessages(for conversationId: String) async {
        guard let conversation = conversations.first(where: { $0.id == conversationId }) else { return }
        selectedConversation = conversation

        startLoading()

        // Simulate API call
        try? await Task.sleep(nanoseconds: 500_000_000)

        // Sample messages
        messages = [
            ChatMessage(
                id: "msg-001",
                tenantId: "tenant-001",
                conversationId: conversationId,
                senderId: "user-001",
                senderName: "John Smith",
                senderAvatar: nil,
                content: "Can you check vehicle V-123?",
                messageType: .text,
                timestamp: Date().addingTimeInterval(-600),
                isRead: true,
                readBy: ["current-user"],
                attachments: nil,
                replyTo: nil,
                reactions: nil,
                metadata: nil
            ),
            ChatMessage(
                id: "msg-002",
                tenantId: "tenant-001",
                conversationId: conversationId,
                senderId: "current-user",
                senderName: "Me",
                senderAvatar: nil,
                content: "Sure, I'll check it right away.",
                messageType: .text,
                timestamp: Date().addingTimeInterval(-540),
                isRead: true,
                readBy: ["user-001"],
                attachments: nil,
                replyTo: "msg-001",
                reactions: nil,
                metadata: nil
            ),
            ChatMessage(
                id: "msg-003",
                tenantId: "tenant-001",
                conversationId: conversationId,
                senderId: "user-001",
                senderName: "John Smith",
                senderAvatar: nil,
                content: "It needs an oil change. Can you schedule it?",
                messageType: .text,
                timestamp: Date().addingTimeInterval(-300),
                isRead: false,
                readBy: [],
                attachments: nil,
                replyTo: nil,
                reactions: nil,
                metadata: nil
            )
        ]

        markConversationAsRead(conversationId: conversationId)
        finishLoading()
    }

    func sendMessage() async {
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let conversationId = selectedConversation?.id else { return }

        let newMessage = ChatMessage(
            id: UUID().uuidString,
            tenantId: "tenant-001",
            conversationId: conversationId,
            senderId: "current-user",
            senderName: "Me",
            senderAvatar: nil,
            content: messageText,
            messageType: .text,
            timestamp: Date(),
            isRead: false,
            readBy: [],
            attachments: nil,
            replyTo: nil,
            reactions: nil,
            metadata: nil
        )

        messages.append(newMessage)
        messageText = ""

        // Simulate API call
        try? await Task.sleep(nanoseconds: 100_000_000)

        // Update conversation last message
        if let index = conversations.firstIndex(where: { $0.id == conversationId }) {
            var updatedConversation = conversations[index]
            updatedConversation.lastMessage = newMessage
            updatedConversation.updatedAt = Date()
            conversations[index] = updatedConversation
        }
    }

    func markConversationAsRead(conversationId: String) {
        if let index = conversations.firstIndex(where: { $0.id == conversationId }) {
            conversations[index].unreadCount = 0
            updateUnreadCount()
        }
    }

    func toggleConversationPin(conversationId: String) {
        if let index = conversations.firstIndex(where: { $0.id == conversationId }) {
            conversations[index].isPinned.toggle()
        }
    }

    func deleteConversation(conversationId: String) {
        conversations.removeAll { $0.id == conversationId }
        if selectedConversation?.id == conversationId {
            selectedConversation = nil
            messages = []
        }
    }

    private func updateUnreadCount() {
        unreadMessageCount = conversations.reduce(0) { $0 + $1.unreadCount }
    }

    private func setupMessageRefresh() {
        messageRefreshTimer = Timer.scheduledTimer(withTimeInterval: 10, repeats: true) { [weak self] _ in
            Task { @MainActor in
                // Simulate checking for new messages
            }
        }
    }

    private func stopMessageRefresh() {
        messageRefreshTimer?.invalidate()
        messageRefreshTimer = nil
    }

    // MARK: - Email Management

    func loadEmails() async {
        startLoading()

        // Simulate API call
        try? await Task.sleep(nanoseconds: 500_000_000)

        // Sample emails
        emails = [
            Email(
                id: "email-001",
                tenantId: "tenant-001",
                from: EmailAddress(email: "manager@fleet.com", name: "Fleet Manager"),
                to: [EmailAddress(email: "driver@fleet.com", name: "Driver")],
                cc: nil,
                bcc: nil,
                subject: "Weekly Schedule Update",
                body: "Please review your schedule for next week.\n\nBest regards,\nFleet Manager",
                isHtml: false,
                attachments: nil,
                status: .sent,
                folder: .inbox,
                isRead: false,
                isFlagged: false,
                createdAt: Date(),
                sentAt: Date(),
                replyTo: nil,
                metadata: nil
            ),
            Email(
                id: "email-002",
                tenantId: "tenant-001",
                from: EmailAddress(email: "maintenance@fleet.com", name: "Maintenance Team"),
                to: [EmailAddress(email: "current@fleet.com", name: "Current User")],
                cc: nil,
                bcc: nil,
                subject: "Vehicle Maintenance Completed",
                body: "Vehicle V-123 maintenance has been completed. All systems checked and operational.",
                isHtml: false,
                attachments: [
                    EmailAttachment(
                        id: "att-001",
                        fileName: "maintenance_report.pdf",
                        fileType: "application/pdf",
                        fileSize: 524288,
                        url: "https://example.com/reports/maintenance.pdf"
                    )
                ],
                status: .sent,
                folder: .inbox,
                isRead: true,
                isFlagged: false,
                createdAt: Date().addingTimeInterval(-3600),
                sentAt: Date().addingTimeInterval(-3600),
                replyTo: nil,
                metadata: nil
            )
        ]

        updateEmailUnreadCount()
        finishLoading()
    }

    func loadEmailTemplates() async {
        // Simulate API call
        try? await Task.sleep(nanoseconds: 300_000_000)

        emailTemplates = [
            EmailTemplate(
                id: "template-001",
                tenantId: "tenant-001",
                name: "Maintenance Reminder",
                subject: "Vehicle Maintenance Reminder",
                body: "Dear [Driver Name],\n\nThis is a reminder that your vehicle is due for maintenance.\n\nBest regards,\nFleet Management",
                category: "Maintenance",
                isShared: true,
                createdAt: Date()
            ),
            EmailTemplate(
                id: "template-002",
                tenantId: "tenant-001",
                name: "Trip Assignment",
                subject: "New Trip Assignment",
                body: "Dear [Driver Name],\n\nYou have been assigned a new trip. Please check the app for details.\n\nBest regards,\nFleet Management",
                category: "Operations",
                isShared: true,
                createdAt: Date()
            )
        ]
    }

    func selectEmail(_ email: Email) {
        selectedEmail = email
        if !email.isRead {
            markEmailAsRead(emailId: email.id)
        }
    }

    func markEmailAsRead(emailId: String) {
        if let index = emails.firstIndex(where: { $0.id == emailId }) {
            emails[index].isRead = true
            updateEmailUnreadCount()
        }
    }

    func toggleEmailFlag(emailId: String) {
        if let index = emails.firstIndex(where: { $0.id == emailId }) {
            emails[index].isFlagged.toggle()
        }
    }

    func deleteEmail(emailId: String) {
        if let index = emails.firstIndex(where: { $0.id == emailId }) {
            emails[index].folder = .trash
        }
        if selectedEmail?.id == emailId {
            selectedEmail = nil
        }
    }

    func createNewEmail() {
        composeEmail = Email(
            id: UUID().uuidString,
            tenantId: "tenant-001",
            from: EmailAddress(email: "current@fleet.com", name: "Current User"),
            to: [],
            cc: nil,
            bcc: nil,
            subject: "",
            body: "",
            isHtml: false,
            attachments: nil,
            status: .draft,
            folder: .drafts,
            isRead: true,
            isFlagged: false,
            createdAt: Date(),
            sentAt: nil,
            replyTo: nil,
            metadata: nil
        )
        showComposeSheet = true
    }

    func sendEmail(_ email: Email) async {
        // Simulate API call
        try? await Task.sleep(nanoseconds: 500_000_000)

        var sentEmail = email
        sentEmail.status = .sent
        sentEmail.folder = .sent
        sentEmail.sentAt = Date()

        emails.append(sentEmail)
        showComposeSheet = false
        composeEmail = nil
    }

    private func updateEmailUnreadCount() {
        unreadEmailCount = emails.filter { !$0.isRead && $0.folder == .inbox }.count
    }

    // MARK: - Notification Campaign Management

    func loadCampaigns() async {
        startLoading()

        // Simulate API call
        try? await Task.sleep(nanoseconds: 500_000_000)

        campaigns = [
            NotificationCampaign(
                id: "camp-001",
                tenantId: "tenant-001",
                title: "Weekly Maintenance Reminder",
                message: "Don't forget to schedule your vehicle maintenance this week",
                targetAudience: TargetAudience(userIds: nil, roles: ["driver"], departments: nil, allUsers: false),
                status: .sent,
                scheduledFor: nil,
                sentAt: Date().addingTimeInterval(-7200),
                createdAt: Date().addingTimeInterval(-7200),
                createdBy: "user-admin",
                analytics: CampaignAnalytics(sent: 50, delivered: 48, opened: 35, clicked: 12, failed: 2),
                metadata: nil
            ),
            NotificationCampaign(
                id: "camp-002",
                tenantId: "tenant-001",
                title: "Safety Training Update",
                message: "New safety training materials are now available in the app",
                targetAudience: TargetAudience(userIds: nil, roles: nil, departments: nil, allUsers: true),
                status: .scheduled,
                scheduledFor: Date().addingTimeInterval(86400),
                sentAt: nil,
                createdAt: Date(),
                createdBy: "user-admin",
                analytics: nil,
                metadata: nil
            )
        ]

        finishLoading()
    }

    func loadNotificationTemplates() async {
        // Simulate API call
        try? await Task.sleep(nanoseconds: 300_000_000)

        notificationTemplates = [
            NotificationTemplate(
                id: "ntemplate-001",
                tenantId: "tenant-001",
                name: "Maintenance Alert",
                title: "Maintenance Required",
                message: "Your vehicle requires maintenance within [MILES] miles",
                category: "Maintenance",
                isShared: true,
                createdAt: Date()
            ),
            NotificationTemplate(
                id: "ntemplate-002",
                tenantId: "tenant-001",
                name: "Trip Assignment",
                title: "New Trip Assignment",
                message: "You have been assigned a new trip. Check the app for details.",
                category: "Operations",
                isShared: true,
                createdAt: Date()
            )
        ]
    }

    func createCampaign() {
        selectedCampaign = NotificationCampaign(
            id: UUID().uuidString,
            tenantId: "tenant-001",
            title: "",
            message: "",
            targetAudience: TargetAudience(userIds: nil, roles: nil, departments: nil, allUsers: false),
            status: .draft,
            scheduledFor: nil,
            sentAt: nil,
            createdAt: Date(),
            createdBy: "current-user",
            analytics: nil,
            metadata: nil
        )
        showCampaignSheet = true
    }

    func sendCampaign(_ campaign: NotificationCampaign) async {
        startLoading()

        // Simulate API call
        try? await Task.sleep(nanoseconds: 1_000_000_000)

        var sentCampaign = campaign
        sentCampaign.status = .sent
        sentCampaign.sentAt = Date()
        sentCampaign.analytics = CampaignAnalytics(sent: 50, delivered: 48, opened: 0, clicked: 0, failed: 2)

        if let index = campaigns.firstIndex(where: { $0.id == campaign.id }) {
            campaigns[index] = sentCampaign
        } else {
            campaigns.insert(sentCampaign, at: 0)
        }

        showCampaignSheet = false
        selectedCampaign = nil
        finishLoading()
    }

    func deleteCampaign(_ campaign: NotificationCampaign) {
        campaigns.removeAll { $0.id == campaign.id }
    }

    // MARK: - Search & Filter

    var filteredConversations: [Conversation] {
        var filtered = conversations

        switch messageFilter {
        case .all:
            break
        case .unread:
            filtered = filtered.filter { $0.unreadCount > 0 }
        case .pinned:
            filtered = filtered.filter { $0.isPinned }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter { conversation in
                conversation.title.localizedCaseInsensitiveContains(searchText) ||
                (conversation.lastMessage?.content.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        return filtered.sorted { conv1, conv2 in
            if conv1.isPinned != conv2.isPinned {
                return conv1.isPinned
            }
            return conv1.updatedAt > conv2.updatedAt
        }
    }

    var filteredEmails: [Email] {
        var filtered = emails.filter { $0.folder == selectedFolder }

        if !emailSearchText.isEmpty {
            filtered = filtered.filter { email in
                email.subject.localizedCaseInsensitiveContains(emailSearchText) ||
                email.from.displayName.localizedCaseInsensitiveContains(emailSearchText) ||
                email.body.localizedCaseInsensitiveContains(emailSearchText)
            }
        }

        return filtered.sorted { $0.createdAt > $1.createdAt }
    }

    // MARK: - Refresh
    override func refresh() async {
        startRefreshing()

        await loadConversations()
        await loadEmails()
        await loadCampaigns()

        finishRefreshing()
    }
}

// MARK: - Message Filter
enum MessageFilter: String, CaseIterable {
    case all = "All"
    case unread = "Unread"
    case pinned = "Pinned"

    var icon: String {
        switch self {
        case .all: return "tray.fill"
        case .unread: return "envelope.badge.fill"
        case .pinned: return "pin.fill"
        }
    }
}
