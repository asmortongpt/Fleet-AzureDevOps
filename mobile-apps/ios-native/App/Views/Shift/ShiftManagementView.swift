import SwiftUI

struct ShiftManagementView: View {
    @StateObject private var viewModel = ShiftManagementViewModel()
    @State private var showingCreateShift = false
    @State private var showingClockInOut = false
    @State private var showingSwapRequests = false
    @State private var showingReport = false
    @State private var selectedShift: Shift?

    var body: some View {
        NavigationView {
            ZStack {
                VStack(spacing: 0) {
                    // Current Shift Status Banner
                    if let currentShift = viewModel.currentShift {
                        CurrentShiftBanner(shift: currentShift, onClockOut: {
                            showingClockInOut = true
                        })
                    }

                    // View Mode Picker
                    Picker("View Mode", selection: $viewModel.calendarViewMode) {
                        ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                            Label(mode.rawValue, systemImage: mode.icon)
                                .tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding()

                    // Calendar View
                    ScrollView {
                        VStack(spacing: 20) {
                            // Date Selector
                            DateNavigator(
                                selectedDate: $viewModel.selectedDate,
                                viewMode: viewModel.calendarViewMode,
                                onDateChanged: { date in
                                    Task {
                                        await viewModel.loadShifts()
                                    }
                                }
                            )

                            // Shifts List
                            shiftsListSection

                            // Quick Actions
                            quickActionsSection
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }

                // Loading Overlay
                if viewModel.loadingState.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
            .navigationTitle("Shift Management")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showingCreateShift = true
                        } label: {
                            Label("Schedule Shift", systemImage: "plus.circle")
                        }

                        Button {
                            showingClockInOut = true
                        } label: {
                            Label("Clock In/Out", systemImage: "clock")
                        }

                        Button {
                            showingSwapRequests = true
                        } label: {
                            Label("Swap Requests", systemImage: "arrow.left.arrow.right.circle")
                        }
                        .badge(viewModel.shiftSwapRequests.count)

                        Button {
                            showingReport = true
                        } label: {
                            Label("Generate Report", systemImage: "doc.text")
                        }

                        Divider()

                        Button {
                            Task {
                                await viewModel.refresh()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingCreateShift) {
                CreateShiftView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingClockInOut) {
                ClockInOutView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingSwapRequests) {
                ShiftSwapView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingReport) {
                ShiftReportView(viewModel: viewModel)
            }
            .sheet(item: $selectedShift) { shift in
                ShiftDetailView(shift: shift, viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
            .alert("Error", isPresented: .constant(viewModel.loadingState.hasError)) {
                Button("OK") {
                    viewModel.resetError()
                }
            } message: {
                if case .error(let message) = viewModel.loadingState {
                    Text(message)
                }
            }
        }
    }

    // MARK: - Shifts List Section
    private var shiftsListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Shifts")
                    .font(.headline)

                Spacer()

                Text("\(shiftsForCurrentView.count) shifts")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if shiftsForCurrentView.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)

                    Text("No shifts scheduled")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    Text("Tap + to create a new shift")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(shiftsForCurrentView) { shift in
                        ShiftCard(shift: shift)
                            .onTapGesture {
                                selectedShift = shift
                            }
                            .contextMenu {
                                Button {
                                    selectedShift = shift
                                } label: {
                                    Label("View Details", systemImage: "eye")
                                }

                                if shift.status == .scheduled {
                                    Button {
                                        // Edit shift
                                    } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }

                                    Button(role: .destructive) {
                                        Task {
                                            try? await viewModel.deleteShift(shift)
                                        }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                    }
                }
            }
        }
    }

    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionButton(
                    title: "Clock In",
                    icon: "arrow.right.circle.fill",
                    color: .green
                ) {
                    showingClockInOut = true
                }
                .disabled(viewModel.currentShift != nil)

                QuickActionButton(
                    title: "Clock Out",
                    icon: "arrow.left.circle.fill",
                    color: .red
                ) {
                    showingClockInOut = true
                }
                .disabled(viewModel.currentShift == nil)

                QuickActionButton(
                    title: "Take Break",
                    icon: "pause.circle.fill",
                    color: .orange
                ) {
                    Task {
                        try? await viewModel.startBreak(type: .rest, isPaid: true)
                    }
                }
                .disabled(viewModel.currentShift?.status != .started)

                QuickActionButton(
                    title: "Reports",
                    icon: "chart.bar.fill",
                    color: .blue
                ) {
                    showingReport = true
                }
            }
        }
    }

