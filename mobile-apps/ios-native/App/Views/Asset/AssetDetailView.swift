import SwiftUI

struct AssetDetailView: View {
    let asset: Asset
    @ObservedObject var viewModel: AssetViewModel
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var showingAssignSheet = false
    @State private var showingPhotoSheet = false
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                    }
}

    }
}

// MARK: - Edit Asset View (Stub)
struct EditAssetView: View {
    let asset: Asset
    @ObservedObject var viewModel: AssetViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Text("Edit asset functionality coming soon")
            }
            .navigationTitle("Edit Asset")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    let sampleAsset = Asset(
        id: "1",
        tenantId: "tenant1",
        number: "T-1001",
        type: .trailer,
        name: "Utility Trailer 20ft",
        description: "Heavy duty utility trailer for equipment transport",
        serialNumber: "UT20-2024-001",
        make: "Big Tex",
        model: "14LX-20",
        status: .available,
        condition: .good,
        location: AssetLocation(lat: 28.5383, lng: -81.3792, address: "Orlando, FL", facility: "Main Yard"),
        assignedTo: nil,
        purchaseDate: "2024-01-15T00:00:00Z",
        purchaseCost: 8500.00,
        lastInspection: "2024-11-01T00:00:00Z",
        nextInspection: "2025-02-01T00:00:00Z",
        photos: [],
        documents: [],
        customFields: nil
    )

    return AssetDetailView(asset: sampleAsset, viewModel: AssetViewModel())
}
