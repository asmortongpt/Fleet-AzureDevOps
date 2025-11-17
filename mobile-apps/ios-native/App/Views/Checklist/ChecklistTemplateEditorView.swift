//
//  ChecklistTemplateEditorView.swift
//  Fleet Manager
//
//  Template configuration UI for fleet managers
//

import SwiftUI

struct ChecklistTemplateEditorView: View {
    @StateObject private var viewModel = ChecklistViewModel()
    @Environment(\.presentationMode) var presentationMode

    @State private var template: ChecklistTemplate
    @State private var showAddItemSheet = false
    @State private var editingItem: ChecklistItemTemplate?
    @State private var showPreview = false

    let isNewTemplate: Bool

    init(template: ChecklistTemplate? = nil) {
        self.isNewTemplate = template == nil
        _template = State(initialValue: template ?? ChecklistTemplate(
            id: UUID().uuidString,
            name: "",
            description: "",
            category: .custom,
            items: [],
            triggers: [],
            isRequired: false,
            timeoutMinutes: nil,
            allowSkip: true,
            requiresApproval: false,
            approverRoles: [],
            attachmentTypes: [],
            createdBy: "current_user",
            createdAt: Date(),
            isActive: true
        ))
    }

    var body: some View {
        NavigationView {
            Form {
                // Basic information
                basicInfoSection

                // Category and triggers
                categoryTriggersSection

                // Items
                itemsSection

                // Settings
                settingsSection

                // Preview
                previewSection
            }
            .navigationTitle(isNewTemplate ? "New Template" : "Edit Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                toolbarContent
            }
            .sheet(isPresented: $showAddItemSheet) {
                ItemEditorSheet(
                    item: editingItem,
                    onSave: { item in
                        if let index = template.items.firstIndex(where: { $0.id == item.id }) {
                            template.items[index] = item
                        } else {
                            template.items.append(item)
                        }
                        editingItem = nil
                    }
                )
            }
            .sheet(isPresented: $showPreview) {
                TemplatePreviewView(template: template)
            }
        }
    }

    private var basicInfoSection: some View {
        Section("Basic Information") {
            TextField("Template Name", text: $template.name)

            TextField("Description", text: $template.description, axis: .vertical)
                .lineLimit(3...6)
        }
    }

    private var categoryTriggersSection: some View {
        Section("Category & Triggers") {
            Picker("Category", selection: $template.category) {
                ForEach(ChecklistCategory.allCases, id: \.self) { category in
                    HStack {
                        Image(systemName: category.icon)
                        Text(category.rawValue)
                    }
                    .tag(category)
                }
            }

            NavigationLink("Configure Triggers (\(template.triggers.count))") {
                TriggerEditorView(triggers: $template.triggers)
            }
        }
    }

