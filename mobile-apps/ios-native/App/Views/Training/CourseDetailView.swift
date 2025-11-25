//
//  CourseDetailView.swift
//  Fleet Manager
//
//  Detailed course information with enrollment and materials
//

import SwiftUI

struct CourseDetailView: View {
    let course: TrainingCourse
    @ObservedObject var viewModel: TrainingManagementViewModel
    @State private var showEnrollmentSheet = false
    @State private var selectedDriverId = ""
    @State private var selectedScheduleId: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header Section
                CourseHeaderSection(course: course)

                Divider()

                // Course Information
                CourseInfoSection(course: course)

                Divider()

                // Prerequisites
                if !course.prerequisites.isEmpty {
                    PrerequisitesSection(prerequisites: course.prerequisites, viewModel: viewModel)
                    Divider()
                }

                // Course Materials
                if !course.materials.isEmpty {
                    MaterialsSection(materials: course.materials)
                    Divider()
                }

                // Topics Covered
                if !course.topics.isEmpty {
                    TopicsSection(topics: course.topics)
                    Divider()
                }

                // Upcoming Sessions
                UpcomingSessionsSection(course: course, viewModel: viewModel)

                Spacer(minLength: 80)
            }
            .padding()
        }
        .navigationTitle(course.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Enroll") {
                    showEnrollmentSheet = true
                }
                .disabled(!course.isActive)
            }
        }
        .sheet(isPresented: $showEnrollmentSheet) {
            EnrollmentSheet(
                course: course,
                viewModel: viewModel,
                selectedDriverId: $selectedDriverId,
                selectedScheduleId: $selectedScheduleId
            )
        }
    }
}

// MARK: - Course Header Section
struct CourseHeaderSection: View {
    let course: TrainingCourse

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: course.category.icon)
                    .font(.largeTitle)
                    .foregroundColor(course.category.color)
                    .frame(width: 60, height: 60)
                    .background(course.category.color.opacity(0.1))
                    .cornerRadius(12)

                VStack(alignment: .leading, spacing: 6) {
                    Text(course.code)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(course.category.displayName)
                        .font(.headline)
                        .foregroundColor(course.category.color)

                    HStack(spacing: 8) {
                        if course.isRequired {
                            Badge(text: "Required", color: .red)
                        }

                        Badge(text: course.deliveryMethod.displayName, color: .blue)
                    }
                }

                Spacer()
            }

            Text(course.description)
                .font(.body)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Course Info Section
struct CourseInfoSection: View {
    let course: TrainingCourse

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Course Information")
                .font(.headline)

            VStack(spacing: 12) {
                InfoRow(
                    icon: "clock.fill",
                    title: "Duration",
                    value: course.formattedDuration,
                    color: .blue
                )

                if let instructor = course.instructor {
                    InfoRow(
                        icon: "person.fill",
                        title: "Instructor",
                        value: instructor,
                        color: .purple
                    )
                }

                if let provider = course.provider {
                    InfoRow(
                        icon: "building.2.fill",
                        title: "Provider",
                        value: provider,
                        color: .green
                    )
                }

                InfoRow(
                    icon: course.deliveryMethod.icon,
                    title: "Delivery Method",
                    value: course.deliveryMethod.displayName,
                    color: .orange
                )

                if let cost = course.costPerPerson {
                    InfoRow(
                        icon: "dollarsign.circle.fill",
                        title: "Cost per Person",
                        value: String(format: "$%.2f", cost),
                        color: .green
                    )
                }

                if let capacity = course.maxCapacity {
                    InfoRow(
                        icon: "person.3.fill",
                        title: "Max Capacity",
                        value: "\(capacity) participants",
                        color: .indigo
                    )
                }

                if let certificateValidityMonths = course.certificateValidityMonths {
                    InfoRow(
                        icon: "doc.badge.ellipsis",
                        title: "Certificate Validity",
                        value: "\(certificateValidityMonths) months",
                        color: .cyan
                    )
                }
            }
        }
    }
}

// MARK: - Prerequisites Section
struct PrerequisitesSection: View {
    let prerequisites: [String]
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Prerequisites")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(prerequisites, id: \.self) { prereqId in
                    if let prereqCourse = viewModel.courses.first(where: { $0.id == prereqId }) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)

                            Text(prereqCourse.title)
                                .font(.subheadline)

                            Spacer()

                            NavigationLink(destination: CourseDetailView(course: prereqCourse, viewModel: viewModel)) {
                                Image(systemName: "chevron.right")
                                    .foregroundColor(.gray)
                                    .font(.caption)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
    }
}

// MARK: - Materials Section
struct MaterialsSection: View {
    let materials: [CourseMaterial]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Course Materials")
                .font(.headline)

            VStack(spacing: 8) {
                ForEach(materials) { material in
                    MaterialRow(material: material)
                }
            }
        }
    }
}

