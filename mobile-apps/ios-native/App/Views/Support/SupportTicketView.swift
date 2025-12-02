//
//  SupportTicketView.swift
//  Fleet Management - iOS Native App
//
//  In-app support ticket submission system
//  Allows users to submit support requests with attachments and device info
//

import SwiftUI
import UIKit
import Photos
import Combine

// MARK: - Support Ticket View

struct SupportTicketView: View {
    @StateObject private var viewModel = SupportTicketViewModel()
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focusedField: Field?

    enum Field {
        case subject, description
    }

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 24) {
                        // Header Section
                        supportHeaderSection

                        // Ticket Form
                        ticketFormSection

                        // Attachments Section
                        attachmentsSection

                        // Device Info Section
                        deviceInfoSection

                        // Submit Button
                        submitButton
                    }
                    .padding()
                }
                .navigationTitle("Contact Support")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            dismiss()
                        }
                    }
                }

                // Loading Overlay
                if viewModel.isSubmitting {
                    loadingOverlay
                }
            }
            .alert("Ticket Submitted", isPresented: $viewModel.showSuccessAlert) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your support ticket #\(viewModel.submittedTicketNumber) has been created. We'll respond within \(viewModel.estimatedResponseTime).")
            }
            .alert("Error", isPresented: $viewModel.showErrorAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
            .sheet(isPresented: $viewModel.showImagePicker) {
                ImagePicker(
                    selectedImages: $viewModel.selectedImages,
                    maxImages: 5
                )
            }
            .sheet(isPresented: $viewModel.showDocumentPicker) {
                DocumentPicker(selectedDocuments: $viewModel.selectedDocuments)
            }
        }
    }

    // MARK: - Header Section

    private var supportHeaderSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "questionmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("How can we help?")
                .font(.title2)
                .fontWeight(.bold)

            Text("Describe your issue and we'll get back to you as soon as possible.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .padding(.vertical)
    }

    // MARK: - Ticket Form Section

    private var ticketFormSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Priority Selector
            VStack(alignment: .leading, spacing: 8) {
                Text("Priority")
                    .font(.headline)

                Picker("Priority", selection: $viewModel.selectedPriority) {
                    ForEach(SupportTicketPriority.allCases, id: \.self) { priority in
                        HStack {
                            Image(systemName: priority.icon)
                            Text(priority.displayName)
                        }
                        .tag(priority)
                    }
                }
                .pickerStyle(.segmented)

                Text(viewModel.selectedPriority.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Category Selector
            VStack(alignment: .leading, spacing: 8) {
                Text("Category")
                    .font(.headline)

                Menu {
                    ForEach(SupportTicketCategory.allCases, id: \.self) { category in
                        Button(action: {
                            viewModel.selectedCategory = category
                        }) {
                            HStack {
                                Image(systemName: category.icon)
                                Text(category.displayName)
                            }
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: viewModel.selectedCategory.icon)
                        Text(viewModel.selectedCategory.displayName)
                        Spacer()
                        Image(systemName: "chevron.down")
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                }
            }

            // Subject Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Subject")
                    .font(.headline)

                TextField("Brief description of your issue", text: $viewModel.subject)
                    .textFieldStyle(.roundedBorder)
                    .focused($focusedField, equals: .subject)
                    .submitLabel(.next)
                    .onSubmit {
                        focusedField = .description
                    }

                if !viewModel.subjectError.isEmpty {
                    Text(viewModel.subjectError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            // Description Field
            VStack(alignment: .leading, spacing: 8) {
                Text("Description")
                    .font(.headline)

                TextEditor(text: $viewModel.description)
                    .frame(height: 150)
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .focused($focusedField, equals: .description)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(.systemGray4), lineWidth: 1)
                    )

                HStack {
                    if !viewModel.descriptionError.isEmpty {
                        Text(viewModel.descriptionError)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    Spacer()

                    Text("\(viewModel.description.count)/1000")
                        .font(.caption)
                        .foregroundColor(viewModel.description.count > 1000 ? .red : .secondary)
                }
            }

            // Contact Email
            VStack(alignment: .leading, spacing: 8) {
                Text("Contact Email")
                    .font(.headline)

                TextField("your.email@company.com", text: $viewModel.contactEmail)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)

                if !viewModel.emailError.isEmpty {
                    Text(viewModel.emailError)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
    }

    // MARK: - Attachments Section

    private var attachmentsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Attachments (Optional)")
                .font(.headline)

            Text("Add screenshots or logs to help us understand your issue")
                .font(.caption)
                .foregroundColor(.secondary)

            // Attachment Buttons
            HStack(spacing: 12) {
                Button(action: {
                    viewModel.showImagePicker = true
                }) {
                    HStack {
                        Image(systemName: "photo.on.rectangle.angled")
                        Text("Photos")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(10)
                }

                Button(action: {
                    viewModel.captureScreenshot()
                }) {
                    HStack {
                        Image(systemName: "camera.viewfinder")
                        Text("Screenshot")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .foregroundColor(.green)
                    .cornerRadius(10)
                }
            }

            HStack(spacing: 12) {
                Button(action: {
                    viewModel.attachAppLogs()
                }) {
                    HStack {
                        Image(systemName: "doc.text")
                        Text("App Logs")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .foregroundColor(.orange)
                    .cornerRadius(10)
                }

                Button(action: {
                    viewModel.showDocumentPicker = true
                }) {
                    HStack {
                        Image(systemName: "doc.badge.plus")
                        Text("Documents")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.purple.opacity(0.1))
                    .foregroundColor(.purple)
                    .cornerRadius(10)
                }
            }

            // Selected Attachments List
            if !viewModel.attachments.isEmpty {
                VStack(spacing: 8) {
                    ForEach(viewModel.attachments.indices, id: \.self) { index in
                        attachmentRow(for: viewModel.attachments[index], at: index)
                    }
                }
                .padding(.top, 8)
            }

            // Attachment Size Warning
            if viewModel.totalAttachmentSize > 0 {
                HStack {
                    Image(systemName: "info.circle")
                    Text("Total size: \(formatBytes(viewModel.totalAttachmentSize))")
                    if viewModel.totalAttachmentSize > 10_000_000 {
                        Text("(May take longer to upload)")
                            .foregroundColor(.orange)
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
    }

    private func attachmentRow(for attachment: SupportAttachment, at index: Int) -> some View {
        HStack {
            Image(systemName: attachment.icon)
                .foregroundColor(.blue)

            VStack(alignment: .leading, spacing: 2) {
                Text(attachment.name)
                    .font(.subheadline)
                    .lineLimit(1)

                Text(formatBytes(attachment.size))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: {
                viewModel.removeAttachment(at: index)
            }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }

    // MARK: - Device Info Section

    private var deviceInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Device Information")
                    .font(.headline)

                Spacer()

                Button(action: {
                    withAnimation {
                        viewModel.showDeviceInfo.toggle()
                    }
                }) {
                    Image(systemName: viewModel.showDeviceInfo ? "chevron.up" : "chevron.down")
                        .foregroundColor(.blue)
                }
            }

            Text("This information helps us diagnose your issue")
                .font(.caption)
                .foregroundColor(.secondary)

            if viewModel.showDeviceInfo {
                VStack(spacing: 8) {
                    deviceInfoRow(label: "App Version", value: viewModel.deviceInfo.appVersion)
                    deviceInfoRow(label: "iOS Version", value: viewModel.deviceInfo.iOSVersion)
                    deviceInfoRow(label: "Device Model", value: viewModel.deviceInfo.deviceModel)
                    deviceInfoRow(label: "Device ID", value: viewModel.deviceInfo.deviceID)
                    deviceInfoRow(label: "Network Status", value: viewModel.deviceInfo.networkStatus)
                    deviceInfoRow(label: "Last Sync", value: viewModel.deviceInfo.lastSyncTime)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }

            Toggle("Include device info in ticket", isOn: $viewModel.includeDeviceInfo)
                .tint(.blue)
        }
    }

    private func deviceInfoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .foregroundColor(.primary)
                .lineLimit(1)
        }
    }

    // MARK: - Submit Button

    private var submitButton: some View {
        Button(action: {
            viewModel.submitTicket()
        }) {
            HStack {
                Image(systemName: "paperplane.fill")
                Text("Submit Ticket")
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(viewModel.isFormValid ? Color.blue : Color.gray)
            .cornerRadius(10)
        }
        .disabled(!viewModel.isFormValid || viewModel.isSubmitting)
        .padding(.bottom, 20)
    }

    // MARK: - Loading Overlay

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)

                Text("Submitting ticket...")
                    .foregroundColor(.white)
                    .font(.headline)

                if viewModel.uploadProgress > 0 && viewModel.uploadProgress < 1 {
                    ProgressView(value: viewModel.uploadProgress)
                        .progressViewStyle(.linear)
                        .frame(width: 200)
                        .tint(.white)

                    Text("\(Int(viewModel.uploadProgress * 100))% uploaded")
                        .foregroundColor(.white)
                        .font(.caption)
                }
            }
            .padding(30)
            .background(Color(.systemGray))
            .cornerRadius(15)
        }
    }

    // MARK: - Helper Methods

    private func formatBytes(_ bytes: Int) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(bytes))
    }
}

// MARK: - Support Ticket Priority

enum SupportTicketPriority: String, CaseIterable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"

    var displayName: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }

    var icon: String {
        switch self {
        case .low: return "arrow.down.circle"
        case .medium: return "minus.circle"
        case .high: return "arrow.up.circle"
        case .critical: return "exclamationmark.triangle.fill"
        }
    }

    var description: String {
        switch self {
        case .low:
            return "Minor issue, no immediate impact"
        case .medium:
            return "Moderate issue, workaround available"
        case .high:
            return "Major issue, affecting work"
        case .critical:
            return "Critical issue, cannot work"
        }
    }

    var estimatedResponseTime: String {
        switch self {
        case .low: return "2 business days"
        case .medium: return "1 business day"
        case .high: return "4 hours"
        case .critical: return "1 hour"
        }
    }
}

