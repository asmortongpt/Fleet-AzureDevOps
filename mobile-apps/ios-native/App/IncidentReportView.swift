import SwiftUI
import PhotosUI
import MapKit

struct IncidentReportView: View {
    @StateObject private var viewModel = IncidentViewModel()
    @State private var showingFilters = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if viewModel.loadingState.isLoading && viewModel.incidents.isEmpty {
                    ProgressView("Loading incidents...")
                } else if viewModel.filteredIncidents.isEmpty {
                    emptyStateView
                } else {
                    incidentsListView
                }
            }
            .navigationTitle("Incident Reports")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            viewModel.showingCreateIncident = true
                        } label: {
                            Label("Report Incident", systemImage: "exclamationmark.triangle.fill")
                        }

                        Divider()

                        Button {
                            showingFilters = true
                        } label: {
                            Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button {
                            Task {
                                await viewModel.refresh()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingCreateIncident) {
                CreateIncidentView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                IncidentFiltersView(viewModel: viewModel)
            }
            .sheet(item: $viewModel.selectedIncident) { incident in
                IncidentDetailView(incident: incident, viewModel: viewModel)
            }
        }
    }

    private var incidentsListView: View {
        ScrollView {
            LazyVStack(spacing: ModernTheme.Spacing.md) {
                // Statistics Summary
                if let stats = viewModel.statistics {
                    StatisticsCard(stats: stats)
                }

                // Critical Incidents
                if !viewModel.criticalIncidents.isEmpty {
                    Section {
                        ForEach(viewModel.criticalIncidents.prefix(3)) { incident in
                            IncidentCard(incident: incident)
                                .onTapGesture {
                                    viewModel.selectedIncident = incident
                                }
                        }
                    } header: {
                        HStack {
                            Label("Critical Incidents", systemImage: "exclamationmark.octagon.fill")
                                .font(ModernTheme.Typography.title3)
                                .foregroundColor(ModernTheme.Colors.error)
                            Spacer()
                        }
                        .padding(.vertical, ModernTheme.Spacing.xs)
                    }
                }

                // All Incidents
                Section {
                    ForEach(viewModel.filteredIncidents) { incident in
                        IncidentCard(incident: incident)
                            .onTapGesture {
                                viewModel.selectedIncident = incident
                            }
                            .contextMenu {
                                IncidentContextMenu(incident: incident, viewModel: viewModel)
                            }
                    }
                } header: {
                    HStack {
                        Label("All Incidents", systemImage: "doc.text.fill")
                            .font(ModernTheme.Typography.title3)
                        Spacer()
                        Text("\(viewModel.filteredIncidents.count)")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                    .padding(.vertical, ModernTheme.Spacing.xs)
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    private var emptyStateView: View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Incidents")
                .font(ModernTheme.Typography.title2)

            Text("Tap + to report an incident")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Button {
                viewModel.showingCreateIncident = true
            } label: {
                Text("Report Incident")
            }
            .primaryButton()
            .padding(.horizontal, 40)
        }
        .padding()
    }
}

// MARK: - Supporting Views
struct StatisticsCard: View {
    let stats: IncidentStatistics

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack(spacing: ModernTheme.Spacing.md) {
                StatBox(title: "Total", value: "\(stats.totalIncidents)", color: ModernTheme.Colors.primary)
                StatBox(title: "Open", value: "\(stats.openIncidents)", color: ModernTheme.Colors.warning)
                StatBox(title: "Closed", value: "\(stats.closedIncidents)", color: ModernTheme.Colors.success)
            }

            HStack(spacing: ModernTheme.Spacing.md) {
                StatBox(title: "Total Damage", value: stats.formattedTotalDamage, color: ModernTheme.Colors.error)
                StatBox(title: "Claims", value: stats.formattedTotalClaims, color: ModernTheme.Colors.info)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.secondaryBackground)
        )
    }
}

struct StatBox: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(ModernTheme.Typography.title3)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                .fill(ModernTheme.Colors.background)
        )
    }
}

struct IncidentCard: View {
    let incident: IncidentReport

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(incident.incidentNumber)
                        .font(ModernTheme.Typography.headline)

                    Label(incident.type.rawValue, systemImage: incident.type.icon)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(incident.type.color)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Label(incident.severity.rawValue, systemImage: incident.severity.icon)
                        .font(ModernTheme.Typography.caption1)
                        .fontWeight(.semibold)
                        .foregroundColor(incident.severityColor)

