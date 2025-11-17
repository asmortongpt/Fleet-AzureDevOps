import SwiftUI

// MARK: - Fleet Metrics Card Component
struct FleetMetricsCard: View {

    // MARK: - Properties
    let data: MetricCardData

    // MARK: - Body
    var body: some View {
        VStack(spacing: 12) {
            // Icon
            Image(systemName: data.icon)
                .font(.system(size: 32))
                .foregroundColor(colorForName(data.color))
                .accessibilityHidden(true)

            // Value
            Text(data.value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.5)

            // Title
            Text(data.title)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 4)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(data.accessibilityLabel)
        .accessibilityAddTraits(.isStaticText)
    }

    // MARK: - Helper Methods

    /// Convert string color name to SwiftUI Color
    private func colorForName(_ name: String) -> Color {
        switch name.lowercased() {
        case "blue":
            return .blue
        case "green":
            return .green
        case "orange":
            return .orange
        case "red":
            return .red
        case "purple":
            return .purple
        case "teal":
            return .teal
        case "indigo":
            return .indigo
        case "yellow":
            return .yellow
        case "pink":
            return .pink
        case "gray":
            return .gray
        default:
            return .blue
        }
    }
}

// MARK: - Preview
struct FleetMetricsCard_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Single card preview
            FleetMetricsCard(
                data: MetricCardData(
                    title: "Total Vehicles",
                    value: "45",
                    icon: "car.2.fill",
                    color: "blue",
                    accessibilityLabel: "Total vehicles: 45"
                )
            )
            .padding()
            .previewLayout(.sizeThatFits)
            .previewDisplayName("Single Card")

            // Grid preview
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 16),
                    GridItem(.flexible(), spacing: 16)
                ],
                spacing: 16
            ) {
                FleetMetricsCard(
                    data: MetricCardData(
                        title: "Total Vehicles",
                        value: "45",
                        icon: "car.2.fill",
                        color: "blue",
                        accessibilityLabel: "Total vehicles: 45"
                    )
                )

                FleetMetricsCard(
                    data: MetricCardData(
                        title: "Active Trips",
                        value: "12",
                        icon: "map.fill",
                        color: "green",
                        accessibilityLabel: "Active trips: 12"
                    )
                )

                FleetMetricsCard(
                    data: MetricCardData(
                        title: "Maintenance Due",
                        value: "5",
                        icon: "wrench.and.screwdriver.fill",
                        color: "orange",
                        accessibilityLabel: "Vehicles needing maintenance: 5"
                    )
                )

                FleetMetricsCard(
                    data: MetricCardData(
                        title: "Utilization",
                        value: "73%",
                        icon: "chart.bar.fill",
                        color: "purple",
                        accessibilityLabel: "Fleet utilization rate: 73 percent"
                    )
                )
            }
            .padding()
            .previewLayout(.sizeThatFits)
            .previewDisplayName("Grid Layout")

            // Dark mode preview
            FleetMetricsCard(
                data: MetricCardData(
                    title: "Active Drivers",
                    value: "38",
                    icon: "person.fill",
                    color: "indigo",
                    accessibilityLabel: "Active drivers: 38"
                )
            )
            .padding()
            .previewLayout(.sizeThatFits)
            .preferredColorScheme(.dark)
            .previewDisplayName("Dark Mode")

            // Long text preview
            FleetMetricsCard(
                data: MetricCardData(
                    title: "Very Long Title That Wraps",
                    value: "999",
                    icon: "exclamationmark.triangle.fill",
                    color: "red",
                    accessibilityLabel: "Test metric: 999"
                )
            )
            .padding()
            .previewLayout(.sizeThatFits)
            .previewDisplayName("Long Title")
        }
    }
}
