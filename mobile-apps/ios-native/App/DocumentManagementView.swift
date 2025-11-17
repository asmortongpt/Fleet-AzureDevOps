import SwiftUI
import PhotosUI
import VisionKit

struct DocumentManagementView: View {
    @StateObject private var viewModel = DocumentsViewModel()
    @State private var selectedQuickFilter: QuickFilter = .all
    @State private var showingFilters = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Quick Filters
                quickFiltersView

                // Content
                if viewModel.loadingState.isLoading && viewModel.documents.isEmpty {
                    ProgressView("Loading documents...")
                        .padding()
                } else if viewModel.filteredDocuments.isEmpty {
                    emptyDocumentsView
                } else {
                    documentsListView
                }
            }
            .navigationTitle("Documents")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
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

                        Button {
                            viewModel.showingExpirationCalendar = true
                        } label: {
                            Label("Expiration Calendar", systemImage: "calendar")
                        }

                        Button {
                            Task {
                                await viewModel.refresh()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingUploadSheet) {
                UploadDocumentView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                DocumentFiltersView(viewModel: viewModel)
            }
            .sheet(isPresented: $viewModel.showingExpirationCalendar) {
                ExpirationCalendarView(viewModel: viewModel)
            }
            .sheet(item: $viewModel.selectedDocument) { document in
                DocumentDetailView(document: document, viewModel: viewModel)
            }
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
            return viewModel.documents.count
        case .expiringSoon:
            return viewModel.expiringSoonDocuments.count
        case .expired:
            return viewModel.expiredDocuments.count
        case .active:
            return viewModel.activeDocuments.count
        case .pendingReview:
            return viewModel.documents.filter { $0.status == .pending }.count
        }
    }

    // MARK: - Documents List
    private var documentsListView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.md, pinnedViews: [.sectionHeaders]) {
                // Alerts Section
                if !viewModel.criticalAlerts.isEmpty {
                    Section {
                        ForEach(viewModel.criticalAlerts.prefix(3)) { alert in
                            ExpirationAlertCard(alert: alert)
                                .onTapGesture {
                                    if let document = viewModel.documents.first(where: { $0.id == alert.documentId }) {
                                        viewModel.previewDocument(document)
                                    }
                                }
                        }

                        if viewModel.criticalAlerts.count > 3 {
                            Button {
                                selectedQuickFilter = .expiringSoon
                                viewModel.applyQuickFilter(.expiringSoon)
                            } label: {
                                Text("View All \(viewModel.criticalAlerts.count) Alerts")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.primary)
                            }
                            .padding(.horizontal)
                        }
                    } header: {
                        SectionHeader(title: "Expiration Alerts", icon: "exclamationmark.triangle.fill", color: ModernTheme.Colors.error)
                    }
                }

                // Documents Section
                Section {
                    ForEach(viewModel.filteredDocuments) { document in
                        DocumentCard(document: document)
                            .onTapGesture {
                                viewModel.previewDocument(document)
                            }
                            .contextMenu {
                                DocumentContextMenu(document: document, viewModel: viewModel)
                            }
                    }
                } header: {
                    HStack {
                        SectionHeader(
                            title: "Documents",
                            icon: "doc.text.fill",
                            color: ModernTheme.Colors.primary
                        )

                        Spacer()

                        Text("\(viewModel.filteredDocuments.count)")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    private var emptyDocumentsView: View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Documents Found")
                .font(ModernTheme.Typography.title2)

            if viewModel.hasActiveFilters {
                Text("Try adjusting your filters")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                Button {
                    viewModel.clearFilters()
                    selectedQuickFilter = .all
                } label: {
                    Text("Clear Filters")
                }
                .primaryButton()
                .padding(.horizontal, 40)
            } else {
                Text("Upload your first document to get started")
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .multilineTextAlignment(.center)

                Button {
                    viewModel.showingUploadSheet = true
                } label: {
                    Text("Upload Document")
                }
                .primaryButton()
                .padding(.horizontal, 40)
            }
        }
        .padding()
    }
}

// MARK: - Supporting Views
struct QuickFilterChip: View {
    let filter: QuickFilter
    let isSelected: Bool
    let count: Int

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            Image(systemName: filter.icon)
                .font(.caption)

            Text(filter.rawValue)
                .font(ModernTheme.Typography.caption1)

            if count > 0 {
                Text("\(count)")
                    .font(ModernTheme.Typography.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(isSelected ? Color.white : filter.color.opacity(0.3))
                    )
                    .foregroundColor(isSelected ? filter.color : ModernTheme.Colors.primaryText)
            }
        }
        .padding(.horizontal, ModernTheme.Spacing.md)
        .padding(.vertical, ModernTheme.Spacing.sm)
        .background(
            Capsule()
                .fill(isSelected ? filter.color : ModernTheme.Colors.background)
        )
        .foregroundColor(isSelected ? .white : ModernTheme.Colors.primaryText)
        .overlay(
            Capsule()
                .stroke(filter.color, lineWidth: isSelected ? 0 : 1)
        )
    }
}

