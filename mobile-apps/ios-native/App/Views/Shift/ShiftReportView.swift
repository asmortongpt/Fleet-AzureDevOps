import SwiftUI

struct ShiftReportView: View {
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var startDate: Date = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
    @State private var endDate: Date = Date()
    @State private var selectedDriverId: String = ""
    @State private var selectedVehicleId: String = ""
    @State private var isGenerating = false
    @State private var showingError = false
    @State private var errorMessage = ""

    // Sample data
    @State private var drivers: [(id: String, name: String)] = [
        ("all", "All Drivers"),
        ("driver-1", "John Smith"),
        ("driver-2", "Jane Doe"),
        ("driver-3", "Bob Johnson")
    ]

    @State private var vehicles: [(id: String, name: String)] = [
        ("all", "All Vehicles"),
        ("vehicle-1", "Truck #42"),
        ("vehicle-2", "Van #15"),
        ("vehicle-3", "Sedan #8")
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Report Parameters
                    reportParametersSection

                    // Generate Button
                    Button {
                        generateReport()
                    } label: {
                        HStack {
                            if isGenerating {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "doc.text.fill")
                                Text("Generate Report")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isGenerating || !isValidDateRange)

                    if !isValidDateRange {
                        Text("End date must be after start date")
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    // Report Display
                    if let report = viewModel.shiftReport {
                        reportDisplaySection(report)
                    }
                }
                .padding()
            }
            .navigationTitle("Shift Reports")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }

