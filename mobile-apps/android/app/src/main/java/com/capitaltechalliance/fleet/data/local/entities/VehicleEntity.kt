package com.capitaltechalliance.fleet.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import java.util.Date

/**
 * Room Database Entities for Fleet Mobile App
 *
 * These entities define the offline database schema with proper
 * indexing and relationships for efficient queries.
 */

@Entity(tableName = "vehicles")
data class VehicleEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: Long,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "vin")
    val vin: String?,

    @ColumnInfo(name = "make")
    val make: String?,

    @ColumnInfo(name = "model")
    val model: String?,

    @ColumnInfo(name = "year")
    val year: Int,

    @ColumnInfo(name = "license_plate")
    val licensePlate: String?,

    @ColumnInfo(name = "status", index = true)
    val status: String?,

    @ColumnInfo(name = "mileage")
    val mileage: Double,

    @ColumnInfo(name = "fuel_level")
    val fuelLevel: Double,

    @ColumnInfo(name = "latitude")
    val latitude: Double,

    @ColumnInfo(name = "longitude")
    val longitude: Double,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?,

    @ColumnInfo(name = "modified_at")
    val modifiedAt: Date?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "needs_sync", index = true)
    val needsSync: Boolean = false,

    @ColumnInfo(name = "has_conflict")
    val hasConflict: Boolean = false,

    @ColumnInfo(name = "conflict_data")
    val conflictData: String? = null
) {
    val displayName: String
        get() = "$year $make $model".trim()
}

@Entity(tableName = "drivers")
data class DriverEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: Long,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "first_name")
    val firstName: String?,

    @ColumnInfo(name = "last_name")
    val lastName: String?,

    @ColumnInfo(name = "email")
    val email: String?,

    @ColumnInfo(name = "phone")
    val phone: String?,

    @ColumnInfo(name = "license_number")
    val licenseNumber: String?,

    @ColumnInfo(name = "license_expiry_date")
    val licenseExpiryDate: Date?,

    @ColumnInfo(name = "status", index = true)
    val status: String?,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?,

    @ColumnInfo(name = "modified_at")
    val modifiedAt: Date?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "needs_sync", index = true)
    val needsSync: Boolean = false,

    @ColumnInfo(name = "has_conflict")
    val hasConflict: Boolean = false
) {
    val fullName: String
        get() = "$firstName $lastName".trim()
}

@Entity(tableName = "inspections")
data class InspectionEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "vehicle_id", index = true)
    val vehicleId: Long,

    @ColumnInfo(name = "driver_id", index = true)
    val driverId: Long,

    @ColumnInfo(name = "inspection_type")
    val inspectionType: String,

    @ColumnInfo(name = "status", index = true)
    val status: String,

    @ColumnInfo(name = "notes")
    val notes: String?,

    @ColumnInfo(name = "defects")
    val defects: String?, // JSON array

    @ColumnInfo(name = "odometer_reading")
    val odometerReading: Double,

    @ColumnInfo(name = "latitude")
    val latitude: Double,

    @ColumnInfo(name = "longitude")
    val longitude: Double,

    @ColumnInfo(name = "inspected_at")
    val inspectedAt: Date,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?,

    @ColumnInfo(name = "modified_at")
    val modifiedAt: Date?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "needs_sync", index = true)
    val needsSync: Boolean = false,

    @ColumnInfo(name = "has_conflict")
    val hasConflict: Boolean = false
)

@Entity(tableName = "trips")
data class TripEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "vehicle_id", index = true)
    val vehicleId: Long,

    @ColumnInfo(name = "driver_id", index = true)
    val driverId: Long,

    @ColumnInfo(name = "start_odometer")
    val startOdometer: Double,

    @ColumnInfo(name = "end_odometer")
    val endOdometer: Double,

    @ColumnInfo(name = "start_latitude")
    val startLatitude: Double,

    @ColumnInfo(name = "start_longitude")
    val startLongitude: Double,

    @ColumnInfo(name = "end_latitude")
    val endLatitude: Double,

    @ColumnInfo(name = "end_longitude")
    val endLongitude: Double,

    @ColumnInfo(name = "start_time")
    val startTime: Date,

    @ColumnInfo(name = "end_time")
    val endTime: Date?,

    @ColumnInfo(name = "purpose")
    val purpose: String?,

    @ColumnInfo(name = "route")
    val route: String?, // JSON array of coordinates

    @ColumnInfo(name = "distance")
    val distance: Double,

    @ColumnInfo(name = "duration")
    val duration: Long,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?,

    @ColumnInfo(name = "modified_at")
    val modifiedAt: Date?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "needs_sync", index = true)
    val needsSync: Boolean = false,

    @ColumnInfo(name = "has_conflict")
    val hasConflict: Boolean = false
) {
    val durationFormatted: String
        get() {
            val hours = duration / 3600
            val minutes = (duration % 3600) / 60
            return "${hours}h ${minutes}m"
        }
}

