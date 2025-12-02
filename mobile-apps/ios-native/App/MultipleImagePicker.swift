import SwiftUI
import PhotosUI

struct MultipleImagePicker: View {
    @Binding var images: [UIImage]

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text("Multiple Image Picker - Not Yet Implemented")
                .foregroundColor(.secondary)

            Button("Close") {
                dismiss()
            }
            .padding()
        }
    }
}
