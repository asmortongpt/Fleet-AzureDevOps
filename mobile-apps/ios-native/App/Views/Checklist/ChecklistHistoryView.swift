//
//  ChecklistHistoryView.swift
//  Fleet Manager
//
//  View for browsing completed checklists with search and filter
//

import SwiftUI

struct ChecklistHistoryView: View {
    @StateObject private var viewModel = ChecklistViewModel()
    @State private var selectedChecklist: ChecklistInstance?
    @State private var showDetailView = false
    @State private var showFilterSheet = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and filter bar
                searchAndFilterBar

                // Statistics cards
                statisticsSection

                // Checklist list
                checklistList
            }
            .navigationTitle("Checklist History")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showFilterSheet = true
                    }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showDetailView) {
                if let checklist = selectedChecklist {
                    ChecklistDetailView(checklist: checklist)
                }
            }
            .sheet(isPresented: $showFilterSheet) {
                filterSheet
            }
        }
    }

    private var searchAndFilterBar: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search checklists...", text: $viewModel.searchQuery)
                    .textFieldStyle(PlainTextFieldStyle())

                if !viewModel.searchQuery.isEmpty {
                    Button(action: {
                        viewModel.searchQuery = ""
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
            .padding()

            if viewModel.selectedCategory != nil {
                categoryFilterChip
            }
        }
    }

    private var categoryFilterChip: some View {
        HStack {
            HStack(spacing: 6) {
                Image(systemName: viewModel.selectedCategory!.icon)
                    .font(.caption)
                Text(viewModel.selectedCategory!.rawValue)
                    .font(.caption)

                Button(action: {
                    viewModel.selectedCategory = nil
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.caption)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.blue.opacity(0.2))
            .foregroundColor(.blue)
            .cornerRadius(12)

            Spacer()
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }

    private var statisticsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                StatCard(
                    title: "Total",
                    value: "\(viewModel.statistics.totalCompleted)",
                    icon: "checkmark.circle.fill",
                    color: .blue
                )

                StatCard(
                    title: "Today",
                    value: "\(viewModel.statistics.completedToday)",
                    icon: "calendar",
                    color: .green
                )

                StatCard(
                    title: "This Week",
                    value: "\(viewModel.statistics.completedThisWeek)",
                    icon: "calendar.badge.clock",
                    color: .orange
                )

                StatCard(
                    title: "Avg Time",
                    value: viewModel.statistics.formattedAverageCompletionTime,
                    icon: "clock",
                    color: .purple
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.systemGroupedBackground))
    }

    private var checklistList: some View {
        Group {
            if viewModel.filteredCompletedChecklists.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(viewModel.filteredCompletedChecklists) { checklist in
                        ChecklistHistoryRow(checklist: checklist)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedChecklist = checklist
                                showDetailView = true
                            }
                    }
                }
                .listStyle(PlainListStyle())
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Checklists Found")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Completed checklists will appear here")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var filterSheet: some View {
        NavigationView {
            List {
                Section("Filter by Category") {
                    ForEach(ChecklistCategory.allCases, id: \.self) { category in
                        Button(action: {
                            viewModel.selectedCategory = category
                            showFilterSheet = false
                        }) {
                            HStack {
                                Image(systemName: category.icon)
                                    .foregroundColor(categoryColor(category))
                                    .frame(width: 30)

                                Text(category.rawValue)
                                    .foregroundColor(.primary)

                                Spacer()

                                if viewModel.selectedCategory == category {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }

                Section {
                    Button(action: {
                        viewModel.selectedCategory = nil
                        showFilterSheet = false
                    }) {
                        HStack {
                            Spacer()
                            Text("Clear Filter")
                                .foregroundColor(.red)
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Filter Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showFilterSheet = false
                    }
                }
            }
        }
    }

    private func categoryColor(_ category: ChecklistCategory) -> Color {
        switch category {
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

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(width: 120)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }
}

struct ChecklistHistoryRow: View {
    let checklist: ChecklistInstance

    var body: some View {
        HStack(spacing: 12) {
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
                    if let completedAt = checklist.completedAt {
                        Label(
                            formattedDate(completedAt),
                            systemImage: "calendar"
                        )
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }

                    Label(checklist.driverName, systemImage: "person")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if let locationName = checklist.locationName {
                    Label(locationName, systemImage: "mappin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Status badge
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.title3)
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

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Checklist Detail View

struct ChecklistDetailView: View {
    let checklist: ChecklistInstance
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    headerSection

                    // Metadata
                    metadataSection

                    // Items
                    itemsSection

                    // Attachments
                    if !checklist.attachments.isEmpty {
                        attachmentsSection
                    }

                    // Signature
                    if let signatureData = checklist.signature {
                        signatureSection(signatureData)
                    }

                    // Notes
                    if let notes = checklist.notes {
                        notesSection(notes)
                    }

                    // Export button
                    exportButton
                }
                .padding()
            }
            .navigationTitle("Checklist Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: checklist.category.icon)
                    .font(.title)
                    .foregroundColor(.blue)

                VStack(alignment: .leading, spacing: 4) {
                    Text(checklist.templateName)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(checklist.category.rawValue)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }

            Divider()
        }
    }

    private var metadataSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            MetadataRow(label: "Driver", value: checklist.driverName, icon: "person.fill")

            if let completedAt = checklist.completedAt {
                MetadataRow(
                    label: "Completed",
                    value: formattedDateTime(completedAt),
                    icon: "checkmark.circle.fill"
                )
            }

            if let locationName = checklist.locationName {
                MetadataRow(label: "Location", value: locationName, icon: "mappin.circle.fill")
            }

            if let vehicleNumber = checklist.vehicleNumber {
                MetadataRow(label: "Vehicle", value: vehicleNumber, icon: "car.fill")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var itemsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Completed Items")
                .font(.headline)

            ForEach(checklist.items) { item in
                CompletedItemRow(item: item)
            }
        }
    }

    private var attachmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Attachments")
                .font(.headline)

            ForEach(checklist.attachments) { attachment in
                AttachmentRow(attachment: attachment)
            }
        }
    }

    private func signatureSection(_ signatureData: Data) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Signature")
                .font(.headline)

            if let uiImage = UIImage(data: signatureData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 150)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
            }
        }
    }

    private func notesSection(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notes")
                .font(.headline)

            Text(notes)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.systemGray6))
                .cornerRadius(12)
        }
    }

    private var exportButton: some View {
        Button(action: {
            // TODO: Implement PDF export
        }) {
            HStack {
                Image(systemName: "square.and.arrow.up")
                Text("Export as PDF")
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }

    private func formattedDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct MetadataRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
            }

            Spacer()
        }
    }
}

