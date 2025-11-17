//
//  ChecklistItemView.swift
//  Fleet Manager
//
//  Dynamic view for checklist items based on type
//

import SwiftUI
import CoreLocation

struct ChecklistItemView: View {
    let item: ChecklistItemInstance
    let template: ChecklistItemTemplate?
    @Binding var response: ChecklistResponse?

    @State private var boolValue: Bool = false
    @State private var textValue: String = ""
    @State private var numberValue: String = ""
    @State private var selectedChoice: String = ""
    @State private var selectedMultipleChoices: Set<String> = []
    @State private var showPhotoCapture: Bool = false
    @State private var showSignaturePad: Bool = false
    @State private var showBarcodeScanner: Bool = false
    @State private var showDatePicker: Bool = false
    @State private var selectedDate: Date = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Item header
            itemHeader

            // Dynamic input based on type
            itemInput

            // Validation message
            if let template = template, template.isRequired && response == nil {
                requiredIndicator
            }

            // Description
            if let description = template?.description {
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        .onAppear {
            loadExistingResponse()
        }
    }

    private var itemHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.text)
                    .font(.headline)

                HStack(spacing: 4) {
                    typeIndicator

                    if template?.isRequired == true {
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
    }

    private var typeIndicator: some View {
        Text(item.type.rawValue)
            .font(.caption)
            .foregroundColor(.secondary)
    }

    @ViewBuilder
    private var itemInput: some View {
        switch item.type {
        case .checkbox:
            checkboxInput

        case .text:
            textInput

        case .number, .odometer, .fuelGallons:
            numberInput

        case .choice:
            choiceInput

        case .multiChoice:
            multiChoiceInput

        case .signature:
            signatureInput

        case .photo:
            photoInput

        case .location:
            locationInput

        case .dateTime:
            dateTimeInput

        case .barcode:
            barcodeInput
        }
    }

    private var checkboxInput: some View {
        Toggle(isOn: $boolValue) {
            Text("Confirmed")
                .font(.subheadline)
        }
        .onChange(of: boolValue) { newValue in
            response = .boolean(newValue)
        }
    }

    private var textInput: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextEditor(text: $textValue)
                .frame(minHeight: 100)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                .onChange(of: textValue) { newValue in
                    response = .text(newValue)
                }

            if let rules = template?.validationRules {
                HStack {
                    if let minLength = rules.minLength, let maxLength = rules.maxLength {
                        Text("\(textValue.count) / \(maxLength) characters")
                            .font(.caption)
                            .foregroundColor(textValue.count >= minLength ? .secondary : .red)
                    }
                }
            }
        }
    }

    private var numberInput: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TextField(placeholderText, text: $numberValue)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .onChange(of: numberValue) { newValue in
                        if let value = Double(newValue) {
                            response = .number(value)
                        }
                    }

                if item.type == .fuelGallons {
                    Text("gal")
                        .foregroundColor(.secondary)
                }
            }

            if let rules = template?.validationRules {
                if let min = rules.minValue, let max = rules.maxValue {
                    Text("Range: \(String(format: "%.1f", min)) - \(String(format: "%.1f", max))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    private var choiceInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(template?.options ?? [], id: \.self) { option in
                Button(action: {
                    selectedChoice = option
                    response = .singleChoice(option)
                }) {
                    HStack {
                        Image(systemName: selectedChoice == option ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(selectedChoice == option ? .blue : .gray)

                        Text(option)
                            .foregroundColor(.primary)

                        Spacer()
                    }
                    .padding()
                    .background(selectedChoice == option ? Color.blue.opacity(0.1) : Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
        }
    }

    private var multiChoiceInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(template?.options ?? [], id: \.self) { option in
                Button(action: {
                    if selectedMultipleChoices.contains(option) {
                        selectedMultipleChoices.remove(option)
                    } else {
                        selectedMultipleChoices.insert(option)
                    }
                    response = .multipleChoice(Array(selectedMultipleChoices))
                }) {
                    HStack {
                        Image(systemName: selectedMultipleChoices.contains(option) ? "checkmark.square.fill" : "square")
                            .foregroundColor(selectedMultipleChoices.contains(option) ? .blue : .gray)

                        Text(option)
                            .foregroundColor(.primary)

                        Spacer()
                    }
                    .padding()
                    .background(selectedMultipleChoices.contains(option) ? Color.blue.opacity(0.1) : Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
        }
    }

    private var signatureInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .signature(let base64) = response {
                if let imageData = Data(base64Encoded: base64),
                   let uiImage = UIImage(data: imageData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 150)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }
            }

            Button(action: {
                showSignaturePad = true
            }) {
                HStack {
                    Image(systemName: "signature")
                    Text(response == nil ? "Add Signature" : "Change Signature")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
        .sheet(isPresented: $showSignaturePad) {
            SignaturePadView { data in
                let base64 = data.base64EncodedString()
                response = .signature(base64)
            }
        }
    }

    private var photoInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .photo(let urlString) = response {
                // Show captured photo
                AsyncImage(url: URL(string: urlString)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                        .cornerRadius(8)
                } placeholder: {
                    Rectangle()
                        .fill(Color(.systemGray6))
                        .frame(height: 200)
                        .cornerRadius(8)
                        .overlay(
                            ProgressView()
                        )
                }
            }

            Button(action: {
                showPhotoCapture = true
            }) {
                HStack {
                    Image(systemName: "camera")
                    Text(response == nil ? "Take Photo" : "Retake Photo")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
        .sheet(isPresented: $showPhotoCapture) {
            // TODO: Implement camera capture
            Text("Camera View")
        }
    }

    private var locationInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .locationData(let coordinate) = response {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Latitude: \(coordinate.latitude, specifier: "%.6f")")
                    Text("Longitude: \(coordinate.longitude, specifier: "%.6f")")
                }
                .font(.system(.body, design: .monospaced))
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }

            Button(action: {
                captureLocation()
            }) {
                HStack {
                    Image(systemName: "location.fill")
                    Text("Capture Current Location")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
    }

    private var dateTimeInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            DatePicker(
                "Select Date & Time",
                selection: $selectedDate,
                displayedComponents: [.date, .hourAndMinute]
            )
            .onChange(of: selectedDate) { newValue in
                response = .dateTime(newValue)
            }
        }
    }

    private var barcodeInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case .barcode(let code) = response {
                Text("Scanned: \(code)")
                    .font(.system(.body, design: .monospaced))
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }

            Button(action: {
                showBarcodeScanner = true
            }) {
                HStack {
                    Image(systemName: "barcode.viewfinder")
                    Text(response == nil ? "Scan Barcode" : "Rescan Barcode")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
        }
        .sheet(isPresented: $showBarcodeScanner) {
            // TODO: Implement barcode scanner
            Text("Barcode Scanner")
        }
    }

    private var requiredIndicator: some View {
        HStack(spacing: 6) {
            Image(systemName: "exclamationmark.circle.fill")
            Text("This field is required")
        }
        .font(.caption)
        .foregroundColor(.orange)
    }

    private var placeholderText: String {
        switch item.type {
        case .odometer:
            return "Enter odometer reading"
        case .fuelGallons:
            return "Enter fuel amount"
        case .number:
            return "Enter number"
        default:
            return "Enter value"
        }
    }

    // MARK: - Helpers

    private func loadExistingResponse() {
        guard let response = response else { return }

        switch response {
        case .boolean(let value):
            boolValue = value
        case .text(let value):
            textValue = value
        case .number(let value):
            numberValue = String(value)
        case .singleChoice(let value):
            selectedChoice = value
        case .multipleChoice(let values):
            selectedMultipleChoices = Set(values)
        case .dateTime(let value):
            selectedDate = value
        case .signature, .photo, .locationData, .barcode:
            break
        }
    }

    private func captureLocation() {
        let locationManager = LocationManager.shared
        if let location = locationManager.location {
            let coordinate = Coordinate(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
            response = .locationData(coordinate)
        }
    }
}

// MARK: - Preview

#Preview {
    ScrollView {
        VStack(spacing: 16) {
            ChecklistItemView(
                item: ChecklistItemInstance(
                    id: "1",
                    templateItemId: "checkbox",
                    text: "Hard hat available and in good condition",
                    type: .checkbox,
                    response: nil,
                    completedAt: nil,
                    isRequired: true,
                    validationPassed: false
                ),
                template: nil,
                response: .constant(nil)
            )

            ChecklistItemView(
                item: ChecklistItemInstance(
                    id: "2",
                    templateItemId: "text",
                    text: "Describe any hazards",
                    type: .text,
                    response: nil,
                    completedAt: nil,
                    isRequired: true,
                    validationPassed: false
                ),
                template: ChecklistItemTemplate(
                    id: "text",
                    sequenceNumber: 1,
                    text: "Describe any hazards",
                    description: "Be specific",
                    type: .text,
                    isRequired: true,
                    options: nil,
                    validationRules: ValidationRules(
                        minValue: nil,
                        maxValue: nil,
                        minLength: 10,
                        maxLength: 500,
                        pattern: nil,
                        required: true
                    ),
                    dependencies: nil,
                    conditionalLogic: nil
                ),
                response: .constant(nil)
            )
        }
        .padding()
    }
}
