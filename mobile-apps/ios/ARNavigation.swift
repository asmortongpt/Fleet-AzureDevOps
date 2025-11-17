//
//  ARNavigation.swift
//  Fleet Manager - AR Navigation Overlay
//
//  ARKit-based augmented reality navigation with turn-by-turn directions,
//  POI markers, geofence alerts, and vehicle finder
//

import SwiftUI
import ARKit
import CoreLocation
import MapKit

// MARK: - AR Navigation Manager

class ARNavigationManager: NSObject, ObservableObject {
    static let shared = ARNavigationManager()

    @Published var isARActive = false
    @Published var currentInstructions = ""
    @Published var distanceToNextTurn = ""
    @Published var nearbyPOIs: [POIMarker] = []
    @Published var activeGeofences: [GeofenceAlert] = []

    private var arSession: ARSession?
    private var sceneView: ARSCNView?
    private var locationManager: CLLocationManager
    private var currentLocation: CLLocation?
    private var navigationRoute: [CLLocationCoordinate2D] = []
    private var poiNodes: [SCNNode] = []

    private override init() {
        locationManager = CLLocationManager()
        super.init()
        setupLocationManager()
    }

    // MARK: - Setup

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }

    func setupARSession(sceneView: ARSCNView) {
        self.sceneView = sceneView
        self.arSession = sceneView.session

        let configuration = ARWorldTrackingConfiguration()
        configuration.worldAlignment = .gravityAndHeading
        configuration.planeDetection = .horizontal

        sceneView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        sceneView.delegate = self

        isARActive = true
        print("AR session started")
    }

    func stopARSession() {
        sceneView?.session.pause()
        isARActive = false
        clearARContent()
        print("AR session stopped")
    }

    // MARK: - Navigation

    func startNavigation(to destination: CLLocationCoordinate2D) {
        calculateRoute(to: destination) { [weak self] route in
            guard let self = self, let route = route else { return }

            self.navigationRoute = route
            self.createRouteOverlay()
            self.updateNavigationInstructions()

            print("Navigation started to \(destination)")
        }
    }

    private func calculateRoute(to destination: CLLocationCoordinate2D, completion: @escaping ([CLLocationCoordinate2D]?) -> Void) {
        guard let currentLocation = currentLocation else {
            completion(nil)
            return
        }

        let request = MKDirections.Request()
        request.source = MKMapItem(placemark: MKPlacemark(coordinate: currentLocation.coordinate))
        request.destination = MKMapItem(placemark: MKPlacemark(coordinate: destination))
        request.transportType = .automobile

        let directions = MKDirections(request: request)
        directions.calculate { response, error in
            if let error = error {
                print("Route calculation failed: \(error.localizedDescription)")
                completion(nil)
                return
            }

            guard let route = response?.routes.first else {
                completion(nil)
                return
            }

            let coordinates = route.polyline.coordinates
            completion(coordinates)
        }
    }

    private func createRouteOverlay() {
        guard let sceneView = sceneView else { return }

        // Clear existing route nodes
        sceneView.scene.rootNode.childNodes.forEach { node in
            if node.name == "route_marker" {
                node.removeFromParentNode()
            }
        }

        // Create AR markers along the route
        for (index, coordinate) in navigationRoute.enumerated() {
            guard let currentLocation = currentLocation else { continue }

            let distance = currentLocation.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))

            // Only show markers within 500m
            if distance < 500 {
                let position = getARPosition(for: coordinate)
                createRouteMarker(at: position, index: index)
            }
        }
    }

    private func createRouteMarker(at position: SCNVector3, index: Int) {
        guard let sceneView = sceneView else { return }

        // Create arrow geometry
        let arrowGeometry = SCNPyramid(width: 0.5, height: 0.8, length: 0.5)
        arrowGeometry.firstMaterial?.diffuse.contents = UIColor.blue.withAlphaComponent(0.7)

        let arrowNode = SCNNode(geometry: arrowGeometry)
        arrowNode.position = position
        arrowNode.name = "route_marker"

        // Rotate to point forward
        arrowNode.eulerAngles.x = -.pi / 2

        // Add pulsing animation
        let scaleUp = SCNAction.scale(to: 1.2, duration: 0.5)
        let scaleDown = SCNAction.scale(to: 1.0, duration: 0.5)
        let pulse = SCNAction.sequence([scaleUp, scaleDown])
        arrowNode.runAction(SCNAction.repeatForever(pulse))

        sceneView.scene.rootNode.addChildNode(arrowNode)
    }

    private func updateNavigationInstructions() {
        guard !navigationRoute.isEmpty,
              let currentLocation = currentLocation else { return }

        let nextPoint = navigationRoute[0]
        let distance = currentLocation.distance(from: CLLocation(latitude: nextPoint.latitude, longitude: nextPoint.longitude))

        if distance < 20 {
            // Remove passed waypoint
            navigationRoute.removeFirst()

            if navigationRoute.isEmpty {
                currentInstructions = "You have arrived"
                distanceToNextTurn = ""
                return
            }
        }

        // Calculate bearing and turn direction
        let bearing = currentLocation.coordinate.bearing(to: nextPoint)
        let heading = locationManager.heading?.trueHeading ?? 0

        let turnAngle = bearing - heading
        let turnDirection = getTurnDirection(angle: turnAngle)

        currentInstructions = turnDirection
        distanceToNextTurn = formatDistance(distance)

        // Update AR markers
        createRouteOverlay()
    }

    private func getTurnDirection(angle: Double) -> String {
        let normalizedAngle = (angle + 360).truncatingRemainder(dividingBy: 360)

        switch normalizedAngle {
        case 0..<22.5, 337.5...360:
            return "Continue straight"
        case 22.5..<67.5:
            return "Turn slight right"
        case 67.5..<112.5:
            return "Turn right"
        case 112.5..<157.5:
            return "Turn sharp right"
        case 157.5..<202.5:
            return "Make U-turn"
        case 202.5..<247.5:
            return "Turn sharp left"
        case 247.5..<292.5:
            return "Turn left"
        case 292.5..<337.5:
            return "Turn slight left"
        default:
            return "Continue"
        }
    }

    // MARK: - POI (Points of Interest)

    func loadNearbyPOIs() {
        guard let currentLocation = currentLocation else { return }

        // Search for gas stations, rest areas, etc.
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = "gas station"
        request.region = MKCoordinateRegion(
            center: currentLocation.coordinate,
            latitudinalMeters: 5000,
            longitudinalMeters: 5000
        )

        let search = MKLocalSearch(request: request)
        search.start { [weak self] response, error in
            guard let self = self,
                  let response = response else { return }

            self.nearbyPOIs = response.mapItems.prefix(10).map { item in
                POIMarker(
                    id: UUID().uuidString,
                    name: item.name ?? "Unknown",
                    category: .gasStation,
                    coordinate: item.placemark.coordinate,
                    distance: currentLocation.distance(from: CLLocation(
                        latitude: item.placemark.coordinate.latitude,
                        longitude: item.placemark.coordinate.longitude
                    ))
                )
            }

            self.displayPOIsInAR()
        }
    }

    private func displayPOIsInAR() {
        guard let sceneView = sceneView else { return }

        // Clear existing POI nodes
        poiNodes.forEach { $0.removeFromParentNode() }
        poiNodes.removeAll()

        for poi in nearbyPOIs {
            let position = getARPosition(for: poi.coordinate)
            let poiNode = createPOIMarker(poi: poi, at: position)
            sceneView.scene.rootNode.addChildNode(poiNode)
            poiNodes.append(poiNode)
        }

        print("Displayed \(nearbyPOIs.count) POIs in AR")
    }

    private func createPOIMarker(poi: POIMarker, at position: SCNVector3) -> SCNNode {
        // Create container node
        let containerNode = SCNNode()
        containerNode.position = position

        // Create icon
        let iconGeometry = SCNSphere(radius: 0.3)
        iconGeometry.firstMaterial?.diffuse.contents = poi.category.color

        let iconNode = SCNNode(geometry: iconGeometry)
        containerNode.addChildNode(iconNode)

        // Create label
        let textGeometry = SCNText(string: poi.name, extrusionDepth: 0.1)
        textGeometry.font = UIFont.systemFont(ofSize: 1.0)
        textGeometry.firstMaterial?.diffuse.contents = UIColor.white

        let textNode = SCNNode(geometry: textGeometry)
        textNode.position = SCNVector3(0, 0.5, 0)
        textNode.scale = SCNVector3(0.05, 0.05, 0.05)

        // Billboard effect - always face camera
        let billboardConstraint = SCNBillboardConstraint()
        billboardConstraint.freeAxes = .Y
        textNode.constraints = [billboardConstraint]

        containerNode.addChildNode(textNode)

        return containerNode
    }

    // MARK: - Geofence Alerts

    func addGeofence(name: String, center: CLLocationCoordinate2D, radius: Double, type: GeofenceType) {
        let geofence = GeofenceAlert(
            id: UUID().uuidString,
            name: name,
            center: center,
            radius: radius,
            type: type,
            isActive: false
        )

        activeGeofences.append(geofence)

        // Create AR visualization
        createGeofenceOverlay(geofence: geofence)

        print("Geofence added: \(name)")
    }

    private func createGeofenceOverlay(geofence: GeofenceAlert) {
        guard let sceneView = sceneView else { return }

        let position = getARPosition(for: geofence.center)

        // Create circular boundary
        let circle = SCNCylinder(radius: CGFloat(geofence.radius / 100), height: 0.1)
        circle.firstMaterial?.diffuse.contents = geofence.type.color.withAlphaComponent(0.3)

        let circleNode = SCNNode(geometry: circle)
        circleNode.position = position
        circleNode.name = "geofence_\(geofence.id)"

        sceneView.scene.rootNode.addChildNode(circleNode)
    }

    private func checkGeofences() {
        guard let currentLocation = currentLocation else { return }

        for index in activeGeofences.indices {
            let geofence = activeGeofences[index]
            let geofenceLocation = CLLocation(latitude: geofence.center.latitude, longitude: geofence.center.longitude)
            let distance = currentLocation.distance(from: geofenceLocation)

            let wasActive = geofence.isActive
            let isActive = distance <= geofence.radius

            if isActive && !wasActive {
                // Entered geofence
                onGeofenceEntered(geofence)
                activeGeofences[index].isActive = true
            } else if !isActive && wasActive {
                // Exited geofence
                onGeofenceExited(geofence)
                activeGeofences[index].isActive = false
            }
        }
    }

    private func onGeofenceEntered(_ geofence: GeofenceAlert) {
        print("Entered geofence: \(geofence.name)")

        // Show AR alert
        showARAlert(message: "Entering \(geofence.name)", color: geofence.type.color)

        // Trigger notification
        NotificationCenter.default.post(
            name: .geofenceEntered,
            object: nil,
            userInfo: ["geofence": geofence]
        )
    }

    private func onGeofenceExited(_ geofence: GeofenceAlert) {
        print("Exited geofence: \(geofence.name)")
    }

    // MARK: - Vehicle Finder

    func findVehicle(location: CLLocationCoordinate2D) {
        guard let sceneView = sceneView else { return }

        let position = getARPosition(for: location)

        // Create vehicle marker
        let markerGeometry = SCNCone(topRadius: 0, bottomRadius: 0.5, height: 2)
        markerGeometry.firstMaterial?.diffuse.contents = UIColor.green

        let markerNode = SCNNode(geometry: markerGeometry)
        markerNode.position = position
        markerNode.name = "vehicle_marker"

        // Add floating animation
        let moveUp = SCNAction.moveBy(x: 0, y: 0.3, z: 0, duration: 1)
        let moveDown = SCNAction.moveBy(x: 0, y: -0.3, z: 0, duration: 1)
        let float = SCNAction.sequence([moveUp, moveDown])
        markerNode.runAction(SCNAction.repeatForever(float))

        // Add label
        let textGeometry = SCNText(string: "Your Vehicle", extrusionDepth: 0.1)
        textGeometry.font = UIFont.boldSystemFont(ofSize: 1.5)
        textGeometry.firstMaterial?.diffuse.contents = UIColor.white

        let textNode = SCNNode(geometry: textGeometry)
        textNode.position = SCNVector3(0, 2.5, 0)
        textNode.scale = SCNVector3(0.1, 0.1, 0.1)

        let billboardConstraint = SCNBillboardConstraint()
        textNode.constraints = [billboardConstraint]

        markerNode.addChildNode(textNode)

        sceneView.scene.rootNode.addChildNode(markerNode)

        print("Vehicle marker placed in AR")
    }

    // MARK: - AR Helpers

    private func getARPosition(for coordinate: CLLocationCoordinate2D) -> SCNVector3 {
        guard let currentLocation = currentLocation else {
            return SCNVector3(0, 0, 0)
        }

        // Calculate relative position from current location
        let distance = currentLocation.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
        let bearing = currentLocation.coordinate.bearing(to: coordinate)

        // Convert to AR coordinates (meters)
        let x = Float(distance * sin(bearing * .pi / 180))
        let z = -Float(distance * cos(bearing * .pi / 180))
        let y = Float(0) // Ground level

        return SCNVector3(x, y, z)
    }

    private func showARAlert(message: String, color: UIColor) {
        guard let sceneView = sceneView else { return }

        // Create alert text in front of camera
        let textGeometry = SCNText(string: message, extrusionDepth: 0.1)
        textGeometry.font = UIFont.boldSystemFont(ofSize: 2)
        textGeometry.firstMaterial?.diffuse.contents = color

        let textNode = SCNNode(geometry: textGeometry)
        textNode.position = SCNVector3(0, 1, -5)
        textNode.scale = SCNVector3(0.1, 0.1, 0.1)

        sceneView.scene.rootNode.addChildNode(textNode)

        // Fade out after 3 seconds
        let fadeOut = SCNAction.fadeOut(duration: 1)
        let remove = SCNAction.removeFromParentNode()
        textNode.runAction(SCNAction.sequence([.wait(duration: 2), fadeOut, remove]))
    }

    private func clearARContent() {
        sceneView?.scene.rootNode.childNodes.forEach { $0.removeFromParentNode() }
        poiNodes.removeAll()
    }

    private func formatDistance(_ distance: Double) -> String {
        if distance < 1000 {
            return "\(Int(distance))m"
        } else {
            return String(format: "%.1fkm", distance / 1000)
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension ARNavigationManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location

        if isARActive && !navigationRoute.isEmpty {
            updateNavigationInstructions()
        }

        checkGeofences()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        // Update AR orientation based on heading
    }
}

