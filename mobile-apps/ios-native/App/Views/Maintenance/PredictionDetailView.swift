//
//  PredictionDetailView.swift
//  Fleet Manager
//
//  Detailed view for individual maintenance predictions
//

import SwiftUI
import Charts

struct PredictionDetailView: View {
    let prediction: MaintenancePrediction
    let vehicle: Vehicle?
    let costBenefit: CostBenefitAnalysis

    @Environment(\.dismiss) var dismiss
    @State private var showScheduleSheet = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header Card
                    headerCard

                    // Risk Assessment
                    riskAssessmentCard

                    // Prediction Details
                    predictionDetailsCard

                    // Cost-Benefit Analysis
                    costBenefitCard

                    // Recommendation
                    recommendationCard

                    // Action Buttons
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("Prediction Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showScheduleSheet) {
                scheduleMaintenanceSheet
            }
        }
    }

    // MARK: - Header Card
    private var headerCard: some View {
        VStack(spacing: 16) {
            // Component Icon
            Image(systemName: prediction.component.icon)
                .font(.system(size: 64))
                .foregroundColor(prediction.riskLevel.color)
                .frame(width: 100, height: 100)
                .background(prediction.riskLevel.color.opacity(0.15))
                .clipShape(Circle())

            // Component Name
            Text(prediction.component.displayName)
                .font(.title2)
                .fontWeight(.bold)

            // Risk Badge
            HStack(spacing: 6) {
                Image(systemName: prediction.riskLevel.icon)
                Text(prediction.riskLevel.displayName + " Risk")
            }
            .font(.subheadline)
            .fontWeight(.semibold)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(prediction.riskLevel.color.opacity(0.2))
            .foregroundColor(prediction.riskLevel.color)
            .cornerRadius(20)

            // Vehicle Info
            if let vehicle = vehicle {
                Text("\(vehicle.year) \(vehicle.make) \(vehicle.model)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text("Vehicle #\(vehicle.number)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 3)
    }

    // MARK: - Risk Assessment
    private var riskAssessmentCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Risk Assessment")
                .font(.headline)

            HStack(spacing: 20) {
                // Health Score
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                            .frame(width: 100, height: 100)

                        Circle()
                            .trim(from: 0, to: prediction.currentHealth / 100)
                            .stroke(healthColor(prediction.currentHealth), lineWidth: 12)
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(prediction.healthPercentage)%")
                                .font(.title3)
                                .fontWeight(.bold)

                            Text("Health")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()

                // Confidence Score
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                            .frame(width: 100, height: 100)

                        Circle()
                            .trim(from: 0, to: prediction.confidence)
                            .stroke(Color.blue, lineWidth: 12)
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(prediction.confidencePercentage)%")
                                .font(.title3)
                                .fontWeight(.bold)

                            Text("Confidence")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            Divider()

            // Timeline
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.secondary)

                    Text("Predicted Failure Date")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(prediction.formattedFailureDate)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.secondary)

                    Text("Days Until Failure")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text("\(prediction.daysUntilFailure) days")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(prediction.isUrgent ? .red : .primary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Prediction Details
    private var predictionDetailsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Analysis Details")
                .font(.headline)

            VStack(spacing: 12) {
                detailRow(
                    icon: "speedometer",
                    label: "Current Mileage",
                    value: String(format: "%.0f mi", prediction.basedOnMileage)
                )

                detailRow(
                    icon: "calendar.badge.clock",
                    label: "Component Age",
                    value: "\(prediction.basedOnAge) days"
                )

                detailRow(
                    icon: "chart.line.downtrend.xyaxis",
                    label: "Degradation Rate",
                    value: String(format: "%.2f%%/day", prediction.degradationRate * 100)
                )

                detailRow(
                    icon: "arrow.triangle.2.circlepath",
                    label: "Recommended Action",
                    value: prediction.recommendedAction.displayName
                )

                if prediction.historicalFailureCount > 0 {
                    detailRow(
                        icon: "chart.bar.doc.horizontal",
                        label: "Historical Failures",
                        value: "\(prediction.historicalFailureCount)"
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Cost-Benefit Analysis
    private var costBenefitCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Cost-Benefit Analysis")
                .font(.headline)

            // Cost Comparison
            HStack(spacing: 16) {
                costColumn(
                    title: "Repair Now",
                    amount: costBenefit.totalCostNow,
                    color: .green,
                    isRecommended: costBenefit.shouldRepairNow
                )

                costColumn(
                    title: "Repair Later",
                    amount: costBenefit.totalCostLater,
                    color: .orange,
                    isRecommended: !costBenefit.shouldRepairNow
                )
            }

            Divider()

            // Savings
            if costBenefit.savings > 0 {
                HStack {
                    Image(systemName: "arrow.down.circle.fill")
                        .foregroundColor(.green)

                    Text("Potential Savings")
                        .font(.subheadline)

                    Spacer()

                    Text(String(format: "$%.2f", costBenefit.savings))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }

            // Safety Risk
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "shield.fill")
                        .foregroundColor(safetyRiskColor)

                    Text("Safety Risk Score")
                        .font(.subheadline)

                    Spacer()

                    Text(String(format: "%.1f/10", costBenefit.safetyRiskScore))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(safetyRiskColor)
                }

                ProgressView(value: costBenefit.safetyRiskScore, total: 10)
                    .tint(safetyRiskColor)
            }

            Divider()

            // Recommendation
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                    .font(.title3)

                Text(costBenefit.recommendation)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.yellow.opacity(0.1))
            .cornerRadius(8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Recommendation Card
    private var recommendationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommended Actions")
                .font(.headline)

            actionItem(
                icon: prediction.recommendedAction.icon,
                title: prediction.recommendedAction.displayName,
                description: actionDescription,
                color: prediction.riskLevel.color
            )

            if prediction.isUrgent {
                actionItem(
                    icon: "exclamationmark.triangle.fill",
                    title: "Urgent Attention Required",
                    description: "This component requires immediate attention to prevent failure",
                    color: .red
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button {
                showScheduleSheet = true
            } label: {
                Label("Schedule Maintenance", systemImage: "calendar.badge.plus")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }

            Button {
                // Export prediction
            } label: {
                Label("Export Prediction", systemImage: "square.and.arrow.up")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
            }
        }
    }

    // MARK: - Helper Views
    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
        }
    }

    private func costColumn(title: String, amount: Double, color: Color, isRecommended: Bool) -> some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(String(format: "$%.2f", amount))
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)

            if isRecommended {
                Text("Recommended")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(color.opacity(0.2))
                    .foregroundColor(color)
                    .cornerRadius(4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }

    private func actionItem(icon: String, title: String, description: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 36, height: 36)
                .background(color.opacity(0.15))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }

    // MARK: - Schedule Sheet
    private var scheduleMaintenanceSheet: some View {
        NavigationView {
            VStack(spacing: 24) {
                Image(systemName: "calendar.badge.plus")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Schedule Maintenance")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Would you like to schedule maintenance for this component?")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Component:")
                        Spacer()
                        Text(prediction.component.displayName)
                            .fontWeight(.semibold)
                    }

                    HStack {
                        Text("Action:")
                        Spacer()
                        Text(prediction.recommendedAction.displayName)
                            .fontWeight(.semibold)
                    }

                    HStack {
                        Text("Estimated Cost:")
                        Spacer()
                        Text(String(format: "$%.2f", prediction.estimatedCost))
                            .fontWeight(.semibold)
                    }

                    HStack {
                        Text("Recommended Date:")
                        Spacer()
                        Text(prediction.formattedFailureDate)
                            .fontWeight(.semibold)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        // Schedule maintenance
                        showScheduleSheet = false
                    } label: {
                        Text("Schedule Now")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    Button {
                        showScheduleSheet = false
                    } label: {
                        Text("Cancel")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .foregroundColor(.primary)
                            .cornerRadius(10)
                    }
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - Computed Properties
    private var actionDescription: String {
        switch prediction.recommendedAction {
        case .inspect:
            return "Schedule a thorough inspection of this component"
        case .service:
            return "Perform maintenance service to restore component health"
        case .replace:
            return "Replace this component to prevent failure"
        case .monitor:
            return "Continue monitoring component condition"
        }
    }

    private var safetyRiskColor: Color {
        if costBenefit.safetyRiskScore >= 7 {
            return .red
        } else if costBenefit.safetyRiskScore >= 4 {
            return .orange
        } else {
            return .green
        }
    }

    private func healthColor(_ health: Double) -> Color {
        switch health {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }
}
