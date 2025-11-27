t
//
//  TrainingManagementView.swift
//  Fleet Manager
//
//  This view is responsible for displaying the training courses assigned to each driver and their completion status.
//

import SwiftUI
import Combine

// MARK: - Course
struct Course: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let completionStatus: CompletionStatus
}

enum CompletionStatus: String {
    case notStarted = "Not Started"
    case inProgress = "In Progress"
    case completed = "Completed"
}

// MARK: - TrainingManagementView
struct TrainingManagementView: View {
    @StateObject private var viewModel = TrainingManagementViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.courses) { course in
                    CourseCard(course: course)
                }
            }
            .navigationTitle("Training Management")
        }
    }
}

// MARK: - CourseCard
struct CourseCard: View {
    let course: Course

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(course.title)
                    .font(.headline)
                Text(course.description)
                    .font(.subheadline)
            }
            Spacer()
            Text(course.completionStatus.rawValue)
                .font(.subheadline)
                .foregroundColor(course.completionStatus == .completed ? .green : .red)
        }
        .padding()
    }
}

// MARK: - TrainingManagementViewModel
class TrainingManagementViewModel: ObservableObject {
    @Published var courses: [Course] = []

    init() {
        // Fetch the current courses and their completion status.
        // This is simulated here using a static array for demonstration purposes.
        // In production, this would likely be a network request or database query.
        self.courses = [
            Course(title: "Safety Training", description: "Basic safety protocols and procedures.", completionStatus: .completed),
            Course(title: "Advanced Driving", description: "Advanced driving techniques and best practices.", completionStatus: .inProgress),
            Course(title: "Mechanical Maintenance", description: "Understanding vehicle maintenance and common issues.", completionStatus: .notStarted)
        ]
    }
}

#if DEBUG
struct TrainingManagementView_Previews: PreviewProvider {
    static var previews: some View {
        TrainingManagementView()
    }
}
#endif