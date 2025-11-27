t
//
//  ShiftSwapView.swift
//  Fleet Manager
//
//  Shift swap requests between drivers
//

import SwiftUI
import Combine

// MARK: - Shift Swap Request
struct ShiftSwap: Identifiable {
    let id = UUID()
    let fromDriverId: String
    let toDriverId: String
    let shiftDate: Date
    let status: ShiftSwapStatus
}

enum ShiftSwapStatus: String {
    case pending = "Pending"
    case accepted = "Accepted"
    case declined = "Declined"
}

// MARK: - ViewModel
class ShiftSwapViewModel: ObservableObject {
    @Published var shiftSwaps: [ShiftSwap] = []
    @Published var isLoading = false
    @Published var error: Error? = nil
    
    // Add your data fetching methods here
    // Make sure to handle loading and error states
}

// MARK: - ShiftSwapView
struct ShiftSwapView: View {
    @StateObject private var viewModel = ShiftSwapViewModel()
    
    var body: some View {
        NavigationView {
            List {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    if let error = viewModel.error {
                        Text(error.localizedDescription)
                    } else {
                        ForEach(viewModel.shiftSwaps) { swap in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text("\(swap.fromDriverId) ➡️ \(swap.toDriverId)")
                                        .font(.headline)
                                    Text("Status: \(swap.status.rawValue)")
                                        .font(.subheadline)
                                        .foregroundColor(swap.status == .pending ? .blue : (swap.status == .accepted ? .green : .red))
                                }
                                Spacer()
                                Text("\(swap.shiftDate, formatter: DateFormatter.shortDate)")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .padding(.vertical)
                        }
                    }
                }
            }
            .navigationTitle("Shift Swaps")
        }
    }
}

// MARK: - Preview Provider
#if DEBUG
struct ShiftSwapView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftSwapView()
    }
}
#endif