struct DocumentCard: View {
    let document: FleetDocument

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
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
                Text(document.name)
                    .font(ModernTheme.Typography.bodyBold)
                    .lineLimit(1)

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

            // Status Indicator
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
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct ExpirationAlertCard: View {
    let alert: DocumentExpirationAlert

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: alert.severity.icon)
                .font(.title2)
                .foregroundColor(alert.severity.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(alert.documentName)
                    .font(ModernTheme.Typography.bodyBold)
                    .lineLimit(1)

                Text(alert.relatedEntityName)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                Text(alert.message)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(alert.severity.color)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(alert.severity.color.opacity(0.1))
        )
    }
}

struct SectionHeader: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Label(title, systemImage: icon)
                .font(ModernTheme.Typography.title3)
                .foregroundColor(color)

            Spacer()
        }
        .padding(.vertical, ModernTheme.Spacing.xs)
        .background(ModernTheme.Colors.groupedBackground)
    }
}

struct DocumentContextMenu: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel

    var body: some View {
        Group {
            Button {
                viewModel.previewDocument(document)
            } label: {
                Label("View", systemImage: "eye")
            }

            Button {
                Task {
                    await viewModel.downloadDocument(document)
                }
            } label: {
                Label("Download", systemImage: "arrow.down.circle")
            }

            Divider()

            Button {
                Task {
                    await viewModel.archiveDocument(document)
                }
            } label: {
                Label("Archive", systemImage: "archivebox")
            }

            Button(role: .destructive) {
                Task {
                    await viewModel.deleteDocument(document)
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Upload Document View
struct UploadDocumentView: View {
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var documentName = ""
    @State private var selectedType: DocumentType = .other
    @State private var selectedCategory: DocumentCategory = .vehicle
    @State private var description = ""
    @State private var expirationDate = Date().addingTimeInterval(365 * 86400)
    @State private var hasExpiration = false
    @State private var relatedEntityType: RelatedEntityType = .vehicle
    @State private var relatedEntityId = ""
    @State private var relatedEntityName = ""
    @State private var isConfidential = false
    @State private var tags = ""
    @State private var selectedImage: PhotosPickerItem?
    @State private var uploadedFileData: Data?
    @State private var uploadedFileName = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Document Details") {
                    TextField("Document Name", text: $documentName)

                    Picker("Type", selection: $selectedType) {
                        ForEach(DocumentType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type)
                        }
                    }

                    Picker("Category", selection: $selectedCategory) {
                        ForEach(DocumentCategory.allCases, id: \.self) { category in
                            Label(category.rawValue, systemImage: category.icon)
                                .tag(category)
                        }
                    }

                    TextEditor(text: $description)
                        .frame(minHeight: 60)
                }

                Section("Expiration") {
                    Toggle("Has Expiration Date", isOn: $hasExpiration)

                    if hasExpiration {
                        DatePicker("Expiration Date", selection: $expirationDate, displayedComponents: .date)
                    }
                }

                Section("Related Entity") {
                    Picker("Entity Type", selection: $relatedEntityType) {
                        Text("Vehicle").tag(RelatedEntityType.vehicle)
                        Text("Driver").tag(RelatedEntityType.driver)
                        Text("Fleet").tag(RelatedEntityType.fleet)
                        Text("General").tag(RelatedEntityType.general)
                    }

                    TextField("Entity ID", text: $relatedEntityId)
                    TextField("Entity Name", text: $relatedEntityName)
                }

                Section("File") {
                    if let fileName = uploadedFileName.isEmpty ? nil : uploadedFileName {
                        Label(fileName, systemImage: "doc.fill")
                            .foregroundColor(ModernTheme.Colors.success)
                    }

                    PhotosPicker(selection: $selectedImage, matching: .any) {
                        Label("Choose File", systemImage: "doc.badge.plus")
                    }
                }

                Section("Additional Options") {
                    Toggle("Confidential", isOn: $isConfidential)
                    TextField("Tags (comma separated)", text: $tags)
                }
            }
            .navigationTitle("Upload Document")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Upload") {
                        uploadDocument()
                    }
                    .disabled(!isValid)
                }
            }
            .onChange(of: selectedImage) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self) {
                        uploadedFileData = data
                        uploadedFileName = "document.pdf"
                    }
                }
            }
            .onChange(of: selectedType) { _, newValue in
                hasExpiration = newValue.requiresExpiration
            }
        }
    }

    private var isValid: Bool {
        !documentName.isEmpty && !relatedEntityId.isEmpty &&
        !relatedEntityName.isEmpty && uploadedFileData != nil
    }

    private func uploadDocument() {
        guard let fileData = uploadedFileData else { return }

        let tagArray = tags.split(separator: ",").map { String($0.trimmingCharacters(in: .whitespaces)) }

        let request = DocumentUploadRequest(
            name: documentName,
            type: selectedType,
            category: selectedCategory,
            description: description.isEmpty ? nil : description,
            fileData: fileData,
            mimeType: "application/pdf",
            expirationDate: hasExpiration ? expirationDate : nil,
            reminderDate: hasExpiration ? Calendar.current.date(byAdding: .day, value: -30, to: expirationDate) : nil,
            relatedEntityType: relatedEntityType,
            relatedEntityId: relatedEntityId,
            relatedEntityName: relatedEntityName,
            tags: tagArray,
            isConfidential: isConfidential
        )

        Task {
            await viewModel.uploadDocument(request)
            dismiss()
        }
    }
}

