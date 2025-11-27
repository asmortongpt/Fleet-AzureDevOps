t
//
//  StockMovementView.swift
//  Fleet Manager
//
//  View for tracking stock changes with transaction history
//

import SwiftUI

// MARK: - Stock Movement Types
struct StockMovement: Identifiable {
    let id = UUID()
    let product: String
    let quantity: Int
    let date: Date
    let source: String
    let destination: String
}

// MARK: - StockMovementView
struct StockMovementView: View {
    @StateObject private var viewModel = StockMovementViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.stockMovements) { movement in
                    StockMovementCard(movement: movement)
                }
            }
            .navigationTitle("Stock Movements")
        }
    }
}

// MARK: - StockMovementCard
struct StockMovementCard: View {
    var movement: StockMovement
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(movement.product)
                    .font(.headline)
                Text("Quantity: \(movement.quantity)")
                    .font(.subheadline)
                Text("Source: \(movement.source)")
                    .font(.subheadline)
                Text("Destination: \(movement.destination)")
                    .font(.subheadline)
                Text("Date: \(movement.date, formatter: DateFormatter.dateOnly)")
                    .font(.subheadline)
            }
            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - StockMovementViewModel
class StockMovementViewModel: ObservableObject {
    @Published var stockMovements: [StockMovement] = [] // Fetch from your data source and update this property.
    
    init() {
        // Initialize with data fetch here
        // Make sure to perform secure, parameterized queries and handle errors appropriately
    }
}

// MARK: - DateFormatter for the date display
extension DateFormatter {
    static let dateOnly: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}

#if DEBUG
struct StockMovementView_Previews: PreviewProvider {
    static var previews: some View {
        StockMovementView()
    }
}
#endif