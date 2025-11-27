/**
 * LiDARScannerView - 3D scanning for damage reports
 * Uses ARKit and RealityKit for LiDAR-based 3D scanning
 * Available on iPhone 12 Pro and later with LiDAR sensor
 */

import SwiftUI
import ARKit
import RealityKit
import SceneKit

struct LiDARScannerView: View {
    var onCapture: (LiDARScanData) -> Void

    @StateObject private var viewModel = LiDARScannerViewModel()
    @Environment(\.dismiss) private var dismiss

    @State private var showingError = false

    var body: some View {
        ZStack {
            // AR View
            ARViewContainer(viewModel: viewModel)
                .edgesIgnoringSafeArea(.all)

            VStack {
                // Top controls
                topControls

                Spacer()

                // Scanning info
                if viewModel.isScanning {
                    scanningInfo
                }

                Spacer()

                // Bottom controls
                bottomControls
            }
        }
        .onAppear {
            viewModel.startSession()
        }
        .onDisappear {
            viewModel.stopSession()
        }
        .alert("Scanner Error", isPresented: $showingError) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text(viewModel.errorMessage ?? "LiDAR scanning failed")
        }
        .onChange(of: viewModel.errorMessage) { error in
            if error != nil {
                showingError = true
            }
        }
    }

    // MARK: - Top Controls
    private var topControls: some View {
        HStack {
            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundColor(.white)
                    .padding()
            }

            Spacer()

            Text("LiDAR Scanner")
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.black.opacity(0.7))
                .cornerRadius(8)

            Spacer()

            // Point count indicator
            if viewModel.isScanning {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(viewModel.pointCount)")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("points")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.purple.opacity(0.8))
                .cornerRadius(8)
                .padding()
            }
        }
        .background(Color.black.opacity(0.7))
    }

    // MARK: - Scanning Info
    private var scanningInfo: some View {
        VStack(spacing: 12) {
            // Scanning indicator
            HStack(spacing: 12) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                Text("Scanning...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(Color.purple.opacity(0.8))
            .cornerRadius(12)

            // Instructions
            Text("Move device slowly around the object")
                .font(.caption)
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Color.black.opacity(0.7))
                .cornerRadius(8)
        }
    }

    // MARK: - Bottom Controls
    private var bottomControls: some View {
        VStack(spacing: 20) {
            // Scan quality indicator
            if viewModel.isScanning {
                scanQualityIndicator
            }

            // Control buttons
            HStack(spacing: 40) {
                // Start/Stop scanning
                Button(action: {
                    if viewModel.isScanning {
                        viewModel.stopScanning()
                    } else {
                        viewModel.startScanning()
                    }
                }) {
                    VStack(spacing: 8) {
                        Image(systemName: viewModel.isScanning ? "stop.circle.fill" : "cube.fill")
                            .font(.system(size: 40))
                            .foregroundColor(viewModel.isScanning ? .red : .purple)

                        Text(viewModel.isScanning ? "Stop" : "Start Scan")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }

                // Save scan
                if !viewModel.isScanning && viewModel.pointCount > 0 {
                    Button(action: saveScan) {
                        VStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.green)

                            Text("Save Scan")
                                .font(.caption)
                                .foregroundColor(.white)
                        }
                    }
                }
            }
            .padding(.bottom, 40)
        }
    }

    // MARK: - Scan Quality Indicator
    private var scanQualityIndicator: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(qualityColor)
                .frame(width: 12, height: 12)

            Text(qualityText)
                .font(.subheadline)
                .foregroundColor(.white)

            Spacer()

            Text("\(Int(viewModel.scanProgress * 100))%")
                .font(.subheadline)
                .foregroundColor(.white)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.7))
        .cornerRadius(8)
        .padding(.horizontal)
    }

    private var qualityColor: Color {
        if viewModel.scanProgress < 0.3 {
            return .red
        } else if viewModel.scanProgress < 0.7 {
            return .orange
        } else {
            return .green
        }
    }

    private var qualityText: String {
        if viewModel.scanProgress < 0.3 {
            return "Low Coverage"
        } else if viewModel.scanProgress < 0.7 {
            return "Medium Coverage"
        } else {
            return "Good Coverage"
        }
    }

    // MARK: - Actions
    private func saveScan() {
        viewModel.exportScan { scanData in
            onCapture(scanData)
            dismiss()
        }
    }
}

// MARK: - LiDAR Scanner View Model
@MainActor
class LiDARScannerViewModel: ObservableObject {
    @Published var isScanning = false
    @Published var pointCount = 0
    @Published var scanProgress: Double = 0.0
    @Published var errorMessage: String?