    private var itemsSection: some View {
        Section {
            ForEach(template.items.sorted(by: { $0.sequenceNumber < $1.sequenceNumber })) { item in
                ItemRow(item: item, onEdit: {
                    editingItem = item
                    showAddItemSheet = true
                }, onDelete: {
                    template.items.removeAll { $0.id == item.id }
                })
            }
            .onMove { from, to in
                var sortedItems = template.items.sorted(by: { $0.sequenceNumber < $1.sequenceNumber })
                sortedItems.move(fromOffsets: from, toOffset: to)
                // Update sequence numbers
                for (index, item) in sortedItems.enumerated() {
                    if let itemIndex = template.items.firstIndex(where: { $0.id == item.id }) {
                        template.items[itemIndex].sequenceNumber = index + 1
                    }
                }
            }

            Button(action: {
                editingItem = nil
                showAddItemSheet = true
            }) {
                Label("Add Item", systemImage: "plus.circle.fill")
            }
        } header: {
            HStack {
                Text("Checklist Items")
                Spacer()
                if !template.items.isEmpty {
                    Text("\(template.items.count)")
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    private var settingsSection: some View {
        Section("Settings") {
            Toggle("Required (Cannot Skip)", isOn: $template.isRequired)

            if !template.isRequired {
                Toggle("Allow Skip", isOn: $template.allowSkip)
            }

            Toggle("Auto-Expire", isOn: Binding(
                get: { template.timeoutMinutes != nil },
                set: { enabled in
                    template.timeoutMinutes = enabled ? 30 : nil
                }
            ))

            if template.timeoutMinutes != nil {
                Stepper("Timeout: \(template.timeoutMinutes!) minutes",
                        value: Binding(
                            get: { template.timeoutMinutes ?? 30 },
                            set: { template.timeoutMinutes = $0 }
                        ),
                        in: 5...120,
                        step: 5)
            }

            Toggle("Requires Approval", isOn: $template.requiresApproval)

            Toggle("Active", isOn: $template.isActive)
        }
    }

    private var previewSection: some View {
        Section {
            Button(action: {
                showPreview = true
            }) {
                HStack {
                    Spacer()
                    Image(systemName: "eye")
                    Text("Preview Template")
                    Spacer()
                }
            }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .navigationBarLeading) {
            Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            }
        }

        ToolbarItem(placement: .navigationBarTrailing) {
            Button("Save") {
                Task {
                    if isNewTemplate {
                        await viewModel.createTemplate(template)
                    } else {
                        await viewModel.updateTemplate(template)
                    }
                    presentationMode.wrappedValue.dismiss()
                }
            }
            .disabled(template.name.isEmpty || template.items.isEmpty)
            .fontWeight(.semibold)
        }
    }
}

// MARK: - Item Row

struct ItemRow: View {
    let item: ChecklistItemTemplate
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("#\(item.sequenceNumber)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color(.systemGray5))
                        .cornerRadius(4)

                    if item.isRequired {
                        Text("Required")
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .cornerRadius(4)
                    }
                }

                Text(item.text)
                    .font(.subheadline)

                Text(item.type.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: onEdit) {
                Image(systemName: "pencil.circle.fill")
                    .foregroundColor(.blue)
            }
            .buttonStyle(PlainButtonStyle())

            Button(action: onDelete) {
                Image(systemName: "trash.circle.fill")
                    .foregroundColor(.red)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

// MARK: - Item Editor Sheet

struct ItemEditorSheet: View {
    @Environment(\.presentationMode) var presentationMode

    @State private var item: ChecklistItemTemplate
    @State private var options: String = ""

    let onSave: (ChecklistItemTemplate) -> Void

    init(item: ChecklistItemTemplate?, onSave: @escaping (ChecklistItemTemplate) -> Void) {
        self.onSave = onSave
        _item = State(initialValue: item ?? ChecklistItemTemplate(
            id: UUID().uuidString,
            sequenceNumber: 999,
            text: "",
            description: nil,
            type: .checkbox,
            isRequired: false,
            options: nil,
            validationRules: nil,
            dependencies: nil,
            conditionalLogic: nil
        ))
        _options = State(initialValue: item?.options?.joined(separator: "\n") ?? "")
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Item Details") {
                    TextField("Question/Prompt", text: $item.text)

                    TextField("Description (Optional)", text: Binding(
                        get: { item.description ?? "" },
                        set: { item.description = $0.isEmpty ? nil : $0 }
                    ))

                    Picker("Type", selection: $item.type) {
                        ForEach([
                            ChecklistItemType.checkbox,
                            .text,
                            .number,
                            .choice,
                            .multiChoice,
                            .signature,
                            .photo,
                            .location,
                            .dateTime,
                            .barcode,
                            .odometer,
                            .fuelGallons
                        ], id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }

                    Toggle("Required", isOn: $item.isRequired)
                }

                if item.type == .choice || item.type == .multiChoice {
                    Section("Options (One per line)") {
                        TextEditor(text: $options)
                            .frame(height: 150)
                    }
                }

                if item.type == .number || item.type == .odometer || item.type == .fuelGallons {
                    Section("Validation Rules") {
                        HStack {
                            Text("Min Value")
                            Spacer()
                            TextField("Min", value: Binding(
                                get: { item.validationRules?.minValue ?? 0 },
                                set: { value in
                                    if item.validationRules == nil {
                                        item.validationRules = ValidationRules(
                                            minValue: value,
                                            maxValue: nil,
                                            minLength: nil,
                                            maxLength: nil,
                                            pattern: nil,
                                            required: item.isRequired
                                        )
                                    } else {
                                        item.validationRules?.minValue = value
                                    }
                                }
                            ), format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                        }

                        HStack {
                            Text("Max Value")
                            Spacer()
                            TextField("Max", value: Binding(
                                get: { item.validationRules?.maxValue ?? 999999 },
                                set: { value in
                                    if item.validationRules == nil {
                                        item.validationRules = ValidationRules(
                                            minValue: nil,
                                            maxValue: value,
                                            minLength: nil,
                                            maxLength: nil,
                                            pattern: nil,
                                            required: item.isRequired
                                        )
                                    } else {
                                        item.validationRules?.maxValue = value
                                    }
                                }
                            ), format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                        }
                    }
                }
            }
            .navigationTitle("Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        // Parse options
                        if item.type == .choice || item.type == .multiChoice {
                            item.options = options.split(separator: "\n").map(String.init)
                        }

                        onSave(item)
                        presentationMode.wrappedValue.dismiss()
                    }
                    .disabled(item.text.isEmpty)
                }
            }
        }
    }
}

// MARK: - Trigger Editor View

struct TriggerEditorView: View {
    @Binding var triggers: [ChecklistTrigger]
    @State private var showAddTrigger = false

    var body: some View {
        List {
            ForEach(triggers) { trigger in
                TriggerRow(trigger: trigger)
            }
            .onDelete { indexSet in
                triggers.remove(atOffsets: indexSet)
            }

            Button(action: {
                showAddTrigger = true
            }) {
                Label("Add Trigger", systemImage: "plus.circle.fill")
            }
        }
        .navigationTitle("Triggers")
        .sheet(isPresented: $showAddTrigger) {
            AddTriggerSheet { trigger in
                triggers.append(trigger)
            }
        }
    }
}

struct TriggerRow: View {
    let trigger: ChecklistTrigger

    var body: some View {
        HStack {
            Image(systemName: triggerIcon)
                .foregroundColor(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text(trigger.type.rawValue)
                    .font(.subheadline)

                if !trigger.conditions.isEmpty {
                    Text("\(trigger.conditions.count) conditions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Toggle("", isOn: .constant(trigger.isEnabled))
                .labelsHidden()
        }
    }

    private var triggerIcon: String {
        switch trigger.type {
        case .geofenceEntry: return "location.circle.fill"
        case .geofenceExit: return "location.slash.fill"
        case .taskStart: return "play.circle.fill"
        case .taskComplete: return "checkmark.circle.fill"
        case .timeOfDay: return "clock.fill"
        case .mileageInterval: return "gauge"
        case .fuelLevel: return "fuelpump.fill"
        case .engineHours: return "engine.combustion.fill"
        case .manual: return "hand.tap.fill"
        }
    }
}

struct AddTriggerSheet: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedType: TriggerType = .geofenceEntry

    let onSave: (ChecklistTrigger) -> Void

    var body: some View {
        NavigationView {
            Form {
                Picker("Trigger Type", selection: $selectedType) {
                    ForEach([
                        TriggerType.geofenceEntry,
                        .geofenceExit,
                        .taskStart,
                        .taskComplete,
                        .manual
                    ], id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
            }
            .navigationTitle("Add Trigger")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        let trigger = ChecklistTrigger(
                            id: UUID().uuidString,
                            type: selectedType,
                            conditions: [],
                            isEnabled: true
                        )
                        onSave(trigger)
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Template Preview

struct TemplatePreviewView: View {
    let template: ChecklistTemplate
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: template.category.icon)
                                .font(.title)
                                .foregroundColor(.blue)

                            VStack(alignment: .leading) {
                                Text(template.name)
                                    .font(.title2)
                                    .fontWeight(.bold)

                                Text(template.category.rawValue)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Text(template.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Settings
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Settings")
                            .font(.headline)

                        SettingRow(label: "Required", value: template.isRequired ? "Yes" : "No")
                        SettingRow(label: "Allow Skip", value: template.allowSkip ? "Yes" : "No")
                        if let timeout = template.timeoutMinutes {
                            SettingRow(label: "Timeout", value: "\(timeout) minutes")
                        }
                        SettingRow(label: "Triggers", value: "\(template.triggers.count)")
                    }

                    // Items
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Items (\(template.items.count))")
                            .font(.headline)

                        ForEach(template.items.sorted(by: { $0.sequenceNumber < $1.sequenceNumber })) { item in
                            PreviewItemRow(item: item)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Preview")
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
}

struct SettingRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}

struct PreviewItemRow: View {
    let item: ChecklistItemTemplate

    var body: some View {
        HStack(alignment: .top) {
            Text("\(item.sequenceNumber).")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 30, alignment: .leading)

            VStack(alignment: .leading, spacing: 4) {
                Text(item.text)
                    .font(.subheadline)

                HStack {
                    Text(item.type.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if item.isRequired {
                        Text("• Required")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Preview

#Preview {
    ChecklistTemplateEditorView()
}
