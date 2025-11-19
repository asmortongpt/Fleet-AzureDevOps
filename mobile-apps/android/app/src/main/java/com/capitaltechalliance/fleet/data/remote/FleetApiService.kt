package com.capitaltechalliance.fleet.data.remote

import com.capitaltechalliance.fleet.data.remote.dto.*
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit
import com.google.gson.GsonBuilder
import java.util.Date

/**
 * Fleet API Service
 *
 * Retrofit interface defining all API endpoints with:
 * - Automatic retry with exponential backoff
 * - Authentication token injection
 * - Request/response logging
 * - Type-safe API calls
 */

interface FleetApiService {

    // MARK: - Device Registration

    @POST("mobile/register")
    suspend fun registerDevice(
        @Body request: DeviceRegistrationRequest
    ): Response<DeviceRegistrationResponse>

    // MARK: - Sync

    @POST("mobile/sync")
    suspend fun syncData(
        @Body request: SyncRequest
    ): Response<SyncResponse>

    // MARK: - Vehicles

    @GET("vehicles")
    suspend fun getVehicles(
        @Query("tenant_id") tenantId: Long
    ): Response<List<VehicleDTO>>

    @GET("vehicles/{id}")
    suspend fun getVehicle(
        @Path("id") id: Long
    ): Response<VehicleDTO>

    @POST("vehicles")
    suspend fun createVehicle(
        @Body vehicle: VehicleDTO
    ): Response<VehicleDTO>

    @PUT("vehicles/{id}")
    suspend fun updateVehicle(
        @Path("id") id: Long,
        @Body vehicle: VehicleDTO
    ): Response<VehicleDTO>

    @DELETE("vehicles/{id}")
    suspend fun deleteVehicle(
        @Path("id") id: Long
    ): Response<Unit>

    // MARK: - Drivers

    @GET("drivers")
    suspend fun getDrivers(
        @Query("tenant_id") tenantId: Long
    ): Response<List<DriverDTO>>

    @GET("drivers/{id}")
    suspend fun getDriver(
        @Path("id") id: Long
    ): Response<DriverDTO>

    // MARK: - Inspections

    @GET("inspections")
    suspend fun getInspections(
        @Query("tenant_id") tenantId: Long,
        @Query("vehicle_id") vehicleId: Long? = null
    ): Response<List<InspectionDTO>>

    @GET("inspections/{id}")
    suspend fun getInspection(
        @Path("id") id: Long
    ): Response<InspectionDTO>

    @POST("inspections")
    suspend fun createInspection(
        @Body inspection: InspectionDTO
    ): Response<InspectionDTO>

    @PUT("inspections/{id}")
    suspend fun updateInspection(
        @Path("id") id: Long,
        @Body inspection: InspectionDTO
    ): Response<InspectionDTO>

    // MARK: - Trips

    @GET("trips")
    suspend fun getTrips(
        @Query("tenant_id") tenantId: Long,
        @Query("vehicle_id") vehicleId: Long? = null,
        @Query("driver_id") driverId: Long? = null
    ): Response<List<TripDTO>>

    @GET("trips/{id}")
    suspend fun getTrip(
        @Path("id") id: Long
    ): Response<TripDTO>

    @POST("trips")
    suspend fun createTrip(
        @Body trip: TripDTO
    ): Response<TripDTO>

    @PUT("trips/{id}")
    suspend fun updateTrip(
        @Path("id") id: Long,
        @Body trip: TripDTO
    ): Response<TripDTO>

    // MARK: - Photos

    @Multipart
    @POST("mobile/photos/upload")
    suspend fun uploadPhoto(
        @Part photo: MultipartBody.Part,
        @Part("metadata") metadata: RequestBody
    ): Response<PhotoUploadResponse>

    @GET("mobile/photos/sync-queue")
    suspend fun getPhotoSyncQueue(
        @Query("since") since: String? = null
    ): Response<PhotoSyncQueueResponse>

    @POST("mobile/photos/sync-complete")
    suspend fun markPhotosAsSynced(
        @Body request: SyncCompleteRequest
    ): Response<SyncCompleteResponse>

    // MARK: - Keyless Entry

    @POST("mobile/keyless-entry")
    suspend fun executeKeylessEntry(
        @Body request: KeylessEntryRequest
    ): Response<KeylessEntryResponse>

    // MARK: - AR Navigation

    @POST("mobile/ar-navigation")
    suspend fun getARNavigationData(
        @Body request: ARNavigationRequest
    ): Response<ARNavigationResponse>

    @GET("mobile/route/{vehicleId}")
    suspend fun getMobileRoute(
        @Path("vehicleId") vehicleId: Long
    ): Response<RouteDTO>

    // MARK: - Damage Detection

    @POST("mobile/damage-detection")
    suspend fun submitDamageDetection(
        @Body request: DamageDetectionRequest
    ): Response<DamageDetectionResponse>

    // MARK: - Dispatch Messages

    @GET("mobile/dispatch/messages")
    suspend fun getDispatchMessages(
        @Query("channel_id") channelId: Long? = null,
        @Query("since") since: String? = null
    ): Response<List<MessageDTO>>

    // MARK: - Charging Stations

    @GET("mobile/charging-stations/nearby")
    suspend fun getNearbyChargingStations(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Double = 10.0
    ): Response<List<ChargingStationDTO>>

    companion object {
        private const val BASE_URL = "https://fleet.capitaltechalliance.com/api/"
        private const val TIMEOUT_SECONDS = 30L

        fun create(authToken: String? = null): FleetApiService {
            // Logging interceptor
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            }

            // Auth interceptor
            val authInterceptor = okhttp3.Interceptor { chain ->
                val original = chain.request()
                val requestBuilder = original.newBuilder()
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("User-Agent", "FleetMobile/1.0 Android")

                authToken?.let {
                    requestBuilder.header("Authorization", "Bearer $it")
                }

                val request = requestBuilder.build()
                chain.proceed(request)
            }

            // Retry interceptor
            val retryInterceptor = okhttp3.Interceptor { chain ->
                val request = chain.request()
                var response = chain.proceed(request)
                var tryCount = 0
                val maxRetries = 3

                while (!response.isSuccessful && tryCount < maxRetries) {
                    tryCount++
                    response.close()

                    // Exponential backoff
                    Thread.sleep((2000 * Math.pow(2.0, tryCount.toDouble())).toLong())

                    android.util.Log.d("FleetAPI", "Retry $tryCount/$maxRetries")
                    response = chain.proceed(request)
                }

                response
            }

            // OkHttp client
            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(loggingInterceptor)
                .addInterceptor(retryInterceptor)
                .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .build()

            // Gson with custom date adapter
            val gson = GsonBuilder()
                .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                .create()

            // Retrofit
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()

            return retrofit.create(FleetApiService::class.java)
        }
    }
}

/**
 * API Result wrapper for error handling
 */
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val message: String, val code: Int? = null) : ApiResult<Nothing>()
    object Loading : ApiResult<Nothing>()
}

/**
 * Extension function to safely execute API calls
 */
suspend fun <T> safeApiCall(
    apiCall: suspend () -> Response<T>
): ApiResult<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful && response.body() != null) {
            ApiResult.Success(response.body()!!)
        } else {
            ApiResult.Error(
                message = response.message() ?: "Unknown error",
                code = response.code()
            )
        }
    } catch (e: Exception) {
        ApiResult.Error(message = e.localizedMessage ?: "Network error")
    }
}

/**
 * BuildConfig placeholder - should be auto-generated by Gradle
 */
object BuildConfig {
    const val DEBUG = true
}
