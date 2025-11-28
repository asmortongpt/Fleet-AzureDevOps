Below is a Swift implementation of a `BackgroundAudioManager` class designed to handle continuous Push-to-Talk (PTT) operations while meeting the specified requirements. This implementation includes handling of the AVAudioSession, background task management, state preservation, and lifecycle management.

```swift
import Foundation
import AVFoundation
import UIKit

class BackgroundAudioManager: NSObject {
    static let shared = BackgroundAudioManager()
    
    private var isAudioSessionActive = false
    private var backgroundTaskIdentifier: UIBackgroundTaskIdentifier = .invalid
    private var idleTimer: Timer?

    override init() {
        super.init()
        configureAudioSession()
        setupNotifications()
    }
    
    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
            try audioSession.setActive(true)
            isAudioSessionActive = true
        } catch {
            print("Failed to configure and activate audio session: \(error)")
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleAudioSessionInterruption), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleAudioSessionRouteChange), name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(appDidEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }
    
    @objc private func handleAudioSessionInterruption(notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        
        if type == .began {
            // Handle interruption began
            print("Audio session was interrupted.")
        } else if type == .ended {
            // Handle interruption ended
            try? AVAudioSession.sharedInstance().setActive(true)
            print("Audio session interruption ended.")
        }
    }
    
    @objc private func handleAudioSessionRouteChange(notification: Notification) {
        guard let info = notification.userInfo,
              let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        if reason == .newDeviceAvailable || reason == .oldDeviceUnavailable {
            print("Audio route changed, new device available or old device unavailable.")
        }
    }
    
    @objc private func appDidEnterBackground() {
        backgroundTaskIdentifier = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }
        
        idleTimer = Timer.scheduledTimer(timeInterval: 1800, target: self, selector: #selector(idleTimerExceeded), userInfo: nil, repeats: false)
    }
    
    @objc private func appWillEnterForeground() {
        endBackgroundTask()
        idleTimer?.invalidate()
    }
    
    @objc private func idleTimerExceeded() {
        print("Idle time exceeded. Suspending non-critical tasks.")
        // Suspend non-critical tasks here
    }
    
    private func endBackgroundTask() {
        if backgroundTaskIdentifier != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskIdentifier)
            backgroundTaskIdentifier = .invalid
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// Usage
let audioManager = BackgroundAudioManager.shared
```

### Explanation:
1. **Audio Session Configuration**: The audio session is configured for both playback and recording with Bluetooth options and the ability to mix with other audio sources.
2. **Notifications**: Observers are added for handling audio session interruptions and route changes, as well as app lifecycle events.
3. **Background Task Management**: A background task is started when the app enters the background, allowing the app to keep running in the background. An idle timer is also set to manage resource usage.
4. **Lifecycle Management**: The app responds to foreground and background transitions, managing resources appropriately.

### Additional Considerations:
- **WebRTC Integration**: This example does not include the WebRTC setup. You would typically integrate with a WebRTC library (like Google's WebRTC project) to manage the actual PTT audio streams.
- **State Preservation and Restoration**: Implement state saving and restoration in the appropriate lifecycle methods or using state preservation APIs provided by iOS.
- **Battery Optimization**: Further optimizations might include adjusting the WebRTC configuration or reducing the frequency of network requests based on app usage patterns.

This code provides a robust starting point for managing a continuous PTT operation in a backgrounded iOS app.