    // MARK: - Computed Properties
    private var shiftsForCurrentView: [Shift] {
        switch viewModel.calendarViewMode {
        case .day:
            return viewModel.shiftsForDate(viewModel.selectedDate)
        case .week:
            return viewModel.shiftsForWeek(containing: viewModel.selectedDate)
        case .month:
            return viewModel.shiftsForMonth(containing: viewModel.selectedDate)
        }
    }
}

// MARK: - Current Shift Banner
struct CurrentShiftBanner: View {
    let shift: Shift
    let onClockOut: () -> Void

    @State private var currentTime = Date()
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Active Shift")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))

                    HStack {
                        Image(systemName: shift.status.icon)
                        Text(shift.status.displayName)
                            .font(.headline)
                    }
                    .foregroundColor(.white)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Duration")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))

                    Text(elapsedTime)
                        .font(.system(.title3, design: .monospaced))
                        .bold()
                        .foregroundColor(.white)
                }
            }

            HStack(spacing: 12) {
                if let vehicleName = shift.vehicleName {
                    Label(vehicleName, systemImage: "car.fill")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.9))
                }

                Spacer()

                Button {
                    onClockOut()
                } label: {
                    Text("Clock Out")
                        .font(.caption)
                        .bold()
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(8)
                }
                .foregroundColor(.white)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.green, Color.green.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .onReceive(timer) { _ in
            currentTime = Date()
        }
    }

    private var elapsedTime: String {
        let elapsed = currentTime.timeIntervalSince(shift.startTime) - shift.totalBreakTime
        let hours = Int(elapsed / 3600)
        let minutes = Int((elapsed.truncatingRemainder(dividingBy: 3600)) / 60)
        let seconds = Int(elapsed.truncatingRemainder(dividingBy: 60))
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}

// MARK: - Date Navigator
struct DateNavigator: View {
    @Binding var selectedDate: Date
    let viewMode: CalendarViewMode
    let onDateChanged: (Date) -> Void

