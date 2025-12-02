//
//  EnhancedMapView.swift
//  Fleet Manager
//
//  Main map view with comprehensive layer support
//

import SwiftUI
import MapKit

struct EnhancedMapView: View {
    @StateObject private var viewModel = MapLayersViewModel()
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )
    @State private var selectedIncident: IncidentMarker?
    @State private var selectedWeather: WeatherOverlay?

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Main Map
            Map(
                coordinateRegion: $mapRegion,
                interactionModes: .all,
                showsUserLocation: true,
                annotationItems: visibleAnnotations
            ) { item in
                MapAnnotation(coordinate: item.coordinate) {
                    annotationView(for: item)
                }
            }
            .mapStyle(mapStyle)
            .ignoresSafeArea()
            .onChange(of: mapRegion) { newRegion in
                viewModel.updateRegion(newRegion)
            }

            // Traffic Overlay
            if viewModel.isLayerEnabled(.traffic), let trafficData = viewModel.trafficData {
                TrafficOverlayView(
                    trafficData: trafficData,
                    region: mapRegion,
                    opacity: viewModel.getLayerOpacity(.traffic)
                )
            }

            // Weather Overlay Widget
            if viewModel.showWeatherOverlay {
                VStack {
                    HStack {
                        Spacer()
                        WeatherOverlayView(
                            weatherData: viewModel.weatherData,
                            onWeatherTap: { weather in
                                selectedWeather = weather
                            }
                        )
                        .padding(.top, 100)
                        .padding(.trailing)
                    }
                    Spacer()
                }
            }

            // Map Controls
            VStack(alignment: .trailing, spacing: ModernTheme.Spacing.md) {
                // Layer Picker Button
                MapControlButton(
                    icon: "square.stack.3d.up.fill",
                    color: viewModel.availableLayers.contains(where: { $0.isEnabled }) ? .blue : .gray,
                    action: {
                        viewModel.showLayerPicker = true
                    }
                )

                // Auto-Refresh Toggle
                MapControlButton(
                    icon: viewModel.autoRefreshEnabled ? "arrow.clockwise.circle.fill" : "arrow.clockwise.circle",
                    color: viewModel.autoRefreshEnabled ? .green : .gray,
                    action: {
                        viewModel.toggleAutoRefresh()
                    }
                )

                // Center on User
                MapControlButton(
                    icon: "location.fill",
                    color: .blue,
                    action: centerOnUser
                )

                // Refresh Data
                MapControlButton(
                    icon: "arrow.clockwise",
                    color: .blue,
                    action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }
                )

                Spacer()

                // Traffic Legend
                if viewModel.showTrafficLegend {
                    TrafficLegendView()
                }

                // Status Bar
                if viewModel.isRefreshing {
                    HStack(spacing: 8) {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Updating...")
                            .font(ModernTheme.Typography.caption1)
                    }
                    .padding(ModernTheme.Spacing.sm)
                    .background(
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                            .fill(Color.white.opacity(0.9))
                            .shadow(radius: 4)
                    )
                }
            }
            .padding()

            // Incident Detail Card
            if let incident = selectedIncident {
                VStack {
                    Spacer()
                    IncidentDetailCard(
                        incident: incident,
                        onClose: {
                            withAnimation {
                                selectedIncident = nil
                            }
                        }
                    )
                    .padding()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            // Weather Detail Card
            if let weather = selectedWeather {
                VStack {
                    Spacer()
                    WeatherDetailCard(
                        weather: weather,
                        onClose: {
                            withAnimation {
                                selectedWeather = nil
                            }
                        }
                    )
                    .padding()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .sheet(isPresented: $viewModel.showLayerPicker) {
            LayerPickerView(viewModel: viewModel)
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) { }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
        .onAppear {
            viewModel.updateRegion(mapRegion)
        }
    }

    // MARK: - Map Style

    private var mapStyle: MapStyle {
        switch viewModel.currentMapType {
        case .satellite:
            return .imagery
        case .hybrid:
            return .hybrid
        case .mutedStandard:
            return .standard(elevation: .realistic)
        default:
            return .standard
        }
    }

    // MARK: - Annotations

    private var visibleAnnotations: [MapAnnotationItem] {
        var items: [MapAnnotationItem] = []

        // Add incidents
        if viewModel.isLayerEnabled(.incidents) || viewModel.isLayerEnabled(.construction) {
            let visibleIncidents = viewModel.getVisibleIncidents(in: mapRegion)
            items.append(contentsOf: visibleIncidents.map { MapAnnotationItem.incident($0) })
        }

        return items
    }

    @ViewBuilder
    private func annotationView(for item: MapAnnotationItem) -> some View {
        switch item {
        case .incident(let incident):
            IncidentAnnotationView(incident: incident)
                .onTapGesture {
                    withAnimation {
                        selectedIncident = incident
                    }
                }
        }
    }

    // MARK: - Actions

    private func centerOnUser() {
        // Get user location from location manager
        // For now, center on DC
        withAnimation {
            mapRegion = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
                span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
            )
        }
        ModernTheme.Haptics.light()
    }
}

// MARK: - Map Annotation Item

enum MapAnnotationItem: Identifiable {
    case incident(IncidentMarker)

    var id: String {
        switch self {
        case .incident(let incident):
            return incident.id
        }
    }

    var coordinate: CLLocationCoordinate2D {
        switch self {
        case .incident(let incident):
            return incident.coordinate
        }
    }
}

// MARK: - Map Control Button

struct MapControlButton: View {
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(color)
                .clipShape(Circle())
                .shadow(color: Color.black.opacity(0.3), radius: 4, x: 0, y: 2)
        }
    }
}

