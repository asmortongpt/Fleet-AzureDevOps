//
//  WeatherService.swift
//  Fleet Management
//
//  Real-time weather data service using OpenWeatherMap API
//  Provides weather conditions for trip tracking and safety
//

import Foundation
import CoreLocation
import Combine

// MARK: - Weather Models

struct WeatherData: Codable, Equatable {
    let temperature: Double  // Fahrenheit
    let feelsLike: Double   // Fahrenheit
    let condition: String    // Clear, Clouds, Rain, etc.
    let description: String  // Detailed description
    let humidity: Int        // Percentage
    let windSpeed: Double    // mph
    let visibility: Double   // miles
    let timestamp: Date
    let location: String

    // Trip safety factors
    var isSafeForDriving: Bool {
        // Basic safety check
        return visibility > 3.0 && windSpeed < 40.0
    }

    var safetyWarning: String? {
        if visibility < 3.0 {
            return "Low visibility conditions"
        }
        if windSpeed > 40.0 {
            return "High wind speeds"
        }
        if condition.contains("Storm") || condition.contains("Thunder") {
            return "Severe weather alert"
        }
        return nil
    }

    var conditionIcon: String {
        switch condition.lowercased() {
        case let c where c.contains("clear"):
            return "sun.max.fill"
        case let c where c.contains("cloud"):
            return "cloud.fill"
        case let c where c.contains("rain"):
            return "cloud.rain.fill"
        case let c where c.contains("snow"):
            return "cloud.snow.fill"
        case let c where c.contains("thunder"), let c where c.contains("storm"):
            return "cloud.bolt.fill"
        case let c where c.contains("fog"), let c where c.contains("mist"):
            return "cloud.fog.fill"
        default:
            return "cloud.sun.fill"
        }
    }
}

// MARK: - OpenWeatherMap Response Models

private struct OpenWeatherMapResponse: Codable {
    let main: MainWeather
    let weather: [Weather]
    let wind: Wind
    let visibility: Int
    let name: String

    struct MainWeather: Codable {
        let temp: Double
        let feels_like: Double
        let humidity: Int
    }

    struct Weather: Codable {
        let main: String
        let description: String
    }

    struct Wind: Codable {
        let speed: Double
    }
}

// MARK: - Weather Service

@MainActor
class WeatherService: ObservableObject {

    // MARK: - Singleton
    static let shared = WeatherService()

    // MARK: - Published Properties
    @Published var currentWeather: WeatherData?
    @Published var isLoading: Bool = false
    @Published var error: String?

    // MARK: - Private Properties
    private let apiKey: String
    private let baseURL = "https://api.openweathermap.org/data/2.5/weather"
    private var weatherCache: [String: CachedWeather] = [:]
    private let cacheExpiration: TimeInterval = 600 // 10 minutes

    private struct CachedWeather {
        let weather: WeatherData
        let timestamp: Date

        var isExpired: Bool {
            Date().timeIntervalSince(timestamp) > 600
        }
    }

    // MARK: - Initialization

    private init() {
        // Try to get API key from environment or use demo mode
        // For production, get this from a secure config or backend
        self.apiKey = ProcessInfo.processInfo.environment["OPENWEATHER_API_KEY"] ?? ""

        if apiKey.isEmpty {
            print("⚠️ No OpenWeatherMap API key found. Using mock data.")
        }
    }

    // MARK: - Public Methods

