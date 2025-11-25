import SwiftUI

struct ComplianceScoreCardView: View {
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @State private var selectedCategory: ComplianceCategory?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Overall Score Header
                overallScoreHeader

                // Category Progress Rings
                categoryProgressRings

                // Detailed Category Breakdown
                if let category = selectedCategory {
                    categoryDetailView(category)
                } else {
                    allCategoriesView
                }
            }
            .padding()
        }
        .navigationTitle("Compliance Score Card")
        .navigationBarTitleDisplayMode(.large)
    }

    // MARK: - Overall Score Header
    private var overallScoreHeader: some View {
        VStack(spacing: 16) {
            Text("Overall Compliance Score")
                .font(.headline)
                .foregroundColor(.secondary)

            ZStack {
                // Background circle
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                    .frame(width: 180, height: 180)

                // Progress circle
                Circle()
                    .trim(from: 0, to: viewModel.overallScore / 100)
                    .stroke(
                        viewModel.scoreColor,
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .frame(width: 180, height: 180)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 1.0), value: viewModel.overallScore)

                // Score text
                VStack(spacing: 4) {
                    Text(String(format: "%.1f", viewModel.overallScore))
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(viewModel.scoreColor)

                    Text("Grade: \(viewModel.scoreGrade)")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
            }

            // Trend indicator
            if let dashboard = viewModel.dashboard {
                HStack(spacing: 8) {
                    Image(systemName: dashboard.score.trend.icon)
                        .font(.title3)
                    Text(dashboard.score.trend.rawValue.capitalized)
                        .font(.headline)
                }
                .foregroundColor(Color(dashboard.score.trend.color))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Category Progress Rings
    private var categoryProgressRings: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Category Scores")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(ComplianceCategory.allCases, id: \.self) { category in
                    CategoryProgressRing(
                        category: category,
                        score: viewModel.calculateCategoryScore(category),
                        isSelected: selectedCategory == category
                    )
                    .onTapGesture {
                        withAnimation {
                            if selectedCategory == category {
                                selectedCategory = nil
                            } else {
                                selectedCategory = category
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - All Categories View
    private var allCategoriesView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Category Details")
                .font(.headline)

            ForEach(ComplianceCategory.allCases, id: \.self) { category in
                CategorySummaryCard(
                    category: category,
                    score: viewModel.calculateCategoryScore(category),
                    items: viewModel.complianceItems.filter { $0.type.category == category }
                )
                .onTapGesture {
                    withAnimation {
                        selectedCategory = category
                    }
                }
            }
        }
    }

    // MARK: - Category Detail View
    private func categoryDetailView(_ category: ComplianceCategory) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Button(action: {
                    withAnimation {
                        selectedCategory = nil
                    }
                }) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("All Categories")
                    }
                    .foregroundColor(.blue)
                }

                Spacer()
            }

            CategoryDetailCard(
                category: category,
                score: viewModel.calculateCategoryScore(category),
                items: viewModel.complianceItems.filter { $0.type.category == category },
                violations: viewModel.violations.filter { $0.category == category && !$0.isResolved }
            )
        }
    }
}

// MARK: - Category Progress Ring
struct CategoryProgressRing: View {
    let category: ComplianceCategory
    let score: Double
    let isSelected: Bool

    var scoreColor: Color {
        if score >= 90 {
            return .green
        } else if score >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                // Background circle
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 10)
                    .frame(width: 100, height: 100)

                // Progress circle
                Circle()
                    .trim(from: 0, to: score / 100)
                    .stroke(
                        scoreColor,
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.8), value: score)

                // Icon and score
                VStack(spacing: 2) {
                    Image(systemName: category.icon)
                        .font(.title2)
                        .foregroundColor(Color(category.color))

                    Text(String(format: "%.0f%%", score))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(scoreColor)
                }
            }

            Text(category.displayName)
                .font(.subheadline)
                .fontWeight(isSelected ? .bold : .regular)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - Category Summary Card
