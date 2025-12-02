/**
 * LiDAR Scanner for Vehicle Damage Detection
 * Uses ARKit and LiDAR to scan vehicle surfaces for damage
 */

import Foundation
import ARKit
import RealityKit
import Combine

// MARK: - LiDAR Scanner
@available(iOS 14.0, *)
class LiDARScanner: NSObject, ObservableObject {
    @Published var scanProgress: Double = 0.0
    @Published var isScanning = false
    @Published var detectedDamage: [DamageArea] = []

    private var arSession: ARSession?
    private var sceneReconstruction: ARMeshAnchor?
    private var meshAnchors: [ARMeshAnchor] = []
    private var scanStartTime: Date?
    private var scanDuration: TimeInterval = 10.0 // Scan for 10 seconds
    private var timer: Timer?
    private var completionHandler: ((Result<Data, Error>) -> Void)?

    // MARK: - Session Management
    func startSession() {
        guard ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) else {
            print("LiDAR not available on this device")
            return
        }

        let configuration = ARWorldTrackingConfiguration()
        configuration.sceneReconstruction = .mesh
        configuration.planeDetection = [.horizontal, .vertical]

        arSession = ARSession()
        arSession?.delegate = self
        arSession?.run(configuration)
    }

    func stopSession() {
        arSession?.pause()
        timer?.invalidate()
        timer = nil
        isScanning = false
    }

    // MARK: - Scanning
    func startScanning(completion: @escaping (Result<Data, Error>) -> Void) {
        guard arSession != nil else {
            completion(.failure(LiDARError.sessionNotInitialized))
            return
        }

        isScanning = true
        scanStartTime = Date()
        meshAnchors.removeAll()
        detectedDamage.removeAll()
        scanProgress = 0.0
        completionHandler = completion

        // Start progress timer
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self, let startTime = self.scanStartTime else { return }

            let elapsed = Date().timeIntervalSince(startTime)
            self.scanProgress = min(elapsed / self.scanDuration, 1.0)

            if elapsed >= self.scanDuration {
                self.finishScanning()
            }
        }
    }

    func stopScanning() {
        timer?.invalidate()
        timer = nil
        isScanning = false
        completionHandler?(.failure(LiDARError.scanCancelled))
        completionHandler = nil
    }

    private func finishScanning() {
        timer?.invalidate()
        timer = nil
        isScanning = false
        scanProgress = 1.0

        // Process mesh data
        Task {
            do {
                let scanData = try await processMeshData()
                completionHandler?(.success(scanData))
            } catch {
                completionHandler?(.failure(error))
            }
            completionHandler = nil
        }
    }

    // MARK: - Mesh Processing
    private func processMeshData() async throws -> Data {
        var scanResult = LiDARScanResult(
            timestamp: Date(),
            meshAnchorsCount: meshAnchors.count,
            detectedDamage: detectedDamage,
            meshData: []
        )

        // Convert mesh anchors to data
        for anchor in meshAnchors {
            let meshData = MeshData(
                identifier: anchor.identifier.uuidString,
                vertices: extractVertices(from: anchor),
                normals: extractNormals(from: anchor),
                faces: extractFaces(from: anchor)
            )
            scanResult.meshData.append(meshData)
        }

        // Encode to JSON
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(scanResult)
    }

    private func extractVertices(from anchor: ARMeshAnchor) -> [SIMD3<Float>] {
        let geometry = anchor.geometry
        let vertices = geometry.vertices

        return (0..<vertices.count).map { index in
            vertices[index]
        }
    }

    private func extractNormals(from anchor: ARMeshAnchor) -> [SIMD3<Float>] {
        let geometry = anchor.geometry
        let normals = geometry.normals

        return (0..<normals.count).map { index in
            normals[index]
        }
    }

    private func extractFaces(from anchor: ARMeshAnchor) -> [[Int32]] {
        let geometry = anchor.geometry
        let faces = geometry.faces

        var result: [[Int32]] = []
        for faceIndex in 0..<faces.count {
            let indices = [
                Int32(faces[faceIndex * 3]),
                Int32(faces[faceIndex * 3 + 1]),
                Int32(faces[faceIndex * 3 + 2])
            ]
            result.append(indices)
        }
        return result
    }

    // MARK: - Damage Detection
    private func analyzeMeshForDamage(_ anchor: ARMeshAnchor) {
        // Analyze mesh for irregularities that could indicate damage
        let geometry = anchor.geometry
        let vertices = geometry.vertices
        let normals = geometry.normals

        // Look for sudden changes in surface normals (dents, scratches)
        for i in 0..<min(vertices.count - 1, normals.count - 1) {
            let normal1 = normals[i]
            let normal2 = normals[i + 1]

            let dotProduct = dot(normal1, normal2)
            let angle = acos(dotProduct) * 180.0 / .pi

            // If angle between adjacent normals is too large, it might indicate damage
            if angle > 30.0 {
                let vertex = vertices[i]
                let worldPosition = anchor.transform * SIMD4<Float>(vertex.x, vertex.y, vertex.z, 1.0)

                let damage = DamageArea(
                    location: SIMD3<Float>(worldPosition.x, worldPosition.y, worldPosition.z),
                    severity: calculateSeverity(angle: angle),
                    type: .surfaceIrregularity,
                    confidence: calculateConfidence(angle: angle)
                )

                // Only add if not too close to existing damage areas
                if !isDuplicateDamage(damage) {
                    DispatchQueue.main.async {
                        self.detectedDamage.append(damage)
                    }
                }
            }
        }
    }

    private func calculateSeverity(angle: Float) -> DamageSeverity {
        if angle > 60.0 {
            return .severe
        } else if angle > 45.0 {
            return .moderate
        } else {
            return .minor
        }
    }

    private func calculateConfidence(angle: Float) -> Float {
        return min(angle / 90.0, 1.0)
    }

    private func isDuplicateDamage(_ newDamage: DamageArea) -> Bool {
        let threshold: Float = 0.05 // 5cm threshold

        return detectedDamage.contains { existing in
            let distance = simd_distance(existing.location, newDamage.location)
            return distance < threshold
        }
    }
}

