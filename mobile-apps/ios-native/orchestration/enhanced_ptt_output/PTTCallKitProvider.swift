To achieve the requirements outlined for the Push-to-Talk (PTT) integration using CallKit and proper audio session management in iOS, we'll need to set up a few components:

1. **CXProvider** and **CXProviderDelegate** for handling CallKit interactions.
2. **Audio Session Management** for handling audio focus, interruptions, and Bluetooth connectivity.
3. **Call Management** to handle incoming, ongoing, and ended PTT "calls".

Here's a complete Swift implementation:

### Step 1: Setup CXProvider

```swift
import UIKit
import CallKit
import AVFoundation

class PTTCallManager: NSObject, CXProviderDelegate {
    private let provider: CXProvider
    private var currentCallUUID: UUID?
    private var isPTTActive = false

    override init() {
        let configuration = CXProviderConfiguration(localizedName: "Fleet PTT")
        configuration.supportsVideo = false
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [.generic]
        configuration.ringtoneSound = "ptt_ringtone.caf"
        configuration.iconTemplateImageData = UIImage(named: "ptt_icon")?.pngData()

        provider = CXProvider(configuration: configuration)
        super.init()
        provider.setDelegate(self, queue: nil)
    }

    func startCall(with channelName: String) {
        let uuid = UUID()
        let handle = CXHandle(type: .generic, value: channelName)
        let startCallAction = CXStartCallAction(call: uuid, handle: handle)
        let transaction = CXTransaction(action: startCallAction)

        provider.request(transaction) { error in
            if let error = error {
                print("Start Call Request Error: \(error.localizedDescription)")
            } else {
                self.currentCallUUID = uuid
                self.isPTTActive = true
                self.configureAudioSession()
            }
        }
    }

    func endCall() {
        guard let uuid = currentCallUUID else { return }
        let endCallAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endCallAction)

        provider.request(transaction) { error in
            if let error = error {
                print("End Call Request Error: \(error.localizedDescription)")
            } else {
                self.isPTTActive = false
                self.deactivateAudioSession()
            }
        }
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        configureAudioSession()
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        deactivateAudioSession()
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        if action.isOnHold {
            deactivateAudioSession()
        } else {
            configureAudioSession()
        }
        action.fulfill()
    }

    func providerDidReset(_ provider: CXProvider) {
        deactivateAudioSession()
    }

    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .duckOthers])
            try audioSession.setActive(true)
        } catch {
            print("Failed to configure audio session: \(error.localizedDescription)")
        }
    }

    private func deactivateAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setActive(false)
        } catch {
            print("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }
}
```

### Step 2: Handle Lifecycle and System Events

Ensure that your app delegate or relevant controllers manage the lifecycle of `PTTCallManager`, starting it when the app launches and handling any system interruptions or state restoration.

### Step 3: Integrate with the UI

Connect this backend logic with your UI, ensuring that actions on the lock screen (via CallKit UI) and in-app buttons trigger the appropriate methods in `PTTCallManager`. Use notifications or delegate patterns to update the UI based on call state changes.

### Conclusion

This implementation sets up the basic structure for handling PTT calls using CallKit, including audio session management for proper behavior during calls and system events. You'll need to expand upon this by integrating it tightly with your app's existing PTT logic and UI, and handling edge cases and errors more robustly in a production environment.