// MARK: - ARSCNViewDelegate

extension ARNavigationManager: ARSCNViewDelegate {
    func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
        // Update AR content each frame if needed
    }
}

// MARK: - Supporting Types

struct POIMarker: Identifiable {
    let id: String
    let name: String
    let category: POICategory
    let coordinate: CLLocationCoordinate2D
    let distance: Double
}

enum POICategory {
    case gasStation
    case restArea
    case restaurant
    case hospital
    case parkingLot

    var color: UIColor {
        switch self {
        case .gasStation: return .blue
        case .restArea: return .green
        case .restaurant: return .orange
        case .hospital: return .red
        case .parkingLot: return .purple
        }
    }

    var icon: String {
        switch self {
        case .gasStation: return "fuelpump.fill"
        case .restArea: return "bed.double.fill"
        case .restaurant: return "fork.knife"
        case .hospital: return "cross.case.fill"
        case .parkingLot: return "parkingsign"
        }
    }
}

struct GeofenceAlert: Identifiable {
    let id: String
    let name: String
    let center: CLLocationCoordinate2D
    let radius: Double
    let type: GeofenceType
    var isActive: Bool
}

enum GeofenceType {
    case restrictedArea
    case deliveryZone
    case safetyZone
    case speedLimit

    var color: UIColor {
        switch self {
        case .restrictedArea: return .red
        case .deliveryZone: return .blue
        case .safetyZone: return .green
        case .speedLimit: return .orange
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let geofenceEntered = Notification.Name("geofenceEntered")
    static let geofenceExited = Notification.Name("geofenceExited")
}

// MARK: - Helper Extensions

extension MKPolyline {
    var coordinates: [CLLocationCoordinate2D] {
        var coords = [CLLocationCoordinate2D](repeating: kCLLocationCoordinate2DInvalid, count: pointCount)
        getCoordinates(&coords, range: NSRange(location: 0, length: pointCount))
        return coords
    }
}

extension CLLocationCoordinate2D {
    func bearing(to coordinate: CLLocationCoordinate2D) -> Double {
        let lat1 = self.latitude * .pi / 180
        let lon1 = self.longitude * .pi / 180
        let lat2 = coordinate.latitude * .pi / 180
        let lon2 = coordinate.longitude * .pi / 180

        let dLon = lon2 - lon1

        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)

        let bearing = atan2(y, x) * 180 / .pi
        return (bearing + 360).truncatingRemainder(dividingBy: 360)
    }
}

// MARK: - SwiftUI View

struct ARNavigationView: UIViewRepresentable {
    @ObservedObject var manager = ARNavigationManager.shared

