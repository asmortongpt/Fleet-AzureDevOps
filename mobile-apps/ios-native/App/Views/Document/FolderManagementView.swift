//
//  FolderManagementView.swift
//  Fleet Manager
//
//  Folder management operations: rename, delete, move, and color customization
//

import SwiftUI

struct FolderManagementView: View {
    @ObservedObject var viewModel: DocumentsViewModel
    let folder: DocumentFolder
    @Environment(\.dismiss) private var dismiss

    @State private var showingRenameSheet = false
    @State private var showingDeleteConfirmation = false
    @State private var showingColorPicker = false
    @State private var showingMoveSheet = false

    var body: some View {
        List {
            // Folder Info Section
            Section {
                HStack(spacing: ModernTheme.Spacing.md) {
                    ZStack {
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(folder.color.color.opacity(0.2))
                            .frame(width: 60, height: 60)

                        Image(systemName: folder.icon ?? "folder.fill")
                            .font(.largeTitle)
                            .foregroundColor(folder.color.color)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(folder.name)
                            .font(ModernTheme.Typography.title2)

                        Text(folder.path)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
                .padding(.vertical, ModernTheme.Spacing.sm)
            }

            // Statistics Section
            Section("Statistics") {
                StatRow(label: "Documents", value: "\(folder.documentCount)", icon: "doc.text")
                StatRow(label: "Subfolders", value: "\(folder.subfolderCount)", icon: "folder")
                StatRow(label: "Created By", value: folder.createdBy, icon: "person")
                StatRow(label: "Created Date", value: formattedDate(folder.createdDate), icon: "calendar")

                if let modifiedDate = folder.modifiedDate, let modifiedBy = folder.modifiedBy {
                    StatRow(label: "Modified By", value: modifiedBy, icon: "person.badge.clock")
                    StatRow(label: "Modified Date", value: formattedDate(modifiedDate), icon: "clock")
                }
            }

            // Permissions Section
            Section("Permissions") {
                PermissionRow(label: "Can Read", isGranted: folder.permissions.canRead)
                PermissionRow(label: "Can Write", isGranted: folder.permissions.canWrite)
                PermissionRow(label: "Can Delete", isGranted: folder.permissions.canDelete)
                PermissionRow(label: "Can Share", isGranted: folder.permissions.canShare)

                if folder.isShared {
                    Label("Shared with others", systemImage: "person.2.fill")
                        .foregroundColor(ModernTheme.Colors.info)
                }
            }

            // Actions Section
            Section("Actions") {
                Button {
                    showingRenameSheet = true
                } label: {
                    Label("Rename Folder", systemImage: "pencil")
                }
                .disabled(!folder.permissions.canWrite)

                Button {
                    showingColorPicker = true
                } label: {
                    Label("Change Color", systemImage: "paintpalette")
                }
                .disabled(!folder.permissions.canWrite)

                Button {
                    showingMoveSheet = true
                } label: {
                    Label("Move Folder", systemImage: "folder.badge.arrow.right")
                }
                .disabled(!folder.permissions.canWrite)

                Button(role: .destructive) {
                    showingDeleteConfirmation = true
                } label: {
                    Label("Delete Folder", systemImage: "trash")
                }
                .disabled(!folder.permissions.canDelete)
            }
        }
        .navigationTitle("Folder Settings")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingRenameSheet) {
            RenameFolderSheet(folder: folder, viewModel: viewModel)
        }
        .sheet(isPresented: $showingColorPicker) {
            ColorPickerSheet(folder: folder, viewModel: viewModel)
        }
        .sheet(isPresented: $showingMoveSheet) {
            MoveFolderSheet(folder: folder, viewModel: viewModel)
        }
        .alert("Delete Folder", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    await viewModel.deleteFolder(folder)
                    dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to delete '\(folder.name)' and all its contents? This action cannot be undone.")
        }
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views

struct StatRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.bodyBold)
        }
    }
}

struct PermissionRow: View {
    let label: String
    let isGranted: Bool

    var body: some View {
        HStack {
            Text(label)
                .font(ModernTheme.Typography.body)

            Spacer()

            Image(systemName: isGranted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(isGranted ? ModernTheme.Colors.success : ModernTheme.Colors.error)
        }
    }
}

struct RenameFolderSheet: View {
    let folder: DocumentFolder
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var newName: String

