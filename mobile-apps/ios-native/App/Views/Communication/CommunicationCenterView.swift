//
//  CommunicationCenterView.swift
//  Fleet Manager - iOS Native App
//
//  Communication Center with Messages, Email, Notifications, and Broadcast
//  Integrated communication hub for team collaboration
//

import SwiftUI

struct CommunicationCenterView: View {
    @StateObject private var viewModel = CommunicationViewModel()
    @State private var selectedTab: CommunicationTab = .messages

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                tabSelector

                Divider()

                // Content
                TabView(selection: $selectedTab) {
                    MessagesView(viewModel: viewModel)
                        .tag(CommunicationTab.messages)

                    EmailView(viewModel: viewModel)
                        .tag(CommunicationTab.email)

                    NotificationManagementView(viewModel: viewModel)
                        .tag(CommunicationTab.notifications)

                    BroadcastView(viewModel: viewModel)
                        .tag(CommunicationTab.broadcast)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Communication")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: {
                            Task {
                                await viewModel.refresh()
                            }
                        }) {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }

                        Divider()

                        Button(action: {
                            // Settings action
                        }) {
                            Label("Settings", systemImage: "gear")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .task {
                await loadInitialData()
            }
        }
    }

    // MARK: - Tab Selector
    private var tabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 20) {
                ForEach(CommunicationTab.allCases, id: \.self) { tab in
                    TabButton(
                        title: tab.title,
                        icon: tab.icon,
                        isSelected: selectedTab == tab,
                        badge: badge(for: tab)
                    ) {
                        withAnimation {
                            selectedTab = tab
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(Color(.systemBackground))
    }

    private func badge(for tab: CommunicationTab) -> Int? {
        switch tab {
        case .messages:
            return viewModel.unreadMessageCount > 0 ? viewModel.unreadMessageCount : nil
        case .email:
            return viewModel.unreadEmailCount > 0 ? viewModel.unreadEmailCount : nil
        case .notifications, .broadcast:
            return nil
        }
    }

    private func loadInitialData() async {
        await viewModel.loadConversations()
        await viewModel.loadEmails()
        await viewModel.loadCampaigns()
        await viewModel.loadEmailTemplates()
        await viewModel.loadNotificationTemplates()
    }
}

// MARK: - Communication Tab
enum CommunicationTab: String, CaseIterable {
    case messages
    case email
    case notifications
    case broadcast

    var title: String {
        switch self {
        case .messages: return "Messages"
        case .email: return "Email"
        case .notifications: return "Notifications"
        case .broadcast: return "Broadcast"
        }
    }

    var icon: String {
        switch self {
        case .messages: return "message.fill"
        case .email: return "envelope.fill"
        case .notifications: return "bell.fill"
        case .broadcast: return "megaphone.fill"
        }
    }
}

// MARK: - Tab Button
struct TabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let badge: Int?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: icon)
                        .font(.system(size: 20))

                    if let badge = badge {
                        Text("\(badge)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .clipShape(Capsule())
                            .offset(x: 8, y: -8)
                    }
                }

                Text(title)
                    .font(.caption)
                    .fontWeight(isSelected ? .semibold : .regular)
            }
            .foregroundColor(isSelected ? .blue : .secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.clear)
            )
        }
    }
}

// MARK: - Broadcast View
struct BroadcastView: View {
    @ObservedObject var viewModel: CommunicationViewModel

    @State private var broadcastTitle = ""
    @State private var broadcastMessage = ""
    @State private var selectedChannels: Set<BroadcastChannel> = []
    @State private var scheduleLater = false
    @State private var scheduledDate = Date()
    @State private var showPreview = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Send Broadcast Message")
                        .font(.title2.bold())

                    Text("Send messages to multiple channels at once")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()

                // Title Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Title")
                        .font(.subheadline.bold())

                    TextField("Enter broadcast title", text: $broadcastTitle)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding(.horizontal)

                // Message Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Message")
                        .font(.subheadline.bold())

                    ZStack(alignment: .topLeading) {
                        if broadcastMessage.isEmpty {
                            Text("Enter your message...")
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 12)
                        }

