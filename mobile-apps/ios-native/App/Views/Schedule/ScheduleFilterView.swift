import SwiftUI

struct ScheduleFilterView: View {
    @Binding var filter: ScheduleFilter
    @Environment(\.dismiss) var dismiss

    @State private var selectedTypes: Set<ScheduleType>
    @State private var selectedStatuses: Set<ScheduleStatus>
    @State private var selectedPriorities: Set<Priority>
    @State private var hasDateRange: Bool
    @State private var dateRangeStart: Date
    @State private var dateRangeEnd: Date
    @State private var searchText: String

    init(filter: Binding<ScheduleFilter>) {
        _filter = filter
        _selectedTypes = State(initialValue: filter.wrappedValue.types)
        _selectedStatuses = State(initialValue: filter.wrappedValue.statuses)
        _selectedPriorities = State(initialValue: filter.wrappedValue.priorities)
        _hasDateRange = State(initialValue: filter.wrappedValue.dateRange != nil)
        _dateRangeStart = State(initialValue: filter.wrappedValue.dateRange?.start ?? Date())
        _dateRangeEnd = State(initialValue: filter.wrappedValue.dateRange?.end ?? Date().addingTimeInterval(86400 * 7))
        _searchText = State(initialValue: filter.wrappedValue.searchText)
    }

    var body: some View {
        NavigationView {
            Form {
                searchSection
                typeSection
                statusSection
                prioritySection
                dateRangeSection
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
                        applyFilters()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .bottomBar) {
                    Button("Clear All") {
                        clearFilters()
                    }
                    .disabled(isFilterEmpty)
                }
            }
        }
    }

    private var searchSection: some View {
        Section {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search schedules...", text: $searchText)
                    .textInputAutocapitalization(.never)

                if !searchText.isEmpty {
                    Button {
                        searchText = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }

    private var typeSection: some View {
        Section("Schedule Type") {
            ForEach(ScheduleType.allCases, id: \.self) { type in
                Toggle(isOn: binding(for: type)) {
                    Label(type.rawValue, systemImage: type.icon)
                }
            }
        }
    }

    private var statusSection: some View {
        Section("Status") {
            ForEach([ScheduleStatus.scheduled, .confirmed, .inProgress, .completed, .cancelled, .delayed], id: \.self) { status in
                Toggle(status.rawValue, isOn: statusBinding(for: status))
            }
        }
    }

    private var prioritySection: some View {
        Section("Priority") {
            ForEach(Priority.allCases, id: \.self) { priority in
                Toggle(priority.rawValue, isOn: priorityBinding(for: priority))
            }
        }
    }

    private var dateRangeSection: some View {
        Section("Date Range") {
            Toggle("Filter by Date Range", isOn: $hasDateRange)

            if hasDateRange {
                DatePicker("From", selection: $dateRangeStart, displayedComponents: .date)

                DatePicker("To", selection: $dateRangeEnd, displayedComponents: .date)

                if dateRangeEnd < dateRangeStart {
                    Label("End date must be after start date", systemImage: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
    }

    private var isFilterEmpty: Bool {
        selectedTypes.isEmpty &&
        selectedStatuses.isEmpty &&
        selectedPriorities.isEmpty &&
        !hasDateRange &&
        searchText.isEmpty
    }

    private func binding(for type: ScheduleType) -> Binding<Bool> {
        Binding(
            get: { selectedTypes.contains(type) },
            set: { isSelected in
                if isSelected {
                    selectedTypes.insert(type)
                } else {
                    selectedTypes.remove(type)
                }
            }
        )
    }

    private func statusBinding(for status: ScheduleStatus) -> Binding<Bool> {
        Binding(
            get: { selectedStatuses.contains(status) },
            set: { isSelected in
                if isSelected {
                    selectedStatuses.insert(status)
                } else {
                    selectedStatuses.remove(status)
                }
            }
        )
    }

    private func priorityBinding(for priority: Priority) -> Binding<Bool> {
        Binding(
            get: { selectedPriorities.contains(priority) },
            set: { isSelected in
                if isSelected {
                    selectedPriorities.insert(priority)
                } else {
                    selectedPriorities.remove(priority)
                }
            }
        )
    }

    private func applyFilters() {
        filter.types = selectedTypes
        filter.statuses = selectedStatuses
        filter.priorities = selectedPriorities
        filter.dateRange = hasDateRange ? DateRange(start: dateRangeStart, end: dateRangeEnd) : nil
        filter.searchText = searchText
    }

    private func clearFilters() {
        selectedTypes.removeAll()
        selectedStatuses.removeAll()
        selectedPriorities.removeAll()
        hasDateRange = false
        searchText = ""
    }
}
