//
//  ReportBuilderSupportViews.swift
//  Fleet Manager - iOS Native App
//
//  Supporting views for Report Builder
//  Filter editor, scheduler, and export options
//

import SwiftUI

// MARK: - Add Filter View

struct AddFilterView: View {
    @ObservedObject var viewModel: ReportBuilderViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedField: ReportField?
    @State private var selectedOperator: FilterOperator = .equals
    @State private var filterValue = ""
    @State private var comparisonValue = ""

    var body: some View {
        Form {
            Section("Field") {
                Picker("Select Field", selection: $selectedField) {
                    Text("Select...").tag(nil as ReportField?)
                    ForEach(viewModel.selectedDataSource.availableFields, id: \.self) { field in
                        Text(field.rawValue).tag(field as ReportField?)
                    }
                }
            }

            Section("Condition") {
                Picker("Operator", selection: $selectedOperator) {
                    ForEach(FilterOperator.allCases, id: \.self) { op in
                        HStack {
                            Text(op.symbol)
                            Text(op.rawValue)
                        }
                        .tag(op)
                    }
                }

                if needsValue {
                    TextField("Value", text: $filterValue)
                }

                if selectedOperator == .between {
                    TextField("And", text: $comparisonValue)
                }
            }

            Section {
                Button("Add Filter") {
                    addFilter()
                }
                .disabled(!isValid)
            }
        }
        .navigationTitle("Add Filter")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
    }

    private var needsValue: Bool {
        selectedOperator != .isEmpty && selectedOperator != .isNotEmpty
    }

    private var isValid: Bool {
        guard let field = selectedField else { return false }

        if needsValue && filterValue.isEmpty {
            return false
        }

        if selectedOperator == .between && comparisonValue.isEmpty {
            return false
        }

        return true
    }

    private func addFilter() {
        guard let field = selectedField else { return }

        let filter = ReportFilter(
            field: field,
            operatorType: selectedOperator,
            value: filterValue,
            comparisonValue: selectedOperator == .between ? comparisonValue : nil
        )

        viewModel.addFilter(filter)
        dismiss()
    }
}

// MARK: - Report Scheduler View

struct ReportSchedulerView: View {
    @ObservedObject var viewModel: ReportBuilderViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var frequency: ReportSchedule.ScheduleFrequency = .daily
    @State private var time = Date()
    @State private var selectedDayOfWeek = 1
    @State private var selectedDayOfMonth = 1
    @State private var isEnabled = true
    @State private var recipientEmail = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Schedule") {
                    Toggle("Enable Schedule", isOn: $isEnabled)

                    Picker("Frequency", selection: $frequency) {
                        ForEach(ReportSchedule.ScheduleFrequency.allCases, id: \.self) { freq in
                            Label(freq.rawValue, systemImage: freq.icon).tag(freq)
                        }
                    }

