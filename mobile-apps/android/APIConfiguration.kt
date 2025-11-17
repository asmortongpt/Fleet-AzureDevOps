/**
 * Fleet Management - Android API Configuration
 *
 * Unified API configuration for all mobile app features
 */

package com.capitaltechalliance.fleet

import android.content.Context
import android.os.Build
import java.util.UUID

enum class Environment {
    DEVELOPMENT,
    STAGING,
    PRODUCTION;

    companion object {
        val current: Environment
            get() = if (BuildConfig.DEBUG) DEVELOPMENT else PRODUCTION
    }
}

object APIConfiguration {
    // MARK: - Base URLs

    val baseURL: String
        get() = when (Environment.current) {
            Environment.DEVELOPMENT -> "http://10.0.2.2:3000" // Android emulator localhost
            Environment.STAGING -> "https://staging-fleet.capitaltechalliance.com"
            Environment.PRODUCTION -> "https://fleet.capitaltechalliance.com"
        }

    val apiURL: String
        get() = "$baseURL/api"

    val wsURL: String
        get() = when (Environment.current) {
            Environment.DEVELOPMENT -> "ws://10.0.2.2:3000"
            Environment.STAGING -> "wss://staging-fleet.capitaltechalliance.com"
            Environment.PRODUCTION -> "wss://fleet.capitaltechalliance.com"
        }

    // MARK: - Mobile Integration Endpoints

    object Mobile {
        const val register = "$apiURL/mobile/register"
        const val sync = "$apiURL/mobile/sync"
        fun route(vehicleId: Int) = "$apiURL/mobile/route/$vehicleId"
        const val arNavigation = "$apiURL/mobile/ar-navigation"
        const val keylessEntry = "$apiURL/mobile/keyless-entry"
        const val damageDetection = "$apiURL/mobile/damage-detection"
        const val dispatchMessages = "$apiURL/mobile/dispatch/messages"
        const val chargingStationsNearby = "$apiURL/mobile/charging-stations/nearby"
    }

    // MARK: - Telematics Endpoints

    object Telematics {
        const val providers = "$apiURL/telematics/providers"
        const val dashboard = "$apiURL/telematics/dashboard"
        fun vehicleLocation(vehicleId: Int) = "$apiURL/telematics/vehicles/$vehicleId/location"
        fun vehicleStats(vehicleId: Int) = "$apiURL/telematics/vehicles/$vehicleId/stats"
        const val safetyEvents = "$apiURL/telematics/safety-events"
    }

    // MARK: - Smartcar Endpoints

