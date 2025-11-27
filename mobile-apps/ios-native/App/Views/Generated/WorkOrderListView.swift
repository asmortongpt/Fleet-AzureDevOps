t
//
//  WorkOrderListView.swift
//  Fleet Manager
//
//  Created by SwiftUI Expert on 06/28/21.
//

import SwiftUI

// MARK: - Work Order Status Enum
enum WorkOrderStatus: String {
    case pending = "Pending"
    case inProgress = "In Progress"
    case completed = "Completed"
}

// MARK: - Work Order Item
struct WorkOrderItem: Identifiable {
    let id = UUID()
    let orderNumber: String
    let vehicleId: String
    let driverId: String
    let description: String
    let status: WorkOrderStatus
}

// MARK: - Work Order View Model
class WorkOrderViewModel: ObservableObject {
    @Published var workOrders = [WorkOrderItem]()
    
    init() {
        // TODO: Fetch work orders from your data source
        // Ensure to handle errors and loading state
        // Make sure to validate and sanitize all inputs
        // Use parameterized queries to prevent SQL injection
    }
}

// MARK: - Work Order List View
struct WorkOrderListView: View {
    @StateObject private var viewModel = WorkOrderViewModel()
    
    var body: some View {
        NavigationView {
            List(viewModel.workOrders) { order in
                WorkOrderCard(order: order)
            }
            .navigationTitle("Work Orders")
        }
    }
}

// MARK: - Work Order Card View
struct WorkOrderCard: View {
    var order: WorkOrderItem

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Order: \(order.orderNumber)")
                Text("Vehicle: \(order.vehicleId)")
                Text("Driver: \(order.driverId)")
                Text(order.description)
            }
            
            Spacer()
            
            Text(order.status.rawValue)
                .padding()
                .background(order.status == .completed ? Color.green : Color.orange)
                .foregroundColor(.white)
                .clipShape(Capsule())
        }
        .padding()
        .accessibility(label: Text("Work order \(order.orderNumber) for vehicle \(order.vehicleId) assigned to driver \(order.driverId) with status \(order.status.rawValue)"))
    }
}

#if DEBUG
struct WorkOrderListView_Previews: PreviewProvider {
    static var previews: some View {
        WorkOrderListView()
    }
}
#endif