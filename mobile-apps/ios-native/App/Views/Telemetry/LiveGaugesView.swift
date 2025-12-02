//
//  LiveGaugesView.swift
//  Fleet Manager
//
//  Real-time circular gauges for vehicle telemetry display
//

import SwiftUI

struct LiveGaugesView: View {
    let telemetry: TelemetryData?

    var body: some View {
        VStack(spacing: 20) {
            if let telemetry = telemetry {
                // Primary Gauges Row
                HStack(spacing: 16) {
                    CircularGauge(
                        value: telemetry.speed,
                        maxValue: 120,
                        label: "Speed",
                        unit: "MPH",
                        dangerZone: 80...120,
                        icon: "speedometer"
                    )

                    CircularGauge(
                        value: telemetry.rpm,
                        maxValue: 8000,
                        label: "RPM",
                        unit: "RPM",
                        dangerZone: 5000...8000,
                        icon: "engine.combustion.fill"
                    )
                }

                // Secondary Gauges Row
                HStack(spacing: 16) {
                    CircularGauge(
                        value: telemetry.fuelLevel,
                        maxValue: 100,
                        label: "Fuel",
                        unit: "%",
                        dangerZone: 0...15,
                        icon: "fuelpump.fill"
                    )

                    CircularGauge(
                        value: telemetry.engineTemp,
                        maxValue: 280,
                        label: "Temp",
                        unit: "°F",
                        dangerZone: 220...280,
                        icon: "thermometer.sun.fill"
                    )
                }

                // Tertiary Gauges Row
                HStack(spacing: 16) {
                    CompactGauge(
                        value: telemetry.batteryVoltage,
                        maxValue: 16,
                        label: "Battery",
                        unit: "V",
                        dangerZone: 0...11.5,
                        icon: "battery.100"
                    )

                    if let throttle = telemetry.throttlePosition {
                        CompactGauge(
                            value: throttle,
                            maxValue: 100,
                            label: "Throttle",
                            unit: "%",
                            dangerZone: nil,
                            icon: "pedal.accelerator.fill"
                        )
                    }

                    if let engineLoad = telemetry.engineLoad {
                        CompactGauge(
                            value: engineLoad,
                            maxValue: 100,
                            label: "Load",
                            unit: "%",
                            dangerZone: 80...100,
                            icon: "gauge.high"
                        )
                    }
                }
            } else {
                noDataView
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }

    private var noDataView: some View {
        VStack(spacing: 16) {
            Image(systemName: "antenna.radiowaves.left.and.right.slash")
                .font(.system(size: 50))
                .foregroundColor(.secondary)

            Text("No Telemetry Data")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Waiting for vehicle data...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(height: 200)
    }
}

// MARK: - Circular Gauge Component
struct CircularGauge: View {
    let value: Double
    let maxValue: Double
    let label: String
    let unit: String
    let dangerZone: ClosedRange<Double>?
    let icon: String

    private var percentage: Double {
        min(max(value / maxValue, 0), 1)
    }

    private var gaugeColor: Color {
        if let danger = dangerZone, danger.contains(value) {
            return .red
        } else if percentage > 0.8 {
            return .orange
        } else {
            return .blue
        }
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                // Background circle
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 16)
                    .frame(width: 120, height: 120)

                // Progress circle
                Circle()
                    .trim(from: 0, to: percentage)
                    .stroke(
                        gaugeColor,
                        style: StrokeStyle(lineWidth: 16, lineCap: .round)
                    )
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: percentage)

                // Center content
                VStack(spacing: 4) {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(gaugeColor)

                    Text(formatValue(value))
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)

                    Text(unit)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
        }
    }

    private func formatValue(_ value: Double) -> String {
        if value < 10 {
            return String(format: "%.1f", value)
        } else {
            return String(format: "%.0f", value)
        }
    }
}

// MARK: - Compact Gauge Component
struct CompactGauge: View {
    let value: Double
    let maxValue: Double
    let label: String
    let unit: String
    let dangerZone: ClosedRange<Double>?
    let icon: String

    private var percentage: Double {
        min(max(value / maxValue, 0), 1)
    }

