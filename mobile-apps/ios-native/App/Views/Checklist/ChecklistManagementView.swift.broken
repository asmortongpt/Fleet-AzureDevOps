//
//  ChecklistManagementView.swift
//  Fleet Manager
//
//  Main view for checklist management with tabs for active, pending, history, and templates
//

import SwiftUI

struct ChecklistManagementView: View {
    @StateObject private var viewModel = ChecklistViewModel()
    @State private var selectedTab: ChecklistTab = .pending
    @State private var showTemplateEditor = false
    @State private var selectedPendingChecklist: ChecklistInstance?
    @State private var showChecklistAlert = false

    enum ChecklistTab: String, CaseIterable {
        case pending = "Pending"
        case active = "Active"
        case history = "History"
        case templates = "Templates"

        var icon: String {
            switch self {
            case .pending: return "bell.badge"
            case .active: return "play.circle.fill"
            case .history: return "clock.arrow.circlepath"
            case .templates: return "square.stack.3d.up"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Custom tab bar
                customTabBar

                // Content
                TabView(selection: $selectedTab) {
                    pendingTab
                        .tag(ChecklistTab.pending)

                    activeTab
                        .tag(ChecklistTab.active)

                    historyTab
                        .tag(ChecklistTab.history)

                    templatesTab
                        .tag(ChecklistTab.templates)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Checklists")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if selectedTab == .templates {
                        Button(action: {
                            showTemplateEditor = true
                        }) {
                            Image(systemName: "plus.circle.fill")
                        }
                    }
                }
            }
            .sheet(isPresented: $showTemplateEditor) {
                ChecklistTemplateEditorView()
            }
            .sheet(item: $selectedPendingChecklist) { checklist in
                ChecklistNotificationView(
                    checklist: checklist,
                    onStart: {
                        Task {
                            await viewModel.startChecklist(checklist.id)
                            selectedPendingChecklist = nil
                            selectedTab = .active
                        }
                    },
                    onSkip: {
                        Task {
                            await viewModel.skipChecklist(reason: "User skipped")
                            selectedPendingChecklist = nil
                        }
                    }
                )
            }
        }
        .onAppear {
            checkForPendingChecklists()
        }
    }

    // MARK: - Custom Tab Bar

    private var customTabBar: some View {
        HStack(spacing: 0) {
            ForEach(ChecklistTab.allCases, id: \.self) { tab in
                tabButton(for: tab)
            }
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(.systemGray5)),
            alignment: .bottom
        )
    }

    private func tabButton(for tab: ChecklistTab) -> some View {
        Button(action: {
            withAnimation(.easeInOut(duration: 0.2)) {
                selectedTab = tab
            }
        }) {
            VStack(spacing: 6) {
                ZStack {
                    Image(systemName: tab.icon)
                        .font(.title3)
                        .foregroundColor(selectedTab == tab ? .blue : .gray)

                    // Badge for pending count
                    if tab == .pending && !viewModel.pendingChecklists.isEmpty {
                        Text("\(viewModel.pendingChecklists.count)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(4)
                            .background(Color.red)
                            .clipShape(Circle())
                            .offset(x: 12, y: -12)
                    }
                }

                Text(tab.rawValue)
                    .font(.caption)
                    .foregroundColor(selectedTab == tab ? .blue : .gray)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                selectedTab == tab ?
                    Color.blue.opacity(0.1) :
                    Color.clear
            )
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Tab Views

    private var pendingTab: some View {
        Group {
            if viewModel.pendingChecklists.isEmpty {
                emptyPendingState
            } else {
                List {
                    ForEach(viewModel.pendingChecklists) { checklist in
                        PendingChecklistRow(checklist: checklist)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedPendingChecklist = checklist
                            }
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }

    private var activeTab: some View {
        Group {
            if viewModel.activeChecklist != nil {
                ActiveChecklistView()
            } else {
                emptyActiveState
            }
        }
    }

    private var historyTab: some View {
        ChecklistHistoryView()
    }

    private var templatesTab: some View {
        TemplatesListView()
    }

    // MARK: - Empty States

    private var emptyPendingState: some View {
        VStack(spacing: 20) {
            Image(systemName: "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Pending Checklists")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Checklists will appear here when triggered by location, time, or events")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyActiveState: some View {
        VStack(spacing: 20) {
            Image(systemName: "play.circle")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Active Checklist")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start a pending checklist to begin")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if !viewModel.pendingChecklists.isEmpty {
                Button(action: {
                    selectedTab = .pending
                }) {
                    Text("View Pending (\(viewModel.pendingChecklists.count))")
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Helpers

    private func checkForPendingChecklists() {
        if !viewModel.pendingChecklists.isEmpty && selectedTab == .pending {
            // Auto-show first pending checklist if critical
            if let firstChecklist = viewModel.pendingChecklists.first,
               firstChecklist.isRequired {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    selectedPendingChecklist = firstChecklist
                }
            }
        }
    }
}

// MARK: - Pending Checklist Row

struct PendingChecklistRow: View {
    let checklist: ChecklistInstance

    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(checklist.isRequired ? Color.red : Color.orange)
                .frame(width: 12, height: 12)

            // Category icon
            ZStack {
                Circle()
                    .fill(categoryColor.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: checklist.category.icon)
                    .foregroundColor(categoryColor)
            }

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(checklist.templateName)
                    .font(.headline)

                HStack(spacing: 8) {
                    Label(
                        "Triggered \(timeAgo(checklist.triggeredAt))",
                        systemImage: "clock"
                    )
                    .font(.caption)
                    .foregroundColor(.secondary)
                }

                if let locationName = checklist.locationName {
                    Label(locationName, systemImage: "mappin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if checklist.isRequired {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text("Required - Cannot Skip")
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
            }

            Spacer()

            // Expiration warning
            if let expiresAt = checklist.expiresAt {
                VStack(alignment: .trailing, spacing: 4) {
                    Image(systemName: "timer")
                        .foregroundColor(.orange)

                    Text(timeRemaining(expiresAt))
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            } else {
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }

    private var categoryColor: Color {
        switch checklist.category {
        case .osha: return .red
        case .preTripInspection: return .blue
        case .postTripInspection: return .green
        case .siteArrival: return .purple
        case .siteDeparture: return .orange
        case .taskCompletion: return .teal
        case .resourceCheck: return .cyan
        case .mileageReport: return .indigo
        case .fuelReport: return .yellow
        case .deliveryConfirmation: return .mint
        case .pickupConfirmation: return .pink
        case .incidentReport: return .red
        case .maintenance: return .orange
        case .custom: return .gray
        }
    }

    private func timeAgo(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let minutes = Int(interval / 60)

        if minutes < 1 {
            return "just now"
        } else if minutes < 60 {
            return "\(minutes)m ago"
        } else {
            let hours = minutes / 60
            return "\(hours)h ago"
        }
    }

    private func timeRemaining(_ date: Date) -> String {
        let interval = date.timeIntervalSinceNow
        let minutes = Int(interval / 60)

        if minutes < 0 {
            return "Expired"
        } else if minutes < 60 {
            return "\(minutes)m left"
        } else {
            let hours = minutes / 60
            return "\(hours)h left"
        }
    }
}

// MARK: - Templates List View

struct TemplatesListView: View {
    @StateObject private var viewModel = ChecklistViewModel()
    @State private var showTemplateEditor = false
    @State private var selectedTemplate: ChecklistTemplate?

    var body: some View {
        Group {
            if viewModel.templates.isEmpty {
                emptyTemplatesState
            } else {
                List {
                    ForEach(viewModel.filteredTemplates) { template in
                        TemplateRow(
                            template: template,
                            onEdit: {
                                selectedTemplate = template
                                showTemplateEditor = true
                            },
                            onTrigger: {
                                Task {
                                    await viewModel.manuallyTriggerChecklist(templateId: template.id)
                                }
                            }
                        )
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
        .sheet(isPresented: $showTemplateEditor) {
            if let template = selectedTemplate {
                ChecklistTemplateEditorView(template: template)
            }
        }
    }

    private var emptyTemplatesState: some View {
        VStack(spacing: 20) {
            Image(systemName: "square.stack.3d.up")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Templates")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Create templates to define custom checklists")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

struct TemplateRow: View {
    let template: ChecklistTemplate
    let onEdit: () -> Void
    let onTrigger: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Category icon
            ZStack {
                Circle()
                    .fill(categoryColor.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: template.category.icon)
                    .foregroundColor(categoryColor)
            }

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(template.name)
                    .font(.headline)

                Text(template.category.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 8) {
                    Label("\(template.items.count) items", systemImage: "list.bullet")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Label("\(template.triggers.count) triggers", systemImage: "bolt")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if !template.isActive {
                    Text("Inactive")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }

            Spacer()

            Menu {
                Button(action: onEdit) {
                    Label("Edit", systemImage: "pencil")
                }

                Button(action: onTrigger) {
                    Label("Trigger Manually", systemImage: "play.circle")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 8)
    }

    private var categoryColor: Color {
        switch template.category {
        case .osha: return .red
        case .preTripInspection: return .blue
        case .postTripInspection: return .green
        case .siteArrival: return .purple
        case .siteDeparture: return .orange
        case .taskCompletion: return .teal
        case .resourceCheck: return .cyan
        case .mileageReport: return .indigo
        case .fuelReport: return .yellow
        case .deliveryConfirmation: return .mint
        case .pickupConfirmation: return .pink
        case .incidentReport: return .red
        case .maintenance: return .orange
        case .custom: return .gray
        }
    }
}

// MARK: - Preview

#Preview {
    ChecklistManagementView()
}
