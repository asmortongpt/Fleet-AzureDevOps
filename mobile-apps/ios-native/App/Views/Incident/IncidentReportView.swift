//
//  IncidentReportView.swift
//  Fleet Manager
//
//  Mobile-First Incident Reporting with GPS Location
//

import SwiftUI
import CoreLocation

// MARK: - Incident Type
enum IncidentType: String, CaseIterable {
    case accident = "Accident"
    case collision = "Collision"
    case theft = "Theft"
    case vandalism = "Vandalism"
    case breakdown = "Breakdown"
    case nearMiss = "Near Miss"
    case other = "Other"

    var icon: String {
        switch self {
        case .accident: return "car.circle.fill"
        case .collision: return "exclamationmark.octagon.fill"
        case .theft: return "lock.shield.fill"
        case .vandalism: return "hammer.fill"
        case .breakdown: return "wrench.fill"
        case .nearMiss: return "exclamationmark.triangle.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .accident: return .red
        case .collision: return .orange
        case .theft: return .purple
        case .vandalism: return .pink
        case .breakdown: return .blue
        case .nearMiss: return .yellow
        case .other: return .gray
        }
    }
}

// MARK: - Incident Report Model
struct IncidentReport: Identifiable {
    let id = UUID()
    var vehicleId: String
    var vehicleName: String
    var incidentType: IncidentType
    var date: Date
    var location: String
    var coordinates: CLLocationCoordinate2D?
    var description: String
    var injuriesReported: Bool
    var policeReportNumber: String
    var witnesses: [String]
    var photos: [UIImage]
    var reportedBy: String
}

