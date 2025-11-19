package com.capitaltechalliance.fleet.data.local.dao

import androidx.room.*
import com.capitaltechalliance.fleet.data.local.entities.*
import kotlinx.coroutines.flow.Flow

/**
 * Room DAOs (Data Access Objects)
 *
 * Define database operations with Flow for reactive updates
 */

@Dao
interface VehicleDao {
    @Query("SELECT * FROM vehicles WHERE tenant_id = :tenantId ORDER BY status, make, model")
    fun getAllVehicles(tenantId: Long): Flow<List<VehicleEntity>>

    @Query("SELECT * FROM vehicles WHERE id = :id LIMIT 1")
    fun getVehicleById(id: Long): Flow<VehicleEntity?>

    @Query("SELECT * FROM vehicles WHERE needs_sync = 1")
    suspend fun getVehiclesNeedingSync(): List<VehicleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVehicle(vehicle: VehicleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVehicles(vehicles: List<VehicleEntity>)

    @Update
    suspend fun updateVehicle(vehicle: VehicleEntity)

    @Delete
    suspend fun deleteVehicle(vehicle: VehicleEntity)

    @Query("DELETE FROM vehicles WHERE id = :id")
    suspend fun deleteVehicleById(id: Long)

    @Query("SELECT COUNT(*) FROM vehicles WHERE tenant_id = :tenantId")
    suspend fun getVehicleCount(tenantId: Long): Int

    @Query("SELECT * FROM vehicles WHERE status = :status AND tenant_id = :tenantId")
    fun getVehiclesByStatus(status: String, tenantId: Long): Flow<List<VehicleEntity>>
}

@Dao
interface DriverDao {
    @Query("SELECT * FROM drivers WHERE tenant_id = :tenantId ORDER BY first_name, last_name")
    fun getAllDrivers(tenantId: Long): Flow<List<DriverEntity>>

    @Query("SELECT * FROM drivers WHERE id = :id LIMIT 1")
    fun getDriverById(id: Long): Flow<DriverEntity?>

    @Query("SELECT * FROM drivers WHERE needs_sync = 1")
    suspend fun getDriversNeedingSync(): List<DriverEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDriver(driver: DriverEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDrivers(drivers: List<DriverEntity>)

    @Update
    suspend fun updateDriver(driver: DriverEntity)

    @Delete
    suspend fun deleteDriver(driver: DriverEntity)
}

@Dao
interface InspectionDao {
    @Query("SELECT * FROM inspections WHERE tenant_id = :tenantId ORDER BY inspected_at DESC")
    fun getAllInspections(tenantId: Long): Flow<List<InspectionEntity>>

    @Query("SELECT * FROM inspections WHERE id = :id LIMIT 1")
    fun getInspectionById(id: Long): Flow<InspectionEntity?>

    @Query("SELECT * FROM inspections WHERE vehicle_id = :vehicleId ORDER BY inspected_at DESC")
    fun getInspectionsByVehicle(vehicleId: Long): Flow<List<InspectionEntity>>

    @Query("SELECT * FROM inspections WHERE needs_sync = 1")
    suspend fun getInspectionsNeedingSync(): List<InspectionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInspection(inspection: InspectionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInspections(inspections: List<InspectionEntity>)

    @Update
    suspend fun updateInspection(inspection: InspectionEntity)

    @Delete
    suspend fun deleteInspection(inspection: InspectionEntity)
}

@Dao
interface TripDao {
    @Query("SELECT * FROM trips WHERE tenant_id = :tenantId ORDER BY start_time DESC")
    fun getAllTrips(tenantId: Long): Flow<List<TripEntity>>

    @Query("SELECT * FROM trips WHERE id = :id LIMIT 1")
    fun getTripById(id: Long): Flow<TripEntity?>

    @Query("SELECT * FROM trips WHERE vehicle_id = :vehicleId ORDER BY start_time DESC")
    fun getTripsByVehicle(vehicleId: Long): Flow<List<TripEntity>>

    @Query("SELECT * FROM trips WHERE driver_id = :driverId ORDER BY start_time DESC")
    fun getTripsByDriver(driverId: Long): Flow<List<TripEntity>>

    @Query("SELECT * FROM trips WHERE end_time IS NULL LIMIT 1")
    fun getActiveTrip(): Flow<TripEntity?>