// MARK: - Support Ticket Category

enum SupportTicketCategory: String, CaseIterable {
    case login = "login"
    case gps = "gps"
    case obd2 = "obd2"
    case sync = "sync"
    case photos = "photos"
    case notifications = "notifications"
    case performance = "performance"
    case crashes = "crashes"
    case featureRequest = "feature_request"
    case other = "other"

    var displayName: String {
        switch self {
        case .login: return "Login Issues"
        case .gps: return "GPS / Location"
        case .obd2: return "OBD2 Connection"
        case .sync: return "Data Sync"
        case .photos: return "Photos / Camera"
        case .notifications: return "Notifications"
        case .performance: return "Performance"
        case .crashes: return "App Crashes"
        case .featureRequest: return "Feature Request"
        case .other: return "Other"
        }
    }

    var icon: String {
        switch self {
        case .login: return "person.crop.circle.badge.xmark"
        case .gps: return "location.circle"
        case .obd2: return "antenna.radiowaves.left.and.right"
        case .sync: return "arrow.triangle.2.circlepath"
        case .photos: return "camera"
        case .notifications: return "bell.badge"
        case .performance: return "speedometer"
        case .crashes: return "xmark.octagon"
        case .featureRequest: return "lightbulb"
        case .other: return "questionmark.circle"
        }
    }
}

