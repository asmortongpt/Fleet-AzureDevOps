t
//
//  TaskListView.swift
//  Fleet Manager
//
//  Task management with assignments, due dates, and priorities
//

import SwiftUI

// MARK: - Task Item
struct TaskItem: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let dueDate: Date
    let priority: TaskPriority
    let assignedTo: String
}

enum TaskPriority: String {
    case high = "High"
    case medium = "Medium"
    case low = "Low"
}

// MARK: - Task List View
struct TaskListView: View {
    @StateObject private var viewModel = TaskListViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.tasks) { task in
                    TaskCard(task: task)
                }
            }
            .navigationTitle("Tasks")
        }
    }
}

// MARK: - Task Card
struct TaskCard: View {
    let task: TaskItem
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(task.title)
                    .font(.headline)
                Text(task.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text("Due: \(task.dueDate, formatter: DateFormatter.taskDateFormat)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text(task.priority.rawValue)
                .font(.caption2)
                .foregroundColor(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(task.priority.color)
                .cornerRadius(6)
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(task.title), \(task.description), Due: \(task.dueDate, formatter: DateFormatter.taskDateFormat), Priority: \(task.priority.rawValue), Assigned to: \(task.assignedTo)")
    }
}

// MARK: - Task List View Model
class TaskListViewModel: ObservableObject {
    @Published var tasks: [TaskItem] = []
    
    // TODO: Implement methods to fetch data from database
}

// MARK: - Date Formatter
extension DateFormatter {
    static let taskDateFormat: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }()
}

// MARK: - Task Priority Color
extension TaskPriority {
    var color: Color {
        switch self {
        case .high:
            return .red
        case .medium:
            return .orange
        case .low:
            return .green
        }
    }
}

// MARK: - Preview
#if DEBUG
struct TaskListView_Previews: PreviewProvider {
    static var previews: some View {
        TaskListView()
    }
}
#endif