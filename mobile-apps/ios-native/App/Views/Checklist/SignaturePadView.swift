//
//  SignaturePadView.swift
//  Fleet Manager
//
//  Signature capture view for checklist signatures
//

import SwiftUI

struct SignaturePadView: View {
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var signatureCanvas = SignatureCanvas()

    let onSave: (Data) -> Void

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerView

                // Canvas
                canvasView

                // Actions
                actionBar
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveSignature()
                    }
                    .disabled(!signatureCanvas.hasSignature)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private var headerView: some View {
        VStack(spacing: 8) {
            Image(systemName: "signature")
                .font(.system(size: 40))
                .foregroundColor(.blue)

            Text("Sign Here")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Use your finger to sign")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    private var canvasView: some View {
        ZStack {
            Rectangle()
                .fill(Color.white)
                .border(Color.gray.opacity(0.3), width: 2)

            SignatureCanvasView(canvas: signatureCanvas)

            if !signatureCanvas.hasSignature {
                Text("Sign here")
                    .font(.title3)
                    .foregroundColor(.gray.opacity(0.3))
                    .allowsHitTesting(false)
            }
        }
        .frame(height: 300)
        .padding()
    }

    private var actionBar: some View {
        HStack(spacing: 20) {
            Button(action: {
                signatureCanvas.clear()
            }) {
                HStack {
                    Image(systemName: "trash")
                    Text("Clear")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .foregroundColor(.red)
                .cornerRadius(12)
            }

            Button(action: {
                saveSignature()
            }) {
                HStack {
                    Image(systemName: "checkmark")
                    Text("Save Signature")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(signatureCanvas.hasSignature ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(!signatureCanvas.hasSignature)
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }

    private func saveSignature() {
        if let imageData = signatureCanvas.getImageData() {
            onSave(imageData)
            presentationMode.wrappedValue.dismiss()
        }
    }
}

// MARK: - Signature Canvas View

struct SignatureCanvasView: UIViewRepresentable {
    @ObservedObject var canvas: SignatureCanvas

    func makeUIView(context: Context) -> SignatureView {
        let view = SignatureView()
        view.onDrawingChanged = { paths in
            canvas.paths = paths
        }
        return view
    }

    func updateUIView(_ uiView: SignatureView, context: Context) {
        if canvas.shouldClear {
            uiView.clear()
            canvas.shouldClear = false
        }
    }
}

// MARK: - Signature Canvas Model

class SignatureCanvas: ObservableObject {
    @Published var paths: [UIBezierPath] = []
    @Published var shouldClear: Bool = false

    var hasSignature: Bool {
        !paths.isEmpty
    }

    func clear() {
        paths.removeAll()
        shouldClear = true
    }

    func getImageData() -> Data? {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 400, height: 200))
        let image = renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: CGSize(width: 400, height: 200)))

            UIColor.black.setStroke()
            for path in paths {
                path.stroke()
            }
        }
        return image.pngData()
    }
}

// MARK: - UIKit Signature View

class SignatureView: UIView {
    private var paths: [UIBezierPath] = []
    private var currentPath: UIBezierPath?

    var onDrawingChanged: (([UIBezierPath]) -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        isMultipleTouchEnabled = false
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let point = touch.location(in: self)

        currentPath = UIBezierPath()
        currentPath?.lineWidth = 2.0
        currentPath?.lineCapStyle = .round
        currentPath?.lineJoinStyle = .round
        currentPath?.move(to: point)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let point = touch.location(in: self)

        currentPath?.addLine(to: point)
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let path = currentPath {
            paths.append(path)
            onDrawingChanged?(paths)
        }
        currentPath = nil
    }

    override func draw(_ rect: CGRect) {
        UIColor.black.setStroke()

        for path in paths {
            path.stroke()
        }

        currentPath?.stroke()
    }

    func clear() {
        paths.removeAll()
        currentPath = nil
        setNeedsDisplay()
    }
}

// MARK: - Preview

#Preview {
    SignaturePadView { data in
        print("Signature saved: \(data.count) bytes")
    }
}
