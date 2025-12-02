t
//
//  WarrantyDetailView.swift
//  Fleet Manager
//
//  A detailed view of warranty with coverage terms and claim history
//

import SwiftUI
import Combine

// MARK: - Warranty Details
struct WarrantyDetail: Identifiable {
    let id = UUID()
    let coverageTerms: String
    let claimHistory: [Claim]
}

struct Claim: Identifiable {
    let id = UUID()
    let claimDate: Date
    let claimDescription: String
    let claimStatus: ClaimStatus
}

enum ClaimStatus: String {
    case submitted = "Submitted"
    case inReview = "In Review"
    case approved = "Approved"
    case rejected = "Rejected"
}

// MARK: - ViewModel
class WarrantyDetailViewModel: ObservableObject {
    @Published var warrantyDetails = WarrantyDetail(coverageTerms: "", claimHistory: [])
    @Published var isLoading = false
    @Published var error: Error?
    private var cancellables = Set<AnyCancellable>()
    
    func loadWarrantyDetails(for vehicleId: String) {
        self.isLoading = true
        // Use your own API service to fetch warranty details
        APIService.fetchWarrantyDetails(for: vehicleId)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { completion in
                self.isLoading = false
                switch completion {
                case .failure(let error):
                    self.error = error
                case .finished:
                    break
                }
            }, receiveValue: { warrantyDetails in
                self.warrantyDetails = warrantyDetails
            })
            .store(in: &cancellables)
    }
}

// MARK: - View
struct WarrantyDetailView: View {
    @StateObject private var viewModel = WarrantyDetailViewModel()
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Coverage Terms")) {
                    Text(viewModel.warrantyDetails.coverageTerms)
                }
                
                Section(header: Text("Claim History")) {
                    ForEach(viewModel.warrantyDetails.claimHistory) { claim in
                        VStack(alignment: .leading) {
                            Text("Claim Date: \(claim.claimDate)")
                            Text("Description: \(claim.claimDescription)")
                            Text("Status: \(claim.claimStatus.rawValue)")
                        }
                    }
                }
            }
            .navigationTitle("Warranty Details")
            .onAppear {
                viewModel.loadWarrantyDetails(for: "Vehicle ID") // replace with actual vehicle ID
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct WarrantyDetailView_Previews: PreviewProvider {
    static var previews: some View {
        WarrantyDetailView()
    }
}
#endif