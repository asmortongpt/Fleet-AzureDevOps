//
//  MaintenanceSchedulerView.swift
//  Fleet Manager
//
//  Optimized maintenance scheduling based on predictions
//

import SwiftUI

struct MaintenanceSchedulerView: View {
    let recommendations: [MaintenanceRecommendation]

    @State private var scheduledRecommendations: [MaintenanceRecommendation] = []
    @State private var selectedDate: Date = Date()
    @State private var selectedRecommendation: MaintenanceRecommendation?
    @State private var showScheduleSheet = false
    @State private var calendarView = false
    @State private var filterPriority: RiskLevel?

    private var filteredRecommendations: [MaintenanceRecommendation] {
        var filtered = recommendations

        if let priority = filterPriority {
            filtered = filtered.filter { $0.priority == priority }
        }

        return filtered.sorted { $0.priority.priority > $1.priority.priority }
    }

    private var unscheduledCount: Int {
        recommendations.filter { !$0.isScheduled }.count
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header Stats
            headerStats

            // Toggle View Mode
            Picker("View Mode", selection: $calendarView) {
                Text("List").tag(false)
                Text("Calendar").tag(true)
            }
            .pickerStyle(.segmented)
            .padding()

            if calendarView {
                calendarViewContent
            } else {
                listViewContent
            }
        }
        .navigationTitle("Maintenance Scheduler")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Picker("Filter by Priority", selection: $filterPriority) {
                        Text("All").tag(nil as RiskLevel?)
                        ForEach(RiskLevel.allCases, id: \.self) { level in
                            Text(level.displayName).tag(level as RiskLevel?)
                        }
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                }
            }
        }
        .sheet(item: $selectedRecommendation) { recommendation in
            scheduleSheet(for: recommendation)
        }
    }

    // MARK: - Header Stats
    private var headerStats: some View {
        HStack(spacing: 16) {
            statCard(
                icon: "calendar.badge.exclamationmark",
                value: "\(unscheduledCount)",
                label: "Unscheduled",
                color: .orange
            )

            statCard(
                icon: "checkmark.circle.fill",
                value: "\(scheduledRecommendations.count)",
                label: "Scheduled",
                color: .green
            )

            statCard(
                icon: "dollarsign.circle.fill",
                value: totalCost,
                label: "Total Cost",
                color: .blue
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(radius: 2)
    }

    private func statCard(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }

    // MARK: - List View
    private var listViewContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Urgent Section
                if !urgentRecommendations.isEmpty {
                    urgentSection
                }

                // All Recommendations
                ForEach(filteredRecommendations) { recommendation in
                    recommendationCard(recommendation)
                }
            }
            .padding()
        }
    }

    private var urgentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                Text("Urgent - Schedule Soon")
                    .font(.headline)
                Spacer()
            }

            ForEach(urgentRecommendations.prefix(3)) { recommendation in
                compactRecommendationCard(recommendation)
            }
        }
        .padding()
        .background(Color.red.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }

    private func recommendationCard(_ recommendation: MaintenanceRecommendation) -> some View {
        VStack(spacing: 16) {
            HStack {
                // Component Info
                HStack(spacing: 12) {
                    Image(systemName: recommendation.component.icon)
                        .font(.title2)
                        .foregroundColor(recommendation.priority.color)
                        .frame(width: 48, height: 48)
                        .background(recommendation.priority.color.opacity(0.15))
                        .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(recommendation.component.displayName)
                            .font(.headline)

                        HStack(spacing: 4) {
                            Image(systemName: recommendation.action.icon)
                            Text(recommendation.action.displayName)
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Priority Badge
                VStack(alignment: .trailing, spacing: 4) {
                    Text(recommendation.priority.displayName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(recommendation.priority.color.opacity(0.2))
                        .foregroundColor(recommendation.priority.color)
                        .cornerRadius(6)

                    if recommendation.isScheduled {
                        Label("Scheduled", systemImage: "checkmark.circle.fill")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }

            Divider()

            // Details
            VStack(spacing: 8) {
                detailRow(icon: "calendar", label: "Recommended Date", value: recommendation.formattedScheduledDate)
                detailRow(icon: "clock", label: "Duration", value: recommendation.formattedDuration)
                detailRow(icon: "dollarsign.circle", label: "Estimated Cost", value: recommendation.formattedCost)
            }

            // Benefits
            if !recommendation.benefits.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Benefits:")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)

                    ForEach(recommendation.benefits.prefix(2), id: \.self) { benefit in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.caption)

                            Text(benefit)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.top, 4)
            }

            Divider()

            // Action Button
            Button {
                selectedRecommendation = recommendation
                showScheduleSheet = true
            } label: {
                HStack {
                    Image(systemName: recommendation.isScheduled ? "calendar.badge.checkmark" : "calendar.badge.plus")
                    Text(recommendation.isScheduled ? "Reschedule" : "Schedule Maintenance")
                }
                .font(.subheadline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding()
                .background(recommendation.isScheduled ? Color(.secondarySystemBackground) : Color.blue)
                .foregroundColor(recommendation.isScheduled ? .primary : .white)
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func compactRecommendationCard(_ recommendation: MaintenanceRecommendation) -> some View {
        Button {
            selectedRecommendation = recommendation
            showScheduleSheet = true
        } label: {
            HStack {
                Image(systemName: recommendation.component.icon)
                    .foregroundColor(recommendation.priority.color)
                    .frame(width: 32, height: 32)
                    .background(recommendation.priority.color.opacity(0.1))
                    .cornerRadius(6)

                VStack(alignment: .leading, spacing: 2) {
                    Text("\(recommendation.action.displayName) \(recommendation.component.displayName)")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Text(recommendation.formattedScheduledDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(recommendation.formattedCost)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    if !recommendation.isScheduled {
                        Text("Not Scheduled")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Calendar View
    private var calendarViewContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Calendar
                DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)

                // Recommendations for Selected Date
                recommendationsForDate

                // Optimization Suggestion
                optimizationSuggestion
            }
            .padding()
        }
    }

    private var recommendationsForDate: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Scheduled for \(selectedDate.formatted(date: .long, time: .omitted))")
                .font(.headline)

            let matchingRecommendations = recommendations.filter { recommendation in
                Calendar.current.isDate(recommendation.scheduledDate, inSameDayAs: selectedDate)
            }

            if matchingRecommendations.isEmpty {
                emptyDateState
            } else {
                ForEach(matchingRecommendations) { recommendation in
                    compactRecommendationCard(recommendation)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }

    private var emptyDateState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.plus")
                .font(.largeTitle)
                .foregroundColor(.secondary)

            Text("No maintenance scheduled")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button {
                // Add maintenance for this date
            } label: {
                Text("Schedule Maintenance")
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }

    private var optimizationSuggestion: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                Text("Optimization Tip")
                    .font(.headline)
            }

            Text("Schedule multiple maintenance tasks on the same day to reduce vehicle downtime and save on labor costs.")
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                Image(systemName: "arrow.down.circle.fill")
                    .foregroundColor(.green)

                Text("Potential savings: $150-300 per combined service")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)
            }
        }
        .padding()
        .background(Color.yellow.opacity(0.1))
        .cornerRadius(12)
    }

    // MARK: - Schedule Sheet
    private func scheduleSheet(for recommendation: MaintenanceRecommendation) -> some View {
        NavigationView {
            Form {
                Section("Maintenance Details") {
                    LabeledContent("Component", value: recommendation.component.displayName)
                    LabeledContent("Action", value: recommendation.action.displayName)
                    LabeledContent("Priority", value: recommendation.priority.displayName)
                }

                Section("Scheduling") {
                    DatePicker("Scheduled Date", selection: .constant(recommendation.scheduledDate))

                    LabeledContent("Estimated Duration", value: recommendation.formattedDuration)

                    LabeledContent("Estimated Cost", value: recommendation.formattedCost)
                }

                Section("Benefits") {
                    ForEach(recommendation.benefits, id: \.self) { benefit in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)

                            Text(benefit)
                                .font(.subheadline)
                        }
                    }
                }

                Section {
                    Button {
                        scheduleMaintenace(recommendation)
                    } label: {
                        Text(recommendation.isScheduled ? "Update Schedule" : "Confirm Schedule")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .navigationTitle("Schedule Maintenance")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        selectedRecommendation = nil
                        showScheduleSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Views
    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 20)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }

    // MARK: - Computed Properties
    private var urgentRecommendations: [MaintenanceRecommendation] {
        recommendations
            .filter { $0.priority == .critical || $0.priority == .high }
            .filter { !$0.isScheduled }
    }

    private var totalCost: String {
        let total = recommendations.reduce(0) { $0 + $1.estimatedCost }
        return String(format: "$%.0f", total)
    }

    // MARK: - Actions
    private func scheduleMaintenace(_ recommendation: MaintenanceRecommendation) {
        // In a real app, this would update the recommendation via API
        if let index = scheduledRecommendations.firstIndex(where: { $0.id == recommendation.id }) {
            scheduledRecommendations[index] = recommendation
        } else {
            scheduledRecommendations.append(recommendation)
        }

        selectedRecommendation = nil
        showScheduleSheet = false
    }
}

// MARK: - Preview
struct MaintenanceSchedulerView_Previews: PreviewProvider {
    static var sampleRecommendations: [MaintenanceRecommendation] = [
        MaintenanceRecommendation(
            id: "1",
            vehicleId: "v1",
            component: .brakes,
            action: .service,
            priority: .high,
            scheduledDate: Date().addingTimeInterval(86400 * 7),
            estimatedCost: 400,
            estimatedDuration: 120,
            description: "Brake service required",
            benefits: ["Ensure safe braking", "Prevent component failure"],
            isScheduled: false
        ),
        MaintenanceRecommendation(
            id: "2",
            vehicleId: "v1",
            component: .oilFilter,
            action: .replace,
            priority: .moderate,
            scheduledDate: Date().addingTimeInterval(86400 * 14),
            estimatedCost: 30,
            estimatedDuration: 30,
            description: "Oil filter replacement",
            benefits: ["Maintain engine health", "Improve fuel efficiency"],
            isScheduled: true
        )
    ]

    static var previews: some View {
        NavigationView {
            MaintenanceSchedulerView(recommendations: sampleRecommendations)
        }
    }
}
