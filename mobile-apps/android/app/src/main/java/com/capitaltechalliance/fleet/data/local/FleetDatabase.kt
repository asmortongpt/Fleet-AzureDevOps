package com.capitaltechalliance.fleet.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.capitaltechalliance.fleet.data.local.dao.*
import com.capitaltechalliance.fleet.data.local.entities.*

/**
 * Fleet Room Database
 *
 * Main database class with all DAOs and entities.
 * Configured with type converters and migrations.
 */

@Database(
    entities = [
        VehicleEntity::class,
        DriverEntity::class,
        InspectionEntity::class,
        TripEntity::class,
        MobilePhotoEntity::class,
        SyncQueueItemEntity::class,
        DeviceRegistrationEntity::class,
        DispatchMessageEntity::class,
        ConflictRecordEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class FleetDatabase : RoomDatabase() {

    abstract fun vehicleDao(): VehicleDao
    abstract fun driverDao(): DriverDao
    abstract fun inspectionDao(): InspectionDao
    abstract fun tripDao(): TripDao
    abstract fun mobilePhotoDao(): MobilePhotoDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun dispatchMessageDao(): DispatchMessageDao
    abstract fun conflictRecordDao(): ConflictRecordDao
    abstract fun deviceRegistrationDao(): DeviceRegistrationDao

    companion object {
        @Volatile
        private var INSTANCE: FleetDatabase? = null

        private const val DATABASE_NAME = "fleet_database"

        fun getInstance(context: Context): FleetDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FleetDatabase::class.java,
                    DATABASE_NAME
                )
                    .addCallback(object : Callback() {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            super.onCreate(db)
                            // Database created
                            android.util.Log.d("FleetDatabase", "Database created")
                        }

                        override fun onOpen(db: SupportSQLiteDatabase) {
                            super.onOpen(db)
                            // Database opened
                            android.util.Log.d("FleetDatabase", "Database opened")
                        }
                    })
                    .fallbackToDestructiveMigration() // Only for development
                    .build()

                INSTANCE = instance
                instance
            }
        }

        fun clearAllTables(context: Context) {
            getInstance(context).clearAllTables()
        }
    }
}

/**
 * Type Converters for Room Database
 *
 * Converts complex types to primitive types that Room can persist
 */
@androidx.room.TypeConverter
class Converters {
    @androidx.room.TypeConverter
    fun fromTimestamp(value: Long?): java.util.Date? {
        return value?.let { java.util.Date(it) }
    }

    @androidx.room.TypeConverter
    fun dateToTimestamp(date: java.util.Date?): Long? {
        return date?.time
    }
}
