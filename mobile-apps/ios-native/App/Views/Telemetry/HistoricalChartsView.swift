//
//  HistoricalChartsView.swift
//  Fleet Manager
//
//  Time-series charts for historical telemetry data visualization
//

import SwiftUI
import Charts

struct HistoricalChartsView: View {
    let data: [TelemetryData]
    @State private var selectedMetric: MetricType = .speed

    var body: some View {
        VStack(spacing: 20) {
            if data.isEmpty {
                noDataView
            } else {
                // Metric selector
                metricPicker

                // Chart
                chartView

                // Statistics
                statisticsView
            }
        }
    }

    // MARK: - No Data View
    private var noDataView: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Historical Data")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Select a time period to view telemetry trends")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(height: 300)
    }

    // MARK: - Metric Picker
    private var metricPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(MetricType.allCases, id: \.self) { metric in
                    MetricButton(
                        metric: metric,
                        isSelected: selectedMetric == metric,
                        action: { selectedMetric = metric }
                    )
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Chart View
    private var chartView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(selectedMetric.displayName)
                .font(.headline)
                .padding(.horizontal)

            Chart {
                ForEach(data) { telemetry in
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value(selectedMetric.displayName, getValue(telemetry))
                    )
                    .foregroundStyle(selectedMetric.color)
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value(selectedMetric.displayName, getValue(telemetry))
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [selectedMetric.color.opacity(0.3), selectedMetric.color.opacity(0.05)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 5)) { value in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.hour().minute())
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel()
                }
            }
            .frame(height: 250)
            .padding()
            .background(Color.secondary.opacity(0.05))
            .cornerRadius(12)
        }
    }

    // MARK: - Statistics View
    private var statisticsView: some View {
        let values = data.map { getValue($0) }
        let min = values.min() ?? 0
        let max = values.max() ?? 0
        let avg = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)

        return VStack(alignment: .leading, spacing: 12) {
            Text("Statistics")
                .font(.headline)

            HStack(spacing: 16) {
                StatisticCard(
                    title: "Average",
                    value: String(format: "%.1f", avg),
                    unit: selectedMetric.unit,
                    color: .blue
                )

                StatisticCard(
                    title: "Minimum",
                    value: String(format: "%.1f", min),
                    unit: selectedMetric.unit,
                    color: .green
                )

                StatisticCard(
                    title: "Maximum",
                    value: String(format: "%.1f", max),
                    unit: selectedMetric.unit,
                    color: .orange
                )
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }

    // MARK: - Helper Methods
    private func getValue(_ telemetry: TelemetryData) -> Double {
        switch selectedMetric {
        case .speed:
            return telemetry.speed
        case .rpm:
            return telemetry.rpm
        case .fuelLevel:
            return telemetry.fuelLevel
        case .engineTemp:
            return telemetry.engineTemp
        case .batteryVoltage:
            return telemetry.batteryVoltage
        case .throttle:
            return telemetry.throttlePosition ?? 0
        case .engineLoad:
            return telemetry.engineLoad ?? 0
        }
    }
}

// MARK: - Metric Type
enum MetricType: String, CaseIterable {
    case speed = "speed"
    case rpm = "rpm"
    case fuelLevel = "fuel"
    case engineTemp = "temp"
    case batteryVoltage = "battery"
    case throttle = "throttle"
    case engineLoad = "load"

    var displayName: String {
        switch self {
        case .speed: return "Speed"
        case .rpm: return "RPM"
        case .fuelLevel: return "Fuel Level"
        case .engineTemp: return "Engine Temp"
        case .batteryVoltage: return "Battery Voltage"
        case .throttle: return "Throttle Position"
        case .engineLoad: return "Engine Load"
        }
    }

    var unit: String {
        switch self {
        case .speed: return "MPH"
        case .rpm: return "RPM"
        case .fuelLevel: return "%"
        case .engineTemp: return "°F"
        case .batteryVoltage: return "V"
        case .throttle: return "%"
        case .engineLoad: return "%"
        }
    }

    var icon: String {
        switch self {
        case .speed: return "speedometer"
        case .rpm: return "engine.combustion.fill"
        case .fuelLevel: return "fuelpump.fill"
        case .engineTemp: return "thermometer.sun.fill"
        case .batteryVoltage: return "battery.100"
        case .throttle: return "pedal.accelerator.fill"
        case .engineLoad: return "gauge.high"
        }
    }

