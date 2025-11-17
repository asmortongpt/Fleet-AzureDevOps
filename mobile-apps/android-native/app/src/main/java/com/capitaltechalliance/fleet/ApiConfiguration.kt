package com.capitaltechalliance.fleet

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * API Configuration for Fleet Manager Android App
 * Mirrors iOS APIConfiguration.swift functionality
 */
object ApiConfiguration {

    // Production URLs - Fleet Manager
    private const val AZURE_BASE_URL = "https://fleet.capitaltechalliance.com"
    const val AZURE_API_URL = "$AZURE_BASE_URL/api"

    // Development URLs
    private const val DEVELOPMENT_BASE_URL = "http://localhost:3000"
    const val DEVELOPMENT_API_URL = "$DEVELOPMENT_BASE_URL/api"

    // Environment selection
    enum class Environment {
        PRODUCTION,
        DEVELOPMENT
    }

    var currentEnvironment = if (BuildConfig.DEBUG) {
        Environment.DEVELOPMENT
    } else {
        Environment.PRODUCTION
    }

    val apiBaseUrl: String
        get() = when (currentEnvironment) {
            Environment.PRODUCTION -> AZURE_API_URL
            Environment.DEVELOPMENT -> DEVELOPMENT_API_URL
        }

    // API Endpoints
    object Endpoints {
        const val LOGIN = "/auth/login"
        const val LOGOUT = "/auth/logout"
        const val ME = "/auth/me"
        const val REFRESH = "/auth/refresh"
        const val VEHICLES = "/vehicles"
        const val DRIVERS = "/drivers"
        const val MAINTENANCE = "/maintenance"
        const val FLEET_METRICS = "/fleet-metrics"
        const val HEALTH = "/health"
    }

    // Network client with authentication interceptor
    private class AuthInterceptor(private val token: String?) : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("User-Agent", "Android/Fleet-Management-App")

            // Add authorization header if token exists
            token?.let {
                requestBuilder.header("Authorization", "Bearer $it")
            }

            // Production security headers
            if (currentEnvironment == Environment.PRODUCTION) {
                requestBuilder
                    .header("Cache-Control", "no-cache")
                    .header("Sec-Fetch-Site", "same-origin")
            }

            return chain.proceed(requestBuilder.build())
        }
    }

    fun createRetrofitClient(token: String? = null): Retrofit {
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(AuthInterceptor(token))
            .build()

        return Retrofit.Builder()
            .baseUrl(apiBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    // Connection status
    sealed class ConnectionStatus {
        object Connected : ConnectionStatus()
        data class Degraded(val reason: String) : ConnectionStatus()
        data class Failed(val error: String) : ConnectionStatus()

        val isConnected: Boolean
            get() = this is Connected

        val description: String
            get() = when (this) {
                is Connected -> "Connected to Azure backend"
                is Degraded -> "Service degraded: $reason"
                is Failed -> "Connection failed: $error"
            }
    }

    // Health check
    suspend fun testConnection(): ConnectionStatus {
        return try {
            val client = createRetrofitClient()
            val response = client.create(FleetApiService::interface).healthCheck()
            if (response.isSuccessful && response.body()?.status == "healthy") {
                ConnectionStatus.Connected
            } else {
                ConnectionStatus.Failed("Server unavailable")
            }
        } catch (e: Exception) {
            ConnectionStatus.Failed(e.localizedMessage ?: "Unknown error")
        }
    }
}

// Retrofit API service interface
interface FleetApiService {
    @retrofit2.http.GET("${ApiConfiguration.Endpoints.HEALTH}")
    suspend fun healthCheck(): retrofit2.Response<HealthResponse>
}

// Health response model
data class HealthResponse(
    val status: String,
    val timestamp: String? = null
)
