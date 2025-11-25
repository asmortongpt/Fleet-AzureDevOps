//
//  DocumentViewerView.swift
//  Fleet Manager
//
//  Advanced Document Viewer with PDF support, image viewing, annotations, and markup tools
//

import SwiftUI
import PDFKit
import PhotosUI

struct DocumentViewerView: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showingShareSheet = false
    @State private var showingVersionHistory = false
    @State private var showingAnnotations = false
    @State private var showingOCRResults = false
    @State private var currentPage = 1
    @State private var totalPages = 1
    @State private var zoomScale: CGFloat = 1.0
    @State private var markupMode: MarkupMode?

    var body: some View {
        VStack(spacing: 0) {
            // Document viewer
            documentViewerContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Markup toolbar
            if markupMode != nil {
                markupToolbar
            }

            // Bottom toolbar
            bottomToolbar
        }
        .navigationTitle(document.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        Task {
                            await viewModel.toggleFavorite(document)
                        }
                    } label: {
                        Label(
                            document.isFavorite ? "Remove from Favorites" : "Add to Favorites",
                            systemImage: document.isFavorite ? "star.fill" : "star"
                        )
                    }

                    Divider()

                    Button {
                        showingVersionHistory = true
                    } label: {
                        Label("Version History", systemImage: "clock.arrow.circlepath")
                    }

                    Button {
                        showingOCRResults = true
                    } label: {
                        Label("Extract Text (OCR)", systemImage: "text.viewfinder")
                    }

                    Button {
                        showingAnnotations = true
                    } label: {
                        Label("Annotations", systemImage: "note.text")
                    }

                    Divider()

                    Button {
                        showingShareSheet = true
                    } label: {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }

                    Button {
                        Task {
                            await viewModel.downloadDocument(document)
                        }
                    } label: {
                        Label("Download", systemImage: "arrow.down.circle")
                    }

                    Button {
                        printDocument()
                    } label: {
                        Label("Print", systemImage: "printer")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingVersionHistory) {
            VersionHistoryView(document: document, viewModel: viewModel)
        }
        .sheet(isPresented: $showingAnnotations) {
            AnnotationsView(document: document, viewModel: viewModel)
        }
        .sheet(isPresented: $showingOCRResults) {
            OCRResultsView(document: document, viewModel: viewModel)
        }
        .onAppear {
            Task {
                await viewModel.recordDocumentAccess(document, action: .viewed)
                await viewModel.loadVersionHistory(for: document)
                await viewModel.loadAnnotations(for: document)
            }
        }
    }

    // MARK: - Document Viewer Content
    @ViewBuilder
    private var documentViewerContent: View {
        switch document.mimeType {
        case "application/pdf":
            pdfViewer
        case let mime where mime.hasPrefix("image/"):
            imageViewer
        default:
            genericDocumentView
        }
    }

    // MARK: - PDF Viewer
    private var pdfViewer: View {
        VStack {
            ScrollView([.horizontal, .vertical]) {
                VStack {
                    // PDF preview placeholder
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .fill(ModernTheme.Colors.secondaryBackground)
                        .frame(width: 600 * zoomScale, height: 800 * zoomScale)
                        .overlay(
                            VStack(spacing: ModernTheme.Spacing.lg) {
                                Image(systemName: "doc.text.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(document.type.color)

                                Text(document.name)
                                    .font(ModernTheme.Typography.title3)
                                    .foregroundColor(ModernTheme.Colors.primaryText)

                                Text("PDF Viewer Placeholder")
                                    .font(ModernTheme.Typography.body)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)

                                Text("In production, PDFKit would render the actual PDF here")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 40)
                            }
                        )
                }
                .padding()
            }

            // Page navigation
            HStack {
                Button {
                    if currentPage > 1 {
                        currentPage -= 1
                    }
                } label: {
                    Image(systemName: "chevron.left")
                }
                .disabled(currentPage <= 1)

                Text("Page \(currentPage) of \(totalPages)")
                    .font(ModernTheme.Typography.caption1)
                    .frame(minWidth: 100)

                Button {
                    if currentPage < totalPages {
                        currentPage += 1
                    }
                } label: {
                    Image(systemName: "chevron.right")
                }
                .disabled(currentPage >= totalPages)

                Divider()
                    .frame(height: 20)

                Button {
                    zoomScale = max(0.5, zoomScale - 0.25)
                } label: {
                    Image(systemName: "minus.magnifyingglass")
                }

                Text("\(Int(zoomScale * 100))%")
                    .font(ModernTheme.Typography.caption1)
                    .frame(minWidth: 50)

                Button {
                    zoomScale = min(3.0, zoomScale + 0.25)
                } label: {
                    Image(systemName: "plus.magnifyingglass")
                }
            }
            .padding()
            .background(ModernTheme.Colors.secondaryBackground)
        }
    }

    // MARK: - Image Viewer
    private var imageViewer: View {
        ScrollView([.horizontal, .vertical]) {
            VStack {
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.secondaryBackground)
                    .frame(width: 400 * zoomScale, height: 600 * zoomScale)
                    .overlay(
                        VStack(spacing: ModernTheme.Spacing.lg) {
                            Image(systemName: "photo.fill")
                                .font(.system(size: 60))
                                .foregroundColor(document.type.color)

                            Text("Image Viewer Placeholder")
                                .font(ModernTheme.Typography.body)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            Text("In production, the actual image would be displayed here with pinch-to-zoom support")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.tertiaryText)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 40)
                        }
                    )
            }
            .padding()
        }
    }

    // MARK: - Generic Document View
    private var genericDocumentView: View {
        VStack(spacing: ModernTheme.Spacing.xl) {
            ZStack {
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.lg)
                    .fill(document.type.color.opacity(0.1))
                    .frame(width: 200, height: 200)

                VStack(spacing: ModernTheme.Spacing.md) {
                    Image(systemName: document.type.icon)
                        .font(.system(size: 80))
                        .foregroundColor(document.type.color)

                    Text(document.fileExtension)
                        .font(ModernTheme.Typography.title1)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                }
            }

            VStack(spacing: ModernTheme.Spacing.md) {
                Text(document.name)
                    .font(ModernTheme.Typography.title2)
                    .multilineTextAlignment(.center)

                Text(document.formattedFileSize)
                    .font(ModernTheme.Typography.body)
                    .foregroundColor(ModernTheme.Colors.secondaryText)

                if let description = document.description {
                    Text(description)
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal)

            VStack(spacing: ModernTheme.Spacing.sm) {
                DetailRow(label: "Type", value: document.type.rawValue)
                DetailRow(label: "Category", value: document.category.rawValue)
                DetailRow(label: "Uploaded", value: document.formattedUploadDate)
                DetailRow(label: "Uploaded By", value: document.uploadedBy)

                if let expiration = document.formattedExpirationDate {
                    DetailRow(label: "Expires", value: expiration, valueColor: document.statusColor)
                }

                DetailRow(label: "Related To", value: document.relatedEntityName)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(ModernTheme.Colors.secondaryBackground)
            )
            .padding(.horizontal)
        }
        .padding()
    }

    // MARK: - Markup Toolbar
    private var markupToolbar: View {
        HStack(spacing: ModernTheme.Spacing.lg) {
            Button {
                markupMode = .highlight
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "highlighter")
                    Text("Highlight")
                        .font(ModernTheme.Typography.caption2)
                }
            }
            .foregroundColor(markupMode == .highlight ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)

            Button {
                markupMode = .draw
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "pencil.tip")
                    Text("Draw")
                        .font(ModernTheme.Typography.caption2)
                }
            }
            .foregroundColor(markupMode == .draw ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)

            Button {
                markupMode = .text
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "textformat")
                    Text("Text")
                        .font(ModernTheme.Typography.caption2)
                }
            }
            .foregroundColor(markupMode == .text ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)

            Button {
                markupMode = .note
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "note.text")
                    Text("Note")
                        .font(ModernTheme.Typography.caption2)
                }
            }
            .foregroundColor(markupMode == .note ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)

            Spacer()

            Button {
                markupMode = nil
            } label: {
                Text("Done")
                    .font(ModernTheme.Typography.bodyBold)
            }
            .foregroundColor(ModernTheme.Colors.primary)
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
    }

    // MARK: - Bottom Toolbar
    private var bottomToolbar: View {
        HStack(spacing: ModernTheme.Spacing.lg) {
            Button {
                showingShareSheet = true
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share")
                        .font(ModernTheme.Typography.caption2)
                }
            }

            Button {
                markupMode = markupMode == nil ? .highlight : nil
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "pencil.tip.crop.circle")
                    Text("Markup")
                        .font(ModernTheme.Typography.caption2)
                }
            }

            Button {
                Task {
                    await viewModel.downloadDocument(document)
                }
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "arrow.down.circle")
                    Text("Download")
                        .font(ModernTheme.Typography.caption2)
                }
            }

            Button {
                printDocument()
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: "printer")
                    Text("Print")
                        .font(ModernTheme.Typography.caption2)
                }
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
    }

    // MARK: - Helper Methods
    private func printDocument() {
        // In production, implement UIPrintInteractionController
        ModernTheme.Haptics.light()
    }
}

