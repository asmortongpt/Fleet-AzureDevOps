Here is a SwiftUI view for upcoming expirations for licenses, certifications, and inspections:

```swift
//
//  ExpiringItemsView.swift
//  Fleet Manager
//
//  View showing a list of licenses, certifications, and inspections that are about to expire.
//

import SwiftUI

// MARK: - Expiring Item Model
struct ExpiringItem: Identifiable {
    let id = UUID()
    let title: String
    let expiryDate: Date
    let vehicleId: String?
    let driverId: String?
}

// MARK: - Expiring Items View
struct ExpiringItemsView: View {
    @StateObject private var viewModel = ExpiringItemsViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.expiringItems) { item in
                    ExpiringItemCard(item: item)
                }
            }
            .navigationTitle("Upcoming Expirations")
        }
    }
}

// MARK: - Expiring Items View Model
class ExpiringItemsViewModel: ObservableObject {
    @Published var expiringItems: [ExpiringItem] = []
    
    // Fetch expiring items from the database here. Make sure to use parameterized queries and validate inputs for security.
}

// MARK: - Expiring Item Card
struct ExpiringItemCard: View {
    let item: ExpiringItem
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(item.title)
                .font(.headline)
            Text("Expiry Date: \(item.expiryDate, formatter: DateFormatter())")
                .font(.subheadline)
        }
        .padding()
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray, lineWidth: 1)
        )
        .accessibility(label: Text("Expiring item \(item.title) with expiry date \(item.expiryDate)"))
    }
}

#if DEBUG
struct ExpiringItemsView_Previews: PreviewProvider {
    static var previews: some View {
        ExpiringItemsView()
    }
}
#endif