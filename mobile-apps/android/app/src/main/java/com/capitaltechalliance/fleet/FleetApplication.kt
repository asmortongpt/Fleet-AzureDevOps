package com.capitaltechalliance.fleet

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.work.*
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import java.util.concurrent.TimeUnit

/**
 * Fleet Application Class
 *
 * Initializes core app components:
 * - Hilt dependency injection
 * - Timber logging
 * - WorkManager for background sync
 * - Notification channels
 */
@HiltAndroidApp
class FleetApplication : Application(), Configuration.Provider {

    override fun onCreate() {
        super.onCreate()

        // Initialize Timber logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(ProductionTree())
        }

        Timber.d("Fleet Application started")

        // Create notification channels
        createNotificationChannels()

        // Schedule periodic sync
        scheduleSyncWork()
    }

    override fun getWorkManagerConfiguration(): Configuration {
        return Configuration.Builder()
            .setMinimumLoggingLevel(if (BuildConfig.DEBUG) android.util.Log.DEBUG else android.util.Log.ERROR)
            .build()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channels = listOf(
                NotificationChannel(
                    CHANNEL_TRIPS,
                    "Active Trips",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for active trip tracking"
                },
                NotificationChannel(
                    CHANNEL_SYNC,
                    "Data Sync",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Background data synchronization"
                },
                NotificationChannel(
                    CHANNEL_ALERTS,
                    "Fleet Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Important fleet alerts and notifications"
                }
            )

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            channels.forEach { notificationManager.createNotificationChannel(it) }

            Timber.d("Notification channels created")
        }
    }

    private fun scheduleSyncWork() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            WORK_SYNC,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )

        Timber.d("Periodic sync work scheduled")
    }

    companion object {
        const val CHANNEL_TRIPS = "trips"
        const val CHANNEL_SYNC = "sync"
        const val CHANNEL_ALERTS = "alerts"
        const val WORK_SYNC = "fleet_sync"
    }

    /**
     * Production logging tree that filters sensitive information
     */
    private class ProductionTree : Timber.Tree() {
        override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
            if (priority >= android.util.Log.WARN) {
                // Log to Crashlytics or other production logging service
                // Firebase Crashlytics will be set up in the next file
            }
        }
    }
}

/**
 * Background sync worker
 */
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Timber.d("SyncWorker started")

        return try {
            // Sync will be implemented with repository pattern
            // For now, just return success
            Result.success()
        } catch (e: Exception) {
            Timber.e(e, "Sync failed")
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}
