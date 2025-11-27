t
//
//  ChecklistTemplateEditorView.swift
//  Fleet Manager
//
//  A template editor with drag-and-drop item management for fleet checklists
//

import SwiftUI

// MARK: - Checklist Item
struct ChecklistItem: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let description: String
}

// MARK: - ChecklistTemplateEditorViewModel
class ChecklistTemplateEditorViewModel: ObservableObject {
    @Published var checklistItems: [ChecklistItem] = []
    
    // Add item to checklist
    func addItem(_ item: ChecklistItem) {
        checklistItems.append(item)
    }
    
    // Remove item from checklist
    func removeItem(_ item: ChecklistItem) {
        checklistItems.removeAll { $0 == item }
    }
    
    // Move item within checklist
    func moveItem(from: IndexSet, to: Int) {
        checklistItems.move(fromOffsets: from, toOffset: to)
    }
}

// MARK: - ChecklistTemplateEditorView
struct ChecklistTemplateEditorView: View {
    @StateObject private var viewModel = ChecklistTemplateEditorViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.checklistItems) { item in
                    Text(item.title)
                        .accessibilityLabel(item.description)
                }
                .onMove(perform: viewModel.moveItem)
                .onDelete(perform: viewModel.removeItem)
            }
            .navigationTitle("Checklist Template Editor")
            .navigationBarItems(trailing: EditButton())
        }
    }
}

// MARK: - Preview
#if DEBUG
struct ChecklistTemplateEditorView_Previews: PreviewProvider {
    static var previews: some View {
        ChecklistTemplateEditorView()
    }
}
#endif