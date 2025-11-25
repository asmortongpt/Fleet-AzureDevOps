//
//  InventoryAlertsView.swift
//  Fleet Manager
//
//  View for displaying and managing inventory alerts (low stock, expiration, etc.)
//

import SwiftUI

struct InventoryAlertsView: View {
    @StateObject private var viewModel = InventoryManagementViewModel()
    @State private var selectedFilter: AlertFilter = .all
    @State private var selectedSeverity: InventoryAlert.AlertSeverity?

    enum AlertFilter: String, CaseIterable {
        case all = "All"
        case lowStock = "Low Stock"
        case outOfStock = "Out of Stock"
        case expiring = "Expiring"
        case overStock = "Overstock"

        var icon: String {
            switch self {
            case .all: return "bell.fill"
            case .lowStock: return "exclamationmark.triangle.fill"
            case .outOfStock: return "xmark.circle.fill"
            case .expiring: return "clock.badge.exclamationmark"
            case .overStock: return "arrow.up.circle.fill"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Alert Summary
                alertSummarySection

                // Filter Picker
                Picker("Filter", selection: $selectedFilter) {
                    ForEach(AlertFilter.allCases, id: \.self) { filter in
                        HStack {
                            Image(systemName: filter.icon)
                            Text(filter.rawValue)
                        }
                        .tag(filter)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Alerts List
                alertsList
            }
            .navigationTitle("Inventory Alerts")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { selectedSeverity = nil }) {
                            Label("All Severities", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Divider()

                        ForEach([InventoryAlert.AlertSeverity.critical, .high, .medium, .low], id: \.self) { severity in
                            Button(action: { selectedSeverity = severity }) {
                                HStack {
                                    if selectedSeverity == severity {
                                        Image(systemName: "checkmark")
                                    }
                                    Text(severity.rawValue)
                                }
                            }
                        }
                    } label: {
                        Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadInventoryData()
            }
        }
    }

    // MARK: - Alert Summary Section
    private var alertSummarySection: some View {
        HStack(spacing: 12) {
            AlertSummaryCard(
                count: criticalAlertsCount,
                title: "Critical",
                color: .red,
                icon: "exclamationmark.octagon.fill"
            )

            AlertSummaryCard(
                count: highAlertsCount,
                title: "High",
                color: .orange,
                icon: "exclamationmark.triangle.fill"
            )

            AlertSummaryCard(
                count: mediumAlertsCount,
                title: "Medium",
                color: .yellow,
                icon: "exclamationmark.circle.fill"
            )

            AlertSummaryCard(
                count: lowAlertsCount,
                title: "Low",
                color: .blue,
                icon: "info.circle.fill"
            )
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Alerts List
    private var alertsList: some View {
        Group {
            if viewModel.loadingState.isLoading && filteredAlerts.isEmpty {
                ProgressView("Loading alerts...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if filteredAlerts.isEmpty {
                EmptyAlertsView()
            } else {
                List {
                    ForEach(filteredAlerts) { alert in
                        AlertCard(alert: alert) {
                            Task {
                                try? await viewModel.acknowledgeAlert(alert.id)
                            }
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }

    // MARK: - Computed Properties
    private var filteredAlerts: [InventoryAlert] {
        var alerts = viewModel.activeAlerts

        // Filter by type
        switch selectedFilter {
        case .all:
            break
        case .lowStock:
            alerts = alerts.filter { $0.alertType == .lowStock }
        case .outOfStock:
            alerts = alerts.filter { $0.alertType == .outOfStock }
        case .expiring:
            alerts = alerts.filter { $0.alertType == .expiringSoon || $0.alertType == .expired }
        case .overStock:
            alerts = alerts.filter { $0.alertType == .overStock }
        }

        // Filter by severity
        if let severity = selectedSeverity {
            alerts = alerts.filter { $0.severity == severity }
        }

        return alerts.sorted { $0.severity.rawValue > $1.severity.rawValue }
    }

    private var criticalAlertsCount: Int {
        viewModel.activeAlerts.filter { $0.severity == .critical }.count
    }

    private var highAlertsCount: Int {
        viewModel.activeAlerts.filter { $0.severity == .high }.count
    }

    private var mediumAlertsCount: Int {
        viewModel.activeAlerts.filter { $0.severity == .medium }.count
    }

    private var lowAlertsCount: Int {
        viewModel.activeAlerts.filter { $0.severity == .low }.count
    }
}

// MARK: - Alert Summary Card
struct AlertSummaryCard: View {
    let count: Int
    let title: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

// MARK: - Alert Card
struct AlertCard: View {
    let alert: InventoryAlert
    let onAcknowledge: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .top) {
                Image(systemName: alertIcon)
                    .font(.title2)
                    .foregroundColor(Color(alert.severity.color))
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text(alert.alertType.rawValue)
                        .font(.headline)

                    Text(alert.itemName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("SKU: \(alert.itemSku)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(alert.severity.rawValue)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color(alert.severity.color))
                        .cornerRadius(8)

                    Text(formatDate(alert.createdAt))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            // Message
            Text(alert.message)
                .font(.callout)
                .foregroundColor(.primary)
                .padding(.leading, 40)

            // Details
            if let threshold = alert.threshold {
                HStack(spacing: 16) {
                    DetailLabel(title: "Current", value: "\(alert.currentQuantity)")
                    DetailLabel(title: "Threshold", value: "\(threshold)")

                    if alert.alertType == .reorderNeeded {
                        if let item = getItem(for: alert.itemId) {
                            DetailLabel(title: "Reorder", value: "\(item.reorderQuantity)")
                        }
                    }
                }
                .padding(.leading, 40)
            }

            if let expirationDate = alert.expirationDate {
                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.orange)
                    Text("Expires: \(formatDate(expirationDate))")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                .padding(.leading, 40)
            }

            // Actions
            HStack(spacing: 12) {
                Button(action: onAcknowledge) {
                    Label("Acknowledge", systemImage: "checkmark.circle")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
                .buttonStyle(BorderlessButtonStyle())

                if alert.alertType == .lowStock || alert.alertType == .outOfStock {
                    Button(action: {}) {
                        Label("Reorder", systemImage: "cart.fill.badge.plus")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .buttonStyle(BorderlessButtonStyle())
                }
            }
            .padding(.leading, 40)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }

    private var alertIcon: String {
        switch alert.alertType {
        case .lowStock:
            return "exclamationmark.triangle.fill"
        case .outOfStock:
            return "xmark.circle.fill"
        case .overStock:
            return "arrow.up.circle.fill"
        case .expiringSoon:
            return "clock.badge.exclamationmark"
        case .expired:
            return "clock.badge.xmark.fill"
        case .reorderNeeded:
            return "cart.fill.badge.plus"
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }

    private func getItem(for itemId: String) -> InventoryItem? {
        // This would need access to the view model
        nil
    }
}

// MARK: - Detail Label
struct DetailLabel: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)

            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Empty Alerts View
struct EmptyAlertsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 70))
                .foregroundColor(.green)

            Text("All Clear!")
                .font(.title)
                .fontWeight(.bold)

            Text("No active inventory alerts at this time.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("All stock levels are adequate")
                }

                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("No items expiring soon")
                }

                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("No overstock situations")
                }
            }
            .font(.callout)
            .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    InventoryAlertsView()
}
