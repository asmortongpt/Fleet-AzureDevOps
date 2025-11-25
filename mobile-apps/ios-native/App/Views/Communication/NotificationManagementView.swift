//
//  NotificationManagementView.swift
//  Fleet Manager - iOS Native App
//
//  Push notification campaign management with analytics
//  Schedule, send, and track notification campaigns
//

import SwiftUI
import Charts

struct NotificationManagementView: View {
    @ObservedObject var viewModel: CommunicationViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Notification Campaigns")
                            .font(.title2.bold())

                        Text("Manage and track push notification campaigns")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button(action: { viewModel.createCampaign() }) {
                        Label("New Campaign", systemImage: "plus.circle.fill")
                            .font(.headline)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .padding()

                // Campaign Stats
                campaignStats

                Divider()

                // Campaign List
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Campaigns")
                        .font(.headline)
                        .padding(.horizontal)

                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else if viewModel.campaigns.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "megaphone")
                                .font(.system(size: 50))
                                .foregroundColor(.secondary)

                            Text("No Campaigns Yet")
                                .font(.headline)

                            Text("Create your first notification campaign")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else {
                        ForEach(viewModel.campaigns) { campaign in
                            CampaignCard(campaign: campaign) {
                                viewModel.selectedCampaign = campaign
                            }
                            .padding(.horizontal)
                        }
                    }
                }
            }
        }
        .sheet(item: $viewModel.selectedCampaign) { campaign in
            CampaignDetailView(viewModel: viewModel, campaign: campaign)
        }
        .sheet(isPresented: $viewModel.showCampaignSheet) {
            if let campaign = viewModel.selectedCampaign {
                CreateCampaignView(viewModel: viewModel, campaign: campaign)
            }
        }
    }

    // MARK: - Campaign Stats
    private var campaignStats: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            StatCard(
                title: "Total Sent",
                value: "\(totalSent)",
                icon: "paperplane.fill",
                color: .blue
            )

            StatCard(
                title: "Delivered",
                value: "\(totalDelivered)",
                subtitle: "\(deliveryRate)%",
                icon: "checkmark.circle.fill",
                color: .green
            )

            StatCard(
                title: "Opened",
                value: "\(totalOpened)",
                subtitle: "\(openRate)%",
                icon: "envelope.open.fill",
                color: .orange
            )

            StatCard(
                title: "Clicked",
                value: "\(totalClicked)",
                subtitle: "\(clickRate)%",
                icon: "hand.tap.fill",
                color: .purple
            )
        }
        .padding()
    }

    // MARK: - Computed Properties
    private var totalSent: Int {
        viewModel.campaigns.compactMap { $0.analytics?.sent }.reduce(0, +)
    }

    private var totalDelivered: Int {
        viewModel.campaigns.compactMap { $0.analytics?.delivered }.reduce(0, +)
    }

    private var totalOpened: Int {
        viewModel.campaigns.compactMap { $0.analytics?.opened }.reduce(0, +)
    }

    private var totalClicked: Int {
        viewModel.campaigns.compactMap { $0.analytics?.clicked }.reduce(0, +)
    }

    private var deliveryRate: Int {
        guard totalSent > 0 else { return 0 }
        return Int(Double(totalDelivered) / Double(totalSent) * 100)
    }

    private var openRate: Int {
        guard totalDelivered > 0 else { return 0 }
        return Int(Double(totalOpened) / Double(totalDelivered) * 100)
    }

    private var clickRate: Int {
        guard totalOpened > 0 else { return 0 }
        return Int(Double(totalClicked) / Double(totalOpened) * 100)
    }
}