// MARK: - ARSessionDelegate
@available(iOS 14.0, *)
extension LiDARScanner: ARSessionDelegate {
    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        for anchor in anchors {
            if let meshAnchor = anchor as? ARMeshAnchor {
                meshAnchors.append(meshAnchor)
                if isScanning {
                    analyzeMeshForDamage(meshAnchor)
                }
            }
        }
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            if let meshAnchor = anchor as? ARMeshAnchor {
                if let index = meshAnchors.firstIndex(where: { $0.identifier == meshAnchor.identifier }) {
                    meshAnchors[index] = meshAnchor
                    if isScanning {
                        analyzeMeshForDamage(meshAnchor)
                    }
                }
            }
        }
    }

    func session(_ session: ARSession, didFailWithError error: Error) {
        print("AR Session failed: \(error.localizedDescription)")
        completionHandler?(.failure(error))
        completionHandler = nil
    }
}

// MARK: - LiDAR Scan View
@available(iOS 14.0, *)
struct LiDARScanView: UIViewRepresentable {
    let scanner: LiDARScanner

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        if let session = scanner.arSession {
            arView.session = session
        }

        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Update if needed
    }
}

// MARK: - Supporting Models

struct DamageArea: Identifiable, Codable {
    let id = UUID()
    let location: SIMD3<Float>
    let severity: DamageSeverity
    let type: DamageType
    let confidence: Float

    enum DamageType: String, Codable {
        case dent
        case scratch
        case surfaceIrregularity
        case crack
    }
}

enum DamageSeverity: String, Codable {
    case minor
    case moderate
    case severe
}

struct LiDARScanResult: Codable {
    let timestamp: Date
    let meshAnchorsCount: Int
    let detectedDamage: [DamageArea]
    let meshData: [MeshData]
}

struct MeshData: Codable {
    let identifier: String
    let vertices: [SIMD3<Float>]
    let normals: [SIMD3<Float>]
    let faces: [[Int32]]
}

// MARK: - SIMD Extensions
extension SIMD3: Codable where Scalar == Float {
    public init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        let x = try container.decode(Float.self)
        let y = try container.decode(Float.self)
        let z = try container.decode(Float.self)
        self.init(x: x, y: y, z: z)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.unkeyedContainer()
        try container.encode(self.x)
        try container.encode(self.y)
        try container.encode(self.z)
    }
}

// MARK: - LiDAR Error
enum LiDARError: Error, LocalizedError {
    case sessionNotInitialized
    case scanCancelled
    case deviceNotSupported

    var errorDescription: String? {
        switch self {
        case .sessionNotInitialized:
            return "LiDAR session not initialized"
        case .scanCancelled:
            return "Scan was cancelled"
        case .deviceNotSupported:
            return "LiDAR not supported on this device"
        }
    }
}
