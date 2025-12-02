//
//  ARVehicleView.swift
//  Fleet Management
//
//  High-fidelity AR vehicle viewer using ARKit and Reality Kit
//  Supports iOS 13+ with AR Quick Look integration
//

import SwiftUI
import ARKit
import RealityKit
import QuickLook

/// Main AR Vehicle View Controller
@available(iOS 13.0, *)
struct ARVehicleView: View {
    let vehicleId: Int
    let modelURL: URL

    @State private var arViewContainer: ARViewContainer?
    @State private var showARQuickLook = false
    @State private var sessionInfo = ""
    @State private var placementAttempts = 0
    @State private var successfulPlacements = 0
    @State private var screenshotsTaken = 0

    var body: some View {
        ZStack {
            // AR View
            if let arViewContainer = arViewContainer {
                arViewContainer
                    .edgesIgnoringSafeArea(.all)
            } else {
                Color.black.edgesIgnoringSafeArea(.all)
            }

            // UI Overlays
            VStack {
                // Top Bar
                HStack {
                    Button(action: {
                        // Close AR view
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                            .shadow(radius: 4)
                    }

                    Spacer()

                    Text(sessionInfo)
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(8)

                    Spacer()

                    Button(action: takeScreenshot) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                            .shadow(radius: 4)
                    }
                }
                .padding()

                Spacer()

                // Bottom Controls
                VStack(spacing: 16) {
                    Text("Point camera at the ground to place vehicle")
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .padding(12)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(12)

                    HStack(spacing: 24) {
                        // AR Quick Look Button
                        Button(action: {
                            showARQuickLook = true
                        }) {
                            VStack {
                                Image(systemName: "arkit")
                                    .font(.system(size: 32))
                                Text("Quick Look")
                                    .font(.caption)
                            }
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.blue.opacity(0.8))
                            .cornerRadius(12)
                        }

                        // Reset Button
                        Button(action: resetAR) {
                            VStack {
                                Image(systemName: "arrow.counterclockwise")
                                    .font(.system(size: 32))
                                Text("Reset")
                                    .font(.caption)
                            }
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.gray.opacity(0.8))
                            .cornerRadius(12)
                        }

                        // Scale Toggle
                        Button(action: toggleScale) {
                            VStack {
                                Image(systemName: "slider.horizontal.3")
                                    .font(.system(size: 32))
                                Text("Scale")
                                    .font(.caption)
                            }
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.gray.opacity(0.8))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
        }
        .onAppear {
            setupARView()
            trackARSession()
        }
        .onDisappear {
            endARSession()
        }
        .sheet(isPresented: $showARQuickLook) {
            ARQuickLookView(modelURL: modelURL)
        }
    }

    private func setupARView() {
        arViewContainer = ARViewContainer(
            modelURL: modelURL,
            onPlacementAttempt: { success in
                placementAttempts += 1
                if success {
                    successfulPlacements += 1
                }
                updateSessionInfo()
            }
        )
    }

    private func updateSessionInfo() {
        sessionInfo = "Placements: \(successfulPlacements)/\(placementAttempts)"
    }

    private func takeScreenshot() {
        // Capture AR view screenshot
        screenshotsTaken += 1
        // Implementation would capture the AR view and save
    }

    private func resetAR() {
        arViewContainer?.reset()
        placementAttempts = 0
        successfulPlacements = 0
        updateSessionInfo()
    }

    private func toggleScale() {
        arViewContainer?.toggleScale()
    }

    private func trackARSession() {
        // Track session start with API
        let sessionData: [String: Any] = [
            "platform": "iOS",
            "arFramework": "ARKit",
            "deviceModel": UIDevice.current.model,
            "osVersion": UIDevice.current.systemVersion
        ]

        // POST to /api/vehicles/:id/ar-session
        APIClient.shared.trackARSession(vehicleId: vehicleId, data: sessionData)
    }

    private func endARSession() {
        // Track session end with metrics
        let updates: [String: Any] = [
            "placementAttempts": placementAttempts,
            "successfulPlacements": successfulPlacements,
            "screenshotsTaken": screenshotsTaken
        ]

        // PUT to /api/ar-sessions/:sessionId
        // Implementation would send final metrics
    }
}

/// AR View Container (RealityKit)
@available(iOS 13.0, *)
struct ARViewContainer: UIViewRepresentable {
    let modelURL: URL
    let onPlacementAttempt: ((Bool) -> Void)?