                    Label(incident.status.rawValue, systemImage: incident.status.icon)
                        .font(ModernTheme.Typography.caption2)
                        .foregroundColor(incident.statusColor)
                }
            }

            Divider()

            HStack(spacing: ModernTheme.Spacing.lg) {
                Label(incident.vehicleNumber, systemImage: "car.fill")
                    .font(ModernTheme.Typography.caption1)

                Label(incident.driverName, systemImage: "person.fill")
                    .font(ModernTheme.Typography.caption1)

                Label(incident.formattedIncidentDate, systemImage: "clock")
                    .font(ModernTheme.Typography.caption1)
            }
            .foregroundColor(ModernTheme.Colors.secondaryText)

            if let estimate = incident.damageEstimate {
                Label("Damage: \(String(format: "$%.2f", estimate))", systemImage: "dollarsign.circle")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.error)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct IncidentContextMenu: View {
    let incident: IncidentReport
    @ObservedObject var viewModel: IncidentViewModel

    var body: some View {
        Group {
            Button {
                viewModel.selectedIncident = incident
            } label: {
                Label("View Details", systemImage: "eye")
            }

            if incident.status != .closed {
                Button {
                    Task {
                        await viewModel.closeIncident(incident)
                    }
                } label: {
                    Label("Close Incident", systemImage: "checkmark.circle")
                }
            }

            Button(role: .destructive) {
                Task {
                    await viewModel.deleteIncident(incident)
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Create Incident View
struct CreateIncidentView: View {
    @ObservedObject var viewModel: IncidentViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var vehicleId = ""
    @State private var vehicleNumber = ""
    @State private var driverName = ""
    @State private var driverId = ""
    @State private var incidentDate = Date()
    @State private var selectedType: IncidentType = .collision
    @State private var selectedSeverity: IncidentSeverity = .minor
    @State private var description = ""
    @State private var weatherCondition: WeatherCondition?
    @State private var roadCondition: RoadCondition?
    @State private var damageEstimate = ""
    @State private var notes = ""
    @State private var useCurrentLocation = false
    @State private var selectedImages: [PhotosPickerItem] = []

    var body: some View {
        NavigationStack {
            Form {
                Section("Vehicle & Driver") {
                    TextField("Vehicle Number", text: $vehicleNumber)
                    TextField("Driver Name", text: $driverName)
                    TextField("Driver ID", text: $driverId)
                }

                Section("Incident Details") {
                    DatePicker("Incident Date & Time", selection: $incidentDate, displayedComponents: [.date, .hourAndMinute])

                    Picker("Type", selection: $selectedType) {
                        ForEach(IncidentType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type)
                        }
                    }

                    Picker("Severity", selection: $selectedSeverity) {
                        ForEach(IncidentSeverity.allCases, id: \.self) { severity in
                            Label(severity.rawValue, systemImage: severity.icon)
                                .tag(severity)
                        }
                    }
                }

                Section("Description") {
                    TextEditor(text: $description)
                        .frame(minHeight: 100)
                }

                Section("Conditions") {
                    Picker("Weather", selection: $weatherCondition) {
                        Text("Select").tag(nil as WeatherCondition?)
                        ForEach(WeatherCondition.allCases, id: \.self) { condition in
                            Label(condition.rawValue, systemImage: condition.icon)
                                .tag(condition as WeatherCondition?)
                        }
                    }

                    Picker("Road Condition", selection: $roadCondition) {
                        Text("Select").tag(nil as RoadCondition?)
                        ForEach(RoadCondition.allCases, id: \.self) { condition in
                            Label(condition.rawValue, systemImage: condition.icon)
                                .tag(condition as RoadCondition?)
                        }
                    }
                }

                Section("Location") {
                    Toggle("Use Current Location", isOn: $useCurrentLocation)

                    if useCurrentLocation {
                        Button {
                            viewModel.requestCurrentLocation()
                        } label: {
                            Label("Get Location", systemImage: "location.fill")
                        }
                    }
                }

                Section("Photos") {
                    if !viewModel.capturedPhotos.isEmpty {
                        ScrollView(.horizontal) {
                            HStack {
                                ForEach(Array(viewModel.capturedPhotos.enumerated()), id: \.offset) { index, image in
                                    Image(uiImage: image)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 100, height: 100)
                                        .clipped()
                                        .cornerRadius(ModernTheme.CornerRadius.sm)
                                        .overlay(alignment: .topTrailing) {
                                            Button {
                                                viewModel.removePhoto(at: index)
                                            } label: {
                                                Image(systemName: "xmark.circle.fill")
                                                    .foregroundColor(.white)
                                                    .background(Color.black.opacity(0.6))
                                                    .clipShape(Circle())
                                            }
                                            .padding(4)
                                        }
                                }
                            }
                        }
                    }

                    PhotosPicker(selection: $selectedImages, maxSelectionCount: 10, matching: .images) {
                        Label("Add Photos", systemImage: "camera.fill")
                    }
                }

                Section("Damage") {
                    TextField("Estimated Damage ($)", text: $damageEstimate)
                        .keyboardType(.decimalPad)
                }

                Section("Additional Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 60)
                }
            }
            .navigationTitle("Report Incident")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.clearPhotos()
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Submit") {
                        submitIncident()
                    }
                    .disabled(!isValid)
                }
            }
            .onChange(of: selectedImages) { _, newItems in
                Task {
                    for item in newItems {
                        if let data = try? await item.loadTransferable(type: Data.self),
                           let image = UIImage(data: data) {
                            viewModel.capturePhoto(image)
                        }
                    }
                    selectedImages.removeAll()
                }
            }
        }
    }

    private var isValid: Bool {
        !vehicleNumber.isEmpty && !driverName.isEmpty && !driverId.isEmpty && !description.isEmpty
    }

    private func submitIncident() {
        let location = useCurrentLocation ? viewModel.createLocationFromCurrent() : nil

        let request = IncidentReportRequest(
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            driverName: driverName,
            driverId: driverId,
            incidentDate: incidentDate,
            type: selectedType,
            severity: selectedSeverity,
            location: location ?? IncidentLocation.sample,
            description: description,
            weatherConditions: weatherCondition,
            roadConditions: roadCondition,
            witnesses: [],
            photos: viewModel.capturedPhotos.compactMap { $0.jpegData(compressionQuality: 0.8) },
            damageEstimate: Double(damageEstimate),
            injuries: [],
            policeReport: nil,
            notes: notes.isEmpty ? nil : notes
        )

        Task {
            await viewModel.createIncident(request)
            dismiss()
        }
    }
}

