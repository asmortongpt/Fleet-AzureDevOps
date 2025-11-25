import SwiftUI
import AVFoundation

struct VideoCaptureView: View {
    var onCapture: (URL) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text("Video Capture View - Not Yet Implemented")
                .foregroundColor(.secondary)

            Button("Close") {
                dismiss()
            }
            .padding()
        }
    }
}
