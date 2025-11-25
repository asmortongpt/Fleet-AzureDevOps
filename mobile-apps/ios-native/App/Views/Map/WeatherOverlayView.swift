//
//  WeatherOverlayView.swift
//  Fleet Manager
//
//  Weather widget overlay for map display
//

import SwiftUI

struct WeatherOverlayView: View {
    let weatherData: [WeatherOverlay]
    let onWeatherTap: (WeatherOverlay) -> Void

    @State private var selectedIndex = 0
    @State private var showAllLocations = false

    var body: some View {
        if !weatherData.isEmpty {
            VStack(spacing: 0) {
                // Main Weather Card
                if weatherData.indices.contains(selectedIndex) {
                    WeatherCard(
                        weather: weatherData[selectedIndex],
                        onTap: {
                            onWeatherTap(weatherData[selectedIndex])
                        }
                    )
                }

                // Location Selector (if multiple locations)
                if weatherData.count > 1 {
                    LocationSelectorBar(
                        locations: weatherData.map { $0.location.name },
                        selectedIndex: $selectedIndex,
                        onShowAll: {
                            showAllLocations = true
                        }
                    )
                }
            }
            .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
            .sheet(isPresented: $showAllLocations) {
                AllWeatherLocationsView(
                    weatherData: weatherData,
                    selectedIndex: $selectedIndex,
                    onWeatherTap: onWeatherTap
                )
            }
        }
    }
}

// MARK: - Weather Card

struct WeatherCard: View {
    let weather: WeatherOverlay
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Weather Icon and Temperature
                VStack(spacing: 4) {
                    Image(systemName: weather.conditions.icon)
                        .font(.system(size: 36))
                        .foregroundColor(weatherIconColor)
                        .symbolRenderingMode(.hierarchical)

                    Text("\(weather.temperatureFahrenheit)°")
                        .font(.system(size: 28, weight: .medium))
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }
                .frame(width: 70)

                // Weather Details
                VStack(alignment: .leading, spacing: 6) {
                    Text(weather.location.name)
                        .font(ModernTheme.Typography.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                        .lineLimit(1)

                    Text(weather.conditions.displayName)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    // Quick Stats
                    HStack(spacing: 12) {
                        WeatherStat(
                            icon: "drop.fill",
                            value: "\(Int(weather.humidity))%"
                        )

                        WeatherStat(
                            icon: "wind",
                            value: "\(Int(weather.windSpeed))"
                        )

                        if weather.hasActivePrecipitation {
                            WeatherStat(
                                icon: "cloud.rain.fill",
                                value: String(format: "%.1f", weather.precipitation)
                            )
                        }
                    }
                }

                Spacer()

                // Alert Indicator
                if weather.hasSevereAlerts {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.title3)
                        .foregroundColor(.red)
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(weatherBackgroundColor.opacity(0.95))
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var weatherIconColor: Color {
        switch weather.conditions {
        case .clear:
            return .yellow
        case .partlyCloudy:
            return .orange
        case .cloudy:
            return .gray
        case .rain, .sleet:
            return .blue
        case .snow:
            return .cyan
        case .fog:
            return .gray
        case .thunderstorm:
            return .purple
        case .windy:
            return .teal
        }
    }

    private var weatherBackgroundColor: Color {
        if weather.hasSevereAlerts {
            return Color.red.opacity(0.1).blendMode(.multiply)
        }
        return Color.white
    }
}

struct WeatherStat: View {
    let icon: String
    let value: String

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: icon)
                .font(.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(value)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.primaryText)
        }
    }
}

// MARK: - Location Selector Bar

struct LocationSelectorBar: View {
    let locations: [String]
    @Binding var selectedIndex: Int
    let onShowAll: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            // Previous Button
            Button(action: {
                withAnimation {
                    selectedIndex = max(0, selectedIndex - 1)
                }
                ModernTheme.Haptics.selection()
            }) {
                Image(systemName: "chevron.left")
                    .font(.caption)
                    .foregroundColor(selectedIndex > 0 ? ModernTheme.Colors.primary : ModernTheme.Colors.tertiaryText)
                    .frame(width: 24, height: 24)
            }
            .disabled(selectedIndex == 0)

            // Location Indicator
            Button(action: onShowAll) {
                HStack(spacing: 4) {
                    Text("\(selectedIndex + 1) of \(locations.count)")
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Image(systemName: "chevron.down")
                        .font(.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            // Next Button
            Button(action: {
                withAnimation {
                    selectedIndex = min(locations.count - 1, selectedIndex + 1)
                }
                ModernTheme.Haptics.selection()
            }) {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(selectedIndex < locations.count - 1 ? ModernTheme.Colors.primary : ModernTheme.Colors.tertiaryText)
                    .frame(width: 24, height: 24)
            }
            .disabled(selectedIndex == locations.count - 1)
        }
        .padding(.horizontal, ModernTheme.Spacing.sm)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(Color.white.opacity(0.95))
        )
    }
}

// MARK: - All Weather Locations View

