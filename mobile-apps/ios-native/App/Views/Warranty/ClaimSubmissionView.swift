//
//  ClaimSubmissionView.swift
//  Fleet Manager - iOS Native App
//
//  View for submitting new warranty claims with document uploads
//

import SwiftUI
import PhotosUI

struct ClaimSubmissionView: View {
    let warranty: Warranty
    @StateObject private var viewModel = WarrantyManagementViewModel()
    @Environment(\.dismiss) var dismiss

    // Form fields
    @State private var component: String = ""
    @State private var issueDescription: String = ""
    @State private var failureDate: Date = Date()
    @State private var mileageAtFailure: String = ""
    @State private var claimAmount: String = ""

    // Repair shop info
    @State private var repairShopName: String = ""
    @State private var repairShopPhone: String = ""
    @State private var repairShopAddress: String = ""
    @State private var isCertified: Bool = false

    // Document uploads
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var uploadedDocuments: [ClaimDocument] = []

    // UI State
    @State private var isSubmitting = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var showingSuccess = false
    @State private var showingPhotoPicker = false

    var body: some View {
        NavigationView {
            Form {
                // Warranty Info Section
                warrantyInfoSection

                // Issue Details Section
                issueDetailsSection

                // Failure Information
                failureInfoSection

                // Repair Shop Section
                repairShopSection

                // Document Upload Section
                documentUploadSection

                // Claim Amount Section
                claimAmountSection

                // Coverage Verification
                coverageVerificationSection
            }
            .navigationTitle("Submit Claim")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        submitClaim()
                    }
                    .disabled(!isFormValid || isSubmitting)
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
            .alert("Claim Submitted", isPresented: $showingSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your warranty claim has been submitted successfully. You will receive updates via email.")
            }
            .overlay {
                if isSubmitting {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()

                        VStack(spacing: 16) {
                            ProgressView()
                                .scaleEffect(1.5)
                            Text("Submitting claim...")
                                .font(.headline)
                        }
                        .padding(32)
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                    }
                }
            }
        }
    }

    // MARK: - Warranty Info Section
    private var warrantyInfoSection: some View {
        Section(header: Text("Warranty Information")) {
            HStack {
                Text("Type")
                    .foregroundColor(.secondary)
                Spacer()
                Text(warranty.type.displayName)
                    .fontWeight(.medium)
            }

            HStack {
                Text("Component")
                    .foregroundColor(.secondary)
                Spacer()
                Text(warranty.component)
                    .fontWeight(.medium)
            }

            HStack {
                Text("Provider")
                    .foregroundColor(.secondary)
                Spacer()
                Text(warranty.provider.name)
                    .fontWeight(.medium)
            }

            if let deductible = warranty.deductible {
                HStack {
                    Text("Deductible")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatCurrency(deductible))
                        .fontWeight(.medium)
                        .foregroundColor(.orange)
                }
            }
        }
    }

    // MARK: - Issue Details Section
    private var issueDetailsSection: some View {
        Section(header: Text("Issue Details")) {
            TextField("Component/Part", text: $component)
                .autocapitalization(.words)

            VStack(alignment: .leading, spacing: 8) {
                Text("Issue Description")
                    .font(.caption)
                    .foregroundColor(.secondary)

                TextEditor(text: $issueDescription)
                    .frame(minHeight: 100)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.separator), lineWidth: 1)
                    )
            }
            .padding(.vertical, 4)

            if issueDescription.count > 0 {
                HStack {
                    Spacer()
                    Text("\(issueDescription.count) / 500 characters")
                        .font(.caption)
                        .foregroundColor(issueDescription.count > 500 ? .red : .secondary)
                }
            }
        }
    }

    // MARK: - Failure Information
    private var failureInfoSection: some View {
        Section(header: Text("Failure Information")) {
            DatePicker("Failure Date", selection: $failureDate, displayedComponents: .date)

            HStack {
                Text("Mileage at Failure")
                TextField("0", text: $mileageAtFailure)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
            }

            if let mileageLimit = warranty.mileageLimit,
               let currentMileage = Int(mileageAtFailure),
               currentMileage > mileageLimit {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Mileage exceeds warranty limit")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
    }

    // MARK: - Repair Shop Section
    private var repairShopSection: some View {
        Section(header: Text("Repair Shop (Optional)")) {
            TextField("Shop Name", text: $repairShopName)
                .autocapitalization(.words)

            TextField("Phone Number", text: $repairShopPhone)
                .keyboardType(.phonePad)

            TextField("Address", text: $repairShopAddress)
                .autocapitalization(.words)

            Toggle("Certified Repair Shop", isOn: $isCertified)

            if warranty.coverage.limitations?.contains(where: { $0.lowercased().contains("certified") }) == true {
                HStack {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(.blue)
                    Text("This warranty requires certified repair shops")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Document Upload Section
    private var documentUploadSection: some View {
        Section(header: Text("Supporting Documents")) {
            Button {
                showingPhotoPicker = true
            } label: {
                HStack {
                    Image(systemName: "photo.on.rectangle.angled")
                        .foregroundColor(.blue)
                    Text("Add Photos/Documents")
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            if !uploadedDocuments.isEmpty {
                ForEach(uploadedDocuments) { doc in
                    HStack {
                        Image(systemName: doc.type.icon)
                            .foregroundColor(.blue)
                        Text(doc.name)
                            .font(.subheadline)
                        Spacer()
                        Button {
                            removeDocument(doc)
                        } label: {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Required Documents:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                ForEach(warranty.provider.claimProcess.requiredDocuments, id: \.self) { doc in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        Text(doc)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }

    // MARK: - Claim Amount Section
    private var claimAmountSection: some View {
        Section(header: Text("Claim Amount")) {
            HStack {
                Text("Estimated Cost")
                TextField("0.00", text: $claimAmount)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
            }

            if let maxClaim = warranty.coverage.maxClaimAmount,
               let amount = Double(claimAmount),
               amount > maxClaim {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Amount exceeds max claim limit of \(formatCurrency(maxClaim))")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }

            if let deductible = warranty.deductible,
               let amount = Double(claimAmount),
               amount > deductible {
                HStack {
                    Text("After Deductible")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatCurrency(amount - deductible))
                        .fontWeight(.medium)
                        .foregroundColor(.green)
                }
            }
        }
    }

    // MARK: - Coverage Verification
    private var coverageVerificationSection: some View {
        Section(header: Text("Coverage Verification")) {
            let mileage = Int(mileageAtFailure)
            let isCovered = warranty.isComponentCovered(
                component: component,
                mileage: mileage,
                date: failureDate
            )

            HStack {
                Image(systemName: isCovered ? "checkmark.shield.fill" : "xmark.shield.fill")
                    .foregroundColor(isCovered ? .green : .red)

                VStack(alignment: .leading, spacing: 4) {
                    Text(isCovered ? "Component is covered" : "Component may not be covered")
                        .fontWeight(.medium)
                        .foregroundColor(isCovered ? .green : .red)

                    if !isCovered {
                        Text("Please verify coverage details before submitting")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()
            }
            .padding(.vertical, 8)

            if let processingDays = warranty.provider.claimProcess.averageProcessingDays {
                HStack {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.blue)
                    Text("Average processing time: \(processingDays) days")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    // MARK: - Form Validation
    private var isFormValid: Bool {
        !component.isEmpty &&
        !issueDescription.isEmpty &&
        issueDescription.count <= 500 &&
        failureDate <= Date()
    }

    // MARK: - Actions
    private func submitClaim() {
        isSubmitting = true

        let repairShop: RepairShop? = repairShopName.isEmpty ? nil : RepairShop(
            name: repairShopName,
            phone: repairShopPhone,
            address: repairShopAddress,
            certified: isCertified
        )

        let request = CreateClaimRequest(
            warrantyId: warranty.id,
            issueDescription: issueDescription,
            component: component,
            failureDate: failureDate,
            mileageAtFailure: Int(mileageAtFailure),
            claimAmount: Double(claimAmount),
            repairShop: repairShop
        )

        Task {
            do {
                _ = try await viewModel.submitClaim(request: request)
                await MainActor.run {
                    isSubmitting = false
                    showingSuccess = true
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = error.localizedDescription
                    showingError = true
                }
            }
        }
    }

    private func removeDocument(_ document: ClaimDocument) {
        uploadedDocuments.removeAll { $0.id == document.id }
    }

    // MARK: - Helper Functions
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Preview
struct ClaimSubmissionView_Previews: PreviewProvider {
    static var previews: some View {
        ClaimSubmissionView(warranty: sampleWarranty)
    }

    static var sampleWarranty: Warranty {
        Warranty(
            id: "1",
            tenantId: "tenant1",
            vehicleId: "vehicle1",
            component: "Engine",
            provider: WarrantyProvider(
                name: "AutoShield",
                contact: ProviderContact(
                    phone: "1-800-555-0100",
                    email: "claims@autoshield.com",
                    website: "https://autoshield.com",
                    address: nil,
                    hours: nil
                ),
                claimProcess: ClaimProcess(
                    submissionMethod: "Online",
                    requiredDocuments: ["Invoice", "Photos", "Diagnostic Report"],
                    averageProcessingDays: 10,
                    onlinePortal: nil
                ),
                serviceLevel: nil,
                rating: nil
            ),
            type: .powertrain,
            startDate: Date().addingTimeInterval(-365*24*60*60),
            endDate: Date().addingTimeInterval(365*24*60*60),
            mileageLimit: 100000,
            coverage: WarrantyCoverage(
                coveredComponents: ["Engine", "Transmission", "Drivetrain"],
                exclusions: ["Wear and tear", "Modifications"],
                limitations: ["Must use certified repair shops"],
                maxClaimAmount: 5000,
                aggregateLimit: nil
            ),
            terms: "Standard terms",
            purchasePrice: nil,
            deductible: 100,
            status: .active,
            documentURL: nil,
            notes: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}
