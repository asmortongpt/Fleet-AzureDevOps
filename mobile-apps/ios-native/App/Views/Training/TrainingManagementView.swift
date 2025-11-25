//
//  TrainingManagementView.swift
//  Fleet Manager
//
//  Training management with course catalog, completion tracking, and compliance monitoring
//

import SwiftUI

struct TrainingManagementView: View {
    @StateObject private var viewModel = TrainingManagementViewModel()
    @State private var selectedTab = 0
    @State private var showFilterSheet = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    Text("Courses").tag(0)
                    Text("Schedule").tag(1)
                    Text("Certifications").tag(2)
                    Text("Reports").tag(3)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()

                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    CourseCatalogView(viewModel: viewModel)
                        .tag(0)

                    ScheduleListView(viewModel: viewModel)
                        .tag(1)

                    CertificationTrackingView(viewModel: viewModel)
                        .tag(2)

                    TrainingReportsView(viewModel: viewModel)
                        .tag(3)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("Training & Certification")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showFilterSheet = true
                    }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isRefreshing)
                }
            }
            .sheet(isPresented: $showFilterSheet) {
                FilterView(viewModel: viewModel)
            }
            .task {
                await viewModel.refresh()
            }
        }
    }
}

// MARK: - Course Catalog View
struct CourseCatalogView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Search Bar
            SearchBar(text: $viewModel.searchText, placeholder: "Search courses...")
                .padding()

            // Category Filter Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FilterPill(
                        title: "All",
                        isSelected: viewModel.selectedCategory == nil,
                        action: {
                            viewModel.applyFilter(category: nil)
                        }
                    )

                    ForEach(TrainingCategory.allCases, id: \.self) { category in
                        FilterPill(
                            title: category.displayName,
                            icon: category.icon,
                            color: category.color,
                            isSelected: viewModel.selectedCategory == category,
                            action: {
                                viewModel.applyFilter(category: category)
                            }
                        )
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom)

            // Course List
            if viewModel.loadingState.isLoading && viewModel.courses.isEmpty {
                ProgressView("Loading courses...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredCourses.isEmpty {
                EmptyStateView(
                    icon: "book.closed.fill",
                    title: "No Courses Found",
                    message: viewModel.searchText.isEmpty
                        ? "No training courses available"
                        : "Try adjusting your search or filters"
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.filteredCourses) { course in
                            NavigationLink(destination: CourseDetailView(course: course, viewModel: viewModel)) {
                                CourseCard(course: course)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding()
                }
            }
        }
    }
}

