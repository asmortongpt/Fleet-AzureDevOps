t
//
//  InventoryAlertsView.swift
//  Fleet Manager
//
//  A view that presents low stock alerts and automated reorder notifications
//

import SwiftUI

// MARK: - Alert Types
struct InventoryAlert: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: AlertType
    let vehicleId: String
    let partId: String
    let partName: String
    let currentQuantity: Int
    let reorderLevel: Int
}

enum AlertType: String {
    case lowStock = "Low Stock"
    case reorder = "Reorder"
}

final class InventoryAlertsViewModel: ObservableObject {
    @Published var inventoryAlerts = [InventoryAlert]() // Fetch data securely from your backend here
}

struct InventoryAlertsView: View {
    @StateObject private var viewModel = InventoryAlertsViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.inventoryAlerts) { alert in
                    InventoryAlertCard(alert: alert)
                }
            }
            .navigationTitle("Inventory Alerts")
        }
    }
}

struct InventoryAlertCard: View {
    let alert: InventoryAlert

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(alert.type.rawValue)
                    .font(.headline)
                Text(alert.partName)
                    .font(.subheadline)
                Text("Vehicle ID: \(alert.vehicleId)")
                    .font(.footnote)
                Text("Current Quantity: \(alert.currentQuantity)")
                    .font(.footnote)
                Text("Reorder Level: \(alert.reorderLevel)")
                    .font(.footnote)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text("\(alert.timestamp, formatter: DateFormatter.shortDate)")
                    .font(.footnote)
            }
        }
        .padding()
        .accessibility(identifier: "inventoryAlert_\(alert.id)")
        .accessibilityLabel(Text("\(alert.type.rawValue) for \(alert.partName)"))
    }
}

struct InventoryAlertsView_Previews: PreviewProvider {
    static var previews: some View {
        InventoryAlertsView()
    }
}
```
This code demonstrates a SwiftUI view for showing inventory alerts in a fleet management app. The view lists inventory alerts fetched from a backend in a secure manner. Each alert is presented in a card-like view displaying the alert type, part name, vehicle ID, current quantity, and reorder level. The right side of the card shows the timestamp of the alert. The card is also accessible, with a unique identifier and label for VoiceOver. The view itself is wrapped in a `NavigationView` and has a navigation title "Inventory Alerts".