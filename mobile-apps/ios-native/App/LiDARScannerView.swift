import SwiftUI
import ARKit
import RealityKit

struct LiDARScannerView: View {
    var onCapture: (Data) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text("LiDAR Scanner View - Not Yet Implemented")
                .foregroundColor(.secondary)

            Button("Close") {
                dismiss()
            }
            .padding()
        }
    }
}