// MARK: - Support Attachment

struct SupportAttachment: Identifiable {
    let id = UUID()
    let name: String
    let data: Data
    let mimeType: String

    var size: Int {
        return data.count
    }

    var icon: String {
        if mimeType.hasPrefix("image/") {
            return "photo"
        } else if mimeType == "text/plain" {
            return "doc.text"
        } else {
            return "doc"
        }
    }
}

// MARK: - Device Info

struct DeviceInfo {
    let appVersion: String
    let iOSVersion: String
    let deviceModel: String
    let deviceID: String
    let networkStatus: String
    let lastSyncTime: String

    static var current: DeviceInfo {
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
        let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
        let iOSVersion = UIDevice.current.systemVersion
        let deviceModel = UIDevice.current.model
        let deviceID = UIDevice.current.identifierForVendor?.uuidString ?? "Unknown"
        let networkStatus = NetworkMonitor.shared.isConnected ? "Connected (\(NetworkMonitor.shared.connectionType))" : "Offline"

        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .short
        dateFormatter.timeStyle = .short
        let lastSyncTime = dateFormatter.string(from: DataPersistenceManager.shared.lastSyncDate ?? Date())

        return DeviceInfo(
            appVersion: "\(appVersion) (\(buildNumber))",
            iOSVersion: iOSVersion,
            deviceModel: deviceModel,
            deviceID: deviceID,
            networkStatus: networkStatus,
            lastSyncTime: lastSyncTime
        )
    }
}

