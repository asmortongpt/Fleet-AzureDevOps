t
//
//  ActiveChecklistView.swift
//  Fleet Manager
//
//  In-progress checklists with real-time completion tracking
//

import SwiftUI
import Combine

// MARK: - Checklist Item
struct ChecklistItem: Identifiable {
    let id = UUID()
    let title: String
    let completionStatus: Bool
}

// MARK: - Active Checklist View Model
class ActiveChecklistViewModel: ObservableObject {
    @Published var checklistItems: [ChecklistItem] = []

    // Initialize with sample data
    init() {
        self.checklistItems = [
            ChecklistItem(title: "Vehicle Inspection", completionStatus: false),
            ChecklistItem(title: "Maintenance Check", completionStatus: true),
            ChecklistItem(title: "Fuel Level Check", completionStatus: false)
        ]
    }
}

// MARK: - Active Checklist View
struct ActiveChecklistView: View {
    @StateObject private var viewModel = ActiveChecklistViewModel()

    var body: some View {
        List {
            ForEach(viewModel.checklistItems) { item in
                HStack {
                    Text(item.title)
                    Spacer()
                    Image(systemName: item.completionStatus ? "checkmark.circle.fill" : "circle")
                        .accessibilityLabel(Text(item.completionStatus ? "Completed" : "Not Completed"))
                        .foregroundColor(item.completionStatus ? .green : .red)
                }.padding()
            }
        }
        .navigationTitle("Active Checklists")
    }
}

// MARK: - Preview
#if DEBUG
struct ActiveChecklistView_Previews: PreviewProvider {
    static var previews: some View {
        ActiveChecklistView()
    }
}
#endif