struct CategorySummaryCard: View {
    let category: ComplianceCategory
    let score: Double
    let items: [ComplianceItem]

    var scoreColor: Color {
        if score >= 90 {
            return .green
        } else if score >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    var compliantCount: Int {
        items.filter { $0.status == .compliant }.count
    }

    var warningCount: Int {
        items.filter { $0.status == .warning }.count
    }

    var violationCount: Int {
        items.filter { $0.status == .violation }.count
    }

    var expiredCount: Int {
        items.filter { $0.status == .expired }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: category.icon)
                    .foregroundColor(Color(category.color))
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text(category.displayName)
                        .font(.headline)

                    Text("\(items.count) items")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(String(format: "%.1f%%", score))
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor)

                    Text("Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Status breakdown
            HStack(spacing: 16) {
                StatusBadge(label: "Compliant", count: compliantCount, color: .green)
                StatusBadge(label: "Warning", count: warningCount, color: .yellow)
                StatusBadge(label: "Violation", count: violationCount, color: .orange)
                StatusBadge(label: "Expired", count: expiredCount, color: .red)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)

                    Rectangle()
                        .fill(scoreColor)
                        .frame(width: geometry.size.width * (score / 100), height: 8)
                        .cornerRadius(4)
                        .animation(.easeInOut, value: score)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Category Detail Card
struct CategoryDetailCard: View {
    let category: ComplianceCategory
    let score: Double
    let items: [ComplianceItem]
    let violations: [Violation]

    var scoreColor: Color {
        if score >= 90 {
            return .green
        } else if score >= 70 {
            return .yellow
        } else {
            return .red
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: category.icon)
                    .foregroundColor(Color(category.color))
                    .font(.title)

                VStack(alignment: .leading, spacing: 4) {
                    Text(category.displayName)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Weight: \(Int(category.weight * 100))% of overall score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(String(format: "%.1f%%", score))
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(scoreColor)
            }

            Divider()

            // Items by status
            VStack(alignment: .leading, spacing: 12) {
                Text("Compliance Items (\(items.count))")
                    .font(.headline)

                ForEach(ComplianceStatus.allCases, id: \.self) { status in
                    let statusItems = items.filter { $0.status == status }
                    if !statusItems.isEmpty {
                        StatusSection(status: status, items: statusItems)
                    }
                }
            }

            if !violations.isEmpty {
                Divider()

                VStack(alignment: .leading, spacing: 12) {
                    Text("Unresolved Violations (\(violations.count))")
                        .font(.headline)

                    ForEach(violations.prefix(5)) { violation in
                        ViolationRow(violation: violation)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Supporting Views

struct StatusBadge: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct StatusSection: View {
    let status: ComplianceStatus
    let items: [ComplianceItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: status.icon)
                    .foregroundColor(Color(status.color))

                Text(status.displayName)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text("(\(items.count))")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()
            }

            ForEach(items.prefix(3)) { item in
                ComplianceItemRow(item: item)
            }

            if items.count > 3 {
                Text("+ \(items.count - 3) more")
                    .font(.caption)
                    .foregroundColor(.blue)
                    .padding(.leading, 32)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

struct ComplianceItemRow: View {
    let item: ComplianceItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.type.icon)
                .foregroundColor(Color(item.type.category.color))
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.type.displayName)
                    .font(.caption)
                    .fontWeight(.medium)

                Text(item.entityName)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                if item.daysUntilExpiration >= 0 {
                    Text("\(item.daysUntilExpiration) days")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(item.expirationColor))
                } else {
                    Text("Expired")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                }

                Text(item.formattedExpirationDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct ViolationRow: View {
    let violation: Violation

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: violation.severity.icon)
                .foregroundColor(Color(violation.severity.color))
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(violation.description)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)

                Text(violation.formattedViolationDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if let fine = violation.fineAmount {
                Text(violation.formattedFineAmount)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.orange)
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(6)
    }
}

#Preview {
    NavigationView {
        ComplianceScoreCardView(viewModel: ComplianceDashboardViewModel())
    }
}
