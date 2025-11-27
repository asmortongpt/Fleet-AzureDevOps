t
//
//  BudgetEditorView.swift
//  Fleet Manager
//
//  This view allows editing of budgets with line-item detail and approval workflow.
//

import SwiftUI

// MARK: - BudgetItem
struct BudgetItem: Identifiable {
    let id = UUID()
    let title: String
    let cost: Double
    var isApproved: Bool
}

// MARK: - BudgetEditorViewModel
class BudgetEditorViewModel: ObservableObject {
    @Published var budgetItems = [BudgetItem]()
    @Published var isLoading = false
    @Published var error: Error?
    
    func fetchBudgetItems() {
        self.isLoading = true
        // Fetch budget items from secure data source, handle errors, and assign to budgetItems
    }
    
    func updateBudgetItem(_ item: BudgetItem) {
        // Securely update the budget item in the data source, handle errors
    }
}

// MARK: - BudgetEditorView
struct BudgetEditorView: View {
    @StateObject private var viewModel = BudgetEditorViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.budgetItems) { item in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(item.title).font(.headline)
                            Text("$\(item.cost, specifier: "%.2f")").font(.subheadline)
                        }
                        Spacer()
                        if item.isApproved {
                            Image(systemName: "checkmark.circle.fill").foregroundColor(.green)
                        } else {
                            Image(systemName: "xmark.circle.fill").foregroundColor(.red)
                        }
                    }
                    .padding(.vertical)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel(Text("Budget item \(item.title) with cost \(item.cost), \(item.isApproved ? "approved" : "not approved")"))
                }
            }
            .navigationTitle("Budget Editor")
            .onAppear {
                viewModel.fetchBudgetItems()
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct BudgetEditorView_Previews: PreviewProvider {
    static var previews: some View {
        BudgetEditorView()
    }
}
#endif