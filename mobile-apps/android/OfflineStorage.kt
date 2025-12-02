/**
 * OfflineStorage.kt
 * Fleet Manager - Offline Storage for Android
 *
 * Production-ready offline storage implementation using SQLite
 * Supports inspections, reports, photos, and operations queue
 */

package com.fleet.manager.storage

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import java.util.*

// MARK: - Data Models

data class InspectionRecord(
    val id: String,
    val vehicleId: String,
    val driverId: String,
    val timestamp: Long,
    val inspectionType: String, // pre-trip, post-trip, daily
    val checklistData: Map<String, Boolean>,
    val notes: String? = null,
    val photoIds: List<String>,
    var syncStatus: SyncStatus,
    var lastModified: Long
)

data class ReportRecord(
    val id: String,
    val reportType: String, // fuel, expense, incident, maintenance
    val vehicleId: String,
    val driverId: String,
    val timestamp: Long,
    val amount: Double? = null,
    val odometer: Int? = null,
    val location: LocationData? = null,
    val photoIds: List<String>,
    val ocrData: Map<String, Any>? = null,
    var syncStatus: SyncStatus,
    var lastModified: Long
)

data class PhotoRecord(
    val id: String,
    val localPath: String,
    val cloudUrl: String? = null,
    val relatedRecordId: String,
    val recordType: String,
    val timestamp: Long,
    val metadata: PhotoMetadata,
    var syncStatus: SyncStatus
)

data class PhotoMetadata(
    val width: Int,
    val height: Int,
    val fileSize: Long,
    val mimeType: String,
    val compressed: Boolean
)

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Double,
    val timestamp: Long
)

data class SyncOperation(
    val id: String,
    val operationType: String, // create, update, delete
    val recordType: String,
    val recordId: String,
    val payload: ByteArray,
    val timestamp: Long,
    var retryCount: Int = 0,
    var lastAttempt: Long? = null,
    var error: String? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as SyncOperation

        if (id != other.id) return false

        return true
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}

enum class SyncStatus {
    PENDING,
    SYNCING,
    SYNCED,
    CONFLICT,
    ERROR
}

// MARK: - Database Helper