    private var gaugeColor: Color {
        if let danger = dangerZone, danger.contains(value) {
            return .red
        } else if percentage > 0.8 {
            return .orange
        } else {
            return .green
        }
    }

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(gaugeColor)

                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
            }

            ZStack(alignment: .leading) {
                // Background bar
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 8)

                // Progress bar
                GeometryReader { geometry in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(gaugeColor)
                        .frame(width: geometry.size.width * percentage, height: 8)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: percentage)
                }
                .frame(height: 8)
            }

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(formatValue(value))
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                Text(unit)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(8)
    }

    private func formatValue(_ value: Double) -> String {
        if value < 10 {
            return String(format: "%.1f", value)
        } else {
            return String(format: "%.0f", value)
        }
    }
}

// MARK: - Linear Gauge Component (Alternative style)
struct LinearGauge: View {
    let value: Double
    let maxValue: Double
    let label: String
    let unit: String
    let dangerZone: ClosedRange<Double>?

    private var percentage: Double {
        min(max(value / maxValue, 0), 1)
    }

    private var gaugeColor: Color {
        if let danger = dangerZone, danger.contains(value) {
            return .red
        } else if percentage > 0.8 {
            return .orange
        } else {
            return .blue
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Spacer()

                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(String(format: "%.0f", value))
                        .font(.headline)
                        .fontWeight(.bold)
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.gray.opacity(0.2))

                    // Progress
                    RoundedRectangle(cornerRadius: 6)
                        .fill(gaugeColor)
                        .frame(width: geometry.size.width * percentage)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: percentage)

                    // Danger zone indicator
                    if let danger = dangerZone {
                        let dangerStart = danger.lowerBound / maxValue
                        let dangerWidth = (danger.upperBound - danger.lowerBound) / maxValue

                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.red.opacity(0.2))
                            .frame(
                                width: geometry.size.width * dangerWidth,
                                height: geometry.size.height
                            )
                            .offset(x: geometry.size.width * dangerStart)
                    }
                }
            }
            .frame(height: 12)
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(8)
    }
}

// MARK: - Speedometer Style Gauge (Advanced)
struct SpeedometerGauge: View {
    let value: Double
    let maxValue: Double
    let label: String
    let unit: String

    private var angle: Double {
        let percentage = min(max(value / maxValue, 0), 1)
        return 270 * percentage // 270 degrees arc
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                // Outer ring
                Circle()
                    .stroke(Color.gray.opacity(0.1), lineWidth: 20)
                    .frame(width: 140, height: 140)

                // Tick marks
                ForEach(0..<9) { index in
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 2, height: 10)
                        .offset(y: -60)
                        .rotationEffect(.degrees(Double(index) * 33.75 - 135))
                }

                // Arc gauge
                Circle()
                    .trim(from: 0, to: 0.75) // 270 degree arc
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: [.green, .yellow, .orange, .red]),
                            center: .center,
                            startAngle: .degrees(-135),
                            endAngle: .degrees(135)
                        ),
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .frame(width: 140, height: 140)
                    .rotationEffect(.degrees(-135))

                // Needle
                Rectangle()
                    .fill(Color.primary)
                    .frame(width: 3, height: 50)
                    .offset(y: -25)
                    .rotationEffect(.degrees(angle - 135))
                    .animation(.spring(response: 0.8, dampingFraction: 0.7), value: angle)

                // Center circle
                Circle()
                    .fill(Color.primary)
                    .frame(width: 12, height: 12)

                // Value display
                VStack(spacing: 2) {
                    Text(String(format: "%.0f", value))
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                    Text(unit)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .offset(y: 30)
            }

            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview
#Preview {
    ScrollView {
        VStack(spacing: 20) {
            LiveGaugesView(telemetry: TelemetryData(
                vehicleId: "test-1",
                speed: 65,
                rpm: 2800,
                engineTemp: 195,
                fuelLevel: 75,
                batteryVoltage: 13.8,
                throttlePosition: 45,
                engineLoad: 60
            ))

            Text("Individual Gauge Styles")
                .font(.headline)
                .padding(.top)

            CircularGauge(
                value: 3500,
                maxValue: 8000,
                label: "RPM",
                unit: "RPM",
                dangerZone: 5000...8000,
                icon: "engine.combustion.fill"
            )

            SpeedometerGauge(
                value: 55,
                maxValue: 120,
                label: "Speed",
                unit: "MPH"
            )

            LinearGauge(
                value: 180,
                maxValue: 280,
                label: "Engine Temperature",
                unit: "°F",
                dangerZone: 220...280
            )
        }
        .padding()
    }
}
