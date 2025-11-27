t
//
//  WarrantyManagementView.swift
//  Fleet Manager
//
//  This view helps manage the warranty of vehicles in the fleet
//

import SwiftUI
import Combine

// MARK: - WarrantyItem

struct WarrantyItem: Identifiable {
    let id = UUID()
    let vehicleId: String
    let warrantyExpiryDate: Date
}

// MARK: - WarrantyManagementViewModel

class WarrantyManagementViewModel: ObservableObject {
    @Published var warranties: [WarrantyItem] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadWarranties()
    }
    
    func loadWarranties() {
        isLoading = true
        // Call API to fetch warranties here
        // Add fetched warranties to `warranties` array
    }
}

// MARK: - WarrantyManagementView

struct WarrantyManagementView: View {
    @StateObject private var viewModel = WarrantyManagementViewModel()
    
    var body: some View {
        NavigationView {
            List {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.error {
                    Text(error.localizedDescription)
                } else {
                    ForEach(viewModel.warranties) { warranty in
                        WarrantyCard(warranty: warranty)
                    }
                }
            }
            .navigationTitle("Warranty Management")
            .accessibility(identifier: "warrantyManagementView")
        }
    }
}

// MARK: - WarrantyCard

struct WarrantyCard: View {
    let warranty: WarrantyItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Vehicle ID: \(warranty.vehicleId)")
                .font(.headline)
            Text("Warranty Expiry: \(dateFormatter.string(from: warranty.warrantyExpiryDate))")
                .font(.subheadline)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(10)
        .accessibility(identifier: "warrantyCard")
    }
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }
}

// MARK: - Previews

#if DEBUG
struct WarrantyManagementView_Previews: PreviewProvider {
    static var previews: some View {
        WarrantyManagementView()
    }
}
#endif