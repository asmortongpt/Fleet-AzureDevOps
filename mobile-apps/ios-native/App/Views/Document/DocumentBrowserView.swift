//
//  DocumentBrowserView.swift
//  Fleet Manager
//
//  Enhanced Document Browser with folder hierarchy, grid/list views, and advanced search
//

import SwiftUI
import PhotosUI
import VisionKit

struct DocumentBrowserView: View {
    @StateObject private var viewModel = DocumentsViewModel()
    @State private var selectedQuickFilter: QuickFilter = .all
    @State private var showingFilters = false
    @State private var showingCreateFolder = false
    @State private var selectedDocuments: Set<String> = []
    @State private var isMultiSelectMode = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Breadcrumb navigation
                if viewModel.currentFolder != nil {
                    breadcrumbView
                        .padding(.horizontal)
                        .padding(.vertical, ModernTheme.Spacing.sm)
                        .background(ModernTheme.Colors.secondaryBackground)
                }

                // Quick Filters
                quickFiltersView

                // Content
                if viewModel.loadingState.isLoading && viewModel.documents.isEmpty {
                    ProgressView("Loading documents...")
                        .padding()
                } else {
                    contentView
                }
            }
            .navigationTitle(viewModel.currentFolder?.name ?? "Documents")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if viewModel.currentFolder != nil {
                        Button {
                            viewModel.navigateUp()
                        } label: {
                            Label("Back", systemImage: "chevron.left")
                        }
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: ModernTheme.Spacing.sm) {
                        // View mode toggle
                        Button {
                            viewModel.viewMode = viewModel.viewMode == .list ? .grid : .list
                            ModernTheme.Haptics.light()
                        } label: {
                            Image(systemName: viewModel.viewMode == .list ? "square.grid.2x2" : "list.bullet")
                        }

                        // Multi-select toggle
                        Button {
                            isMultiSelectMode.toggle()
                            if !isMultiSelectMode {
                                selectedDocuments.removeAll()
                            }
                            ModernTheme.Haptics.light()
                        } label: {
                            Image(systemName: isMultiSelectMode ? "checkmark.circle.fill" : "checkmark.circle")
                                .foregroundColor(isMultiSelectMode ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                        }

                        // More menu
                        Menu {
                            Button {
                                showingCreateFolder = true
                            } label: {
                                Label("Create Folder", systemImage: "folder.badge.plus")
                            }

                            Button {
                                viewModel.showingUploadSheet = true
                            } label: {
                                Label("Upload File", systemImage: "doc.badge.plus")
                            }

                            if DataScannerViewController.isSupported {
                                Button {
                                    viewModel.showingDocumentScanner = true
                                } label: {
                                    Label("Scan Document", systemImage: "doc.viewfinder")
                                }
                            }

                            Divider()

                            Button {
                                showingFilters = true
                            } label: {
                                Label("Advanced Filters", systemImage: "line.3.horizontal.decrease.circle")
                            }

                            if viewModel.hasActiveFilters {
                                Button {
                                    viewModel.clearFilters()
                                } label: {
                                    Label("Clear Filters", systemImage: "xmark.circle")
                                }
                            }

                            Divider()

                            Menu("Sort By") {
                                ForEach(DocumentSortOption.allCases, id: \.self) { option in
                                    Button {
                                        viewModel.sortOption = option
                                    } label: {
                                        Label(option.rawValue, systemImage: option.icon)
                                    }
                                }
                            }

                            if isMultiSelectMode && !selectedDocuments.isEmpty {
                                Divider()

                                Button(role: .destructive) {
                                    Task {
                                        await deleteSelectedDocuments()
                                    }
                                } label: {
                                    Label("Delete Selected (\(selectedDocuments.count))", systemImage: "trash")
                                }
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingUploadSheet) {
                UploadDocumentView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                DocumentFiltersView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingCreateFolder) {
                CreateFolderView(viewModel: viewModel, parentFolder: viewModel.currentFolder)
            }
            .sheet(item: $viewModel.selectedDocument) { document in
                NavigationStack {
                    DocumentViewerView(document: document, viewModel: viewModel)
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
        }
    }

    // MARK: - Breadcrumb Navigation
    private var breadcrumbView: View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.xs) {
                Button {
                    viewModel.navigateToFolder(nil)
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "house.fill")
                            .font(.caption)
                        Text("Root")
                            .font(ModernTheme.Typography.caption1)
                    }
                    .foregroundColor(viewModel.currentFolder == nil ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                }

                if let currentFolder = viewModel.currentFolder {
                    ForEach(currentFolder.breadcrumbs, id: \.self) { crumb in
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)

                        Text(crumb)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(crumb == currentFolder.name ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.sm)
        }
    }

    // MARK: - Quick Filters
    private var quickFiltersView: View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(QuickFilter.allCases, id: \.self) { filter in
                    QuickFilterChip(
                        filter: filter,
                        isSelected: selectedQuickFilter == filter,
                        count: countForFilter(filter)
                    )
                    .onTapGesture {
                        selectedQuickFilter = filter
                        viewModel.applyQuickFilter(filter)
                        ModernTheme.Haptics.selection()
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, ModernTheme.Spacing.sm)
        }
        .background(ModernTheme.Colors.secondaryBackground)
    }

    private func countForFilter(_ filter: QuickFilter) -> Int {
        switch filter {
        case .all:
            return viewModel.currentFolderDocuments.count
        case .expiringSoon:
            return viewModel.currentFolderDocuments.filter { $0.isExpiringSoon }.count
        case .expired:
            return viewModel.currentFolderDocuments.filter { $0.isExpired }.count
        case .active:
            return viewModel.currentFolderDocuments.filter { $0.status == .active }.count
        case .pendingReview:
            return viewModel.currentFolderDocuments.filter { $0.status == .pending }.count
        }
    }

    // MARK: - Content View
    @ViewBuilder
    private var contentView: some View {
        if viewModel.currentFolderDocuments.isEmpty && viewModel.currentFolderSubfolders.isEmpty {
            emptyView
        } else {
            if viewModel.viewMode == .list {
                listView
            } else {
                gridView
            }
        }
    }

    // MARK: - List View
    private var listView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.md, pinnedViews: [.sectionHeaders]) {
                // Folders Section
                if !viewModel.currentFolderSubfolders.isEmpty {
                    Section {
                        ForEach(viewModel.currentFolderSubfolders) { folder in
                            FolderCard(folder: folder)
                                .onTapGesture {
                                    viewModel.navigateToFolder(folder)
                                }
                        }
                    } header: {
                        SectionHeader(
                            title: "Folders",
                            icon: "folder.fill",
                            color: ModernTheme.Colors.primary
                        )
                    }
                }

                // Documents Section
                if !viewModel.filteredDocuments.isEmpty {
                    Section {
                        ForEach(viewModel.filteredDocuments) { document in
                            DocumentListCard(
                                document: document,
                                isSelected: selectedDocuments.contains(document.id),
                                isMultiSelectMode: isMultiSelectMode,
                                viewModel: viewModel
                            )
                            .onTapGesture {
                                if isMultiSelectMode {
                                    toggleSelection(document.id)
                                } else {
                                    viewModel.previewDocument(document)
                                }
                            }
                        }
                    } header: {
                        SectionHeader(
                            title: "Documents",
                            icon: "doc.text.fill",
                            color: ModernTheme.Colors.primary
                        )
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Grid View
    private var gridView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.lg, pinnedViews: [.sectionHeaders]) {
                // Folders Section
                if !viewModel.currentFolderSubfolders.isEmpty {
                    Section {
                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: ModernTheme.Spacing.md),
                            GridItem(.flexible(), spacing: ModernTheme.Spacing.md)
                        ], spacing: ModernTheme.Spacing.md) {
                            ForEach(viewModel.currentFolderSubfolders) { folder in
                                FolderGridCard(folder: folder)
                                    .onTapGesture {
                                        viewModel.navigateToFolder(folder)
                                    }
                            }
                        }
                    } header: {
                        SectionHeader(
                            title: "Folders",
                            icon: "folder.fill",
                            color: ModernTheme.Colors.primary
                        )
                    }
                }

                // Documents Section
                if !viewModel.filteredDocuments.isEmpty {
                    Section {
                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: ModernTheme.Spacing.md),
                            GridItem(.flexible(), spacing: ModernTheme.Spacing.md),
                            GridItem(.flexible(), spacing: ModernTheme.Spacing.md)
                        ], spacing: ModernTheme.Spacing.md) {
                            ForEach(viewModel.filteredDocuments) { document in
                                DocumentGridCard(
                                    document: document,
                                    isSelected: selectedDocuments.contains(document.id),
                                    isMultiSelectMode: isMultiSelectMode
                                )
                                .onTapGesture {
                                    if isMultiSelectMode {
                                        toggleSelection(document.id)
                                    } else {
                                        viewModel.previewDocument(document)
                                    }
                                }
                            }
                        }
                    } header: {
                        SectionHeader(
                            title: "Documents",
                            icon: "doc.text.fill",
                            color: ModernTheme.Colors.primary
                        )
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Empty View
    private var emptyView: View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "folder")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Documents or Folders")
                .font(ModernTheme.Typography.title2)

            Text("Create a folder or upload documents to get started")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)

            HStack(spacing: ModernTheme.Spacing.md) {
                Button {
                    showingCreateFolder = true
                } label: {
                    Label("New Folder", systemImage: "folder.badge.plus")
                }
                .secondaryButton()

                Button {
                    viewModel.showingUploadSheet = true
                } label: {
                    Label("Upload", systemImage: "doc.badge.plus")
                }
                .primaryButton()
            }
            .padding(.horizontal, 40)
        }
        .padding()
    }

    // MARK: - Helper Methods
    private func toggleSelection(_ id: String) {
        if selectedDocuments.contains(id) {
            selectedDocuments.remove(id)
        } else {
            selectedDocuments.insert(id)
        }
        ModernTheme.Haptics.light()
    }

    private func deleteSelectedDocuments() async {
        for docId in selectedDocuments {
            if let document = viewModel.documents.first(where: { $0.id == docId }) {
                await viewModel.deleteDocument(document)
            }
        }
        selectedDocuments.removeAll()
        isMultiSelectMode = false
    }
}