                        TextEditor(text: $broadcastMessage)
                            .frame(minHeight: 150)
                            .padding(4)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                            )
                    }
                }
                .padding(.horizontal)

                // Channel Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Broadcast Channels")
                        .font(.subheadline.bold())

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 12) {
                        ForEach(BroadcastChannel.allCases, id: \.self) { channel in
                            ChannelSelectionCard(
                                channel: channel,
                                isSelected: selectedChannels.contains(channel)
                            ) {
                                if selectedChannels.contains(channel) {
                                    selectedChannels.remove(channel)
                                } else {
                                    selectedChannels.insert(channel)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)

                // Schedule Option
                VStack(alignment: .leading, spacing: 12) {
                    Toggle("Schedule for later", isOn: $scheduleLater)
                        .font(.subheadline.bold())

                    if scheduleLater {
                        DatePicker("Send at", selection: $scheduledDate, in: Date()...)
                            .datePickerStyle(.compact)
                    }
                }
                .padding(.horizontal)

                // Action Buttons
                VStack(spacing: 12) {
                    Button(action: {
                        showPreview = true
                    }) {
                        HStack {
                            Image(systemName: "eye")
                            Text("Preview")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(10)
                    }
                    .disabled(!canBroadcast)

                    Button(action: sendBroadcast) {
                        HStack {
                            Image(systemName: scheduleLater ? "clock" : "paperplane.fill")
                            Text(scheduleLater ? "Schedule Broadcast" : "Send Now")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canBroadcast ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(!canBroadcast)
                }
                .padding()
            }
        }
        .sheet(isPresented: $showPreview) {
            BroadcastPreviewSheet(
                title: broadcastTitle,
                message: broadcastMessage,
                channels: Array(selectedChannels),
                scheduledDate: scheduleLater ? scheduledDate : nil
            )
        }
    }

    private var canBroadcast: Bool {
        !broadcastTitle.isEmpty && !broadcastMessage.isEmpty && !selectedChannels.isEmpty
    }

    private func sendBroadcast() {
        // Implement broadcast logic
        Task {
            // Send to email if selected
            if selectedChannels.contains(.email) {
                // Create and send email
            }

            // Send push notification if selected
            if selectedChannels.contains(.push) {
                let campaign = NotificationCampaign(
                    id: UUID().uuidString,
                    tenantId: "tenant-001",
                    title: broadcastTitle,
                    message: broadcastMessage,
                    targetAudience: TargetAudience(userIds: nil, roles: nil, departments: nil, allUsers: true),
                    status: scheduleLater ? .scheduled : .sending,
                    scheduledFor: scheduleLater ? scheduledDate : nil,
                    sentAt: scheduleLater ? nil : Date(),
                    createdAt: Date(),
                    createdBy: "current-user",
                    analytics: nil,
                    metadata: nil
                )

                await viewModel.sendCampaign(campaign)
            }

            // Send in-app message if selected
            if selectedChannels.contains(.inApp) {
                // Create and send in-app message
            }

            // Reset form
            broadcastTitle = ""
            broadcastMessage = ""
            selectedChannels = []
            scheduleLater = false
        }
    }
}

// MARK: - Broadcast Channel
enum BroadcastChannel: String, CaseIterable {
    case email = "Email"
    case push = "Push Notification"
    case inApp = "In-App Message"
    case sms = "SMS"

    var icon: String {
        switch self {
        case .email: return "envelope.fill"
        case .push: return "bell.fill"
        case .inApp: return "message.fill"
        case .sms: return "iphone.radiowaves.left.and.right"
        }
    }

    var color: Color {
        switch self {
        case .email: return .blue
        case .push: return .orange
        case .inApp: return .purple
        case .sms: return .green
        }
    }
}

// MARK: - Channel Selection Card
struct ChannelSelectionCard: View {
    let channel: BroadcastChannel
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: channel.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : channel.color)

                Text(channel.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? channel.color : Color(.secondarySystemGroupedBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? channel.color : Color.clear, lineWidth: 2)
            )
        }
    }
}

// MARK: - Broadcast Preview Sheet
struct BroadcastPreviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let message: String
    let channels: [BroadcastChannel]
    let scheduledDate: Date?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Preview Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Broadcast Preview")
                            .font(.title2.bold())

                        if let date = scheduledDate {
                            HStack {
                                Image(systemName: "clock")
                                Text("Scheduled for \(date.formatted(date: .abbreviated, time: .shortened))")
                            }
                            .font(.subheadline)
                            .foregroundColor(.orange)
                        }
                    }

                    Divider()

                    // Title
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Title")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(title)
                            .font(.headline)
                    }

                    // Message
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Message")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(message)
                            .font(.body)
                    }

                    // Channels
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Channels (\(channels.count))")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        ForEach(channels, id: \.self) { channel in
                            HStack {
                                Image(systemName: channel.icon)
                                    .foregroundColor(channel.color)
                                Text(channel.rawValue)
                                    .font(.subheadline)
                            }
                        }
                    }

                    // Estimated Recipients
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Estimated Recipients")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("All Users")
                            .font(.subheadline)
                    }
                }
                .padding()
            }
            .navigationTitle("Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview Provider
struct CommunicationCenterView_Previews: PreviewProvider {
    static var previews: some View {
        CommunicationCenterView()
    }
}
