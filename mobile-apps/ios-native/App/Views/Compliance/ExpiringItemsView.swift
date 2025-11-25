import SwiftUI

struct ExpiringItemsView: View {
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @Environment(\.dismiss) var dismiss
    @State private var selectedTimeframe: ExpirationTimeframe = .thirtyDays
    @State private var selectedItem: ComplianceItem?
    @State private var showingRenewalSheet = false

    enum ExpirationTimeframe: String, CaseIterable {
        case expired = "Expired"
        case thirtyDays = "30 Days"
        case sixtyDays = "60 Days"
        case ninetyDays = "90 Days"
        case all = "All"
    }

    var filteredItems: [ComplianceItem] {
        switch selectedTimeframe {
        case .expired:
            return viewModel.expiredItems
        case .thirtyDays:
            return viewModel.expiringIn30Days
        case .sixtyDays:
            return viewModel.expiringIn60Days
        case .ninetyDays:
            return viewModel.expiringIn90Days
        case .all:
            return viewModel.complianceItems
                .filter { $0.isExpiringSoon || $0.isExpired }
                .sorted { $0.daysUntilExpiration < $1.daysUntilExpiration }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Timeframe Picker
            Picker("Timeframe", selection: $selectedTimeframe) {
                ForEach(ExpirationTimeframe.allCases, id: \.self) { timeframe in
                    Text(timeframe.rawValue).tag(timeframe)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            // Summary Cards
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    SummaryCard(
                        title: "Expired",
                        count: viewModel.expiredItems.count,
                        color: .red,
                        isSelected: selectedTimeframe == .expired
                    ) {
                        selectedTimeframe = .expired
                    }

                    SummaryCard(
                        title: "30 Days",
                        count: viewModel.expiringIn30Days.count,
                        color: .orange,
                        isSelected: selectedTimeframe == .thirtyDays
                    ) {
                        selectedTimeframe = .thirtyDays
                    }

                    SummaryCard(
                        title: "60 Days",
                        count: viewModel.expiringIn60Days.count,
                        color: .yellow,
                        isSelected: selectedTimeframe == .sixtyDays
                    ) {
                        selectedTimeframe = .sixtyDays
                    }

                    SummaryCard(
                        title: "90 Days",
                        count: viewModel.expiringIn90Days.count,
                        color: .green,
                        isSelected: selectedTimeframe == .ninetyDays
                    ) {
                        selectedTimeframe = .ninetyDays
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom)

            // Items List
            List {
                if filteredItems.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.green)
                        Text("No items expiring")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("All items are up to date!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .listRowBackground(Color.clear)
                } else {
                    // Group by category
                    ForEach(ComplianceCategory.allCases, id: \.self) { category in
                        let categoryItems = filteredItems.filter { $0.type.category == category }

                        if !categoryItems.isEmpty {
                            Section(header: CategoryHeader(category: category, count: categoryItems.count)) {
                                ForEach(categoryItems) { item in
                                    ExpiringItemCard(item: item)
                                        .onTapGesture {
                                            selectedItem = item
                                            showingRenewalSheet = true
                                        }
                                }
                            }
                        }
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
        }
        .navigationTitle("Expiring Items")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Close") {
                    dismiss()
                }
            }
        }
        .searchable(text: $viewModel.searchText, prompt: "Search items")
        .sheet(isPresented: $showingRenewalSheet) {
            if let item = selectedItem {
                RenewalSheet(
                    item: item,
                    viewModel: viewModel,
                    isPresented: $showingRenewalSheet
                )
            }
        }
    }
}

// MARK: - Summary Card
struct SummaryCard: View {
    let title: String
    let count: Int
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text("\(count)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(isSelected ? .white : color)

                Text(title)
                    .font(.caption)
                    .fontWeight(isSelected ? .semibold : .regular)
                    .foregroundColor(isSelected ? .white : .secondary)
            }
            .frame(width: 90, height: 90)
            .background(isSelected ? color : color.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(color, lineWidth: isSelected ? 2 : 0)
            )
        }
    }
}

// MARK: - Category Header
struct CategoryHeader: View {
    let category: ComplianceCategory
    let count: Int