// MARK: - Supporting Views

struct FolderCard: View {
    let folder: DocumentFolder

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Folder Icon
            ZStack {
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(folder.color.color.opacity(0.1))
                    .frame(width: 50, height: 50)

                Image(systemName: folder.icon ?? "folder.fill")
                    .font(.title2)
                    .foregroundColor(folder.color.color)
            }

            // Folder Info
            VStack(alignment: .leading, spacing: 4) {
                Text(folder.name)
                    .font(ModernTheme.Typography.bodyBold)
                    .lineLimit(1)

                HStack(spacing: ModernTheme.Spacing.xs) {
                    if folder.documentCount > 0 {
                        Label("\(folder.documentCount) docs", systemImage: "doc.text")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    if folder.subfolderCount > 0 {
                        Label("\(folder.subfolderCount) folders", systemImage: "folder")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    if folder.isShared {
                        Image(systemName: "person.2.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.info)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct FolderGridCard: View {
    let folder: DocumentFolder

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(folder.color.color.opacity(0.1))
                    .frame(height: 80)

                VStack {
                    Image(systemName: folder.icon ?? "folder.fill")
                        .font(.title)
                        .foregroundColor(folder.color.color)
                }
            }

            Text(folder.name)
                .font(ModernTheme.Typography.caption1)
                .fontWeight(.semibold)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(height: 30)

            Text("\(folder.documentCount) items")
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding(ModernTheme.Spacing.sm)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct DocumentListCard: View {
    let document: FleetDocument
    let isSelected: Bool
    let isMultiSelectMode: Bool
    @ObservedObject var viewModel: DocumentsViewModel

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Selection indicator
            if isMultiSelectMode {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
            }

            // Document Type Icon
            ZStack {
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(document.type.color.opacity(0.1))
                    .frame(width: 50, height: 50)

                Image(systemName: document.type.icon)
                    .font(.title3)
                    .foregroundColor(document.type.color)
            }

            // Document Info
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: ModernTheme.Spacing.xs) {
                    Text(document.name)
                        .font(ModernTheme.Typography.bodyBold)
                        .lineLimit(1)

                    if document.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.caption2)
                            .foregroundColor(.yellow)
                    }
                }

                HStack(spacing: ModernTheme.Spacing.xs) {
                    Label(document.type.rawValue, systemImage: document.category.icon)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    if document.isConfidential {
                        Image(systemName: "lock.fill")
                            .font(.caption2)
                            .foregroundColor(ModernTheme.Colors.warning)
                    }
                }

                if let expirationDate = document.formattedExpirationDate {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption2)

                        Text("Expires: \(expirationDate)")
                            .font(ModernTheme.Typography.caption2)
                    }
                    .foregroundColor(document.statusColor)
                }
            }

