import SwiftUI
import Charts

struct UtilizationChartView: View {
    let vehicles: [Vehicle]
    let viewModel: FleetOptimizerViewModel

    @State private var selectedChartType = 0
    @State private var selectedVehicle: Vehicle?

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Chart Type Picker
            chartTypePicker

            // Chart Content
            switch selectedChartType {
            case 0:
                utilizationBarChart
            case 1:
                utilizationHeatmap
            case 2:
                utilizationTrend
            default:
                EmptyView()
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Chart Type Picker
    private var chartTypePicker: some View {
        Picker("Chart Type", selection: $selectedChartType) {
            Text("By Vehicle").tag(0)
            Text("Heatmap").tag(1)
            Text("Trend").tag(2)
        }
        .pickerStyle(.segmented)
    }

    // MARK: - Utilization Bar Chart
    private var utilizationBarChart: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Vehicle Utilization Comparison")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Chart {
                ForEach(sortedVehicles()) { vehicle in
                    let utilization = viewModel.calculateUtilization(for: vehicle)

                    BarMark(
                        x: .value("Utilization", utilization * 100),
                        y: .value("Vehicle", vehicle.number)
                    )
                    .foregroundStyle(utilizationGradient(utilization))
                    .annotation(position: .trailing) {
                        Text("\(Int(utilization * 100))%")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
            .chartXScale(domain: 0...100)
            .chartXAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let intValue = value.as(Int.self) {
                            Text("\(intValue)%")
                                .font(ModernTheme.Typography.caption2)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let stringValue = value.as(String.self) {
                            Text(stringValue)
                                .font(ModernTheme.Typography.caption1)
                        }
                    }
                }
            }
            .frame(height: CGFloat(min(vehicles.count * 50, 400)))

            // Legend
            utilizationLegend
        }
    }

    // MARK: - Utilization Heatmap
    private var utilizationHeatmap: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("Utilization Heatmap")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            // Simulate weekly utilization data
            let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

            Chart {
                ForEach(Array(vehicles.prefix(10).enumerated()), id: \.offset) { index, vehicle in
                    ForEach(Array(days.enumerated()), id: \.offset) { dayIndex, day in
                        let utilization = simulateUtilization(vehicle: vehicle, dayOffset: dayIndex)

                        RectangleMark(
                            x: .value("Day", day),
                            y: .value("Vehicle", vehicle.number),
                            width: .ratio(0.9),
                            height: .ratio(0.8)
                        )
                        .foregroundStyle(by: .value("Utilization", utilization))
                    }
                }
            }
            .chartForegroundStyleScale([
                0.0...0.3: Color.red.opacity(0.7),
                0.3...0.5: Color.orange.opacity(0.7),
                0.5...0.75: Color.yellow.opacity(0.7),
                0.75...1.0: Color.green.opacity(0.7)
            ])
            .frame(height: CGFloat(min(vehicles.count * 40, 400)))

            Text("Color indicates utilization: 🟢 High (75%+) • 🟡 Moderate (50-75%) • 🟠 Low (30-50%) • 🔴 Very Low (<30%)")
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
                .padding(.top, ModernTheme.Spacing.xs)
        }
    }

    // MARK: - Utilization Trend
    private var utilizationTrend: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            Text("30-Day Utilization Trend")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            // Generate 30 days of trend data
            let trendData = generateTrendData()

            Chart {
                // Average line
                ForEach(trendData) { data in
                    LineMark(
                        x: .value("Date", data.date),
                        y: .value("Avg Utilization", data.avgUtilization * 100)
                    )
                    .foregroundStyle(ModernTheme.Colors.primary)
                    .lineStyle(StrokeStyle(lineWidth: 3))
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("Date", data.date),
                        yStart: .value("Min", data.minUtilization * 100),
                        yEnd: .value("Max", data.maxUtilization * 100)
                    )
                    .foregroundStyle(ModernTheme.Colors.primary.opacity(0.2))
                }

                // Target line
                RuleMark(y: .value("Target", 75))
                    .foregroundStyle(Color.green)
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
                    .annotation(position: .top, alignment: .trailing) {
                        Text("Target 75%")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(.green)
                    }
            }
            .chartYScale(domain: 0...100)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: 5)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let intValue = value.as(Int.self) {
                            Text("\(intValue)%")
                                .font(ModernTheme.Typography.caption2)
                        }
                    }
                }
            }
            .frame(height: 250)

            // Statistics
            HStack(spacing: ModernTheme.Spacing.lg) {
                StatItem(
                    label: "Current",
                    value: "\(Int((trendData.last?.avgUtilization ?? 0) * 100))%",
                    color: ModernTheme.Colors.primary
                )

                StatItem(
                    label: "30-Day Avg",
                    value: "\(Int(averageUtilization(from: trendData) * 100))%",
                    color: .blue
                )

                StatItem(
                    label: "Peak",
                    value: "\(Int((trendData.max(by: { $0.maxUtilization < $1.maxUtilization })?.maxUtilization ?? 0) * 100))%",
                    color: .green
                )
            }
            .padding(.top, ModernTheme.Spacing.sm)
        }
    }

    // MARK: - Utilization Legend
    private var utilizationLegend: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            LegendItem(color: .red, label: "Very Low (<30%)")
            LegendItem(color: .orange, label: "Low (30-50%)")
            LegendItem(color: .yellow, label: "Moderate (50-75%)")
            LegendItem(color: .green, label: "Good (75%+)")
        }
        .font(ModernTheme.Typography.caption2)
    }

    // MARK: - Helper Methods

    private func sortedVehicles() -> [Vehicle] {
        vehicles.sorted { vehicle1, vehicle2 in
            viewModel.calculateUtilization(for: vehicle1) > viewModel.calculateUtilization(for: vehicle2)
        }
    }

    private func utilizationGradient(_ utilization: Double) -> LinearGradient {
        let color: Color
        switch utilization {
        case 0..<0.30:
            color = .red
        case 0.30..<0.50:
            color = .orange
        case 0.50..<0.75:
            color = .yellow
        default:
            color = .green
        }

        return LinearGradient(
            colors: [color.opacity(0.6), color],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private func simulateUtilization(vehicle: Vehicle, dayOffset: Int) -> Double {
        // Simulate varying utilization by day
        let baseUtilization = viewModel.calculateUtilization(for: vehicle)
        let variance = Double.random(in: -0.15...0.15)
        let weekendPenalty = (dayOffset >= 5) ? -0.20 : 0.0

        return max(0, min(1.0, baseUtilization + variance + weekendPenalty))
    }

    private func generateTrendData() -> [TrendDataPoint] {
        let calendar = Calendar.current
        let today = Date()

        return (0..<30).map { dayOffset in
            let date = calendar.date(byAdding: .day, value: -29 + dayOffset, to: today)!

            // Simulate trend with some variance
            let baseUtilization = 0.65
            let trend = Double(dayOffset) * 0.003 // Slight upward trend
            let variance = Double.random(in: -0.08...0.08)

            let avgUtilization = max(0.3, min(0.9, baseUtilization + trend + variance))
            let minUtilization = max(0, avgUtilization - 0.15)
            let maxUtilization = min(1.0, avgUtilization + 0.15)

            return TrendDataPoint(
                date: date,
                avgUtilization: avgUtilization,
                minUtilization: minUtilization,
                maxUtilization: maxUtilization
            )
        }
    }

    private func averageUtilization(from data: [TrendDataPoint]) -> Double {
        guard !data.isEmpty else { return 0 }
        let sum = data.reduce(0.0) { $0 + $1.avgUtilization }
        return sum / Double(data.count)
    }
}

// MARK: - Supporting Types

struct TrendDataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let avgUtilization: Double
    let minUtilization: Double
    let maxUtilization: Double
}