    var color: Color {
        switch self {
        case .speed: return .blue
        case .rpm: return .purple
        case .fuelLevel: return .green
        case .engineTemp: return .orange
        case .batteryVoltage: return .yellow
        case .throttle: return .indigo
        case .engineLoad: return .red
        }
    }
}

// MARK: - Metric Button
struct MetricButton: View {
    let metric: MetricType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: metric.icon)
                    .font(.caption)
                Text(metric.displayName)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? metric.color : Color.secondary.opacity(0.1))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Statistic Card
struct StatisticCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(color)

                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Multi-Metric Chart View
struct MultiMetricChartView: View {
    let data: [TelemetryData]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("All Metrics Overview")
                .font(.headline)

            Chart {
                ForEach(data) { telemetry in
                    // Speed
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value("Value", telemetry.speed / 120 * 100), // Normalize to 0-100
                        series: .value("Metric", "Speed")
                    )
                    .foregroundStyle(Color.blue)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    // RPM
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value("Value", telemetry.rpm / 8000 * 100), // Normalize to 0-100
                        series: .value("Metric", "RPM")
                    )
                    .foregroundStyle(Color.purple)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    // Fuel Level
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value("Value", telemetry.fuelLevel),
                        series: .value("Metric", "Fuel")
                    )
                    .foregroundStyle(Color.green)
                    .lineStyle(StrokeStyle(lineWidth: 2))
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 5)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.hour().minute())
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .chartYScale(domain: 0...100)
            .chartLegend(position: .top, alignment: .leading)
            .frame(height: 300)
            .padding()
            .background(Color.secondary.opacity(0.05))
            .cornerRadius(12)
        }
    }
}

// MARK: - Comparison Chart View
struct ComparisonChartView: View {
    let data: [TelemetryData]
    let metric1: MetricType
    let metric2: MetricType

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Label(metric1.displayName, systemImage: metric1.icon)
                    .font(.caption)
                    .foregroundColor(metric1.color)

                Spacer()

                Label(metric2.displayName, systemImage: metric2.icon)
                    .font(.caption)
                    .foregroundColor(metric2.color)
            }
            .padding(.horizontal)

            Chart {
                ForEach(data) { telemetry in
                    // First metric
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value(metric1.displayName, getValue(telemetry, for: metric1)),
                        series: .value("Metric", metric1.displayName)
                    )
                    .foregroundStyle(metric1.color)

                    // Second metric
                    LineMark(
                        x: .value("Time", telemetry.timestamp),
                        y: .value(metric2.displayName, getValue(telemetry, for: metric2)),
                        series: .value("Metric", metric2.displayName)
                    )
                    .foregroundStyle(metric2.color)
                }
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 5))
            }
            .frame(height: 250)
            .padding()
            .background(Color.secondary.opacity(0.05))
            .cornerRadius(12)
        }
    }

    private func getValue(_ telemetry: TelemetryData, for metric: MetricType) -> Double {
        switch metric {
        case .speed: return telemetry.speed
        case .rpm: return telemetry.rpm
        case .fuelLevel: return telemetry.fuelLevel
        case .engineTemp: return telemetry.engineTemp
        case .batteryVoltage: return telemetry.batteryVoltage
        case .throttle: return telemetry.throttlePosition ?? 0
        case .engineLoad: return telemetry.engineLoad ?? 0
        }
    }
}

// MARK: - Preview
#Preview {
    ScrollView {
        VStack(spacing: 20) {
            // Generate sample data
            let sampleData = (0..<50).map { index in
                let time = Date().addingTimeInterval(Double(index) * -60) // Every minute
                return TelemetryData(
                    vehicleId: "test-1",
                    timestamp: time,
                    speed: 45 + Double.random(in: -10...10),
                    rpm: 2500 + Double.random(in: -500...500),
                    engineTemp: 190 + Double.random(in: -5...5),
                    fuelLevel: 80 - Double(index) * 0.5,
                    batteryVoltage: 13.5 + Double.random(in: -0.3...0.3),
                    throttlePosition: Double.random(in: 20...60),
                    engineLoad: Double.random(in: 30...70)
                )
            }.reversed()

            HistoricalChartsView(data: Array(sampleData))

            Text("Multi-Metric View")
                .font(.headline)
                .padding(.top)

            MultiMetricChartView(data: Array(sampleData))

            Text("Comparison View")
                .font(.headline)
                .padding(.top)

            ComparisonChartView(
                data: Array(sampleData),
                metric1: .speed,
                metric2: .rpm
            )
        }
        .padding()
    }
}
