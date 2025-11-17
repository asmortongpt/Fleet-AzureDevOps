//
//  OfflineStorage.swift
//  Fleet Manager - Offline Storage
//
//  Production-ready offline storage implementation using SQLite
//  Supports inspections, reports, photos, and operations queue
//

import Foundation
import SQLite3

// MARK: - Data Models

struct InspectionRecord: Codable {
    let id: String
    let vehicleId: String
    let driverId: String
    let timestamp: Date
    let inspectionType: String // pre-trip, post-trip, daily
    let checklistData: [String: Bool]
    let notes: String?
    let photoIds: [String]
    var syncStatus: SyncStatus
    var lastModified: Date
}

struct ReportRecord: Codable {
    let id: String
    let reportType: String // fuel, expense, incident, maintenance
    let vehicleId: String
    let driverId: String
    let timestamp: Date
    let amount: Double?
    let odometer: Int?
    let location: LocationData?
    let photoIds: [String]
    let ocrData: [String: Any]?
    var syncStatus: SyncStatus
    var lastModified: Date
}

struct PhotoRecord: Codable {
    let id: String
    let localPath: String
    let cloudUrl: String?
    let relatedRecordId: String
    let recordType: String
    let timestamp: Date
    let metadata: PhotoMetadata
    var syncStatus: SyncStatus
}

struct PhotoMetadata: Codable {
    let width: Int
    let height: Int
    let fileSize: Int64
    let mimeType: String
    let compressed: Bool
}

struct LocationData: Codable {
    let latitude: Double
    let longitude: Double
    let accuracy: Double
    let timestamp: Date
}

struct SyncOperation: Codable {
    let id: String
    let operationType: String // create, update, delete
    let recordType: String
    let recordId: String
    let payload: Data
    let timestamp: Date
    var retryCount: Int
    var lastAttempt: Date?
    var error: String?
}

enum SyncStatus: String, Codable {
    case pending = "pending"
    case syncing = "syncing"
    case synced = "synced"
    case conflict = "conflict"
    case error = "error"
}

// MARK: - Offline Storage Manager

class OfflineStorageManager {
    static let shared = OfflineStorageManager()
    private var db: OpaquePointer?
    private let dbPath: String
    private let photoStoragePath: String
    private let queue = DispatchQueue(label: "com.fleet.offlineStorage", qos: .userInitiated)

    private init() {
        // Setup database path
        let fileManager = FileManager.default
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        dbPath = documentsPath.appendingPathComponent("fleet_offline.db").path
        photoStoragePath = documentsPath.appendingPathComponent("offline_photos").path

        // Create photo storage directory
        try? fileManager.createDirectory(atPath: photoStoragePath, withIntermediateDirectories: true)

        initializeDatabase()
    }

    deinit {
        closeDatabase()
    }

    // MARK: - Database Initialization

    private func initializeDatabase() {
        queue.sync {
            if sqlite3_open(dbPath, &db) != SQLITE_OK {
                print("ERROR: Failed to open database at \(dbPath)")
                return
            }

            createTables()
            createIndexes()
        }
    }

    private func createTables() {
        // Inspections table
        let createInspectionsTable = """
        CREATE TABLE IF NOT EXISTS inspections (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL,
            driver_id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            inspection_type TEXT NOT NULL,
            checklist_data TEXT NOT NULL,
            notes TEXT,
            photo_ids TEXT,
            sync_status TEXT NOT NULL,
            last_modified INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
        """

        // Reports table
        let createReportsTable = """
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            report_type TEXT NOT NULL,
            vehicle_id TEXT NOT NULL,
            driver_id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            amount REAL,
            odometer INTEGER,
            location_data TEXT,
            photo_ids TEXT,
            ocr_data TEXT,
            sync_status TEXT NOT NULL,
            last_modified INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
        """

        // Photos table
        let createPhotosTable = """
        CREATE TABLE IF NOT EXISTS photos (
            id TEXT PRIMARY KEY,
            local_path TEXT NOT NULL,
            cloud_url TEXT,
            related_record_id TEXT NOT NULL,
            record_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            metadata TEXT NOT NULL,
            sync_status TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
        """

        // Sync operations queue
        let createSyncQueueTable = """
        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            operation_type TEXT NOT NULL,
            record_type TEXT NOT NULL,
            record_id TEXT NOT NULL,
            payload BLOB NOT NULL,
            timestamp INTEGER NOT NULL,
            retry_count INTEGER NOT NULL,
            last_attempt INTEGER,
            error TEXT,
            created_at INTEGER NOT NULL
        );
        """

        // Sync metadata (for tracking sync state)
        let createSyncMetadataTable = """
        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        """

        executeSQL(createInspectionsTable)
        executeSQL(createReportsTable)
        executeSQL(createPhotosTable)
        executeSQL(createSyncQueueTable)
        executeSQL(createSyncMetadataTable)
    }