struct AllWeatherLocationsView: View {
    let weatherData: [WeatherOverlay]
    @Binding var selectedIndex: Int
    let onWeatherTap: (WeatherOverlay) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.md) {
                    ForEach(Array(weatherData.enumerated()), id: \.element.id) { index, weather in
                        WeatherLocationRow(
                            weather: weather,
                            isSelected: index == selectedIndex,
                            onTap: {
                                selectedIndex = index
                                onWeatherTap(weather)
                                dismiss()
                            }
                        )
                    }
                }
                .padding()
            }
            .background(ModernTheme.Colors.groupedBackground.ignoresSafeArea())
            .navigationTitle("Weather Locations")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct WeatherLocationRow: View {
    let weather: WeatherOverlay
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Weather Icon
                Image(systemName: weather.conditions.icon)
                    .font(.system(size: 32))
                    .foregroundColor(weatherIconColor)
                    .symbolRenderingMode(.hierarchical)
                    .frame(width: 50)

                // Location and Conditions
                VStack(alignment: .leading, spacing: 4) {
                    Text(weather.location.name)
                        .font(ModernTheme.Typography.body)
                        .fontWeight(.semibold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(weather.conditions.displayName)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)

                    // Stats
                    HStack(spacing: 12) {
                        HStack(spacing: 4) {
                            Image(systemName: "drop.fill")
                                .font(.caption2)
                                .foregroundColor(.blue)
                            Text("\(Int(weather.humidity))%")
                                .font(ModernTheme.Typography.caption2)
                        }

                        HStack(spacing: 4) {
                            Image(systemName: "wind")
                                .font(.caption2)
                                .foregroundColor(.gray)
                            Text("\(Int(weather.windSpeed)) mph")
                                .font(ModernTheme.Typography.caption2)
                        }
                    }
                }

                Spacer()

                // Temperature
                VStack(spacing: 2) {
                    Text("\(weather.temperatureFahrenheit)°")
                        .font(.system(size: 32, weight: .light))
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    if weather.hasSevereAlerts {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }

                // Selected Indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(ModernTheme.Colors.primary)
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(isSelected ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.background)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var weatherIconColor: Color {
        switch weather.conditions {
        case .clear:
            return .yellow
        case .partlyCloudy:
            return .orange
        case .cloudy:
            return .gray
        case .rain, .sleet:
            return .blue
        case .snow:
            return .cyan
        case .fog:
            return .gray
        case .thunderstorm:
            return .purple
        case .windy:
            return .teal
        }
    }
}

// MARK: - Compact Weather Widget

struct CompactWeatherWidget: View {
    let weather: WeatherOverlay
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                Image(systemName: weather.conditions.icon)
                    .font(.title3)
                    .foregroundColor(weatherIconColor)
                    .symbolRenderingMode(.hierarchical)

                VStack(alignment: .leading, spacing: 2) {
                    Text("\(weather.temperatureFahrenheit)°")
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(weather.conditions.displayName)
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                if weather.hasSevereAlerts {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
            .padding(ModernTheme.Spacing.sm)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(Color.white.opacity(0.95))
                    .shadow(color: Color.black.opacity(0.2), radius: 4)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var weatherIconColor: Color {
        switch weather.conditions {
        case .clear:
            return .yellow
        case .partlyCloudy:
            return .orange
        case .cloudy:
            return .gray
        case .rain, .sleet:
            return .blue
        case .snow:
            return .cyan
        case .fog:
            return .gray
        case .thunderstorm:
            return .purple
        case .windy:
            return .teal
        }
    }
}

// MARK: - Weather Alert Banner

struct WeatherAlertBanner: View {
    let alerts: [WeatherAlert]
    @State private var currentAlertIndex = 0

    var body: some View {
        if !alerts.isEmpty {
            VStack(spacing: 0) {
                // Alert Content
                HStack(spacing: ModernTheme.Spacing.md) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.title3)
                        .foregroundColor(.white)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(alerts[currentAlertIndex].title)
                            .font(ModernTheme.Typography.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)

                        Text(alerts[currentAlertIndex].description)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(.white.opacity(0.9))
                            .lineLimit(2)
                    }

                    Spacer()

                    if alerts.count > 1 {
                        Text("\(currentAlertIndex + 1)/\(alerts.count)")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                .padding(ModernTheme.Spacing.md)
                .background(alerts[currentAlertIndex].severity.color)
            }
            .onAppear {
                if alerts.count > 1 {
                    startAlertRotation()
                }
            }
        }
    }

    private func startAlertRotation() {
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            withAnimation {
                currentAlertIndex = (currentAlertIndex + 1) % alerts.count
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct WeatherOverlayView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.gray.opacity(0.3)

            VStack {
                HStack {
                    Spacer()
                    WeatherOverlayView(
                        weatherData: [
                            WeatherOverlay(
                                id: "1",
                                location: WeatherLocation(lat: 38.9072, lng: -77.0369, name: "Washington, DC"),
                                temperature: 72,
                                feelsLike: 75,
                                conditions: .partlyCloudy,
                                precipitation: 0.0,
                                precipitationType: nil,
                                windSpeed: 8.5,
                                windDirection: 180,
                                humidity: 65,
                                visibility: 10.0,
                                alerts: [],
                                timestamp: Date()
                            )
                        ],
                        onWeatherTap: { _ in }
                    )
                    .padding()
                }
                Spacer()
            }
        }
    }
}
#endif