// MARK: - Support Ticket View Model

class SupportTicketViewModel: ObservableObject {
    // Form Fields
    @Published var selectedPriority: SupportTicketPriority = .medium
    @Published var selectedCategory: SupportTicketCategory = .other
    @Published var subject: String = ""
    @Published var description: String = ""
    @Published var contactEmail: String = ""

    // Attachments
    @Published var attachments: [SupportAttachment] = []
    @Published var selectedImages: [UIImage] = []
    @Published var selectedDocuments: [URL] = []
    @Published var showImagePicker = false
    @Published var showDocumentPicker = false

    // Device Info
    @Published var deviceInfo = DeviceInfo.current
    @Published var includeDeviceInfo = true
    @Published var showDeviceInfo = false

    // UI State
    @Published var isSubmitting = false
    @Published var showSuccessAlert = false
    @Published var showErrorAlert = false
    @Published var errorMessage = ""
    @Published var uploadProgress: Double = 0

    // Validation Errors
    @Published var subjectError = ""
    @Published var descriptionError = ""
    @Published var emailError = ""

    // Success State
    @Published var submittedTicketNumber = ""

    var estimatedResponseTime: String {
        return selectedPriority.estimatedResponseTime
    }

    var totalAttachmentSize: Int {
        return attachments.reduce(0) { $0 + $1.size }
    }

    var isFormValid: Bool {
        validateForm()
        return subjectError.isEmpty && descriptionError.isEmpty && emailError.isEmpty
    }

    init() {
        // Pre-fill contact email from user profile
        if let currentUser = AuthenticationManager.shared.currentUser {
            contactEmail = currentUser.email
        }

        // Watch for selected images
        $selectedImages
            .sink { [weak self] images in
                self?.processSelectedImages(images)
            }
            .store(in: &cancellables)
    }

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Validation

    @discardableResult
    private func validateForm() -> Bool {
        // Validate subject
        if subject.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            subjectError = "Subject is required"
        } else if subject.count < 5 {
            subjectError = "Subject must be at least 5 characters"
        } else {
            subjectError = ""
        }

