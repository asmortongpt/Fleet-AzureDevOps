import SwiftUI
import AVFoundation

struct CameraView: View {
    @Binding var image: UIImage?
    var onCapture: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text("Camera View - Not Yet Implemented")
                .foregroundColor(.secondary)

            Button("Close") {
                dismiss()
            }
            .padding()
        }
    }
}
