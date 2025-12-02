import SwiftUI
import AVFoundation

// MARK: - VIN & License Plate Scanner View
struct VINScannerView: View {
    @StateObject private var scanner = VINLicensePlateScanner.shared
    @Environment(\.dismiss) private var dismiss
    @State private var scanType: ScanType = .both
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage?
    @State private var showResultDetail = false

    var body: some View {
        NavigationView {
            ZStack {
                // Camera Preview
                if scanner.cameraPermissionGranted {
                    CameraPreview(scanner: scanner)
                        .edgesIgnoringSafeArea(.all)

                    // Overlay UI
                    VStack {
                        // Top Bar - Scan Type Selector
                        scanTypeSelector
                            .padding()
                            .background(.ultraThinMaterial)

                        Spacer()

                        // Recent Results
                        if !scanner.scannedResults.isEmpty {
                            recentResultsPanel
                        }

                        // Bottom Controls
                        controlButtons
                            .padding()
                            .background(.ultraThinMaterial)
                    }
                } else {
                    // Permission Request View
                    permissionView
                }
            }
            .navigationTitle("VIN & Plate Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        scanner.stopScanning()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showImagePicker = true
                    } label: {
                        Image(systemName: "photo.on.rectangle")
                    }
                }
            }
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(image: $selectedImage)
            }
            .sheet(isPresented: $showResultDetail) {
                if let result = scanner.currentResult {
                    ScanResultDetailView(result: result)
                }
            }
            .onChange(of: selectedImage) { newImage in
                if let image = newImage {
                    Task {
                        let results = await scanner.scanImage(image, type: scanType)
                        if !results.isEmpty {
                            showResultDetail = true
                        }
                    }
                }
            }
            .onAppear {
                Task {
                    let granted = await scanner.requestCameraPermission()
                    if granted {
                        if let session = scanner.setupCaptureSession(scanType: scanType) {
                            scanner.startScanning(type: scanType)
                        }
                    }
                }
            }
            .onDisappear {
                scanner.stopScanning()
            }
        }
    }

    // MARK: - Scan Type Selector
    private var scanTypeSelector: some View {
        Picker("Scan Type", selection: $scanType) {
            Text("VIN").tag(ScanType.vin)
            Text("License Plate").tag(ScanType.licensePlate)
            Text("Both").tag(ScanType.both)
        }
        .pickerStyle(.segmented)
        .onChange(of: scanType) { newType in
            scanner.stopScanning()
            if let session = scanner.setupCaptureSession(scanType: newType) {
                scanner.startScanning(type: newType)
            }
        }
    }

    // MARK: - Recent Results Panel
    private var recentResultsPanel: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Recent Scans")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)

                Spacer()

                Button {
                    scanner.clearResults()
                } label: {
                    Text("Clear")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(scanner.scannedResults.suffix(5)) { result in
                        ResultCard(result: result)
                            .onTapGesture {
                                scanner.currentResult = result
                                showResultDetail = true
                            }
                    }
                }
                .padding(.horizontal)
            }
            .frame(height: 100)
        }
        .background(.ultraThinMaterial)
    }

    // MARK: - Control Buttons
    private var controlButtons: some View {
        HStack(spacing: 20) {
            Button {
                showImagePicker = true
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.title2)
                    Text("From Photo")
                        .font(.caption)
                }
                .frame(maxWidth: .infinity)
            }

            Button {
                if scanner.isScanning {
                    scanner.stopScanning()
                } else {
                    scanner.startScanning(type: scanType)
                }
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: scanner.isScanning ? "pause.circle.fill" : "play.circle.fill")
                        .font(.title2)
                    Text(scanner.isScanning ? "Pause" : "Resume")
                        .font(.caption)
                }
                .frame(maxWidth: .infinity)
            }

            Button {
                if let result = scanner.scannedResults.last {
                    scanner.currentResult = result
                    showResultDetail = true
                }
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "list.bullet.rectangle")
                        .font(.title2)
                    Text("Results")
                        .font(.caption)
                }
                .frame(maxWidth: .infinity)
            }
            .disabled(scanner.scannedResults.isEmpty)
        }
        .foregroundColor(.blue)
    }

    // MARK: - Permission View
    private var permissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "camera.fill")
                .font(.system(size: 72))
                .foregroundColor(.gray)

            Text("Camera Access Required")
                .font(.title2)
                .fontWeight(.bold)

            Text("To scan VIN numbers and license plates, this app needs access to your camera.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                Task {
                    let granted = await scanner.requestCameraPermission()
                    if granted {
                        if let session = scanner.setupCaptureSession(scanType: scanType) {
                            scanner.startScanning(type: scanType)
                        }
                    } else if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                        await UIApplication.shared.open(settingsUrl)
                    }
                }
            } label: {
                Text("Enable Camera Access")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
            .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
}