struct MaterialRow: View {
    let material: CourseMaterial

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: material.type.icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(material.title)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    if material.isRequired {
                        Badge(text: "Required", color: .red)
                    }
                }

                HStack(spacing: 8) {
                    if let fileSize = material.fileSize {
                        Text(material.formattedFileSize)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let duration = material.duration {
                        Text("\(duration) min")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            if material.url != nil {
                Button(action: {
                    // Download/open material
                }) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.title3)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

// MARK: - Topics Section
struct TopicsSection: View {
    let topics: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Topics Covered")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(topics, id: \.self) { topic in
                    HStack {
                        Image(systemName: "checkmark.circle")
                            .foregroundColor(.green)
                        Text(topic)
                            .font(.subheadline)
                    }
                }
            }
        }
    }
}

// MARK: - Upcoming Sessions Section
struct UpcomingSessionsSection: View {
    let course: TrainingCourse
    @ObservedObject var viewModel: TrainingManagementViewModel

    var upcomingSessions: [TrainingSchedule] {
        viewModel.schedules.filter { schedule in
            schedule.courseId == course.id && schedule.isUpcoming
        }.sorted { $0.startDateTime < $1.startDateTime }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Upcoming Sessions")
                .font(.headline)

            if upcomingSessions.isEmpty {
                HStack {
                    Image(systemName: "calendar.badge.exclamationmark")
                        .foregroundColor(.orange)
                    Text("No upcoming sessions scheduled")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(8)
            } else {
                VStack(spacing: 8) {
                    ForEach(upcomingSessions) { session in
                        SessionCard(session: session)
                    }
                }
            }
        }
    }
}

struct SessionCard: View {
    let session: TrainingSchedule

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(session.formattedDate)
                        .font(.headline)

                    Text(session.formattedTime)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if session.isFull {
                    Badge(text: "Full", color: .red)
                } else {
                    Badge(text: "\(session.availableSeats) seats", color: .green)
                }
            }

            HStack {
                Label(session.location, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Label(session.instructor, systemImage: "person.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if let meetingUrl = session.virtualMeetingUrl {
                HStack {
                    Image(systemName: "video.fill")
                        .foregroundColor(.blue)
                    Text("Virtual meeting available")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }
}

// MARK: - Enrollment Sheet
struct EnrollmentSheet: View {
    let course: TrainingCourse
    @ObservedObject var viewModel: TrainingManagementViewModel
    @Binding var selectedDriverId: String
    @Binding var selectedScheduleId: String?
    @Environment(\.presentationMode) var presentationMode
    @State private var isEnrolling = false
    @State private var errorMessage: String?

    var upcomingSessions: [TrainingSchedule] {
        viewModel.schedules.filter { schedule in
            schedule.courseId == course.id && schedule.isUpcoming && !schedule.isFull
        }
    }

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Driver")) {
                    TextField("Driver ID", text: $selectedDriverId)
                        .autocapitalization(.none)
                }

                if !upcomingSessions.isEmpty {
                    Section(header: Text("Select Session (Optional)")) {
                        Picker("Session", selection: $selectedScheduleId) {
                            Text("Any Session").tag(String?.none)

                            ForEach(upcomingSessions) { session in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(session.formattedDate)
                                        Text(session.formattedTime)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .tag(Optional(session.id))
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                    }
                }

                Section(header: Text("Course Details")) {
                    HStack {
                        Text("Course")
                        Spacer()
                        Text(course.title)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Duration")
                        Spacer()
                        Text(course.formattedDuration)
                            .foregroundColor(.secondary)
                    }

                    if let cost = course.costPerPerson {
                        HStack {
                            Text("Cost")
                            Spacer()
                            Text(String(format: "$%.2f", cost))
                                .foregroundColor(.secondary)
                        }
                    }
                }

                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                Section {
                    Button(action: enrollDriver) {
                        if isEnrolling {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                        } else {
                            Text("Enroll Driver")
                                .frame(maxWidth: .infinity)
                                .foregroundColor(.white)
                        }
                    }
                    .disabled(selectedDriverId.isEmpty || isEnrolling)
                    .listRowBackground(selectedDriverId.isEmpty ? Color.gray : Color.blue)
                }
            }
            .navigationTitle("Enroll in Course")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private func enrollDriver() {
        isEnrolling = true
        errorMessage = nil

        Task {
            do {
                try await viewModel.enrollDriver(
                    driverId: selectedDriverId,
                    courseId: course.id,
                    scheduleId: selectedScheduleId
                )
                await MainActor.run {
                    presentationMode.wrappedValue.dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isEnrolling = false
                }
            }
        }
    }
}

// MARK: - Supporting Views
struct InfoRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

#Preview {
    NavigationView {
        CourseDetailView(
            course: TrainingCourse.sample,
            viewModel: TrainingManagementViewModel()
        )
    }
}
