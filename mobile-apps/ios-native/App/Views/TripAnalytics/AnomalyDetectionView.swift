//
//  AnomalyDetectionView.swift
//  Fleet Manager
//
//  Anomaly Detection View with Severity Flags and Detailed Analysis
//

import SwiftUI
import MapKit

struct AnomalyDetectionView: View {
    let anomalies: [TripAnomaly]
    @State private var selectedAnomaly: TripAnomaly?
    @State private var filterSeverity: TripAnomaly.Severity?
    @State private var filterType: TripAnomaly.AnomalyType?

    var filteredAnomalies: [TripAnomaly] {
        var result = anomalies

        if let severity = filterSeverity {
            result = result.filter { $0.severity == severity }
        }

        if let type = filterType {
            result = result.filter { $0.type == type }
        }

        return result.sorted { $0.severity.priority > $1.severity.priority }
    }

    var body: some View {
        VStack(spacing: 0) {
            if anomalies.isEmpty {
                emptyStateView
            } else {
                VStack(spacing: 16) {
                    // Summary Stats
                    summaryStatsView

                    // Filters
                    filterSection

                    // Anomalies List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredAnomalies) { anomaly in
                                AnomalyCard(anomaly: anomaly) {
                                    selectedAnomaly = anomaly
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .sheet(item: $selectedAnomaly) { anomaly in
            AnomalyDetailView(anomaly: anomaly)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("No Anomalies Detected")
                .font(.title2)
                .fontWeight(.semibold)

            Text("All trips are within normal parameters")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Summary Stats
    private var summaryStatsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SeverityStatCard(
                    severity: .critical,
                    count: anomalies.filter { $0.severity == .critical }.count
                )

                SeverityStatCard(
                    severity: .high,
                    count: anomalies.filter { $0.severity == .high }.count
                )

                SeverityStatCard(
                    severity: .medium,
                    count: anomalies.filter { $0.severity == .medium }.count
                )

                SeverityStatCard(
                    severity: .low,
                    count: anomalies.filter { $0.severity == .low }.count
                )
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Filter Section
    private var filterSection: some View {
        VStack(spacing: 12) {
            // Severity Filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "All Severities",
                        isSelected: filterSeverity == nil
                    ) {
                        filterSeverity = nil
                    }

                    ForEach(TripAnomaly.Severity.allCases, id: \.self) { severity in
                        FilterChip(
                            title: severity.rawValue,
                            isSelected: filterSeverity == severity,
                            color: colorForSeverity(severity.color)
                        ) {
                            filterSeverity = severity
                        }
                    }
                }
                .padding(.horizontal)
            }

            // Type Filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "All Types",
                        isSelected: filterType == nil
                    ) {
                        filterType = nil
                    }

                    ForEach(TripAnomaly.AnomalyType.allCases.prefix(4), id: \.self) { type in
                        FilterChip(
                            title: type.rawValue,
                            isSelected: filterType == type
                        ) {
                            filterType = type
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    private func colorForSeverity(_ colorString: String) -> Color {
        switch colorString {
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        case "purple": return .purple
        default: return .gray
        }
    }
}

// MARK: - Severity Stat Card
struct SeverityStatCard: View {
    let severity: TripAnomaly.Severity
    let count: Int

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(backgroundColor.opacity(0.2))
                    .frame(width: 50, height: 50)

                Text("\(count)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(textColor)
            }

            Text(severity.rawValue)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 90)
        .padding(.vertical, 12)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }

    private var backgroundColor: Color {
        switch severity.color {
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        case "purple": return .purple
        default: return .gray
        }
    }

    private var textColor: Color {
        backgroundColor
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    var color: Color = .blue
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

// MARK: - Anomaly Card
struct AnomalyCard: View {
    let anomaly: TripAnomaly
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack(alignment: .top) {
                    Image(systemName: anomaly.type.icon)
                        .font(.title2)
                        .foregroundColor(severityColor)
                        .frame(width: 40, height: 40)
                        .background(severityColor.opacity(0.1))
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(anomaly.type.rawValue)
                            .font(.headline)

                        Text(anomaly.description)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }

                    Spacer()

                    SeverityBadge(severity: anomaly.severity)
                }

                Divider()

                // Metrics
                HStack(spacing: 16) {
                    MetricItem(
                        label: "Deviation",
                        value: anomaly.formattedDeviation,
                        icon: "chart.line.uptrend.xyaxis"
                    )

                    MetricItem(
                        label: "Z-Score",
                        value: String(format: "%.2f", abs(anomaly.zScore)),
                        icon: "function"
                    )

                    MetricItem(
                        label: "Detected",
                        value: formatRelativeDate(anomaly.detectedAt),
                        icon: "clock.fill"
                    )
                }

                // Comparison
                if anomaly.expectedValue > 0 {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Comparison")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        HStack {
                            ComparisonValue(
                                label: "Expected",
                                value: String(format: "%.1f", anomaly.expectedValue),
                                color: .gray
                            )

                            Image(systemName: "arrow.right")
                                .font(.caption)
                                .foregroundColor(.gray)

                            ComparisonValue(
                                label: "Actual",
                                value: String(format: "%.1f", anomaly.actualValue),
                                color: severityColor
                            )
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(severityColor.opacity(0.3), lineWidth: 2)
            )
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var severityColor: Color {
        switch anomaly.severity.color {
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        case "purple": return .purple
        default: return .gray
        }
    }

    private func formatRelativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Severity Badge
struct SeverityBadge: View {
    let severity: TripAnomaly.Severity

    var body: some View {
        Text(severity.rawValue.uppercased())
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(.white)
            .cornerRadius(6)
    }

    private var backgroundColor: Color {
        switch severity.color {
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        case "purple": return .purple
        default: return .gray
        }
    }
}

// MARK: - Metric Item
struct MetricItem: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)

            Text(value)
                .font(.caption)
                .fontWeight(.semibold)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Comparison Value
struct ComparisonValue: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Anomaly Detail View
struct AnomalyDetailView: View {
    @Environment(\.dismiss) var dismiss
    let anomaly: TripAnomaly
    @State private var region: MKCoordinateRegion

    init(anomaly: TripAnomaly) {
        self.anomaly = anomaly
        let coordinate = anomaly.location ?? CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)
        _region = State(initialValue: MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Severity Header
                    HStack {
                        Image(systemName: anomaly.type.icon)
                            .font(.largeTitle)
                            .foregroundColor(severityColor)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(anomaly.type.rawValue)
                                .font(.title2)
                                .fontWeight(.bold)

                            HStack {
                                SeverityBadge(severity: anomaly.severity)
                                Text("Detected \(formatDate(anomaly.detectedAt))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Spacer()
                    }
                    .padding()
                    .background(severityColor.opacity(0.1))
                    .cornerRadius(12)

                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)

                        Text(anomaly.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Statistical Analysis
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Statistical Analysis")
                            .font(.headline)

                        VStack(spacing: 10) {
                            AnalysisRow(
                                label: "Z-Score",
                                value: String(format: "%.2f", abs(anomaly.zScore)),
                                description: "Standard deviations from mean"
                            )

                            Divider()

                            AnalysisRow(
                                label: "Threshold",
                                value: String(format: "%.1f", anomaly.threshold),
                                description: "Detection threshold"
                            )

                            Divider()

                            AnalysisRow(
                                label: "Deviation",
                                value: anomaly.formattedDeviation,
                                description: "Percentage deviation from expected"
                            )

                            Divider()

                            AnalysisRow(
                                label: "Expected Value",
                                value: String(format: "%.1f", anomaly.expectedValue),
                                description: "Normal range baseline"
                            )

                            Divider()

                            AnalysisRow(
                                label: "Actual Value",
                                value: String(format: "%.1f", anomaly.actualValue),
                                description: "Observed measurement"
                            )
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                    }

                    // Map (if location available)
                    if anomaly.location != nil {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Location")
                                .font(.headline)

                            Map(coordinateRegion: $region, annotationItems: [anomaly]) { item in
                                MapAnnotation(coordinate: item.location!) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(severityColor)
                                        .font(.title)
                                }
                            }
                            .frame(height: 200)
                            .cornerRadius(12)
                        }
                    }

                    // Recommendations
                    if !anomaly.recommendations.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recommendations")
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(Array(anomaly.recommendations.enumerated()), id: \.offset) { index, recommendation in
                                    HStack(alignment: .top, spacing: 12) {
                                        Text("\(index + 1).")
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(severityColor)

                                        Text(recommendation)
                                            .font(.subheadline)
                                    }
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Anomaly Details")
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

    private var severityColor: Color {
        switch anomaly.severity.color {
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        case "purple": return .purple
        default: return .gray
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Analysis Row
struct AnalysisRow: View {
    let label: String
    let value: String
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                Text(value)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }

            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview
struct AnomalyDetectionView_Previews: PreviewProvider {
    static var previews: some View {
        AnomalyDetectionView(anomalies: [])
    }
}
