package com.capitaltechalliance.fleet.data.remote.dto

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * API Data Transfer Objects (DTOs)
 *
 * These models match the backend API structure for network communication
 */

// Device Registration
data class DeviceRegistrationRequest(
    @SerializedName("device_type") val deviceType: String,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("app_version") val appVersion: String,
    @SerializedName("os_version") val osVersion: String,
    @SerializedName("push_token") val pushToken: String?
)

data class DeviceRegistrationResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("registered_at") val registeredAt: Date
)

// Sync Models
data class SyncRequest(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("last_sync_at") val lastSyncAt: Date?,
    @SerializedName("data") val data: SyncData
)

data class SyncData(
    @SerializedName("inspections") val inspections: List<InspectionDTO>? = null,
    @SerializedName("reports") val reports: List<ReportDTO>? = null,
    @SerializedName("photos") val photos: List<PhotoDTO>? = null,
    @SerializedName("hos_logs") val hosLogs: List<HOSLogDTO>? = null
)

data class SyncResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("server_time") val serverTime: Date,
    @SerializedName("conflicts") val conflicts: List<ConflictDTO>?,
    @SerializedName("updates") val updates: SyncUpdates
)

data class SyncUpdates(
    @SerializedName("vehicles") val vehicles: List<VehicleDTO>?,
    @SerializedName("drivers") val drivers: List<DriverDTO>?,
    @SerializedName("inspections") val inspections: List<InspectionDTO>?,
    @SerializedName("trips") val trips: List<TripDTO>?,
    @SerializedName("messages") val messages: List<MessageDTO>?
)

// Entity DTOs
data class VehicleDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("vin") val vin: String?,
    @SerializedName("make") val make: String?,
    @SerializedName("model") val model: String?,
    @SerializedName("year") val year: Int?,
    @SerializedName("license_plate") val licensePlate: String?,
    @SerializedName("status") val status: String?,
    @SerializedName("mileage") val mileage: Double?,
    @SerializedName("fuel_level") val fuelLevel: Double?,
    @SerializedName("latitude") val latitude: Double?,
    @SerializedName("longitude") val longitude: Double?,
    @SerializedName("modified_at") val modifiedAt: Date?,
    @SerializedName("created_at") val createdAt: Date?
)

data class DriverDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("first_name") val firstName: String?,
    @SerializedName("last_name") val lastName: String?,
    @SerializedName("email") val email: String?,
    @SerializedName("phone") val phone: String?,
    @SerializedName("license_number") val licenseNumber: String?,
    @SerializedName("license_expiry_date") val licenseExpiryDate: Date?,
    @SerializedName("status") val status: String?,
    @SerializedName("modified_at") val modifiedAt: Date?,
    @SerializedName("created_at") val createdAt: Date?
)

data class InspectionDTO(
    @SerializedName("id") val id: Long?,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("vehicle_id") val vehicleId: Long,
    @SerializedName("driver_id") val driverId: Long,
    @SerializedName("inspection_type") val inspectionType: String,
    @SerializedName("status") val status: String,
    @SerializedName("notes") val notes: String?,
    @SerializedName("defects") val defects: List<DefectDTO>?,
    @SerializedName("odometer_reading") val odometerReading: Double,
    @SerializedName("latitude") val latitude: Double?,
    @SerializedName("longitude") val longitude: Double?,
    @SerializedName("inspected_at") val inspectedAt: Date,
    @SerializedName("modified_at") val modifiedAt: Date?,
    @SerializedName("created_at") val createdAt: Date?
)

data class DefectDTO(
    @SerializedName("category") val category: String,
    @SerializedName("severity") val severity: String,
    @SerializedName("description") val description: String,
    @SerializedName("photo_url") val photoUrl: String?
)

data class TripDTO(
    @SerializedName("id") val id: Long?,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("vehicle_id") val vehicleId: Long,
    @SerializedName("driver_id") val driverId: Long,
    @SerializedName("start_odometer") val startOdometer: Double,
    @SerializedName("end_odometer") val endOdometer: Double?,
    @SerializedName("start_latitude") val startLatitude: Double,
    @SerializedName("start_longitude") val startLongitude: Double,
    @SerializedName("end_latitude") val endLatitude: Double?,
    @SerializedName("end_longitude") val endLongitude: Double?,
    @SerializedName("start_time") val startTime: Date,
    @SerializedName("end_time") val endTime: Date?,
    @SerializedName("purpose") val purpose: String?,
    @SerializedName("route") val route: List<CoordinateDTO>?,
    @SerializedName("distance") val distance: Double?,
    @SerializedName("duration") val duration: Long?,
    @SerializedName("modified_at") val modifiedAt: Date?,
    @SerializedName("created_at") val createdAt: Date?
)

