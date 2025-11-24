// ============================================================================
// Fleet PTT - Push-To-Talk Panel (SwiftUI)
// ============================================================================
// Channel selector and presence roster UI

import SwiftUI

struct PushToTalkPanel: View {
    // MARK: - Properties

    @StateObject private var viewModel: PushToTalkViewModel

    // MARK: - Initialization

    init(signalingUrl: String, token: String, defaultChannelId: String? = nil) {
        _viewModel = StateObject(wrappedValue: PushToTalkViewModel(
            signalingUrl: signalingUrl,
            token: token,
            defaultChannelId: defaultChannelId
        ))
    }

    // MARK: - Body

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            // Channel info
            if let channel = viewModel.currentChannel {
                channelInfo(channel: channel)
            }

            // PTT Button
            buttonContainer

            // Presence Roster
            if !viewModel.presenceUsers.isEmpty {
                presenceSection
            }

            // Error display
            if let error = viewModel.error {
                errorView(message: error)
            }

            Spacer()
        }
        .background(Color(UIColor.systemGroupedBackground))
        .onAppear {
            viewModel.connect()
        }
        .onDisappear {
            viewModel.disconnect()
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Push-To-Talk")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(Color(UIColor.label))

            Spacer()

            // Connection status indicator
            Circle()
                .fill(viewModel.connected ? Color.green : Color.red)
                .frame(width: 12, height: 12)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(Color(UIColor.systemBackground))
        .overlay(
            Rectangle()
                .fill(Color(UIColor.separator))
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Channel Info

    private func channelInfo(channel: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Channel: \(channel)")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(UIColor.label))

            Text("\(viewModel.presenceUsers.count) users online")
                .font(.system(size: 14))
                .foregroundColor(Color(UIColor.secondaryLabel))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .overlay(
            Rectangle()
                .fill(Color(UIColor.separator))
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Button Container

    private var buttonContainer: some View {
        VStack {
            PushToTalkButton(
                floorState: viewModel.floorState,
                isTransmitting: viewModel.isTransmitting,
                currentSpeaker: viewModel.currentSpeaker,
                connected: viewModel.connected,
                onPressIn: {
                    await viewModel.handlePressIn()
                },
                onPressOut: {
                    viewModel.handlePressOut()
                },
                size: 140
            )
        }
        .padding(.vertical, 40)
    }

    // MARK: - Presence Section

    private var presenceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active Users")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Color(UIColor.label))
                .padding(.horizontal, 20)

            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.presenceUsers) { user in
                        presenceUserRow(user: user)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 20)
    }

    // MARK: - Presence User Row

    private func presenceUserRow(user: PresenceUser) -> some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(statusColor(for: user.status))
                .frame(width: 10, height: 10)

            // User info
            VStack(alignment: .leading, spacing: 2) {
                Text(user.displayName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(Color(UIColor.label))

                if let unit = user.unit {
                    Text(unit)
                        .font(.system(size: 14))
                        .foregroundColor(Color(UIColor.secondaryLabel))
                }
            }

            Spacer()

            // Talking indicator
            if user.status == .talking {
                Text("🎙")
                    .font(.system(size: 18))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(8)
    }

    // MARK: - Error View

    private func errorView(message: String) -> some View {
        Text(message)
            .font(.system(size: 14))
            .foregroundColor(Color(red: 0.6, green: 0.11, blue: 0.11))
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(red: 1.0, green: 0.89, blue: 0.89))
            .overlay(
                Rectangle()
                    .fill(Color(red: 1.0, green: 0.79, blue: 0.79))
                    .frame(height: 1),
                alignment: .top
            )
    }

    // MARK: - Helper Methods

    private func statusColor(for status: PresenceUser.UserStatus) -> Color {
        switch status {
        case .talking:
            return Color.red
        case .online:
            return Color.green
        case .offline:
            return Color.gray
        }
    }
}

// MARK: - ViewModel

@MainActor
class PushToTalkViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var connected = false
    @Published var authenticated = false
    @Published var currentChannel: String?
    @Published var presenceUsers: [PresenceUser] = []
    @Published var floorState: FloorState = .idle
    @Published var isTransmitting = false
    @Published var currentSpeaker: String?
    @Published var error: String?

    // MARK: - Private Properties

    private let signalingUrl: String
    private let token: String
    private let defaultChannelId: String?

    // TODO: Replace with actual PTT client when WebRTC implementation is ready
    private var isConnecting = false

    // MARK: - Initialization

    init(signalingUrl: String, token: String, defaultChannelId: String? = nil) {
        self.signalingUrl = signalingUrl
        self.token = token
        self.defaultChannelId = defaultChannelId
    }

    // MARK: - Public Methods

    func connect() {
        guard !isConnecting && !connected else { return }

        isConnecting = true
        error = nil

        // TODO: Implement actual WebSocket connection to radio-fleet-dispatch
        // For now, simulate connection for UI demonstration
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self = self else { return }
            self.connected = true
            self.authenticated = true
            self.isConnecting = false

            // Auto-join default channel
            if let channelId = self.defaultChannelId {
                self.currentChannel = channelId

                // Simulate presence data
                self.presenceUsers = [
                    PresenceUser(userId: "user1", displayName: "Driver Smith", unit: "Unit 12", status: .online),
                    PresenceUser(userId: "user2", displayName: "Driver Johnson", unit: "Unit 45", status: .online),
                    PresenceUser(userId: "user3", displayName: "Dispatcher Martinez", unit: "Dispatch", status: .online)
                ]
            }
        }
    }

    func disconnect() {
        // TODO: Implement actual disconnection logic
        connected = false
        authenticated = false
        currentChannel = nil
        presenceUsers = []
        floorState = .idle
        isTransmitting = false
        currentSpeaker = nil
    }

    func handlePressIn() async {
        guard connected, floorState == .idle || floorState == .granted else {
            return
        }

        // Request floor
        floorState = .requesting

        // TODO: Send requestFloor message to server via WebSocket
        // Simulate floor grant
        try? await Task.sleep(nanoseconds: 300_000_000) // 0.3s

        floorState = .granted

        // Start transmit
        await startTransmit()
    }

    func handlePressOut() {
        stopTransmit()
        releaseFloor()
    }

    // MARK: - Private Methods

    private func startTransmit() async {
        guard floorState == .granted else { return }

        // TODO: Start audio capture and WebRTC transmission
        floorState = .transmitting
        isTransmitting = true

        // TODO: Send speaking:true message to server
    }

    private func stopTransmit() {
        guard isTransmitting else { return }

        // TODO: Stop audio capture and WebRTC transmission
        isTransmitting = false

        // TODO: Send speaking:false message to server
    }

    private func releaseFloor() {
        // TODO: Send releaseFloor message to server
        floorState = .idle
    }
}

// MARK: - Preview

#Preview {
    PushToTalkPanel(
        signalingUrl: "wss://fleet.capitaltechalliance.com/ptt",
        token: "demo-token",
        defaultChannelId: "dispatch-1"
    )
}
