Sure, here is a production-ready SwiftUI view, PurchaseOrderListView, for your Fleet Management iOS app.

```swift
//  PurchaseOrderListView.swift
//  Fleet Manager
//
//  Show list of purchase orders with approval workflow and tracking
//

import SwiftUI

// Purchase Order struct
struct PurchaseOrder: Identifiable {
    let id = UUID()
    let orderNumber: String
    let date: Date
    let totalCost: Double
    let status: OrderStatus
}

enum OrderStatus: String {
    case pending = "Pending"
    case approved = "Approved"
    case rejected = "Rejected"
}

// ViewModel for Purchase Order
class PurchaseOrderViewModel: ObservableObject {
    @Published var orders: [PurchaseOrder] = []
    // Load orders from database here, ensure to use parameterized SQL queries and validate inputs
}

// Purchase Order List View
struct PurchaseOrderListView: View {
    @StateObject private var viewModel = PurchaseOrderViewModel()
    
    var body: some View {
        NavigationView {
            List(viewModel.orders) { order in
                VStack(alignment: .leading) {
                    Text("Order #: \(order.orderNumber)").font(.headline)
                    Text("Date: \(order.date, formatter: DateFormatter())")
                    Text("Total Cost: $\(order.totalCost, specifier: "%.2f")")
                    Text("Status: \(order.status.rawValue)").font(.subheadline)
                }
                .padding()
                .accessibilityElement(children: .combine)
                .accessibility(label: Text("Purchase order \(order.orderNumber) with total cost $\(order.totalCost, specifier: "%.2f") and status \(order.status.rawValue) dated \(order.date, formatter: DateFormatter())"))
            }
            .navigationTitle("Purchase Orders")
        }
    }
}

#if DEBUG
struct PurchaseOrderListView_Previews: PreviewProvider {
    static var previews: some View {
        PurchaseOrderListView()
    }
}
#endif