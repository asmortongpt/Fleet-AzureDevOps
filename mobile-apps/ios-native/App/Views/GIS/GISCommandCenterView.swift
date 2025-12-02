//
//  GISCommandCenterView.swift
//  Fleet Manager
//
//  Full-screen GIS Command Center with layers, heatmaps, and clustering
//

import SwiftUI
import MapKit

struct GISCommandCenterView: View {
    @StateObject private var viewModel = GISViewModel()
    @State private var showLayerControl = false
    @State private var showHeatmapSettings = false
    @State private var showFilterSheet = false
    @State private var showExportOptions = false
    @State private var mapType: MKMapType = .standard
    @State private var trackingMode: MapUserTrackingMode = .follow
    @State private var showMeasurementTools = false

    var body: some View {
        ZStack {
            // Main Map View
            mapView

            // Overlays
            VStack {
                // Top Bar
                topBar

                Spacer()

                // Bottom Controls
                bottomControls
            }

            // Legend
            if viewModel.showLegend {
                legendView
            }

            // Layer Control Sheet
            if showLayerControl {
                layerControlOverlay
            }
        }
        .navigationTitle("GIS Command Center")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            toolbarContent
        }
        .sheet(isPresented: $showHeatmapSettings) {
            HeatmapSettingsView(viewModel: viewModel)
        }
        .sheet(isPresented: $showFilterSheet) {
            FilterSheetView(viewModel: viewModel)
        }
        .sheet(isPresented: $showExportOptions) {
            ExportOptionsView(viewModel: viewModel)
        }
        .task {
            await viewModel.loadAllData()
        }
    }

    // MARK: - Map View
    private var mapView: some View {
        GISMapView(
            viewModel: viewModel,
            mapType: $mapType,
            region: $viewModel.mapRegion
        )
        .edgesIgnoringSafeArea(.all)
    }

    // MARK: - Top Bar
    private var topBar: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Timeframe Selector
            timeframeSelector

            Spacer()

            // Statistics Card
            if let stats = viewModel.statistics {
                statisticsCard(stats)
            }
        }
        .padding()
        .background(
            ModernTheme.Colors.background
                .opacity(0.95)
        )
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .padding(.horizontal)
        .padding(.top, 8)
    }

    private var timeframeSelector: some View {
        Menu {
            ForEach(TimeframeOption.allCases, id: \.self) { option in
                Button(action: {
                    viewModel.applyTimeframe(option)
                    ModernTheme.Haptics.selection()
                }) {
                    HStack {
                        Image(systemName: option.iconName)
                        Text(option.rawValue)
                        if viewModel.selectedTimeframe == option {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack {
                Image(systemName: viewModel.selectedTimeframe.iconName)
                    .foregroundColor(ModernTheme.Colors.primary)
                Text(viewModel.selectedTimeframe.rawValue)
                    .font(ModernTheme.Typography.bodyBold)
                Image(systemName: "chevron.down")
                    .font(.caption)
            }
            .padding(.horizontal, ModernTheme.Spacing.md)
            .padding(.vertical, ModernTheme.Spacing.sm)
            .background(ModernTheme.Colors.secondaryBackground)
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
    }

    private func statisticsCard(_ stats: GISStatistics) -> some View {
        HStack(spacing: ModernTheme.Spacing.lg) {
            statItem(
                icon: "car.2.fill",
                value: "\(stats.totalVehicles)",
                label: "Vehicles"
            )

            Divider()
                .frame(height: 30)

            statItem(
                icon: "scope",
                value: "\(stats.totalClusters)",
                label: "Clusters"
            )

            Divider()
                .frame(height: 30)

            statItem(
                icon: "flame.fill",
                value: "\(stats.hotspots)",
                label: "Hotspots"
            )
        }
        .padding(ModernTheme.Spacing.md)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    private func statItem(icon: String, value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(ModernTheme.Colors.primary)

            Text(value)
                .font(ModernTheme.Typography.bodyBold)

            Text(label)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
    }

    // MARK: - Bottom Controls
    private var bottomControls: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            // Layer Control Button
            controlButton(
                icon: "square.stack.3d.up.fill",
                label: "Layers",
                badge: viewModel.layers.filter { $0.visible }.count
            ) {
                showLayerControl.toggle()
                ModernTheme.Haptics.medium()
            }

            // Heatmap Settings
            controlButton(
                icon: "slider.horizontal.3",
                label: "Heatmap"
            ) {
                showHeatmapSettings = true
                ModernTheme.Haptics.medium()
            }

            // Filter
            controlButton(
                icon: "line.3.horizontal.decrease.circle",
                label: "Filter",
                badge: !viewModel.filter.isEmpty ? 1 : nil
            ) {
                showFilterSheet = true
                ModernTheme.Haptics.medium()
            }

            // Map Type
            Menu {
                Button(action: { mapType = .standard }) {
                    HStack {
                        Text("Standard")
                        if mapType == .standard {
                            Image(systemName: "checkmark")
                        }
                    }
                }
                Button(action: { mapType = .satellite }) {
                    HStack {
                        Text("Satellite")
                        if mapType == .satellite {
                            Image(systemName: "checkmark")
                        }
                    }
                }
                Button(action: { mapType = .hybrid }) {
                    HStack {
                        Text("Hybrid")
                        if mapType == .hybrid {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            } label: {
                controlButtonLabel(icon: "map.fill", label: "Map")
            }

            // Refresh
            controlButton(
                icon: viewModel.isRefreshing ? "arrow.clockwise" : "arrow.clockwise",
                label: "Refresh",
                isLoading: viewModel.isRefreshing
            ) {
                Task {
                    await viewModel.refresh()
                }
                ModernTheme.Haptics.light()
            }
        }
        .padding()
        .background(
            ModernTheme.Colors.background
                .opacity(0.95)
        )
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .padding(.horizontal)
        .padding(.bottom, 8)
    }

    private func controlButton(
        icon: String,
        label: String,
        badge: Int? = nil,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            controlButtonLabel(icon: icon, label: label, badge: badge, isLoading: isLoading)
        }
    }

    private func controlButtonLabel(
        icon: String,
        label: String,
        badge: Int? = nil,
        isLoading: Bool = false
    ) -> some View {
        VStack(spacing: 4) {
            ZStack {
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: icon)
                        .font(.title3)
                }

                if let badge = badge, badge > 0 {
                    Text("\(badge)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 16, height: 16)
                        .background(ModernTheme.Colors.error)
                        .clipShape(Circle())
                        .offset(x: 12, y: -12)
                }
            }
            .frame(width: 32, height: 32)

            Text(label)
                .font(ModernTheme.Typography.caption1)
        }
        .foregroundColor(ModernTheme.Colors.primary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, ModernTheme.Spacing.sm)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }

    // MARK: - Legend
    private var legendView: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text("Legend")
                    .font(ModernTheme.Typography.headline)

                Spacer()

                Button(action: {
                    withAnimation {
                        viewModel.showLegend = false
                    }
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            ForEach(viewModel.layers.filter { $0.visible }, id: \.id) { layer in
                HStack(spacing: ModernTheme.Spacing.sm) {
                    Image(systemName: layer.type.iconName)
                        .foregroundColor(colorFromString(layer.color ?? layer.type.defaultColor))
                        .frame(width: 20)

                    Text(layer.name)
                        .font(ModernTheme.Typography.footnote)

                    Spacer()

                    Text("\(Int(layer.opacity * 100))%")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .padding()
        .background(
            ModernTheme.Colors.background
                .opacity(0.95)
        )
        .cornerRadius(ModernTheme.CornerRadius.md)
        .frame(maxWidth: 250)
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
    }

    // MARK: - Layer Control Overlay
    private var layerControlOverlay: some View {
        ZStack {
            Color.black.opacity(0.3)
                .edgesIgnoringSafeArea(.all)
                .onTapGesture {
                    withAnimation {
                        showLayerControl = false
                    }
                }

            VStack {
                Spacer()

                LayerControlView(viewModel: viewModel, isPresented: $showLayerControl)
                    .transition(.move(edge: .bottom))
            }
        }
    }

    // MARK: - Toolbar
    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .navigationBarTrailing) {
            Menu {
                Button(action: {
                    viewModel.toggleAutoRefresh()
                }) {
                    HStack {
                        Text("Auto Refresh")
                        if viewModel.autoRefresh {
                            Image(systemName: "checkmark")
                        }
                    }
                }

                Button(action: {
                    withAnimation {
                        viewModel.showLegend.toggle()
                    }
                }) {
                    HStack {
                        Text("Show Legend")
                        if viewModel.showLegend {
                            Image(systemName: "checkmark")
                        }
                    }
                }

                Divider()

                Button(action: {
                    showExportOptions = true
                }) {
                    Label("Export Map", systemImage: "square.and.arrow.up")
                }

                Button(action: {
                    showMeasurementTools.toggle()
                }) {
                    Label("Measurement Tools", systemImage: "ruler")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }

    // MARK: - Helper Methods
    private func colorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "red": return .red
        case "blue": return .blue
        case "green": return .green
        case "orange": return .orange
        case "purple": return .purple
        case "yellow": return .yellow
        case "pink": return .pink
        default: return .gray
        }
    }
}

// MARK: - GIS Map View
struct GISMapView: UIViewRepresentable {
    @ObservedObject var viewModel: GISViewModel
    @Binding var mapType: MKMapType
    @Binding var region: MKCoordinateRegion?

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = true
        mapView.showsCompass = true
        mapView.showsScale = true

        // Set initial region (default to US if no region specified)
        let initialRegion = region ?? MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
            span: MKCoordinateSpan(latitudeDelta: 10, longitudeDelta: 10)
        )
        mapView.setRegion(initialRegion, animated: false)

        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        mapView.mapType = mapType

        // Update region if changed
        if let region = region, !regionEqual(mapView.region, region) {
            mapView.setRegion(region, animated: true)
        }

        // Remove existing overlays and annotations
        mapView.removeOverlays(mapView.overlays)
        mapView.removeAnnotations(mapView.annotations.filter { !($0 is MKUserLocation) })

        // Add heatmap overlay
        if viewModel.showHeatmap, let heatmapData = viewModel.heatmapData {
            let overlay = HeatmapOverlay(data: heatmapData)
            mapView.addOverlay(overlay, level: .aboveLabels)
        }

        // Add cluster annotations
        if viewModel.showClusters {
            let annotations = viewModel.clusters.map { ClusterAnnotation(cluster: $0) }
            mapView.addAnnotations(annotations)
        }

        // Add boundary overlays
        if viewModel.showBoundaries {
            for boundary in viewModel.boundaries {
                let polygon = MKPolygon(coordinates: boundary.polygonCoordinates, count: boundary.polygonCoordinates.count)
                polygon.title = boundary.name
                mapView.addOverlay(polygon, level: .aboveRoads)
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    private func regionEqual(_ r1: MKCoordinateRegion, _ r2: MKCoordinateRegion) -> Bool {
        abs(r1.center.latitude - r2.center.latitude) < 0.001 &&
        abs(r1.center.longitude - r2.center.longitude) < 0.001 &&
        abs(r1.span.latitudeDelta - r2.span.latitudeDelta) < 0.001 &&
        abs(r1.span.longitudeDelta - r2.span.longitudeDelta) < 0.001
    }

    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: GISMapView

        init(_ parent: GISMapView) {
            self.parent = parent
        }

        // Render overlays
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            if let heatmapOverlay = overlay as? HeatmapOverlay {
                return HeatmapOverlayRenderer(overlay: heatmapOverlay, opacity: parent.viewModel.heatmapOpacity)
            } else if let polygon = overlay as? MKPolygon {
                let renderer = MKPolygonRenderer(polygon: polygon)
                renderer.fillColor = UIColor.blue.withAlphaComponent(0.2)
                renderer.strokeColor = UIColor.blue
                renderer.lineWidth = 2
                return renderer
            }

            return MKOverlayRenderer(overlay: overlay)
        }

        // Render annotations
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            if annotation is MKUserLocation {
                return nil
            }

            if let clusterAnnotation = annotation as? ClusterAnnotation {
                let identifier = "ClusterAnnotation"
                let view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
                    ?? MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)

                view.glyphText = "\(clusterAnnotation.cluster.itemCount)"
                view.markerTintColor = UIColor.systemBlue
                view.displayPriority = .required

                return view
            }

            return nil
        }

        // Handle annotation selection
        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            if let clusterAnnotation = view.annotation as? ClusterAnnotation {
                parent.viewModel.selectCluster(clusterAnnotation.cluster)
            }
        }
    }
}

// MARK: - Custom Annotations
class ClusterAnnotation: NSObject, MKAnnotation {
    let cluster: ClusterPoint
    var coordinate: CLLocationCoordinate2D {
        cluster.coordinate
    }
    var title: String? {
        "\(cluster.itemCount) items"
    }

    init(cluster: ClusterPoint) {
        self.cluster = cluster
    }
}

// MARK: - Heatmap Overlay
class HeatmapOverlay: NSObject, MKOverlay {
    let data: HeatmapData
    var coordinate: CLLocationCoordinate2D {
        data.coordinates.first?.coordinate ?? CLLocationCoordinate2D()
    }
    var boundingMapRect: MKMapRect {
        let points = data.coordinates.map { MKMapPoint($0.coordinate) }
        let minX = points.map { $0.x }.min() ?? 0
        let maxX = points.map { $0.x }.max() ?? 0
        let minY = points.map { $0.y }.min() ?? 0
        let maxY = points.map { $0.y }.max() ?? 0

        return MKMapRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }

    init(data: HeatmapData) {
        self.data = data
    }
}

class HeatmapOverlayRenderer: MKOverlayRenderer {
    let heatmapOverlay: HeatmapOverlay
    let opacity: Double

    init(overlay: HeatmapOverlay, opacity: Double = 0.6) {
        self.heatmapOverlay = overlay
        self.opacity = opacity
        super.init(overlay: overlay)
    }

    override func draw(_ mapRect: MKMapRect, zoomScale: MKZoomScale, in context: CGContext) {
        let rect = self.rect(for: mapRect)

        guard let cgContext = UIGraphicsGetCurrentContext() else { return }

        cgContext.setAlpha(opacity)

        // Draw each heatmap point
        for point in heatmapOverlay.data.coordinates {
            let mapPoint = MKMapPoint(point.coordinate)
            let pointRect = self.rect(for: MKMapRect(origin: mapPoint, size: MKMapSize(width: 0, height: 0)))

            let radius = CGFloat(heatmapOverlay.data.radius) / zoomScale
            let intensity = CGFloat(point.intensity)

            // Create radial gradient
            let colorSpace = CGColorSpaceCreateDeviceRGB()
            let colors = [
                UIColor.red.withAlphaComponent(intensity).cgColor,
                UIColor.red.withAlphaComponent(0).cgColor
            ] as CFArray

            if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0, 1]) {
                cgContext.drawRadialGradient(
                    gradient,
                    startCenter: pointRect.origin,
                    startRadius: 0,
                    endCenter: pointRect.origin,
                    endRadius: radius,
                    options: []
                )
            }
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        GISCommandCenterView()
    }
}