    var body: some View {
        HStack {
            Button {
                adjustDate(by: -1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3)
            }

            Spacer()

            VStack(spacing: 4) {
                Text(dateTitle)
                    .font(.headline)

                Text(dateSubtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button {
                adjustDate(by: 1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title3)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var dateTitle: String {
        let formatter = DateFormatter()
        switch viewMode {
        case .day:
            formatter.dateFormat = "EEEE, MMM d"
        case .week:
            formatter.dateFormat = "MMM d"
            let calendar = Calendar.current
            guard let weekInterval = calendar.dateInterval(of: .weekOfYear, for: selectedDate) else {
                return formatter.string(from: selectedDate)
            }
            let start = formatter.string(from: weekInterval.start)
            let end = formatter.string(from: weekInterval.end)
            return "\(start) - \(end)"
        case .month:
            formatter.dateFormat = "MMMM yyyy"
        }
        return formatter.string(from: selectedDate)
    }

    private var dateSubtitle: String {
        switch viewMode {
        case .day:
            return "Today"
        case .week:
            return "This Week"
        case .month:
            return "This Month"
        }
    }

    private func adjustDate(by value: Int) {
        let calendar = Calendar.current
        let component: Calendar.Component = {
            switch viewMode {
            case .day: return .day
            case .week: return .weekOfYear
            case .month: return .month
            }
        }()

        if let newDate = calendar.date(byAdding: component, value: value, to: selectedDate) {
            selectedDate = newDate
            onDateChanged(newDate)
        }
    }
}

// MARK: - Shift Card
struct ShiftCard: View {
    let shift: Shift

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Status indicator
                Circle()
                    .fill(shift.statusColor)
                    .frame(width: 12, height: 12)

                VStack(alignment: .leading, spacing: 2) {
                    if let driverName = shift.driverName {
                        Text(driverName)
                            .font(.headline)
                    }

                    if let vehicleName = shift.vehicleName {
                        Text(vehicleName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(shift.status.displayName)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(shift.statusColor.opacity(0.2))
                        .foregroundColor(shift.statusColor)
                        .cornerRadius(8)

                    if shift.isActive {
                        Text("Active")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }

            Divider()

            HStack {
                Label(timeFormatter.string(from: shift.startTime), systemImage: "clock")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Image(systemName: "arrow.right")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                if let endTime = shift.endTime {
                    Label(timeFormatter.string(from: endTime), systemImage: "clock.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("In Progress")
                        .font(.caption)
                        .foregroundColor(.orange)
                }

                Spacer()

                if let workingHours = shift.workingHours {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(shift.formattedWorkingHours)
                            .font(.caption)
                            .bold()

                        if shift.overtimeHours > 0 {
                            Text("+\(String(format: "%.1f", shift.overtimeHours))h OT")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                    }
                }
            }

            if !shift.breakEntries.isEmpty {
                HStack {
                    Image(systemName: "pause.circle.fill")
                        .font(.caption2)
                        .foregroundColor(.orange)

                    Text("\(shift.breakEntries.count) break(s)")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(formatDuration(shift.totalBreakTime))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }()

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)

                Text(title)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
        }
    }
}

// MARK: - Shift Detail View
struct ShiftDetailView: View {
    let shift: Shift
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: shift.status.icon)
                                .font(.title)
                                .foregroundColor(shift.statusColor)

                            VStack(alignment: .leading) {
                                if let driverName = shift.driverName {
                                    Text(driverName)
                                        .font(.headline)
                                }
                                Text(shift.status.displayName)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()
                        }

                        Divider()

                        if let vehicleName = shift.vehicleName {
                            HStack {
                                Label("Vehicle", systemImage: "car.fill")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                Spacer()

                                Text(vehicleName)
                                    .font(.caption)
                                    .bold()
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Time Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Time Details")
                            .font(.headline)

                        InfoRow(label: "Start Time", value: dateFormatter.string(from: shift.startTime))

                        if let endTime = shift.endTime {
                            InfoRow(label: "End Time", value: dateFormatter.string(from: endTime))
                            InfoRow(label: "Duration", value: shift.formattedDuration)
                            InfoRow(label: "Working Hours", value: shift.formattedWorkingHours)
                        } else {
                            InfoRow(label: "Status", value: "In Progress")
                        }

                        if shift.overtimeHours > 0 {
                            InfoRow(
                                label: "Overtime",
                                value: String(format: "%.1f hours", shift.overtimeHours),
                                color: .orange
                            )
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.1), radius: 5)

                    // Break Entries
                    if !shift.breakEntries.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Breaks")
                                .font(.headline)

                            ForEach(shift.breakEntries) { breakEntry in
                                BreakEntryRow(breakEntry: breakEntry)
                            }

                            HStack {
                                Text("Total Break Time")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                Spacer()

                                Text(formatDuration(shift.totalBreakTime))
                                    .font(.caption)
                                    .bold()
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.1), radius: 5)
                    }

                    // Notes
                    if let notes = shift.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)

                            Text(notes)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.1), radius: 5)
                    }
                }
                .padding()
            }
            .navigationTitle("Shift Details")
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

    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)
        return "\(hours)h \(minutes)m"
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String
    var color: Color = .primary

    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .bold()
                .foregroundColor(color)
        }
    }
}

// MARK: - Break Entry Row
struct BreakEntryRow: View {
    let breakEntry: BreakEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(breakEntry.type.displayName)
                    .font(.caption)
                    .bold()

                Text(timeFormatter.string(from: breakEntry.startTime))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(breakEntry.formattedDuration)
                    .font(.caption)
                    .bold()

                Text(breakEntry.isPaid ? "Paid" : "Unpaid")
                    .font(.caption2)
                    .foregroundColor(breakEntry.isPaid ? .green : .orange)
            }
        }
        .padding(.vertical, 4)
    }

    private let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }()
}

// MARK: - Preview
struct ShiftManagementView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftManagementView()
    }
}