// MARK: - Supporting Views

enum MarkupMode {
    case highlight
    case draw
    case text
    case note
}

struct VersionHistoryView: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if let versions = viewModel.documentVersions[document.id] {
                    ForEach(versions) { version in
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                            HStack {
                                Text("Version \(version.versionNumber)")
                                    .font(ModernTheme.Typography.bodyBold)

                                if version.versionNumber == document.version {
                                    Text("(Current)")
                                        .font(ModernTheme.Typography.caption1)
                                        .foregroundColor(ModernTheme.Colors.success)
                                }

                                Spacer()

                                Text(version.formattedFileSize)
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            }

                            Text(version.formattedUploadDate)
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            Text("by \(version.uploadedBy)")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            if let description = version.changeDescription {
                                Text(description)
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.primaryText)
                                    .italic()
                            }
                        }
                        .padding(.vertical, ModernTheme.Spacing.xs)
                    }
                } else {
                    Text("Loading version history...")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .navigationTitle("Version History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.loadVersionHistory(for: document)
            }
        }
    }
}

struct AnnotationsView: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if let annotations = viewModel.annotations[document.id], !annotations.isEmpty {
                    ForEach(annotations) { annotation in
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
                            HStack {
                                Image(systemName: annotationIcon(annotation.type))
                                    .foregroundColor(annotationColor(annotation.type))

                                Text(annotation.type.rawValue)
                                    .font(ModernTheme.Typography.bodyBold)

                                Spacer()

                                Text("Page \(annotation.pageNumber)")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            }

                            if let content = annotation.content {
                                Text(content)
                                    .font(ModernTheme.Typography.body)
                            }

                            Text("by \(annotation.createdBy)")
                                .font(ModernTheme.Typography.caption1)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                        }
                        .padding(.vertical, ModernTheme.Spacing.xs)
                    }
                } else {
                    ContentUnavailableView(
                        "No Annotations",
                        systemImage: "note.text",
                        description: Text("Add annotations using the markup tools")
                    )
                }
            }
            .navigationTitle("Annotations")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.loadAnnotations(for: document)
            }
        }
    }

    private func annotationIcon(_ type: AnnotationType) -> String {
        switch type {
        case .highlight: return "highlighter"
        case .note: return "note.text"
        case .drawing: return "scribble"
        case .text: return "textformat"
        case .stamp: return "seal"
        }
    }

    private func annotationColor(_ type: AnnotationType) -> Color {
        switch type {
        case .highlight: return .yellow
        case .note: return .blue
        case .drawing: return .red
        case .text: return .green
        case .stamp: return .purple
        }
    }
}

