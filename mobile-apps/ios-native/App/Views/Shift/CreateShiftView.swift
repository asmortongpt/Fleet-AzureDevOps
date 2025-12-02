import SwiftUI

struct CreateShiftView: View {
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedDriverId: String = ""
    @State private var selectedVehicleId: String = ""
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Date().addingTimeInterval(3600 * 8)
    @State private var notes: String = ""
    @State private var useTemplate: Bool = false
    @State private var selectedTemplateId: String?
    @State private var showingError = false
    @State private var errorMessage = ""

    // Sample data - in real app, this would come from your API
    @State private var drivers: [(id: String, name: String)] = [
        ("driver-1", "John Smith"),
        ("driver-2", "Jane Doe"),
        ("driver-3", "Bob Johnson")
    ]

    @State private var vehicles: [(id: String, name: String)] = [
        ("vehicle-1", "Truck #42"),
        ("vehicle-2", "Van #15"),
        ("vehicle-3", "Sedan #8")
    ]

    var body: some View {
        NavigationView {
            Form {
                // Template Section
                Section(header: Text("Shift Template")) {
                    Toggle("Use Template", isOn: $useTemplate)

                    if useTemplate {
                        Picker("Template", selection: $selectedTemplateId) {
                            Text("Select Template").tag(nil as String?)
                            ForEach(viewModel.shiftTemplates) { template in
                                Text(template.name).tag(template.id as String?)
                            }
                        }

                        if let templateId = selectedTemplateId,
                           let template = viewModel.shiftTemplates.first(where: { $0.id == templateId }) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Time Range")
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    Spacer()

                                    Text(template.formattedTimeRange)
                                        .font(.caption)
                                        .bold()
                                }

                                HStack {
                                    Text("Duration")
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    Spacer()

                                    Text("\(String(format: "%.1f", template.durationHours)) hours")
                                        .font(.caption)
                                        .bold()
                                }
                            }
                            .padding(.vertical, 4)

                            Button("Apply Template") {
                                applyTemplate(template)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                }

                // Driver and Vehicle Section
                Section(header: Text("Assignment")) {
                    Picker("Driver", selection: $selectedDriverId) {
                        Text("Select Driver").tag("")
                        ForEach(drivers, id: \.id) { driver in
                            Text(driver.name).tag(driver.id)
                        }
                    }

                    Picker("Vehicle", selection: $selectedVehicleId) {
                        Text("Select Vehicle").tag("")
                        ForEach(vehicles, id: \.id) { vehicle in
                            Text(vehicle.name).tag(vehicle.id)
                        }
                    }
                }

                // Time Section
                Section(header: Text("Schedule")) {
                    DatePicker("Start Time", selection: $startDate, displayedComponents: [.date, .hourAndMinute])

                    DatePicker("End Time", selection: $endDate, displayedComponents: [.date, .hourAndMinute])

                    // Duration Display
                    HStack {
                        Text("Duration")
                            .foregroundColor(.secondary)

                        Spacer()

                        Text(durationText)
                            .bold()
                    }

                    // Overtime Warning
                    if durationHours > 8.0 {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("Overtime: \(String(format: "%.1f", durationHours - 8.0)) hours")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }

                // Notes Section
                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(height: 100)
                }

                // Validation Section
                Section {
                    if !validationErrors.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(validationErrors, id: \.self) { error in
                                HStack {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                    Text(error)
                                        .font(.caption)
                                        .foregroundColor(.red)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Schedule Shift")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        createShift()
                    }
                    .disabled(!isValid)
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Computed Properties
    private var durationHours: Double {
        endDate.timeIntervalSince(startDate) / 3600
    }

    private var durationText: String {
        let hours = Int(durationHours)
        let minutes = Int((durationHours - Double(hours)) * 60)
        return "\(hours)h \(minutes)m"
    }

    private var isValid: Bool {
        validationErrors.isEmpty
    }

    private var validationErrors: [String] {
        var errors: [String] = []

        if selectedDriverId.isEmpty {
            errors.append("Please select a driver")
        }

        if selectedVehicleId.isEmpty {
            errors.append("Please select a vehicle")
        }

        if endDate <= startDate {
            errors.append("End time must be after start time")
        }

        if durationHours > 24 {
            errors.append("Shift duration cannot exceed 24 hours")
        }

        return errors
    }

    // MARK: - Actions
    private func applyTemplate(_ template: ShiftTemplate) {
        let calendar = Calendar.current

        // Get time components from template
        let startTimeComponents = calendar.dateComponents([.hour, .minute], from: template.startTime)
        let endTimeComponents = calendar.dateComponents([.hour, .minute], from: template.endTime)

        // Apply to current date
        if let startHour = startTimeComponents.hour,
           let startMinute = startTimeComponents.minute,
           let endHour = endTimeComponents.hour,
           let endMinute = endTimeComponents.minute {

            startDate = calendar.date(bySettingHour: startHour, minute: startMinute, second: 0, of: startDate) ?? startDate
            endDate = calendar.date(bySettingHour: endHour, minute: endMinute, second: 0, of: startDate) ?? endDate

            // If end time is before start time, add a day
            if endDate < startDate {
                endDate = calendar.date(byAdding: .day, value: 1, to: endDate) ?? endDate
            }
        }
    }

    private func createShift() {
        Task {
            do {
                try await viewModel.createShift(
                    driverId: selectedDriverId,
                    vehicleId: selectedVehicleId,
                    startTime: startDate,
                    endTime: endDate,
                    notes: notes.isEmpty ? nil : notes
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Preview
struct CreateShiftView_Previews: PreviewProvider {
    static var previews: some View {
        CreateShiftView(viewModel: ShiftManagementViewModel())
    }
}
