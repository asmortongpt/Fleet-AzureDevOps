import Foundation

class DocumentSharingService {
    static let shared = DocumentSharingService()
    private let storageKey = "document_sharing"
    private init() {}

    func shareDocument(_ document: FleetDocument, with users: [String], permissions: SharingPermissions) async throws -> [DocumentSharing] {
        var shares: [DocumentSharing] = []
        for user in users {
            let sharing = DocumentSharing(
                id: UUID().uuidString,
                documentId: document.id,
                documentName: document.name,
                sharedWith: user,
                sharedBy: document.uploadedBy,
                sharedAt: Date(),
                permissions: permissions,
                status: .active
            )
            shares.append(sharing)
        }
        return shares
    }

    func revokeAccess(_ documentId: String, from userId: String) async throws {
        // Implementation
    }

    func getSharedDocuments(for userId: String) async throws -> [DocumentSharing] {
        return []
    }

    func hasAccess(_ userId: String, to documentId: String) async throws -> Bool {
        return true
    }
}
