import SwiftUI

struct ComplianceScoreCardView: View {
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @State private var selectedCategory: ComplianceCategory?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
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