                if viewModel.shiftReport != nil {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Menu {
                            Button {
                                exportToCSV()
                            } label: {
                                Label("Export to CSV", systemImage: "doc.text")
                            }

                            Button {
                                exportToPDF()
                            } label: {
                                Label("Export to PDF", systemImage: "doc.richtext")
                            }

                            Button {
                                shareReport()
                            } label: {
                                Label("Share Report", systemImage: "square.and.arrow.up")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // MARK: - Report Parameters Section
    private var reportParametersSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Report Parameters")
                .font(.headline)

            VStack(spacing: 12) {
                // Date Range
                VStack(alignment: .leading, spacing: 8) {
                    Text("Date Range")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                }

                Divider()

                // Driver Filter
                VStack(alignment: .leading, spacing: 8) {
                    Text("Driver")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Picker("Driver", selection: $selectedDriverId) {
                        ForEach(drivers, id: \.id) { driver in
                            Text(driver.name).tag(driver.id)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Divider()

                // Vehicle Filter
                VStack(alignment: .leading, spacing: 8) {
                    Text("Vehicle")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Picker("Vehicle", selection: $selectedVehicleId) {
                        ForEach(vehicles, id: \.id) { vehicle in
                            Text(vehicle.name).tag(vehicle.id)
                        }
                    }
                    .pickerStyle(.menu)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5)
        }
    }

    // MARK: - Report Display Section
    private func reportDisplaySection(_ report: ShiftReport) -> some View {
        VStack(spacing: 20) {
            // Summary Cards
            summaryCardsSection(report)

            // Breakdown Charts
            breakdownSection(report)

            // Shifts List
            shiftsListSection(report)
        }
    }

    // MARK: - Summary Cards Section
    private func summaryCardsSection(_ report: ShiftReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Summary")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                SummaryCard(
                    title: "Total Shifts",
                    value: "\(report.totalShifts)",
                    icon: "calendar",
                    color: .blue
                )

                SummaryCard(
                    title: "Total Hours",
                    value: report.formattedTotalHours,
                    icon: "clock.fill",
                    color: .green
                )

                SummaryCard(
                    title: "Overtime",
                    value: report.formattedOvertimeHours,
                    icon: "clock.badge.exclamationmark",
                    color: .orange
                )

                SummaryCard(
                    title: "Missed Shifts",
                    value: "\(report.missedShifts)",
                    icon: "xmark.circle",
                    color: .red
                )
            }

            // Additional Stats
            VStack(spacing: 8) {
                InfoRow(label: "Regular Hours", value: String(format: "%.1f hrs", report.totalRegularHours))
                InfoRow(label: "Break Time", value: String(format: "%.1f hrs", report.totalBreakTime))
                InfoRow(label: "Average Hours/Shift", value: String(format: "%.1f hrs", report.averageHoursPerShift))
                InfoRow(label: "Overtime Percentage", value: String(format: "%.1f%%", report.overtimePercentage))
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Breakdown Section
    private func breakdownSection(_ report: ShiftReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Hours Breakdown")
                .font(.headline)

            VStack(spacing: 16) {
                // Regular vs Overtime
                HStack(spacing: 0) {
                    ZStack {
                        Rectangle()
                            .fill(Color.green)
                            .frame(width: regularHoursWidth(report))

                        if regularHoursWidth(report) > 50 {
                            Text("\(String(format: "%.0f", report.totalRegularHours))h")
                                .font(.caption)
                                .bold()
                                .foregroundColor(.white)
                        }
                    }

                    ZStack {
                        Rectangle()
                            .fill(Color.orange)
                            .frame(width: overtimeHoursWidth(report))

                        if overtimeHoursWidth(report) > 50 {
                            Text("\(String(format: "%.0f", report.totalOvertimeHours))h")
                                .font(.caption)
                                .bold()
                                .foregroundColor(.white)
                        }
                    }
                }
                .frame(height: 40)
                .cornerRadius(8)

                // Legend
                HStack(spacing: 20) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 12, height: 12)
                        Text("Regular (\(String(format: "%.1f", report.totalRegularHours))h)")
                            .font(.caption)
                    }

                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 12, height: 12)
                        Text("Overtime (\(String(format: "%.1f", report.totalOvertimeHours))h)")
                            .font(.caption)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5)
        }
    }

    // MARK: - Shifts List Section
    private func shiftsListSection(_ report: ShiftReport) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Shift Details")
                    .font(.headline)

                Spacer()

                Text("\(report.shifts.count) shifts")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if report.shifts.isEmpty {
                Text("No shifts in this period")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(report.shifts) { shift in
                        ShiftCard(shift: shift)
                    }
                }
            }
        }
    }

    // MARK: - Computed Properties
    private var isValidDateRange: Bool {
        endDate > startDate
    }

    private func regularHoursWidth(_ report: ShiftReport) -> CGFloat {
        let totalHours = report.totalHoursWorked
        guard totalHours > 0 else { return 0 }
        let percentage = report.totalRegularHours / totalHours
        return UIScreen.main.bounds.width * 0.9 * percentage
    }

    private func overtimeHoursWidth(_ report: ShiftReport) -> CGFloat {
        let totalHours = report.totalHoursWorked
        guard totalHours > 0 else { return 0 }
        let percentage = report.totalOvertimeHours / totalHours
        return UIScreen.main.bounds.width * 0.9 * percentage
    }

    // MARK: - Actions
    private func generateReport() {
        isGenerating = true

        Task {
            do {
                let driverId = selectedDriverId == "all" ? nil : selectedDriverId
                let vehicleId = selectedVehicleId == "all" ? nil : selectedVehicleId

                try await viewModel.generateShiftReport(
                    startDate: startDate,
                    endDate: endDate,
                    driverId: driverId,
                    vehicleId: vehicleId
                )
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
            isGenerating = false
        }
    }

    private func exportToCSV() {
        // Implementation for CSV export
        print("Exporting to CSV...")
    }

    private func exportToPDF() {
        // Implementation for PDF export
        print("Exporting to PDF...")
    }

    private func shareReport() {
        // Implementation for sharing report
        print("Sharing report...")
    }
}

// MARK: - Summary Card
struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            VStack(spacing: 4) {
                Text(value)
                    .font(.title3)
                    .bold()

                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Preview
struct ShiftReportView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftReportView(viewModel: ShiftManagementViewModel())
    }
}