            Spacer()

            // Status and Size
            VStack(alignment: .trailing, spacing: 4) {
                Image(systemName: document.status.icon)
                    .foregroundColor(document.status.color)

                Text(document.formattedFileSize)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
        .contextMenu {
            DocumentContextMenu(document: document, viewModel: viewModel)
        }
    }
}

struct DocumentGridCard: View {
    let document: FleetDocument
    let isSelected: Bool
    let isMultiSelectMode: Bool

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            ZStack(alignment: .topTrailing) {
                // Document preview
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(document.type.color.opacity(0.1))
                    .frame(height: 100)
                    .overlay(
                        Image(systemName: document.type.icon)
                            .font(.largeTitle)
                            .foregroundColor(document.type.color)
                    )

                // Badges
                VStack(spacing: 4) {
                    if document.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                            .padding(4)
                            .background(Circle().fill(ModernTheme.Colors.background))
                    }

                    if isMultiSelectMode {
                        Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                            .font(.body)
                            .foregroundColor(isSelected ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                            .padding(4)
                            .background(Circle().fill(ModernTheme.Colors.background))
                    }
                }
                .padding(ModernTheme.Spacing.xs)
            }

            Text(document.name)
                .font(ModernTheme.Typography.caption1)
                .fontWeight(.semibold)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(height: 30)

