import Foundation
import Combine
import SwiftUI
import UniformTypeIdentifiers

@MainActor
class DocumentsViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var documents: [FleetDocument] = []
    @Published var folders: [DocumentFolder] = []
    @Published var currentFolder: DocumentFolder?
    @Published var favoriteDocuments: [FleetDocument] = []
    @Published var recentDocuments: [FleetDocument] = []
    @Published var documentVersions: [String: [DocumentVersion]] = [:]
    @Published var annotations: [String: [DocumentAnnotation]] = [:]
    @Published var ocrResults: [String: OCRResult] = [:]
    @Published var expirationAlerts: [DocumentExpirationAlert] = []
    @Published var stats: DocumentLibraryStats?
    @Published var selectedDocument: FleetDocument?
    @Published var showingUploadSheet = false
    @Published var showingDocumentScanner = false
    @Published var showingFilePicker = false
    @Published var showingExpirationCalendar = false
    @Published var showingFolderManagement = false
    @Published var searchCriteria = DocumentSearchCriteria()
    @Published var sortOption: DocumentSortOption = .uploadDateDescending
    @Published var viewMode: ViewMode = .list
    @Published var uploadProgress: Double = 0.0
    @Published var isUploading = false

    // MARK: - Computed Properties
    var currentFolderDocuments: [FleetDocument] {
        if let folderId = currentFolder?.id {
            return documents.filter { $0.folderId == folderId }
        } else {
            return documents.filter { $0.folderId == nil }
        }
    }

    var currentFolderSubfolders: [DocumentFolder] {
        if let folderId = currentFolder?.id {
            return folders.filter { $0.parentFolderId == folderId }
        } else {
            return folders.filter { $0.parentFolderId == nil }
        }
    }

    var filteredDocuments: [FleetDocument] {
        var filtered = currentFolderDocuments

        // Apply search criteria
        if !searchCriteria.query.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchCriteria.query) ||
                $0.description?.localizedCaseInsensitiveContains(searchCriteria.query) ?? false ||
                $0.relatedEntityName.localizedCaseInsensitiveContains(searchCriteria.query)
            }
        }

        if !searchCriteria.types.isEmpty {
            filtered = filtered.filter { searchCriteria.types.contains($0.type) }
        }

        if !searchCriteria.categories.isEmpty {
            filtered = filtered.filter { searchCriteria.categories.contains($0.category) }
        }

        if !searchCriteria.statuses.isEmpty {
            filtered = filtered.filter { searchCriteria.statuses.contains($0.status) }
        }

        if let entityType = searchCriteria.relatedEntityType {
            filtered = filtered.filter { $0.relatedEntityType == entityType }
        }

        if let entityId = searchCriteria.relatedEntityId {
            filtered = filtered.filter { $0.relatedEntityId == entityId }
        }

        if searchCriteria.expiringOnly {
            filtered = filtered.filter { $0.isExpiringSoon }
        }

        if searchCriteria.expiredOnly {
            filtered = filtered.filter { $0.isExpired }
        }

        if let afterDate = searchCriteria.uploadedAfter {
            filtered = filtered.filter { $0.uploadedDate >= afterDate }
        }

        if let beforeDate = searchCriteria.uploadedBefore {
            filtered = filtered.filter { $0.uploadedDate <= beforeDate }
        }

        if !searchCriteria.tags.isEmpty {
            filtered = filtered.filter { doc in
                !Set(doc.tags).isDisjoint(with: searchCriteria.tags)
            }
        }

        // Apply sorting
        return sortDocuments(filtered, by: sortOption)
    }

    var activeDocuments: [FleetDocument] {
        documents.filter { $0.status == .active && !$0.isExpired }
    }

    var expiredDocuments: [FleetDocument] {
        documents.filter { $0.isExpired }
    }

    var expiringSoonDocuments: [FleetDocument] {
        documents.filter { $0.isExpiringSoon }
    }

    var documentsByCategory: [DocumentCategory: [FleetDocument]] {
        Dictionary(grouping: documents) { $0.category }
    }

    var documentsByType: [DocumentType: [FleetDocument]] {
        Dictionary(grouping: documents) { $0.type }
    }

    var criticalAlerts: [DocumentExpirationAlert] {
        expirationAlerts.filter { $0.severity == .critical || $0.severity == .high }
    }

    var hasActiveFilters: Bool {
        searchCriteria.isActive
    }

    // MARK: - Initialization
    override init() {
        super.init()
        Task {
            await loadInitialData()
        }
    }

    // MARK: - Data Loading
    func loadInitialData() async {
        await refresh()
    }

    override func refresh() async {
        startRefreshing()

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadDocuments() }
            group.addTask { await self.loadFolders() }
            group.addTask { await self.loadFavorites() }
            group.addTask { await self.loadRecentDocuments() }
            group.addTask { await self.loadStats() }
        }

        generateExpirationAlerts()
        finishRefreshing()
    }

    func loadDocuments() async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 500_000_000)

            let mockDocuments = generateMockDocuments()

            await MainActor.run {
                self.documents = mockDocuments
                self.finishLoading()
            }
        } catch {
            handleError(error)
        }
    }

    func loadStats() async {
        do {
            // Simulate API call
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockStats = generateMockStats()

            await MainActor.run {
                self.stats = mockStats
            }
        } catch {
            print("Error loading stats: \(error)")
        }
    }

    private func generateExpirationAlerts() {
        expirationAlerts = documents.compactMap { DocumentExpirationAlert.from(document: $0) }
            .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
    }

    // MARK: - CRUD Operations
    func uploadDocument(_ request: DocumentUploadRequest) async {
        do {
            startLoading()

            // Simulate API call
            try await Task.sleep(nanoseconds: 800_000_000)

            let newDocument = FleetDocument(
                id: UUID().uuidString,
                name: request.name,
                type: request.type,
                category: request.category,
                description: request.description,
                fileUrl: nil,
                fileData: request.fileData,
                fileSize: Int64(request.fileData.count),
                mimeType: request.mimeType,
                uploadedDate: Date(),
                uploadedBy: "Current User",
                expirationDate: request.expirationDate,
                reminderDate: request.reminderDate,
                relatedEntityType: request.relatedEntityType,
                relatedEntityId: request.relatedEntityId,
                relatedEntityName: request.relatedEntityName,
                tags: request.tags,
                status: .active,
                version: 1,
                isConfidential: request.isConfidential,
                lastModifiedDate: nil,
                lastModifiedBy: nil
            )

            await MainActor.run {
                self.documents.insert(newDocument, at: 0)
                self.finishLoading()
                self.showingUploadSheet = false
                ModernTheme.Haptics.success()
            }

            generateExpirationAlerts()
            await loadStats()
        } catch {
            handleError(error)
        }
    }

    func updateDocument(_ document: FleetDocument) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.documents.firstIndex(where: { $0.id == document.id }) {
                    self.documents[index] = document
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            generateExpirationAlerts()
        } catch {
            handleError(error)
        }
    }

    func deleteDocument(_ document: FleetDocument) async {
        do {
            startLoading()

            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.documents.removeAll { $0.id == document.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }

            generateExpirationAlerts()
            await loadStats()
        } catch {
            handleError(error)
        }
    }

    func archiveDocument(_ document: FleetDocument) async {
        var updated = document
        updated.status = .archived
        await updateDocument(updated)
    }

    // MARK: - Document Actions
    func downloadDocument(_ document: FleetDocument) async {
        // Implement download logic
        ModernTheme.Haptics.light()
    }

    func shareDocument(_ document: FleetDocument) -> [Any] {
        // Return items for share sheet
        var items: [Any] = [document.name]
        if let fileData = document.fileData {
            items.append(fileData)
        }
        return items
    }

    func previewDocument(_ document: FleetDocument) {
        selectedDocument = document
        ModernTheme.Haptics.light()
    }

    // MARK: - Sorting
    private func sortDocuments(_ documents: [FleetDocument], by option: DocumentSortOption) -> [FleetDocument] {
        switch option {
        case .uploadDateDescending:
            return documents.sorted { $0.uploadedDate > $1.uploadedDate }
        case .uploadDateAscending:
            return documents.sorted { $0.uploadedDate < $1.uploadedDate }
        case .expirationDateAscending:
            return documents.sorted {
                guard let date1 = $0.expirationDate, let date2 = $1.expirationDate else {
                    return $0.expirationDate != nil
                }
                return date1 < date2
            }
        case .expirationDateDescending:
            return documents.sorted {
                guard let date1 = $0.expirationDate, let date2 = $1.expirationDate else {
                    return $0.expirationDate == nil
                }
                return date1 > date2
            }
        case .nameAscending:
            return documents.sorted { $0.name < $1.name }
        case .nameDescending:
            return documents.sorted { $0.name > $1.name }
        case .type:
            return documents.sorted { $0.type.rawValue < $1.type.rawValue }
        case .category:
            return documents.sorted { $0.category.rawValue < $1.category.rawValue }
        }
    }

    // MARK: - Search and Filters
    func applyQuickFilter(_ filter: QuickFilter) {
        searchCriteria.reset()

        switch filter {
        case .expiringSoon:
            searchCriteria.expiringOnly = true
        case .expired:
            searchCriteria.expiredOnly = true
        case .active:
            searchCriteria.statuses = [.active]
        case .pendingReview:
            searchCriteria.statuses = [.pending]
        case .all:
            break
        }
    }

    func clearFilters() {
        searchCriteria.reset()
        searchText = ""
    }

    override func performSearch() {
        searchCriteria.query = searchText
        isSearching = !searchText.isEmpty
    }

    override func clearSearch() {
        super.clearSearch()
        searchCriteria.query = ""
    }

    // MARK: - Expiration Reminders
    func scheduleExpirationReminder(for document: FleetDocument, daysBeforeExpiration: Int) async {
        // Implement push notification scheduling
        guard let expirationDate = document.expirationDate else { return }

        let reminderDate = Calendar.current.date(
            byAdding: .day,
            value: -daysBeforeExpiration,
            to: expirationDate
        )

        var updated = document
        updated.reminderDate = reminderDate

        await updateDocument(updated)
    }

    // MARK: - Mock Data Generation
    private func generateMockDocuments() -> [FleetDocument] {
        let vehicleIds = ["VEH-001", "VEH-002", "VEH-003", "VEH-004", "VEH-005"]
        let driverNames = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]
        let uploaders = ["Admin User", "Fleet Manager", "Compliance Officer"]

        var documents: [FleetDocument] = []

        // Generate various document types
        for i in 0..<30 {
            let type = DocumentType.allCases.randomElement()!
            let category = DocumentCategory.allCases.randomElement()!
            let entityType: RelatedEntityType = i % 3 == 0 ? .driver : .vehicle
            let entityId = entityType == .vehicle ? vehicleIds.randomElement()! : "DRV-00\(i % 5 + 1)"
            let entityName = entityType == .vehicle ? "Vehicle \(entityId)" : driverNames.randomElement()!

            let uploadDate = Date().addingTimeInterval(Double(-i * 86400 * 7))

            var expirationDate: Date?
            if type.requiresExpiration {
                let daysUntilExpiration = Int.random(in: -30...365)
                expirationDate = Date().addingTimeInterval(Double(daysUntilExpiration * 86400))
            }

            let document = FleetDocument(
                id: "DOC-\(String(format: "%03d", i))",
                name: "\(type.rawValue)_\(entityId).pdf",
                type: type,
                category: category,
                description: "Document for \(entityName)",
                fileUrl: nil,
                fileSize: Int64.random(in: 100_000...5_000_000),
                mimeType: "application/pdf",
                uploadedDate: uploadDate,
                uploadedBy: uploaders.randomElement()!,
                expirationDate: expirationDate,
                reminderDate: expirationDate?.addingTimeInterval(-30 * 86400),
                relatedEntityType: entityType,
                relatedEntityId: entityId,
                relatedEntityName: entityName,
                tags: [type.rawValue.lowercased(), String(Calendar.current.component(.year, from: Date()))],
                status: expirationDate != nil && expirationDate! < Date() ? .expired : .active,
                version: 1,
                isConfidential: i % 5 == 0,
                lastModifiedDate: nil,
                lastModifiedBy: nil,
                folderId: i % 4 == 0 ? "folder-\((i % 3) + 1)" : nil,
                isFavorite: i % 7 == 0
            )

            documents.append(document)
        }

        return documents
    }

    private func generateMockStats() -> DocumentLibraryStats {
        let byType = Dictionary(grouping: documents) { $0.type.rawValue }
            .mapValues { $0.count }

        let byCategory = Dictionary(grouping: documents) { $0.category.rawValue }
            .mapValues { $0.count }

        let totalStorage = documents.reduce(0) { $0 + $1.fileSize }

        return DocumentLibraryStats(
            totalDocuments: documents.count,
            activeDocuments: activeDocuments.count,
            expiredDocuments: expiredDocuments.count,
            expiringSoonDocuments: expiringSoonDocuments.count,
            documentsByType: byType,
            documentsByCategory: byCategory,
            totalStorageUsed: totalStorage,
            recentUploads: documents.filter {
                $0.uploadedDate > Date().addingTimeInterval(-7 * 86400)
            }.count,
            pendingReview: documents.filter { $0.status == .pending }.count
        )
    }

    // MARK: - Folder Management
    func loadFolders() async {
        do {
            try await Task.sleep(nanoseconds: 300_000_000)
            let mockFolders = generateMockFolders()
            await MainActor.run {
                self.folders = mockFolders
            }
        } catch {
            print("Error loading folders: \(error)")
        }
    }

    func createFolder(name: String, color: FolderColor, icon: String?, parentFolderId: String?) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 300_000_000)

            let parentPath = folders.first(where: { $0.id == parentFolderId })?.path ?? ""
            let newPath = parentPath.isEmpty ? "/\(name)" : "\(parentPath)/\(name)"

            let newFolder = DocumentFolder(
                id: UUID().uuidString,
                name: name,
                color: color,
                icon: icon,
                parentFolderId: parentFolderId,
                path: newPath,
                createdDate: Date(),
                createdBy: "Current User",
                modifiedDate: nil,
                modifiedBy: nil,
                documentCount: 0,
                subfolderCount: 0,
                isShared: false,
                permissions: .default
            )

            await MainActor.run {
                self.folders.append(newFolder)
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func renameFolder(_ folder: DocumentFolder, newName: String) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                if let index = self.folders.firstIndex(where: { $0.id == folder.id }) {
                    var updated = folder
                    updated = DocumentFolder(
                        id: folder.id,
                        name: newName,
                        color: folder.color,
                        icon: folder.icon,
                        parentFolderId: folder.parentFolderId,
                        path: folder.path.replacingOccurrences(of: folder.name, with: newName),
                        createdDate: folder.createdDate,
                        createdBy: folder.createdBy,
                        modifiedDate: Date(),
                        modifiedBy: "Current User",
                        documentCount: folder.documentCount,
                        subfolderCount: folder.subfolderCount,
                        isShared: folder.isShared,
                        permissions: folder.permissions
                    )
                    self.folders[index] = updated
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func deleteFolder(_ folder: DocumentFolder) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 300_000_000)

            await MainActor.run {
                self.folders.removeAll { $0.id == folder.id || $0.parentFolderId == folder.id }
                self.documents.removeAll { $0.folderId == folder.id }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func moveDocument(_ document: FleetDocument, toFolder folder: DocumentFolder?) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 200_000_000)

            await MainActor.run {
                if let index = self.documents.firstIndex(where: { $0.id == document.id }) {
                    var updated = document
                    updated = FleetDocument(
                        id: document.id,
                        name: document.name,
                        type: document.type,
                        category: document.category,
                        description: document.description,
                        fileUrl: document.fileUrl,
                        fileData: document.fileData,
                        fileSize: document.fileSize,
                        mimeType: document.mimeType,
                        uploadedDate: document.uploadedDate,
                        uploadedBy: document.uploadedBy,
                        expirationDate: document.expirationDate,
                        reminderDate: document.reminderDate,
                        relatedEntityType: document.relatedEntityType,
                        relatedEntityId: document.relatedEntityId,
                        relatedEntityName: document.relatedEntityName,
                        tags: document.tags,
                        status: document.status,
                        version: document.version,
                        isConfidential: document.isConfidential,
                        lastModifiedDate: Date(),
                        lastModifiedBy: "Current User",
                        folderId: folder?.id,
                        isFavorite: document.isFavorite
                    )
                    self.documents[index] = updated
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    func navigateToFolder(_ folder: DocumentFolder?) {
        currentFolder = folder
        ModernTheme.Haptics.light()
    }

    func navigateUp() {
        if let current = currentFolder, let parentId = current.parentFolderId {
            currentFolder = folders.first(where: { $0.id == parentId })
        } else {
            currentFolder = nil
        }
        ModernTheme.Haptics.light()
    }

    private func generateMockFolders() -> [DocumentFolder] {
        [
            DocumentFolder(
                id: "folder-1",
                name: "Vehicle Documents",
                color: .blue,
                icon: "car.fill",
                parentFolderId: nil,
                path: "/Vehicle Documents",
                createdDate: Date().addingTimeInterval(-86400 * 60),
                createdBy: "Admin",
                modifiedDate: nil,
                modifiedBy: nil,
                documentCount: 12,
                subfolderCount: 2,
                isShared: false,
                permissions: .default
            ),
            DocumentFolder(
                id: "folder-2",
                name: "Driver Records",
                color: .green,
                icon: "person.fill",
                parentFolderId: nil,
                path: "/Driver Records",
                createdDate: Date().addingTimeInterval(-86400 * 45),
                createdBy: "Admin",
                modifiedDate: nil,
                modifiedBy: nil,
                documentCount: 8,
                subfolderCount: 1,
                isShared: false,
                permissions: .default
            ),
            DocumentFolder(
                id: "folder-3",
                name: "Insurance",
                color: .purple,
                icon: "shield.fill",
                parentFolderId: nil,
                path: "/Insurance",
                createdDate: Date().addingTimeInterval(-86400 * 30),
                createdBy: "Admin",
                modifiedDate: nil,
                modifiedBy: nil,
                documentCount: 5,
                subfolderCount: 0,
                isShared: true,
                permissions: .default
            )
        ]
    }

    // MARK: - Favorites
    func loadFavorites() async {
        favoriteDocuments = documents.filter { $0.isFavorite }
    }

    func toggleFavorite(_ document: FleetDocument) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 200_000_000)

            await MainActor.run {
                if let index = self.documents.firstIndex(where: { $0.id == document.id }) {
                    var updated = document
                    updated = FleetDocument(
                        id: document.id,
                        name: document.name,
                        type: document.type,
                        category: document.category,
                        description: document.description,
                        fileUrl: document.fileUrl,
                        fileData: document.fileData,
                        fileSize: document.fileSize,
                        mimeType: document.mimeType,
                        uploadedDate: document.uploadedDate,
                        uploadedBy: document.uploadedBy,
                        expirationDate: document.expirationDate,
                        reminderDate: document.reminderDate,
                        relatedEntityType: document.relatedEntityType,
                        relatedEntityId: document.relatedEntityId,
                        relatedEntityName: document.relatedEntityName,
                        tags: document.tags,
                        status: document.status,
                        version: document.version,
                        isConfidential: document.isConfidential,
                        lastModifiedDate: document.lastModifiedDate,
                        lastModifiedBy: document.lastModifiedBy,
                        folderId: document.folderId,
                        isFavorite: !document.isFavorite
                    )
                    self.documents[index] = updated
                }
                self.finishLoading()
                ModernTheme.Haptics.light()
            }

            await loadFavorites()
        } catch {
            handleError(error)
        }
    }

    // MARK: - Recent Documents
    func loadRecentDocuments() async {
        recentDocuments = documents.sorted { $0.uploadedDate > $1.uploadedDate }.prefix(10).map { $0 }
    }

    func recordDocumentAccess(_ document: FleetDocument, action: DocumentAction) async {
        // In production, this would record to backend
        await loadRecentDocuments()
    }

    // MARK: - Version Control
    func loadVersionHistory(for document: FleetDocument) async {
        do {
            try await Task.sleep(nanoseconds: 300_000_000)

            let mockVersions = generateMockVersions(for: document)

            await MainActor.run {
                self.documentVersions[document.id] = mockVersions
            }
        } catch {
            print("Error loading version history: \(error)")
        }
    }

    func uploadNewVersion(_ document: FleetDocument, fileData: Data, changeDescription: String?) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 500_000_000)

            let nextVersion = (documentVersions[document.id]?.count ?? 0) + 1

            let newVersion = DocumentVersion(
                id: UUID().uuidString,
                documentId: document.id,
                versionNumber: nextVersion,
                fileName: document.name,
                fileSize: Int64(fileData.count),
                uploadedDate: Date(),
                uploadedBy: "Current User",
                changeDescription: changeDescription,
                fileUrl: nil
            )

            await MainActor.run {
                if self.documentVersions[document.id] != nil {
                    self.documentVersions[document.id]?.insert(newVersion, at: 0)
                } else {
                    self.documentVersions[document.id] = [newVersion]
                }
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    private func generateMockVersions(for document: FleetDocument) -> [DocumentVersion] {
        (1...3).map { i in
            DocumentVersion(
                id: "version-\(document.id)-\(i)",
                documentId: document.id,
                versionNumber: 4 - i,
                fileName: document.name,
                fileSize: document.fileSize,
                uploadedDate: Date().addingTimeInterval(-Double(i * 86400 * 7)),
                uploadedBy: i == 1 ? "Current User" : "Admin",
                changeDescription: i == 1 ? "Updated compliance info" : nil,
                fileUrl: nil
            )
        }
    }

    // MARK: - OCR Text Extraction
    func performOCR(on document: FleetDocument) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 1_000_000_000)

            let mockOCR = OCRResult(
                id: UUID().uuidString,
                documentId: document.id,
                extractedText: "Sample extracted text from \(document.name). This is where OCR results would appear.",
                confidence: 0.95,
                language: "en",
                processedDate: Date(),
                pageNumber: 1
            )

            await MainActor.run {
                self.ocrResults[document.id] = mockOCR
                self.finishLoading()
                ModernTheme.Haptics.success()
            }
        } catch {
            handleError(error)
        }
    }

    // MARK: - Annotations
    func loadAnnotations(for document: FleetDocument) async {
        do {
            try await Task.sleep(nanoseconds: 200_000_000)

            let mockAnnotations = generateMockAnnotations(for: document)

            await MainActor.run {
                self.annotations[document.id] = mockAnnotations
            }
        } catch {
            print("Error loading annotations: \(error)")
        }
    }

    func addAnnotation(_ annotation: DocumentAnnotation) async {
        do {
            startLoading()
            try await Task.sleep(nanoseconds: 200_000_000)

            await MainActor.run {
                if self.annotations[annotation.documentId] != nil {
                    self.annotations[annotation.documentId]?.append(annotation)
                } else {
                    self.annotations[annotation.documentId] = [annotation]
                }
                self.finishLoading()
                ModernTheme.Haptics.light()
            }
        } catch {
            handleError(error)
        }
    }

    private func generateMockAnnotations(for document: FleetDocument) -> [DocumentAnnotation] {
        [
            DocumentAnnotation(
                id: UUID().uuidString,
                documentId: document.id,
                pageNumber: 1,
                type: .highlight,
                content: nil,
                coordinates: AnnotationCoordinates(x: 100, y: 200, width: 200, height: 20, path: nil),
                color: "yellow",
                createdBy: "Current User",
                createdDate: Date()
            )
        ]
    }
}