    func makeUIView(context: Context) -> ARSCNView {
        let sceneView = ARSCNView()
        manager.setupARSession(sceneView: sceneView)
        return sceneView
    }

    func updateUIView(_ uiView: ARSCNView, context: Context) {
        // Update view if needed
    }

    static func dismantleUIView(_ uiView: ARSCNView, coordinator: ()) {
        ARNavigationManager.shared.stopARSession()
    }
}

struct ARNavigationOverlay: View {
    @ObservedObject var manager = ARNavigationManager.shared

    var body: some View {
        ZStack {
            ARNavigationView()
                .edgesIgnoringSafeArea(.all)

            VStack {
                // Navigation instructions
                if !manager.currentInstructions.isEmpty {
                    VStack(spacing: 8) {
                        Text(manager.currentInstructions)
                            .font(.title2.weight(.semibold))
                        Text(manager.distanceToNextTurn)
                            .font(.title3)
                            .foregroundColor(.orange)
                    }
                    .padding()
                    .background(Color.black.opacity(0.7))
                    .cornerRadius(12)
                    .padding()
                }

                Spacer()

                // POI indicators
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(manager.nearbyPOIs) { poi in
                            POICard(poi: poi)
                        }
                    }
                    .padding()
                }
            }
        }
        .onAppear {
            manager.loadNearbyPOIs()
        }
    }
}

struct POICard: View {
    let poi: POIMarker

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: poi.category.icon)
                    .foregroundColor(Color(poi.category.color))
                Text(poi.name)
                    .font(.caption)
            }
            Text("\(Int(poi.distance))m")
                .font(.caption2)
                .foregroundColor(.gray)
        }
        .padding(8)
        .background(Color.black.opacity(0.7))
        .cornerRadius(8)
    }
}