    @Query("SELECT * FROM trips WHERE needs_sync = 1")
    suspend fun getTripsNeedingSync(): List<TripEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrip(trip: TripEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrips(trips: List<TripEntity>)

    @Update
    suspend fun updateTrip(trip: TripEntity)

    @Delete
    suspend fun deleteTrip(trip: TripEntity)
}

@Dao
interface MobilePhotoDao {
    @Query("SELECT * FROM mobile_photos WHERE tenant_id = :tenantId ORDER BY taken_at DESC")
    fun getAllPhotos(tenantId: Long): Flow<List<MobilePhotoEntity>>

    @Query("SELECT * FROM mobile_photos WHERE id = :id LIMIT 1")
    suspend fun getPhotoById(id: Long): MobilePhotoEntity?

    @Query("SELECT * FROM mobile_photos WHERE inspection_id = :inspectionId")
    fun getPhotosByInspection(inspectionId: Long): Flow<List<MobilePhotoEntity>>

    @Query("SELECT * FROM mobile_photos WHERE upload_status = 'pending' ORDER BY taken_at ASC LIMIT :limit")
    suspend fun getPendingUploadPhotos(limit: Int = 20): List<MobilePhotoEntity>

    @Query("SELECT * FROM mobile_photos WHERE needs_sync = 1")
    suspend fun getPhotosNeedingSync(): List<MobilePhotoEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhoto(photo: MobilePhotoEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPhotos(photos: List<MobilePhotoEntity>)

    @Update
    suspend fun updatePhoto(photo: MobilePhotoEntity)

    @Delete
    suspend fun deletePhoto(photo: MobilePhotoEntity)

    @Query("UPDATE mobile_photos SET upload_status = :status WHERE id = :id")
    suspend fun updatePhotoUploadStatus(id: Long, status: String)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY priority DESC, created_at ASC")
    suspend fun getPendingItems(): List<SyncQueueItemEntity>

    @Query("SELECT * FROM sync_queue WHERE status = 'pending' AND (scheduled_for IS NULL OR scheduled_for <= :now) ORDER BY priority DESC, created_at ASC LIMIT :limit")
    suspend fun getReadyItems(now: Long, limit: Int = 50): List<SyncQueueItemEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'")
    fun getPendingCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: SyncQueueItemEntity)

    @Update
    suspend fun updateItem(item: SyncQueueItemEntity)

    @Delete
    suspend fun deleteItem(item: SyncQueueItemEntity)

    @Query("DELETE FROM sync_queue WHERE status = 'completed' AND processed_at < :beforeDate")
    suspend fun deleteOldCompletedItems(beforeDate: Long)
}

@Dao
interface DispatchMessageDao {
    @Query("SELECT * FROM dispatch_messages WHERE tenant_id = :tenantId ORDER BY sent_at DESC LIMIT :limit")
    fun getRecentMessages(tenantId: Long, limit: Int = 100): Flow<List<DispatchMessageEntity>>

    @Query("SELECT * FROM dispatch_messages WHERE channel_id = :channelId ORDER BY sent_at DESC")
    fun getMessagesByChannel(channelId: Long): Flow<List<DispatchMessageEntity>>

    @Query("SELECT COUNT(*) FROM dispatch_messages WHERE is_read = 0 AND tenant_id = :tenantId")
    fun getUnreadCount(tenantId: Long): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: DispatchMessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<DispatchMessageEntity>)

    @Query("UPDATE dispatch_messages SET is_read = 1 WHERE id = :id")
    suspend fun markAsRead(id: Long)

    @Query("UPDATE dispatch_messages SET is_read = 1 WHERE channel_id = :channelId")
    suspend fun markChannelAsRead(channelId: Long)
}

@Dao
interface ConflictRecordDao {
    @Query("SELECT * FROM conflict_records WHERE is_resolved = 0 ORDER BY detected_at DESC")
    fun getUnresolvedConflicts(): Flow<List<ConflictRecordEntity>>

    @Query("SELECT * FROM conflict_records WHERE entity_type = :entityType AND entity_id = :entityId")
    suspend fun getConflictsByEntity(entityType: String, entityId: Long): List<ConflictRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConflict(conflict: ConflictRecordEntity)

    @Update
    suspend fun updateConflict(conflict: ConflictRecordEntity)

    @Query("DELETE FROM conflict_records WHERE is_resolved = 1 AND resolved_at < :beforeDate")
    suspend fun deleteOldResolvedConflicts(beforeDate: Long)
}

@Dao
interface DeviceRegistrationDao {
    @Query("SELECT * FROM device_registration LIMIT 1")
    suspend fun getRegistration(): DeviceRegistrationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRegistration(registration: DeviceRegistrationEntity)

    @Update
    suspend fun updateRegistration(registration: DeviceRegistrationEntity)
}
