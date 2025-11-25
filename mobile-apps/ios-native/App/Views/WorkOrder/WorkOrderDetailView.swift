//
//  WorkOrderDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Work Order Detail with status workflow, parts, and notes
//

import SwiftUI

struct WorkOrderDetailView: View {
    let workOrder: WorkOrder
    @ObservedObject var viewModel: WorkOrderViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showingAssignTech = false
    @State private var showingAddPart = false
    @State private var showingAddNote = false
    @State private var newNoteText = ""
    @State private var hoursWorked = ""
    @State private var showingComplete = false
    @State private var completeMileage = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerSection

                    // Status and Actions
                    statusActionsSection

                    // Details Grid
                    detailsGrid

                    // Parts List
                    if !workOrder.parts.isEmpty {
                        partsSection
                    }

                    // Cost Summary
                    costSummary

                    // Notes
                    notesSection
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Work Order Details")
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

    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: workOrder.type.icon)
                .font(.system(size: 50))
                .foregroundColor(.blue)

            Text(workOrder.woNumber)
                .font(.title.bold())

            Text(workOrder.description)
                .font(.headline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            HStack(spacing: 12) {
                WorkOrderStatusBadge(status: workOrder.status)
                WorkOrderPriorityBadge(priority: workOrder.priority)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Status Actions
    private var statusActionsSection: some View {
        VStack(spacing: 12) {
            if workOrder.status == .open {
                Button(action: { showingAssignTech = true }) {
                    Label("Assign to Technician", systemImage: "person.badge.plus")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }

            if workOrder.status == .assigned || workOrder.status == .onHold {
                Button(action: { viewModel.startWork(workOrder) }) {
                    Label("Start Work", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }

            if workOrder.status == .inProgress {
                HStack(spacing: 12) {
                    Button(action: { showingComplete = true }) {
                        Label("Complete", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    Button(action: { viewModel.markAwaitingParts(workOrder) }) {
                        Label("Parts", systemImage: "box.truck")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
            }
        }
        .alert("Complete Work Order", isPresented: $showingComplete) {
            TextField("Final Mileage", text: $completeMileage)
                .keyboardType(.numberPad)
            Button("Complete") {
                let mileage = Double(completeMileage)
                viewModel.completeWorkOrder(workOrder, mileageAtComplete: mileage)
                dismiss()
            }
            Button("Cancel", role: .cancel) { }
        }
        .sheet(isPresented: $showingAssignTech) {
            TechnicianPickerView(workOrder: workOrder, viewModel: viewModel)
        }
    }

    // MARK: - Details Grid
    private var detailsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            DetailInfoCard(title: "Vehicle", value: "\(workOrder.vehicleNumber ?? "N/A")", icon: "car.fill")
            DetailInfoCard(title: "Type", value: workOrder.type.rawValue, icon: workOrder.type.icon)

            if let tech = workOrder.assignedTechName {
                DetailInfoCard(title: "Technician", value: tech, icon: "person.fill")
            }

            if let created = workOrder.createdDate as Date? {
                DetailInfoCard(title: "Created", value: created.formatted(date: .abbreviated, time: .omitted), icon: "calendar")
            }

            if let due = workOrder.dueDate {
                DetailInfoCard(title: "Due Date", value: due.formatted(date: .abbreviated, time: .omitted), icon: "flag.fill")
            }

            if workOrder.hoursWorked > 0 {
                DetailInfoCard(title: "Hours", value: String(format: "%.1f", workOrder.hoursWorked), icon: "clock.fill")
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Parts Section
    private var partsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Parts")
                    .font(.headline)
                Spacer()
                if workOrder.status != .completed && workOrder.status != .cancelled {
                    Button(action: { showingAddPart = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.blue)
                    }
                }
            }

            ForEach(workOrder.parts) { part in
                PartRow(part: part)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Cost Summary
    private var costSummary: some View {
        VStack(spacing: 12) {
            Text("Cost Summary")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack {
                Text("Parts:")
                Spacer()
                Text(formatCurrency(workOrder.totalPartsCost))
            }

            HStack {
                Text("Labor (\(String(format: "%.1f", workOrder.hoursWorked))h @ $\(String(format: "%.0f", workOrder.laborRate))/h):")
                Spacer()
                Text(formatCurrency(workOrder.totalLaborCost))
            }

            Divider()

            HStack {
                Text("Total:")
                    .font(.headline)
                Spacer()
                Text(workOrder.formattedTotalCost)
                    .font(.headline)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Notes Section
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Notes & Updates")
                    .font(.headline)
                Spacer()
                if workOrder.status != .completed && workOrder.status != .cancelled {
                    Button(action: { showingAddNote = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.blue)
                    }
                }
            }

            if workOrder.notes.isEmpty {
                Text("No notes yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(workOrder.notes.sorted(by: { $0.timestamp > $1.timestamp })) { note in
                    NoteRow(note: note)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .sheet(isPresented: $showingAddNote) {
            AddNoteView(workOrder: workOrder, viewModel: viewModel)
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Supporting Views
struct DetailInfoCard: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(.blue)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Text(value)
                .font(.subheadline.bold())
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

struct PartRow: View {
    let part: WorkOrderPart

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(part.name)
                    .font(.subheadline.bold())
                Spacer()
                Text(part.formattedTotalCost)
                    .font(.subheadline.bold())
                    .foregroundColor(.blue)
            }

            HStack {
                Text("Part #\(part.partNumber)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("Qty: \(part.quantity) @ \(part.formattedUnitCost)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

struct NoteRow: View {
    let note: WorkOrderNote

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(note.author)
                    .font(.caption.bold())
                    .foregroundColor(note.isSystemNote ? .blue : .primary)
                Spacer()
                Text(note.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(note.text)
                .font(.subheadline)
                .foregroundColor(.primary)
        }
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

struct TechnicianPickerView: View {
    let workOrder: WorkOrder
    @ObservedObject var viewModel: WorkOrderViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTechId: String?

    var body: some View {
        NavigationView {
            List(viewModel.technicians) { tech in
                Button(action: {
                    viewModel.assignToTechnician(workOrder, techId: tech.id)
                    dismiss()
                }) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(tech.name)
                                .font(.headline)
                            Text(tech.specialization.joined(separator: ", "))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        if !tech.isAvailable {
                            Text("Busy")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }
            }
            .navigationTitle("Assign Technician")
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

struct AddNoteView: View {
    let workOrder: WorkOrder
    @ObservedObject var viewModel: WorkOrderViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var noteText = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Add Note") {
                    TextEditor(text: $noteText)
                        .frame(minHeight: 100)
                }

                Section {
                    Button(action: {
                        if !noteText.isEmpty {
                            viewModel.addNote(to: workOrder, text: noteText)
                            dismiss()
                        }
                    }) {
                        Label("Add Note", systemImage: "plus")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.blue)
                    .disabled(noteText.isEmpty)
                }
            }
            .navigationTitle("Add Note")
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
}