// MARK: - Incident Report View
struct IncidentReportView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedVehicle = "Fleet Vehicle 001"
    @State private var incidentType: IncidentType = .accident
    @State private var incidentDate = Date()
    @State private var incidentLocation = ""
    @State private var incidentDescription = ""
    @State private var injuriesReported = false
    @State private var policeReportNumber = ""
    @State private var witnessName = ""
    @State private var witnesses: [String] = []
    @State private var capturedPhotos: [UIImage] = []
    @State private var showingCamera = false
    @State private var showingSuccess = false
    @State private var useCurrentLocation = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            compactHeader

            // Form Content
            ScrollView {
                VStack(spacing: 16) {
                    // Vehicle Selection
                    vehicleSection

                    // Incident Type
                    incidentTypeSection

                    // Date & Time
                    dateTimeSection

                    // Location
                    locationSection

                    // Description
                    descriptionSection

                    // Injuries
                    injuriesSection

                    // Police Report
                    policeReportSection

                    // Witnesses
                    witnessesSection

                    // Photos
                    photosSection

                    // Submit Button
                    submitButton
                }
                .padding()
            }
        }
        .navigationTitle("Incident Report")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingCamera) {
            PhotoCaptureView { image in
                capturedPhotos.append(image)
            }
        }
        .alert("Report Submitted", isPresented: $showingSuccess) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Incident report has been filed. Reference number: IR-\(UUID().uuidString.prefix(8))")
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            Image(systemName: "doc.text.fill")
                .font(.title2)
                .foregroundColor(.red)

            VStack(alignment: .leading, spacing: 2) {
                Text("Incident Report")
                    .font(.headline)
                Text("Document fleet incidents")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
    }

    // MARK: - Vehicle Section
    private var vehicleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Vehicle Involved", systemImage: "car.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            Picker("Vehicle", selection: $selectedVehicle) {
                Text("Fleet Vehicle 001").tag("Fleet Vehicle 001")
                Text("Fleet Vehicle 002").tag("Fleet Vehicle 002")
                Text("Fleet Vehicle 003").tag("Fleet Vehicle 003")
            }
            .pickerStyle(.menu)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(10)
        }
    }

    // MARK: - Incident Type Section
    private var incidentTypeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Incident Type", systemImage: "exclamationmark.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(IncidentType.allCases, id: \.self) { type in
                    Button(action: { incidentType = type }) {
                        VStack(spacing: 6) {
                            Image(systemName: type.icon)
                                .font(.title3)
                            Text(type.rawValue)
                                .font(.caption2)
                        }
                        .foregroundColor(incidentType == type ? .white : type.color)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(incidentType == type ? type.color : Color(.systemBackground))
                        .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Date & Time Section
    private var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Date & Time", systemImage: "calendar.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            DatePicker("When did this occur?", selection: $incidentDate)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(10)
        }
    }

    // MARK: - Location Section
    private var locationSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Location", systemImage: "location.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            VStack(spacing: 8) {
                TextField("Enter location or address", text: $incidentLocation)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(10)

                Toggle("Use current location", isOn: $useCurrentLocation)
                    .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Description Section
    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Description", systemImage: "text.alignleft")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            Text("Provide detailed information about what happened")
                .font(.caption2)
                .foregroundColor(.secondary)

            TextEditor(text: $incidentDescription)
                .frame(height: 120)
                .padding(8)
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(.separator), lineWidth: 1)
                )
        }
    }

    // MARK: - Injuries Section
    private var injuriesSection: some View {
        HStack {
            Label("Injuries Reported", systemImage: "heart.text.square.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            Spacer()

            Toggle("", isOn: $injuriesReported)
                .labelsHidden()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }

    // MARK: - Police Report Section
    private var policeReportSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Police Report Number (Optional)", systemImage: "shield.lefthalf.filled")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            TextField("Enter report number", text: $policeReportNumber)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(10)
        }
    }

    // MARK: - Witnesses Section
    private var witnessesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Witnesses (\(witnesses.count))", systemImage: "person.2.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("Add witness name", text: $witnessName)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(10)

                Button(action: addWitness) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                .disabled(witnessName.isEmpty)
            }

            if !witnesses.isEmpty {
                VStack(spacing: 4) {
                    ForEach(Array(witnesses.enumerated()), id: \.offset) { index, witness in
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.blue)
                            Text(witness)
                                .font(.body)
                            Spacer()
                            Button(action: {
                                witnesses.remove(at: index)
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.red)
                            }
                        }
                        .padding(.vertical, 6)
                        .padding(.horizontal)
                        .background(Color(.systemBackground))
                        .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Photos Section
    private var photosSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Photos (\(capturedPhotos.count))", systemImage: "camera.fill")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)

                Spacer()

                Button(action: { showingCamera = true }) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus.circle.fill")
                        Text("Add Photo")
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }

            if capturedPhotos.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "camera.circle")
                        .font(.system(size: 40))
                        .foregroundColor(.gray)
                    Text("No photos added")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 100)
                .background(Color(.systemBackground))
                .cornerRadius(10)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(capturedPhotos.enumerated()), id: \.offset) { index, photo in
                            ZStack(alignment: .topTrailing) {
                                Image(uiImage: photo)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 100)
                                    .cornerRadius(8)
                                    .clipped()

                                Button(action: {
                                    capturedPhotos.remove(at: index)
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.white)
                                        .background(Circle().fill(Color.red))
                                        .font(.title3)
                                }
                                .padding(4)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Submit Button
    private var submitButton: some View {
        Button(action: submitReport) {
            HStack {
                Image(systemName: "paperplane.fill")
                Text("Submit Incident Report")
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(isFormValid ? incidentType.color : Color.gray)
            .cornerRadius(12)
        }
        .disabled(!isFormValid)
        .padding(.top, 8)
    }

    // MARK: - Form Validation
    private var isFormValid: Bool {
        !selectedVehicle.isEmpty &&
        !incidentLocation.isEmpty &&
        !incidentDescription.isEmpty
    }

    // MARK: - Helper Functions
    private func addWitness() {
        guard !witnessName.isEmpty else { return }
        witnesses.append(witnessName)
        witnessName = ""
    }

    private func submitReport() {
        // Create incident report
        let report = IncidentReport(
            vehicleId: "VEH001",
            vehicleName: selectedVehicle,
            incidentType: incidentType,
            date: incidentDate,
            location: incidentLocation,
            description: incidentDescription,
            injuriesReported: injuriesReported,
            policeReportNumber: policeReportNumber,
            witnesses: witnesses,
            photos: capturedPhotos,
            reportedBy: "Current User"
        )

        // TODO: Send to backend API
        print("Submitting incident report: \(report)")

        // Show success
        showingSuccess = true
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        IncidentReportView()
    }
}