struct CompletedItemRow: View {
    let item: ChecklistItemInstance

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)

                Text(item.text)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Spacer()
            }

            if let response = item.response {
                responseView(response)
                    .padding(.leading, 28)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }

    @ViewBuilder
    private func responseView(_ response: ChecklistResponse) -> some View {
        switch response {
        case .boolean(let value):
            Text(value ? "Yes" : "No")
                .font(.caption)
                .foregroundColor(.secondary)

        case .text(let value):
            Text(value)
                .font(.caption)
                .foregroundColor(.secondary)

        case .number(let value):
            Text(String(format: "%.2f", value))
                .font(.caption)
                .foregroundColor(.secondary)

        case .singleChoice(let value):
            Text(value)
                .font(.caption)
                .foregroundColor(.secondary)

        case .multipleChoice(let values):
            Text(values.joined(separator: ", "))
                .font(.caption)
                .foregroundColor(.secondary)

        case .signature:
            Text("Signature captured")
                .font(.caption)
                .foregroundColor(.secondary)

        case .photo:
            Text("Photo attached")
                .font(.caption)
                .foregroundColor(.secondary)

        case .locationData(let coordinate):
            Text("Lat: \(coordinate.latitude, specifier: "%.4f"), Lon: \(coordinate.longitude, specifier: "%.4f")")
                .font(.caption)
                .foregroundColor(.secondary)

        case .dateTime(let date):
            Text(formattedDate(date))
                .font(.caption)
                .foregroundColor(.secondary)

        case .barcode(let code):
            Text(code)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct AttachmentRow: View {
    let attachment: ChecklistAttachment

    var body: some View {
        HStack {
            Image(systemName: attachmentIcon)
                .foregroundColor(.blue)

            VStack(alignment: .leading) {
                Text(attachment.filename)
                    .font(.subheadline)

                Text(attachment.type.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }

    private var attachmentIcon: String {
        switch attachment.type {
        case .photo: return "photo"
        case .video: return "video"
        case .document: return "doc"
        case .audio: return "waveform"
        }
    }
}

// MARK: - Preview

#Preview {
    ChecklistHistoryView()
}
