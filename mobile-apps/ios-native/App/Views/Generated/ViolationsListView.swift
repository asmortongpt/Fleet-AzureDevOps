t
//
//  ViolationsListView.swift
//  Fleet Manager
//
//  Tracks violations with filtering and sorting capabilities
//

import SwiftUI

// MARK: - Violation Type
enum ViolationType: String, CaseIterable {
    case speeding = "Speeding"
    case hardBraking = "Hard Braking"
    case rapidAcceleration = "Rapid Acceleration"
    case idling = "Idling"
}

// MARK: - Violation Item
struct ViolationItem: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ViolationType
    let vehicleId: String
    let driverId: String
}

// MARK: - ViewModel
class ViolationsListViewModel: ObservableObject {
    @Published var violations = [ViolationItem]()
    @Published var isLoading = false
    @Published var error: Error?

    // Load data from the server
    func loadData() {
        self.isLoading = true
        // TODO: Implement server-side logic here
    }
}

// MARK: - View
struct ViolationsListView: View {
    @StateObject private var viewModel = ViolationsListViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.violations) { violation in
                    ViolationCard(violation: violation)
                }
            }
            .navigationTitle("Violations")
            .onAppear {
                viewModel.loadData()
            }
        }
    }
}

// MARK: - Violation Card
struct ViolationCard: View {
    let violation: ViolationItem

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(violation.type.rawValue).font(.headline)
                Text(violation.timestamp, style: .date).font(.subheadline)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text("Vehicle: \(violation.vehicleId)").font(.subheadline)
                Text("Driver: \(violation.driverId)").font(.subheadline)
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct ViolationsListView_Previews: PreviewProvider {
    static var previews: some View {
        ViolationsListView()
    }
}
#endif