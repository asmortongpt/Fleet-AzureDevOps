//
//  PredictiveMaintenanceView.swift
//  Fleet Manager
//
//  Dashboard for predictive maintenance with ML-based failure predictions
//

import SwiftUI
import Charts

struct PredictiveMaintenanceView: View {
    @StateObject private var viewModel = PredictiveMaintenanceViewModel()
    @State private var selectedPrediction: MaintenancePrediction?
    @State private var showFilterSheet = false
    @State private var showExportSheet = false
    @State private var selectedVehicle: Vehicle?

    let vehicleId: String
    let vehicle: Vehicle?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Summary Cards
                    summarySection

                    // Critical Alerts
                    if !viewModel.criticalPredictions.isEmpty {
                        criticalAlertsSection
                    }

                    // Urgent Recommendations
                    if !viewModel.urgentRecommendations.isEmpty {
                        urgentRecommendationsSection
                    }

                    // Predictions List
                    predictionsSection

                    // Component Health Overview
                    if !viewModel.componentHealth.isEmpty {
                        componentHealthSection
                    }
                }
                .padding()
            }
            .navigationTitle("Predictive Maintenance")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showFilterSheet = true
                        } label: {
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button {
                            showExportSheet = true
                        } label: {
                            Label("Export Report", systemImage: "square.and.arrow.up")
                        }

                        Divider()

                        Picker("Sort By", selection: $viewModel.sortOption) {
                            ForEach(SortOption.allCases, id: \.self) { option in
                                Text(option.rawValue).tag(option)
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task {
                            await viewModel.refresh()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isRefreshing)
                }
            }
            .sheet(isPresented: $showFilterSheet) {
                filterSheet
            }
            .sheet(isPresented: $showExportSheet) {
                if let vehicle = vehicle {
                    exportSheet(for: vehicle)
                }
            }
            .sheet(item: $selectedPrediction) { prediction in
                PredictionDetailView(
                    prediction: prediction,
                    vehicle: vehicle,
                    costBenefit: viewModel.calculateCostBenefit(for: prediction)
                )
            }
            .task {
                viewModel.selectedVehicleId = vehicleId
                await viewModel.loadPredictions(for: vehicleId)
            }
            .overlay {
                if viewModel.loadingState.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
        }
    }

    // MARK: - Summary Section
    private var summarySection: some View {
        VStack(spacing: 12) {
            Text("Vehicle Health Overview")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                summaryCard(
                    title: "Overall Health",
                    value: String(format: "%.0f%%", viewModel.averageVehicleHealth),
                    color: healthColor(viewModel.averageVehicleHealth),
                    icon: "heart.fill"
                )

                summaryCard(
                    title: "Critical Issues",
                    value: "\(viewModel.summary?.criticalCount ?? 0)",
                    color: .red,
                    icon: "exclamationmark.triangle.fill"
                )
            }

            HStack(spacing: 12) {
                summaryCard(
                    title: "Total Cost",
                    value: viewModel.summary?.formattedTotalCost ?? "$0",
                    color: .orange,
                    icon: "dollarsign.circle.fill"
                )

                summaryCard(
                    title: "Predictions",
                    value: "\(viewModel.predictions.count)",
                    color: .blue,
                    icon: "chart.line.uptrend.xyaxis"
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func summaryCard(title: String, value: String, color: Color, icon: String) -> some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }

    // MARK: - Critical Alerts
    private var criticalAlertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Critical Alerts")
                    .font(.headline)
                Spacer()
            }

            ForEach(viewModel.criticalPredictions.prefix(3)) { prediction in
                Button {
                    selectedPrediction = prediction
                } label: {
                    criticalAlertCard(prediction)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
        .background(Color.red.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }

    private func criticalAlertCard(_ prediction: MaintenancePrediction) -> some View {
        HStack {
            Image(systemName: prediction.component.icon)
                .font(.title2)
                .foregroundColor(.red)
                .frame(width: 40, height: 40)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 4) {
                Text(prediction.component.displayName)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("Failure predicted in \(prediction.daysUntilFailure) days")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "$%.0f", prediction.estimatedCost))
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("\(prediction.confidencePercentage)% conf.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }

    // MARK: - Urgent Recommendations
    private var urgentRecommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "wrench.fill")
                    .foregroundColor(.orange)
                Text("Urgent Recommendations")
                    .font(.headline)
                Spacer()

                NavigationLink(destination: MaintenanceSchedulerView(recommendations: viewModel.recommendations)) {
                    Text("View All")
                        .font(.caption)
                }
            }

            ForEach(viewModel.urgentRecommendations.prefix(2)) { recommendation in
                recommendationCard(recommendation)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func recommendationCard(_ recommendation: MaintenanceRecommendation) -> some View {
        HStack {
            Image(systemName: recommendation.action.icon)
                .font(.title3)
                .foregroundColor(recommendation.priority.color)
                .frame(width: 36, height: 36)
                .background(recommendation.priority.color.opacity(0.1))
                .cornerRadius(6)

            VStack(alignment: .leading, spacing: 4) {
                Text("\(recommendation.action.displayName) \(recommendation.component.displayName)")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(recommendation.formattedScheduledDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(recommendation.formattedCost)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(recommendation.formattedDuration)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }

    // MARK: - Predictions Section
    private var predictionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("All Predictions")
                    .font(.headline)
                Spacer()

                Toggle("Critical Only", isOn: $viewModel.showOnlyCritical)
                    .labelsHidden()
            }

            if viewModel.filteredPredictions.isEmpty {
                emptyState
            } else {
                ForEach(viewModel.filteredPredictions) { prediction in
                    Button {
                        selectedPrediction = prediction
                    } label: {
                        predictionCard(prediction)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func predictionCard(_ prediction: MaintenancePrediction) -> some View {
        VStack(spacing: 12) {
            HStack {
                // Component Icon & Info
                HStack(spacing: 12) {
                    Image(systemName: prediction.component.icon)
                        .font(.title3)
                        .foregroundColor(prediction.riskLevel.color)
                        .frame(width: 40, height: 40)
                        .background(prediction.riskLevel.color.opacity(0.1))
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(prediction.component.displayName)
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        HStack(spacing: 4) {
                            Image(systemName: prediction.riskLevel.icon)
                            Text(prediction.riskLevel.displayName)
                        }
                        .font(.caption)
                        .foregroundColor(prediction.riskLevel.color)
                    }
                }

                Spacer()

                // Health Score
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(prediction.healthPercentage)%")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(healthColor(prediction.currentHealth))

                    Text("Health")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Details Row
            HStack {
                detailItem(icon: "calendar", text: prediction.formattedFailureDate)
                Spacer()
                detailItem(icon: "clock", text: "\(prediction.daysUntilFailure)d")
                Spacer()
                detailItem(icon: "dollarsign.circle", text: String(format: "$%.0f", prediction.estimatedCost))
                Spacer()
                detailItem(icon: "chart.bar", text: "\(prediction.confidencePercentage)%")
            }
            .font(.caption)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func detailItem(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(.secondary)
            Text(text)
        }
    }

    // MARK: - Component Health Section
    private var componentHealthSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Component Health")
                    .font(.headline)
                Spacer()

                NavigationLink(destination: ComponentHealthView(vehicleId: vehicleId, componentHealth: viewModel.componentHealth)) {
                    Text("View Details")
                        .font(.caption)
                }
            }

            ForEach(viewModel.componentHealth.prefix(5)) { health in
                componentHealthRow(health)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func componentHealthRow(_ health: ComponentHealth) -> some View {
        HStack {
            Image(systemName: health.component.icon)
                .foregroundColor(health.statusColor)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(health.component.displayName)
                    .font(.subheadline)

                ProgressView(value: health.healthScore, total: 100)
                    .tint(health.statusColor)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(Int(health.healthScore))%")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(health.statusColor)

                Text(health.healthStatus.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.shield")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("No Predictions Available")
                .font(.headline)

            Text("All components are in good condition")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }

    // MARK: - Filter Sheet
    private var filterSheet: some View {
        NavigationView {
            Form {
                Section("Risk Level") {
                    Picker("Filter by Risk", selection: $viewModel.filterRiskLevel) {
                        Text("All").tag(nil as RiskLevel?)
                        ForEach(RiskLevel.allCases, id: \.self) { level in
                            Text(level.displayName).tag(level as RiskLevel?)
                        }
                    }
                }

                Section("Component") {
                    Picker("Filter by Component", selection: $viewModel.selectedComponent) {
                        Text("All").tag(nil as ComponentType?)
                        ForEach(ComponentType.allCases, id: \.self) { component in
                            Text(component.displayName).tag(component as ComponentType?)
                        }
                    }
                }

                Section("Display Options") {
                    Toggle("Show Only Critical", isOn: $viewModel.showOnlyCritical)
                }
            }
            .navigationTitle("Filter Predictions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showFilterSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Export Sheet
    private func exportSheet(for vehicle: Vehicle) -> some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Export Prediction Report")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Generate a comprehensive report with all predictions, recommendations, and cost-benefit analyses.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)

                VStack(alignment: .leading, spacing: 12) {
                    reportItem("Predictions: \(viewModel.predictions.count)")
                    reportItem("Recommendations: \(viewModel.recommendations.count)")
                    reportItem("Total Cost: \(viewModel.summary?.formattedTotalCost ?? "$0")")
                    reportItem("Generated: \(Date().formatted())")
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)

                Spacer()

                Button {
                    exportReport(for: vehicle)
                } label: {
                    Text("Generate Report")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showExportSheet = false
                    }
                }
            }
        }
    }

    private func reportItem(_ text: String) -> some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(text)
                .font(.subheadline)
        }
    }

    // MARK: - Helper Functions
    private func healthColor(_ health: Double) -> Color {
        switch health {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }

    private func exportReport(for vehicle: Vehicle) {
        let report = viewModel.exportReport(for: vehicle)

        // In a real app, this would generate a PDF or JSON file
        // For now, just dismiss the sheet
        showExportSheet = false

        // Show success message
        print("Report exported: \(report.generatedDate)")
    }
}

// MARK: - Preview
struct PredictiveMaintenanceView_Previews: PreviewProvider {
    static var previews: some View {
        PredictiveMaintenanceView(
            vehicleId: "vehicle-123",
            vehicle: Vehicle(
                id: "vehicle-123",
                tenantId: "tenant-1",
                number: "V-001",
                type: .truck,
                make: "Ford",
                model: "F-150",
                year: 2020,
                vin: "1FTFW1E50LFA12345",
                licensePlate: "ABC123",
                status: .active,
                location: VehicleLocation(lat: 38.9072, lng: -77.0369, address: "Washington, DC"),
                region: "East",
                department: "Operations",
                fuelLevel: 0.75,
                fuelType: .gasoline,
                mileage: 45000,
                hoursUsed: 2500,
                assignedDriver: "John Doe",
                ownership: .owned,
                lastService: "2024-10-15",
                nextService: "2025-01-15",
                alerts: [],
                customFields: nil,
                tags: nil
            )
        )
    }
}
