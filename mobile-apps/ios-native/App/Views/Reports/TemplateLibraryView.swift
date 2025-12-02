//
//  TemplateLibraryView.swift
//  Fleet Manager - iOS Native App
//
//  Template Library for Report Builder
//  Browse and select predefined and saved templates
//

import SwiftUI

struct TemplateLibraryView: View {
    @ObservedObject var viewModel: ReportBuilderViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var selectedCategory: TemplateCategory = .all

    enum TemplateCategory: String, CaseIterable {
        case all = "All"
        case predefined = "Predefined"
        case custom = "My Templates"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)

                    TextField("Search templates...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()

                // Category Picker
                Picker("Category", selection: $selectedCategory) {
                    ForEach(TemplateCategory.allCases, id: \.self) { category in
                        Text(category.rawValue).tag(category)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)

                // Templates List
                ScrollView {
                    LazyVStack(spacing: 16) {
                        if selectedCategory == .all || selectedCategory == .predefined {
                            Section {
                                ForEach(filteredPredefinedTemplates) { template in
                                    TemplateCard(template: template) {
                                        viewModel.selectTemplate(template)
                                        dismiss()
                                    }
                                }
                            } header: {
                                if selectedCategory == .all {
                                    SectionHeaderView(title: "Predefined Templates")
                                }
                            }
                        }

                        if selectedCategory == .all || selectedCategory == .custom {
                            Section {
                                if filteredCustomTemplates.isEmpty {
                                    EmptyStateView(
                                        icon: "doc.text.fill",
                                        title: "No Custom Templates",
                                        description: "Create and save your own report templates"
                                    )
                                    .padding(.vertical, 40)
                                } else {
                                    ForEach(filteredCustomTemplates) { template in
                                        TemplateCard(template: template, showActions: true) {
                                            viewModel.selectTemplate(template)
                                            dismiss()
                                        } onDelete: {
                                            viewModel.deleteTemplate(template)
                                        }
                                    }
                                }
                            } header: {
                                if selectedCategory == .all {
                                    SectionHeaderView(title: "My Templates")
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Template Library")
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

    private var filteredPredefinedTemplates: [ReportTemplate] {
        viewModel.availableTemplates.filter { template in
            searchText.isEmpty || template.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    private var filteredCustomTemplates: [ReportTemplate] {
        viewModel.savedTemplates.filter { template in
            searchText.isEmpty || template.name.localizedCaseInsensitiveContains(searchText)
        }
    }
}

struct TemplateCard: View {
    let template: ReportTemplate
    var showActions: Bool = false
    let onSelect: () -> Void
    var onDelete: (() -> Void)? = nil

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                // Icon
                ZStack {
                    Circle()
                        .fill(colorForType(template.type).opacity(0.15))
                        .frame(width: 60, height: 60)

                    Image(systemName: template.type.icon)
                        .font(.title2)
                        .foregroundColor(colorForType(template.type))
                }

                // Content
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(template.name)
                            .font(.headline)
                            .foregroundColor(.primary)

                        if template.isCustom {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                        }
                    }

                    Text(template.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        Label(template.dataSource.rawValue, systemImage: template.dataSource.icon)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(.systemGray5))
                            .cornerRadius(4)

                        Label(template.chartType.rawValue, systemImage: template.chartType.icon)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(.systemGray5))
                            .cornerRadius(4)
                    }
                }

                Spacer()

                // Actions
                if showActions {
                    Menu {
                        Button(action: onSelect) {
                            Label("Use Template", systemImage: "checkmark.circle")
                        }

                        if let onDelete = onDelete {
                            Button(role: .destructive, action: onDelete) {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundColor(.blue)
                    }
                } else {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }

    private func colorForType(_ type: ReportTemplateType) -> Color {
        switch type.color {
        case "blue": return .blue
        case "orange": return .orange
        case "red": return .red
        case "green": return .green
        case "purple": return .purple
        case "cyan": return .cyan
        case "indigo": return .indigo
        case "teal": return .teal
        default: return .gray
        }
    }
}

struct SectionHeaderView: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 8)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)

                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

#Preview {
    TemplateLibraryView(viewModel: ReportBuilderViewModel())
}