    @State private var arView: ARView?
    @State private var vehicleEntity: ModelEntity?
    @State private var currentScale: Float = 1.0

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        // Configure AR session
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal]
        configuration.environmentTexturing = .automatic

        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
        }

        arView.session.run(configuration)

        // Add coaching overlay
        let coachingOverlay = ARCoachingOverlayView()
        coachingOverlay.session = arView.session
        coachingOverlay.goal = .horizontalPlane
        coachingOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        arView.addSubview(coachingOverlay)

        // Add tap gesture for placement
        let tapGesture = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleTap(_:))
        )
        arView.addGestureRecognizer(tapGesture)

        // Load 3D model
        loadModel(in: arView)

        self.arView = arView
        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Update if needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    private func loadModel(in arView: ARView) {
        // Load USDZ model
        guard let entity = try? ModelEntity.load(contentsOf: modelURL) else {
            print("Failed to load model from \(modelURL)")
            return
        }

        // Configure entity
        entity.scale = SIMD3(x: currentScale, y: currentScale, z: currentScale)
        entity.generateCollisionShapes(recursive: true)

        // Enable gestures
        arView.installGestures([.rotation, .scale], for: entity)

        vehicleEntity = entity
    }

    func reset() {
        guard let arView = arView else { return }

        // Remove existing entities
        arView.scene.anchors.removeAll()

        // Restart session
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal]
        arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
    }

    func toggleScale() {
        guard let entity = vehicleEntity else { return }

        // Cycle through scales: 1.0 -> 0.5 -> 2.0 -> 1.0
        if currentScale == 1.0 {
            currentScale = 0.5
        } else if currentScale == 0.5 {
            currentScale = 2.0
        } else {
            currentScale = 1.0
        }

        entity.scale = SIMD3(x: currentScale, y: currentScale, z: currentScale)
    }

    class Coordinator: NSObject {
        var parent: ARViewContainer

        init(_ parent: ARViewContainer) {
            self.parent = parent
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let arView = parent.arView,
                  let vehicleEntity = parent.vehicleEntity else {
                parent.onPlacementAttempt?(false)
                return
            }

            let location = gesture.location(in: arView)

            // Raycast to find horizontal plane
            let results = arView.raycast(
                from: location,
                allowing: .estimatedPlane,
                alignment: .horizontal
            )

            guard let result = results.first else {
                parent.onPlacementAttempt?(false)
                return
            }

            // Create anchor at hit location
            let anchor = AnchorEntity(world: result.worldTransform)
            anchor.addChild(vehicleEntity.clone(recursive: true))

            // Add to scene
            arView.scene.addAnchor(anchor)

            parent.onPlacementAttempt?(true)
        }
    }
}

/// AR Quick Look View (iOS native AR viewer)
@available(iOS 13.0, *)
struct ARQuickLookView: UIViewControllerRepresentable {
    let modelURL: URL

    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: QLPreviewController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(modelURL: modelURL)
    }

    class Coordinator: NSObject, QLPreviewControllerDataSource {
        let modelURL: URL

        init(modelURL: URL) {
            self.modelURL = modelURL
        }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
            return 1
        }

        func previewController(
            _ controller: QLPreviewController,
            previewItemAt index: Int
        ) -> QLPreviewItem {
            return modelURL as QLPreviewItem
        }
    }
}

/// API Client for tracking AR sessions
class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://api.fleet.com" // Configure your API base URL

    func trackARSession(vehicleId: Int, data: [String: Any]) {
        let url = URL(string: "\(baseURL)/api/vehicles/\(vehicleId)/ar-session")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: data)

            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("Error tracking AR session: \(error)")
                    return
                }

                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let sessionId = json["sessionId"] as? Int {
                    UserDefaults.standard.set(sessionId, forKey: "currentARSessionId")
                }
            }.resume()
        } catch {
            print("Error serializing session data: \(error)")
        }
    }

    func endARSession(updates: [String: Any]) {
        guard let sessionId = UserDefaults.standard.value(forKey: "currentARSessionId") as? Int else {
            return
        }

        let url = URL(string: "\(baseURL)/api/ar-sessions/\(sessionId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: updates)

            URLSession.shared.dataTask(with: request) { _, _, error in
                if let error = error {
                    print("Error ending AR session: \(error)")
                }
            }.resume()
        } catch {
            print("Error serializing update data: \(error)")
        }
    }
}

/// Usage Example:
///
/// ```swift
/// let modelURL = URL(string: "https://storage.azure.com/models/vehicle-123.usdz")!
/// ARVehicleView(vehicleId: 123, modelURL: modelURL)
/// ```
