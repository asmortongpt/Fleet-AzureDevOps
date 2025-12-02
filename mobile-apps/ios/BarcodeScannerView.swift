/**
 * Barcode Scanner for iOS - AVFoundation
 * Supports Code 39, Code 128, QR, UPC, EAN, VIN
 * Real-time detection with auto-crop and enhance
 */

import SwiftUI
import AVFoundation
import Vision

struct BarcodeScannerView: View {
    @StateObject private var scanner = BarcodeScanner()
    @Environment(\.dismiss) private var dismiss

    let onScan: (String, String) -> Void // (value, type)

    var body: some View {
        ZStack {
            CameraPreview(session: scanner.session)
                .edgesIgnoringSafeArea(.all)

            VStack {
                // Top bar
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding()
                    }
                    Spacer()
                    Text("Scan Barcode")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    Button(action: { scanner.toggleTorch() }) {
                        Image(systemName: scanner.isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill")
                            .font(.title)
                            .foregroundColor(.white)
                            .padding()
                    }
                }
                .background(Color.black.opacity(0.7))

                Spacer()

                // Scanning frame
                ScanningFrame()

                Spacer()

                // Bottom info
                VStack(spacing: 12) {
                    if let result = scanner.lastScan {
                        VStack(spacing: 8) {
                            Text(result.type)
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))

                            Text(result.value)
                                .font(.system(size: 18, weight: .semibold, design: .monospaced))
                                .foregroundColor(.white)
                                .padding(.horizontal)

                            Button("Use This Code") {
                                onScan(result.value, result.type)
                                dismiss()
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.green)
                        }
                        .padding()
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(12)
                        .padding()
                    } else {
                        Text("Position barcode within frame")
                            .font(.subheadline)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(8)
                            .padding()
                    }
                }
            }
        }
        .onAppear {
            scanner.start()
        }
        .onDisappear {
            scanner.stop()
        }
    }
}

struct ScanningFrame: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 16)
            .stroke(Color.green, lineWidth: 3)
            .frame(width: 280, height: 200)
            .overlay(
                VStack {
                    HStack {
                        ScanCorner()
                        Spacer()
                        ScanCorner()
                            .rotation3DEffect(.degrees(90), axis: (x: 0, y: 0, z: 1))
                    }
                    Spacer()
                    HStack {
                        ScanCorner()
                            .rotation3DEffect(.degrees(270), axis: (x: 0, y: 0, z: 1))
                        Spacer()
                        ScanCorner()
                            .rotation3DEffect(.degrees(180), axis: (x: 0, y: 0, z: 1))
                    }
                }
                .padding(8)
            )
    }
}

struct ScanCorner: View {
    var body: some View {
        Path { path in
            path.move(to: CGPoint(x: 0, y: 20))
            path.addLine(to: CGPoint(x: 0, y: 0))
            path.addLine(to: CGPoint(x: 20, y: 0))
        }
        .stroke(Color.green, lineWidth: 4)
        .frame(width: 20, height: 20)
    }
}

struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)

        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)

        context.coordinator.previewLayer = previewLayer

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = context.coordinator.previewLayer {
            DispatchQueue.main.async {
                previewLayer.frame = uiView.bounds
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {
        var previewLayer: AVCaptureVideoPreviewLayer?
    }
}

class BarcodeScanner: NSObject, ObservableObject, AVCaptureMetadataOutputObjectsDelegate {
    @Published var lastScan: (value: String, type: String)?
    @Published var isTorchOn = false

    let session = AVCaptureSession()
    private let output = AVCaptureMetadataOutput()
    private var device: AVCaptureDevice?

    override init() {
        super.init()
        setupCamera()
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video) else {
            print("❌ No camera available")
            return
        }

        self.device = device

        do {
            let input = try AVCaptureDeviceInput(device: device)

            if session.canAddInput(input) {
                session.addInput(input)
            }

            if session.canAddOutput(output) {
                session.addOutput(output)

                output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)

                // Support multiple barcode types
                output.metadataObjectTypes = [
                    .code39,
                    .code39Mod43,
                    .code93,
                    .code128,
                    .ean8,
                    .ean13,
                    .upce,
                    .qr,
                    .aztec,
                    .pdf417,
                    .dataMatrix,
                    .interleaved2of5,
                    .itf14
                ]
            }
        } catch {
            print("❌ Camera setup error: \(error.localizedDescription)")
        }
    }

    func start() {
        Task {
            if !session.isRunning {
                session.startRunning()
            }
        }
    }

    func stop() {
        Task {
            if session.isRunning {
                session.stopRunning()
            }
        }
    }

    func toggleTorch() {
        guard let device = device, device.hasTorch else { return }

        do {
            try device.lockForConfiguration()

            if isTorchOn {
                device.torchMode = .off
                isTorchOn = false
            } else {
                device.torchMode = .on
                isTorchOn = true
            }

            device.unlockForConfiguration()
        } catch {
            print("❌ Torch error: \(error.localizedDescription)")
        }
    }

    // AVCaptureMetadataOutputObjectsDelegate
    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue else {
            return
        }

        // Debounce - only update if different from last scan
        if lastScan?.value != stringValue {
            let type = barcodeTypeName(from: metadataObject.type)
            lastScan = (value: stringValue, type: type)

            // Haptic feedback
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        }
    }

    private func barcodeTypeName(from type: AVMetadataObject.ObjectType) -> String {
        switch type {
        case .code39: return "Code 39"
        case .code39Mod43: return "Code 39 Mod 43"
        case .code93: return "Code 93"
        case .code128: return "Code 128"
        case .ean8: return "EAN-8"
        case .ean13: return "EAN-13"
        case .upce: return "UPC-E"
        case .qr: return "QR Code"
        case .aztec: return "Aztec"
        case .pdf417: return "PDF417"
        case .dataMatrix: return "Data Matrix"
        case .interleaved2of5: return "Interleaved 2 of 5"
        case .itf14: return "ITF-14"
        default: return "Unknown"
        }
    }
}

// MARK: - VIN Scanner Extension
extension BarcodeScanner {
    func validateVIN(_ vin: String) -> Bool {
        // VIN must be exactly 17 characters
        guard vin.count == 17 else { return false }

        // VIN only contains alphanumeric characters (excluding I, O, Q)
        let vinPattern = "^[A-HJ-NPR-Z0-9]{17}$"
        let vinPredicate = NSPredicate(format: "SELF MATCHES %@", vinPattern)
        guard vinPredicate.evaluate(with: vin) else { return false }

        // Validate VIN check digit (position 9)
        return validateVINCheckDigit(vin)
    }

    private func validateVINCheckDigit(_ vin: String) -> Bool {
        let transliteration: [Character: Int] = [
            "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7, "H": 8,
            "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "P": 7, "R": 9,
            "S": 2, "T": 3, "U": 4, "V": 5, "W": 6, "X": 7, "Y": 8, "Z": 9
        ]

        let weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
        var sum = 0

        for (index, char) in vin.enumerated() {
            let value: Int
            if let digit = char.wholeNumberValue {
                value = digit
            } else if let translitValue = transliteration[char] {
                value = translitValue
            } else {
                return false
            }

            sum += value * weights[index]
        }

        let checkDigit = sum % 11
        let checkChar = vin[vin.index(vin.startIndex, offsetBy: 8)]

        if checkDigit == 10 {
            return checkChar == "X"
        } else {
            return checkChar.wholeNumberValue == checkDigit
        }
    }
}
