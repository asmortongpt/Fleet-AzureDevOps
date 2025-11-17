/**
 * Document Scanner View for Fleet Management
 * VNDocumentCameraViewController wrapper for iOS
 * Supports scanning forms, receipts, and documents
 * Auto edge detection and perspective correction
 */

import SwiftUI
import VisionKit

// MARK: - Document Scanner View
struct DocumentScannerView: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss

    let documentType: DocumentType
    let onComplete: ([ScannedDocument]) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let scanner = VNDocumentCameraViewController()
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {
        // No updates needed
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(documentType: documentType, onComplete: onComplete, onCancel: onCancel)
    }

    class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let documentType: DocumentType
        let onComplete: ([ScannedDocument]) -> Void
        let onCancel: () -> Void

        init(documentType: DocumentType, onComplete: @escaping ([ScannedDocument]) -> Void, onCancel: @escaping () -> Void) {
            self.documentType = documentType
            self.onComplete = onComplete
            self.onCancel = onCancel
        }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFinishWith scan: VNDocumentCameraScan
        ) {
            var scannedDocuments: [ScannedDocument] = []

            for pageIndex in 0..<scan.pageCount {
                let image = scan.imageOfPage(at: pageIndex)

                let document = ScannedDocument(
                    image: image,
                    documentType: documentType,
                    pageNumber: pageIndex + 1,
                    totalPages: scan.pageCount,
                    timestamp: Date()
                )

                scannedDocuments.append(document)
            }

            controller.dismiss(animated: true) {
                self.onComplete(scannedDocuments)
            }
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            controller.dismiss(animated: true) {
                self.onCancel()
            }
        }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFailWithError error: Error
        ) {
            print("❌ Document scanning error: \(error.localizedDescription)")
            controller.dismiss(animated: true) {
                self.onCancel()
            }
        }
    }
}

// MARK: - Document Scanner SwiftUI Wrapper
struct DocumentScannerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showingScanner = true

    let documentType: DocumentType
    let onComplete: ([ScannedDocument]) -> Void

    var body: some View {
        ZStack {
            if showingScanner {
                DocumentScannerView(
                    documentType: documentType,
                    onComplete: { documents in
                        showingScanner = false
                        onComplete(documents)
                        dismiss()
                    },
                    onCancel: {
                        showingScanner = false
                        dismiss()
                    }
                )
            }
        }
    }
}

// MARK: - Document Preview View
struct DocumentPreviewView: View {
    let documents: [ScannedDocument]
    let onSave: () -> Void
    let onRetake: () -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var currentPage = 0

    var body: some View {
        NavigationView {
            VStack {
                // Document image
                TabView(selection: $currentPage) {
                    ForEach(documents.indices, id: \.self) { index in
                        DocumentPageView(document: documents[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page)
                .indexViewStyle(.page(backgroundDisplayMode: .always))

                // Page indicator
                Text("Page \(currentPage + 1) of \(documents.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 8)

                // Actions
                HStack(spacing: 20) {
                    Button(action: onRetake) {
                        VStack {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.title2)
                            Text("Retake")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)

                    Button(action: {
                        onSave()
                        dismiss()
                    }) {
                        VStack {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title2)
                            Text("Save")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .navigationTitle(documents.first?.documentType.title ?? "Document")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Document Page View
struct DocumentPageView: View {
    let document: ScannedDocument
    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0

    var body: some View {
        GeometryReader { geometry in
            ScrollView([.horizontal, .vertical], showsIndicators: false) {
                Image(uiImage: document.image)
                    .resizable()
                    .scaledToFit()
                    .scaleEffect(scale)
                    .gesture(
                        MagnificationGesture()
                            .onChanged { value in
                                scale = lastScale * value
                            }
                            .onEnded { value in
                                lastScale = scale

                                // Limit scale
                                if scale < 1.0 {
                                    withAnimation {
                                        scale = 1.0
                                        lastScale = 1.0
                                    }
                                } else if scale > 4.0 {
                                    withAnimation {
                                        scale = 4.0
                                        lastScale = 4.0
                                    }
                                }
                            }
                    )
            }
        }
    }
}

// MARK: - Scanned Document Model
struct ScannedDocument: Identifiable {
    let id = UUID()
    let image: UIImage
    let documentType: DocumentType
    let pageNumber: Int
    let totalPages: Int
    let timestamp: Date
    var vehicleId: String?
    var notes: String?
}

// MARK: - Document Type
enum DocumentType {
    case maintenanceReceipt
    case inspectionForm
    case registrationDocument
    case insuranceCard
    case accidentReport
    case fuelReceipt
    case general

    var title: String {
        switch self {
        case .maintenanceReceipt: return "Maintenance Receipt"
        case .inspectionForm: return "Inspection Form"
        case .registrationDocument: return "Registration"
        case .insuranceCard: return "Insurance Card"
        case .accidentReport: return "Accident Report"
        case .fuelReceipt: return "Fuel Receipt"
        case .general: return "Document"
        }
    }

    var icon: String {
        switch self {
        case .maintenanceReceipt: return "wrench.and.screwdriver"
        case .inspectionForm: return "checklist"
        case .registrationDocument: return "doc.text"
        case .insuranceCard: return "shield.fill"
        case .accidentReport: return "exclamationmark.triangle"
        case .fuelReceipt: return "fuelpump.fill"
        case .general: return "doc.fill"
        }
    }
}

// MARK: - Document Availability Check
@available(iOS 13.0, *)
func isDocumentScannerAvailable() -> Bool {
    return VNDocumentCameraViewController.isSupported
}

// MARK: - Document Scanner Button
struct DocumentScannerButton: View {
    let documentType: DocumentType
    let onComplete: ([ScannedDocument]) -> Void

    @State private var showingScanner = false
    @State private var scannedDocuments: [ScannedDocument] = []
    @State private var showingPreview = false

    var body: some View {
        Button(action: {
            if VNDocumentCameraViewController.isSupported {
                showingScanner = true
            }
        }) {
            Label("Scan \(documentType.title)", systemImage: documentType.icon)
        }
        .disabled(!VNDocumentCameraViewController.isSupported)
        .sheet(isPresented: $showingScanner) {
            DocumentScannerSheet(documentType: documentType) { documents in
                scannedDocuments = documents
                showingPreview = true
            }
        }
        .sheet(isPresented: $showingPreview) {
            DocumentPreviewView(
                documents: scannedDocuments,
                onSave: {
                    onComplete(scannedDocuments)
                },
                onRetake: {
                    showingPreview = false
                    showingScanner = true
                }
            )
        }
    }
}

// MARK: - Document List View
struct DocumentListView: View {
    let documents: [ScannedDocument]

    var body: some View {
        List {
            ForEach(documents) { document in
                DocumentListRow(document: document)
            }
        }
        .navigationTitle("Scanned Documents")
    }
}

struct DocumentListRow: View {
    let document: ScannedDocument

    var body: some View {
        HStack {
            // Thumbnail
            Image(uiImage: document.image)
                .resizable()
                .scaledToFill()
                .frame(width: 60, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 8))

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(document.documentType.title)
                    .font(.headline)

                if document.totalPages > 1 {
                    Text("Page \(document.pageNumber) of \(document.totalPages)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(document.timestamp.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
    }
}
