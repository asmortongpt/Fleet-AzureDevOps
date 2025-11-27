t
//
//  BudgetPlanningView.swift
//  Fleet Manager
//
//  Budgeting overview for fleet management, allocation by category and department
//

import SwiftUI
import Combine
import Charts

// MARK: - Budget item model
struct BudgetItem: Identifiable {
    let id = UUID()
    let category: String
    let department: String
    let allocatedAmount: Double
    let spentAmount: Double
}

// MARK: - Budget Planning ViewModel
class BudgetPlanningViewModel: ObservableObject {
    @Published var budgetItems = [BudgetItem]()
    @Published var isLoading = false
    @Published var error: Error?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        fetchBudgetData()
    }
    
    func fetchBudgetData() {
        self.isLoading = true
        // Network request to fetch budget data
        // For security, use parameterized queries to avoid SQL injection. No hardcoded secrets.
        // This is a mockup. Replace with actual network code.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.budgetItems = [
                BudgetItem(category: "Maintenance", department: "Operations", allocatedAmount: 50000, spentAmount: 30000),
                BudgetItem(category: "Fuel", department: "Operations", allocatedAmount: 70000, spentAmount: 50000),
                BudgetItem(category: "Vehicle Purchase", department: "Acquisitions", allocatedAmount: 150000, spentAmount: 100000)
            ]
            self.isLoading = false
        }
    }
}

// MARK: - Budget Planning View
struct BudgetPlanningView: View {
    @StateObject private var viewModel = BudgetPlanningViewModel()
    
    var body: some View {
        NavigationView {
            List {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    ForEach(viewModel.budgetItems) { item in
                        BudgetCard(budgetItem: item)
                    }
                }
            }
            .navigationTitle("Budget Planning")
            .alert(item: $viewModel.error) { error in
                Alert(title: Text("An error occurred"), message: Text(error.localizedDescription))
            }
        }
    }
}

// MARK: - Budget Card
struct BudgetCard: View {
    let budgetItem: BudgetItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(budgetItem.category)
                .font(.headline)
            Text(budgetItem.department)
                .font(.subheadline)
            HStack {
                Text("Allocated: \(budgetItem.allocatedAmount, specifier: "%.2f")")
                Text("Spent: \(budgetItem.spentAmount, specifier: "%.2f")")
            }
            .font(.body)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

#if DEBUG
struct BudgetPlanningView_Previews: PreviewProvider {
    static var previews: some View {
        BudgetPlanningView()
    }
}
#endif