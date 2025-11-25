//
//  CommunicationModels.swift
//  Fleet Manager - iOS Native App
//
//  Communication models for messages, emails, and push notifications
//  Supports Teams-style messaging, email integration, and notification campaigns
//

import Foundation
import SwiftUI

// MARK: - Message Models

public struct ChatMessage: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let conversationId: String
    public let senderId: String
    public let senderName: String
    public let senderAvatar: String?
    public var content: String
    public var messageType: MessageType
    public var timestamp: Date
    public var isRead: Bool
    public var readBy: [String]
    public var attachments: [MessageAttachment]?
    public var replyTo: String?
    public var reactions: [MessageReaction]?
    public var metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case conversationId = "conversation_id"
        case senderId = "sender_id"
        case senderName = "sender_name"
        case senderAvatar = "sender_avatar"
        case content
        case messageType = "message_type"
        case timestamp
        case isRead = "is_read"
        case readBy = "read_by"
        case attachments
        case replyTo = "reply_to"
        case reactions
        case metadata
    }

    public var formattedTime: String {
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(timestamp) {
            formatter.dateFormat = "h:mm a"
        } else {
            formatter.dateFormat = "MMM d, h:mm a"
        }
        return formatter.string(from: timestamp)
    }
}

public enum MessageType: String, Codable {
    case text
    case image
    case file
    case location
    case system
}

public struct MessageAttachment: Codable, Identifiable, Equatable {
    public let id: String
    public var fileName: String
    public var fileType: String
    public var fileSize: Int64
    public var url: String
    public var thumbnailUrl: String?

    enum CodingKeys: String, CodingKey {
        case id
        case fileName = "file_name"
        case fileType = "file_type"
        case fileSize = "file_size"
        case url
        case thumbnailUrl = "thumbnail_url"
    }

    public var formattedSize: String {
        let bcf = ByteCountFormatter()
        bcf.allowedUnits = [.useKB, .useMB, .useGB]
        bcf.countStyle = .file
        return bcf.string(fromByteCount: fileSize)
    }
}

public struct MessageReaction: Codable, Identifiable, Equatable {
    public let id: String
    public var emoji: String
    public var userId: String
    public var userName: String

    enum CodingKeys: String, CodingKey {
        case id
        case emoji
        case userId = "user_id"
        case userName = "user_name"
    }
}

public struct Conversation: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var conversationType: ConversationType
    public var title: String
    public var participants: [ConversationParticipant]
    public var lastMessage: ChatMessage?
    public var unreadCount: Int
    public var isPinned: Bool
    public var isMuted: Bool
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case conversationType = "conversation_type"
        case title
        case participants
        case lastMessage = "last_message"
        case unreadCount = "unread_count"
        case isPinned = "is_pinned"
        case isMuted = "is_muted"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public enum ConversationType: String, Codable {
    case direct
    case group
    case channel
}

public struct ConversationParticipant: Codable, Identifiable, Equatable {
    public let id: String
    public var userId: String
    public var userName: String
    public var userAvatar: String?
    public var isOnline: Bool
    public var lastSeen: Date?
    public var isTyping: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case userName = "user_name"
        case userAvatar = "user_avatar"
        case isOnline = "is_online"
        case lastSeen = "last_seen"
        case isTyping = "is_typing"
    }
}

// MARK: - Email Models

public struct Email: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var from: EmailAddress
    public var to: [EmailAddress]
    public var cc: [EmailAddress]?
    public var bcc: [EmailAddress]?
    public var subject: String
    public var body: String
    public var isHtml: Bool
    public var attachments: [EmailAttachment]?
    public var status: EmailStatus
    public var folder: EmailFolder
    public var isRead: Bool
    public var isFlagged: Bool
    public var createdAt: Date
    public var sentAt: Date?
    public var replyTo: String?
    public var metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case from
        case to
        case cc
        case bcc
        case subject
        case body
        case isHtml = "is_html"
        case attachments
        case status
        case folder
        case isRead = "is_read"
        case isFlagged = "is_flagged"
        case createdAt = "created_at"
        case sentAt = "sent_at"
        case replyTo = "reply_to"
        case metadata
    }

    public var formattedDate: String {
        let formatter = DateFormatter()
        if Calendar.current.isDateInToday(createdAt) {
            formatter.dateFormat = "h:mm a"
        } else if Calendar.current.isDateInYesterday(createdAt) {
            return "Yesterday"
        } else {
            formatter.dateFormat = "MMM d"
        }
        return formatter.string(from: createdAt)
    }
}

public struct EmailAddress: Codable, Equatable {
    public var email: String
    public var name: String?

    public var displayName: String {
        name ?? email
    }
}

public struct EmailAttachment: Codable, Identifiable, Equatable {
    public let id: String
    public var fileName: String
    public var fileType: String
    public var fileSize: Int64
    public var url: String

    enum CodingKeys: String, CodingKey {
        case id
        case fileName = "file_name"
        case fileType = "file_type"
        case fileSize = "file_size"
        case url
    }

    public var formattedSize: String {
        let bcf = ByteCountFormatter()
        bcf.allowedUnits = [.useKB, .useMB, .useGB]
        bcf.countStyle = .file
        return bcf.string(fromByteCount: fileSize)
    }
}

public enum EmailStatus: String, Codable, CaseIterable {
    case draft
    case sending
    case sent
    case failed
    case scheduled

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .draft: return "doc.text"
        case .sending: return "paperplane"
        case .sent: return "paperplane.fill"
        case .failed: return "exclamationmark.triangle"
        case .scheduled: return "clock"
        }
    }
}