            Text(document.formattedFileSize)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding(ModernTheme.Spacing.sm)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

// MARK: - Create Folder View
struct CreateFolderView: View {
    @ObservedObject var viewModel: DocumentsViewModel
    let parentFolder: DocumentFolder?
    @Environment(\.dismiss) private var dismiss

    @State private var folderName = ""
    @State private var selectedColor: FolderColor = .blue
    @State private var selectedIcon = "folder.fill"

    let iconOptions = ["folder.fill", "car.fill", "person.fill", "shield.fill", "doc.fill", "star.fill"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Folder Details") {
                    TextField("Folder Name", text: $folderName)

                    Picker("Color", selection: $selectedColor) {
                        ForEach(FolderColor.allCases, id: \.self) { color in
                            HStack {
                                Circle()
                                    .fill(color.color)
                                    .frame(width: 20, height: 20)
                                Text(color.rawValue)
                            }
                            .tag(color)
                        }
                    }

                    Picker("Icon", selection: $selectedIcon) {
                        ForEach(iconOptions, id: \.self) { icon in
                            Label(icon, systemImage: icon)
                                .tag(icon)
                        }
                    }
                }

                if let parent = parentFolder {
                    Section("Location") {
                        Label(parent.path, systemImage: "folder")
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .navigationTitle("New Folder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            await viewModel.createFolder(
                                name: folderName,
                                color: selectedColor,
                                icon: selectedIcon,
                                parentFolderId: parentFolder?.id
                            )
                            dismiss()
                        }
                    }
                    .disabled(folderName.isEmpty)
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    DocumentBrowserView()
}