    private func createIndexes() {
        let indexes = [
            "CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_id);",
            "CREATE INDEX IF NOT EXISTS idx_inspections_driver ON inspections(driver_id);",
            "CREATE INDEX IF NOT EXISTS idx_inspections_sync ON inspections(sync_status);",
            "CREATE INDEX IF NOT EXISTS idx_reports_vehicle ON reports(vehicle_id);",
            "CREATE INDEX IF NOT EXISTS idx_reports_driver ON reports(driver_id);",
            "CREATE INDEX IF NOT EXISTS idx_reports_sync ON reports(sync_status);",
            "CREATE INDEX IF NOT EXISTS idx_photos_record ON photos(related_record_id);",
            "CREATE INDEX IF NOT EXISTS idx_photos_sync ON photos(sync_status);",
            "CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(retry_count, last_attempt);"
        ]

        indexes.forEach { executeSQL($0) }
    }

    private func executeSQL(_ sql: String) {
        var statement: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
            if sqlite3_step(statement) != SQLITE_DONE {
                let error = String(cString: sqlite3_errmsg(db)!)
                print("ERROR: Failed to execute SQL: \(error)")
            }
        }
        sqlite3_finalize(statement)
    }

    // MARK: - Inspection Operations

    func saveInspection(_ inspection: InspectionRecord) -> Bool {
        var mutableInspection = inspection
        mutableInspection.lastModified = Date()

        let sql = """
        INSERT OR REPLACE INTO inspections
        (id, vehicle_id, driver_id, timestamp, inspection_type, checklist_data, notes, photo_ids, sync_status, last_modified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """

        guard let checklistJSON = try? JSONEncoder().encode(inspection.checklistData),
              let checklistString = String(data: checklistJSON, encoding: .utf8),
              let photoIdsJSON = try? JSONEncoder().encode(inspection.photoIds),
              let photoIdsString = String(data: photoIdsJSON, encoding: .utf8) else {
            return false
        }

        var statement: OpaquePointer?
        var success = false

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (inspection.id as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 2, (inspection.vehicleId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 3, (inspection.driverId as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 4, Int64(inspection.timestamp.timeIntervalSince1970))
                sqlite3_bind_text(statement, 5, (inspection.inspectionType as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 6, (checklistString as NSString).utf8String, -1, nil)
                if let notes = inspection.notes {
                    sqlite3_bind_text(statement, 7, (notes as NSString).utf8String, -1, nil)
                } else {
                    sqlite3_bind_null(statement, 7)
                }
                sqlite3_bind_text(statement, 8, (photoIdsString as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 9, (mutableInspection.syncStatus.rawValue as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 10, Int64(mutableInspection.lastModified.timeIntervalSince1970))
                sqlite3_bind_int64(statement, 11, Int64(Date().timeIntervalSince1970))

                success = sqlite3_step(statement) == SQLITE_DONE
            }
            sqlite3_finalize(statement)
        }

        if success {
            queueSyncOperation(type: "create", recordType: "inspection", recordId: inspection.id, payload: inspection)
        }

        return success
    }

    func getInspections(vehicleId: String? = nil, syncStatus: SyncStatus? = nil) -> [InspectionRecord] {
        var sql = "SELECT * FROM inspections WHERE 1=1"
        if let vehicleId = vehicleId {
            sql += " AND vehicle_id = '\(vehicleId)'"
        }
        if let syncStatus = syncStatus {
            sql += " AND sync_status = '\(syncStatus.rawValue)'"
        }
        sql += " ORDER BY timestamp DESC;"

        var inspections: [InspectionRecord] = []
        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                while sqlite3_step(statement) == SQLITE_ROW {
                    if let inspection = parseInspectionRow(statement!) {
                        inspections.append(inspection)
                    }
                }
            }
            sqlite3_finalize(statement)
        }

        return inspections
    }

    private func parseInspectionRow(_ statement: OpaquePointer) -> InspectionRecord? {
        guard let idStr = sqlite3_column_text(statement, 0),
              let vehicleIdStr = sqlite3_column_text(statement, 1),
              let driverIdStr = sqlite3_column_text(statement, 2),
              let typeStr = sqlite3_column_text(statement, 4),
              let checklistStr = sqlite3_column_text(statement, 5),
              let photoIdsStr = sqlite3_column_text(statement, 7),
              let syncStatusStr = sqlite3_column_text(statement, 8) else {
            return nil
        }

        let id = String(cString: idStr)
        let vehicleId = String(cString: vehicleIdStr)
        let driverId = String(cString: driverIdStr)
        let timestamp = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 3)))
        let inspectionType = String(cString: typeStr)
        let checklistData = try? JSONDecoder().decode([String: Bool].self, from: String(cString: checklistStr).data(using: .utf8)!)
        let notes = sqlite3_column_text(statement, 6).map { String(cString: $0) }
        let photoIds = try? JSONDecoder().decode([String].self, from: String(cString: photoIdsStr).data(using: .utf8)!)
        let syncStatus = SyncStatus(rawValue: String(cString: syncStatusStr)) ?? .pending
        let lastModified = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 9)))

        return InspectionRecord(
            id: id,
            vehicleId: vehicleId,
            driverId: driverId,
            timestamp: timestamp,
            inspectionType: inspectionType,
            checklistData: checklistData ?? [:],
            notes: notes,
            photoIds: photoIds ?? [],
            syncStatus: syncStatus,
            lastModified: lastModified
        )
    }

    // MARK: - Report Operations

    func saveReport(_ report: ReportRecord) -> Bool {
        var mutableReport = report
        mutableReport.lastModified = Date()

        let sql = """
        INSERT OR REPLACE INTO reports
        (id, report_type, vehicle_id, driver_id, timestamp, amount, odometer, location_data, photo_ids, ocr_data, sync_status, last_modified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """

        var statement: OpaquePointer?
        var success = false

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (report.id as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 2, (report.reportType as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 3, (report.vehicleId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 4, (report.driverId as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 5, Int64(report.timestamp.timeIntervalSince1970))

                if let amount = report.amount {
                    sqlite3_bind_double(statement, 6, amount)
                } else {
                    sqlite3_bind_null(statement, 6)
                }

                if let odometer = report.odometer {
                    sqlite3_bind_int(statement, 7, Int32(odometer))
                } else {
                    sqlite3_bind_null(statement, 7)
                }

                if let location = report.location,
                   let locationData = try? JSONEncoder().encode(location),
                   let locationString = String(data: locationData, encoding: .utf8) {
                    sqlite3_bind_text(statement, 8, (locationString as NSString).utf8String, -1, nil)
                } else {
                    sqlite3_bind_null(statement, 8)
                }

                if let photoIdsData = try? JSONEncoder().encode(report.photoIds),
                   let photoIdsString = String(data: photoIdsData, encoding: .utf8) {
                    sqlite3_bind_text(statement, 9, (photoIdsString as NSString).utf8String, -1, nil)
                } else {
                    sqlite3_bind_null(statement, 9)
                }

                sqlite3_bind_null(statement, 10) // ocr_data - stored as JSON string if needed
                sqlite3_bind_text(statement, 11, (mutableReport.syncStatus.rawValue as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 12, Int64(mutableReport.lastModified.timeIntervalSince1970))
                sqlite3_bind_int64(statement, 13, Int64(Date().timeIntervalSince1970))

                success = sqlite3_step(statement) == SQLITE_DONE
            }
            sqlite3_finalize(statement)
        }

        if success {
            queueSyncOperation(type: "create", recordType: "report", recordId: report.id, payload: report)
        }

        return success
    }

    func getReports(vehicleId: String? = nil, reportType: String? = nil, syncStatus: SyncStatus? = nil) -> [ReportRecord] {
        var sql = "SELECT * FROM reports WHERE 1=1"
        if let vehicleId = vehicleId {
            sql += " AND vehicle_id = '\(vehicleId)'"
        }
        if let reportType = reportType {
            sql += " AND report_type = '\(reportType)'"
        }
        if let syncStatus = syncStatus {
            sql += " AND sync_status = '\(syncStatus.rawValue)'"
        }
        sql += " ORDER BY timestamp DESC;"

        var reports: [ReportRecord] = []
        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                while sqlite3_step(statement) == SQLITE_ROW {
                    if let report = parseReportRow(statement!) {
                        reports.append(report)
                    }
                }
            }
            sqlite3_finalize(statement)
        }

        return reports
    }

    private func parseReportRow(_ statement: OpaquePointer) -> ReportRecord? {
        guard let idStr = sqlite3_column_text(statement, 0),
              let typeStr = sqlite3_column_text(statement, 1),
              let vehicleIdStr = sqlite3_column_text(statement, 2),
              let driverIdStr = sqlite3_column_text(statement, 3),
              let syncStatusStr = sqlite3_column_text(statement, 10) else {
            return nil
        }

        let id = String(cString: idStr)
        let reportType = String(cString: typeStr)
        let vehicleId = String(cString: vehicleIdStr)
        let driverId = String(cString: driverIdStr)
        let timestamp = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 4)))

        let amount: Double? = sqlite3_column_type(statement, 5) != SQLITE_NULL ? sqlite3_column_double(statement, 5) : nil
        let odometer: Int? = sqlite3_column_type(statement, 6) != SQLITE_NULL ? Int(sqlite3_column_int(statement, 6)) : nil

        var location: LocationData? = nil
        if let locationStr = sqlite3_column_text(statement, 7),
           let locationData = String(cString: locationStr).data(using: .utf8) {
            location = try? JSONDecoder().decode(LocationData.self, from: locationData)
        }

        var photoIds: [String] = []
        if let photoIdsStr = sqlite3_column_text(statement, 8),
           let photoIdsData = String(cString: photoIdsStr).data(using: .utf8) {
            photoIds = (try? JSONDecoder().decode([String].self, from: photoIdsData)) ?? []
        }

        let syncStatus = SyncStatus(rawValue: String(cString: syncStatusStr)) ?? .pending
        let lastModified = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 11)))

        return ReportRecord(
            id: id,
            reportType: reportType,
            vehicleId: vehicleId,
            driverId: driverId,
            timestamp: timestamp,
            amount: amount,
            odometer: odometer,
            location: location,
            photoIds: photoIds,
            ocrData: nil,
            syncStatus: syncStatus,
            lastModified: lastModified
        )
    }

    // MARK: - Photo Operations

    func savePhoto(_ image: Data, id: String, relatedRecordId: String, recordType: String, metadata: PhotoMetadata) -> PhotoRecord? {
        let localPath = "\(photoStoragePath)/\(id).jpg"

        // Save photo to disk
        guard (try? image.write(to: URL(fileURLWithPath: localPath))) != nil else {
            return nil
        }

        let photo = PhotoRecord(
            id: id,
            localPath: localPath,
            cloudUrl: nil,
            relatedRecordId: relatedRecordId,
            recordType: recordType,
            timestamp: Date(),
            metadata: metadata,
            syncStatus: .pending
        )

        let sql = """
        INSERT OR REPLACE INTO photos
        (id, local_path, cloud_url, related_record_id, record_type, timestamp, metadata, sync_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """

        guard let metadataData = try? JSONEncoder().encode(metadata),
              let metadataString = String(data: metadataData, encoding: .utf8) else {
            return nil
        }

        var statement: OpaquePointer?
        var success = false

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (id as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 2, (localPath as NSString).utf8String, -1, nil)
                sqlite3_bind_null(statement, 3)
                sqlite3_bind_text(statement, 4, (relatedRecordId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 5, (recordType as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 6, Int64(photo.timestamp.timeIntervalSince1970))
                sqlite3_bind_text(statement, 7, (metadataString as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 8, (photo.syncStatus.rawValue as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 9, Int64(Date().timeIntervalSince1970))

                success = sqlite3_step(statement) == SQLITE_DONE
            }
            sqlite3_finalize(statement)
        }

        return success ? photo : nil
    }

    func getPhoto(id: String) -> Data? {
        let sql = "SELECT local_path FROM photos WHERE id = ?;"
        var statement: OpaquePointer?
        var photoData: Data?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (id as NSString).utf8String, -1, nil)

                if sqlite3_step(statement) == SQLITE_ROW,
                   let pathStr = sqlite3_column_text(statement, 0) {
                    let path = String(cString: pathStr)
                    photoData = try? Data(contentsOf: URL(fileURLWithPath: path))
                }
            }
            sqlite3_finalize(statement)
        }

        return photoData
    }

    // MARK: - Sync Queue Operations

    private func queueSyncOperation<T: Codable>(type: String, recordType: String, recordId: String, payload: T) {
        guard let payloadData = try? JSONEncoder().encode(payload) else { return }

        let operation = SyncOperation(
            id: UUID().uuidString,
            operationType: type,
            recordType: recordType,
            recordId: recordId,
            payload: payloadData,
            timestamp: Date(),
            retryCount: 0,
            lastAttempt: nil,
            error: nil
        )

        let sql = """
        INSERT INTO sync_queue (id, operation_type, record_type, record_id, payload, timestamp, retry_count, last_attempt, error, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """

        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (operation.id as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 2, (type as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 3, (recordType as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 4, (recordId as NSString).utf8String, -1, nil)
                sqlite3_bind_blob(statement, 5, (payloadData as NSData).bytes, Int32(payloadData.count), nil)
                sqlite3_bind_int64(statement, 6, Int64(operation.timestamp.timeIntervalSince1970))
                sqlite3_bind_int(statement, 7, 0)
                sqlite3_bind_null(statement, 8)
                sqlite3_bind_null(statement, 9)
                sqlite3_bind_int64(statement, 10, Int64(Date().timeIntervalSince1970))

                _ = sqlite3_step(statement)
            }
            sqlite3_finalize(statement)
        }
    }

    func getPendingSyncOperations(limit: Int = 50) -> [SyncOperation] {
        let sql = """
        SELECT * FROM sync_queue
        WHERE retry_count < 5
        ORDER BY timestamp ASC
        LIMIT ?;
        """

        var operations: [SyncOperation] = []
        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_int(statement, 1, Int32(limit))

                while sqlite3_step(statement) == SQLITE_ROW {
                    if let operation = parseSyncOperationRow(statement!) {
                        operations.append(operation)
                    }
                }
            }
            sqlite3_finalize(statement)
        }

        return operations
    }

    private func parseSyncOperationRow(_ statement: OpaquePointer) -> SyncOperation? {
        guard let idStr = sqlite3_column_text(statement, 0),
              let opTypeStr = sqlite3_column_text(statement, 1),
              let recordTypeStr = sqlite3_column_text(statement, 2),
              let recordIdStr = sqlite3_column_text(statement, 3) else {
            return nil
        }

        let id = String(cString: idStr)
        let operationType = String(cString: opTypeStr)
        let recordType = String(cString: recordTypeStr)
        let recordId = String(cString: recordIdStr)

        let payloadBytes = sqlite3_column_blob(statement, 4)
        let payloadSize = sqlite3_column_bytes(statement, 4)
        let payload = Data(bytes: payloadBytes!, count: Int(payloadSize))

        let timestamp = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 5)))
        let retryCount = Int(sqlite3_column_int(statement, 6))

        var lastAttempt: Date? = nil
        if sqlite3_column_type(statement, 7) != SQLITE_NULL {
            lastAttempt = Date(timeIntervalSince1970: TimeInterval(sqlite3_column_int64(statement, 7)))
        }

        let error = sqlite3_column_text(statement, 8).map { String(cString: $0) }

        return SyncOperation(
            id: id,
            operationType: operationType,
            recordType: recordType,
            recordId: recordId,
            payload: payload,
            timestamp: timestamp,
            retryCount: retryCount,
            lastAttempt: lastAttempt,
            error: error
        )
    }

    func updateSyncOperation(id: String, retryCount: Int, error: String?) {
        let sql = """
        UPDATE sync_queue
        SET retry_count = ?, last_attempt = ?, error = ?
        WHERE id = ?;
        """

        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_int(statement, 1, Int32(retryCount))
                sqlite3_bind_int64(statement, 2, Int64(Date().timeIntervalSince1970))
                if let error = error {
                    sqlite3_bind_text(statement, 3, (error as NSString).utf8String, -1, nil)
                } else {
                    sqlite3_bind_null(statement, 3)
                }
                sqlite3_bind_text(statement, 4, (id as NSString).utf8String, -1, nil)

                _ = sqlite3_step(statement)
            }
            sqlite3_finalize(statement)
        }
    }

    func deleteSyncOperation(id: String) {
        let sql = "DELETE FROM sync_queue WHERE id = ?;"
        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (id as NSString).utf8String, -1, nil)
                _ = sqlite3_step(statement)
            }
            sqlite3_finalize(statement)
        }
    }

    // MARK: - Sync Metadata

    func setSyncMetadata(key: String, value: String) {
        let sql = """
        INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
        VALUES (?, ?, ?);
        """

        var statement: OpaquePointer?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (key as NSString).utf8String, -1, nil)
                sqlite3_bind_text(statement, 2, (value as NSString).utf8String, -1, nil)
                sqlite3_bind_int64(statement, 3, Int64(Date().timeIntervalSince1970))

                _ = sqlite3_step(statement)
            }
            sqlite3_finalize(statement)
        }
    }

    func getSyncMetadata(key: String) -> String? {
        let sql = "SELECT value FROM sync_metadata WHERE key = ?;"
        var statement: OpaquePointer?
        var value: String?

        queue.sync {
            if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
                sqlite3_bind_text(statement, 1, (key as NSString).utf8String, -1, nil)

                if sqlite3_step(statement) == SQLITE_ROW,
                   let valueStr = sqlite3_column_text(statement, 0) {
                    value = String(cString: valueStr)
                }
            }
            sqlite3_finalize(statement)
        }

        return value
    }

    // MARK: - Statistics

    func getStorageStats() -> [String: Any] {
        var stats: [String: Any] = [:]

        queue.sync {
            stats["inspections_total"] = getRecordCount(table: "inspections")
            stats["inspections_pending"] = getRecordCount(table: "inspections", condition: "sync_status = 'pending'")
            stats["reports_total"] = getRecordCount(table: "reports")
            stats["reports_pending"] = getRecordCount(table: "reports", condition: "sync_status = 'pending'")
            stats["photos_total"] = getRecordCount(table: "photos")
            stats["photos_pending"] = getRecordCount(table: "photos", condition: "sync_status = 'pending'")
            stats["sync_queue_size"] = getRecordCount(table: "sync_queue")
            stats["database_size_mb"] = getDatabaseSize()
        }

        return stats
    }

    private func getRecordCount(table: String, condition: String? = nil) -> Int {
        var sql = "SELECT COUNT(*) FROM \(table)"
        if let condition = condition {
            sql += " WHERE \(condition)"
        }
        sql += ";"

        var count = 0
        var statement: OpaquePointer?

        if sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK {
            if sqlite3_step(statement) == SQLITE_ROW {
                count = Int(sqlite3_column_int(statement, 0))
            }
        }
        sqlite3_finalize(statement)

        return count
    }

    private func getDatabaseSize() -> Double {
        if let attributes = try? FileManager.default.attributesOfItem(atPath: dbPath),
           let fileSize = attributes[.size] as? Int64 {
            return Double(fileSize) / 1024.0 / 1024.0
        }
        return 0.0
    }

    // MARK: - Database Management

    func closeDatabase() {
        queue.sync {
            if db != nil {
                sqlite3_close(db)
                db = nil
            }
        }
    }

    func vacuum() {
        executeSQL("VACUUM;")
    }

    func clearAllData() {
        let tables = ["inspections", "reports", "photos", "sync_queue", "sync_metadata"]
        tables.forEach { executeSQL("DELETE FROM \($0);") }

        // Clear photo storage
        if let files = try? FileManager.default.contentsOfDirectory(atPath: photoStoragePath) {
            files.forEach {
                try? FileManager.default.removeItem(atPath: "\(photoStoragePath)/\($0)")
            }
        }
    }
}
