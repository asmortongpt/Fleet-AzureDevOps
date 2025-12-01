//
//  DamageReportView.swift
//  Fleet Manager
//
//  Mobile-First Damage Reporting with Photo Capture
//

import SwiftUI

// MARK: - Damage Severity
enum DamageSeverity: String, CaseIterable {
    case minor = "Minor"
    case moderate = "Moderate"
    case major = "Major"
    case critical = "Critical"

    var color: Color {
        switch self {
        case .minor: return .blue
        case .moderate: return .orange
        case .major: return .red
        case .critical: return .purple
        }
    }
}

// MARK: - Damage Report Model
struct DamageReport: Identifiable {
    let id = UUID()
    var vehicleId: String
    var vehicleName: String
    var severity: DamageSeverity
    var location: String
    var description: String
    var photos: [UIImage]
    var reportedBy: String
    var reportedDate: Date
    var estimatedCost: Double?

    init(
        vehicleId: String = "",
        vehicleName: String = "",
        severity: DamageSeverity = .minor,
        location: String = "",
        description: String = "",
        photos: [UIImage] = [],
        reportedBy: String = "Current User",
        reportedDate: Date = Date(),
        estimatedCost: Double? = nil
    ) {
        self.vehicleId = vehicleId
        self.vehicleName = vehicleName
        self.severity = severity
        self.location = location
        self.description = description
        self.photos = photos
        self.reportedBy = reportedBy
        self.reportedDate = reportedDate
        self.estimatedCost = estimatedCost
    }
}

// MARK: - Damage Report View
struct DamageReportView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedVehicle = "Fleet Vehicle 001"
    @State private var severity: DamageSeverity = .minor
    @State private var damageLocation = ""
    @State private var damageDescription = ""
    @State private var estimatedCost = ""
    @State private var capturedPhotos: [UIImage] = []
    @State private var showingCamera = false
    @State private var showingSuccess = false

    // Common damage locations
    let damageLocations = [
        "Front Bumper",
        "Rear Bumper",
        "Driver Side Door",
        "Passenger Side Door",
        "Hood",
        "Roof",
        "Trunk",
        "Windshield",
        "Side Mirror",
        "Wheel/Tire",
        "Other"
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Header
            compactHeader

            // Form Content
            ScrollView {
                VStack(spacing: 16) {
                    // Vehicle Selection
                    vehicleSection

                    // Severity Selection
                    severitySection

                    // Location Selection
                    locationSection

                    // Description
                    descriptionSection

                    // Estimated Cost
                    costSection

                    // Photos
                    photosSection

                    // Submit Button
                    submitButton
                }
                .padding()
            }
        }
        .navigationTitle("Report Damage")
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
            Text("Damage report has been submitted successfully. The maintenance team will be notified.")
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundColor(.orange)

            VStack(alignment: .leading, spacing: 2) {
                Text("Damage Report")
                    .font(.headline)
                Text("Document vehicle damage")
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
            Label("Vehicle", systemImage: "car.fill")
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

    // MARK: - Severity Section
    private var severitySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Severity", systemImage: "exclamationmark.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                ForEach(DamageSeverity.allCases, id: \.self) { sev in
                    Button(action: { severity = sev }) {
                        VStack(spacing: 4) {
                            Image(systemName: severity == sev ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                            Text(sev.rawValue)
                                .font(.caption2)
                        }
                        .foregroundColor(severity == sev ? sev.color : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(severity == sev ? sev.color.opacity(0.1) : Color(.systemBackground))
                        .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Location Section
    private var locationSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Damage Location", systemImage: "location.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            Picker("Location", selection: $damageLocation) {
                Text("Select location").tag("")
                ForEach(damageLocations, id: \.self) { location in
                    Text(location).tag(location)
                }
            }
            .pickerStyle(.menu)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(10)
        }
    }

    // MARK: - Description Section
    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Description", systemImage: "text.alignleft")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            TextEditor(text: $damageDescription)
                .frame(height: 100)
                .padding(8)
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(.separator), lineWidth: 1)
                )
        }
    }

    // MARK: - Cost Section
    private var costSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Estimated Repair Cost (Optional)", systemImage: "dollarsign.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.secondary)

            TextField("Enter amount", text: $estimatedCost)
                .keyboardType(.decimalPad)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(10)
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
                Text("Submit Report")
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(isFormValid ? severity.color : Color.gray)
            .cornerRadius(12)
        }
        .disabled(!isFormValid)
        .padding(.top, 8)
    }

    // MARK: - Form Validation
    private var isFormValid: Bool {
        !selectedVehicle.isEmpty &&
        !damageLocation.isEmpty &&
        !damageDescription.isEmpty
    }

    // MARK: - Submit Action
    private func submitReport() {
        // Create damage report
        let report = DamageReport(
            vehicleId: "VEH001",
            vehicleName: selectedVehicle,
            severity: severity,
            location: damageLocation,
            description: damageDescription,
            photos: capturedPhotos,
            estimatedCost: Double(estimatedCost)
        )

        // TODO: Send to backend API
        print("Submitting damage report: \(report)")

        // Show success
        showingSuccess = true
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        DamageReportView()
    }
}
