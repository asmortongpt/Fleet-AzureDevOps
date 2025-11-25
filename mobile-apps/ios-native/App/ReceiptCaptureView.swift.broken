/**
 * Receipt Capture View
 *
 * Mobile-friendly interface for capturing receipts (fuel, maintenance, etc.)
 * - Camera capture with auto-focus
 * - OCR processing for automatic data extraction
 * - Manual data entry fallback
 * - Photo library support
 */

import SwiftUI
import AVFoundation
import VisionKit

struct ReceiptCaptureView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = ReceiptCaptureViewModel()
    @State private var showingCamera = false
    @State private var showingImagePicker = false
    @State private var showingDocumentScanner = false
    @State private var capturedImage: UIImage?
    @State private var isProcessing = false
    @State private var showingConfirmation = false

    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 20) {
                        // MARK: - Header
                        headerSection

                        // MARK: - Capture Options
                        captureOptionsSection

                        // MARK: - Preview
                        if let image = capturedImage {
                            imagePreviewSection(image: image)
                        }

                        // MARK: - OCR Results
                        if viewModel.isProcessed {
                            ocrResultsSection
                        }

                        // MARK: - Manual Entry
                        if viewModel.showManualEntry {
                            manualEntrySection
                        }
                    }
                    .padding()
                }

                // MARK: - Loading Overlay
                if isProcessing {
                    processingOverlay
                }
            }
            .navigationTitle("Capture Receipt")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            await viewModel.saveReceipt()
                            showingConfirmation = true
                        }
                    }
                    .disabled(!viewModel.canSave)
                }
            }
            .sheet(isPresented: $showingCamera) {
                CameraView(image: $capturedImage, onCapture: processImage)
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $capturedImage, onSelect: processImage)
            }
            .sheet(isPresented: $showingDocumentScanner) {
                DocumentScannerView(image: $capturedImage, onScan: processImage)
            }
            .alert("Receipt Saved", isPresented: $showingConfirmation) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Your receipt has been processed and saved successfully.")
            }
        }
    }

    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "doc.text.viewfinder")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Scan Your Receipt")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Take a photo or select from your library")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }

    // MARK: - Capture Options Section
    private var captureOptionsSection: some View {
        VStack(spacing: 16) {
            Button(action: { showingCamera = true }) {
                HStack {
                    Image(systemName: "camera.fill")
                        .font(.title3)
                    Text("Take Photo")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }
            .foregroundColor(.primary)

            Button(action: { showingDocumentScanner = true }) {
                HStack {
                    Image(systemName: "doc.text.viewfinder")
                        .font(.title3)
                    Text("Scan Document")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(12)
            }
            .foregroundColor(.primary)

            Button(action: { showingImagePicker = true }) {
                HStack {
                    Image(systemName: "photo.on.rectangle")
                        .font(.title3)
                    Text("Choose from Library")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.purple.opacity(0.1))
                .cornerRadius(12)
            }
            .foregroundColor(.primary)
        }
    }

    // MARK: - Image Preview Section
    private func imagePreviewSection(image: UIImage) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Receipt Preview")
                .font(.headline)

            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxHeight: 300)
                .cornerRadius(12)
                .shadow(radius: 5)

            Button("Retake Photo") {
                capturedImage = nil
                viewModel.reset()
            }
            .font(.subheadline)
            .foregroundColor(.blue)
        }
    }

    // MARK: - OCR Results Section
    private var ocrResultsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Extracted Information")
                .font(.headline)

            if let results = viewModel.ocrResults {
                VStack(spacing: 12) {
                    ResultRow(label: "Date", value: results.date, confidence: results.confidenceScores["date"])
                    ResultRow(label: "Merchant", value: results.merchant, confidence: results.confidenceScores["merchant"])
                    ResultRow(label: "Amount", value: String(format: "$%.2f", results.totalAmount), confidence: results.confidenceScores["amount"])
                    ResultRow(label: "Category", value: results.category, confidence: results.confidenceScores["category"])
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)

                if results.lowConfidenceFields.count > 0 {
                    HStack {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundColor(.orange)
                        Text("Some fields have low confidence. Please review.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Button("Edit Information") {
                viewModel.showManualEntry = true
            }
            .font(.subheadline)
            .foregroundColor(.blue)
        }
    }

    // MARK: - Manual Entry Section
    private var manualEntrySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Manual Entry")
                .font(.headline)

            VStack(spacing: 12) {
                TextField("Date", text: $viewModel.manualData.date)
                    .textFieldStyle(.roundedBorder)

                TextField("Merchant", text: $viewModel.manualData.merchant)
                    .textFieldStyle(.roundedBorder)

                TextField("Amount", value: $viewModel.manualData.amount, format: .currency(code: "USD"))
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.decimalPad)

                Picker("Category", selection: $viewModel.manualData.category) {
                    Text("Fuel").tag("fuel")
                    Text("Maintenance").tag("maintenance")
                    Text("Parking").tag("parking")
                    Text("Toll").tag("toll")
                    Text("Other").tag("other")
                }
                .pickerStyle(.menu)

                TextField("Notes (Optional)", text: $viewModel.manualData.notes, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)
            }
        }
    }

    // MARK: - Processing Overlay
    private var processingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))

                Text("Processing Receipt...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(40)
            .background(Color(.systemBackground))
            .cornerRadius(20)
            .shadow(radius: 20)
        }
    }

    // MARK: - Process Image
    private func processImage() {
        guard let image = capturedImage else { return }

        isProcessing = true
        Task {
            await viewModel.processReceipt(image: image)
            isProcessing = false
        }
    }
}

