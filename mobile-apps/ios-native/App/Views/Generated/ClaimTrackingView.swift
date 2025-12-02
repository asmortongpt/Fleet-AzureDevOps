t
//
//  ClaimTrackingView.swift
//  Fleet Manager
//
//  The view to track claim status with timeline and updates
//

import SwiftUI

// MARK: - Claim Status Types
enum ClaimStatus: String {
    case filed = "Filed"
    case inReview = "In Review"
    case approved = "Approved"
    case denied = "Denied"
    case settled = "Settled"
}

struct ClaimItem: Identifiable {
    let id = UUID()
    let filedDate: Date
    let status: ClaimStatus
    let updates: [String]
    let vehicleId: String?
    let driverId: String?
}

// MARK: - Claim Tracking View
struct ClaimTrackingView: View {
    @StateObject private var viewModel = ClaimTrackingViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.claims) { claim in
                    ClaimCard(claim: claim)
                }
            }
            .navigationTitle("Claim Tracking")
        }
    }
}

// MARK: - Claim Card
struct ClaimCard: View {
    let claim: ClaimItem

    var body: some View {
        VStack(alignment: .leading) {
            Text("Claim ID: \(claim.id.uuidString)")
                .font(.headline)
            Text("Status: \(claim.status.rawValue)")
                .font(.subheadline)
            ForEach(claim.updates, id: \.self) { update in
                Text(update)
            }
            Spacer()
            Text("Filed on: \(claim.filedDate, formatter: DateFormatter())")
                .font(.caption)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
        .shadow(color: .gray, radius: 2, x: 0, y: 2)
        .accessibilityLabel("Claim details")
    }
}

// MARK: - Claim Tracking View Model
final class ClaimTrackingViewModel: ObservableObject {
    @Published var claims = [ClaimItem]()

    // This function fetches data from the server. This is a placeholder for actual implementation.
    func fetchData() {
        // Fetch data from server
        // For now, add some dummy data
        claims.append(ClaimItem(filedDate: Date(), status: .filed, updates: ["Initial filing"], vehicleId: "123", driverId: "456"))
    }
}

// MARK: - Preview
#if DEBUG
struct ClaimTrackingView_Previews: PreviewProvider {
    static var previews: some View {
        ClaimTrackingView()
    }
}
#endif