struct OCRResultsView: View {
    let document: FleetDocument
    @ObservedObject var viewModel: DocumentsViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                if let ocrResult = viewModel.ocrResults[document.id] {
                    ScrollView {
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                            HStack {
                                Label("Confidence: \(ocrResult.formattedConfidence)", systemImage: "checkmark.seal.fill")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.success)

                                Spacer()

                                Label("Language: \(ocrResult.language.uppercased())", systemImage: "globe")
                                    .font(ModernTheme.Typography.caption1)
                                    .foregroundColor(ModernTheme.Colors.info)
                            }
                            .padding()
                            .background(ModernTheme.Colors.secondaryBackground)
                            .cornerRadius(ModernTheme.CornerRadius.md)

                            Text(ocrResult.extractedText)
                                .font(ModernTheme.Typography.body)
                                .textSelection(.enabled)
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(ModernTheme.Colors.background)
                                .cornerRadius(ModernTheme.CornerRadius.md)
                        }
                        .padding()
                    }
                } else if viewModel.loadingState.isLoading {
                    VStack(spacing: ModernTheme.Spacing.lg) {
                        ProgressView()
                            .scaleEffect(1.5)

                        Text("Extracting text from document...")
                            .font(ModernTheme.Typography.body)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Text("This may take a moment")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.tertiaryText)
                    }
                } else {
                    ContentUnavailableView(
                        "Text Extraction Available",
                        systemImage: "text.viewfinder",
                        description: Text("Extract text from this document using OCR")
                    )

                    Button {
                        Task {
                            await viewModel.performOCR(on: document)
                        }
                    } label: {
                        Text("Extract Text")
                    }
                    .primaryButton()
                    .padding(.horizontal, 40)
                }
            }
            .navigationTitle("Extracted Text")
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

// MARK: - Preview
#Preview {
    NavigationStack {
        DocumentViewerView(
            document: .sample,
            viewModel: DocumentsViewModel()
        )
    }
}