    /// Fetch weather for a specific location
    func fetchWeather(for location: CLLocation) async -> WeatherData? {
        let cacheKey = "\(location.coordinate.latitude),\(location.coordinate.longitude)"

        // Check cache first
        if let cached = weatherCache[cacheKey], !cached.isExpired {
            print("📦 Using cached weather data")
            await MainActor.run {
                self.currentWeather = cached.weather
            }
            return cached.weather
        }

        // If no API key, return mock data
        guard !apiKey.isEmpty else {
            return await fetchMockWeather(for: location)
        }

        await MainActor.run {
            self.isLoading = true
            self.error = nil
        }

        do {
            let weather = try await fetchRealWeather(location: location)

            // Cache the result
            weatherCache[cacheKey] = CachedWeather(weather: weather, timestamp: Date())

            await MainActor.run {
                self.currentWeather = weather
                self.isLoading = false
            }

            return weather

        } catch {
            print("❌ Weather fetch error: \(error.localizedDescription)")

            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }

            // Fall back to mock data on error
            return await fetchMockWeather(for: location)
        }
    }

    /// Fetch weather by city name
    func fetchWeather(for cityName: String) async -> WeatherData? {
        // Check cache
        if let cached = weatherCache[cityName], !cached.isExpired {
            print("📦 Using cached weather data for \(cityName)")
            await MainActor.run {
                self.currentWeather = cached.weather
            }
            return cached.weather
        }

        guard !apiKey.isEmpty else {
            return await fetchMockWeather(cityName: cityName)
        }

        await MainActor.run {
            self.isLoading = true
            self.error = nil
        }

        do {
            let weather = try await fetchRealWeather(cityName: cityName)

            // Cache the result
            weatherCache[cityName] = CachedWeather(weather: weather, timestamp: Date())

            await MainActor.run {
                self.currentWeather = weather
                self.isLoading = false
            }

            return weather

        } catch {
            print("❌ Weather fetch error: \(error.localizedDescription)")

            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }

            return await fetchMockWeather(cityName: cityName)
        }
    }

    /// Clear weather cache
    func clearCache() {
        weatherCache.removeAll()
        print("🗑️ Weather cache cleared")
    }

    // MARK: - Private Methods - Real API

    private func fetchRealWeather(location: CLLocation) async throws -> WeatherData {
        let lat = location.coordinate.latitude
        let lon = location.coordinate.longitude

        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "lat", value: "\(lat)"),
            URLQueryItem(name: "lon", value: "\(lon)"),
            URLQueryItem(name: "appid", value: apiKey),
            URLQueryItem(name: "units", value: "imperial") // Fahrenheit
        ]

        guard let url = components.url else {
            throw WeatherError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw WeatherError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw WeatherError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        let weatherResponse = try decoder.decode(OpenWeatherMapResponse.self, from: data)

        return parseWeatherResponse(weatherResponse)
    }

    private func fetchRealWeather(cityName: String) async throws -> WeatherData {
        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "q", value: cityName),
            URLQueryItem(name: "appid", value: apiKey),
            URLQueryItem(name: "units", value: "imperial")
        ]

        guard let url = components.url else {
            throw WeatherError.invalidURL
        }

        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw WeatherError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw WeatherError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        let weatherResponse = try decoder.decode(OpenWeatherMapResponse.self, from: data)

        return parseWeatherResponse(weatherResponse)
    }

    private func parseWeatherResponse(_ response: OpenWeatherMapResponse) -> WeatherData {
        let visibilityInMiles = Double(response.visibility) * 0.000621371 // meters to miles

        return WeatherData(
            temperature: response.main.temp,
            feelsLike: response.main.feels_like,
            condition: response.weather.first?.main ?? "Unknown",
            description: response.weather.first?.description.capitalized ?? "Unknown",
            humidity: response.main.humidity,
            windSpeed: response.wind.speed,
            visibility: visibilityInMiles,
            timestamp: Date(),
            location: response.name
        )
    }

    // MARK: - Mock Data (for simulator/testing)

    private func fetchMockWeather(for location: CLLocation) async -> WeatherData {
        // Simulate network delay
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        let mockWeather = WeatherData(
            temperature: Double.random(in: 55...85),
            feelsLike: Double.random(in: 50...80),
            condition: ["Clear", "Clouds", "Rain", "Partly Cloudy"].randomElement()!,
            description: "Mock weather data for testing",
            humidity: Int.random(in: 40...80),
            windSpeed: Double.random(in: 5...15),
            visibility: Double.random(in: 8...10),
            timestamp: Date(),
            location: "Current Location"
        )

        await MainActor.run {
            self.currentWeather = mockWeather
            self.isLoading = false
        }

        print("🎭 Using mock weather data")
        return mockWeather
    }

    private func fetchMockWeather(cityName: String) async -> WeatherData {
        // Simulate network delay
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

        let mockWeather = WeatherData(
            temperature: Double.random(in: 55...85),
            feelsLike: Double.random(in: 50...80),
            condition: ["Clear", "Clouds", "Rain", "Partly Cloudy"].randomElement()!,
            description: "Mock weather data for testing",
            humidity: Int.random(in: 40...80),
            windSpeed: Double.random(in: 5...15),
            visibility: Double.random(in: 8...10),
            timestamp: Date(),
            location: cityName
        )

        await MainActor.run {
            self.currentWeather = mockWeather
            self.isLoading = false
        }

        print("🎭 Using mock weather data for \(cityName)")
        return mockWeather
    }
}

// MARK: - Weather Errors

enum WeatherError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
    case noData

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid weather API URL"
        case .invalidResponse:
            return "Invalid response from weather service"
        case .httpError(let statusCode):
            return "HTTP error: \(statusCode)"
        case .decodingError:
            return "Failed to decode weather data"
        case .noData:
            return "No weather data available"
        }
    }
}

// MARK: - Weather Display Helpers

extension WeatherData {
    var temperatureString: String {
        "\(Int(temperature.rounded()))°F"
    }

    var feelsLikeString: String {
        "Feels like \(Int(feelsLike.rounded()))°F"
    }

    var windSpeedString: String {
        String(format: "%.1f mph", windSpeed)
    }

    var visibilityString: String {
        String(format: "%.1f mi", visibility)
    }

    var humidityString: String {
        "\(humidity)%"
    }
}
