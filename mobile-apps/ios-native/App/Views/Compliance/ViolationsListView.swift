import SwiftUI

struct ViolationsListView: View {
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @Environment(\.dismiss) var dismiss
    @State private var selectedViolation: Violation?
    @State private var showingResolveSheet = false
    @State private var resolvedBy = ""
    @State private var resolutionNotes = ""

    var body: some View {
        List {
            // Filters Section
            Section {
                VStack(spacing: 12) {
                    // Category Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(
                                title: "All",
                                isSelected: viewModel.selectedCategory == nil
                            ) {
                                viewModel.setCategory(nil)
                            }

                            ForEach(ComplianceCategory.allCases, id: \.self) { category in
                                FilterChip(
                                    title: category.displayName,
                                    isSelected: viewModel.selectedCategory == category
                                ) {
                                    viewModel.setCategory(category)
                                }
                            }
                        }
                        .padding(.horizontal, 4)
                    }

                    // Severity Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(
                                title: "All Severity",
                                isSelected: viewModel.selectedSeverity == nil
                            ) {
                                viewModel.setSeverity(nil)
                            }

                            ForEach(ViolationSeverity.allCases, id: \.self) { severity in
                                FilterChip(
                                    title: severity.displayName,
                                    isSelected: viewModel.selectedSeverity == severity,
                                    color: Color(severity.color)
                                ) {
                                    viewModel.setSeverity(severity)
                                }
                            }
                        }
                        .padding(.horizontal, 4)
                    }

                    // Resolved Toggle
                    Toggle("Show Resolved", isOn: $viewModel.showResolvedViolations)
                        .toggleStyle(SwitchToggleStyle(tint: .blue))
                }
            }

            // Summary Section
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(viewModel.filteredViolations.count)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Total Violations")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text("\(viewModel.unresolvedViolationsCount)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                        Text("Unresolved")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text("$\(String(format: "%.2f", viewModel.totalOutstandingFines))")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                        Text("Outstanding")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 8)
            }

            // Violations List
            Section {
                if viewModel.filteredViolations.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.green)
                        Text("No violations found")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Great job maintaining compliance!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else {
                    ForEach(viewModel.filteredViolations) { violation in
                        ViolationCard(violation: violation)
                            .onTapGesture {
                                selectedViolation = violation
                                showingResolveSheet = true
                            }
                    }
                }
            }
        }
        .navigationTitle("Violations")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Close") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    viewModel.clearFilters()
                }) {
                    Text("Clear Filters")
                        .font(.subheadline)
                }
                .disabled(viewModel.selectedCategory == nil &&
                         viewModel.selectedSeverity == nil &&
                         !viewModel.showResolvedViolations)
            }
        }
        .searchable(text: $viewModel.searchText, prompt: "Search violations")
        .sheet(isPresented: $showingResolveSheet) {
            if let violation = selectedViolation {
                ResolveViolationSheet(
                    violation: violation,
                    viewModel: viewModel,
                    isPresented: $showingResolveSheet
                )
            }
        }
    }
}

// MARK: - Violation Card
struct ViolationCard: View {
    let violation: Violation

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Image(systemName: violation.severity.icon)
                            .foregroundColor(Color(violation.severity.color))

                        Text(violation.severity.displayName)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(Color(violation.severity.color))

                        if violation.isResolved {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.caption)
                        }
                    }

                    Text(violation.type.displayName)
                        .font(.headline)
                }

                Spacer()

                if let fine = violation.fineAmount {
                    Text(violation.formattedFineAmount)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                }
            }

            // Description
            Text(violation.description)
                .font(.subheadline)
                .foregroundColor(.primary)

            // Details
            VStack(spacing: 6) {
                DetailRow(icon: "car.fill", label: "Entity", value: violation.entityName)
                DetailRow(icon: "calendar", label: "Date", value: violation.formattedViolationDate)

                if let citation = violation.citationNumber {
                    DetailRow(icon: "number", label: "Citation", value: citation)
                }

                if let location = violation.location {
                    DetailRow(icon: "location.fill", label: "Location", value: location)
                }

                if let officer = violation.officerName {
                    DetailRow(icon: "person.fill", label: "Officer", value: officer)
                }
            }

            // Resolution info
            if violation.isResolved {
                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)

                        Text("Resolved")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)

                        Spacer()

                        if let resolvedDate = violation.resolvedDate {
                            Text(resolvedDate)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    if let resolvedBy = violation.resolvedBy {
                        Text("By: \(resolvedBy)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let notes = violation.resolutionNotes {
                        Text(notes)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top, 4)
                    }
                }
            }
        }
        .padding()
        .background(violation.isResolved ? Color(.secondarySystemBackground) : Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(violation.severity.color).opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Detail Row
struct DetailRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 16)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 70, alignment: .leading)

            Text(value)
                .font(.caption)
                .foregroundColor(.primary)

            Spacer()
        }
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    var color: Color = .blue
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : color)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : color.opacity(0.1))
                .cornerRadius(16)
        }
    }
}

// MARK: - Resolve Violation Sheet
struct ResolveViolationSheet: View {
    let violation: Violation
    @ObservedObject var viewModel: ComplianceDashboardViewModel
    @Binding var isPresented: Bool
    @State private var resolvedBy = ""
    @State private var resolutionNotes = ""

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Violation Details")) {
                    LabeledContent("Type", value: violation.type.displayName)
                    LabeledContent("Entity", value: violation.entityName)
                    LabeledContent("Date", value: violation.formattedViolationDate)
                    LabeledContent("Severity", value: violation.severity.displayName)

                    if let fine = violation.fineAmount {
                        LabeledContent("Fine", value: violation.formattedFineAmount)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Description")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(violation.description)
                            .font(.body)
                    }
                }

                if !violation.isResolved {
                    Section(header: Text("Resolution")) {
                        TextField("Resolved By", text: $resolvedBy)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Resolution Notes")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            TextEditor(text: $resolutionNotes)
                                .frame(height: 100)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                    }
                } else {
                    Section(header: Text("Resolution Details")) {
                        if let resolvedDate = violation.resolvedDate {
                            LabeledContent("Resolved Date", value: resolvedDate)
                        }

                        if let resolvedBy = violation.resolvedBy {
                            LabeledContent("Resolved By", value: resolvedBy)
                        }

                        if let notes = violation.resolutionNotes {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Notes")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(notes)
                                    .font(.body)
                            }
                        }
                    }
                }
            }
            .navigationTitle(violation.isResolved ? "Violation Details" : "Resolve Violation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }

                if !violation.isResolved {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Resolve") {
                            Task {
                                await viewModel.resolveViolation(
                                    violation,
                                    resolvedBy: resolvedBy,
                                    notes: resolutionNotes
                                )
                                isPresented = false
                            }
                        }
                        .disabled(resolvedBy.isEmpty)
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        ViolationsListView(viewModel: ComplianceDashboardViewModel())
    }
}
