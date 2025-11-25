//
//  PredictionDetailView.swift
//  Fleet Manager
//
//  Detailed view for individual predictions with insights and recommendations
//

import SwiftUI
import Charts

struct PredictionDetailView: View {
    let predictionId: String
    @StateObject private var viewModel = PredictiveAnalyticsViewModel()
    @State private var prediction: Prediction?
    @State private var showShareSheet = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if let prediction = prediction {
                predictionContent(prediction)
            } else if viewModel.loadingState.isLoading {
                loadingView
            } else if viewModel.errorMessage != nil {
                errorView
            }
        }
        .navigationTitle("Prediction Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showShareSheet = true }) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .task {
            await loadPrediction()
        }
        .sheet(isPresented: $showShareSheet) {
            if let prediction = prediction {
                ShareSheet(prediction: prediction)
            }
        }
    }

    // MARK: - Prediction Content

    private func predictionContent(_ prediction: Prediction) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header Card
                headerCard(prediction)

                // Confidence Section
                confidenceSection(prediction)

                // Timeline Section
                timelineSection(prediction)

                // Contributing Factors
                factorsSection(prediction)

                // Recommendations
                recommendationsSection(prediction)

                // Actions
                actionsSection(prediction)
            }
            .padding()
        }
    }

    // MARK: - Header Card

    private func headerCard(_ prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: prediction.type.icon)
                    .font(.title)
                    .foregroundColor(getTypeColor(prediction.type))
                    .frame(width: 50, height: 50)
                    .background(getTypeColor(prediction.type).opacity(0.1))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 4) {
                    Text(prediction.type.rawValue)
                        .font(.title2)
                        .fontWeight(.bold)

                    if let vehicleNumber = prediction.vehicleNumber {
                        Text("Vehicle: \(vehicleNumber)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    if let driverName = prediction.driverName {
                        Text("Driver: \(driverName)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(spacing: 6) {
                    SeverityBadge(severity: prediction.severity)
                }
            }

            Divider()

            Text(prediction.description)
                .font(.body)
                .foregroundColor(.primary)

            HStack {
                Label(prediction.formattedPredictedDate, systemImage: "calendar")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                Label(prediction.predictionValue, systemImage: "chart.line.uptrend.xyaxis")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Confidence Section

    private func confidenceSection(_ prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "checkmark.shield.fill")
                    .foregroundColor(.blue)
                Text("Confidence Score")
                    .font(.headline)
            }

            VStack(spacing: 12) {
                // Confidence Percentage
                HStack {
                    Text("\(prediction.confidencePercentage)%")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(getConfidenceColor(prediction.confidenceScore))

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text(prediction.confidenceLevel.rawValue)
                            .font(.headline)
                            .foregroundColor(getConfidenceColor(prediction.confidenceScore))
                        Text("Confidence")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 12)
                            .cornerRadius(6)

                        Rectangle()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        getConfidenceColor(prediction.confidenceScore),
                                        getConfidenceColor(prediction.confidenceScore).opacity(0.7)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * prediction.confidenceScore, height: 12)
                            .cornerRadius(6)
                    }
                }
                .frame(height: 12)

                // Confidence Scale
                HStack {
                    Text("Low")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("Medium")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("High")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Timeline Section

    private func timelineSection(_ prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.blue)
                Text("Timeline")
                    .font(.headline)
            }

            VStack(spacing: 16) {
                TimelineItem(
                    title: "Prediction Generated",
                    date: prediction.createdAt,
                    icon: "wand.and.stars",
                    color: .blue,
                    isCompleted: true
                )

                TimelineItem(
                    title: "Current Status",
                    date: Date(),
                    icon: "clock.fill",
                    color: .orange,
                    isCompleted: true
                )

                TimelineItem(
                    title: "Predicted Event",
                    date: prediction.predictedDate,
                    icon: prediction.type.icon,
                    color: getSeverityColor(prediction.severity),
                    isCompleted: false
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Factors Section

    private func factorsSection(_ prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "chart.bar.doc.horizontal")
                    .foregroundColor(.blue)
                Text("Contributing Factors")
                    .font(.headline)
            }

            if prediction.factors.isEmpty {
                Text("No specific factors identified")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(spacing: 12) {
                    ForEach(prediction.factors.sorted(by: { $0.weight > $1.weight })) { factor in
                        FactorRow(factor: factor)
                    }
                }
            }

            // Factors Chart
            if !prediction.factors.isEmpty {
                Chart(prediction.factors.sorted(by: { $0.weight > $1.weight }).prefix(5)) { factor in
                    BarMark(
                        x: .value("Weight", factor.weight * 100),
                        y: .value("Factor", factor.name)
                    )
                    .foregroundStyle(Color.blue.gradient)
                }
                .frame(height: CGFloat(prediction.factors.prefix(5).count) * 40)
                .chartXAxisLabel("Impact (%)")
                .padding(.top)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Recommendations Section

    private func recommendationsSection(_ prediction: Prediction) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                Text("Recommended Actions")
                    .font(.headline)
            }

            if prediction.recommendations.isEmpty {
                Text("No specific recommendations available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(spacing: 12) {
                    ForEach(Array(prediction.recommendations.enumerated()), id: \.offset) { index, recommendation in
                        RecommendationRow(
                            number: index + 1,
                            text: recommendation
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Actions Section

    private func actionsSection(_ prediction: Prediction) -> some View {
        VStack(spacing: 12) {
            if prediction.type == .maintenance {
                ActionButton(
                    title: "Schedule Maintenance",
                    icon: "wrench.and.screwdriver",
                    color: .orange
                ) {
                    // Navigate to maintenance scheduling
                }
            }

            if prediction.type == .breakdown {
                ActionButton(
                    title: "View Vehicle Details",
                    icon: "car.fill",
                    color: .blue
                ) {
                    // Navigate to vehicle details
                }
            }

            ActionButton(
                title: "Create Work Order",
                icon: "doc.text.fill",
                color: .green
            ) {
                // Navigate to work order creation
            }

            ActionButton(
                title: "Set Reminder",
                icon: "bell.fill",
                color: .purple
            ) {
                // Set reminder for predicted date
            }
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading prediction details...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error View

    private var errorView: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("Unable to Load Prediction")
                .font(.headline)

            Button(action: {
                Task {
                    await loadPrediction()
                }
            }) {
                Label("Try Again", systemImage: "arrow.clockwise")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    // MARK: - Helper Methods

    private func loadPrediction() async {
        prediction = await viewModel.fetchPredictionDetail(id: predictionId)
    }

    private func getTypeColor(_ type: PredictionType) -> Color {
        switch type.color {
        case "orange": return .orange
        case "red": return .red
        case "green": return .green
        case "blue": return .blue
        case "purple": return .purple
        default: return .gray
        }
    }

    private func getConfidenceColor(_ score: Double) -> Color {
        if score >= 0.8 {
            return .green
        } else if score >= 0.5 {
            return .orange
        } else {
            return .red
        }
    }

    private func getSeverityColor(_ severity: PredictionSeverity) -> Color {
        switch severity.color {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Timeline Item

struct TimelineItem: View {
    let title: String
    let date: Date
    let icon: String
    let color: Color
    let isCompleted: Bool

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(isCompleted ? color : color.opacity(0.3))
                    .frame(width: 40, height: 40)

                Image(systemName: icon)
                    .foregroundColor(.white)
                    .font(.system(size: 16, weight: .semibold))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(isCompleted ? .primary : .secondary)

                Text(date.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
    }
}

// MARK: - Factor Row

struct FactorRow: View {
    let factor: PredictionFactor

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(factor.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    if let description = factor.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Text(factor.value)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            }

            // Weight indicator
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: geometry.size.width * factor.weight, height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)

            Text("Impact: \(factor.weightPercentage)%")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Recommendation Row

struct RecommendationRow: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 28, height: 28)

                Text("\(number)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }

            Text(text)
                .font(.subheadline)
                .foregroundColor(.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Action Button

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.headline)
                Text(title)
                    .font(.headline)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
            }
            .foregroundColor(.white)
            .padding()
            .background(color)
            .cornerRadius(10)
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: View {
    let prediction: Prediction
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: prediction.type.icon)
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Share Prediction")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Export this prediction to share with your team or save for records")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                VStack(spacing: 12) {
                    ShareButton(
                        title: "Export as PDF",
                        icon: "doc.fill",
                        action: {
                            // Export PDF logic
                            dismiss()
                        }
                    )

                    ShareButton(
                        title: "Share via Email",
                        icon: "envelope.fill",
                        action: {
                            // Email share logic
                            dismiss()
                        }
                    )

                    ShareButton(
                        title: "Copy Details",
                        icon: "doc.on.doc.fill",
                        action: {
                            // Copy to clipboard
                            UIPasteboard.general.string = generatePredictionReport()
                            dismiss()
                        }
                    )
                }
                .padding()

                Spacer()
            }
            .padding()
            .navigationTitle("Export")
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

    private func generatePredictionReport() -> String {
        var report = "Prediction Report\n"
        report += "================\n\n"
        report += "Type: \(prediction.type.rawValue)\n"
        report += "Confidence: \(prediction.confidencePercentage)%\n"
        report += "Severity: \(prediction.severity.rawValue)\n"
        report += "Predicted Date: \(prediction.formattedPredictedDate)\n\n"
        report += "Description:\n\(prediction.description)\n\n"

        if !prediction.factors.isEmpty {
            report += "Contributing Factors:\n"
            for factor in prediction.factors {
                report += "- \(factor.name): \(factor.value)\n"
            }
            report += "\n"
        }

        if !prediction.recommendations.isEmpty {
            report += "Recommendations:\n"
            for (index, recommendation) in prediction.recommendations.enumerated() {
                report += "\(index + 1). \(recommendation)\n"
            }
        }

        return report
    }
}

// MARK: - Share Button

struct ShareButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.headline)
                    .frame(width: 24)
                Text(title)
                    .font(.headline)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .foregroundColor(.primary)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        PredictionDetailView(predictionId: "preview-id")
    }
}
