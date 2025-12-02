Given the complexity and breadth of the features you've requested, I'll provide an outline and some key code snippets to get you started on building a comprehensive Vehicle Inventory Management system in Swift. This will include integration with Vision, Speech, CoreData, and SwiftUI.

### 1. Project Setup
First, ensure your project in Xcode is set up with the necessary capabilities:
- Camera usage (for barcode and QR code scanning)
- Speech recognition
- CoreData for local storage

Add these capabilities in your `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera for scanning barcodes and QR codes.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>We need access to speech recognition for voice commands.</string>
```

### 2. CoreData Model
Set up CoreData entities such as `Item` with attributes like `name`, `quantity`, `location`, `sku`, `unit`, `category`, `photo`, and `notes`.

### 3. Vision Framework for Scanning
Implement barcode and QR code scanning using the Vision framework.

```swift
import AVFoundation
import Vision

class BarcodeScannerViewModel: ObservableObject {
    var session = AVCaptureSession()
    private let videoDataOutput = AVCaptureVideoDataOutput()
    private var requests = [VNRequest]()

    init() {
        setupCamera()
    }

    private func setupCamera() {
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice),
              session.canAddInput(videoDeviceInput) else {
            return
        }
        session.addInput(videoDeviceInput)
        setupVisionRequest()
        videoDataOutput.setSampleBufferDelegate(self, queue: DispatchQueue(label: "VideoDataOutputQueue"))
        if session.canAddOutput(videoDataOutput) {
            session.addOutput(videoDataOutput)
        }
        session.startRunning()
    }

    private func setupVisionRequest() {
        let barcodeRequest = VNDetectBarcodesRequest { [weak self] request, error in
            guard let results = request.results else { return }
            self?.processBarcodes(results)
        }
        barcodeRequest.symbologies = [.QR, .code128, .UPCE, .EAN8, .EAN13, .code39]
        requests = [barcodeRequest]
    }

    private func processBarcodes(_ results: [Any]) {
        for result in results {
            guard let barcode = result as? VNBarcodeObservation else { continue }
            DispatchQueue.main.async {
                // Handle the detected barcode
                print("Barcode detected: \(barcode.payloadStringValue ?? "")")
            }
        }
    }
}

extension BarcodeScannerViewModel: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let handler = VNImageRequestHandler(cmSampleBuffer: sampleBuffer, orientation: .up, options: [:])
        try? handler.perform(requests)
    }
}
```

### 4. SwiftUI Views
Create SwiftUI views for manual entry, scanning, and inventory list.

```swift
import SwiftUI

struct InventoryListView: View {
    @FetchRequest(
        entity: Item.entity(),
        sortDescriptors: [NSSortDescriptor(keyPath: \Item.name, ascending: true)]
    ) var items: FetchedResults<Item>

    var body: some View {
        List(items, id: \.self) { item in
            Text(item.name ?? "Unknown Item")
        }
    }
}

struct AddItemView: View {
    @State private var name: String = ""
    @State private var quantity: Int = 1
    @State private var location: String = ""

    var body: some View {
        Form {
            TextField("Item Name", text: $name)
            Stepper("Quantity: \(quantity)", value: $quantity, in: 1...100)
            TextField("Location", text: $location)
            Button("Add Item") {
                // Add item to CoreData
            }
        }
    }
}
```

### 5. Speech Recognition
Use the Speech framework to implement voice commands.

```swift
import Speech

class SpeechRecognizer: ObservableObject {
    private let speechRecognizer = SFSpeechRecognizer()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    func startListening() {
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        recognitionRequest.shouldReportPartialResults = true

        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest, resultHandler: { [weak self] result, error in
            guard let result = result, error == nil else { return }
            if result.isFinal {
                self?.processResult(result.bestTranscription.formattedString)
            }
        })
    }

    private func processResult(_ speechText: String) {
        // Process and extract information from the recognized text
        print("Recognized text: \(speechText)")
    }
}
```

### Conclusion
This outline and the provided code snippets should give you a solid foundation to build a comprehensive Vehicle Inventory Management system. You'll need to expand on these snippets, handle errors, and implement additional features like photo capture, offline support, and syncing with a backend.