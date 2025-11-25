//
//  AlertsView.swift
//  Fleet Manager
//
//  Critical alerts requiring executive action
//

import SwiftUI

struct AlertsView: View {
    let alerts: [ExecutiveAlert]
    let onAcknowledge: (ExecutiveAlert) async -> Void
    let onDismiss: (ExecutiveAlert) -> Void

    @State private var selectedAlert: ExecutiveAlert?
    @State private var showingDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text("Critical Alerts")
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    if !alerts.isEmpty {
                        Text("\(alerts.count) active alert\(alerts.count == 1 ? "" : "s")")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                if !alerts.isEmpty {
                    severitySummary
                }
            }

            // Alerts List
            if alerts.isEmpty {
                emptyState
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ModernTheme.Spacing.md) {
                        ForEach(alerts) { alert in
                            alertCard(alert)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .padding(ModernTheme.Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(
                    color: ModernTheme.Shadow.small.color,
                    radius: ModernTheme.Shadow.small.radius,
                    x: ModernTheme.Shadow.small.x,
                    y: ModernTheme.Shadow.small.y
                )
        )
        .sheet(isPresented: $showingDetail) {
            if let alert = selectedAlert {
                alertDetailView(alert)
            }
        }
    }

    // MARK: - Alert Card
    private func alertCard(_ alert: ExecutiveAlert) -> some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            // Header
            HStack {
                Image(systemName: alert.iconName)
                    .foregroundColor(severityColor(alert.severity))
                    .font(.title3)

                Spacer()

                Text(alert.severity.rawValue)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(.white)
                    .padding(.horizontal, ModernTheme.Spacing.xs)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(severityColor(alert.severity))
                    )
            }

            // Title
            Text(alert.title)
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .lineLimit(2)

            // Message
            Text(alert.message)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .lineLimit(3)

            // Meta Information
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                if let vehicleCount = alert.affectedVehicles {
                    metaRow(icon: "car.fill", text: "\(vehicleCount) vehicles")
                }

                if let cost = alert.formattedEstimatedCost {
                    metaRow(icon: "dollarsign.circle.fill", text: cost)
                }

                metaRow(icon: "clock.fill", text: alert.formattedTimestamp)
            }

            Divider()

            // Actions
            HStack(spacing: ModernTheme.Spacing.sm) {
                Button(action: {
                    selectedAlert = alert
                    showingDetail = true
                }) {
                    Text("Details")
                        .font(ModernTheme.Typography.caption1)
                        .fontWeight(.medium)
                        .foregroundColor(ModernTheme.Colors.primary)
                }

                Spacer()

                if alert.status == .new {
                    Button(action: {
                        Task {
                            await onAcknowledge(alert)
                        }
                    }) {
                        Text("Acknowledge")
                            .font(ModernTheme.Typography.caption1)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding(.horizontal, ModernTheme.Spacing.sm)
                            .padding(.vertical, ModernTheme.Spacing.xs)
                            .background(
                                Capsule()
                                    .fill(ModernTheme.Colors.primary)
                            )
                    }
                }
            }
        }
        .padding(ModernTheme.Spacing.md)
        .frame(width: 280)
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.secondaryBackground)
                .overlay(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .strokeBorder(severityColor(alert.severity).opacity(0.3), lineWidth: 2)
                )
        )
    }

    // MARK: - Alert Detail View
    private func alertDetailView(_ alert: ExecutiveAlert) -> some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    // Header
                    HStack {
                        Image(systemName: alert.iconName)
                            .font(.system(size: 32))
                            .foregroundColor(severityColor(alert.severity))

                        VStack(alignment: .leading) {
                            Text(alert.severity.rawValue)
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(severityColor(alert.severity))

                            Text(alert.title)
                                .font(ModernTheme.Typography.title3)
                                .fontWeight(.bold)
                        }

                        Spacer()
                    }

                    Divider()

                    // Message
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                        Text("Description")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .textCase(.uppercase)

                        Text(alert.message)
                            .font(ModernTheme.Typography.body)
                    }

                    // Details
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                        Text("Details")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .textCase(.uppercase)

                        detailRow(label: "Category", value: alert.category.rawValue)
                        detailRow(label: "Status", value: alert.status.rawValue)
                        detailRow(label: "Time", value: alert.formattedTimestamp)

                        if let department = alert.department {
                            detailRow(label: "Department", value: department)
                        }

                        if let vehicleCount = alert.affectedVehicles {
                            detailRow(label: "Affected Vehicles", value: "\(vehicleCount)")
                        }

                        if let cost = alert.formattedEstimatedCost {
                            detailRow(label: "Estimated Cost", value: cost)
                        }
                    }

                    // Action Required
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                        Text("Action Required")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                            .textCase(.uppercase)

                        Text(alert.actionRequired)
                            .font(ModernTheme.Typography.body)
                    }

                    // Actions
                    if alert.status == .new {
                        Button(action: {
                            Task {
                                await onAcknowledge(alert)
                                showingDetail = false
                            }
                        }) {
                            Text("Acknowledge Alert")
                                .font(ModernTheme.Typography.bodyBold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                                        .fill(ModernTheme.Colors.primary)
                                )
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Alert Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        showingDetail = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Views
    private func metaRow(icon: String, text: String) -> some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text(text)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.body)
                .fontWeight(.medium)
        }
        .padding(.vertical, ModernTheme.Spacing.xs)
    }

    private var severitySummary: some View {
        HStack(spacing: ModernTheme.Spacing.xs) {
            ForEach([ExecutiveAlert.Severity.critical, .high, .medium], id: \.self) { severity in
                let count = alerts.filter { $0.severity == severity }.count
                if count > 0 {
                    HStack(spacing: 2) {
                        Circle()
                            .fill(severityColor(severity))
                            .frame(width: 6, height: 6)

                        Text("\(count)")
                            .font(ModernTheme.Typography.caption2)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundColor(ModernTheme.Colors.success)

            Text("No Active Alerts")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("All systems operating normally")
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ModernTheme.Spacing.xl)
    }

    // MARK: - Helper Methods
    private func severityColor(_ severity: ExecutiveAlert.Severity) -> Color {
        switch severity {
        case .critical:
            return ModernTheme.Colors.error
        case .high:
            return .orange
        case .medium:
            return ModernTheme.Colors.warning
        case .low:
            return ModernTheme.Colors.info
        }
    }
}

// MARK: - Preview
#Preview {
    AlertsView(
        alerts: [
            ExecutiveAlert(
                id: "1",
                title: "Budget Overrun",
                message: "Operations department has exceeded monthly budget by 15%",
                severity: .critical,
                category: .budget,
                timestamp: Date().addingTimeInterval(-3600),
                affectedVehicles: 12,
                estimatedCost: 45000,
                actionRequired: "Review and approve additional budget allocation",
                status: .new,
                department: "Operations"
            ),
            ExecutiveAlert(
                id: "2",
                title: "Compliance Issue",
                message: "3 vehicles due for inspection within 7 days",
                severity: .high,
                category: .compliance,
                timestamp: Date().addingTimeInterval(-7200),
                affectedVehicles: 3,
                estimatedCost: nil,
                actionRequired: "Schedule inspections immediately",
                status: .new,
                department: nil
            )
        ],
        onAcknowledge: { _ in },
        onDismiss: { _ in }
    )
    .padding()
    .background(ModernTheme.Colors.groupedBackground)
}
