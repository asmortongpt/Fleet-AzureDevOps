import SwiftUI

struct RecommendationCardView: View {
    let recommendation: OptimizationRecommendation
    let isImplemented: Bool
    let onImplement: () -> Void

    @State private var isExpanded = false
    @State private var showingImplementation = false

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack(alignment: .top, spacing: ModernTheme.Spacing.md) {
                // Type Icon
                Image(systemName: recommendation.type.icon)
                    .font(.title2)
                    .foregroundColor(priorityColor)
                    .frame(width: 40, height: 40)
                    .background(priorityColor.opacity(0.15))
                    .cornerRadius(ModernTheme.CornerRadius.sm)

                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    // Title
                    Text(recommendation.title)
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    // Priority Badge
                    HStack(spacing: ModernTheme.Spacing.xs) {
                        priorityBadge

                        Text("•")
                            .foregroundColor(ModernTheme.Colors.tertiaryText)

                        Text(recommendation.timeframe)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                // Expand/Collapse Button
                Button(action: {
                    withAnimation(ModernTheme.Animation.smooth) {
                        isExpanded.toggle()
                    }
                    ModernTheme.Haptics.light()
                }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            // Description
            Text(recommendation.description)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            // Savings and Confidence
            HStack(spacing: ModernTheme.Spacing.lg) {
                savingsIndicator

                Divider()
                    .frame(height: 40)

                confidenceIndicator
            }

            // Expanded Content
            if isExpanded {
                expandedContent
            }

            // Implementation Status or Action
            if isImplemented {
                implementedBanner
            } else {
                implementButton
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .stroke(isImplemented ? Color.green.opacity(0.5) : Color.clear, lineWidth: 2)
        )
    }

    // MARK: - Components

    private var priorityBadge: some View {
        Text(recommendation.priority.displayName.uppercased())
            .font(ModernTheme.Typography.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, ModernTheme.Spacing.sm)
            .padding(.vertical, ModernTheme.Spacing.xxs)
            .background(priorityColor)
            .cornerRadius(ModernTheme.CornerRadius.xs)
    }

    private var savingsIndicator: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.xxs) {
            Text("Est. Savings")
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.tertiaryText)

            HStack(alignment: .firstTextBaseline, spacing: ModernTheme.Spacing.xxs) {
                Text(recommendation.savingsFormatted)
                    .font(ModernTheme.Typography.title3)
                    .fontWeight(.bold)
                    .foregroundColor(ModernTheme.Colors.success)

                Text("/ year")
                    .font(ModernTheme.Typography.caption2)
                    .foregroundColor(ModernTheme.Colors.tertiaryText)
            }
        }
    }

    private var confidenceIndicator: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.xxs) {
            Text("Confidence")
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.tertiaryText)

            HStack(spacing: ModernTheme.Spacing.xs) {
                Text("\(recommendation.confidencePercentage)%")
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(confidenceColor)

                // Confidence bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.xs)
                            .fill(ModernTheme.Colors.tertiaryBackground)
                            .frame(height: 4)

                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.xs)
                            .fill(confidenceColor)
                            .frame(width: geometry.size.width * recommendation.confidence, height: 4)
                    }
                }
                .frame(height: 4)
            }
        }
    }

    private var expandedContent: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            Divider()

            // Implementation Steps
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                Text("Implementation Steps")
                    .font(ModernTheme.Typography.subheadline)
                    .fontWeight(.semibold)

                ForEach(Array(recommendation.implementationSteps.enumerated()), id: \.offset) { index, step in
                    HStack(alignment: .top, spacing: ModernTheme.Spacing.sm) {
                        Text("\(index + 1).")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.primary)
                            .fontWeight(.bold)

                        Text(step)
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }

            // Affected Vehicles
            if !recommendation.affectedVehicles.isEmpty {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Affected Vehicles")
                        .font(ModernTheme.Typography.subheadline)
                        .fontWeight(.semibold)

                    Text("\(recommendation.affectedVehicles.count) vehicle(s)")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            // Metadata
            if let metadata = recommendation.metadata, !metadata.isEmpty {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Additional Details")
                        .font(ModernTheme.Typography.subheadline)
                        .fontWeight(.semibold)

                    ForEach(Array(metadata.keys.sorted()), id: \.self) { key in
                        if let value = metadata[key] {
                            HStack {
                                Text(key.capitalized)
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.tertiaryText)

                                Spacer()

                                Text(value)
                                    .font(ModernTheme.Typography.body)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            }
                        }
                    }
                }
            }
        }
    }

    private var implementedBanner: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)

            Text("Implemented")
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(.green)

            Spacer()

            Text(recommendation.createdAt, style: .date)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }

    private var implementButton: some View {
        Button(action: {
            showingImplementation = true
        }) {
            HStack {
                Image(systemName: "checkmark.circle")
                    .font(.body)

                Text("Mark as Implemented")
                    .font(ModernTheme.Typography.bodyBold)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
            }
            .foregroundColor(ModernTheme.Colors.primary)
            .padding()
            .background(ModernTheme.Colors.primary.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.sm)
        }
        .confirmationDialog(
            "Implement Recommendation",
            isPresented: $showingImplementation,
            titleVisibility: .visible
        ) {
            Button("Mark as Implemented") {
                onImplement()
            }

            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to mark this recommendation as implemented? This action will track the projected savings.")
        }
    }

    // MARK: - Helper Properties

    private var priorityColor: Color {
        switch recommendation.priority {
        case .critical:
            return ModernTheme.Colors.error
        case .high:
            return ModernTheme.Colors.warning
        case .medium:
            return Color.yellow
        case .low:
            return ModernTheme.Colors.info
        }
    }

    private var confidenceColor: Color {
        switch recommendation.confidence {
        case 0..<0.5:
            return ModernTheme.Colors.error
        case 0.5..<0.7:
            return ModernTheme.Colors.warning
        case 0.7..<0.85:
            return Color.yellow
        default:
            return ModernTheme.Colors.success
        }
    }
}

// MARK: - Preview
#Preview {
    ScrollView {
        VStack(spacing: ModernTheme.Spacing.md) {
            RecommendationCardView(
                recommendation: OptimizationRecommendation(
                    type: .retireVehicle,
                    title: "Retire Underutilized Vehicle F-123",
                    description: "Vehicle F-123 is only 18% utilized and has high maintenance costs. Consider retiring or reassigning to reduce fleet costs.",
                    estimatedSavings: 8500,
                    priority: .high,
                    implementationSteps: [
                        "Review vehicle usage over last 6 months",
                        "Assess current assignments and demand",
                        "Plan vehicle disposal or reassignment",
                        "Update fleet inventory"
                    ],
                    affectedVehicles: ["vehicle-123"],
                    timeframe: "2-4 weeks",
                    confidence: 0.82
                ),
                isImplemented: false,
                onImplement: {}
            )

            RecommendationCardView(
                recommendation: OptimizationRecommendation(
                    type: .consolidateRoutes,
                    title: "Consolidate Routes in North Region",
                    description: "Multiple overlapping routes detected in North region. Consolidation can reduce vehicle hours by 15%.",
                    estimatedSavings: 12000,
                    priority: .medium,
                    implementationSteps: [
                        "Analyze current route patterns",
                        "Identify overlapping coverage areas",
                        "Create consolidated schedule",
                        "Train drivers on new routes"
                    ],
                    affectedVehicles: ["v1", "v2", "v3"],
                    timeframe: "3-4 weeks",
                    confidence: 0.75,
                    metadata: ["Region": "North", "Routes": "5"]
                ),
                isImplemented: true,
                onImplement: {}
            )
        }
        .padding()
    }
}
