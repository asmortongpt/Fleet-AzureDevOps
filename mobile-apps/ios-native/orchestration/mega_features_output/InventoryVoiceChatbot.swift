Creating a comprehensive voice chatbot for hands-free inventory management involves integrating several components such as speech recognition, natural language processing (NLP), text-to-speech (TTS), and a user interface. Below, I will provide a structured Swift code outline that integrates these components using Apple's frameworks like `Speech` for speech recognition and `AVFoundation` for text-to-speech functionalities.

### Step 1: Setup the Speech Recognition

First, import the necessary frameworks and configure the speech recognizer.

```swift
import Speech
import AVFoundation

class InventoryManagerVC: UIViewController, SFSpeechRecognizerDelegate {
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))!
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    override func viewDidLoad() {
        super.viewDidLoad()
        speechRecognizer.delegate = self
        requestSpeechAuthorization()
    }

    private func requestSpeechAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                if authStatus != .authorized {
                    print("Speech recognition authorization denied")
                }
            }
        }
    }

    private func startListening() {
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }

        let audioSession = AVAudioSession.sharedInstance()
        try! audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try! audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

        guard let inputNode = audioEngine.inputNode else { fatalError("Audio engine has no input node") }
        guard let recognitionRequest = recognitionRequest else { fatalError("Unable to create a SFSpeechAudioBufferRecognitionRequest object") }

        recognitionRequest.shouldReportPartialResults = true

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
            var isFinal = false

            if let result = result {
                self.parse(result.bestTranscription.formattedString)
                isFinal = result.isFinal
            }

            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)

                self.recognitionRequest = nil
                self.recognitionTask = nil
            }
        }

        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try! audioEngine.start()
    }
}
```

### Step 2: Natural Language Processing

For NLP, you can use `NSLinguisticTagger` to parse the speech text or integrate a more robust NLP model using CoreML.

```swift
func parse(_ speechText: String) {
    let tagger = NSLinguisticTagger(tagSchemes: [.lexicalClass, .nameType, .lemma], options: 0)
    tagger.string = speechText
    let range = NSRange(location: 0, length: speechText.utf16.count)
    tagger.enumerateTags(in: range, scheme: .nameType, options: [.joinNames]) { tag, tokenRange, _ in
        if let tag = tag, tag == .personalName {
            let name = (speechText as NSString).substring(with: tokenRange)
            print("Found name: \(name)")
        }
    }
}
```

### Step 3: Text-to-Speech

Use `AVSpeechSynthesizer` to convert text responses into speech.

```swift
private let speechSynthesizer = AVSpeechSynthesizer()

func speak(_ text: String) {
    let utterance = AVSpeechUtterance(string: text)
    utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    utterance.rate = 0.5
    speechSynthesizer.speak(utterance)
}
```

### Step 4: UI Components

You can add UI components like buttons for manual control, labels for displaying transcriptions, and visual feedback for speech activity.

```swift
@IBOutlet weak var transcriptionLabel: UILabel!
@IBOutlet weak var speakButton: UIButton!

@IBAction func didTapSpeakButton(_ sender: Any) {
    if audioEngine.isRunning {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        speakButton.setTitle("Start Speaking", for: .normal)
    } else {
        startListening()
        speakButton.setTitle("Stop Speaking", for: .normal)
    }
}
```

### Conclusion

This code provides a basic structure for integrating speech-to-text, text-to-speech, and simple NLP in an iOS app for inventory management. You would need to expand the NLP capabilities and refine the UI based on specific requirements and user feedback. Additionally, integrating a database for inventory management and handling multi-turn conversations would require more complex state management and possibly server-side logic.