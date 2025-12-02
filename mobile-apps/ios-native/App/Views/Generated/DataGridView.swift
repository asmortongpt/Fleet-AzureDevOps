Sure, here's the SwiftUI view for a Fleet Management iOS app.

```swift
//
//  DataGridView.swift
//  Fleet Manager
//
//  Advanced data tables with sorting, filtering, and export
//

import SwiftUI

// MARK: - DataGridItem
struct DataGridItem: Identifiable, Comparable {
    let id = UUID()
    let vehicleId: String
    let driverId: String
    let tripId: String
    let status: String
    let timestamp: Date

    static func < (lhs: DataGridItem, rhs: DataGridItem) -> Bool {
        return lhs.timestamp < rhs.timestamp
    }
}

// MARK: - DataGridView
struct DataGridView: View {
    @StateObject private var viewModel = DataGridViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.dataGridItems.sorted(), id: \.id) { item in
                    NavigationLink(destination: DetailView(dataGridItem: item)) {
                        VStack(alignment: .leading) {
                            HStack {
                                Text(item.vehicleId)
                                    .font(.headline)
                                Spacer()
                                Text(item.status)
                                    .foregroundColor(item.status == "Active" ? .green : .red)
                            }
                            Text(item.driverId)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .accessibility(label: Text("Vehicle \(item.vehicleId) with status \(item.status) driven by \(item.driverId)"))
                }
            }
            .navigationTitle("Data Grid")
        }
    }
}

// MARK: - DataGridViewModel
class DataGridViewModel: ObservableObject {
    @Published var dataGridItems: [DataGridItem] = [] // Fetch from API or database

    // Implement methods for sorting, filtering, and export here
    // Remember to validate inputs and use parameterized queries for security
}

// MARK: - DetailView
struct DetailView: View {
    let dataGridItem: DataGridItem

    var body: some View {
        VStack {
            Text(dataGridItem.vehicleId)
                .font(.largeTitle)
            Text("Driver: \(dataGridItem.driverId)")
                .font(.title2)
            Text("Status: \(dataGridItem.status)")
                .font(.title2)
                .foregroundColor(dataGridItem.status == "Active" ? .green : .red)
            Text("Timestamp: \(dataGridItem.timestamp, style: .date)")
                .font(.title2)
        }
        .padding()
        .navigationTitle("Details")
    }
}

#if DEBUG
struct DataGridView_Previews: PreviewProvider {
    static var previews: some View {
        DataGridView()
    }
}
#endif