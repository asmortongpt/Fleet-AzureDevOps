Sure, here is the code for the `InventoryManagementView` and its corresponding ViewModel `InventoryViewModel`.

```swift
//
//  InventoryManagementView.swift
//  Fleet Manager
//
//  This SwiftUI View provides an interface for managing parts inventory.
//

import SwiftUI

// MARK: - Parts Structure
struct Part: Identifiable {
    let id = UUID()
    let name: String
    let stockLevel: Int
    let reorderPoint: Int
}

// MARK: - Inventory Management View
struct InventoryManagementView: View {
    @StateObject private var viewModel = InventoryViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.parts) { part in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(part.name)
                                .font(.headline)
                            Text("Stock Level: \(part.stockLevel)")
                                .font(.subheadline)
                            Text("Reorder Point: \(part.reorderPoint)")
                                .font(.subheadline)
                        }
                        .accessibilityElement(children: .combine)
                        Spacer()
                        if part.stockLevel <= part.reorderPoint {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.orange)
                                .accessibilityLabel("Reorder needed")
                        }
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Inventory Management")
        }
    }
}

// MARK: - Inventory ViewModel
class InventoryViewModel: ObservableObject {
    @Published var parts: [Part] = [] // Mocked data, replace with actual data source

    init() {
        // Mocked data, replace with actual data fetching logic
        parts = [
            Part(name: "Engine Oil", stockLevel: 10, reorderPoint: 5),
            Part(name: "Brake Fluid", stockLevel: 8, reorderPoint: 6),
            Part(name: "Tire", stockLevel: 5, reorderPoint: 4)
        ]
    }
}

// MARK: - Preview Provider
#if DEBUG
struct InventoryManagementView_Previews: PreviewProvider {
    static var previews: some View {
        InventoryManagementView()
    }
}
#endif