// MARK: - Document Filters View
struct DocumentFiltersView: View {
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Sort By") {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(DocumentSortOption.allCases, id: \.self) { option in
                            Label(option.rawValue, systemImage: option.icon)
                                .tag(option)
                        }
                    }
                }

                Section("Document Type") {
                    ForEach(DocumentType.allCases, id: \.self) { type in
                        Toggle(isOn: Binding(
                            get: { viewModel.searchCriteria.types.contains(type) },
                            set: { isOn in
                                if isOn {
                                    viewModel.searchCriteria.types.insert(type)
                                } else {
                                    viewModel.searchCriteria.types.remove(type)
                                }
                            }
                        )) {
                            Label(type.rawValue, systemImage: type.icon)
                        }
                    }
                }

                Section("Category") {
                    ForEach(DocumentCategory.allCases, id: \.self) { category in
                        Toggle(isOn: Binding(
                            get: { viewModel.searchCriteria.categories.contains(category) },
                            set: { isOn in
                                if isOn {
                                    viewModel.searchCriteria.categories.insert(category)
                                } else {
                                    viewModel.searchCriteria.categories.remove(category)
                                }
                            }
                        )) {
                            Label(category.rawValue, systemImage: category.icon)
                        }
                    }
                }

                Section("Status") {
                    ForEach(DocumentStatus.allCases, id: \.self) { status in
                        Toggle(isOn: Binding(
                            get: { viewModel.searchCriteria.statuses.contains(status) },
                            set: { isOn in
                                if isOn {
                                    viewModel.searchCriteria.statuses.insert(status)
                                } else {
                                    viewModel.searchCriteria.statuses.remove(status)
                                }
                            }
                        )) {
                            Label(status.rawValue, systemImage: status.icon)
                        }
                    }
                }
            }
            .navigationTitle("Advanced Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Reset") {
                        viewModel.clearFilters()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Expiration Calendar View
struct ExpirationCalendarView: View {
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.expirationAlerts) { alert in
                    ExpirationAlertCard(alert: alert)
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                        .listRowBackground(Color.clear)
                        .onTapGesture {
                            if let document = viewModel.documents.first(where: { $0.id == alert.documentId }) {
                                viewModel.previewDocument(document)
                                dismiss()
                            }
                        }
                }
            }
            .listStyle(.plain)
            .navigationTitle("Expiration Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Document Detail View
struct DocumentDetailView: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    // Document Preview Placeholder
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .fill(ModernTheme.Colors.secondaryBackground)
                        .frame(height: 300)
                        .overlay(
                            VStack {
                                Image(systemName: document.type.icon)
                                    .font(.system(size: 60))
                                    .foregroundColor(document.type.color)

                                Text(document.fileExtension)
                                    .font(ModernTheme.Typography.title2)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            }
                        )

                    // Document Details
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        DetailRow(label: "Name", value: document.name)
                        DetailRow(label: "Type", value: document.type.rawValue)
                        DetailRow(label: "Category", value: document.category.rawValue)
                        DetailRow(label: "Size", value: document.formattedFileSize)
                        DetailRow(label: "Uploaded", value: document.formattedUploadDate)
                        DetailRow(label: "Uploaded By", value: document.uploadedBy)

                        if let expiration = document.formattedExpirationDate {
                            DetailRow(label: "Expires", value: expiration, valueColor: document.statusColor)
                        }

                        DetailRow(label: "Related To", value: document.relatedEntityName)

                        if let description = document.description {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Description")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)

                                Text(description)
                                    .font(ModernTheme.Typography.body)
                            }
                        }

                        if !document.tags.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Tags")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)

                                FlowLayout(spacing: 8) {
                                    ForEach(document.tags, id: \.self) { tag in
                                        Text(tag)
                                            .font(ModernTheme.Typography.caption2)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(ModernTheme.Colors.primary.opacity(0.1))
                                            .foregroundColor(ModernTheme.Colors.primary)
                                            .cornerRadius(ModernTheme.CornerRadius.sm)
                                    }
                                }
                            }
                        }
                    }
                    .modernCard()
                }
                .padding()
            }
            .navigationTitle("Document Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    var valueColor: Color = ModernTheme.Colors.primaryText

    var body: some View {
        HStack {
            Text(label)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.body)
                .foregroundColor(valueColor)
        }
    }
}

// Simple FlowLayout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.replacingUnspecifiedDimensions().width, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.frames[index].minX, y: bounds.minY + result.frames[index].minY), proposal: .unspecified)
        }
    }

    struct FlowResult {
        var frames: [CGRect] = []
        var size: CGSize = .zero

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                frames.append(CGRect(x: currentX, y: currentY, width: size.width, height: size.height))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
            }

            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Preview
#Preview {
    DocumentManagementView()
}
