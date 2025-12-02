import SwiftUI

struct MaintenanceSubmissionView: View {
    @State private var issueType = "Mechanical"
    @State private var urgency = "Medium"
    @State private var description = ""
    @State private var vehicleId = ""
    @State private var mileage = ""
    @State private var showingSuccess = false
    @State private var showingError = false
    @State private var isSubmitting = false
    @State private var selectedImages: [UIImage] = []
    
    let issueTypes = ["Mechanical", "Electrical", "Body/Paint", "Interior", "Tires", "Brakes", "Engine", "Transmission", "Other"]
    let urgencyLevels = ["Low", "Medium", "High", "Critical"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle Information")) {
                    TextField("Vehicle ID or License Plate", text: $vehicleId)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    TextField("Current Mileage", text: $mileage)
                        .keyboardType(.numberPad)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Section(header: Text("Issue Details")) {
                    Picker("Issue Type", selection: $issueType) {
                        ForEach(issueTypes, id: \.self) { type in
                            Text(type).tag(type)
                        }
                    }
                    
                    Picker("Urgency Level", selection: $urgency) {
                        ForEach(urgencyLevels, id: \.self) { level in
                            Text(level).tag(level)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    
                    VStack(alignment: .leading) {
                        Text("Description")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextEditor(text: $description)
                            .frame(minHeight: 100)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }
                }
                
                Section(header: Text("Attachments")) {
                    Button(action: {
                        // In a real app, this would open image picker
                        print("Add photo functionality")
                    }) {
                        HStack {
                            Image(systemName: "camera.fill")
                            Text("Add Photos")
                        }
                    }
                    
                    if !selectedImages.isEmpty {
                        ScrollView(.horizontal) {
                            HStack {
                                ForEach(0..<selectedImages.count, id: \.self) { index in
                                    Image(uiImage: selectedImages[index])
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 60, height: 60)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                            }
                        }
                    }
                }
                
                Section {
                    Button(action: submitMaintenanceIssue) {
                        if isSubmitting {
                            HStack {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .scaleEffect(0.8)
                                Text("Submitting...")
                            }
                            .frame(maxWidth: .infinity)
                        } else {
                            Text("Submit Maintenance Issue")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(vehicleId.isEmpty || description.isEmpty || isSubmitting)
                }
            }
            .navigationTitle("Report Maintenance")
            .navigationBarTitleDisplayMode(.large)
            .alert("Success", isPresented: $showingSuccess) {
                Button("OK") {
                    // Reset form
                    clearForm()
                }
            } message: {
                Text("Your maintenance issue has been submitted successfully. Reference #\(generateReferenceNumber())")
            }
            .alert("Error", isPresented: $showingError) {
                Button("Try Again") {
                    isSubmitting = false
                }
            } message: {
                Text("Failed to submit maintenance issue. Please try again.")
            }
        }
    }
    
    private func submitMaintenanceIssue() {
        // Validate inputs
        guard !vehicleId.isEmpty, !description.isEmpty else {
            showingError = true
            return
        }
        
        isSubmitting = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isSubmitting = false
            
            // Save to local storage (in real app, this would be an API call)
            let issue = MaintenanceIssue(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                mileage: Int(mileage) ?? 0,
                issueType: issueType,
                urgency: urgency,
                description: description,
                submittedDate: Date(),
                status: "Pending",
                referenceNumber: generateReferenceNumber()
            )
            
            // Save issue
            saveMaintenanceIssue(issue)
            
            showingSuccess = true
        }
    }
    
    private func saveMaintenanceIssue(_ issue: MaintenanceIssue) {
        // In a real app, this would save to a database or API
        let encoder = JSONEncoder()
        if let encoded = try? encoder.encode(issue) {
            UserDefaults.standard.set(encoded, forKey: "maintenance_\(issue.id)")
            
            // Also save to a list of all issues
            var allIssues = loadAllMaintenanceIssues()
            allIssues.append(issue)
            
            if let encodedList = try? encoder.encode(allIssues) {
                UserDefaults.standard.set(encodedList, forKey: "all_maintenance_issues")
            }
        }
    }
    
    private func loadAllMaintenanceIssues() -> [MaintenanceIssue] {
        let decoder = JSONDecoder()
        if let data = UserDefaults.standard.data(forKey: "all_maintenance_issues"),
           let issues = try? decoder.decode([MaintenanceIssue].self, from: data) {
            return issues
        }
        return []
    }
    
    private func generateReferenceNumber() -> String {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let numbers = "0123456789"
        
        let letterPart = String((0..<3).map { _ in letters.randomElement()! })
        let numberPart = String((0..<4).map { _ in numbers.randomElement()! })
        
        return "MNT-\(letterPart)-\(numberPart)"
    }
    
    private func clearForm() {
        vehicleId = ""
        mileage = ""
        issueType = "Mechanical"
        urgency = "Medium"
        description = ""
        selectedImages = []
    }
}

struct MaintenanceIssue: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let mileage: Int
    let issueType: String
    let urgency: String
    let description: String
    let submittedDate: Date
    let status: String
    let referenceNumber: String
}

struct MaintenanceListView: View {
    @State private var maintenanceIssues: [MaintenanceIssue] = []
    
    var body: some View {
        NavigationView {
            List {
                if maintenanceIssues.isEmpty {
                    Text("No maintenance issues reported")
                        .foregroundColor(.secondary)
                        .italic()
                } else {
                    ForEach(maintenanceIssues) { issue in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(issue.referenceNumber)
                                    .font(.headline)
                                Spacer()
                                StatusBadge(status: issue.status)
                            }
                            
                            HStack {
                                Label(issue.vehicleId, systemImage: "car.fill")
                                    .font(.caption)
                                Spacer()
                                Label(issue.urgency, systemImage: "exclamationmark.triangle.fill")
                                    .font(.caption)
                                    .foregroundColor(urgencyColor(issue.urgency))
                            }
                            
                            Text(issue.description)
                                .font(.caption)
                                .lineLimit(2)
                                .foregroundColor(.secondary)
                            
                            Text("Submitted: \(issue.submittedDate, style: .date)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("Maintenance History")
            .onAppear {
                loadMaintenanceIssues()
            }
        }
    }
    
    private func loadMaintenanceIssues() {
        let decoder = JSONDecoder()
        if let data = UserDefaults.standard.data(forKey: "all_maintenance_issues"),
           let issues = try? decoder.decode([MaintenanceIssue].self, from: data) {
            maintenanceIssues = issues.sorted { $0.submittedDate > $1.submittedDate }
        }
    }
    
    private func urgencyColor(_ urgency: String) -> Color {
        switch urgency {
        case "Critical": return .red
        case "High": return .orange
        case "Medium": return .yellow
        case "Low": return .green
        default: return .gray
        }
    }
}

struct MaintenanceStatusBadge: View {
    let status: String

    var body: some View {
        Text(status)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(4)
    }
    
    var statusColor: Color {
        switch status {
        case "Pending": return .orange
        case "In Progress": return .blue
        case "Completed": return .green
        case "Cancelled": return .gray
        default: return .gray
        }
    }
}

// Using the existing PrimaryButtonStyle from DriverApp.swift