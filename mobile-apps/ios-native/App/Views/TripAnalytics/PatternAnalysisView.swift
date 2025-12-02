//
//  PatternAnalysisView.swift
//  Fleet Manager
//
//  Pattern Analysis View for Recurring Routes and Common Destinations
//

import SwiftUI
import MapKit

struct PatternAnalysisView: View {
    let patterns: [TripPattern]
    @State private var selectedPattern: TripPattern?
    @State private var sortOption: SortOption = .frequency

    enum SortOption: String, CaseIterable {
        case frequency = "Frequency"
        case confidence = "Confidence"
        case recent = "Recent"
        case distance = "Distance"

        var icon: String {
            switch self {
            case .frequency: return "number"
            case .confidence: return "chart.bar.fill"
            case .recent: return "clock.fill"
            case .distance: return "ruler.fill"
            }
        }
    }

    var sortedPatterns: [TripPattern] {
        switch sortOption {
        case .frequency:
            return patterns.sorted { $0.frequency > $1.frequency }
        case .confidence:
            return patterns.sorted { $0.confidence > $1.confidence }
        case .recent:
            return patterns.sorted { $0.lastOccurrence > $1.lastOccurrence }
        case .distance:
            return patterns.sorted { $0.averageDistance > $1.averageDistance }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            if patterns.isEmpty {
                emptyStateView
            } else {
                VStack(spacing: 16) {
                    // Summary Stats
                    summaryStatsView

                    // Sort Options
                    sortOptionsView

                    // Patterns List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(sortedPatterns) { pattern in
                                PatternCard(pattern: pattern) {
                                    selectedPattern = pattern
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .sheet(item: $selectedPattern) { pattern in
            PatternDetailView(pattern: pattern)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Patterns Detected")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Complete more trips to detect recurring patterns")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Summary Stats
    private var summaryStatsView: some View {
        HStack(spacing: 12) {
            SummaryStatCard(
                title: "Total Patterns",
                value: "\(patterns.count)",
                icon: "arrow.triangle.2.circlepath",
                color: .blue
            )

            SummaryStatCard(
                title: "High Confidence",
                value: "\(patterns.filter { $0.confidence >= 0.8 }.count)",
                icon: "checkmark.seal.fill",
                color: .green
            )

            SummaryStatCard(
                title: "Recurring Routes",
                value: "\(patterns.filter { $0.patternType == .recurringRoute }.count)",
                icon: "map.fill",
                color: .orange
            )
        }
        .padding(.horizontal)
    }

    // MARK: - Sort Options
    private var sortOptionsView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(SortOption.allCases, id: \.self) { option in
                    SortButton(
                        option: option,
                        isSelected: sortOption == option
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            sortOption = option
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Summary Stat Card
struct SummaryStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Sort Button
struct SortButton: View {
    let option: PatternAnalysisView.SortOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: option.icon)
                    .font(.caption)
                Text(option.rawValue)
                    .font(.subheadline)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(8)
        }
    }
}

// MARK: - Pattern Card
struct PatternCard: View {
    let pattern: TripPattern
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    Image(systemName: pattern.patternType.icon)
                        .font(.title2)
                        .foregroundColor(colorForType(pattern.patternType.color))
                        .frame(width: 40, height: 40)
                        .background(colorForType(pattern.patternType.color).opacity(0.1))
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(pattern.patternType.rawValue)
                            .font(.headline)

                        HStack(spacing: 4) {
                            Image(systemName: "repeat")
                                .font(.caption)
                            Text(pattern.formattedFrequency)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    ConfidenceBadge(confidence: pattern.confidence)
                }

                Divider()

                // Details Grid
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 12) {
                    DetailItem(
                        icon: "ruler.fill",
                        label: "Avg Distance",
                        value: String(format: "%.1f mi", pattern.averageDistance)
                    )

                    DetailItem(
                        icon: "clock.fill",
                        label: "Avg Duration",
                        value: formatDuration(pattern.averageDuration)
                    )

                    DetailItem(
                        icon: "clock.arrow.circlepath",
                        label: "Peak Hours",
                        value: pattern.peakHoursFormatted
                    )

                    DetailItem(
                        icon: "calendar",
                        label: "Last Seen",
                        value: formatRelativeDate(pattern.lastOccurrence)
                    )
                }

                // Locations Preview
                if !pattern.locations.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Route")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        ForEach(pattern.locations.prefix(2), id: \.address) { location in
                            HStack(spacing: 8) {
                                Image(systemName: location.isStartLocation ? "mappin.circle.fill" : "flag.fill")
                                    .font(.caption)
                                    .foregroundColor(location.isStartLocation ? .green : .red)

                                Text(location.address)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    private func formatRelativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func colorForType(_ colorString: String) -> Color {
        switch colorString {
        case "blue": return .blue
        case "green": return .green
        case "purple": return .purple
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Confidence Badge
struct ConfidenceBadge: View {
    let confidence: Double

    var body: some View {
        VStack(spacing: 2) {
            Text("\(Int(confidence * 100))%")
                .font(.caption)
                .fontWeight(.semibold)
            Text(confidenceLevel)
                .font(.caption2)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(backgroundColor)
        .foregroundColor(textColor)
        .cornerRadius(8)
    }

    private var confidenceLevel: String {
        switch confidence {
        case 0.8...1.0: return "High"
        case 0.5..<0.8: return "Med"
        default: return "Low"
        }
    }

    private var backgroundColor: Color {
        switch confidence {
        case 0.8...1.0: return .green.opacity(0.2)
        case 0.5..<0.8: return .yellow.opacity(0.2)
        default: return .orange.opacity(0.2)
        }
    }

    private var textColor: Color {
        switch confidence {
        case 0.8...1.0: return .green
        case 0.5..<0.8: return .orange
        default: return .red
        }
    }
}

// MARK: - Detail Item
struct DetailItem: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.caption)
                    .fontWeight(.medium)
            }
        }
    }
}

// MARK: - Pattern Detail View
struct PatternDetailView: View {
    @Environment(\.dismiss) var dismiss
    let pattern: TripPattern
    @State private var region: MKCoordinateRegion

    init(pattern: TripPattern) {
        self.pattern = pattern
        let coordinate = pattern.locations.first?.coordinate ?? CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194)
        _region = State(initialValue: MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Map View
                    Map(coordinateRegion: $region, annotationItems: pattern.locations) { location in
                        MapAnnotation(coordinate: location.coordinate) {
                            VStack {
                                Image(systemName: location.isStartLocation ? "mappin.circle.fill" : "flag.fill")
                                    .foregroundColor(location.isStartLocation ? .green : .red)
                                    .font(.title2)
                            }
                        }
                    }
                    .frame(height: 250)
                    .cornerRadius(12)

                    // Pattern Info
                    VStack(alignment: .leading, spacing: 16) {
                        // Type & Confidence
                        HStack {
                            VStack(alignment: .leading) {
                                Text("Pattern Type")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(pattern.patternType.rawValue)
                                    .font(.title3)
                                    .fontWeight(.semibold)
                            }

                            Spacer()

                            VStack(alignment: .trailing) {
                                Text("Confidence")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(pattern.confidenceLevel)
                                    .font(.title3)
                                    .fontWeight(.semibold)
                            }
                        }

                        Divider()

                        // Statistics
                        VStack(alignment: .leading, spacing: 12) {
                            StatRow(label: "Frequency", value: pattern.formattedFrequency, icon: "repeat")
                            StatRow(label: "Average Distance", value: String(format: "%.1f mi", pattern.averageDistance), icon: "ruler.fill")
                            StatRow(label: "Average Duration", value: formatDuration(pattern.averageDuration), icon: "clock.fill")
                            StatRow(label: "Peak Hours", value: pattern.peakHoursFormatted, icon: "clock.arrow.circlepath")
                            StatRow(label: "Last Occurrence", value: formatDate(pattern.lastOccurrence), icon: "calendar")
                        }

                        Divider()

                        // Day of Week Distribution
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Day of Week Distribution")
                                .font(.headline)

                            ForEach(Array(pattern.dayOfWeekDistribution.sorted(by: { $0.key < $1.key })), id: \.key) { day, count in
                                HStack {
                                    Text(dayName(day))
                                        .font(.subheadline)
                                        .frame(width: 100, alignment: .leading)

                                    GeometryReader { geometry in
                                        ZStack(alignment: .leading) {
                                            Rectangle()
                                                .fill(Color(.systemGray5))
                                                .frame(height: 20)

                                            Rectangle()
                                                .fill(Color.blue)
                                                .frame(width: geometry.size.width * (Double(count) / Double(pattern.frequency)), height: 20)
                                        }
                                        .cornerRadius(4)
                                    }
                                    .frame(height: 20)

                                    Text("\(count)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .frame(width: 30, alignment: .trailing)
                                }
                            }
                        }

                        Divider()

                        // Locations
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Locations")
                                .font(.headline)

                            ForEach(pattern.locations, id: \.address) { location in
                                LocationRow(location: location)
                            }
                        }
                    }
                    .padding()
                }
                .padding()
            }
            .navigationTitle("Pattern Details")
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

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func dayName(_ day: Int) -> String {
        let days = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        return days[day]
    }
}

// MARK: - Stat Row
struct StatRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Location Row
struct LocationRow: View {
    let location: TripPattern.PatternLocation

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: location.isStartLocation ? "mappin.circle.fill" : "flag.fill")
                .foregroundColor(location.isStartLocation ? .green : .red)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(location.address)
                    .font(.subheadline)

                Text("\(location.frequency) times")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview
struct PatternAnalysisView_Previews: PreviewProvider {
    static var previews: some View {
        PatternAnalysisView(patterns: [])
    }
}