    object Smartcar {
        const val connect = "$apiURL/smartcar/connect"
        fun location(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/location"
        fun battery(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/battery"
        fun lock(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/lock"
        fun unlock(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/unlock"
        fun startCharging(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/charge/start"
        fun stopCharging(vehicleId: Int) = "$apiURL/smartcar/vehicles/$vehicleId/charge/stop"
    }

    // MARK: - Route Optimization Endpoints

    object Routes {
        const val optimize = "$apiURL/route-optimization/optimize"
        const val jobs = "$apiURL/route-optimization/jobs"
        const val active = "$apiURL/route-optimization/routes/active"
        fun route(routeId: Int) = "$apiURL/route-optimization/routes/$routeId"
        fun completeStop(routeId: Int, stopId: Int) = "$apiURL/route-optimization/routes/$routeId/stops/$stopId/complete"
    }

    // MARK: - Dispatch Endpoints

    object Dispatch {
        const val channels = "$apiURL/dispatch/channels"
        const val websocket = "$wsURL/api/dispatch/ws"
        fun history(channelId: Int) = "$apiURL/dispatch/channels/$channelId/history"
    }

    // MARK: - EV Charging Endpoints

    object EVCharging {
        const val chargers = "$apiURL/ev/chargers"
        fun chargerStatus(chargerId: Int) = "$apiURL/ev/chargers/$chargerId/status"
        fun reserve(chargerId: Int) = "$apiURL/ev/chargers/$chargerId/reserve"
        fun remoteStart(chargerId: Int) = "$apiURL/ev/chargers/$chargerId/remote-start"
        fun chargeSchedule(vehicleId: Int) = "$apiURL/ev/vehicles/$vehicleId/charge-schedule"
        const val carbonFootprint = "$apiURL/ev/carbon-footprint"
        const val esgReport = "$apiURL/ev/esg-report"
    }

    // MARK: - Video Telematics Endpoints

    object VideoTelematics {
        const val cameras = "$apiURL/video/cameras"
        const val events = "$apiURL/video/events"
        fun videoClip(eventId: Int) = "$apiURL/video/events/$eventId/clip"
        const val evidenceLocker = "$apiURL/video/evidence-locker"
    }

    // MARK: - 3D Vehicle Viewer Endpoints

    object Vehicle3D {
        fun model(vehicleId: Int) = "$apiURL/vehicles/$vehicleId/3d-model"
        fun arModel(vehicleId: Int) = "$apiURL/vehicles/$vehicleId/ar-model"
        fun customize(vehicleId: Int) = "$apiURL/vehicles/$vehicleId/customize"
        const val catalog = "$apiURL/vehicle-models/catalog"
    }

    // MARK: - Request Headers

    fun headers(token: String? = null, context: Context): Map<String, String> {
        val headers = mutableMapOf(
            "Content-Type" to "application/json",
            "Accept" to "application/json",
            "X-App-Version" to getAppVersion(context),
            "X-Device-Type" to "android",
            "X-OS-Version" to Build.VERSION.RELEASE
        )

        token?.let {
            headers["Authorization"] = "Bearer $it"
        }

        return headers
    }

    // MARK: - Device Info

    fun getAppVersion(context: Context): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    fun getDeviceId(context: Context): String {
        val sharedPrefs = context.getSharedPreferences("fleet_prefs", Context.MODE_PRIVATE)
        var deviceId = sharedPrefs.getString("device_id", null)

        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            sharedPrefs.edit().putString("device_id", deviceId).apply()
        }

        return deviceId
    }

    fun getDeviceName(): String {
        return "${Build.MANUFACTURER} ${Build.MODEL}"
    }

    // MARK: - Timeout Configuration

    const val REQUEST_TIMEOUT = 30_000L // 30 seconds
    const val UPLOAD_TIMEOUT = 120_000L // 2 minutes
    const val DOWNLOAD_TIMEOUT = 120_000L // 2 minutes

    // MARK: - Feature Flags

    object FeatureFlags {
        const val offlineMode = true
        const val barcodeScanner = true
        const val aiDamageDetection = true
        const val lidarScanning = false // LiDAR not available on Android
        const val keylessEntry = true
        const val arNavigation = true
        const val radioDispatch = true
        const val videoTelematics = true
        const val evCharging = true
        const val routeOptimization = true
    }

    // MARK: - Offline Sync Configuration

    object OfflineSync {
        const val AUTO_SYNC_INTERVAL_MINUTES = 15
        const val MAX_RETRY_ATTEMPTS = 5
        const val RETRY_BACKOFF_MULTIPLIER = 2.0
        const val MAX_CONCURRENT_SYNC_OPERATIONS = 3
    }

    // MARK: - Cache Configuration

    object Cache {
        const val VEHICLES_CACHE_DURATION_MS = 60 * 60 * 1000L // 1 hour
        const val ROUTES_CACHE_DURATION_MS = 5 * 60 * 1000L // 5 minutes
        const val CHARGERS_CACHE_DURATION_MS = 15 * 60 * 1000L // 15 minutes
        const val MAX_PHOTO_CACHE_SIZE_MB = 100 // 100 MB
    }
}

// MARK: - OkHttp Client Extension

import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

object FleetHttpClient {
    val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(APIConfiguration.REQUEST_TIMEOUT, TimeUnit.MILLISECONDS)
            .readTimeout(APIConfiguration.DOWNLOAD_TIMEOUT, TimeUnit.MILLISECONDS)
            .writeTimeout(APIConfiguration.UPLOAD_TIMEOUT, TimeUnit.MILLISECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
}
