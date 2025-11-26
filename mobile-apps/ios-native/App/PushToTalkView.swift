import SwiftUI

/// Push-to-Talk (PTT) View
struct PushToTalkView: View {
    @StateObject private var service = PushToTalkService.shared
    @State private var showingChannelPicker = false

    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Channel Display
                if let channel = service.currentChannel {
                    channelInfoCard(channel)
                } else {
                    Text("No Channel Selected")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // PTT Button
                pttButton

                Spacer()

                // State Display
                stateIndicator

                // Channel List
                if service.currentChannel == nil {
                    channelList
                }
            }
            .padding()
            .navigationTitle("Push-to-Talk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if service.currentChannel != nil {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Leave") {
                            Task {
                                await service.leaveChannel()
                            }
                        }
                        .foregroundColor(.red)
                    }
                }
            }
        }
    }

    // MARK: - Channel Info Card

    private func channelInfoCard(_ channel: PTTChannel) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text(channel.name)
                .font(.title)
                .fontWeight(.bold)

            if let frequency = channel.frequency {
                Text(frequency)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            HStack {
                Image(systemName: "person.3.fill")
                Text("\(channel.members.count) active")
            }
            .font(.caption)
            .foregroundColor(.secondary)

            if let speaker = service.currentSpeaker {
                HStack {
                    Image(systemName: "mic.fill")
                        .foregroundColor(.red)
                    Text(speaker == "current-user-id" ? "You are speaking" : "\(speaker) is speaking")
                }
                .font(.subheadline)
                .foregroundColor(.red)
                .padding()
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(UIColor.secondarySystemBackground))
        )
    }

    // MARK: - PTT Button

    private var pttButton: some View {
        Button {
            // Button action (but gesture is primary interaction)
        } label: {
            ZStack {
                Circle()
                    .fill(
                        service.state == .speaking
                            ? LinearGradient(colors: [.red, .orange], startPoint: .topLeading, endPoint: .bottomTrailing)
                            : LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 200, height: 200)
                    .shadow(radius: service.state == .speaking ? 20 : 10)
                    .scaleEffect(service.state == .speaking ? 1.1 : 1.0)
                    .animation(.easeInOut(duration: 0.2), value: service.state)

                VStack(spacing: 8) {
                    Image(systemName: service.state == .speaking ? "mic.fill" : "mic.slash.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.white)

                    Text(service.state == .speaking ? "SPEAKING" : "HOLD TO TALK")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            }
        }
        .disabled(service.currentChannel == nil || service.state == .connecting)
        .simultaneousGesture(
            LongPressGesture(minimumDuration: 0.0)
                .onChanged { _ in
                    if service.state == .listening {
                        Task {
                            await service.startSpeaking()
                        }
                    }
                }
                .onEnded { _ in
                    if service.state == .speaking {
                        Task {
                            await service.stopSpeaking()
                        }
                    }
                }
        )
    }

    // MARK: - State Indicator

    private var stateIndicator: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(colorForState(service.state))
                .frame(width: 12, height: 12)

            Text(service.state.displayName)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color(UIColor.secondarySystemBackground))
        )
    }

    // MARK: - Channel List

    private var channelList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Available Channels")
                .font(.headline)

            ForEach(service.availableChannels) { channel in
                Button {
                    joinChannel(channel)
                } label: {
                    HStack {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .foregroundColor(.blue)

                        VStack(alignment: .leading) {
                            Text(channel.name)
                                .font(.headline)
                                .foregroundColor(.primary)

                            if let freq = channel.frequency {
                                Text(freq)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Spacer()

                        if channel.isActive {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 8, height: 8)
                        }

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(UIColor.secondarySystemBackground))
                    )
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func joinChannel(_ channel: PTTChannel) {
        Task {
            await service.joinChannel(channel)
        }
    }

    private func colorForState(_ state: PTTState) -> Color {
        switch state {
        case .idle: return .gray
        case .listening: return .blue
        case .speaking: return .red
        case .connecting: return .orange
        }
    }
}

struct PushToTalkView_Previews: PreviewProvider {
    static var previews: some View {
        PushToTalkView()
    }
}