// MARK: - Traffic Overlay View

struct TrafficOverlayView: View {
    let trafficData: TrafficData
    let region: MKCoordinateRegion
    let opacity: Double

    var body: some View {
        // Note: In production, this would use MKOverlayRenderer
        // For SwiftUI preview, we show a simplified representation
        ZStack {
            ForEach(visibleSegments, id: \.id) { segment in
                Path { path in
                    let points = segment.polylineCoordinates.map { coordinate in
                        coordinateToPoint(coordinate, in: region)
                    }

                    if !points.isEmpty {
                        path.move(to: points[0])
                        for point in points.dropFirst() {
                            path.addLine(to: point)
                        }
                    }
                }
                .stroke(
                    segment.congestionLevel.color.opacity(segment.congestionLevel.opacity * opacity),
                    lineWidth: 4
                )
            }
        }
        .allowsHitTesting(false)
    }

    private var visibleSegments: [TrafficRoadSegment] {
        trafficData.segmentsInRegion(region)
    }

    private func coordinateToPoint(_ coordinate: CLLocationCoordinate2D, in region: MKCoordinateRegion) -> CGPoint {
        let mapRect = MKMapRect(region: region)
        let mapPoint = MKMapPoint(coordinate)

        let x = (mapPoint.x - mapRect.origin.x) / mapRect.size.width
        let y = (mapPoint.y - mapRect.origin.y) / mapRect.size.height

        return CGPoint(x: x * UIScreen.main.bounds.width, y: y * UIScreen.main.bounds.height)
    }
}

// MARK: - Incident Annotation View

struct IncidentAnnotationView: View {
    let incident: IncidentMarker

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                Circle()
                    .fill(incident.severity.color)
                    .frame(width: 36, height: 36)
                    .shadow(radius: 4)

                Image(systemName: incident.type.icon)
                    .font(.system(size: 18))
                    .foregroundColor(.white)
            }

            // Pointer
            Triangle()
                .fill(incident.severity.color)
                .frame(width: 12, height: 8)
                .offset(y: -2)
        }
        .frame(width: 36, height: 44)
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.closeSubpath()
        return path
    }
}

// MARK: - Incident Detail Card

