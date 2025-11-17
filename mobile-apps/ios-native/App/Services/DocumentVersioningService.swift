import Foundation

class DocumentVersioningService {
    static let shared = DocumentVersioningService()
    private let storageKey = "document_versions"
    private init() {}

    func saveNewVersion(_ document: FleetDocument, file: Data, changes: String? = nil) async throws -> DocumentVersion {
        let versions = try await getVersionHistory(document.id)
        let nextVersion = (versions.max(by: { $0.version < $1.version })?.version ?? 0) + 1
        
        let newVersion = DocumentVersion(
            id: UUID().uuidString,
            documentId: document.id,
            version: nextVersion,
            uploadedBy: document.uploadedBy,
            uploadedAt: Date(),
            fileURL: nil,
            fileData: file,
            fileSize: Int64(file.count),
            changes: changes,
            mimeType: document.mimeType
        )
        
        try saveVersionToStorage(newVersion)
        return newVersion
    }

    func getVersionHistory(_ documentId: String) async throws -> [DocumentVersion] {
        guard let data = UserDefaults.standard.data(forKey: "\(storageKey)_\(documentId)") else {
            return []
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([DocumentVersion].self, from: data)
    }

    func restoreVersion(_ document: FleetDocument, version: Int) async throws -> FleetDocument {
        let versions = try await getVersionHistory(document.id)
        guard let targetVersion = versions.first(where: { $0.version == version }),
              let fileData = targetVersion.fileData else {
            throw VersioningError.versionNotFound
        }
        _ = try await saveNewVersion(document, file: fileData, changes: "Restored from version \(version)")
        return document
    }

    private func saveVersionToStorage(_ version: DocumentVersion) throws {
        var versions = (try? await getVersionHistory(version.documentId)) ?? []
        versions.append(version)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(versions)
        UserDefaults.standard.set(data, forKey: "\(storageKey)_\(version.documentId)")
    }
}

enum VersioningError: LocalizedError {
    case versionNotFound
    
    var errorDescription: String? {
        "Version not found"
    }
}