// MARK: - Campaign Card
struct CampaignCard: View {
    let campaign: NotificationCampaign
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(campaign.title)
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text(campaign.message)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }

                    Spacer()

                    CampaignStatusBadge(status: campaign.status)
                }

                if let analytics = campaign.analytics {
                    HStack(spacing: 20) {
                        AnalyticsMetric(label: "Sent", value: analytics.sent, color: .blue)
                        AnalyticsMetric(label: "Delivered", value: analytics.delivered, color: .green)
                        AnalyticsMetric(label: "Opened", value: analytics.opened, color: .orange)
                        AnalyticsMetric(label: "Clicked", value: analytics.clicked, color: .purple)
                    }
                }

                HStack {
                    if let sentAt = campaign.sentAt {
                        Label(sentAt.formatted(date: .abbreviated, time: .shortened), systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else if let scheduledFor = campaign.scheduledFor {
                        Label("Scheduled for \(scheduledFor.formatted(date: .abbreviated, time: .shortened))", systemImage: "calendar")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }

                    Spacer()

                    Text("\(campaign.targetAudience.estimatedRecipients) recipients")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Campaign Status Badge
struct CampaignStatusBadge: View {
    let status: CampaignStatus

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
            Text(status.displayName)
        }
        .font(.caption.bold())
        .foregroundColor(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(status.color)
        .cornerRadius(8)
    }
}

// MARK: - Analytics Metric
struct AnalyticsMetric: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.headline)
                .foregroundColor(color)

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    var subtitle: String? = nil
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)

                Spacer()
            }

            Text(value)
                .font(.title.bold())

            HStack {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                if let subtitle = subtitle {
                    Spacer()
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(color)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(color.opacity(0.1))
                        .cornerRadius(6)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Campaign Detail View
struct CampaignDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel
    let campaign: NotificationCampaign

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Status
                    HStack {
                        CampaignStatusBadge(status: campaign.status)

                        Spacer()

                        if campaign.status == .draft || campaign.status == .scheduled {
                            Button(action: {
                                Task {
                                    await viewModel.sendCampaign(campaign)
                                    dismiss()
                                }
                            }) {
                                Label("Send Now", systemImage: "paperplane.fill")
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }
                    }

                    // Campaign Info
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Campaign Details")
                            .font(.headline)

                        InfoRow(label: "Title", value: campaign.title)
                        InfoRow(label: "Message", value: campaign.message)

                        if let scheduledFor = campaign.scheduledFor {
                            InfoRow(label: "Scheduled For", value: scheduledFor.formatted(date: .abbreviated, time: .shortened))
                        }

                        if let sentAt = campaign.sentAt {
                            InfoRow(label: "Sent At", value: sentAt.formatted(date: .abbreviated, time: .shortened))
                        }

                        InfoRow(label: "Target Recipients", value: "\(campaign.targetAudience.estimatedRecipients) users")
                    }

                    Divider()

                    // Analytics
                    if let analytics = campaign.analytics {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Campaign Analytics")
                                .font(.headline)

                            // Metrics
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                MetricCard(label: "Sent", value: analytics.sent, total: analytics.sent, color: .blue)
                                MetricCard(label: "Delivered", value: analytics.delivered, total: analytics.sent, color: .green)
                                MetricCard(label: "Opened", value: analytics.opened, total: analytics.delivered, color: .orange)
                                MetricCard(label: "Clicked", value: analytics.clicked, total: analytics.opened, color: .purple)
                                MetricCard(label: "Failed", value: analytics.failed, total: analytics.sent, color: .red)
                            }

                            // Rates
                            VStack(spacing: 8) {
                                RateRow(label: "Delivery Rate", rate: analytics.deliveryRate, color: .green)
                                RateRow(label: "Open Rate", rate: analytics.openRate, color: .orange)
                                RateRow(label: "Click Rate", rate: analytics.clickRate, color: .purple)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Campaign Details")
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

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.body)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

// MARK: - Metric Card
struct MetricCard: View {
    let label: String
    let value: Int
    let total: Int
    let color: Color

    var percentage: Double {
        guard total > 0 else { return 0 }
        return Double(value) / Double(total) * 100
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Text("\(value)")
                .font(.title2.bold())
                .foregroundColor(color)

            Text("\(Int(percentage))%")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Rate Row
struct RateRow: View {
    let label: String
    let rate: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.subheadline)

                Spacer()

                Text(String(format: "%.1f%%", rate))
                    .font(.subheadline.bold())
                    .foregroundColor(color)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.tertiarySystemGroupedBackground))

                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * CGFloat(rate / 100))
                }
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Create Campaign View
struct CreateCampaignView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel
    @State var campaign: NotificationCampaign

    @State private var showTemplates = false
    @State private var scheduleLater = false
    @State private var selectedRoles: Set<String> = []

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Campaign Details")) {
                    TextField("Title", text: $campaign.title)

                    ZStack(alignment: .topLeading) {
                        if campaign.message.isEmpty {
                            Text("Message content...")
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 8)
                        }

                        TextEditor(text: $campaign.message)
                            .frame(minHeight: 100)
                    }

                    Button(action: { showTemplates = true }) {
                        Label("Use Template", systemImage: "doc.text")
                    }
                }

                Section(header: Text("Target Audience")) {
                    Toggle("All Users", isOn: Binding(
                        get: { campaign.targetAudience.allUsers },
                        set: { newValue in
                            campaign.targetAudience.allUsers = newValue
                            if newValue {
                                selectedRoles = []
                            }
                        }
                    ))

                    if !campaign.targetAudience.allUsers {
                        ForEach(["driver", "manager", "admin", "dispatcher"], id: \.self) { role in
                            Toggle(role.capitalized, isOn: Binding(
                                get: { selectedRoles.contains(role) },
                                set: { isSelected in
                                    if isSelected {
                                        selectedRoles.insert(role)
                                    } else {
                                        selectedRoles.remove(role)
                                    }
                                    campaign.targetAudience.roles = Array(selectedRoles)
                                }
                            ))
                        }
                    }

                    Text("Estimated recipients: \(campaign.targetAudience.estimatedRecipients)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section(header: Text("Schedule")) {
                    Toggle("Schedule for later", isOn: $scheduleLater)

                    if scheduleLater {
                        DatePicker("Send at", selection: Binding(
                            get: { campaign.scheduledFor ?? Date() },
                            set: { campaign.scheduledFor = $0 }
                        ), in: Date()...)
                    }
                }
            }
            .navigationTitle("New Campaign")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(scheduleLater ? "Schedule" : "Send") {
                        Task {
                            if scheduleLater {
                                campaign.status = .scheduled
                            } else {
                                campaign.status = .sending
                                campaign.scheduledFor = nil
                            }

                            await viewModel.sendCampaign(campaign)
                            dismiss()
                        }
                    }
                    .disabled(!canCreate)
                }
            }
            .sheet(isPresented: $showTemplates) {
                NotificationTemplateSelector(viewModel: viewModel) { template in
                    campaign.title = template.title
                    campaign.message = template.message
                    showTemplates = false
                }
            }
        }
    }

    private var canCreate: Bool {
        !campaign.title.isEmpty && !campaign.message.isEmpty &&
        (campaign.targetAudience.allUsers || !selectedRoles.isEmpty)
    }
}

// MARK: - Notification Template Selector
struct NotificationTemplateSelector: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CommunicationViewModel
    let onSelect: (NotificationTemplate) -> Void

    var body: some View {
        NavigationView {
            List(viewModel.notificationTemplates) { template in
                Button(action: {
                    onSelect(template)
                }) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(template.name)
                            .font(.headline)

                        Text(template.title)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)

                        Text(template.message)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)

                        Text(template.category)
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Notification Templates")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview Provider
struct NotificationManagementView_Previews: PreviewProvider {
    static var previews: some View {
        NotificationManagementView(viewModel: CommunicationViewModel())
    }
}
