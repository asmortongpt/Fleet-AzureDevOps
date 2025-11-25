//
//  MessagesView.swift
//  Fleet Manager - iOS Native App
//
//  Teams-style messaging with chat interface, contacts, and file attachments
//  Real-time messaging with read receipts and typing indicators
//

import SwiftUI

struct MessagesView: View {
    @ObservedObject var viewModel: CommunicationViewModel
    @State private var showNewConversation = false
    @State private var searchText = ""

    var body: some View {
        HStack(spacing: 0) {
            // Conversation List
            conversationList
                .frame(maxWidth: 350)

            Divider()

            // Chat View
            if let conversation = viewModel.selectedConversation {
                ChatView(viewModel: viewModel, conversation: conversation)
            } else {
                emptyStateView
            }
        }
    }

    // MARK: - Conversation List
    private var conversationList: some View {
        VStack(spacing: 0) {
            // Header with filters
            VStack(spacing: 12) {
                HStack {
                    Text("Messages")
                        .font(.title2.bold())

                    Spacer()

                    Button(action: { showNewConversation = true }) {
                        Image(systemName: "square.and.pencil")
                            .font(.title3)
                    }
                }

                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)

                    TextField("Search conversations", text: $viewModel.searchText)
                        .textFieldStyle(.plain)

                    if !viewModel.searchText.isEmpty {
                        Button(action: { viewModel.searchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

                // Filter Chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(MessageFilter.allCases, id: \.self) { filter in
                            FilterChip(
                                title: filter.rawValue,
                                icon: filter.icon,
                                isSelected: viewModel.messageFilter == filter
                            ) {
                                viewModel.messageFilter = filter
                            }
                        }
                    }
                }
            }
            .padding()

            Divider()

            // Conversation List
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredConversations.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "message")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)

                    Text("No Conversations")
                        .font(.headline)

                    Text(viewModel.searchText.isEmpty ? "Start a new conversation" : "No matching conversations")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.filteredConversations) { conversation in
                            ConversationRow(
                                conversation: conversation,
                                isSelected: viewModel.selectedConversation?.id == conversation.id
                            ) {
                                Task {
                                    await viewModel.loadMessages(for: conversation.id)
                                }
                            }
                            .contextMenu {
                                Button(action: { viewModel.toggleConversationPin(conversationId: conversation.id) }) {
                                    Label(conversation.isPinned ? "Unpin" : "Pin", systemImage: "pin")
                                }

                                Button(role: .destructive, action: { viewModel.deleteConversation(conversationId: conversation.id) }) {
                                    Label("Delete", systemImage: "trash")
                                }
                            }

                            Divider()
                                .padding(.leading)
                        }
                    }
                }
            }
        }
        .background(Color(.systemGroupedBackground))
        .sheet(isPresented: $showNewConversation) {
            NewConversationSheet(viewModel: viewModel)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "message.fill")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("Select a Conversation")
                .font(.title2.bold())

            Text("Choose a conversation from the list to start messaging")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Conversation Row