// MARK: - Filters View
struct IncidentFiltersView: View {
    @ObservedObject var viewModel: IncidentViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Sort By") {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(IncidentSortOption.allCases, id: \.self) { option in
                            Label(option.rawValue, systemImage: option.icon)
                                .tag(option)
                        }
                    }
                }

                Section("Filter by Status") {
                    Picker("Status", selection: $viewModel.filterByStatus) {
                        Text("All").tag(nil as IncidentStatus?)
                        ForEach(IncidentStatus.allCases, id: \.self) { status in
                            Label(status.rawValue, systemImage: status.icon)
                                .tag(status as IncidentStatus?)
                        }
                    }
                }

                Section("Filter by Severity") {
                    Picker("Severity", selection: $viewModel.filterBySeverity) {
                        Text("All").tag(nil as IncidentSeverity?)
                        ForEach(IncidentSeverity.allCases, id: \.self) { severity in
                            Text(severity.rawValue)
                                .tag(severity as IncidentSeverity?)
                        }
                    }
                }

                Section("Filter by Type") {
                    Picker("Type", selection: $viewModel.filterByType) {
                        Text("All").tag(nil as IncidentType?)
                        ForEach(IncidentType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon)
                                .tag(type as IncidentType?)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Reset") {
                        viewModel.clearSearch()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Detail View
struct IncidentDetailView: View {
    let incident: IncidentReport
    @ObservedObject var viewModel: IncidentViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.lg) {
                    // Map preview
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: incident.location.coordinate,
                        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                    ))) {
                        Marker("Incident", coordinate: incident.location.coordinate)
                            .tint(incident.type.color)
                    }
                    .frame(height: 200)
                    .cornerRadius(ModernTheme.CornerRadius.md)

                    // Details
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        DetailRow(label: "Incident #", value: incident.incidentNumber)
                        DetailRow(label: "Type", value: incident.type.rawValue)
                        DetailRow(label: "Severity", value: incident.severity.rawValue, valueColor: incident.severityColor)
                        DetailRow(label: "Status", value: incident.status.rawValue, valueColor: incident.statusColor)
                        DetailRow(label: "Date", value: incident.formattedIncidentDate)
                        DetailRow(label: "Vehicle", value: incident.vehicleNumber)
                        DetailRow(label: "Driver", value: incident.driverName)
                        DetailRow(label: "Location", value: incident.location.fullAddress)

                        if let weather = incident.weatherConditions {
                            DetailRow(label: "Weather", value: weather.rawValue)
                        }

                        if let road = incident.roadConditions {
                            DetailRow(label: "Road", value: road.rawValue)
                        }

                        if let damage = incident.damageEstimate {
                            DetailRow(label: "Damage Estimate", value: String(format: "$%.2f", damage), valueColor: ModernTheme.Colors.error)
                        }

                        Divider()

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Description")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            Text(incident.description)
                                .font(ModernTheme.Typography.body)
                        }

                        // Photos
                        if !incident.photos.isEmpty {
                            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                                Text("Photos")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)

                                ScrollView(.horizontal) {
                                    HStack {
                                        ForEach(incident.photos) { photo in
                                            if let data = photo.photoData, let image = UIImage(data: data) {
                                                Image(uiImage: image)
                                                    .resizable()
                                                    .scaledToFill()
                                                    .frame(width: 150, height: 150)
                                                    .clipped()
                                                    .cornerRadius(ModernTheme.CornerRadius.sm)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Insurance Claim
                        if let claim = incident.insuranceClaim {
                            VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                                Text("Insurance Claim")
                                    .font(ModernTheme.Typography.title3)

                                DetailRow(label: "Claim #", value: claim.claimNumber)
                                DetailRow(label: "Provider", value: claim.insuranceProvider)
                                DetailRow(label: "Amount", value: claim.formattedClaimAmount)
                                DetailRow(label: "Status", value: claim.status.rawValue, valueColor: claim.status.color)
                            }
                            .padding()
                            .background(ModernTheme.Colors.secondaryBackground)
                            .cornerRadius(ModernTheme.CornerRadius.md)
                        }
                    }
                    .modernCard()
                }
                .padding()
            }
            .navigationTitle("Incident Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    IncidentReportView()
}