@Entity(tableName = "mobile_photos")
data class MobilePhotoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "user_id", index = true)
    val userId: Long,

    @ColumnInfo(name = "local_path")
    val localPath: String?,

    @ColumnInfo(name = "remote_url")
    val remoteUrl: String?,

    @ColumnInfo(name = "file_name")
    val fileName: String,

    @ColumnInfo(name = "file_size")
    val fileSize: Long,

    @ColumnInfo(name = "mime_type")
    val mimeType: String,

    @ColumnInfo(name = "vehicle_id")
    val vehicleId: Long?,

    @ColumnInfo(name = "inspection_id")
    val inspectionId: Long?,

    @ColumnInfo(name = "report_type")
    val reportType: String?,

    @ColumnInfo(name = "latitude")
    val latitude: Double,

    @ColumnInfo(name = "longitude")
    val longitude: Double,

    @ColumnInfo(name = "metadata")
    val metadata: String?, // JSON

    @ColumnInfo(name = "taken_at")
    val takenAt: Date,

    @ColumnInfo(name = "uploaded_at")
    val uploadedAt: Date?,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?,

    @ColumnInfo(name = "created_at")
    val createdAt: Date?,

    @ColumnInfo(name = "needs_sync", index = true)
    val needsSync: Boolean = false,

    @ColumnInfo(name = "upload_status", index = true)
    val uploadStatus: String = "pending", // pending, uploading, completed, failed

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0
)

@Entity(tableName = "sync_queue")
data class SyncQueueItemEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "entity_type", index = true)
    val entityType: String, // vehicle, driver, inspection, trip, photo

    @ColumnInfo(name = "entity_id")
    val entityId: Long,

    @ColumnInfo(name = "operation")
    val operation: String, // create, update, delete

    @ColumnInfo(name = "payload")
    val payload: String, // JSON

    @ColumnInfo(name = "priority", index = true)
    val priority: Int = 1, // 0=low, 1=normal, 2=high

    @ColumnInfo(name = "status", index = true)
    val status: String = "pending", // pending, processing, completed, failed

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,

    @ColumnInfo(name = "max_retries")
    val maxRetries: Int = 3,

    @ColumnInfo(name = "error_message")
    val errorMessage: String? = null,

    @ColumnInfo(name = "created_at", index = true)
    val createdAt: Date,

    @ColumnInfo(name = "processed_at")
    val processedAt: Date? = null,

    @ColumnInfo(name = "scheduled_for")
    val scheduledFor: Date? = null
)

@Entity(tableName = "device_registration")
data class DeviceRegistrationEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "device_id")
    val deviceId: String,

    @ColumnInfo(name = "device_name")
    val deviceName: String,

    @ColumnInfo(name = "device_type")
    val deviceType: String,

    @ColumnInfo(name = "app_version")
    val appVersion: String,

    @ColumnInfo(name = "os_version")
    val osVersion: String,

    @ColumnInfo(name = "push_token")
    val pushToken: String?,

    @ColumnInfo(name = "registered_at")
    val registeredAt: Date,

    @ColumnInfo(name = "last_active_at")
    val lastActiveAt: Date
)

@Entity(tableName = "dispatch_messages")
data class DispatchMessageEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: Long,

    @ColumnInfo(name = "tenant_id", index = true)
    val tenantId: Long,

    @ColumnInfo(name = "channel_id", index = true)
    val channelId: Long,

    @ColumnInfo(name = "sender_id")
    val senderId: Long,

    @ColumnInfo(name = "sender_name")
    val senderName: String,

    @ColumnInfo(name = "message_text")
    val messageText: String,

    @ColumnInfo(name = "message_type")
    val messageType: String?,

    @ColumnInfo(name = "priority")
    val priority: String?,

    @ColumnInfo(name = "is_read")
    val isRead: Boolean = false,

    @ColumnInfo(name = "sent_at")
    val sentAt: Date,

    @ColumnInfo(name = "received_at")
    val receivedAt: Date,

    @ColumnInfo(name = "last_sync_at")
    val lastSyncAt: Date?
)

@Entity(tableName = "conflict_records")
data class ConflictRecordEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "entity_type")
    val entityType: String,

    @ColumnInfo(name = "entity_id")
    val entityId: Long,

    @ColumnInfo(name = "local_version")
    val localVersion: String, // JSON

    @ColumnInfo(name = "remote_version")
    val remoteVersion: String, // JSON

    @ColumnInfo(name = "conflict_type")
    val conflictType: String, // timestamp, field_mismatch, deleted

    @ColumnInfo(name = "resolution")
    val resolution: String?, // use_local, use_remote, merge, manual

    @ColumnInfo(name = "resolved_by")
    val resolvedBy: Long?,

    @ColumnInfo(name = "detected_at")
    val detectedAt: Date,

    @ColumnInfo(name = "resolved_at")
    val resolvedAt: Date?,

    @ColumnInfo(name = "is_resolved", index = true)
    val isResolved: Boolean = false
)