public enum EmailFolder: String, Codable, CaseIterable {
    case inbox
    case sent
    case drafts
    case trash
    case archive

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .inbox: return "tray.fill"
        case .sent: return "paperplane.fill"
        case .drafts: return "doc.text.fill"
        case .trash: return "trash.fill"
        case .archive: return "archivebox.fill"
        }
    }
}

public struct EmailTemplate: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var name: String
    public var subject: String
    public var body: String
    public var category: String
    public var isShared: Bool
    public var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case name
        case subject
        case body
        case category
        case isShared = "is_shared"
        case createdAt = "created_at"
    }
}

// MARK: - Push Notification Campaign Models

public struct NotificationCampaign: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var title: String
    public var message: String
    public var targetAudience: TargetAudience
    public var status: CampaignStatus
    public var scheduledFor: Date?
    public var sentAt: Date?
    public var createdAt: Date
    public var createdBy: String
    public var analytics: CampaignAnalytics?
    public var metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case title
        case message
        case targetAudience = "target_audience"
        case status
        case scheduledFor = "scheduled_for"
        case sentAt = "sent_at"
        case createdAt = "created_at"
        case createdBy = "created_by"
        case analytics
        case metadata
    }
}

public struct TargetAudience: Codable, Equatable {
    public var userIds: [String]?
    public var roles: [String]?
    public var departments: [String]?
    public var allUsers: Bool

    enum CodingKeys: String, CodingKey {
        case userIds = "user_ids"
        case roles
        case departments
        case allUsers = "all_users"
    }

    public var estimatedRecipients: Int {
        if allUsers {
            return 1000 // Placeholder
        }
        return (userIds?.count ?? 0) + ((roles?.count ?? 0) * 10) + ((departments?.count ?? 0) * 20)
    }
}

public enum CampaignStatus: String, Codable, CaseIterable {
    case draft
    case scheduled
    case sending
    case sent
    case failed
    case cancelled

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .draft: return "doc.text"
        case .scheduled: return "clock.fill"
        case .sending: return "paperplane"
        case .sent: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.triangle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }

    public var color: Color {
        switch self {
        case .draft: return .gray
        case .scheduled: return .orange
        case .sending: return .blue
        case .sent: return .green
        case .failed: return .red
        case .cancelled: return .gray
        }
    }
}

public struct CampaignAnalytics: Codable, Equatable {
    public var sent: Int
    public var delivered: Int
    public var opened: Int
    public var clicked: Int
    public var failed: Int

    enum CodingKeys: String, CodingKey {
        case sent
        case delivered
        case opened
        case clicked
        case failed
    }

    public var deliveryRate: Double {
        guard sent > 0 else { return 0 }
        return Double(delivered) / Double(sent) * 100
    }

    public var openRate: Double {
        guard delivered > 0 else { return 0 }
        return Double(opened) / Double(delivered) * 100
    }

    public var clickRate: Double {
        guard opened > 0 else { return 0 }
        return Double(clicked) / Double(opened) * 100
    }
}

public struct NotificationTemplate: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var name: String
    public var title: String
    public var message: String
    public var category: String
    public var isShared: Bool
    public var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case name
        case title
        case message
        case category
        case isShared = "is_shared"
        case createdAt = "created_at"
    }
}

// MARK: - API Response Models

public struct ConversationsResponse: Codable {
    public let conversations: [Conversation]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct MessagesResponse: Codable {
    public let messages: [ChatMessage]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct EmailsResponse: Codable {
    public let emails: [Email]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct CampaignsResponse: Codable {
    public let campaigns: [NotificationCampaign]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

// MARK: - Sample Data for Previews

extension ChatMessage {
    public static var sample: ChatMessage {
        ChatMessage(
            id: "msg-001",
            tenantId: "tenant-001",
            conversationId: "conv-001",
            senderId: "user-001",
            senderName: "John Smith",
            senderAvatar: nil,
            content: "Hey, can you check on vehicle V-123? It needs maintenance.",
            messageType: .text,
            timestamp: Date(),
            isRead: false,
            readBy: [],
            attachments: nil,
            replyTo: nil,
            reactions: nil,
            metadata: nil
        )
    }
}

extension Conversation {
    public static var sample: Conversation {
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
            lastMessage: .sample,
            unreadCount: 2,
            isPinned: false,
            isMuted: false,
            createdAt: Date().addingTimeInterval(-86400),
            updatedAt: Date()
        )
    }
}

extension Email {
    public static var sample: Email {
        Email(
            id: "email-001",
            tenantId: "tenant-001",
            from: EmailAddress(email: "manager@fleet.com", name: "Fleet Manager"),
            to: [EmailAddress(email: "driver@fleet.com", name: "Driver")],
            cc: nil,
            bcc: nil,
            subject: "Weekly Schedule Update",
            body: "Please review your schedule for next week.",
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
        )
    }
}

extension NotificationCampaign {
    public static var sample: NotificationCampaign {
        NotificationCampaign(
            id: "camp-001",
            tenantId: "tenant-001",
            title: "Maintenance Reminder",
            message: "Don't forget to schedule your vehicle maintenance this week",
            targetAudience: TargetAudience(userIds: nil, roles: ["driver"], departments: nil, allUsers: false),
            status: .sent,
            scheduledFor: nil,
            sentAt: Date(),
            createdAt: Date().addingTimeInterval(-3600),
            createdBy: "user-admin",
            analytics: CampaignAnalytics(sent: 50, delivered: 48, opened: 35, clicked: 12, failed: 2),
            metadata: nil
        )
    }
}
