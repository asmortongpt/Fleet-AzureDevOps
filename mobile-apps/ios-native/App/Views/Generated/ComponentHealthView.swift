Here's the Swift code for the `ComponentHealthView` feature:

```swift
//
//  ComponentHealthView.swift
//  Fleet Manager
//
//  Monitor the health of vehicle components and predict alerts
//

import SwiftUI

// MARK: - Component Types
struct ComponentItem: Identifiable {
    let id = UUID()
    let type: ComponentType
    let status: ComponentStatus
    let lastCheckDate: Date
    let nextCheckDate: Date?
    let vehicleId: String
}

enum ComponentType: String {
    case battery = "Battery"
    case engine = "Engine"
}

enum ComponentStatus: String {
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case critical = "Critical"
}

struct ComponentHealthView: View {
    @StateObject private var viewModel = ComponentHealthViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.components) { component in
                    ComponentCard(component: component)
                }
            }
            .navigationTitle("Component Health")
        }
    }
}

struct ComponentCard: View {
    var component: ComponentItem

    var body: some View {
        VStack(alignment: .leading) {
            Text("\(component.type.rawValue) Status")
                .font(.headline)
            Text("Status: \(component.status.rawValue)")
            Text("Last Check: \(component.lastCheckDate, formatter: dateFormatter)")
            Text("Next Check: \(component.nextCheckDate != nil ? dateFormatter.string(from: component.nextCheckDate!) : "N/A")")
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 5)
    }
}

class ComponentHealthViewModel: ObservableObject {
    @Published var components: [ComponentItem] = [] // data from server
}

let dateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    return formatter
}()

#if DEBUG
struct ComponentHealthView_Previews: PreviewProvider {
    static var previews: some View {
        ComponentHealthView()
    }
}
#endif