class FleetDatabaseHelper(context: Context) : SQLiteOpenHelper(
    context,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {
    companion object {
        const val DATABASE_NAME = "fleet_offline.db"
        const val DATABASE_VERSION = 1

        // Table names
        const val TABLE_INSPECTIONS = "inspections"
        const val TABLE_REPORTS = "reports"
        const val TABLE_PHOTOS = "photos"
        const val TABLE_SYNC_QUEUE = "sync_queue"
        const val TABLE_SYNC_METADATA = "sync_metadata"

        // Common columns
        const val COL_ID = "id"
        const val COL_VEHICLE_ID = "vehicle_id"
        const val COL_DRIVER_ID = "driver_id"
        const val COL_TIMESTAMP = "timestamp"
        const val COL_SYNC_STATUS = "sync_status"
        const val COL_LAST_MODIFIED = "last_modified"
        const val COL_CREATED_AT = "created_at"
    }

    override fun onCreate(db: SQLiteDatabase) {
        createTables(db)
        createIndexes(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle database upgrades
        db.execSQL("DROP TABLE IF EXISTS $TABLE_INSPECTIONS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_REPORTS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_PHOTOS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SYNC_QUEUE")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SYNC_METADATA")
        onCreate(db)
    }

    private fun createTables(db: SQLiteDatabase) {
        // Inspections table
        db.execSQL("""
            CREATE TABLE $TABLE_INSPECTIONS (
                $COL_ID TEXT PRIMARY KEY,
                $COL_VEHICLE_ID TEXT NOT NULL,
                $COL_DRIVER_ID TEXT NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL,
                inspection_type TEXT NOT NULL,
                checklist_data TEXT NOT NULL,
                notes TEXT,
                photo_ids TEXT,
                $COL_SYNC_STATUS TEXT NOT NULL,
                $COL_LAST_MODIFIED INTEGER NOT NULL,
                $COL_CREATED_AT INTEGER NOT NULL
            )
        """)

        // Reports table
        db.execSQL("""
            CREATE TABLE $TABLE_REPORTS (
                $COL_ID TEXT PRIMARY KEY,
                report_type TEXT NOT NULL,
                $COL_VEHICLE_ID TEXT NOT NULL,
                $COL_DRIVER_ID TEXT NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL,
                amount REAL,
                odometer INTEGER,
                location_data TEXT,
                photo_ids TEXT,
                ocr_data TEXT,
                $COL_SYNC_STATUS TEXT NOT NULL,
                $COL_LAST_MODIFIED INTEGER NOT NULL,
                $COL_CREATED_AT INTEGER NOT NULL
            )
        """)

        // Photos table
        db.execSQL("""
            CREATE TABLE $TABLE_PHOTOS (
                $COL_ID TEXT PRIMARY KEY,
                local_path TEXT NOT NULL,
                cloud_url TEXT,
                related_record_id TEXT NOT NULL,
                record_type TEXT NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL,
                metadata TEXT NOT NULL,
                $COL_SYNC_STATUS TEXT NOT NULL,
                $COL_CREATED_AT INTEGER NOT NULL
            )
        """)

        // Sync queue table
        db.execSQL("""
            CREATE TABLE $TABLE_SYNC_QUEUE (
                $COL_ID TEXT PRIMARY KEY,
                operation_type TEXT NOT NULL,
                record_type TEXT NOT NULL,
                record_id TEXT NOT NULL,
                payload BLOB NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL,
                retry_count INTEGER NOT NULL,
                last_attempt INTEGER,
                error TEXT,
                $COL_CREATED_AT INTEGER NOT NULL
            )
        """)

        // Sync metadata table
        db.execSQL("""
            CREATE TABLE $TABLE_SYNC_METADATA (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)
    }

    private fun createIndexes(db: SQLiteDatabase) {
        db.execSQL("CREATE INDEX idx_inspections_vehicle ON $TABLE_INSPECTIONS($COL_VEHICLE_ID)")
        db.execSQL("CREATE INDEX idx_inspections_driver ON $TABLE_INSPECTIONS($COL_DRIVER_ID)")
        db.execSQL("CREATE INDEX idx_inspections_sync ON $TABLE_INSPECTIONS($COL_SYNC_STATUS)")
        db.execSQL("CREATE INDEX idx_reports_vehicle ON $TABLE_REPORTS($COL_VEHICLE_ID)")
        db.execSQL("CREATE INDEX idx_reports_driver ON $TABLE_REPORTS($COL_DRIVER_ID)")
        db.execSQL("CREATE INDEX idx_reports_sync ON $TABLE_REPORTS($COL_SYNC_STATUS)")
        db.execSQL("CREATE INDEX idx_photos_record ON $TABLE_PHOTOS(related_record_id)")
        db.execSQL("CREATE INDEX idx_photos_sync ON $TABLE_PHOTOS($COL_SYNC_STATUS)")
        db.execSQL("CREATE INDEX idx_sync_queue_status ON $TABLE_SYNC_QUEUE(retry_count, last_attempt)")
    }
}

// MARK: - Offline Storage Manager

class OfflineStorageManager private constructor(private val context: Context) {
    private val dbHelper = FleetDatabaseHelper(context)
    private val db: SQLiteDatabase = dbHelper.writableDatabase
    private val gson = Gson()
    private val photoStoragePath: File

    companion object {
        @Volatile
        private var INSTANCE: OfflineStorageManager? = null

        fun getInstance(context: Context): OfflineStorageManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: OfflineStorageManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    init {
        // Setup photo storage directory
        photoStoragePath = File(context.filesDir, "offline_photos")
        if (!photoStoragePath.exists()) {
            photoStoragePath.mkdirs()
        }
    }

    // MARK: - Inspection Operations

    fun saveInspection(inspection: InspectionRecord): Boolean {
        val values = ContentValues().apply {
            put(FleetDatabaseHelper.COL_ID, inspection.id)
            put(FleetDatabaseHelper.COL_VEHICLE_ID, inspection.vehicleId)
            put(FleetDatabaseHelper.COL_DRIVER_ID, inspection.driverId)
            put(FleetDatabaseHelper.COL_TIMESTAMP, inspection.timestamp)
            put("inspection_type", inspection.inspectionType)
            put("checklist_data", gson.toJson(inspection.checklistData))
            put("notes", inspection.notes)
            put("photo_ids", gson.toJson(inspection.photoIds))
            put(FleetDatabaseHelper.COL_SYNC_STATUS, inspection.syncStatus.name)
            put(FleetDatabaseHelper.COL_LAST_MODIFIED, System.currentTimeMillis())
            put(FleetDatabaseHelper.COL_CREATED_AT, System.currentTimeMillis())
        }

        val result = db.insertWithOnConflict(
            FleetDatabaseHelper.TABLE_INSPECTIONS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )

        if (result != -1L) {
            queueSyncOperation("create", "inspection", inspection.id, inspection)
        }

        return result != -1L
    }

    fun getInspections(
        vehicleId: String? = null,
        syncStatus: SyncStatus? = null
    ): List<InspectionRecord> {
        val inspections = mutableListOf<InspectionRecord>()

        var selection = "1=1"
        val selectionArgs = mutableListOf<String>()

        vehicleId?.let {
            selection += " AND ${FleetDatabaseHelper.COL_VEHICLE_ID} = ?"
            selectionArgs.add(it)
        }

        syncStatus?.let {
            selection += " AND ${FleetDatabaseHelper.COL_SYNC_STATUS} = ?"
            selectionArgs.add(it.name)
        }

        val cursor = db.query(
            FleetDatabaseHelper.TABLE_INSPECTIONS,
            null,
            selection,
            selectionArgs.toTypedArray(),
            null,
            null,
            "${FleetDatabaseHelper.COL_TIMESTAMP} DESC"
        )

        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_ID))
                val vehicleId = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_VEHICLE_ID))
                val driverId = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_DRIVER_ID))
                val timestamp = it.getLong(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_TIMESTAMP))
                val inspectionType = it.getString(it.getColumnIndexOrThrow("inspection_type"))
                val checklistDataJson = it.getString(it.getColumnIndexOrThrow("checklist_data"))
                val notes = it.getString(it.getColumnIndexOrThrow("notes"))
                val photoIdsJson = it.getString(it.getColumnIndexOrThrow("photo_ids"))
                val syncStatusStr = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_SYNC_STATUS))
                val lastModified = it.getLong(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_LAST_MODIFIED))

                val checklistData: Map<String, Boolean> = gson.fromJson(
                    checklistDataJson,
                    object : TypeToken<Map<String, Boolean>>() {}.type
                )

                val photoIds: List<String> = gson.fromJson(
                    photoIdsJson,
                    object : TypeToken<List<String>>() {}.type
                )

                inspections.add(
                    InspectionRecord(
                        id = id,
                        vehicleId = vehicleId,
                        driverId = driverId,
                        timestamp = timestamp,
                        inspectionType = inspectionType,
                        checklistData = checklistData,
                        notes = notes,
                        photoIds = photoIds,
                        syncStatus = SyncStatus.valueOf(syncStatusStr),
                        lastModified = lastModified
                    )
                )
            }
        }

        return inspections
    }

    // MARK: - Report Operations

    fun saveReport(report: ReportRecord): Boolean {
        val values = ContentValues().apply {
            put(FleetDatabaseHelper.COL_ID, report.id)
            put("report_type", report.reportType)
            put(FleetDatabaseHelper.COL_VEHICLE_ID, report.vehicleId)
            put(FleetDatabaseHelper.COL_DRIVER_ID, report.driverId)
            put(FleetDatabaseHelper.COL_TIMESTAMP, report.timestamp)
            put("amount", report.amount)
            put("odometer", report.odometer)
            put("location_data", report.location?.let { gson.toJson(it) })
            put("photo_ids", gson.toJson(report.photoIds))
            put("ocr_data", report.ocrData?.let { gson.toJson(it) })
            put(FleetDatabaseHelper.COL_SYNC_STATUS, report.syncStatus.name)
            put(FleetDatabaseHelper.COL_LAST_MODIFIED, System.currentTimeMillis())
            put(FleetDatabaseHelper.COL_CREATED_AT, System.currentTimeMillis())
        }

        val result = db.insertWithOnConflict(
            FleetDatabaseHelper.TABLE_REPORTS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )

        if (result != -1L) {
            queueSyncOperation("create", "report", report.id, report)
        }

        return result != -1L
    }

    fun getReports(
        vehicleId: String? = null,
        reportType: String? = null,
        syncStatus: SyncStatus? = null
    ): List<ReportRecord> {
        val reports = mutableListOf<ReportRecord>()

        var selection = "1=1"
        val selectionArgs = mutableListOf<String>()

        vehicleId?.let {
            selection += " AND ${FleetDatabaseHelper.COL_VEHICLE_ID} = ?"
            selectionArgs.add(it)
        }

        reportType?.let {
            selection += " AND report_type = ?"
            selectionArgs.add(it)
        }

        syncStatus?.let {
            selection += " AND ${FleetDatabaseHelper.COL_SYNC_STATUS} = ?"
            selectionArgs.add(it.name)
        }

        val cursor = db.query(
            FleetDatabaseHelper.TABLE_REPORTS,
            null,
            selection,
            selectionArgs.toTypedArray(),
            null,
            null,
            "${FleetDatabaseHelper.COL_TIMESTAMP} DESC"
        )

        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_ID))
                val reportType = it.getString(it.getColumnIndexOrThrow("report_type"))
                val vehicleId = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_VEHICLE_ID))
                val driverId = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_DRIVER_ID))
                val timestamp = it.getLong(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_TIMESTAMP))
                val amount = if (it.isNull(it.getColumnIndexOrThrow("amount"))) null else it.getDouble(it.getColumnIndexOrThrow("amount"))
                val odometer = if (it.isNull(it.getColumnIndexOrThrow("odometer"))) null else it.getInt(it.getColumnIndexOrThrow("odometer"))
                val locationDataJson = it.getString(it.getColumnIndexOrThrow("location_data"))
                val photoIdsJson = it.getString(it.getColumnIndexOrThrow("photo_ids"))
                val ocrDataJson = it.getString(it.getColumnIndexOrThrow("ocr_data"))
                val syncStatusStr = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_SYNC_STATUS))
                val lastModified = it.getLong(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_LAST_MODIFIED))

                val location: LocationData? = locationDataJson?.let { json ->
                    gson.fromJson(json, LocationData::class.java)
                }

                val photoIds: List<String> = gson.fromJson(
                    photoIdsJson,
                    object : TypeToken<List<String>>() {}.type
                )

                val ocrData: Map<String, Any>? = ocrDataJson?.let { json ->
                    gson.fromJson(json, object : TypeToken<Map<String, Any>>() {}.type)
                }

                reports.add(
                    ReportRecord(
                        id = id,
                        reportType = reportType,
                        vehicleId = vehicleId,
                        driverId = driverId,
                        timestamp = timestamp,
                        amount = amount,
                        odometer = odometer,
                        location = location,
                        photoIds = photoIds,
                        ocrData = ocrData,
                        syncStatus = SyncStatus.valueOf(syncStatusStr),
                        lastModified = lastModified
                    )
                )
            }
        }

        return reports
    }

    // MARK: - Photo Operations

    fun savePhoto(
        imageData: ByteArray,
        id: String,
        relatedRecordId: String,
        recordType: String,
        metadata: PhotoMetadata
    ): PhotoRecord? {
        val localFile = File(photoStoragePath, "$id.jpg")

        try {
            localFile.writeBytes(imageData)
        } catch (e: Exception) {
            return null
        }

        val photo = PhotoRecord(
            id = id,
            localPath = localFile.absolutePath,
            cloudUrl = null,
            relatedRecordId = relatedRecordId,
            recordType = recordType,
            timestamp = System.currentTimeMillis(),
            metadata = metadata,
            syncStatus = SyncStatus.PENDING
        )

        val values = ContentValues().apply {
            put(FleetDatabaseHelper.COL_ID, id)
            put("local_path", localFile.absolutePath)
            put("cloud_url", null as String?)
            put("related_record_id", relatedRecordId)
            put("record_type", recordType)
            put(FleetDatabaseHelper.COL_TIMESTAMP, photo.timestamp)
            put("metadata", gson.toJson(metadata))
            put(FleetDatabaseHelper.COL_SYNC_STATUS, photo.syncStatus.name)
            put(FleetDatabaseHelper.COL_CREATED_AT, System.currentTimeMillis())
        }

        val result = db.insertWithOnConflict(
            FleetDatabaseHelper.TABLE_PHOTOS,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )

        return if (result != -1L) photo else null
    }

    fun getPhoto(id: String): ByteArray? {
        val cursor = db.query(
            FleetDatabaseHelper.TABLE_PHOTOS,
            arrayOf("local_path"),
            "${FleetDatabaseHelper.COL_ID} = ?",
            arrayOf(id),
            null,
            null,
            null
        )

        cursor.use {
            if (it.moveToFirst()) {
                val localPath = it.getString(it.getColumnIndexOrThrow("local_path"))
                val file = File(localPath)
                return if (file.exists()) file.readBytes() else null
            }
        }

        return null
    }

    // MARK: - Sync Queue Operations

    private fun queueSyncOperation(
        operationType: String,
        recordType: String,
        recordId: String,
        payload: Any
    ) {
        val payloadBytes = gson.toJson(payload).toByteArray()

        val values = ContentValues().apply {
            put(FleetDatabaseHelper.COL_ID, UUID.randomUUID().toString())
            put("operation_type", operationType)
            put("record_type", recordType)
            put("record_id", recordId)
            put("payload", payloadBytes)
            put(FleetDatabaseHelper.COL_TIMESTAMP, System.currentTimeMillis())
            put("retry_count", 0)
            put("last_attempt", null as Long?)
            put("error", null as String?)
            put(FleetDatabaseHelper.COL_CREATED_AT, System.currentTimeMillis())
        }

        db.insert(FleetDatabaseHelper.TABLE_SYNC_QUEUE, null, values)
    }

    fun getPendingSyncOperations(limit: Int = 50): List<SyncOperation> {
        val operations = mutableListOf<SyncOperation>()

        val cursor = db.query(
            FleetDatabaseHelper.TABLE_SYNC_QUEUE,
            null,
            "retry_count < 5",
            null,
            null,
            null,
            "${FleetDatabaseHelper.COL_TIMESTAMP} ASC",
            limit.toString()
        )

        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_ID))
                val operationType = it.getString(it.getColumnIndexOrThrow("operation_type"))
                val recordType = it.getString(it.getColumnIndexOrThrow("record_type"))
                val recordId = it.getString(it.getColumnIndexOrThrow("record_id"))
                val payload = it.getBlob(it.getColumnIndexOrThrow("payload"))
                val timestamp = it.getLong(it.getColumnIndexOrThrow(FleetDatabaseHelper.COL_TIMESTAMP))
                val retryCount = it.getInt(it.getColumnIndexOrThrow("retry_count"))
                val lastAttempt = if (it.isNull(it.getColumnIndexOrThrow("last_attempt"))) null else it.getLong(it.getColumnIndexOrThrow("last_attempt"))
                val error = it.getString(it.getColumnIndexOrThrow("error"))

                operations.add(
                    SyncOperation(
                        id = id,
                        operationType = operationType,
                        recordType = recordType,
                        recordId = recordId,
                        payload = payload,
                        timestamp = timestamp,
                        retryCount = retryCount,
                        lastAttempt = lastAttempt,
                        error = error
                    )
                )
            }
        }

        return operations
    }

    fun updateSyncOperation(id: String, retryCount: Int, error: String?) {
        val values = ContentValues().apply {
            put("retry_count", retryCount)
            put("last_attempt", System.currentTimeMillis())
            put("error", error)
        }

        db.update(
            FleetDatabaseHelper.TABLE_SYNC_QUEUE,
            values,
            "${FleetDatabaseHelper.COL_ID} = ?",
            arrayOf(id)
        )
    }

    fun deleteSyncOperation(id: String) {
        db.delete(
            FleetDatabaseHelper.TABLE_SYNC_QUEUE,
            "${FleetDatabaseHelper.COL_ID} = ?",
            arrayOf(id)
        )
    }

    // MARK: - Sync Metadata

    fun setSyncMetadata(key: String, value: String) {
        val values = ContentValues().apply {
            put("key", key)
            put("value", value)
            put("updated_at", System.currentTimeMillis())
        }

        db.insertWithOnConflict(
            FleetDatabaseHelper.TABLE_SYNC_METADATA,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun getSyncMetadata(key: String): String? {
        val cursor = db.query(
            FleetDatabaseHelper.TABLE_SYNC_METADATA,
            arrayOf("value"),
            "key = ?",
            arrayOf(key),
            null,
            null,
            null
        )

        cursor.use {
            if (it.moveToFirst()) {
                return it.getString(it.getColumnIndexOrThrow("value"))
            }
        }

        return null
    }

    // MARK: - Statistics

    fun getStorageStats(): Map<String, Any> {
        return mapOf(
            "inspections_total" to getRecordCount(FleetDatabaseHelper.TABLE_INSPECTIONS),
            "inspections_pending" to getRecordCountWithStatus(FleetDatabaseHelper.TABLE_INSPECTIONS, SyncStatus.PENDING.name),
            "reports_total" to getRecordCount(FleetDatabaseHelper.TABLE_REPORTS),
            "reports_pending" to getRecordCountWithStatus(FleetDatabaseHelper.TABLE_REPORTS, SyncStatus.PENDING.name),
            "photos_total" to getRecordCount(FleetDatabaseHelper.TABLE_PHOTOS),
            "photos_pending" to getRecordCountWithStatus(FleetDatabaseHelper.TABLE_PHOTOS, SyncStatus.PENDING.name),
            "sync_queue_size" to getRecordCount(FleetDatabaseHelper.TABLE_SYNC_QUEUE),
            "database_size_mb" to getDatabaseSize()
        )
    }

    // Security: Whitelist of allowed table names to prevent SQL injection
    private val ALLOWED_TABLES = setOf(
        FleetDatabaseHelper.TABLE_INSPECTIONS,
        FleetDatabaseHelper.TABLE_REPORTS,
        FleetDatabaseHelper.TABLE_PHOTOS,
        FleetDatabaseHelper.TABLE_SYNC_QUEUE,
        FleetDatabaseHelper.TABLE_SYNC_METADATA
    )

    private fun getRecordCount(table: String): Int {
        // Security: Validate table name against whitelist to prevent SQL injection
        require(table in ALLOWED_TABLES) { "Invalid table name: $table" }

        val cursor = db.rawQuery("SELECT COUNT(*) FROM $table", null)

        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }

        return 0
    }

    private fun getRecordCountWithStatus(table: String, status: String): Int {
        // Security: Validate table name against whitelist to prevent SQL injection
        require(table in ALLOWED_TABLES) { "Invalid table name: $table" }

        val cursor = db.rawQuery(
            "SELECT COUNT(*) FROM $table WHERE ${FleetDatabaseHelper.COL_SYNC_STATUS} = ?",
            arrayOf(status)
        )

        cursor.use {
            if (it.moveToFirst()) {
                return it.getInt(0)
            }
        }

        return 0
    }

    private fun getDatabaseSize(): Double {
        val dbFile = context.getDatabasePath(FleetDatabaseHelper.DATABASE_NAME)
        return dbFile.length() / 1024.0 / 1024.0
    }

    // MARK: - Database Management

    fun vacuum() {
        db.execSQL("VACUUM")
    }

    fun clearAllData() {
        db.delete(FleetDatabaseHelper.TABLE_INSPECTIONS, null, null)
        db.delete(FleetDatabaseHelper.TABLE_REPORTS, null, null)
        db.delete(FleetDatabaseHelper.TABLE_PHOTOS, null, null)
        db.delete(FleetDatabaseHelper.TABLE_SYNC_QUEUE, null, null)
        db.delete(FleetDatabaseHelper.TABLE_SYNC_METADATA, null, null)

        // Clear photo storage
        photoStoragePath.listFiles()?.forEach { it.delete() }
    }

    fun close() {
        db.close()
        dbHelper.close()
    }
}
