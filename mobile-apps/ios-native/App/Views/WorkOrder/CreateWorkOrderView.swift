//
//  CreateWorkOrderView.swift
//  Fleet Manager - iOS Native App
//
//  Create Work Order Form with validation
//

import SwiftUI

struct CreateWorkOrderView: View {
    @ObservedObject var viewModel: WorkOrderViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedVehicleId = ""
    @State private var workOrderType: WorkOrderType = .repair
    @State private var priority: WorkOrderPriority = .normal
    @State private var description = ""
    @State private var selectedTechId: String? = nil
    @State private var scheduledDate: Date? = nil
    @State private var dueDate: Date? = nil
    @State private var useScheduledDate = false
    @State private var useDueDate = true

    var body: some View {
        NavigationView {
            Form {
                Section("Vehicle") {
                    Picker("Select Vehicle", selection: $selectedVehicleId) {
                        Text("Choose a vehicle").tag("")
                        ForEach(viewModel.vehicles) { vehicle in
                            Text("\(vehicle.number) - \(vehicle.make) \(vehicle.model)")
                                .tag(vehicle.id)
                        }
                    }
                }

                Section("Work Details") {
                    Picker("Type", selection: $workOrderType) {
                        ForEach(WorkOrderType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.icon)
                                Text(type.rawValue)
                            }
                            .tag(type)
                        }
                    }

                    Picker("Priority", selection: $priority) {
                        ForEach(WorkOrderPriority.allCases, id: \.self) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }

                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                        .overlay(
                            Group {
                                if description.isEmpty {
                                    Text("Describe the work to be done...")
                                        .foregroundColor(.secondary)
                                        .padding(.top, 8)
                                        .padding(.leading, 5)
                                        .allowsHitTesting(false)
                                }
                            },
                            alignment: .topLeading
                        )
                }

                Section("Assignment") {
                    Picker("Assign to Technician (Optional)", selection: $selectedTechId) {
                        Text("Unassigned").tag(nil as String?)
                        ForEach(viewModel.technicians.filter { $0.isAvailable }) { tech in
                            Text(tech.name).tag(tech.id as String?)
                        }
                    }
                }

                Section("Schedule") {
                    Toggle("Schedule Work", isOn: $useScheduledDate)

                    if useScheduledDate {
                        DatePicker("Scheduled Date", selection: Binding(
                            get: { scheduledDate ?? Date() },
                            set: { scheduledDate = $0 }
                        ), displayedComponents: [.date, .hourAndMinute])
                    }

                    Toggle("Set Due Date", isOn: $useDueDate)

                    if useDueDate {
                        DatePicker("Due Date", selection: Binding(
                            get: { dueDate ?? Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date() },
                            set: { dueDate = $0 }
                        ), displayedComponents: [.date])
                    }
                }

                Section {
                    Button(action: createWorkOrder) {
                        Label("Create Work Order", systemImage: "plus.circle.fill")
                            .frame(maxWidth: .infinity)
                            .foregroundColor(.white)
                    }
                    .listRowBackground(Color.blue)
                    .disabled(!isValid)
                }
            }
            .navigationTitle("Create Work Order")
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

    private var isValid: Bool {
        !selectedVehicleId.isEmpty && !description.isEmpty
    }

    private func createWorkOrder() {
        viewModel.createWorkOrder(
            vehicleId: selectedVehicleId,
            type: workOrderType,
            priority: priority,
            description: description,
            assignedTechId: selectedTechId,
            scheduledDate: useScheduledDate ? scheduledDate : nil,
            dueDate: useDueDate ? (dueDate ?? Calendar.current.date(byAdding: .day, value: 7, to: Date())) : nil
        )
        dismiss()
    }
}

#Preview {
    CreateWorkOrderView(viewModel: WorkOrderViewModel())
}
