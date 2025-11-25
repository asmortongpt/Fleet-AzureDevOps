//
//  PredictiveAnalyticsView.swift
//  Fleet Manager
//
//  Predictive Analytics Dashboard with AI-powered insights
//

import SwiftUI

struct PredictiveAnalyticsView: View {
    @StateObject private var viewModel = PredictiveAnalyticsViewModel()
    @State private var showExportSheet = false
    @State private var showFilters = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Prediction Type Picker
                predictionTypePicker

                // Filters Bar
                if showFilters {
                    filtersBar
                }

                // Content
                if viewModel.loadingState.isLoading && viewModel.predictions.isEmpty {
                    loadingView
                } else if let error = viewModel.errorMessage, viewModel.predictions.isEmpty {
                    errorView(error)
                } else {
                    predictionsList
                }
            }
            .navigationTitle("Predictive Analytics")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showFilters.toggle() }) {
                        Image(systemName: showFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                            .foregroundColor(.blue)
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: {
                            Task {
                                await viewModel.generatePredictions(type: viewModel.selectedPredictionType)
                            }
                        }) {
                            Label("Generate New Predictions", systemImage: "wand.and.stars")
                        }

                        Button(action: { showExportSheet = true }) {
                            Label("Export Report", systemImage: "square.and.arrow.up")
                        }

                        Button(action: {
                            Task {
                                await viewModel.refreshPredictions()
                            }
                        }) {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showExportSheet) {
                exportSheet
            }
            .task {
                await viewModel.fetchPredictions()
            }
            .refreshable {
                await viewModel.refreshPredictions()
            }
        }
    }

    // MARK: - Prediction Type Picker

    private var predictionTypePicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(PredictionType.allCases, id: \.self) { type in
                    PredictionTypeButton(
                        type: type,
                        isSelected: viewModel.selectedPredictionType == type
                    ) {
                        withAnimation {
                            viewModel.selectPredictionType(type)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 2)
    }

    // MARK: - Filters Bar

    private var filtersBar: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                FilterToggle(
                    title: "High Confidence",
                    icon: "checkmark.shield.fill",
                    isOn: $viewModel.showHighConfidenceOnly
                )

                FilterToggle(
                    title: "Critical Only",
                    icon: "exclamationmark.octagon.fill",
                    isOn: $viewModel.showCriticalOnly
                )

                Spacer()

                Text("\(viewModel.filteredPredictions.count) predictions")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)

            Divider()
        }
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Analyzing fleet data...")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Generating predictions with AI")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error View

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("Unable to Load Predictions")
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: {
                Task {
                    await viewModel.fetchPredictions()
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

    // MARK: - Predictions List

    private var predictionsList: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Summary Card
                if let summary = viewModel.predictionSummary {
                    PredictionSummaryCard(summary: summary)
                        .padding(.horizontal)
                        .padding(.top)
                }

                // Predictions
                if viewModel.filteredPredictions.isEmpty {
                    emptyStateView
                } else {
                    ForEach(viewModel.filteredPredictions) { prediction in
                        NavigationLink(
                            destination: PredictionDetailView(predictionId: prediction.id)
                        ) {
                            PredictionCard(prediction: prediction)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.bottom)
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Predictions Available")
                .font(.headline)

            Text("Generate predictions to see AI-powered insights for your fleet")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: {
                Task {
                    await viewModel.generatePredictions(type: viewModel.selectedPredictionType)
                }
            }) {
                Label("Generate Predictions", systemImage: "wand.and.stars")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
    }

    // MARK: - Export Sheet

    private var exportSheet: some View {
        NavigationView {
            List {
                Section {
                    Button(action: {
                        Task {
                            if let data = await viewModel.exportPredictions() {
                                shareData(data, filename: "predictions.csv")
                            }
                        }
                        showExportSheet = false
                    }) {
                        Label("Export as CSV", systemImage: "tablecells")
                    }

                    Button(action: {
                        let report = viewModel.sharePredictionReport()
                        shareText(report)
                        showExportSheet = false
                    }) {
                        Label("Share Report", systemImage: "square.and.arrow.up")
                    }
                }

                Section(header: Text("Report Contents")) {
                    HStack {
                        Text("Total Predictions")
                        Spacer()
                        Text("\(viewModel.filteredPredictions.count)")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Prediction Type")
                        Spacer()
                        Text(viewModel.selectedPredictionType.rawValue)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("High Confidence")
                        Spacer()
                        Text("\(viewModel.highConfidenceCount)")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Critical Alerts")
                        Spacer()
                        Text("\(viewModel.criticalCount)")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Export Predictions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showExportSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func shareData(_ data: Data, filename: String) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: tempURL)
            let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootVC = window.rootViewController {
                rootVC.present(activityVC, animated: true)
            }
        } catch {
            print("Error sharing data: \(error.localizedDescription)")
        }
    }

    private func shareText(_ text: String) {
        let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootVC = window.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }
}

// MARK: - Prediction Type Button

struct PredictionTypeButton: View {
    let type: PredictionType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: type.icon)
                    .font(.title3)
                Text(type.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .frame(minWidth: 90)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(
                isSelected
                    ? Color.blue.opacity(0.15)
                    : Color.gray.opacity(0.1)
            )
            .foregroundColor(isSelected ? .blue : .primary)
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Filter Toggle

struct FilterToggle: View {
    let title: String
    let icon: String
    @Binding var isOn: Bool

    var body: some View {
        Button(action: {
            withAnimation {
                isOn.toggle()
            }
        }) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                isOn
                    ? Color.blue.opacity(0.15)
                    : Color.gray.opacity(0.1)
            )
            .foregroundColor(isOn ? .blue : .primary)
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Prediction Summary Card

struct PredictionSummaryCard: View {
    let summary: PredictionSummary

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Summary")
                    .font(.headline)
                Spacer()
                Text("Updated: \(summary.lastGeneratedDate.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 12) {
                SummaryMetric(
                    title: "Total",
                    value: "\(summary.totalPredictions)",
                    icon: "chart.bar.fill",
                    color: .blue
                )

                SummaryMetric(
                    title: "High Confidence",
                    value: "\(summary.highConfidencePredictions)",
                    icon: "checkmark.shield.fill",
                    color: .green
                )

                SummaryMetric(
                    title: "Critical",
                    value: "\(summary.criticalPredictions)",
                    icon: "exclamationmark.octagon.fill",
                    color: .red
                )
            }

            HStack {
                Text("Average Confidence")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text(summary.formattedAverageConfidence)
                    .font(.headline)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Summary Metric

struct SummaryMetric: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Prediction Card

struct PredictionCard: View {
    let prediction: Prediction

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: prediction.type.icon)
                    .foregroundColor(getTypeColor(prediction.type))
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(prediction.type.rawValue)
                        .font(.headline)
                    if let vehicleNumber = prediction.vehicleNumber {
                        Text("Vehicle: \(vehicleNumber)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    ConfidenceBadge(score: prediction.confidenceScore)
                    SeverityBadge(severity: prediction.severity)
                }
            }

            // Description
            Text(prediction.description)
                .font(.subheadline)
                .foregroundColor(.primary)
                .lineLimit(2)

            // Predicted Date
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(.secondary)
                    .font(.caption)
                Text(prediction.formattedPredictedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Confidence Bar
            ConfidenceBar(score: prediction.confidenceScore)

            // Factors Preview
            if !prediction.factors.isEmpty {
                HStack {
                    Text("Top Factors:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(prediction.factors.prefix(2).map { $0.name }.joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
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
}

// MARK: - Confidence Badge

struct ConfidenceBadge: View {
    let score: Double

    var body: some View {
        Text("\(Int(score * 100))%")
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(confidenceColor)
            .cornerRadius(6)
    }

    private var confidenceColor: Color {
        if score >= 0.8 {
            return .green
        } else if score >= 0.5 {
            return .orange
        } else {
            return .red
        }
    }
}

// MARK: - Severity Badge

struct SeverityBadge: View {
    let severity: PredictionSeverity

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: severity.icon)
                .font(.caption2)
            Text(severity.rawValue)
                .font(.caption2)
                .fontWeight(.semibold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(severityColor)
        .cornerRadius(6)
    }

    private var severityColor: Color {
        switch severity.color {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Confidence Bar

struct ConfidenceBar: View {
    let score: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 4)
                    .cornerRadius(2)

                Rectangle()
                    .fill(barColor)
                    .frame(width: geometry.size.width * score, height: 4)
                    .cornerRadius(2)
            }
        }
        .frame(height: 4)
    }

    private var barColor: Color {
        if score >= 0.8 {
            return .green
        } else if score >= 0.5 {
            return .orange
        } else {
            return .red
        }
    }
}

// MARK: - Preview

#Preview {
    PredictiveAnalyticsView()
}
