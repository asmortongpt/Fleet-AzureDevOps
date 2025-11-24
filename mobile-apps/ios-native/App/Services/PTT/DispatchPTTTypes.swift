// ============================================================================
// Fleet PTT - Protocol Types and Models (Swift)
// ============================================================================
// Swift implementation of PTT protocol types for iOS

import Foundation

// MARK: - Type Aliases

typealias ChannelId = String
typealias UserId = String

// MARK: - Floor State

enum FloorState: String, Codable {
    case idle          // Not requesting floor
    case requesting    // Floor request sent, waiting for grant
    case granted       // Floor granted, can transmit
    case denied        // Floor denied
    case transmitting  // Actively transmitting audio
    case listening     // Receiving audio from another user
}

// MARK: - Presence User

struct PresenceUser: Codable, Identifiable {
    let userId: UserId
    let displayName: String
    let unit: String?
    let status: UserStatus

    var id: String { userId }

    enum UserStatus: String, Codable {
        case online
        case talking
        case offline
    }
}

// MARK: - PTT State

struct PTTState {
    var connected: Bool
    var authenticated: Bool
    var currentChannel: ChannelId?
    var floorState: FloorState
    var hasFloor: Bool
    var isTransmitting: Bool
    var isReceiving: Bool
    var currentSpeaker: UserId?
    var presenceUsers: [PresenceUser]

    init() {
        self.connected = false
        self.authenticated = false
        self.currentChannel = nil
        self.floorState = .idle
        self.hasFloor = false
        self.isTransmitting = false
        self.isReceiving = false
        self.currentSpeaker = nil
        self.presenceUsers = []
    }
}

// MARK: - Client Events (Outbound)

enum DispatchClientEvent: Codable {
    case auth(token: String)
    case joinChannel(channelId: ChannelId)
    case leaveChannel(channelId: ChannelId)
    case requestFloor(channelId: ChannelId)
    case releaseFloor(channelId: ChannelId)
    case speaking(channelId: ChannelId, on: Bool)

    enum CodingKeys: String, CodingKey {
        case type
        case token
        case channelId
        case on
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .auth(let token):
            try container.encode("auth", forKey: .type)
            try container.encode(token, forKey: .token)

        case .joinChannel(let channelId):
            try container.encode("joinChannel", forKey: .type)
            try container.encode(channelId, forKey: .channelId)

        case .leaveChannel(let channelId):
            try container.encode("leaveChannel", forKey: .type)
            try container.encode(channelId, forKey: .channelId)

        case .requestFloor(let channelId):
            try container.encode("requestFloor", forKey: .type)
            try container.encode(channelId, forKey: .channelId)

        case .releaseFloor(let channelId):
            try container.encode("releaseFloor", forKey: .type)
            try container.encode(channelId, forKey: .channelId)

        case .speaking(let channelId, let on):
            try container.encode("speaking", forKey: .type)
            try container.encode(channelId, forKey: .channelId)
            try container.encode(on, forKey: .on)
        }
    }
}

// MARK: - Server Events (Inbound)

enum DispatchServerEvent: Codable {
    case authOk
    case authError(message: String)
    case floorGranted(channelId: ChannelId, holderUserId: UserId, expiresAt: String)
    case floorDenied(channelId: ChannelId, reason: String)
    case floorReleased(channelId: ChannelId)
    case speakerUpdate(channelId: ChannelId, userId: UserId?, on: Bool)
    case presenceUpdate(channelId: ChannelId, users: [PresenceUser])
    case error(message: String)

    enum CodingKeys: String, CodingKey {
        case type
        case message
        case channelId
        case holderUserId
        case expiresAt
        case reason
        case userId
        case on
        case users
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "authOk":
            self = .authOk

        case "authError":
            let message = try container.decode(String.self, forKey: .message)
            self = .authError(message: message)

        case "floorGranted":
            let channelId = try container.decode(ChannelId.self, forKey: .channelId)
            let holderUserId = try container.decode(UserId.self, forKey: .holderUserId)
            let expiresAt = try container.decode(String.self, forKey: .expiresAt)
            self = .floorGranted(channelId: channelId, holderUserId: holderUserId, expiresAt: expiresAt)

        case "floorDenied":
            let channelId = try container.decode(ChannelId.self, forKey: .channelId)
            let reason = try container.decode(String.self, forKey: .reason)
            self = .floorDenied(channelId: channelId, reason: reason)

        case "floorReleased":
            let channelId = try container.decode(ChannelId.self, forKey: .channelId)
            self = .floorReleased(channelId: channelId)

        case "speakerUpdate":
            let channelId = try container.decode(ChannelId.self, forKey: .channelId)
            let userId = try container.decodeIfPresent(UserId.self, forKey: .userId)
            let on = try container.decode(Bool.self, forKey: .on)
            self = .speakerUpdate(channelId: channelId, userId: userId, on: on)

        case "presenceUpdate":
            let channelId = try container.decode(ChannelId.self, forKey: .channelId)
            let users = try container.decode([PresenceUser].self, forKey: .users)
            self = .presenceUpdate(channelId: channelId, users: users)

        case "error":
            let message = try container.decode(String.self, forKey: .message)
            self = .error(message: message)

        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown event type: \(type)")
        }
    }
}

// MARK: - Configuration

struct PTTConfiguration {
    let signalingUrl: String
    let authToken: String
    let reconnect: Bool
    let reconnectMaxRetries: Int
    let reconnectDelay: TimeInterval
    let floorTimeout: TimeInterval  // Max time to hold floor (seconds)
    let debug: Bool

    init(
        signalingUrl: String,
        authToken: String,
        reconnect: Bool = true,
        reconnectMaxRetries: Int = 5,
        reconnectDelay: TimeInterval = 2.0,
        floorTimeout: TimeInterval = 30.0,
        debug: Bool = false
    ) {
        self.signalingUrl = signalingUrl
        self.authToken = authToken
        self.reconnect = reconnect
        self.reconnectMaxRetries = reconnectMaxRetries
        self.reconnectDelay = reconnectDelay
        self.floorTimeout = floorTimeout
        self.debug = debug
    }
}

// MARK: - Audio Configuration

struct AudioConfiguration {
    let sampleRate: Double
    let channelCount: Int
    let echoCancellation: Bool
    let noiseSuppression: Bool
    let autoGainControl: Bool

    static let `default` = AudioConfiguration(
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    )
}

// MARK: - WebRTC Configuration

struct WebRTCConfiguration {
    let iceServers: [ICEServer]

    struct ICEServer: Codable {
        let urls: [String]
        let username: String?
        let credential: String?
    }

    static let `default` = WebRTCConfiguration(
        iceServers: [
            ICEServer(urls: ["stun:stun.l.google.com:19302"], username: nil, credential: nil)
        ]
    )
}

// MARK: - PTT Error

enum PTTError: LocalizedError {
    case notConnected
    case notAuthenticated
    case notInChannel
    case alreadyTransmitting
    case noFloorGranted
    case webrtcError(String)
    case websocketError(String)
    case audioPermissionDenied
    case timeout
    case custom(String)

    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "Not connected to PTT server"
        case .notAuthenticated:
            return "Not authenticated"
        case .notInChannel:
            return "Not in a channel"
        case .alreadyTransmitting:
            return "Already transmitting"
        case .noFloorGranted:
            return "Floor not granted"
        case .webrtcError(let message):
            return "WebRTC error: \(message)"
        case .websocketError(let message):
            return "WebSocket error: \(message)"
        case .audioPermissionDenied:
            return "Microphone permission denied"
        case .timeout:
            return "Operation timed out"
        case .custom(let message):
            return message
        }
    }
}
