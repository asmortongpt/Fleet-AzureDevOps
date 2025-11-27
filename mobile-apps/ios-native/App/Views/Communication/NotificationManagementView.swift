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