// MARK: - Course Card
struct CourseCard: View {
    let course: TrainingCourse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: course.category.icon)
                    .foregroundColor(course.category.color)
                    .font(.title2)
                    .frame(width: 44, height: 44)
                    .background(course.category.color.opacity(0.1))
                    .cornerRadius(8)

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(course.title)
                            .font(.headline)
                            .foregroundColor(.primary)

                        Spacer()

                        if course.isRequired {
                            Badge(text: "Required", color: .red)
                        }
                    }

                    Text(course.category.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Description
            Text(course.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)

            // Metadata
            HStack(spacing: 16) {
                MetadataItem(
                    icon: "clock.fill",
                    text: course.formattedDuration,
                    color: .blue
                )

                MetadataItem(
                    icon: course.deliveryMethod.icon,
                    text: course.deliveryMethod.displayName,
                    color: .green
                )

                if course.costPerPerson != nil {
                    MetadataItem(
                        icon: "dollarsign.circle.fill",
                        text: course.formattedCost,
                        color: .orange
                    )
                }

                Spacer()
            }
            .font(.caption)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Schedule List View
struct ScheduleListView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Upcoming Filter Toggle
            Toggle("Upcoming Only", isOn: $viewModel.showUpcomingOnly)
                .padding()

            if viewModel.filteredSchedules.isEmpty {
                EmptyStateView(
                    icon: "calendar",
                    title: "No Training Sessions",
                    message: "No training sessions scheduled"
                )
            } else {
                List {
                    ForEach(viewModel.filteredSchedules) { schedule in
                        NavigationLink(destination: ScheduleDetailView(schedule: schedule, viewModel: viewModel)) {
                            ScheduleRow(schedule: schedule)
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
    }
}

// MARK: - Schedule Row
struct ScheduleRow: View {
    let schedule: TrainingSchedule

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(schedule.courseName ?? "Training Session")
                    .font(.headline)

                Spacer()

                StatusBadge(status: schedule.status)
            }

            HStack(spacing: 16) {
                Label(schedule.formattedDate, systemImage: "calendar")
                Label(schedule.formattedTime, systemImage: "clock")
            }
            .font(.caption)
            .foregroundColor(.secondary)

            HStack {
                Label(schedule.location, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.caption2)
                    Text("\(schedule.enrolledCount)/\(schedule.maxCapacity)")
                        .font(.caption)
                }
                .foregroundColor(schedule.isFull ? .red : .secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Certification Tracking View
struct CertificationTrackingView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Alert Summary
            if !viewModel.expiringCertifications.isEmpty || !viewModel.expiredCertifications.isEmpty {
                VStack(spacing: 8) {
                    if !viewModel.expiredCertifications.isEmpty {
                        AlertBanner(
                            icon: "xmark.circle.fill",
                            text: "\(viewModel.expiredCertifications.count) expired certifications",
                            color: .red
                        )
                    }

                    if !viewModel.expiringCertifications.isEmpty {
                        AlertBanner(
                            icon: "exclamationmark.triangle.fill",
                            text: "\(viewModel.expiringCertifications.count) expiring soon",
                            color: .orange
                        )
                    }
                }
                .padding()
            }

            // Certification List
            List {
                if !viewModel.expiredCertifications.isEmpty {
                    Section(header: Text("Expired")) {
                        ForEach(viewModel.expiredCertifications) { completion in
                            CertificationRow(completion: completion)
                        }
                    }
                }

                if !viewModel.expiringCertifications.isEmpty {
                    Section(header: Text("Expiring Soon")) {
                        ForEach(viewModel.expiringCertifications) { completion in
                            CertificationRow(completion: completion)
                        }
                    }
                }

                Section(header: Text("All Certifications")) {
                    ForEach(viewModel.filteredCompletions.filter { $0.status == .completed }) { completion in
                        CertificationRow(completion: completion)
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
        }
    }
}

// MARK: - Certification Row
struct CertificationRow: View {
    let completion: CourseCompletion

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(completion.courseName ?? "Course")
                    .font(.headline)

                Spacer()

                if let expirationDate = completion.expirationDate {
                    VStack(alignment: .trailing, spacing: 2) {
                        if completion.isExpired {
                            Text("Expired")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.red)
                        } else if completion.isExpiringSoon {
                            Text("Expires Soon")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.orange)
                        }

                        Text(expirationDate, style: .date)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }

            HStack(spacing: 16) {
                if let driverName = completion.driverName {
                    Label(driverName, systemImage: "person.fill")
                }

                if let score = completion.score {
                    Label(completion.formattedScore, systemImage: "checkmark.circle.fill")
                        .foregroundColor(.green)
                }

                Spacer()

                if let certificateUrl = completion.certificateUrl {
                    Button(action: {
                        // Download/view certificate
                    }) {
                        Image(systemName: "arrow.down.circle.fill")
                            .foregroundColor(.blue)
                    }
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Training Reports View
struct TrainingReportsView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let report = viewModel.trainingReport {
                    // Overall Compliance Card
                    ComplianceScoreCard(report: report)

                    // Expiring Certifications Summary
                    ExpirationSummaryCard(report: report)

                    // Category Breakdown
                    CategoryBreakdownCard(report: report)

                    // Department Breakdown
                    DepartmentBreakdownCard(report: report)
                } else if viewModel.loadingState.isLoading {
                    ProgressView("Loading report...")
                        .padding()
                } else {
                    EmptyStateView(
                        icon: "chart.bar.doc.horizontal",
                        title: "No Report Available",
                        message: "Pull to refresh to generate a training report"
                    )
                }
            }
            .padding()
        }
    }
}

// MARK: - Compliance Score Card
struct ComplianceScoreCard: View {
    let report: TrainingReport

    var body: some View {
        VStack(spacing: 16) {
            Text("Overall Compliance")
                .font(.headline)

            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                    .frame(width: 120, height: 120)

                Circle()
                    .trim(from: 0, to: report.overallCompliancePercentage / 100)
                    .stroke(report.complianceColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 4) {
                    Text("\(Int(report.overallCompliancePercentage))%")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(report.complianceColor)

                    Text("Grade: \(report.complianceGrade)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            HStack(spacing: 30) {
                StatItem(
                    value: "\(report.compliantDrivers)/\(report.totalDrivers)",
                    label: "Drivers",
                    color: .green
                )

                StatItem(
                    value: "\(report.completedCourses)",
                    label: "Courses",
                    color: .blue
                )

                StatItem(
                    value: "\(report.overdueCourses)",
                    label: "Overdue",
                    color: .red
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Expiration Summary Card
struct ExpirationSummaryCard: View {
    let report: TrainingReport

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Certification Expirations")
                .font(.headline)

            HStack(spacing: 20) {
                ExpirationColumn(
                    count: report.expiringCertifications30Days,
                    label: "30 Days",
                    color: .red
                )

                ExpirationColumn(
                    count: report.expiringCertifications60Days,
                    label: "60 Days",
                    color: .orange
                )

                ExpirationColumn(
                    count: report.expiringCertifications90Days,
                    label: "90 Days",
                    color: .yellow
                )

                ExpirationColumn(
                    count: report.expiredCertifications,
                    label: "Expired",
                    color: .gray
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Category Breakdown Card
struct CategoryBreakdownCard: View {
    let report: TrainingReport

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Completion by Category")
                .font(.headline)

            ForEach(report.categoryBreakdown) { category in
                CategoryProgressRow(category: category)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Department Breakdown Card
struct DepartmentBreakdownCard: View {
    let report: TrainingReport

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Compliance by Department")
                .font(.headline)

            ForEach(report.departmentBreakdown) { department in
                DepartmentProgressRow(department: department)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Views
struct FilterView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Course Filters")) {
                    Toggle("Required Courses Only", isOn: $viewModel.showRequiredOnly)
                }

                Section(header: Text("Schedule Filters")) {
                    Toggle("Upcoming Sessions Only", isOn: $viewModel.showUpcomingOnly)
                }

                Section(header: Text("Completion Status")) {
                    Picker("Status", selection: $viewModel.filterByStatus) {
                        Text("All").tag(CompletionStatus?.none)
                        ForEach(CompletionStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(Optional(status))
                        }
                    }
                }

                Section {
                    Button("Reset Filters") {
                        viewModel.clearSearch()
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    var placeholder: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)

            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())

            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(UIColor.systemGray6))
        .cornerRadius(10)
    }
}

struct FilterPill: View {
    let title: String
    var icon: String? = nil
    var color: Color = .blue
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? color : Color(UIColor.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

struct MetadataItem: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(text)
        }
    }
}

struct Badge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color)
            .cornerRadius(4)
    }
}

struct StatusBadge: View {
    let status: ScheduleStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(status.color)
            .cornerRadius(4)
    }
}

struct AlertBanner: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(text)
                .font(.subheadline)
                .fontWeight(.medium)
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct StatItem: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ExpirationColumn: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct CategoryProgressRow: View {
    let category: CategoryReport

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: category.category.icon)
                    .foregroundColor(category.category.color)
                    .frame(width: 20)

                Text(category.category.displayName)
                    .font(.subheadline)

                Spacer()

                Text("\(Int(category.completionPercentage))%")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(category.category.color)
                        .frame(width: geometry.size.width * (category.completionPercentage / 100), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
    }
}

struct DepartmentProgressRow: View {
    let department: DepartmentReport

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(department.department)
                    .font(.subheadline)

                Spacer()

                Text("\(Int(department.compliancePercentage))%")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("(\(department.compliantDrivers)/\(department.totalDrivers))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(department.compliancePercentage >= 80 ? .green : .orange)
                        .frame(width: geometry.size.width * (department.compliancePercentage / 100), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundColor(.gray)

            Text(title)
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

// Placeholder views to be created
struct ScheduleDetailView: View {
    let schedule: TrainingSchedule
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        Text("Schedule Detail - Coming Soon")
    }
}

#Preview {
    TrainingManagementView()
}
