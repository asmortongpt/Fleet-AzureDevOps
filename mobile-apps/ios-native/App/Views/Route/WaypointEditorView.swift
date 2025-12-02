//
//  WaypointEditorView.swift
//  Fleet Manager
//
//  Editor for adding and modifying route waypoints
//

import SwiftUI
import MapKit

struct WaypointEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var address: String = ""
    @State private var notes: String = ""
    @State private var stopDuration: Double = 5 // minutes
    @State private var priority: WaypointPriority = .normal
    @State private var latitude: String = ""
    @State private var longitude: String = ""
    @State private var searchText: String = ""
    @State private var searchResults: [MKMapItem] = []
    @State private var isSearching = false
    @State private var selectedLocation: CLLocationCoordinate2D?
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 38.8977, longitude: -77.0365),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    let waypoint: RouteWaypoint?
    let onSave: (RouteWaypoint) -> Void

    init(waypoint: RouteWaypoint? = nil, onSave: @escaping (RouteWaypoint) -> Void) {
        self.waypoint = waypoint
        self.onSave = onSave

        // Initialize state from existing waypoint
        if let waypoint = waypoint {
            _name = State(initialValue: waypoint.name ?? "")
            _address = State(initialValue: waypoint.address)
            _notes = State(initialValue: waypoint.notes ?? "")
            _stopDuration = State(initialValue: waypoint.stopDuration / 60.0)
            _priority = State(initialValue: waypoint.priority)
            _latitude = State(initialValue: String(waypoint.coordinate.latitude))
            _longitude = State(initialValue: String(waypoint.coordinate.longitude))
            _selectedLocation = State(initialValue: waypoint.clCoordinate)
            _mapRegion = State(initialValue: MKCoordinateRegion(
                center: waypoint.clCoordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            ))
        }
    }

    var body: some View {
        NavigationView {
            Form {
                // Location Section
                Section("Location") {
                    // Address Search
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        TextField("Search address...", text: $searchText)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onChange(of: searchText) { _, newValue in
                                if !newValue.isEmpty {
                                    performSearch(query: newValue)
                                }
                            }

                        if isSearching {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                    }

                    // Search Results
                    if !searchResults.isEmpty {
                        ForEach(searchResults, id: \.self) { item in
                            Button(action: {
                                selectLocation(item)
                            }) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name ?? "Unknown")
                                        .font(ModernTheme.Typography.bodyBold)
                                        .foregroundColor(ModernTheme.Colors.primaryText)

                                    if let address = item.placemark.title {
                                        Text(address)
                                            .font(ModernTheme.Typography.caption1)
                                            .foregroundColor(ModernTheme.Colors.secondaryText)
                                    }
                                }
                            }
                        }
                    }

                    // Address field
                    TextField("Address", text: $address)
                        .textInputAutocapitalization(.words)

                    // Map preview
                    if let location = selectedLocation {
                        Map(coordinateRegion: $mapRegion, annotationItems: [location]) { coord in
                            MapMarker(coordinate: coord, tint: priority.color)
                        }
                        .frame(height: 200)
                        .cornerRadius(ModernTheme.CornerRadius.md)
                    }

                    // Coordinates
                    HStack {
                        TextField("Latitude", text: $latitude)
                            .keyboardType(.decimalPad)

                        Divider()

                        TextField("Longitude", text: $longitude)
                            .keyboardType(.decimalPad)
                    }
                }

                // Details Section
                Section("Details") {
                    TextField("Waypoint Name (Optional)", text: $name)
                        .textInputAutocapitalization(.words)

                    // Priority Picker
                    Picker("Priority", selection: $priority) {
                        ForEach(WaypointPriority.allCases, id: \.self) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                    .foregroundColor(priority.color)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }

                    // Stop Duration
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                        HStack {
                            Text("Stop Duration")
                            Spacer()
                            Text("\(Int(stopDuration)) min")
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        }

                        Slider(value: $stopDuration, in: 0...60, step: 5)
                            .tint(ModernTheme.Colors.primary)
                    }

                    // Notes
                    TextField("Notes (Optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle(waypoint == nil ? "Add Waypoint" : "Edit Waypoint")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveWaypoint()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }

    // MARK: - Validation
    private var isValid: Bool {
        !address.isEmpty &&
        Double(latitude) != nil &&
        Double(longitude) != nil
    }

    // MARK: - Search
    private func performSearch(query: String) {
        isSearching = true

        let searchRequest = MKLocalSearch.Request()
        searchRequest.naturalLanguageQuery = query
        searchRequest.region = mapRegion

        let search = MKLocalSearch(request: searchRequest)
        search.start { response, error in
            isSearching = false

            if let response = response {
                searchResults = response.mapItems
            } else {
                searchResults = []
            }
        }
    }

    private func selectLocation(_ item: MKMapItem) {
        name = item.name ?? ""
        address = item.placemark.title ?? ""
        selectedLocation = item.placemark.coordinate
        latitude = String(item.placemark.coordinate.latitude)
        longitude = String(item.placemark.coordinate.longitude)

        mapRegion = MKCoordinateRegion(
            center: item.placemark.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        )

        searchText = ""
        searchResults = []

        ModernTheme.Haptics.selection()
    }

    // MARK: - Save
    private func saveWaypoint() {
        guard let lat = Double(latitude),
              let lon = Double(longitude) else {
            return
        }

        let waypoint = RouteWaypoint(
            id: self.waypoint?.id ?? UUID().uuidString,
            sequenceNumber: self.waypoint?.sequenceNumber ?? 0,
            address: address,
            name: name.isEmpty ? nil : name,
            coordinate: Coordinate(latitude: lat, longitude: lon),
            stopDuration: stopDuration * 60, // Convert to seconds
            arrivalTime: nil,
            departureTime: nil,
            completed: false,
            notes: notes.isEmpty ? nil : notes,
            priority: priority
        )

        onSave(waypoint)
        ModernTheme.Haptics.success()
        dismiss()
    }
}

// MARK: - CLLocationCoordinate2D Identifiable Extension
extension CLLocationCoordinate2D: Identifiable {
    public var id: String {
        "\(latitude),\(longitude)"
    }
}

#Preview {
    WaypointEditorView(waypoint: nil) { waypoint in
        print("Saved waypoint: \(waypoint)")
    }
}
