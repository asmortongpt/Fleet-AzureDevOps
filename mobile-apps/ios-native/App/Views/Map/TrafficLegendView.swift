//
//  TrafficLegendView.swift
//  Fleet Manager
//
//  Color-coded traffic congestion legend
//

import SwiftUI

struct TrafficLegendView: View {
    @State private var isExpanded = true

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button(action: {
                withAnimation(.spring(response: 0.3)) {
                    isExpanded.toggle()
                }
                ModernTheme.Haptics.light()
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "car.fill")
                        .font(.caption)
                        .foregroundColor(.orange)

                    Text("Traffic")
                        .font(ModernTheme.Typography.caption1)
                        .fontWeight(.semibold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
                .padding(ModernTheme.Spacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                        .fill(Color.white.opacity(0.95))
                )
            }

            // Legend Items
            if isExpanded {
                VStack(spacing: 0) {
                    ForEach(TrafficCongestionLevel.allCases.reversed(), id: \.self) { level in
                        TrafficLegendRow(level: level)

                        if level != .none {
                            Divider()
                                .padding(.leading, 32)
                        }
                    }
                }
                .background(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                        .fill(Color.white.opacity(0.95))
                )
                .padding(.top, 2)
            }
        }
        .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
        .frame(minWidth: 160)
    }
}

struct TrafficLegendRow: View {
    let level: TrafficCongestionLevel

    var body: some View {
        HStack(spacing: 8) {
            // Color Indicator
            RoundedRectangle(cornerRadius: 2)
                .fill(level.color)
                .frame(width: 20, height: 12)

            // Level Name and Speed
            VStack(alignment: .leading, spacing: 2) {
                Text(level.displayName)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                Text(level.speedRange)
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()
        }
        .padding(.horizontal, ModernTheme.Spacing.sm)
        .padding(.vertical, 6)
    }
}

// MARK: - Expanded Traffic Legend (Full Screen)

struct ExpandedTrafficLegendView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    // Header Description
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                        Text("Traffic Congestion Levels")
                            .font(ModernTheme.Typography.title3)
                            .fontWeight(.bold)

                        Text("Real-time traffic data is updated every 5 minutes to show current road conditions.")
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                    .padding()

                    // Detailed Legend
                    VStack(spacing: 0) {
                        ForEach(TrafficCongestionLevel.allCases.reversed(), id: \.self) { level in
                            DetailedTrafficLegendRow(level: level)

                            if level != .none {
                                Divider()
                            }
                        }
                    }
                    .background(
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(ModernTheme.Colors.background)
                    )
                    .padding(.horizontal)

                    // Additional Information
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        Text("Understanding Traffic Data")
                            .font(ModernTheme.Typography.headline)

                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                            InfoRow(
                                icon: "clock.fill",
                                title: "Update Frequency",
                                description: "Traffic data is refreshed every 5 minutes"
                            )

                            InfoRow(
                                icon: "map.fill",
                                title: "Coverage",
                                description: "Major highways, arterial roads, and city streets"
                            )

                            InfoRow(
                                icon: "chart.line.uptrend.xyaxis",
                                title: "Speed Calculation",
                                description: "Based on real-time vehicle movement data"
                            )

                            InfoRow(
                                icon: "exclamationmark.triangle.fill",
                                title: "Alerts",
                                description: "Severe congestion triggers automatic route suggestions"
                            )
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(ModernTheme.Colors.background)
                    )
                    .padding(.horizontal)

                    // Tips Section
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        HStack {
                            Image(systemName: "lightbulb.fill")
                                .foregroundColor(.yellow)
                            Text("Tips")
                                .font(ModernTheme.Typography.headline)
                        }

                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                            TipRow(text: "Red and dark red segments indicate severe delays")
                            TipRow(text: "Plan routes to avoid stopped traffic areas")
                            TipRow(text: "Check for incidents affecting traffic flow")
                            TipRow(text: "Enable auto-refresh for real-time updates")
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(Color.yellow.opacity(0.1))
                    )
                    .padding(.horizontal)
                    .padding(.bottom, ModernTheme.Spacing.xl)
                }
            }
            .background(ModernTheme.Colors.groupedBackground.ignoresSafeArea())
            .navigationTitle("Traffic Legend")
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
}

struct DetailedTrafficLegendRow: View {
    let level: TrafficCongestionLevel

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Color Bar
            RoundedRectangle(cornerRadius: 4)
                .fill(level.color)
                .frame(width: 40, height: 40)

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(level.displayName)
                    .font(ModernTheme.Typography.headline)

                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Image(systemName: "speedometer")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                        Text(level.speedRange)
                            .font(ModernTheme.Typography.subheadline)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }

                    HStack(spacing: 4) {
                        Image(systemName: "opacity")
                            .font(.caption)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                        Text("\(Int(level.opacity * 100))%")
                            .font(ModernTheme.Typography.subheadline)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }

            Spacer()

            // Status Icon
            Image(systemName: statusIcon)
                .font(.title3)
                .foregroundColor(level.color)
        }
        .padding(ModernTheme.Spacing.md)
    }

    private var statusIcon: String {
        switch level {
        case .none:
            return "checkmark.circle.fill"
        case .low:
            return "checkmark.circle"
        case .moderate:
            return "exclamationmark.circle"
        case .heavy:
            return "exclamationmark.triangle.fill"
        case .stopped:
            return "xmark.octagon.fill"
        }
    }
}

struct InfoRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: ModernTheme.Spacing.md) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(ModernTheme.Colors.primary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(ModernTheme.Typography.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
        }
    }
}

struct TipRow: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.caption)
                .foregroundColor(.green)
                .padding(.top, 2)

            Text(text)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.primaryText)
        }
    }
}

// MARK: - Compact Traffic Status Bar

struct CompactTrafficStatusView: View {
    let trafficData: TrafficData?

    var body: some View {
        if let data = trafficData {
            HStack(spacing: 12) {
                Image(systemName: "car.fill")
                    .font(.caption)
                    .foregroundColor(.orange)

                HStack(spacing: 4) {
                    ForEach(TrafficCongestionLevel.allCases.reversed(), id: \.self) { level in
                        let count = segmentCount(for: level, in: data)
                        if count > 0 {
                            HStack(spacing: 2) {
                                Circle()
                                    .fill(level.color)
                                    .frame(width: 8, height: 8)

                                Text("\(count)")
                                    .font(ModernTheme.Typography.caption2)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, ModernTheme.Spacing.sm)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(Color.white.opacity(0.95))
                    .shadow(color: Color.black.opacity(0.2), radius: 4)
            )
        }
    }

    private func segmentCount(for level: TrafficCongestionLevel, in data: TrafficData) -> Int {
        data.segments.filter { $0.congestionLevel == level }.count
    }
}

// MARK: - Preview

#if DEBUG
struct TrafficLegendView_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                TrafficLegendView()
                    .padding()
            }
        }
        .background(Color.gray.opacity(0.3))
    }
}

struct ExpandedTrafficLegendView_Previews: PreviewProvider {
    static var previews: some View {
        ExpandedTrafficLegendView()
    }
}
#endif
