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
