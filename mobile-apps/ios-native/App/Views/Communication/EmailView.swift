//
//  EmailView.swift
//  Fleet Manager - iOS Native App
//
//  Email management with compose, inbox, templates, and attachments
//  Integrated email functionality for team communication
//

import SwiftUI

struct EmailView: View {
    @ObservedObject var viewModel: CommunicationViewModel
    @State private var showFolderSelector = false

    var body: some View {
        HStack(spacing: 0) {
            // Email List
            emailList
                .frame(maxWidth: 400)

            Divider()

            // Email Detail
            if let email = viewModel.selectedEmail {
                EmailDetailView(viewModel: viewModel, email: email)
            } else {
                emptyStateView
            }
        }
        .sheet(isPresented: $viewModel.showComposeSheet) {
            if let email = viewModel.composeEmail {
                EmailComposeView(viewModel: viewModel, email: email)
            }
        }
    }

    // MARK: - Email List
    private var emailList: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 12) {
                HStack {
                    Text("Email")
                        .font(.title2.bold())

                    Spacer()

                    Button(action: { viewModel.createNewEmail() }) {
                        Image(systemName: "square.and.pencil")
                            .font(.title3)
                    }
                }

                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)

                    TextField("Search emails", text: $viewModel.emailSearchText)
                        .textFieldStyle(.plain)

                    if !viewModel.emailSearchText.isEmpty {
                        Button(action: { viewModel.emailSearchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(8)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

                // Folder Selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(EmailFolder.allCases, id: \.self) { folder in
                            FolderChip(
                                folder: folder,
                                isSelected: viewModel.selectedFolder == folder,
                                count: viewModel.emails.filter { $0.folder == folder }.count
                            ) {
                                viewModel.selectedFolder = folder
                            }
                        }
                    }
                }
            }
            .padding()

            Divider()

            // Email List
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredEmails.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "envelope")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)

                    Text("No Emails")
                        .font(.headline)

                    Text("Your \(viewModel.selectedFolder.displayName.lowercased()) is empty")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.filteredEmails) { email in
                            EmailRow(
                                email: email,
                                isSelected: viewModel.selectedEmail?.id == email.id
                            ) {
                                viewModel.selectEmail(email)
                            }
                            .contextMenu {
                                Button(action: { viewModel.toggleEmailFlag(emailId: email.id) }) {
                                    Label(email.isFlagged ? "Unflag" : "Flag", systemImage: "flag")
                                }

                                Button(role: .destructive, action: { viewModel.deleteEmail(emailId: email.id) }) {
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
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "envelope.fill")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("Select an Email")
                .font(.title2.bold())

            Text("Choose an email from the list to view its contents")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Email Row
struct EmailRow: View {
    let email: Email
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Unread indicator
                Circle()
                    .fill(email.isRead ? Color.clear : Color.blue)
                    .frame(width: 8, height: 8)

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(email.from.displayName)
                            .font(email.isRead ? .body : .body.bold())
                            .lineLimit(1)

                        Spacer()

                        Text(email.formattedDate)
                            .font(.caption)
                            .foregroundColor(.secondary)

                        if email.isFlagged {
                            Image(systemName: "flag.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }

                    Text(email.subject)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    HStack {
                        Text(email.body.prefix(100))
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)

                        Spacer()

                        if let attachments = email.attachments, !attachments.isEmpty {
                            HStack(spacing: 2) {
                                Image(systemName: "paperclip")
                                Text("\(attachments.count)")
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Folder Chip
struct FolderChip: View {
    let folder: EmailFolder
    let isSelected: Bool
    let count: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: folder.icon)
                    .font(.caption)

                Text(folder.displayName)
                    .font(.caption)

                if count > 0 {
                    Text("(\(count))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Email Detail View
struct EmailDetailView: View {
    @ObservedObject var viewModel: CommunicationViewModel
    let email: Email

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(email.subject)
                            .font(.title2.bold())

                        Spacer()

                        HStack(spacing: 16) {
                            Button(action: { viewModel.toggleEmailFlag(emailId: email.id) }) {
                                Image(systemName: email.isFlagged ? "flag.fill" : "flag")
                                    .foregroundColor(email.isFlagged ? .orange : .primary)
                            }

                            Button(action: { viewModel.deleteEmail(emailId: email.id) }) {
                                Image(systemName: "trash")
                            }
                        }
                        .font(.title3)
                    }

                    HStack(spacing: 12) {
                        Circle()
                            .fill(Color.blue.opacity(0.2))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text(email.from.displayName.prefix(1))
                                    .foregroundColor(.blue)
                            )

                        VStack(alignment: .leading, spacing: 2) {
                            Text(email.from.displayName)
                                .font(.headline)

                            Text(email.from.email)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Text(email.createdAt.formatted(date: .abbreviated, time: .shortened))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Recipients
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("To:")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Text(email.to.map { $0.displayName }.joined(separator: ", "))
                                .font(.caption)
                        }

                        if let cc = email.cc, !cc.isEmpty {
                            HStack {
                                Text("CC:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                Text(cc.map { $0.displayName }.joined(separator: ", "))
                                    .font(.caption)
                            }
                        }
                    }
                }

                Divider()

                // Attachments
                if let attachments = email.attachments, !attachments.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Attachments (\(attachments.count))")
                            .font(.subheadline.bold())

                        ForEach(attachments) { attachment in
                            AttachmentRow(attachment: attachment)
                        }
                    }

                    Divider()
                }

                // Body
                Text(email.body)
                    .font(.body)
                    .textSelection(.enabled)

                Divider()

                // Actions
                HStack(spacing: 16) {
                    Button(action: {}) {
                        Label("Reply", systemImage: "arrowshape.turn.up.left")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    Button(action: {}) {
                        Label("Forward", systemImage: "arrowshape.turn.up.right")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(.blue)
                            .cornerRadius(10)
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Attachment Row
struct AttachmentRow: View {
    let attachment: EmailAttachment

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconForFileType(attachment.fileType))
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text(attachment.fileName)
                    .font(.subheadline)
                    .lineLimit(1)

                Text(attachment.formattedSize)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: {}) {
                Image(systemName: "arrow.down.circle")
                    .font(.title3)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
    }

    private func iconForFileType(_ fileType: String) -> String {
        switch fileType.lowercased() {
        case "application/pdf":
            return "doc.fill"
        case "image/jpeg", "image/png":
            return "photo.fill"
        case "application/zip":
            return "archivebox.fill"
        default:
            return "doc.fill"
        }
    }
}

// MARK: - Email Compose View
struct EmailComposeView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel
    @State var email: Email

    @State private var showTemplates = false
    @State private var toEmail = ""
    @State private var ccEmails: [String] = []
    @State private var showCCField = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // To field
                    VStack(alignment: .leading, spacing: 4) {
                        Text("To")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextField("Enter email addresses", text: $toEmail)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }

                    // CC field
                    if showCCField {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("CC")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                Spacer()

                                Button(action: { showCCField = false }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.secondary)
                                }
                            }

                            TextField("Enter email addresses", text: .constant(""))
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                    } else {
                        Button(action: { showCCField = true }) {
                            Text("Add CC")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }

                    // Subject
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Subject")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextField("Enter subject", text: $email.subject)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }

                    // Body
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Message")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        ZStack(alignment: .topLeading) {
                            if email.body.isEmpty {
                                Text("Compose your email...")
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 12)
                            }

                            TextEditor(text: $email.body)
                                .frame(minHeight: 200)
                                .padding(4)
                        }
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                        )
                    }

                    // Template button
                    Button(action: { showTemplates = true }) {
                        HStack {
                            Image(systemName: "doc.text")
                            Text("Use Template")
                        }
                        .font(.subheadline)
                        .foregroundColor(.blue)
                    }

                    // Attachments
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Attachments")
                                .font(.subheadline.bold())

                            Spacer()

                            Button(action: {}) {
                                Label("Add", systemImage: "paperclip")
                                    .font(.caption)
                            }
                        }

                        if let attachments = email.attachments, !attachments.isEmpty {
                            ForEach(attachments) { attachment in
                                AttachmentRow(attachment: attachment)
                            }
                        } else {
                            Text("No attachments")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("New Email")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Send") {
                        Task {
                            // Update email with recipients
                            var updatedEmail = email
                            if !toEmail.isEmpty {
                                updatedEmail.to = [EmailAddress(email: toEmail, name: nil)]
                            }

                            await viewModel.sendEmail(updatedEmail)
                            dismiss()
                        }
                    }
                    .disabled(!canSend)
                }
            }
            .sheet(isPresented: $showTemplates) {
                EmailTemplateSelector(viewModel: viewModel) { template in
                    email.subject = template.subject
                    email.body = template.body
                    showTemplates = false
                }
            }
        }
    }

    private var canSend: Bool {
        !toEmail.isEmpty && !email.subject.isEmpty && !email.body.isEmpty
    }
}

// MARK: - Email Template Selector
struct EmailTemplateSelector: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel
    let onSelect: (EmailTemplate) -> Void

    var body: some View {
        NavigationView {
            List(viewModel.emailTemplates) { template in
                Button(action: {
                    onSelect(template)
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(template.name)
                            .font(.headline)

                        Text(template.subject)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)

                        Text(template.category)
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Email Templates")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview Provider
struct EmailView_Previews: PreviewProvider {
    static var previews: some View {
        EmailView(viewModel: CommunicationViewModel())
    }
}