struct IncidentDetailCard: View {
    let incident: IncidentMarker
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: incident.type.icon)
                        .foregroundColor(incident.severity.color)
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(incident.type.displayName)
                            .font(ModernTheme.Typography.headline)

                        Text(incident.severity.displayName)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(incident.severity.color)
                    }
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }

            Divider()

            // Location
            HStack(spacing: 8) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(ModernTheme.Colors.primary)
                VStack(alignment: .leading, spacing: 2) {
                    Text(incident.location.roadName)
                        .font(ModernTheme.Typography.subheadline)
                        .fontWeight(.semibold)
                    if let direction = incident.location.direction {
                        Text(direction)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }
            }

            // Description
            Text(incident.description)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.primaryText)

            // Details Grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: ModernTheme.Spacing.md) {
                if let lanes = incident.affectedLanes {
                    DetailItem(
                        icon: "road.lanes",
                        label: "Affected Lanes",
                        value: "\(lanes)"
                    )
                }

                DetailItem(
                    icon: "clock.fill",
                    label: "Reported",
                    value: timeAgo(from: incident.reportedAt)
                )

                if let clearTime = incident.estimatedClearTime {
                    DetailItem(
                        icon: "calendar.badge.clock",
                        label: "Est. Clear",
                        value: formatTime(clearTime)
                    )
                }

                if incident.roadClosed {
                    DetailItem(
                        icon: "xmark.octagon.fill",
                        label: "Status",
                        value: "Road Closed"
                    )
                }
            }

            // Navigation Button
            Button(action: {}) {
                HStack {
                    Image(systemName: "location.fill")
                    Text("Navigate Around")
                }
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(ModernTheme.Colors.primary)
                .foregroundColor(.white)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.2), radius: 8)
        )
    }

    private func timeAgo(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let minutes = Int(interval / 60)
        if minutes < 60 {
            return "\(minutes)m ago"
        } else {
            let hours = minutes / 60
            return "\(hours)h ago"
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Weather Detail Card

struct WeatherDetailCard: View {
    let weather: WeatherOverlay
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: weather.conditions.icon)
                        .foregroundColor(.blue)
                        .font(.title2)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(weather.location.name)
                            .font(ModernTheme.Typography.headline)

                        Text(weather.conditions.displayName)
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(ModernTheme.Colors.tertiaryText)
                }
            }

            Divider()

            // Temperature
            HStack {
                VStack(alignment: .leading) {
                    Text("\(weather.temperatureFahrenheit)°F")
                        .font(.system(size: 48, weight: .thin))
                    Text("Feels like \(Int(weather.feelsLike))°F")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
                Spacer()
            }

            // Details Grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: ModernTheme.Spacing.md) {
                DetailItem(
                    icon: "drop.fill",
                    label: "Humidity",
                    value: "\(Int(weather.humidity))%"
                )

                DetailItem(
                    icon: "wind",
                    label: "Wind",
                    value: "\(Int(weather.windSpeed)) mph"
                )

                DetailItem(
                    icon: "eye.fill",
                    label: "Visibility",
                    value: String(format: "%.1f mi", weather.visibility)
                )

                if weather.hasActivePrecipitation {
                    DetailItem(
                        icon: "cloud.rain.fill",
                        label: "Precipitation",
                        value: String(format: "%.1f in", weather.precipitation)
                    )
                }
            }

            // Alerts
            if !weather.alerts.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Alerts")
                        .font(ModernTheme.Typography.headline)

                    ForEach(weather.alerts.filter { $0.isActive }) { alert in
                        WeatherAlertRow(alert: alert)
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.2), radius: 8)
        )
    }
}

struct WeatherAlertRow: View {
    let alert: WeatherAlert

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(alert.severity.color)

            VStack(alignment: .leading, spacing: 2) {
                Text(alert.title)
                    .font(ModernTheme.Typography.subheadline)
                    .fontWeight(.semibold)

                Text(alert.description)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .lineLimit(2)
            }
        }
        .padding(8)
        .background(alert.severity.color.opacity(0.1))
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Detail Item

struct DetailItem: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            Text(value)
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - MKMapRect Extension

extension MKMapRect {
    init(region: MKCoordinateRegion) {
        let center = MKMapPoint(region.center)
        let span = region.span

        let width = MKMapPoint.metersPerMapPointAtLatitude(region.center.latitude) * span.longitudeDelta * 111_000
        let height = MKMapPoint.metersPerMapPointAtLatitude(region.center.latitude) * span.latitudeDelta * 111_000

        self.init(
            origin: MKMapPoint(x: center.x - width / 2, y: center.y - height / 2),
            size: MKMapSize(width: width, height: height)
        )
    }
}

// MARK: - MKMapPoint Extension

extension MKMapPoint {
    static func metersPerMapPointAtLatitude(_ latitude: Double) -> Double {
        return cos(latitude * .pi / 180.0) * 156543.03392
    }
}

// MARK: - Preview

#if DEBUG
struct EnhancedMapView_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedMapView()
    }
}
#endif
