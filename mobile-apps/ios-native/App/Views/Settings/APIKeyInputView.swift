//
//  APIKeyInputView.swift
//  Fleet Manager - API Key Input
//
//  Secure input interface for external map provider API keys
//  with validation and obfuscation
//

import SwiftUI

// MARK: - API Key Input View

struct APIKeyInputView: View {
    let provider: MapProvider
    let onSave: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var apiKey: String = ""
    @State private var showAPIKey: Bool = false
    @State private var isValidating: Bool = false
    @State private var validationError: String?
    @FocusState private var isKeyFieldFocused: Bool

    var body: some View {
        NavigationView {
            Form {
                // Provider Info Section
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: provider.icon)
                            .font(.title)
                            .foregroundColor(.blue)
                            .frame(width: 44, height: 44)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(provider.displayName)
                                .font(.headline)

                            Text("API Key Required")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                } footer: {
                    Text(provider.description)
                }

                // API Key Input Section
                Section {
                    HStack {
                        if showAPIKey {
                            TextField("Enter API Key", text: $apiKey)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .focused($isKeyFieldFocused)
                                .font(.system(.body, design: .monospaced))
                        } else {
                            SecureField("Enter API Key", text: $apiKey)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .focused($isKeyFieldFocused)
                                .font(.system(.body, design: .monospaced))
                        }

                        Button {
                            showAPIKey.toggle()
                        } label: {
                            Image(systemName: showAPIKey ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(.secondary)
                        }
                    }

                    if !apiKey.isEmpty {
                        HStack {
                            Text("Length:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("\(apiKey.count) characters")
                                .font(.caption)
                                .foregroundColor(.primary)
                            Spacer()
                            if isValidFormat {
                                Label("Valid format", systemImage: "checkmark.circle.fill")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            } else {
                                Label("Invalid format", systemImage: "exclamationmark.triangle.fill")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                } header: {
                    Text("API Key")
                } footer: {
                    if let error = validationError {
                        Text(error)
                            .foregroundColor(.red)
                    } else {
                        Text(getFormatHint())
                    }
                }

                // Instructions Section
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        InstructionRow(
                            number: 1,
                            title: "Get your API key",
                            description: "Visit the \(provider.displayName) developer console"
                        )

                        if let url = provider.officialURL {
                            Link(destination: url) {
                                HStack {
                                    Text("Open Developer Console")
                                        .font(.subheadline)
                                    Spacer()
                                    Image(systemName: "arrow.up.right.square")
                                }
                                .foregroundColor(.blue)
                            }
                        }

                        Divider()

                        InstructionRow(
                            number: 2,
                            title: "Copy your key",
                            description: "Create a new API key or copy an existing one"
                        )

                        Divider()

                        InstructionRow(
                            number: 3,
                            title: "Paste and save",
                            description: "Enter the key above and tap Save"
                        )
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("How to Get an API Key")
                }

                // Security Notice Section
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "lock.shield.fill")
                            .font(.title2)
                            .foregroundColor(.green)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Secure Storage")
                                .font(.subheadline)
                                .fontWeight(.semibold)

                            Text("Your API key will be encrypted and stored securely in the iOS Keychain")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Example Section
                if !getExampleKey().isEmpty {
                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Example Format:")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Text(getExampleKey())
                                .font(.system(.caption, design: .monospaced))
                                .foregroundColor(.secondary)
                                .padding(8)
                                .background(Color.secondary.opacity(0.1))
                                .cornerRadius(6)
                        }
                    } header: {
                        Text("Example")
                    }
                }
            }
            .navigationTitle("API Key Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveAPIKey()
                    }
                    .disabled(!canSave)
                    .fontWeight(.semibold)
                }
            }
            .overlay {
                if isValidating {
                    ProgressView("Validating...")
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(10)
                        .shadow(radius: 10)
                }
            }
            .onAppear {
                isKeyFieldFocused = true
            }
        }
    }

    // MARK: - Computed Properties

    private var isValidFormat: Bool {
        switch provider {
        case .google:
            return apiKey.hasPrefix("AIza") && apiKey.count == 39
        case .mapbox:
            return (apiKey.hasPrefix("pk.") || apiKey.hasPrefix("sk.")) && apiKey.count > 80
        case .apple, .openstreetmap:
            return true
        }
    }

    private var canSave: Bool {
        !apiKey.isEmpty && isValidFormat && !isValidating
    }

    // MARK: - Methods

    private func saveAPIKey() {
        validationError = nil
        isValidating = true

        // Simulate validation delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isValidating = false

            if isValidFormat {
                onSave(apiKey)
                dismiss()
            } else {
                validationError = "Invalid API key format for \(provider.displayName)"
            }
        }
    }

    private func getFormatHint() -> String {
        switch provider {
        case .google:
            return "Google API keys start with 'AIza' and are 39 characters long"
        case .mapbox:
            return "Mapbox tokens start with 'pk.' (public) or 'sk.' (secret) and are 80+ characters"
        case .apple, .openstreetmap:
            return "No API key required"
        }
    }

    private func getExampleKey() -> String {
        switch provider {
        case .google:
            return "AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        case .mapbox:
            return "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja..."
        case .apple, .openstreetmap:
            return ""
        }
    }
}

// MARK: - Instruction Row

struct InstructionRow: View {
    let number: Int
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 28, height: 28)

                Text("\(number)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct APIKeyInputView_Previews: PreviewProvider {
    static var previews: some View {
        APIKeyInputView(provider: .google) { key in
            print("Saved key: \(key)")
        }

        APIKeyInputView(provider: .mapbox) { key in
            print("Saved key: \(key)")
        }
    }
}
#endif