// MARK: - Result Card
struct ResultCard: View {
    let result: ScanResult

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(result.type.displayName)
                .font(.caption2)
                .foregroundColor(.secondary)

            Text(result.text)
                .font(.system(.body, design: .monospaced))
                .fontWeight(.semibold)
                .lineLimit(1)

            HStack {
                Image(systemName: result.isValid ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                    .foregroundColor(result.isValid ? .green : .orange)
                    .font(.caption)

                Text(String(format: "%.0f%% confidence", result.confidence * 100))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(8)
        .frame(width: 180)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Camera Preview
struct CameraPreview: UIViewRepresentable {
    let scanner: VINLicensePlateScanner

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .black

        if let session = scanner.setupCaptureSession() {
            let previewLayer = AVCaptureVideoPreviewLayer(session: session)
            previewLayer.videoGravity = .resizeAspectFill
            previewLayer.frame = UIScreen.main.bounds
            view.layer.addSublayer(previewLayer)

            // Add scanning reticle overlay
            let reticleView = ScanningReticle()
            reticleView.frame = CGRect(x: 40, y: 200, width: UIScreen.main.bounds.width - 80, height: 120)
            view.addSubview(reticleView)
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
            previewLayer.frame = uiView.bounds
        }
    }
}

// MARK: - Scanning Reticle
class ScanningReticle: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        layer.borderWidth = 2
        layer.borderColor = UIColor.systemGreen.cgColor
        layer.cornerRadius = 12
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func draw(_ rect: CGRect) {
        super.draw(rect)

        guard let context = UIGraphicsGetCurrentContext() else { return }

        // Draw corner markers
        context.setStrokeColor(UIColor.systemGreen.cgColor)
        context.setLineWidth(4)

        let cornerLength: CGFloat = 20
        let corners = [
            (rect.minX, rect.minY), // Top-left
            (rect.maxX, rect.minY), // Top-right
            (rect.minX, rect.maxY), // Bottom-left
            (rect.maxX, rect.maxY)  // Bottom-right
        ]

        for corner in corners {
            context.move(to: CGPoint(x: corner.0, y: corner.1))
            if corner.0 == rect.minX {
                context.addLine(to: CGPoint(x: corner.0 + cornerLength, y: corner.1))
            } else {
                context.addLine(to: CGPoint(x: corner.0 - cornerLength, y: corner.1))
            }

            context.move(to: CGPoint(x: corner.0, y: corner.1))
            if corner.1 == rect.minY {
                context.addLine(to: CGPoint(x: corner.0, y: corner.1 + cornerLength))
            } else {
                context.addLine(to: CGPoint(x: corner.0, y: corner.1 - cornerLength))
            }
        }

        context.strokePath()
    }
}

// MARK: - Scan Result Detail View
struct ScanResultDetailView: View {
    let result: ScanResult
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Result Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text(result.type.displayName)
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text(result.text)
                            .font(.system(.title, design: .monospaced))
                            .fontWeight(.bold)

                        HStack {
                            Label(result.isValid ? "Valid" : "Invalid", systemImage: result.isValid ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                                .foregroundColor(result.isValid ? .green : .orange)

                            Spacer()

                            Text(String(format: "%.1f%% confidence", result.confidence * 100))
                                .foregroundColor(.secondary)
                        }
                        .font(.subheadline)
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)

                    // VIN Decoder (if VIN)
                    if result.type == .vin, let vinInfo = VINLicensePlateScanner.decodeVIN(result.text) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("VIN Details")
                                .font(.headline)

                            DetailRow(label: "Manufacturer", value: vinInfo.manufacturer)
                            DetailRow(label: "Year", value: vinInfo.year)
                            DetailRow(label: "WMI (World Manufacturer ID)", value: vinInfo.wmi)
                            DetailRow(label: "VDS (Vehicle Descriptor)", value: vinInfo.vds)
                            DetailRow(label: "VIS (Vehicle Identifier)", value: vinInfo.vis)
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                    }

                    // Timestamp
                    Text("Scanned: \(result.timestamp.formatted(date: .abbreviated, time: .shortened))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    // Actions
                    VStack(spacing: 12) {
                        Button {
                            UIPasteboard.general.string = result.text
                        } label: {
                            Label("Copy to Clipboard", systemImage: "doc.on.doc")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button {
                            // TODO: Add to vehicle flow
                        } label: {
                            Label("Add to Vehicle", systemImage: "car.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Scan Result")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Detail Row
struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Preview
struct VINScannerView_Previews: PreviewProvider {
    static var previews: some View {
        VINScannerView()
    }
}
