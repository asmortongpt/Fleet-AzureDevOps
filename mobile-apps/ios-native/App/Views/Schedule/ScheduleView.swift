import SwiftUI

struct ScheduleView: View {
    @StateObject private var viewModel = ScheduleViewModel()
    @State private var showingAddSchedule = false
    @State private var showingFilters = false
    @State private var selectedSchedule: ScheduleEntry?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // View mode picker
                viewModePicker

                // Date navigation bar
                dateNavigationBar

                // Statistics summary (if available)
                if let stats = viewModel.statistics {
                    statisticsSummary(stats)
                }

                // Conflict alerts
                if !viewModel.conflicts.isEmpty {
                    conflictBanner
                }

                // Main content based on view mode
                if viewModel.isLoading {
                    ProgressView("Loading schedules...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    ErrorView(message: error) {
                        Task {
                            await viewModel.loadSchedules()
                        }
                    }
                } else {
                    scheduleContent
                }
            }
            .navigationTitle("Schedule")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        viewModel.navigateToToday()
                        Task {
                            await viewModel.loadSchedules()
                        }
                    } label: {
                        Text("Today")
                            .fontWeight(.medium)
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            showingFilters = true
                        } label: {
                            Image(systemName: viewModel.filter.types.isEmpty ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                        }

                        Button {
                            showingAddSchedule = true
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.title2)
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAddSchedule) {
                AddScheduleView(viewModel: viewModel)
            }
            .sheet(item: $selectedSchedule) { schedule in
                ScheduleDetailView(schedule: schedule, viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                ScheduleFilterView(filter: $viewModel.filter)
            }
            .task {
                await viewModel.loadSchedules()
            }
            .onChange(of: viewModel.selectedDate) { _ in
                Task {
                    await viewModel.loadSchedules()
                }
            }
            .onChange(of: viewModel.viewMode) { _ in
                Task {
                    await viewModel.loadSchedules()
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - View Components

    private var viewModePicker: some View {
        Picker("View Mode", selection: $viewModel.viewMode) {
            ForEach(ScheduleViewModel.ViewMode.allCases, id: \.self) { mode in
                Label(mode.rawValue, systemImage: mode.icon)
                    .tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .padding()
    }

    private var dateNavigationBar: some View {
        HStack {
            Button(action: {
                viewModel.navigateToPreviousPeriod()
            }) {
                Image(systemName: "chevron.left.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }

            Spacer()

            Text(viewModel.formattedDateRange())
                .font(.headline)
                .fontWeight(.semibold)

            Spacer()

            Button(action: {
                viewModel.navigateToNextPeriod()
            }) {
                Image(systemName: "chevron.right.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGroupedBackground))
    }

    private func statisticsSummary(_ stats: ScheduleStatistics) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                StatCard(title: "Total", value: "\(stats.totalScheduled)", color: .blue)
                StatCard(title: "Upcoming", value: "\(stats.upcoming)", color: .green)
                StatCard(title: "In Progress", value: "\(stats.inProgress)", color: .orange)
                StatCard(title: "Completed", value: "\(stats.completed)", color: .gray)
                if stats.overdue > 0 {
                    StatCard(title: "Overdue", value: "\(stats.overdue)", color: .red)
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    private var conflictBanner: some View {
        VStack(spacing: 4) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("\(viewModel.conflicts.count) scheduling conflict\(viewModel.conflicts.count > 1 ? "s" : "")")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Button("Review") {
                    // Show conflicts sheet
                }
                .font(.caption)
                .fontWeight(.semibold)
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color.orange.opacity(0.1))
        .border(Color.orange.opacity(0.3), width: 1)
    }

    @ViewBuilder
    private var scheduleContent: some View {
        switch viewModel.viewMode {
        case .day:
            DayScheduleView(viewModel: viewModel, onScheduleTap: { schedule in
                selectedSchedule = schedule
            })
        case .week:
            WeekScheduleView(viewModel: viewModel, onScheduleTap: { schedule in
                selectedSchedule = schedule
            })
        case .month:
            MonthScheduleView(viewModel: viewModel, onScheduleTap: { schedule in
                selectedSchedule = schedule
            })
        case .agenda:
            AgendaScheduleView(viewModel: viewModel, onScheduleTap: { schedule in
                selectedSchedule = schedule
            })
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(minWidth: 80)
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Error View

struct ErrorView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)

            Text("Error Loading Schedules")
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: retry) {
                Label("Retry", systemImage: "arrow.clockwise")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
}

// MARK: - Preview

struct ScheduleView_Previews: PreviewProvider {
    static var previews: some View {
        ScheduleView()
    }
}