struct LegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xxs) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text(label)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }
}

struct StatItem: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.xxs) {
            Text(value)
                .font(ModernTheme.Typography.headline)
                .foregroundColor(color)

            Text(label)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.tertiaryText)
        }
    }
}

// MARK: - Extension
extension FleetOptimizerViewModel {
    func calculateUtilization(for vehicle: Vehicle) -> Double {
        // Estimate based on status - in production this would use real data
        switch vehicle.status {
        case .active:
            return 0.65 + Double.random(in: -0.15...0.25)
        case .idle:
            return 0.35 + Double.random(in: -0.15...0.15)
        case .charging:
            return 0.50 + Double.random(in: -0.10...0.20)
        case .service:
            return 0.0
        case .emergency:
            return 0.85 + Double.random(in: -0.05...0.10)
        case .offline:
            return 0.0
        }
    }
}

// MARK: - Preview
#Preview {
    UtilizationChartView(
        vehicles: [
            Vehicle(
                id: "1",
                tenantId: "t1",
                number: "F-101",
                type: .truck,
                make: "Ford",
                model: "F-150",
                year: 2022,
                vin: "1FTFW1E50NFA12345",
                licensePlate: "ABC123",
                status: .active,
                location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "Washington, DC"),
                region: "North",
                department: "Operations",
                fuelLevel: 0.75,
                fuelType: .gasoline,
                mileage: 45000,
                ownership: .owned,
                lastService: "2024-10-15",
                nextService: "2024-12-15",
                alerts: []
            ),
            Vehicle(
                id: "2",
                tenantId: "t1",
                number: "F-102",
                type: .van,
                make: "Ford",
                model: "Transit",
                year: 2021,
                vin: "1FTBW1E50NFA12346",
                licensePlate: "DEF456",
                status: .idle,
                location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "Washington, DC"),
                region: "South",
                department: "Operations",
                fuelLevel: 0.50,
                fuelType: .diesel,
                mileage: 62000,
                ownership: .leased,
                lastService: "2024-09-20",
                nextService: "2024-11-20",
                alerts: []
            )
        ],
        viewModel: FleetOptimizerViewModel()
    )
    .padding()
}
