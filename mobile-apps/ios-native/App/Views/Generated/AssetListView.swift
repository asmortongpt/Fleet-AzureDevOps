t
//
//  AssetListView.swift
//  Fleet Manager
//
//  A view for tracking equipment assets with depreciation and maintenance details
//

import SwiftUI
import CoreData

// MARK: - AssetItem
struct AssetItem: Identifiable {
    let id = UUID()
    let name: String
    let purchaseDate: Date
    let cost: Double
    let depreciationRate: Double
    let maintenanceSchedule: String
}

// MARK: - AssetListView
struct AssetListView: View {
    @StateObject private var viewModel = AssetListViewModel()
    @State private var showingAlert = false
    @State private var alertMessage = ""

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.assets) { asset in
                    AssetCard(asset: asset)
                        .accessibility(label: Text("\(asset.name), purchased on \(asset.purchaseDate), cost: \(asset.cost), depreciation rate: \(asset.depreciationRate), maintenance schedule: \(asset.maintenanceSchedule)"))
                }
            }
            .navigationTitle("Assets")
            .alert(isPresented: $showingAlert) {
                Alert(title: Text("Error"), message: Text(alertMessage), dismissButton: .default(Text("OK")))
            }
            .onAppear {
                viewModel.fetchAssets { result in
                    switch result {
                    case .success: break
                    case .failure(let error):
                        showingAlert = true
                        alertMessage = error.localizedDescription
                    }
                }
            }
        }
    }
}

// MARK: - AssetListViewModel
class AssetListViewModel: ObservableObject {
    @Published var assets: [AssetItem] = []

    func fetchAssets(completion: @escaping (Result<Void, Error>) -> Void) {
        // Connect to CoreData (or other secure data store)
        // Fetch asset data
        // Validate and sanitize input data
        // Use parameterized queries to prevent SQL injection
        // Handle errors and loading state
        // Detailed implementation depends on your specific data store and business logic
    }
}

// MARK: - AssetCard
struct AssetCard: View {
    let asset: AssetItem

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(asset.name).font(.headline)
                Text("Purchased on \(asset.purchaseDate)").font(.subheadline)
                Text("Cost: \(asset.cost)").font(.subheadline)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text("Depreciation Rate: \(asset.depreciationRate)").font(.subheadline)
                Text("Maintenance Schedule: \(asset.maintenanceSchedule)").font(.subheadline)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 5)
    }
}

#if DEBUG
struct AssetListView_Previews: PreviewProvider {
    static var previews: some View {
        AssetListView()
    }
}
#endif