    var body: some View {
        HStack {
            Image(systemName: category.icon)
                .foregroundColor(Color(category.color))

            Text(category.displayName)
                .font(.headline)

            Text("(\(count))")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Expiring Item Card
struct ExpiringItemCard: View {
    let item: ComplianceItem
    @State private var timeRemaining = ""

    var urgencyColor: Color {
        if item.isExpired {
            return .red
        } else if item.daysUntilExpiration <= 7 {
            return .red
        } else if item.daysUntilExpiration <= 30 {
            return .orange
        } else if item.daysUntilExpiration <= 60 {
            return .yellow
        } else {
            return .green
        }
    }

    var urgencyIcon: String {
        if item.isExpired {
            return "exclamationmark.octagon.fill"
        } else if item.daysUntilExpiration <= 7 {
            return "exclamationmark.triangle.fill"
        } else if item.daysUntilExpiration <= 30 {
            return "exclamationmark.circle.fill"
        } else {
            return "info.circle.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.type.displayName)
                        .font(.headline)

                    Text(item.entityName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: urgencyIcon)
                    .font(.title2)
                    .foregroundColor(urgencyColor)
            }

            Divider()

            // Countdown Timer
            VStack(spacing: 8) {
                if item.isExpired {
                    HStack {
                        Image(systemName: "clock.badge.exclamationmark.fill")
                            .foregroundColor(.red)

                        Text("EXPIRED")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.red)

                        Spacer()

                        Text("\(abs(item.daysUntilExpiration)) days ago")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Image(systemName: "clock.fill")
                            .foregroundColor(urgencyColor)
                            .font(.caption)

                        Text("\(item.daysUntilExpiration)")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(urgencyColor)

                        Text("days remaining")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Spacer()
                    }

                    // Visual countdown bar
                    CountdownBar(
                        daysRemaining: item.daysUntilExpiration,
                        totalDays: 90,
                        color: urgencyColor
                    )
                }
            }

            // Details
            VStack(spacing: 6) {
                ItemDetailRow(
                    icon: "calendar.badge.clock",
                    label: "Expires",
                    value: item.formattedExpirationDate
                )

                if let issueDate = item.issueDate {
                    ItemDetailRow(
                        icon: "calendar",
                        label: "Issued",
                        value: issueDate
                    )
                }

                if let documentNumber = item.documentNumber {
                    ItemDetailRow(
                        icon: "number",
                        label: "Document",
                        value: documentNumber
                    )
                }

                if let authority = item.issuingAuthority {
                    ItemDetailRow(
                        icon: "building.2.fill",
                        label: "Authority",
                        value: authority
                    )
                }

                if let jurisdiction = item.jurisdiction {
                    ItemDetailRow(
                        icon: "mappin.circle.fill",
                        label: "Jurisdiction",
                        value: jurisdiction
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(urgencyColor.opacity(0.3), lineWidth: 2)
        )
    }
}

// MARK: - Countdown Bar
struct CountdownBar: View {
    let daysRemaining: Int
    let totalDays: Int
    let color: Color

    var progress: Double {
        Double(daysRemaining) / Double(totalDays)
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 8)
                    .cornerRadius(4)

                Rectangle()
                    .fill(color)
                    .frame(width: geometry.size.width * progress, height: 8)
                    .cornerRadius(4)
                    .animation(.easeInOut, value: progress)
            }
        }
        .frame(height: 8)
    }
}

// MARK: - Item Detail Row
struct ItemDetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 20)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 80, alignment: .leading)

            Text(value)
                .font(.caption)
                .foregroundColor(.primary)

            Spacer()
        }
    }
}

// MARK: - Renewal Sheet
struct RenewalSheet: View {
    let item: ComplianceItem
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @Binding var isPresented: Bool
    @State private var newExpirationDate = Date()
    @State private var notes = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Current Information")) {
                    LabeledContent("Type", value: item.type.displayName)
                    LabeledContent("Entity", value: item.entityName)
                    LabeledContent("Status", value: item.status.displayName)
                    LabeledContent("Current Expiration", value: item.formattedExpirationDate)

                    if item.daysUntilExpiration >= 0 {
                        LabeledContent(
                            "Days Remaining",
                            value: "\(item.daysUntilExpiration)"
                        )
                    } else {
                        HStack {
                            Text("Days Remaining")
                            Spacer()
                            Text("Expired \(abs(item.daysUntilExpiration)) days ago")
                                .foregroundColor(.red)
                        }
                    }

                    if let documentNumber = item.documentNumber {
                        LabeledContent("Document #", value: documentNumber)
                    }
                }

                Section(header: Text("Renewal Information")) {
                    DatePicker(
                        "New Expiration Date",
                        selection: $newExpirationDate,
                        in: Date()...,
                        displayedComponents: .date
                    )

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notes (Optional)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextEditor(text: $notes)
                            .frame(height: 100)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }
                }

                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("⚠️ Important")
                            .font(.headline)

                        Text("Please ensure you have the physical documentation and all necessary renewals have been completed before updating the expiration date.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Renew Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Renew") {
                        Task {
                            let formatter = ISO8601DateFormatter()
                            let expirationString = formatter.string(from: newExpirationDate)

                            await viewModel.renewComplianceItem(
                                item,
                                newExpirationDate: expirationString
                            )
                            isPresented = false
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        ExpiringItemsView(viewModel: ComplianceDashboardViewModel())
    }
}
