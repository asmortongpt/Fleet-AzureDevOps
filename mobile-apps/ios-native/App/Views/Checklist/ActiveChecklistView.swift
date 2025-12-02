//
//  ActiveChecklistView.swift
//  Fleet Manager
//
//  Step-by-step checklist completion view
//

import SwiftUI

struct ActiveChecklistView: View {
    @StateObject private var viewModel = ChecklistViewModel()
    @Environment(\.presentationMode) var presentationMode

    @State private var showCompletionSheet = false
    @State private var showSkipAlert = false
    @State private var completionNotes = ""
    @State private var showSignatureForCompletion = false
    @State private var completionSignature: Data?

    var body: some View {
        NavigationView {
            ZStack {
                if let checklist = viewModel.activeChecklist {
                    checklistContent(checklist)
                } else {
                    emptyState
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                toolbarContent
            }
            .sheet(isPresented: $showCompletionSheet) {
                completionSheet
            }
            .alert("Skip Checklist?", isPresented: $showSkipAlert) {
                TextField("Reason", text: $completionNotes)
                Button("Cancel", role: .cancel) {}
                Button("Skip", role: .destructive) {
                    Task {
                        await viewModel.skipChecklist(reason: completionNotes)
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }

    private func checklistContent(_ checklist: ChecklistInstance) -> some View {
        VStack(spacing: 0) {
            // Progress header
            progressHeader(checklist)

            // Main content
            ScrollView {
                VStack(spacing: 20) {
                    // Current item
                    if let item = viewModel.currentItem,
                       let template = getCurrentTemplate(checklist) {
                        currentItemCard(item, template: template)
                    }

                    // Item navigation
                    itemNavigationBar(checklist)

                    // All items overview
                    allItemsOverview(checklist)
                }
                .padding()
            }

            // Bottom actions
            bottomActionBar(checklist)
        }
    }

    private func progressHeader(_ checklist: ChecklistInstance) -> some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(checklist.templateName)
                        .font(.headline)

                    Text("\(viewModel.completedItemCount) of \(viewModel.totalItemCount) completed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Category badge
                categoryBadge(checklist.category)
            }

            // Progress bar
            ProgressView(value: viewModel.progressPercentage / 100.0)
                .tint(categoryColor(checklist.category))
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }

    private func currentItemCard(_ item: ChecklistItemInstance, template: ChecklistItemTemplate) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Question \(viewModel.currentItemIndex + 1) of \(viewModel.totalItemCount)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                if item.isRequired {
                    HStack(spacing: 4) {
                        Image(systemName: "asterisk.circle.fill")
                        Text("Required")
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
            }

            ChecklistItemView(
                item: item,
                template: template,
                response: Binding(
                    get: { item.response },
                    set: { newResponse in
                        if let response = newResponse {
                            Task {
                                await viewModel.updateItem(response: response)
                            }
                        }
                    }
                )
            )
        }
    }

    private func itemNavigationBar(_ checklist: ChecklistInstance) -> some View {
        HStack(spacing: 16) {
            Button(action: {
                viewModel.moveToPreviousItem()
            }) {
                HStack {
                    Image(systemName: "chevron.left")
                    Text("Previous")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.currentItemIndex > 0 ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .disabled(viewModel.currentItemIndex == 0)

            Button(action: {
                viewModel.moveToNextItem()
            }) {
                HStack {
                    Text("Next")
                    Image(systemName: "chevron.right")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.currentItemIndex < viewModel.totalItemCount - 1 ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .disabled(viewModel.currentItemIndex >= viewModel.totalItemCount - 1)
        }
    }

    private func allItemsOverview(_ checklist: ChecklistInstance) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("All Items")
                .font(.headline)

            ForEach(Array(checklist.items.enumerated()), id: \.element.id) { index, item in
                Button(action: {
                    viewModel.moveToItem(at: index)
                }) {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(item.response != nil ? Color.green : Color.gray.opacity(0.3))
                                .frame(width: 32, height: 32)

                            if item.response != nil {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.white)
                                    .font(.caption.bold())
                            } else {
                                Text("\(index + 1)")
                                    .foregroundColor(viewModel.currentItemIndex == index ? .white : .gray)
                                    .font(.caption.bold())
                            }
                        }
                        .overlay(
                            Circle()
                                .stroke(viewModel.currentItemIndex == index ? Color.blue : Color.clear, lineWidth: 2)
                        )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.text)
                                .font(.subheadline)
                                .foregroundColor(.primary)

                            HStack(spacing: 8) {
                                Text(item.type.rawValue)
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                if item.isRequired {
                                    Text("• Required")
                                        .font(.caption)
                                        .foregroundColor(.red)
                                }
                            }
                        }

                        Spacer()

                        if item.response != nil {
                            Image(systemName: item.validationPassed ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                .foregroundColor(item.validationPassed ? .green : .orange)
                        }
                    }
                    .padding()
                    .background(viewModel.currentItemIndex == index ? Color.blue.opacity(0.1) : Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
        }
    }

    private func bottomActionBar(_ checklist: ChecklistInstance) -> some View {
        VStack(spacing: 12) {
            Divider()

            HStack(spacing: 12) {
                // Save draft
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Save Draft")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(8)
                }

                // Complete
                Button(action: {
                    if viewModel.requiredItemsComplete {
                        showCompletionSheet = true
                    }
                }) {
                    Text("Complete")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(viewModel.requiredItemsComplete ? Color.green : Color.gray.opacity(0.3))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .disabled(!viewModel.requiredItemsComplete)
            }
            .padding(.horizontal)
        }
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 5, y: -2)
    }

    private var completionSheet: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Success icon
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)

                Text("Complete Checklist")
                    .font(.title2)
                    .fontWeight(.bold)

                // Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Additional Notes (Optional)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    TextEditor(text: $completionNotes)
                        .frame(height: 100)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Signature
                VStack(alignment: .leading, spacing: 8) {
                    Text("Signature (Optional)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    if let signatureData = completionSignature,
                       let uiImage = UIImage(data: signatureData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .frame(height: 100)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }

                    Button(action: {
                        showSignatureForCompletion = true
                    }) {
                        HStack {
                            Image(systemName: "signature")
                            Text(completionSignature == nil ? "Add Signature" : "Change Signature")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                }

                Spacer()

                // Submit
                Button(action: {
                    Task {
                        await viewModel.completeChecklist(
                            signature: completionSignature,
                            notes: completionNotes.isEmpty ? nil : completionNotes
                        )
                        showCompletionSheet = false
                        presentationMode.wrappedValue.dismiss()
                    }
                }) {
                    Text("Submit Checklist")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showCompletionSheet = false
                    }
                }
            }
        }
        .sheet(isPresented: $showSignatureForCompletion) {
            SignaturePadView { data in
                completionSignature = data
            }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .principal) {
            if let checklist = viewModel.activeChecklist {
                VStack(spacing: 2) {
                    Text(checklist.templateName)
                        .font(.headline)
                    Text("\(Int(viewModel.progressPercentage))% Complete")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }

        ToolbarItem(placement: .navigationBarTrailing) {
            Menu {
                Button(action: {
                    showSkipAlert = true
                }) {
                    Label("Skip Checklist", systemImage: "xmark")
                }

                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Label("Save Draft", systemImage: "square.and.arrow.down")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "checklist")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Active Checklist")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start a checklist to continue")
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Helpers

    private func getCurrentTemplate(_ checklist: ChecklistInstance) -> ChecklistItemTemplate? {
        guard let item = viewModel.currentItem else { return nil }
        let template = ChecklistService.shared.templates.first { $0.id == checklist.templateId }
        return template?.items.first { $0.id == item.templateItemId }
    }

    private func categoryBadge(_ category: ChecklistCategory) -> some View {
        HStack(spacing: 4) {
            Image(systemName: category.icon)
                .font(.caption)
            Text(category.rawValue)
                .font(.caption)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(categoryColor(category).opacity(0.2))
        .foregroundColor(categoryColor(category))
        .cornerRadius(12)
    }

    private func categoryColor(_ category: ChecklistCategory) -> Color {
        switch category {
        case .osha: return .red
        case .preTripInspection: return .blue
        case .postTripInspection: return .green
        case .siteArrival: return .purple
        case .siteDeparture: return .orange
        case .taskCompletion: return .teal
        case .resourceCheck: return .cyan
        case .mileageReport: return .indigo
        case .fuelReport: return .yellow
        case .deliveryConfirmation: return .mint
        case .pickupConfirmation: return .pink
        case .incidentReport: return .red
        case .maintenance: return .orange
        case .custom: return .gray
        }
    }
}

// MARK: - Preview

#Preview {
    ActiveChecklistView()
}
