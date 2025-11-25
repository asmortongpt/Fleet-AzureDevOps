//
//  CreateTaskView.swift
//  Fleet Manager - iOS Native App
//
//  Create and edit tasks with templates, recurrence, and checklist support
//

import SwiftUI

struct CreateTaskView: View {
    @ObservedObject var viewModel: TaskViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var description = ""
    @State private var selectedCategory: TaskCategory = .inspection
    @State private var selectedPriority: TaskPriority = .normal
    @State private var selectedAssigneeId: String?
    @State private var selectedVehicleId: String?
    @State private var dueDate = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @State private var hasDueDate = true
    @State private var estimatedHours: Double = 2.0
    @State private var hasEstimate = false
    @State private var checklistItems: [String] = []
    @State private var newChecklistItem = ""
    @State private var tags: [String] = []
    @State private var newTag = ""
    @State private var hasRecurrence = false
    @State private var recurrenceFrequency: RecurrenceFrequency = .weekly
    @State private var recurrenceInterval = 1
    @State private var recurrenceEndDate: Date?
    @State private var hasRecurrenceEnd = false
    @State private var selectedTemplate: TaskTemplate?
    @State private var showingTemplatePicker = false

    var body: some View {
        NavigationView {
            Form {
                // Template Section
                templateSection

                // Basic Information
                basicInfoSection

                // Category and Priority
                categoryPrioritySection

                // Assignment
                assignmentSection

                // Dates and Time
                datesSection

                // Checklist
                checklistSection

                // Tags
                tagsSection

                // Recurrence
                recurrenceSection
            }
            .navigationTitle("Create Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        createTask()
                    }
                    .disabled(!isValid)
                }
            }
            .sheet(isPresented: $showingTemplatePicker) {
                TemplatePickerView(templates: viewModel.templates) { template in
                    applyTemplate(template)
                }
            }
        }
    }

    // MARK: - Template Section
    private var templateSection: some View {
        Section {
            Button(action: { showingTemplatePicker = true }) {
                HStack {
                    Image(systemName: "doc.on.doc.fill")
                        .foregroundColor(.blue)
                    Text("Use Template")
                        .foregroundColor(.primary)
                    Spacer()
                    if let template = selectedTemplate {
                        Text(template.name)
                            .foregroundColor(.secondary)
                    }
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            if selectedTemplate != nil {
                Button(action: {
                    selectedTemplate = nil
                    clearTemplate()
                }) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                        Text("Clear Template")
                            .foregroundColor(.red)
                    }
                }
            }
        } header: {
            Text("Template")
        } footer: {
            Text("Start with a predefined template or create from scratch")
        }
    }

    // MARK: - Basic Info Section
    private var basicInfoSection: some View {
        Section {
            TextField("Task Title", text: $title)

            TextField("Description (optional)", text: $description, axis: .vertical)
                .lineLimit(3...6)
        } header: {
            Text("Basic Information")
        }
    }

    // MARK: - Category and Priority Section
    private var categoryPrioritySection: some View {
        Section {
            Picker("Category", selection: $selectedCategory) {
                ForEach(TaskCategory.allCases, id: \.self) { category in
                    HStack {
                        Image(systemName: category.icon)
                        Text(category.rawValue)
                    }
                    .tag(category)
                }
            }

            Picker("Priority", selection: $selectedPriority) {
                ForEach(TaskPriority.allCases, id: \.self) { priority in
                    HStack {
                        Image(systemName: priority.icon)
                        Text(priority.rawValue)
                    }
                    .tag(priority)
                }
            }
        } header: {
            Text("Classification")
        }
    }

    // MARK: - Assignment Section
    private var assignmentSection: some View {
        Section {
            Picker("Assign To", selection: $selectedAssigneeId) {
                Text("Unassigned").tag(nil as String?)
                ForEach(viewModel.users, id: \.id) { user in
                    Text(user.name).tag(user.id as String?)
                }
            }

            Picker("Vehicle", selection: $selectedVehicleId) {
                Text("No Vehicle").tag(nil as String?)
                ForEach(viewModel.vehicles, id: \.id) { vehicle in
                    Text(vehicle.number).tag(vehicle.id as String?)
                }
            }
        } header: {
            Text("Assignment")
        }
    }

    // MARK: - Dates Section
    private var datesSection: some View {
        Section {
            Toggle("Set Due Date", isOn: $hasDueDate)

            if hasDueDate {
                DatePicker("Due Date", selection: $dueDate, displayedComponents: [.date, .hourAndMinute])
            }

            Toggle("Set Estimated Hours", isOn: $hasEstimate)

            if hasEstimate {
                HStack {
                    Text("Estimated Hours")
                    Spacer()
                    TextField("Hours", value: $estimatedHours, format: .number)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
            }
        } header: {
            Text("Schedule & Estimation")
        }
    }

    // MARK: - Checklist Section
    private var checklistSection: some View {
        Section {
            ForEach(Array(checklistItems.enumerated()), id: \.offset) { index, item in
                HStack {
                    Image(systemName: "circle")
                        .foregroundColor(.gray)
                    Text(item)
                    Spacer()
                    Button(action: {
                        checklistItems.remove(at: index)
                    }) {
                        Image(systemName: "minus.circle.fill")
                            .foregroundColor(.red)
                    }
                }
            }

            HStack {
                TextField("Add checklist item", text: $newChecklistItem)
                Button(action: {
                    guard !newChecklistItem.isEmpty else { return }
                    checklistItems.append(newChecklistItem)
                    newChecklistItem = ""
                }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.blue)
                }
                .disabled(newChecklistItem.isEmpty)
            }
        } header: {
            Text("Checklist (\(checklistItems.count) items)")
        }
    }

    // MARK: - Tags Section
    private var tagsSection: some View {
        Section {
            if !tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(tags, id: \.self) { tag in
                            HStack(spacing: 4) {
                                Text(tag)
                                Button(action: {
                                    tags.removeAll { $0 == tag }
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.caption)
                                }
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.2))
                            .foregroundColor(.blue)
                            .cornerRadius(12)
                        }
                    }
                }
            }

            HStack {
                TextField("Add tag", text: $newTag)
                Button(action: {
                    guard !newTag.isEmpty else { return }
                    tags.append(newTag)
                    newTag = ""
                }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.blue)
                }
                .disabled(newTag.isEmpty)
            }
        } header: {
            Text("Tags")
        } footer: {
            Text("Add tags to organize and filter tasks")
        }
    }

    // MARK: - Recurrence Section
    private var recurrenceSection: some View {
        Section {
            Toggle("Recurring Task", isOn: $hasRecurrence)

            if hasRecurrence {
                Picker("Frequency", selection: $recurrenceFrequency) {
                    ForEach(RecurrenceFrequency.allCases, id: \.self) { frequency in
                        Text(frequency.rawValue).tag(frequency)
                    }
                }

                Stepper("Every \(recurrenceInterval) \(recurrenceFrequency.rawValue.lowercased())", value: $recurrenceInterval, in: 1...30)

                Toggle("Set End Date", isOn: $hasRecurrenceEnd)

                if hasRecurrenceEnd {
                    DatePicker("End Date", selection: Binding(
                        get: { recurrenceEndDate ?? Date() },
                        set: { recurrenceEndDate = $0 }
                    ), displayedComponents: .date)
                }
            }
        } header: {
            Text("Recurrence")
        } footer: {
            if hasRecurrence {
                Text("This task will repeat \(recurrenceFrequency.rawValue.lowercased()) every \(recurrenceInterval) \(recurrenceInterval == 1 ? recurrenceFrequency.rawValue.lowercased() : recurrenceFrequency.rawValue.lowercased() + "s")")
            }
        }
    }

    // MARK: - Helper Methods
    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func applyTemplate(_ template: TaskTemplate) {
        selectedTemplate = template
        title = template.name
        description = template.description ?? ""
        selectedCategory = template.category
        selectedPriority = template.defaultPriority
        checklistItems = template.checklistItems
        tags = template.tags
        if let hours = template.defaultEstimatedHours {
            estimatedHours = hours
            hasEstimate = true
        }
    }

    private func clearTemplate() {
        title = ""
        description = ""
        selectedCategory = .inspection
        selectedPriority = .normal
        checklistItems = []
        tags = []
        hasEstimate = false
    }

    private func createTask() {
        let recurrence: TaskRecurrence? = hasRecurrence ? TaskRecurrence(
            frequency: recurrenceFrequency,
            interval: recurrenceInterval,
            endDate: hasRecurrenceEnd ? recurrenceEndDate : nil
        ) : nil

        viewModel.createTask(
            title: title.trimmingCharacters(in: .whitespaces),
            description: description.isEmpty ? nil : description.trimmingCharacters(in: .whitespaces),
            category: selectedCategory,
            priority: selectedPriority,
            assigneeId: selectedAssigneeId,
            vehicleId: selectedVehicleId,
            dueDate: hasDueDate ? dueDate : nil,
            estimatedHours: hasEstimate ? estimatedHours : nil,
            checklistItems: checklistItems,
            tags: tags,
            recurrence: recurrence
        )

        dismiss()
    }
}