        // Validate description
        if description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            descriptionError = "Description is required"
        } else if description.count < 20 {
            descriptionError = "Please provide more details (minimum 20 characters)"
        } else if description.count > 1000 {
            descriptionError = "Description too long (maximum 1000 characters)"
        } else {
            descriptionError = ""
        }

        // Validate email
        if contactEmail.isEmpty {
            emailError = "Email is required"
        } else if !isValidEmail(contactEmail) {
            emailError = "Please enter a valid email address"
        } else {
            emailError = ""
        }

        return subjectError.isEmpty && descriptionError.isEmpty && emailError.isEmpty
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Attachments

    func processSelectedImages(_ images: [UIImage]) {
        for image in images {
            if let imageData = image.jpegData(compressionQuality: 0.8) {
                let attachment = SupportAttachment(
                    name: "screenshot_\(Date().timeIntervalSince1970).jpg",
                    data: imageData,
                    mimeType: "image/jpeg"
                )
                attachments.append(attachment)
            }
        }
        selectedImages.removeAll()
    }

    func captureScreenshot() {
        // Capture current screen
        guard let window = UIApplication.shared.windows.first else { return }

        let renderer = UIGraphicsImageRenderer(bounds: window.bounds)
        let screenshot = renderer.image { context in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }

        if let imageData = screenshot.jpegData(compressionQuality: 0.8) {
            let attachment = SupportAttachment(
                name: "screenshot_\(Date().timeIntervalSince1970).jpg",
                data: imageData,
                mimeType: "image/jpeg"
            )
            attachments.append(attachment)
        }
    }

    func attachAppLogs() {
        // Get app logs from LoggingManager
        let logs = LoggingManager.shared.getRecentLogs(limit: 1000)
        let logData = logs.data(using: .utf8) ?? Data()

        let attachment = SupportAttachment(
            name: "app_logs_\(Date().timeIntervalSince1970).txt",
            data: logData,
            mimeType: "text/plain"
        )
        attachments.append(attachment)
    }

    func removeAttachment(at index: Int) {
        attachments.remove(at: index)
    }

    // MARK: - Submit Ticket

    func submitTicket() {
        guard validateForm() else { return }

        isSubmitting = true
        uploadProgress = 0

        Task {
            do {
                // Upload attachments first
                var attachmentURLs: [String] = []

                for (index, attachment) in attachments.enumerated() {
                    let url = try await uploadAttachment(attachment)
                    attachmentURLs.append(url)

                    await MainActor.run {
                        uploadProgress = Double(index + 1) / Double(attachments.count) * 0.7
                    }
                }

                // Prepare ticket data
                let ticketData = [
                    "priority": selectedPriority.rawValue,
                    "category": selectedCategory.rawValue,
                    "subject": subject,
                    "description": description,
                    "contact_email": contactEmail,
                    "attachments": attachmentURLs,
                    "device_info": includeDeviceInfo ? deviceInfoDictionary() : [:],
                    "user_id": AuthenticationManager.shared.currentUser?.id ?? 0
                ] as [String : Any]

                await MainActor.run {
                    uploadProgress = 0.8
                }

                // Submit ticket to API
                let ticketNumber = try await submitTicketToAPI(ticketData)

                await MainActor.run {
                    uploadProgress = 1.0
                    submittedTicketNumber = ticketNumber
                    isSubmitting = false
                    showSuccessAlert = true

                    // Log analytics event
                    AnalyticsManager.shared.logEvent("support_ticket_submitted", parameters: [
                        "priority": selectedPriority.rawValue,
                        "category": selectedCategory.rawValue
                    ])
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = error.localizedDescription
                    showErrorAlert = true
                }
            }
        }
    }

    private func uploadAttachment(_ attachment: SupportAttachment) async throws -> String {
        // Upload to media service
        let urlString = "\(APIConfiguration.apiBaseURL)/api/v1/support/attachments"
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        // Add authentication header
        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Create multipart form data
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var data = Data()
        data.append("--\(boundary)\r\n".data(using: .utf8)!)
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(attachment.name)\"\r\n".data(using: .utf8)!)
        data.append("Content-Type: \(attachment.mimeType)\r\n\r\n".data(using: .utf8)!)
        data.append(attachment.data)
        data.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = data

        let (responseData, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }

        let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any]
        guard let attachmentURL = json?["url"] as? String else {
            throw URLError(.cannotParseResponse)
        }

        return attachmentURL
    }

    private func submitTicketToAPI(_ data: [String: Any]) async throws -> String {
        let urlString = "\(APIConfiguration.apiBaseURL)/api/v1/support/tickets"
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add authentication header
        if let token = KeychainManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: data)

        let (responseData, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }

        let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any]
        guard let ticket = json?["ticket"] as? [String: Any],
              let ticketNumber = ticket["ticket_number"] as? String else {
            throw URLError(.cannotParseResponse)
        }

        return ticketNumber
    }

    private func deviceInfoDictionary() -> [String: String] {
        return [
            "app_version": deviceInfo.appVersion,
            "ios_version": deviceInfo.iOSVersion,
            "device_model": deviceInfo.deviceModel,
            "device_id": deviceInfo.deviceID,
            "network_status": deviceInfo.networkStatus,
            "last_sync_time": deviceInfo.lastSyncTime
        ]
    }
}

// MARK: - Image Picker (UIKit Bridge)

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImages: [UIImage]
    var maxImages: Int = 5
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImages.append(image)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Document Picker (UIKit Bridge)

struct DocumentPicker: UIViewControllerRepresentable {
    @Binding var selectedDocuments: [URL]
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.text, .pdf, .data])
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = true
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker

        init(_ parent: DocumentPicker) {
            self.parent = parent
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.selectedDocuments = urls
            parent.dismiss()
        }

        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            parent.dismiss()
        }
    }
}

// MARK: - Preview

struct SupportTicketView_Previews: PreviewProvider {
    static var previews: some View {
        SupportTicketView()
    }
}