                    DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute)

                    if frequency == .weekly {
                        Picker("Day of Week", selection: $selectedDayOfWeek) {
                            ForEach(1...7, id: \.self) { day in
                                Text(dayName(for: day)).tag(day)
                            }
                        }
                    }

                    if frequency == .monthly {
                        Picker("Day of Month", selection: $selectedDayOfMonth) {
                            ForEach(1...31, id: \.self) { day in
                                Text("Day \(day)").tag(day)
                            }
                        }
                    }
                }

                Section("Recipients") {
                    ForEach(viewModel.recipients, id: \.self) { email in
                        HStack {
                            Text(email)
                            Spacer()
                            Button(action: { viewModel.removeRecipient(email) }) {
                                Image(systemName: "trash")
                                    .foregroundColor(.red)
                            }
                        }
                    }

                    HStack {
                        TextField("Add email address", text: $recipientEmail)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)

                        Button("Add") {
                            viewModel.addRecipient(recipientEmail)
                            recipientEmail = ""
                        }
                        .disabled(recipientEmail.isEmpty || !isValidEmail(recipientEmail))
                    }
                }

                if let schedule = viewModel.schedule {
                    Section("Current Schedule") {
                        HStack {
                            Text("Status")
                            Spacer()
                            Text(schedule.isEnabled ? "Active" : "Paused")
                                .foregroundColor(schedule.isEnabled ? .green : .orange)
                        }

                        if let lastRun = schedule.lastRun {
                            HStack {
                                Text("Last Run")
                                Spacer()
                                Text(lastRun, style: .relative)
                                    .foregroundColor(.secondary)
                            }
                        }

                        if let nextRun = schedule.nextRun {
                            HStack {
                                Text("Next Run")
                                Spacer()
                                Text(nextRun, style: .relative)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                Section {
                    Button("Save Schedule") {
                        saveSchedule()
                    }
                    .disabled(!isEnabled && viewModel.recipients.isEmpty)
                }
            }
            .navigationTitle("Schedule Report")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func dayName(for day: Int) -> String {
        let calendar = Calendar.current
        return calendar.weekdaySymbols[day - 1]
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    private func saveSchedule() {
        let schedule = ReportSchedule(
            frequency: frequency,
            time: time,
            dayOfWeek: frequency == .weekly ? selectedDayOfWeek : nil,
            dayOfMonth: frequency == .monthly ? selectedDayOfMonth : nil,
            isEnabled: isEnabled
        )

        viewModel.scheduleReport(schedule)
        dismiss()
    }
}

// MARK: - Export Options View

struct ExportOptionsView: View {
    @ObservedObject var viewModel: ReportBuilderViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedFormat: ReportFormat = .pdf
    @State private var includeCharts = true
    @State private var includeRawData = false
    @State private var companyLogo = true
    @State private var isExporting = false

    var body: some View {
        NavigationView {
            Form {
                Section("Export Format") {
                    ForEach(ReportFormat.allCases, id: \.self) { format in
                        Button(action: { selectedFormat = format }) {
                            HStack {
                                Image(systemName: format.icon)
                                    .foregroundColor(.blue)
                                    .frame(width: 30)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(format.rawValue)
                                        .font(.headline)
                                        .foregroundColor(.primary)

                                    Text(formatDescription(format))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }

                                Spacer()

                                if selectedFormat == format {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }

                Section("Options") {
                    Toggle("Include Charts", isOn: $includeCharts)
                    Toggle("Include Raw Data", isOn: $includeRawData)
                    Toggle("Company Logo", isOn: $companyLogo)
                }

                Section("File Preview") {
                    if let report = viewModel.generatedReport {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("File Name:")
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(report.templateName)_\(formattedDate()).\(selectedFormat.fileExtension)")
                                    .font(.caption)
                                    .foregroundColor(.primary)
                            }

                            HStack {
                                Text("Date Range:")
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text(report.dateRange.displayText)
                                    .font(.caption)
                                    .foregroundColor(.primary)
                            }

                            HStack {
                                Text("Records:")
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(report.summary?.totalRecords ?? 0)")
                                    .font(.caption)
                                    .foregroundColor(.primary)
                            }
                        }
                    }
                }

                Section {
                    Button(action: { exportReport() }) {
                        HStack {
                            if isExporting {
                                ProgressView()
                            } else {
                                Image(systemName: "square.and.arrow.up")
                            }

                            Text(isExporting ? "Exporting..." : "Export Report")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(isExporting)
                }
            }
            .navigationTitle("Export Report")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func formatDescription(_ format: ReportFormat) -> String {
        switch format {
        case .pdf:
            return "Portable Document Format - Best for printing and sharing"
        case .excel:
            return "Microsoft Excel - Editable spreadsheet with formulas"
        case .csv:
            return "Comma Separated Values - Universal data format"
        case .json:
            return "JSON Format - For API integration and processing"
        }
    }

    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    private func exportReport() {
        isExporting = true

        Task {
            let success = await viewModel.exportReport(format: selectedFormat)

            await MainActor.run {
                isExporting = false

                if success {
                    // Show success message
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Preview

#Preview("Add Filter") {
    NavigationView {
        AddFilterView(viewModel: ReportBuilderViewModel())
    }
}

#Preview("Scheduler") {
    ReportSchedulerView(viewModel: ReportBuilderViewModel())
}

#Preview("Export") {
    ExportOptionsView(viewModel: ReportBuilderViewModel())
}