struct ConversationRow: View {
    let conversation: Conversation
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Avatar
                ZStack(alignment: .bottomTrailing) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text(conversation.title.prefix(1))
                                .font(.title3.bold())
                                .foregroundColor(.blue)
                        )

                    // Online indicator
                    if let participant = conversation.participants.first, participant.isOnline {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 14, height: 14)
                            .overlay(
                                Circle()
                                    .stroke(Color.white, lineWidth: 2)
                            )
                    }
                }

                // Content
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(conversation.title)
                            .font(.headline)
                            .lineLimit(1)

                        Spacer()

                        if let lastMessage = conversation.lastMessage {
                            Text(lastMessage.formattedTime)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    HStack {
                        if let participant = conversation.participants.first, participant.isTyping {
                            HStack(spacing: 4) {
                                Text("Typing")
                                    .foregroundColor(.blue)

                                TypingIndicator()
                            }
                            .font(.caption)
                        } else if let lastMessage = conversation.lastMessage {
                            Text(lastMessage.content)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }

                        Spacer()

                        if conversation.unreadCount > 0 {
                            Text("\(conversation.unreadCount)")
                                .font(.caption.bold())
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue)
                                .clipShape(Capsule())
                        }
                    }
                }

                if conversation.isPinned {
                    Image(systemName: "pin.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Chat View
struct ChatView: View {
    @ObservedObject var viewModel: CommunicationViewModel
    let conversation: Conversation

    var body: some View {
        VStack(spacing: 0) {
            // Header
            chatHeader

            Divider()

            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: viewModel.messages.count) { _ in
                    if let lastMessage = viewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            // Message Input
            messageInput
        }
    }

    private var chatHeader: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(conversation.title.prefix(1))
                        .font(.headline)
                        .foregroundColor(.blue)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(conversation.title)
                    .font(.headline)

                if let participant = conversation.participants.first {
                    if participant.isTyping {
                        HStack(spacing: 4) {
                            Text("Typing")
                                .foregroundColor(.blue)
                            TypingIndicator()
                        }
                        .font(.caption)
                    } else if participant.isOnline {
                        Text("Online")
                            .font(.caption)
                            .foregroundColor(.green)
                    } else if let lastSeen = participant.lastSeen {
                        Text("Last seen \(lastSeen.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            // Action buttons
            HStack(spacing: 16) {
                Button(action: {}) {
                    Image(systemName: "phone.fill")
                }

                Button(action: {}) {
                    Image(systemName: "video.fill")
                }

                Button(action: {}) {
                    Image(systemName: "info.circle")
                }
            }
            .font(.title3)
        }
        .padding()
    }

    private var messageInput: some View {
        HStack(spacing: 12) {
            Button(action: {}) {
                Image(systemName: "paperclip")
                    .font(.title3)
            }

            TextField("Type a message...", text: $viewModel.messageText)
                .textFieldStyle(.plain)
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(20)

            Button(action: {
                Task {
                    await viewModel.sendMessage()
                }
            }) {
                Image(systemName: "paperplane.fill")
                    .font(.title3)
                    .foregroundColor(.white)
                    .padding(10)
                    .background(viewModel.messageText.isEmpty ? Color.gray : Color.blue)
                    .clipShape(Circle())
            }
            .disabled(viewModel.messageText.isEmpty)
        }
        .padding()
    }
}

// MARK: - Message Bubble
struct MessageBubble: View {
    let message: ChatMessage

    private var isCurrentUser: Bool {
        message.senderId == "current-user"
    }

    var body: some View {
        HStack {
            if isCurrentUser {
                Spacer(minLength: 50)
            }

            VStack(alignment: isCurrentUser ? .trailing : .leading, spacing: 4) {
                if !isCurrentUser {
                    Text(message.senderName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(message.content)
                    .padding(12)
                    .background(isCurrentUser ? Color.blue : Color(.secondarySystemGroupedBackground))
                    .foregroundColor(isCurrentUser ? .white : .primary)
                    .cornerRadius(16)

                HStack(spacing: 4) {
                    Text(message.formattedTime)
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    if isCurrentUser {
                        if message.isRead {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption2)
                                .foregroundColor(.blue)
                        } else {
                            Image(systemName: "checkmark.circle")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            if !isCurrentUser {
                Spacer(minLength: 50)
            }
        }
    }
}

// MARK: - Typing Indicator
struct TypingIndicator: View {
    @State private var phase: CGFloat = 0

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.blue)
                    .frame(width: 4, height: 4)
                    .opacity(phase == CGFloat(index) ? 1 : 0.3)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.6).repeatForever(autoreverses: false)) {
                phase = 2
            }
        }
    }
}

// MARK: - New Conversation Sheet
struct NewConversationSheet: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel

    @State private var searchText = ""
    @State private var selectedUsers: Set<String> = []
    @State private var conversationType: ConversationType = .direct

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)

                    TextField("Search users", text: $searchText)
                        .textFieldStyle(.plain)
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)
                .padding()

                // Type selector
                Picker("Conversation Type", selection: $conversationType) {
                    Text("Direct").tag(ConversationType.direct)
                    Text("Group").tag(ConversationType.group)
                    Text("Channel").tag(ConversationType.channel)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                Divider()

                // User list (placeholder)
                List {
                    ForEach(0..<5) { index in
                        HStack {
                            Circle()
                                .fill(Color.blue.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Text("U")
                                        .foregroundColor(.blue)
                                )

                            Text("User \(index + 1)")
                                .font(.body)

                            Spacer()

                            if selectedUsers.contains("user-\(index)") {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedUsers.contains("user-\(index)") {
                                selectedUsers.remove("user-\(index)")
                            } else {
                                selectedUsers.insert("user-\(index)")
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Conversation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        // Create conversation
                        dismiss()
                    }
                    .disabled(selectedUsers.isEmpty)
                }
            }
        }
    }
}

// MARK: - Preview Provider
struct MessagesView_Previews: PreviewProvider {
    static var previews: some View {
        MessagesView(viewModel: CommunicationViewModel())
    }
}
