//
//  VehicleUtilizationView.swift
//  Fleet Manager - iOS Native App
//
//  Vehicle-Specific Utilization Analytics
//  Deep-dive into individual vehicle usage patterns
//

import SwiftUI
import Charts

struct VehicleUtilizationView: View {
    @ObservedObject var viewModel: AnalyticsViewModel
    @State private var sortOption: SortOption = .utilizationDesc

    enum SortOption: String, CaseIterable {
        case utilizationDesc = "Highest Utilization"
        case utilizationAsc = "Lowest Utilization"
        case milesDesc = "Most Miles"
        case hoursDesc = "Most Hours"
        case vehicleNumber = "Vehicle Number"

        var icon: String {
            switch self {
            case .utilizationDesc, .utilizationAsc:
                return "gauge"
            case .milesDesc:
                return "location.fill"
            case .hoursDesc:
                return "clock.fill"
            case .vehicleNumber:
                return "number"
            }
        }
    }

    var sortedVehicles: [VehicleUtilization] {
        switch sortOption {
        case .utilizationDesc:
            return viewModel.utilizationData.sorted { $0.utilizationRate > $1.utilizationRate }
        case .utilizationAsc:
            return viewModel.utilizationData.sorted { $0.utilizationRate < $1.utilizationRate }
        case .milesDesc:
            return viewModel.utilizationData.sorted { $0.milesDriven > $1.milesDriven }
        case .hoursDesc:
            return viewModel.utilizationData.sorted { $0.activeHours > $1.activeHours }
        case .vehicleNumber:
            return viewModel.utilizationData.sorted { $0.vehicleNumber < $1.vehicleNumber }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Summary Card
                summaryCard

                // Sort Picker
                sortPicker

                // Utilization Chart
                utilizationChart

                // Vehicle Cards
                vehicleCards
            }
            .padding()
        }
        .navigationTitle("Vehicle Utilization")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Summary Card

    private var summaryCard: some View {
        VStack(spacing: 12) {
            Text("Fleet Utilization Overview")
                .font(.headline)

            HStack(spacing: 16) {
                VStack {
                    Text(averageUtilization)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    Text("Avg Utilization")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Divider()
                    .frame(height: 40)

                VStack {
                    Text("\(highUtilizationCount)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    Text("High (>80%)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Divider()
                    .frame(height: 40)

                VStack {
                    Text("\(lowUtilizationCount)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    Text("Low (<60%)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Sort Picker

    private var sortPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sort By")
                .font(.headline)

            Picker("Sort By", selection: $sortOption) {
                ForEach(SortOption.allCases, id: \.self) { option in
                    Label(option.rawValue, systemImage: option.icon)
                        .tag(option)
                }
            }
            .pickerStyle(MenuPickerStyle())
        }
    }

    // MARK: - Utilization Chart

    private var utilizationChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Utilization Rate Comparison")
                .font(.headline)

            Chart(sortedVehicles) { vehicle in
                BarMark(
                    x: .value("Vehicle", vehicle.vehicleNumber),
                    y: .value("Utilization", vehicle.utilizationRate * 100)
                )
                .foregroundStyle(utilizationGradient(for: vehicle.utilizationRate))
                .annotation(position: .top) {
                    Text(String(format: "%.0f%%", vehicle.utilizationRate * 100))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                RuleMark(y: .value("Target", 80))
                    .foregroundStyle(Color.green.opacity(0.3))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
            }
            .frame(height: 250)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisValueLabel {
                        if let intValue = value.as(Int.self) {
                            Text("\(intValue)%")
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Vehicle Cards

    private var vehicleCards: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Vehicle Details")
                .font(.headline)

            ForEach(sortedVehicles) { vehicle in
                VehicleUtilizationCard(vehicle: vehicle)
            }
        }
    }

    // MARK: - Computed Properties

    private var averageUtilization: String {
        let avg = viewModel.utilizationData.reduce(0.0) { $0 + $1.utilizationRate } / Double(viewModel.utilizationData.count)
        return String(format: "%.0f%%", avg * 100)
    }

    private var highUtilizationCount: Int {
        viewModel.utilizationData.filter { $0.utilizationRate >= 0.8 }.count
    }

    private var lowUtilizationCount: Int {
        viewModel.utilizationData.filter { $0.utilizationRate < 0.6 }.count
    }

    // MARK: - Helper Methods

    private func utilizationGradient(for rate: Double) -> LinearGradient {
        let color: Color = rate >= 0.8 ? .green : (rate >= 0.6 ? .orange : .red)
        return LinearGradient(
            gradient: Gradient(colors: [color, color.opacity(0.6)]),
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

// MARK: - Vehicle Utilization Card

struct VehicleUtilizationCard: View {
    let vehicle: VehicleUtilization

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(vehicle.vehicleNumber)
                        .font(.headline)
                    Text("ID: \(vehicle.vehicleId)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(vehicle.formattedUtilization)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(vehicle.utilizationColor)

                    utilizationBadge
                }
            }

            // Progress Bar
            VStack(alignment: .leading, spacing: 4) {
                ProgressView(value: vehicle.utilizationRate)
                    .tint(vehicle.utilizationColor)

                HStack {
                    Text("Target: 80%")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(vehicle.utilizationRate >= 0.8 ? "On Track" : "Below Target")
                        .font(.caption2)
                        .foregroundColor(vehicle.utilizationRate >= 0.8 ? .green : .orange)
                }
            }

            Divider()

            // Metrics Grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                MetricItem(
                    icon: "clock.fill",
                    label: "Active Hours",
                    value: "\(vehicle.activeHours)h"
                )

                MetricItem(
                    icon: "hourglass",
                    label: "Total Hours",
                    value: "\(vehicle.totalHours)h"
                )

                MetricItem(
                    icon: "location.fill",
                    label: "Miles Driven",
                    value: String(format: "%.0f", vehicle.milesDriven)
                )
            }

            // Insights
            if vehicle.utilizationRate < 0.6 {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Low utilization - consider redeployment")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.1))
                .cornerRadius(8)
            } else if vehicle.utilizationRate >= 0.9 {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Excellent utilization")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var utilizationBadge: some View {
        Text(utilizationLevel)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(vehicle.utilizationColor)
            .cornerRadius(6)
    }

    private var utilizationLevel: String {
        switch vehicle.utilizationRate {
        case 0.9...:
            return "Excellent"
        case 0.8..<0.9:
            return "Good"
        case 0.6..<0.8:
            return "Fair"
        default:
            return "Low"
        }
    }
}

// MARK: - Metric Item

struct MetricItem: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        VehicleUtilizationView(viewModel: AnalyticsViewModel())
    }
}
