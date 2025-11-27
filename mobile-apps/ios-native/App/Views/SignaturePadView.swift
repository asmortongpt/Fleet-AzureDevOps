/**
 * Digital Signature Pad
 * Allows users to sign inspection forms digitally
 */

import SwiftUI
import PencilKit

// MARK: - Signature Pad View
struct SignaturePadView: View {
    @Binding var signatureImage: UIImage?
    @Binding var isPresented: Bool

    @State private var canvasView = PKCanvasView()
    @State private var showClearConfirmation = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Instructions
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: "hand.draw.fill")
                            .font(.title2)
                            .foregroundColor(.blue)

                        Text("Sign below to complete the inspection")
                            .font(.headline)
                    }

                    Text("Use your finger or Apple Pencil to sign")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.systemGray6))

                // Signature Canvas
                SignatureCanvasView(canvasView: $canvasView)
                    .border(Color.gray.opacity(0.3), width: 1)
                    .padding()

                // Name Line
                VStack(spacing: 4) {
                    Divider()
                        .padding(.horizontal, 60)

                    Text("Signature")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)

                Spacer()

                // Action Buttons
                HStack(spacing: 16) {
                    // Clear Button
                    Button(action: {
                        showClearConfirmation = true
                    }) {
                        HStack {
                            Image(systemName: "arrow.uturn.backward")
                            Text("Clear")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                    }

                    // Done Button
                    Button(action: saveSignature) {
                        HStack {
                            Image(systemName: "checkmark")
                            Text("Done")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canvasView.drawing.bounds.isEmpty ? Color.gray : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(canvasView.drawing.bounds.isEmpty)
                }
                .padding()
            }
            .navigationTitle("Digital Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
            }
            .alert("Clear Signature?", isPresented: $showClearConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) {
                    clearSignature()
                }
            } message: {
                Text("This will erase your current signature.")
            }
        }
    }

    private func saveSignature() {
        let drawing = canvasView.drawing
        let image = drawing.image(from: drawing.bounds, scale: 2.0)
        signatureImage = image
        isPresented = false
    }

    private func clearSignature() {
        canvasView.drawing = PKDrawing()
    }
}

// MARK: - Signature Canvas View
struct SignatureCanvasView: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput
        canvasView.tool = PKInkingTool(.pen, color: .black, width: 3)
        canvasView.backgroundColor = .white
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        // Update if needed
    }
}

// MARK: - Alternative Signature Pad (SwiftUI Native)
struct AlternativeSignaturePad: View {
    @Binding var signatureImage: UIImage?
    @Binding var isPresented: Bool

    @State private var currentPath = Path()
    @State private var paths: [Path] = []
    @State private var showClearConfirmation = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Instructions
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: "hand.draw.fill")
                            .font(.title2)
                            .foregroundColor(.blue)

                        Text("Sign below to complete the inspection")
                            .font(.headline)
                    }

                    Text("Use your finger to sign")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.systemGray6))

                // Canvas
                ZStack {
                    Rectangle()
                        .fill(Color.white)
                        .border(Color.gray.opacity(0.3), width: 1)

                    // Draw paths
                    ForEach(paths.indices, id: \.self) { index in
                        paths[index]
                            .stroke(Color.black, lineWidth: 3)
                    }

                    currentPath
                        .stroke(Color.black, lineWidth: 3)
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let newPoint = value.location
                            if currentPath.isEmpty {
                                currentPath.move(to: newPoint)
                            } else {
                                currentPath.addLine(to: newPoint)
                            }
                        }
                        .onEnded { _ in
                            paths.append(currentPath)
                            currentPath = Path()
                        }
                )
                .frame(height: 200)
                .padding()

                // Name Line
                VStack(spacing: 4) {
                    Divider()
                        .padding(.horizontal, 60)

                    Text("Signature")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)

                Spacer()

                // Action Buttons
                HStack(spacing: 16) {
                    // Clear Button
                    Button(action: {
                        showClearConfirmation = true
                    }) {
                        HStack {
                            Image(systemName: "arrow.uturn.backward")
                            Text("Clear")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                    }

                    // Done Button
                    Button(action: saveSignature) {
                        HStack {
                            Image(systemName: "checkmark")
                            Text("Done")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(paths.isEmpty ? Color.gray : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(paths.isEmpty)
                }
                .padding()
            }
            .navigationTitle("Digital Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
            }
            .alert("Clear Signature?", isPresented: $showClearConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) {
                    clearSignature()
                }
            } message: {
                Text("This will erase your current signature.")
            }
        }
    }

    private func saveSignature() {
        // Render paths to image
        let renderer = ImageRenderer(content: drawingView)
        renderer.scale = 2.0

        if let image = renderer.uiImage {
            signatureImage = image
            isPresented = false
        }
    }

    private var drawingView: some View {
        ZStack {
            Rectangle()
                .fill(Color.white)

            ForEach(paths.indices, id: \.self) { index in
                paths[index]
                    .stroke(Color.black, lineWidth: 3)
            }
        }
        .frame(width: 400, height: 200)
    }

    private func clearSignature() {
        paths.removeAll()
        currentPath = Path()
    }
}

// MARK: - Signature Display View
struct SignatureDisplayView: View {
    let signatureImage: UIImage?
    let onEdit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Inspector Signature", systemImage: "signature")
                .font(.headline)

            if let signature = signatureImage {
                HStack {
                    Image(uiImage: signature)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 100)
                        .background(Color.white)
                        .border(Color.gray.opacity(0.3), width: 1)

                    Spacer()

                    Button(action: onEdit) {
                        HStack {
                            Image(systemName: "pencil")
                            Text("Edit")
                        }
                        .font(.subheadline)
                        .foregroundColor(.blue)
                    }
                }
            } else {
                Button(action: onEdit) {
                    HStack {
                        Image(systemName: "signature")
                        Text("Add Signature")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .foregroundColor(.blue)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Preview
#if DEBUG
struct SignaturePadView_Previews: PreviewProvider {
    static var previews: some View {
        SignaturePadView(
            signatureImage: .constant(nil),
            isPresented: .constant(true)
        )
    }
}
#endif