    private var arView: ARView?
    private var meshAnchors: [ARMeshAnchor] = []
    private var scannedPoints: [SIMD3<Float>] = []

    func startSession() {
        // Check if device supports LiDAR
        guard ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) else {
            errorMessage = "LiDAR not supported on this device"
            return
        }
    }

    func startScanning() {
        isScanning = true
        scannedPoints.removeAll()
        meshAnchors.removeAll()
        pointCount = 0
        scanProgress = 0.0
    }

    func stopScanning() {
        isScanning = false
    }

    func stopSession() {
        if let arView = arView {
            arView.session.pause()
        }
    }

    func setARView(_ arView: ARView) {
        self.arView = arView
    }

    func updateMeshAnchors(_ anchors: [ARMeshAnchor]) {
        guard isScanning else { return }

        meshAnchors = anchors
        var totalPoints = 0

        for anchor in anchors {
            let geometry = anchor.geometry
            totalPoints += geometry.vertices.count
        }

        pointCount = totalPoints

        // Calculate progress based on point density
        scanProgress = min(Double(totalPoints) / 10000.0, 1.0)
    }

    func exportScan(completion: @escaping (LiDARScanData) -> Void) {
        guard !meshAnchors.isEmpty else {
            errorMessage = "No scan data to export"
            return
        }

        // Export to USDZ format
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let scene = try self.createScene(from: self.meshAnchors)
                let tempURL = FileManager.default.temporaryDirectory
                    .appendingPathComponent("scan_\(UUID().uuidString).usdz")

                try scene.write(to: tempURL)

                let data = try Data(contentsOf: tempURL)
                let scanData = LiDARScanData(data: data, format: "usdz")

                DispatchQueue.main.async {
                    completion(scanData)
                }
            } catch {
                DispatchQueue.main.async {
                    self.errorMessage = "Failed to export scan: \(error.localizedDescription)"
                }
            }
        }
    }

    private func createScene(from anchors: [ARMeshAnchor]) throws -> SCNScene {
        let scene = SCNScene()

        for anchor in anchors {
            let geometry = anchor.geometry
            let vertices = geometry.vertices
            let faces = geometry.faces

            // Create SCNGeometry from mesh data
            var scnVertices: [SCNVector3] = []
            for i in 0..<vertices.count {
                let vertex = vertices[i]
                scnVertices.append(SCNVector3(vertex.x, vertex.y, vertex.z))
            }

            // Create geometry source
            let vertexSource = SCNGeometrySource(vertices: scnVertices)

            // Create geometry elements (faces)
            var indices: [Int32] = []
            for i in 0..<faces.count {
                let face = faces[i]
                indices.append(Int32(face[0]))
                indices.append(Int32(face[1]))
                indices.append(Int32(face[2]))
            }

            let indexData = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
            let geometryElement = SCNGeometryElement(
                data: indexData,
                primitiveType: .triangles,
                primitiveCount: faces.count,
                bytesPerIndex: MemoryLayout<Int32>.size
            )

            // Create SCN geometry
            let scnGeometry = SCNGeometry(sources: [vertexSource], elements: [geometryElement])

            // Create material
            let material = SCNMaterial()
            material.diffuse.contents = UIColor.purple.withAlphaComponent(0.5)
            material.isDoubleSided = true
            scnGeometry.materials = [material]

            // Create node and add to scene
            let node = SCNNode(geometry: scnGeometry)
            scene.rootNode.addChildNode(node)
        }

        return scene
    }
}

// MARK: - AR View Container
struct ARViewContainer: UIViewRepresentable {
    @ObservedObject var viewModel: LiDARScannerViewModel

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        // Configure AR session
        let configuration = ARWorldTrackingConfiguration()

        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            configuration.sceneReconstruction = .meshWithClassification
        }

        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic

        arView.session.run(configuration)
        arView.session.delegate = context.coordinator

        // Set up view model
        viewModel.setARView(arView)

        // Enable debug options
        #if DEBUG
        arView.debugOptions = [.showSceneUnderstanding]
        #endif

        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel)
    }

    class Coordinator: NSObject, ARSessionDelegate {
        let viewModel: LiDARScannerViewModel

        init(viewModel: LiDARScannerViewModel) {
            self.viewModel = viewModel
        }

        func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
            let meshAnchors = anchors.compactMap { $0 as? ARMeshAnchor }
            if !meshAnchors.isEmpty {
                Task { @MainActor in
                    viewModel.updateMeshAnchors(meshAnchors)
                }
            }
        }

        func session(_ session: ARSession, didFailWithError error: Error) {
            Task { @MainActor in
                viewModel.errorMessage = error.localizedDescription
            }
        }
    }
}