data class CoordinateDTO(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("timestamp") val timestamp: Date,
    @SerializedName("speed") val speed: Double?,
    @SerializedName("heading") val heading: Double?
)

data class PhotoDTO(
    @SerializedName("id") val id: Long?,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("user_id") val userId: Long,
    @SerializedName("photo_url") val photoUrl: String?,
    @SerializedName("file_name") val fileName: String,
    @SerializedName("file_size") val fileSize: Long,
    @SerializedName("mime_type") val mimeType: String,
    @SerializedName("vehicle_id") val vehicleId: Long?,
    @SerializedName("inspection_id") val inspectionId: Long?,
    @SerializedName("report_type") val reportType: String?,
    @SerializedName("latitude") val latitude: Double?,
    @SerializedName("longitude") val longitude: Double?,
    @SerializedName("taken_at") val takenAt: Date
)

data class PhotoUploadResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("photo") val photo: PhotoInfo
)

data class PhotoInfo(
    @SerializedName("id") val id: Long,
    @SerializedName("url") val url: String,
    @SerializedName("file_name") val fileName: String,
    @SerializedName("uploaded_at") val uploadedAt: Date
)

data class PhotoSyncQueueResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("photos") val photos: List<PhotoDTO>,
    @SerializedName("count") val count: Int
)

data class SyncCompleteRequest(
    @SerializedName("photo_ids") val photoIds: List<Long>,
    @SerializedName("device_id") val deviceId: String
)

data class SyncCompleteResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("synced_count") val syncedCount: Int
)

data class HOSLogDTO(
    @SerializedName("id") val id: Long?,
    @SerializedName("driver_id") val driverId: Long,
    @SerializedName("status") val status: String,
    @SerializedName("start_time") val startTime: Date,
    @SerializedName("end_time") val endTime: Date?
)

data class ReportDTO(
    @SerializedName("id") val id: Long?,
    @SerializedName("report_type") val reportType: String,
    @SerializedName("description") val description: String
)

data class MessageDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("tenant_id") val tenantId: Long,
    @SerializedName("channel_id") val channelId: Long,
    @SerializedName("sender_id") val senderId: Long,
    @SerializedName("sender_name") val senderName: String,
    @SerializedName("message_text") val messageText: String,
    @SerializedName("sent_at") val sentAt: Date
)

data class ConflictDTO(
    @SerializedName("id") val id: String,
    @SerializedName("entity_type") val entityType: String,
    @SerializedName("entity_id") val entityId: Long,
    @SerializedName("conflict_type") val conflictType: String,
    @SerializedName("local_version") val localVersion: String,
    @SerializedName("remote_version") val remoteVersion: String,
    @SerializedName("detected_at") val detectedAt: Date
)

// Keyless Entry
data class KeylessEntryRequest(
    @SerializedName("vehicle_id") val vehicleId: Long,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("command") val command: String,
    @SerializedName("location") val location: LocationDTO?
)

data class LocationDTO(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

data class KeylessEntryResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("command") val command: String,
    @SerializedName("executed_at") val executedAt: Date
)

// AR Navigation
data class ARNavigationRequest(
    @SerializedName("vehicle_id") val vehicleId: Long,
    @SerializedName("current_location") val currentLocation: LocationDTO,
    @SerializedName("heading") val heading: Double
)

data class ARNavigationResponse(
    @SerializedName("route") val route: RouteDTO,
    @SerializedName("pois") val pois: List<POIDTO>?,
    @SerializedName("next_waypoint") val nextWaypoint: WaypointDTO?
)

data class RouteDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("name") val name: String?,
    @SerializedName("waypoints") val waypoints: List<WaypointDTO>,
    @SerializedName("distance") val distance: Double
)

data class WaypointDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("address") val address: String?
)

data class POIDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("name") val name: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

// Damage Detection
data class DamageDetectionRequest(
    @SerializedName("vehicle_id") val vehicleId: Long,
    @SerializedName("photo_url") val photoUrl: String,
    @SerializedName("ai_detections") val aiDetections: List<AIDetectionDTO>,
    @SerializedName("severity") val severity: String
)

data class AIDetectionDTO(
    @SerializedName("type") val type: String,
    @SerializedName("confidence") val confidence: Double
)

data class DamageDetectionResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("report_id") val reportId: Long,
    @SerializedName("severity") val severity: String
)

// Charging Stations
data class ChargingStationDTO(
    @SerializedName("id") val id: Long,
    @SerializedName("name") val name: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("distance") val distance: Double
)