    init(folder: DocumentFolder, viewModel: DocumentsViewModel) {
        self.folder = folder
        self.viewModel = viewModel
        _newName = State(initialValue: folder.name)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Folder Name") {
                    TextField("Enter folder name", text: $newName)
                }

                Section("Current Path") {
                    Text(folder.path)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Section("New Path") {
                    Text(folder.path.replacingOccurrences(of: folder.name, with: newName))
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .navigationTitle("Rename Folder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Rename") {
                        Task {
                            await viewModel.renameFolder(folder, newName: newName)
                            dismiss()
                        }
                    }
                    .disabled(newName.isEmpty || newName == folder.name)
                }
            }
        }
    }
}

struct ColorPickerSheet: View {
    let folder: DocumentFolder
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedColor: FolderColor

    init(folder: DocumentFolder, viewModel: DocumentsViewModel) {
        self.folder = folder
        self.viewModel = viewModel
        _selectedColor = State(initialValue: folder.color)
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Choose Color") {
                    ForEach(FolderColor.allCases, id: \.self) { color in
                        Button {
                            selectedColor = color
                        } label: {
                            HStack {
                                Circle()
                                    .fill(color.color)
                                    .frame(width: 30, height: 30)

                                Text(color.rawValue)
                                    .foregroundColor(ModernTheme.Colors.primaryText)

                                Spacer()

                                if color == selectedColor {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                Section("Preview") {
                    HStack {
                        Spacer()

                        VStack(spacing: ModernTheme.Spacing.md) {
                            ZStack {
                                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                                    .fill(selectedColor.color.opacity(0.2))
                                    .frame(width: 100, height: 100)

                                Image(systemName: folder.icon ?? "folder.fill")
                                    .font(.system(size: 50))
                                    .foregroundColor(selectedColor.color)
                            }

                            Text(folder.name)
                                .font(ModernTheme.Typography.title3)
                        }

                        Spacer()
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Folder Color")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            // In production, would update folder color
                            dismiss()
                        }
                    }
                    .disabled(selectedColor == folder.color)
                }
            }
        }
    }
}

struct MoveFolderSheet: View {
    let folder: DocumentFolder
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDestination: DocumentFolder?

    var availableFolders: [DocumentFolder] {
        viewModel.folders.filter { $0.id != folder.id && $0.parentFolderId != folder.id }
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Current Location") {
                    Text(folder.path)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Section("Move To") {
                    Button {
                        selectedDestination = nil
                    } label: {
                        HStack {
                            Image(systemName: "house.fill")
                                .foregroundColor(ModernTheme.Colors.primary)

                            Text("Root")

                            Spacer()

                            if selectedDestination == nil {
                                Image(systemName: "checkmark")
                                    .foregroundColor(ModernTheme.Colors.primary)
                            }
                        }
                    }

                    ForEach(availableFolders) { destFolder in
                        Button {
                            selectedDestination = destFolder
                        } label: {
                            HStack {
                                Image(systemName: destFolder.icon ?? "folder.fill")
                                    .foregroundColor(destFolder.color.color)

                                VStack(alignment: .leading) {
                                    Text(destFolder.name)
                                        .foregroundColor(ModernTheme.Colors.primaryText)

                                    Text(destFolder.path)
                                        .font(ModernTheme.Typography.caption1)
                                        .foregroundColor(ModernTheme.Colors.secondaryText)
                                }

                                Spacer()

                                if selectedDestination?.id == destFolder.id {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(ModernTheme.Colors.primary)
                                }
                            }
                        }
                    }
                }

                if let destination = selectedDestination {
                    Section("New Path") {
                        Text("\(destination.path)/\(folder.name)")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                } else if selectedDestination == nil && folder.parentFolderId != nil {
                    Section("New Path") {
                        Text("/\(folder.name)")
                            .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
            }
            .navigationTitle("Move Folder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Move") {
                        Task {
                            // In production, would move folder
                            dismiss()
                        }
                    }
                    .disabled(selectedDestination?.id == folder.parentFolderId)
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationStack {
        FolderManagementView(
            viewModel: DocumentsViewModel(),
            folder: .sample
        )
    }
}