// MARK: - Supporting Types
enum DocumentSortOption: String, CaseIterable {
    case uploadDateDescending = "Upload Date (Newest)"
    case uploadDateAscending = "Upload Date (Oldest)"
    case expirationDateAscending = "Expiration (Soonest)"
    case expirationDateDescending = "Expiration (Latest)"
    case nameAscending = "Name (A-Z)"
    case nameDescending = "Name (Z-A)"
    case type = "Type"
    case category = "Category"

    var icon: String {
        switch self {
        case .uploadDateDescending, .uploadDateAscending:
            return "calendar"
        case .expirationDateAscending, .expirationDateDescending:
            return "clock"
        case .nameAscending, .nameDescending:
            return "textformat"
        case .type:
            return "doc.text"
        case .category:
            return "folder"
        }
    }
}

enum QuickFilter: String, CaseIterable {
    case all = "All"
    case expiringSoon = "Expiring Soon"
    case expired = "Expired"
    case active = "Active"
    case pendingReview = "Pending Review"

    var icon: String {
        switch self {
        case .all: return "doc.on.doc"
        case .expiringSoon: return "clock.badge.exclamationmark"
        case .expired: return "xmark.circle"
        case .active: return "checkmark.circle"
        case .pendingReview: return "hourglass"
        }
    }

    var color: Color {
        switch self {
        case .all: return ModernTheme.Colors.primary
        case .expiringSoon: return ModernTheme.Colors.warning
        case .expired: return ModernTheme.Colors.error
        case .active: return ModernTheme.Colors.success
        case .pendingReview: return ModernTheme.Colors.info
        }
    }
}

enum ViewMode: String, CaseIterable {
    case list = "List"
    case grid = "Grid"

    var icon: String {
        switch self {
        case .list: return "list.bullet"
        case .grid: return "square.grid.2x2"
        }
    }
}