// MARK: - Result Row
struct ResultRow: View {
    let label: String
    let value: String
    let confidence: Double?

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            HStack(spacing: 8) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)

                if let confidence = confidence, confidence < 0.8 {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.orange)
                        .font(.caption)
                }
            }
        }
    }
}

// MARK: - View Model
@MainActor
class ReceiptCaptureViewModel: ObservableObject {
    @Published var isProcessed = false
    @Published var showManualEntry = false
    @Published var ocrResults: ReceiptOCRResults?
    @Published var manualData = ManualReceiptData()

    var canSave: Bool {
        if isProcessed, let results = ocrResults {
            return !results.merchant.isEmpty && results.totalAmount > 0
        }
        return !manualData.merchant.isEmpty && manualData.amount > 0
    }

    func processReceipt(image: UIImage) async {
        // Call OCR API endpoint
        guard let imageData = image.jpegData(compressionQuality: 0.8) else { return }

        do {
            let results = try await APIService.shared.processReceiptOCR(imageData: imageData)
            self.ocrResults = results
            self.isProcessed = true

            // Pre-fill manual data from OCR
            self.manualData.date = results.date
            self.manualData.merchant = results.merchant
            self.manualData.amount = results.totalAmount
            self.manualData.category = results.category
        } catch {
            print("OCR processing failed: \(error)")
            self.showManualEntry = true
        }
    }

    func saveReceipt() async {
        let receiptData: [String: Any] = [
            "date": ocrResults?.date ?? manualData.date,
            "merchant": ocrResults?.merchant ?? manualData.merchant,
            "amount": ocrResults?.totalAmount ?? manualData.amount,
            "category": ocrResults?.category ?? manualData.category,
            "notes": manualData.notes
        ]

        do {
            try await APIService.shared.saveReceipt(data: receiptData)
        } catch {
            print("Failed to save receipt: \(error)")
        }
    }

    func reset() {
        isProcessed = false
        showManualEntry = false
        ocrResults = nil
        manualData = ManualReceiptData()
    }
}

// MARK: - Models
struct ReceiptOCRResults {
    let date: String
    let merchant: String
    let totalAmount: Double
    let category: String
    let confidenceScores: [String: Double]

    var lowConfidenceFields: [String] {
        confidenceScores.filter { $0.value < 0.8 }.map { $0.key }
    }
}

struct ManualReceiptData {
    var date: String = ""
    var merchant: String = ""
    var amount: Double = 0.0
    var category: String = "other"
    var notes: String = ""
}

#Preview {
    ReceiptCaptureView()
}
