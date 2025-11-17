import Foundation
import Combine
import SwiftUI
import UniformTypeIdentifiers

@MainActor
class DocumentsViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var documents: [FleetDocument] = []
    @Published var expirationAlerts: [DocumentExpirationAlert] = []
    @Published var stats: DocumentLibraryStats?
    @Published var selectedDocument: FleetDocument?
    @Published var showingUploadSheet = false
    @Published var showingDocumentScanner = false
    @Published var showingFilePicker = false
    @Published var showingExpirationCalendar = false
    @Published var searchCriteria = DocumentSearchCriteria()
    @Published var sortOption: DocumentSortOption = .uploadDateDescending

    // MARK: - Computed Properties
    var filteredDocuments: [FleetDocument] {
        var filtered = documents

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
                lastModifiedBy: nil
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