// MARK: - Template Picker View
struct TemplatePickerView: View {
    let templates: [TaskTemplate]
    let onSelect: (TaskTemplate) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                if templates.isEmpty {
                    ContentUnavailableView(
                        "No Templates",
                        systemImage: "doc.on.doc",
                        description: Text("No task templates available")
                    )
                } else {
                    ForEach(templates.filter { $0.isActive }) { template in
                        Button(action: {
                            onSelect(template)
                            dismiss()
                        }) {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: template.category.icon)
                                    .font(.title2)
                                    .foregroundColor(template.category.color)
                                    .frame(width: 40, height: 40)
                                    .background(template.category.color.opacity(0.2))
                                    .cornerRadius(8)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(template.name)
                                        .font(.headline)
                                        .foregroundColor(.primary)

                                    if let description = template.description {
                                        Text(description)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                            .lineLimit(2)
                                    }

                                    HStack {
                                        Text(template.category.rawValue)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 2)
                                            .background(template.category.color.opacity(0.2))
                                            .foregroundColor(template.category.color)
                                            .cornerRadius(4)

                                        if !template.checklistItems.isEmpty {
                                            HStack(spacing: 2) {
                                                Image(systemName: "checklist")
                                                    .font(.caption2)
                                                Text("\(template.checklistItems.count)")
                                                    .font(.caption)
                                            }
                                            .foregroundColor(.secondary)
                                        }

                                        if let hours = template.defaultEstimatedHours {
                                            HStack(spacing: 2) {
                                                Image(systemName: "clock.fill")
                                                    .font(.caption2)
                                                Text(String(format: "%.1fh", hours))
                                                    .font(.caption)
                                            }
                                            .foregroundColor(.secondary)
                                        }
                                    }
                                }

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }
            .navigationTitle("Task Templates")
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

#Preview {
    CreateTaskView(viewModel: TaskViewModel())
}
